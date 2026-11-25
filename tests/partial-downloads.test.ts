import {describe,expect,it} from 'vitest';
import {PartialDownloads,downloadOwnerTarget} from '../src/core/partial-downloads';
import {moduleOwner} from '../src/core/module-ownership';
import {READING_SOURCES} from '../src/core/reading-catalogue';
import type {ModuleStore} from '../src/core/module-installation';

function fixture(){
 const files=new Map<string,string>(),directories=new Set<string>();
 const store:ModuleStore={mkdir:async p=>{directories.add(p);},read:async p=>{if(!files.has(p))throw Error('Missing');return files.get(p)!;},write:async(p,v)=>{files.set(p,v);},directories:async()=>[...directories],rename:async()=>{throw Error('Must not promote bytes');},remove:async p=>{directories.delete(p);for(const key of files.keys())if(key.startsWith(p+'/'))files.delete(key);}};
 store.measure=async directory=>{const entries=[...files].filter(([path])=>path.startsWith(directory+'/'));return {bytes:entries.reduce((n,[,raw])=>n+new TextEncoder().encode(raw).length,0),files:entries.length,complete:true,onlyKnownFiles:entries.every(([path])=>/\/(content|manifest|owner)\.json$/.test(path))};};
 return {files,directories,store,cache:new PartialDownloads(store)};
}
describe('persistent partial publisher downloads',()=>{
 it('preserves unexpected files and unmeasured checkpoint folders during automatic cleanup',async()=>{
  const {cache,store,files,directories}=fixture(),source=READING_SOURCES[0];
  await cache.save(source,new Uint8Array([1,2,3]),'"v1"');const saved=(await cache.latest(source))!;
  files.set(saved.directory+'/keep.md','User-added data');await cache.clear(source);
  expect(files.get(saved.directory+'/keep.md')).toBe('User-added data');expect(directories.has(saved.directory)).toBe(true);
  files.delete(saved.directory+'/keep.md');delete store.measure;await cache.clear(source);
  expect(directories.has(saved.directory)).toBe(true);
 });
 it('retains only a verified latest checkpoint across restart and leaves unrelated owned stages alone',async()=>{
  const {store,cache,directories,files}=fixture(),source=READING_SOURCES[0];
  const other='.stage-'+crypto.randomUUID();directories.add(other);files.set(other+'/owner.json',moduleOwner('module','test-'+'a'.repeat(16),other));
  await cache.save(source,new Uint8Array([1,2,3]),'"v1"');
  const first=(await cache.latest(source))!;expect(first.bytes).toEqual(new Uint8Array([1,2,3]));
  await cache.save(source,new Uint8Array([1,2,3,4]),'"v1"');expect(directories.has(first.directory)).toBe(false);
  const restarted=new PartialDownloads(store);expect((await restarted.latest(source))?.bytes).toEqual(new Uint8Array([1,2,3,4]));
  await restarted.clear(source);expect([...directories]).toEqual([other]);expect(files.has(other+'/owner.json')).toBe(true);
 });
 it('ignores modified bytes, changed source pins and mismatched ownership without deleting that evidence',async()=>{
  const {store,cache,files,directories}=fixture(),source=READING_SOURCES[0];
  await cache.save(source,new Uint8Array([1,2,3]),'"v1"');const saved=(await cache.latest(source))!;
  expect(await cache.latest({...source,databaseSha256:'b'.repeat(64)})).toBeNull();
  expect(await cache.latest({...source,sha256:'b'.repeat(64)})).toBeNull();
  files.set(saved.directory+'/content.json',JSON.stringify({base64:btoa('\x04\x05\x06')}));
  expect(await new PartialDownloads(store).latest(source)).toBeNull();expect(directories.has(saved.directory)).toBe(true);
  files.set(saved.directory+'/owner.json',moduleOwner('download',downloadOwnerTarget(source),'.stage-'+crypto.randomUUID()));
  await cache.clear(source);expect(directories.has(saved.directory)).toBe(true);
 });
 it('does not replace the prior resumable prefix when writing its successor fails',async()=>{
  const {cache,store,files}=fixture(),source=READING_SOURCES[0];await cache.save(source,new Uint8Array([1,2,3]),'"v1"');
  const failing=new PartialDownloads({...store,write:async(path,value)=>{if(path.endsWith('/manifest.json'))throw Error('Disk full');files.set(path,value);}});
  await expect(failing.save(source,new Uint8Array([1,2,3,4]),'"v1"')).rejects.toThrow('Disk full');
  expect((await new PartialDownloads(store).latest(source))?.bytes).toEqual(new Uint8Array([1,2,3]));
 });
 it('does not claim weak/missing validators or complete bodies are resumable prefixes',async()=>{
  const {cache,directories}=fixture(),source={...READING_SOURCES[0],compressedBytes:3};
  for(const etag of ['','W/"v1"','"bad\nvalue"'])await cache.save(source,new Uint8Array([1]),etag);
  await cache.save(source,new Uint8Array([1,2,3]),'"v1"');expect(directories.size).toBe(0);
 });
});
