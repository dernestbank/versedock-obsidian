import {describe,it,expect} from 'vitest';
import {ReadingInstallService} from '../src/core/reading-install-service';
import {promoteReadingModule,type ModuleStore} from '../src/core/module-installation';
import type {ReadingModule} from '../src/core/reading-modules';
import {PartialDownloads} from '../src/core/partial-downloads';
import {READING_SOURCES} from '../src/core/reading-catalogue';

function store(){
 const files=new Map<string,string>(),trashed=new Map<string,Map<string,string>>();
 const disk:ModuleStore={mkdir:async()=>{},read:async path=>{if(!files.has(path))throw Error('missing');return files.get(path)!;},write:async(path,value)=>{files.set(path,value);},
  rename:async(from,to)=>{for(const [path,value]of [...files])if(path.startsWith(from+'/')){files.set(to+path.slice(from.length),value);files.delete(path);}},
  remove:async directory=>{for(const path of files.keys())if(path.startsWith(directory+'/'))files.delete(path);},
  directories:async()=>[...new Set([...files.keys()].map(path=>path.split('/')[0]))],
  measure:async directory=>{const entries=[...files].filter(([path])=>path.startsWith(directory+'/'));return {bytes:entries.reduce((n,[,value])=>n+new TextEncoder().encode(value).length,0),files:entries.length,complete:true,onlyKnownFiles:entries.every(([path])=>/\/(?:content|manifest|owner)\.json$/.test(path))};},
  measureLooseFiles:async()=>{const loose=[...files].filter(([path])=>!path.includes('/'));return {bytes:loose.reduce((n,[,value])=>n+new TextEncoder().encode(value).length,0),files:loose.length,complete:true};},
  trash:async directory=>{const data=new Map([...files].filter(([path])=>path.startsWith(directory+'/')));trashed.set(directory,data);await disk.remove(directory);}
 };
 return {disk,files,trashed};
}
const content=(version:string):ReadingModule=>({format:1,id:'mysword-all-of-grace',kind:'book',title:'Book',author:'A',version,sourcePage:'https://www.mysword.info/download-mysword/books',sourceSha256:'a'.repeat(64),notice:'',entries:[{key:'1',title:'Entry',source:'Text',blocks:[{type:'text',text:version}]}],images:{}});
const service=(disk:ModuleStore)=>new ReadingInstallService(disk,async()=>{throw Error('No SQL');},async()=>{throw Error('No network');});

describe('resource storage review and recovery',()=>{
 it('stops cleanup before moving retained folders when shutdown occurs during revalidation',async()=>{
  const {disk,files,trashed}=store();const first=await promoteReadingModule(disk,content('1')),second=await promoteReadingModule(disk,content('2'));
  const modules=service(disk);await modules.initialize();await modules.useVersion(first.directory);await modules.useVersion(second.directory);await modules.useVersion(second.directory);
  const review=await modules.previewStorage();expect(review.items.find(item=>item.directory===first.directory)?.cleanupEligible).toBe(true);
  const before=new Map(files),measure=disk.measure!;let started!:()=>void,release!:()=>void;
  const began=new Promise<void>(resolve=>started=resolve),gate=new Promise<void>(resolve=>release=resolve);
  disk.measure=async path=>{const value=await measure(path);if(path===first.directory){started();await gate;}return value;};
  const cleanup=expect(modules.cleanupStorage(review.ticket,[first.directory])).rejects.toThrow(/cancel|stopped/i);
  await began;modules.stop();release();await cleanup;
  expect(trashed.size).toBe(0);expect(files).toEqual(before);
 });
 it('does not promote a reviewed stage when shutdown occurs during recovery revalidation',async()=>{
  const {disk,files}=store(),saved=await promoteReadingModule(disk,content('staged'));
  const stage=JSON.parse(await disk.read(saved.directory+'/owner.json')).stage as string;await disk.rename(saved.directory,stage);
  const modules=service(disk);await modules.initialize();const review=await modules.previewStorage(),before=new Map(files);
  const measure=disk.measure!;let started!:()=>void,release!:()=>void;
  const began=new Promise<void>(resolve=>started=resolve),gate=new Promise<void>(resolve=>release=resolve);
  disk.measure=async path=>{const value=await measure(path);if(path===stage){started();await gate;}return value;};
  const recovery=expect(modules.recoverStage(review.ticket,stage)).rejects.toThrow(/cancel|stopped/i);
  await began;modules.stop();release();await recovery;
  expect(files).toEqual(before);expect(modules.installed).toEqual([]);
  const reopened=service(disk);await reopened.initialize();expect(reopened.pendingStages).toContain(stage);expect(reopened.installed).toEqual([]);
 });
 it('retains a completed Trash move and stops before the next folder after shutdown',async()=>{
  const {disk,files,trashed}=store();const first=await promoteReadingModule(disk,content('1')),second=await promoteReadingModule(disk,content('2'));
  const modules=service(disk);await modules.initialize();await modules.useVersion(first.directory);await modules.useVersion(second.directory);await modules.useVersion(second.directory);
  const review=await modules.previewStorage(),selected=review.items.filter(item=>item.cleanupEligible).slice(0,2).map(item=>item.directory);
  expect(selected).toHaveLength(2);const retained=new Map([...files].filter(([path])=>path.startsWith(selected[1]+'/'))),trash=disk.trash!;
  disk.trash=async path=>{await trash(path);modules.stop();};
  await expect(modules.cleanupStorage(review.ticket,selected)).rejects.toThrow(/cancelled after 1 folder.*Trash/i);
  expect([...trashed.keys()]).toEqual([selected[0]]);
  expect(new Map([...files].filter(([path])=>path.startsWith(selected[1]+'/')))).toEqual(retained);
  const reopened=service(disk);await reopened.initialize();expect(reopened.installed[0].directory).toBe(second.directory);
 });
 it('accounts for saved download prefixes, keeps them distinct from activatable resources, and permits reviewed Trash cleanup',async()=>{
  const {disk,trashed}=store(),source=READING_SOURCES[0],cache=new PartialDownloads(disk);
  await cache.save(source,new Uint8Array([1,2,3,4]),'"v1"');
  const saved=(await cache.latest(source))!,modules=service(disk);await modules.initialize();
  const report=await modules.previewStorage(),item=report.items.find(item=>item.directory===saved.directory)!;
  expect(item).toMatchObject({category:'staging',cleanupEligible:true,recoverable:false,files:3,download:{id:source.id,received:4,total:source.compressedBytes}});
  expect(item.reason).toMatch(/Retry.*resume/);expect(modules.installed).toEqual([]);
  item.download!.received=999; // A caller's display data cannot change the cleanup ticket.
  await modules.cleanupStorage(report.ticket,[item.directory]);expect(trashed.has(item.directory)).toBe(true);expect(await cache.latest(source)).toBeNull();
 });
 it('measures active, retained, removed and management data and moves only reviewed unused data to Trash',async()=>{
  const {disk,files,trashed}=store();const first=await promoteReadingModule(disk,content('1')),second=await promoteReadingModule(disk,content('2'));
  const modules=service(disk);await modules.initialize();await modules.useVersion(first.directory);await modules.useVersion(second.directory);await modules.useVersion(second.directory);
  const report=await modules.previewStorage();
  const actual=[...files.values()].reduce((n,value)=>n+new TextEncoder().encode(value).length,0);
  expect(report.totalBytes).toBe(actual);expect(report.items.some(item=>item.directory===second.directory&&item.category==='active'&&!item.cleanupEligible)).toBe(true);
  expect(report.items.filter(item=>item.category==='management').length).toBeGreaterThan(1);
  const candidates=report.items.filter(item=>item.cleanupEligible);expect(candidates.some(item=>item.directory===first.directory)).toBe(true);
  const result=await modules.cleanupStorage(report.ticket,candidates.map(item=>item.directory));expect(result.moved).toBe(candidates.length);
  expect(trashed.has(first.directory)).toBe(true);expect(modules.installed[0].directory).toBe(second.directory);
  await modules.remove(second.id);const removed=await modules.previewStorage();
  expect(removed.items.find(item=>item.directory===second.directory)).toMatchObject({category:'removed',cleanupEligible:false});
  await modules.restore(second.id);expect((await modules.load(second.id)).version).toBe('2');
 });
 it('refuses stale cleanup reviews and protects newly selected versions before any move',async()=>{
  const {disk,trashed}=store();const first=await promoteReadingModule(disk,content('1')),second=await promoteReadingModule(disk,content('2'));
  const modules=service(disk);await modules.initialize();await modules.useVersion(second.directory);await modules.useVersion(second.directory);
  const report=await modules.previewStorage();await modules.useVersion(first.directory);
  await expect(modules.cleanupStorage(report.ticket,[first.directory])).rejects.toThrow(/changed|protected|review/i);expect(trashed.size).toBe(0);
 });
 it('keeps unknown data and folders containing unexpected files out of cleanup',async()=>{
  const {disk}=store();const first=await promoteReadingModule(disk,content('1'));await disk.write(first.directory+'/personal.txt','User data');await disk.write('unrelated-folder/note.md','Keep me');
  const modules=service(disk);await modules.initialize();const report=await modules.previewStorage();
  expect(report.items.find(item=>item.directory==='unrelated-folder')).toMatchObject({category:'unknown',cleanupEligible:false});
  expect(report.items.find(item=>item.directory===first.directory)?.cleanupEligible).toBe(false);
  await expect(modules.cleanupStorage(report.ticket,['unrelated-folder'])).rejects.toThrow(/review|eligible/i);
 });
 it('includes loose files in totals and reports incomplete measurement honestly',async()=>{
  const {disk,files}=store();files.set('loose.txt','Keep');const modules=service(disk);await modules.initialize();
  const report=await modules.previewStorage();expect(report.totalBytes).toBe(4);expect(report.looseFiles?.files).toBe(1);expect(report.complete).toBe(true);
  await disk.write('unknown/file','data');const measure=disk.measure!;disk.measure=async path=>({...await measure(path),complete:false});
  expect((await modules.previewStorage()).complete).toBe(false);
 });
 it('recovers a complete interrupted stage after explicit review, with exact source content',async()=>{
  const {disk}=store();const saved=await promoteReadingModule(disk,content('staged'));const stage=JSON.parse(await disk.read(saved.directory+'/owner.json')).stage as string;
  await disk.rename(saved.directory,stage);const modules=service(disk);await modules.initialize();expect(modules.installed).toEqual([]);
  const report=await modules.previewStorage();expect(report.items.find(item=>item.directory===stage)?.recoverable).toBe(true);
  await modules.recoverStage(report.ticket,stage);expect((await modules.load(saved.id)).version).toBe('staged');
  const restarted=service(disk);await restarted.initialize();expect((await restarted.load(saved.id)).version).toBe('staged');
 });
 it('rejects altered stages and permits owned incomplete stages to be moved to Trash',async()=>{
  const {disk,trashed}=store();const saved=await promoteReadingModule(disk,content('staged'));const stage=JSON.parse(await disk.read(saved.directory+'/owner.json')).stage as string;await disk.rename(saved.directory,stage);
  const modules=service(disk);await modules.initialize();const report=await modules.previewStorage();await disk.write(stage+'/content.json','changed');
  await expect(modules.recoverStage(report.ticket,stage)).rejects.toThrow(/changed|review|checksum/i);expect(modules.installed).toEqual([]);
  const reviewed=await modules.previewStorage();expect(reviewed.items.find(item=>item.directory===stage)?.cleanupEligible).toBe(true);
  await modules.cleanupStorage(reviewed.ticket,[stage]);expect(trashed.has(stage)).toBe(true);
 });
 it('rejects a different valid prepared package substituted after the recovery review',async()=>{
  const {disk}=store();const saved=await promoteReadingModule(disk,content('first'));const stage=JSON.parse(await disk.read(saved.directory+'/owner.json')).stage as string;await disk.rename(saved.directory,stage);
  const modules=service(disk);await modules.initialize();const review=await modules.previewStorage();
  const changed=await promoteReadingModule(disk,content('substitute'));
  for(const file of ['content.json','manifest.json','owner.json'])await disk.write(stage+'/'+file,await disk.read(changed.directory+'/'+file));await disk.remove(changed.directory);
  await expect(modules.recoverStage(review.ticket,stage)).rejects.toThrow(/changed|review/i);expect(modules.installed).toEqual([]);
 });
});
