import { describe,expect,it } from 'vitest';
import { gunzipBounded, promoteReadingModule, readInstalledModule, type ModuleStore } from '../src/core/module-installation';
import { gzipSync } from 'node:zlib';
import type {ReadingModule} from '../src/core/reading-modules';
const module:ReadingModule={format:1,id:'test-book',kind:'book',title:'Test',author:'A',version:'1',sourcePage:'https://www.mysword.info/download-mysword/books',sourceSha256:'a'.repeat(64),notice:'',entries:[{key:'1',title:'Chapter',blocks:[{type:'text',text:'Hello'}]}],images:{}};
function store(failRename=false):ModuleStore {
 const files=new Map<string,string>();
 return {mkdir:async()=>{},write:async(p,v)=>{files.set(p,v);},read:async p=>{if(!files.has(p))throw Error('missing');return files.get(p)!;},rename:async(a,b)=>{if(failRename)throw Error('disk');for(const [p,v] of [...files])if(p.startsWith(a+'/')){files.set(b+p.slice(a.length),v);files.delete(p);}},remove:async p=>{for(const key of files.keys())if(key.startsWith(p+'/'))files.delete(key);},directories:async()=>[...new Set([...files.keys()].map(p=>p.split('/')[0]))]};
}
describe('module installation transaction',()=>{
 it('rejects malformed retained source IDs before staging',async()=>{
  const disk=store();
  await expect(promoteReadingModule(disk,{...module,entries:[{...module.entries[0],sourceId:42 as unknown as string}]})).rejects.toThrow(/source ID/i);
  expect(await disk.directories()).toEqual([]);
 });
 it('decompresses gzip and rejects expansion beyond its configured limit',async()=>{
  expect(await gunzipBounded(new Uint8Array(gzipSync('hello')),100)).toEqual(new TextEncoder().encode('hello'));
  await expect(gunzipBounded(new Uint8Array(gzipSync('x'.repeat(2000))),100)).rejects.toThrow(/limit/i);
 });
 it('promotes a verified generation and reads it after a fresh discovery',async()=>{
  const disk=store(); const info=await promoteReadingModule(disk,module);
  expect((await disk.directories()).some(p=>p.startsWith('.stage-'))).toBe(false);
  expect((await readInstalledModule(disk,info)).entries[0].title).toBe('Chapter');
 });
 it('does not publish on cancelled or failed promotion',async()=>{
  const disk=store(true); await expect(promoteReadingModule(disk,module)).rejects.toThrow('disk'); expect(await disk.directories()).toEqual([]);
  const abort=new AbortController();abort.abort();const other=store();
  await expect(promoteReadingModule(other,module,abort.signal)).rejects.toThrow(/cancel/i);expect(await other.directories()).toEqual([]);
 });
 it('rejects path traversal identifiers before writing anything',async()=>{
  const disk=store(); await expect(promoteReadingModule(disk,{...module,id:'../bad'})).rejects.toThrow();expect(await disk.directories()).toEqual([]);
 });
 it('rejects malformed retained study metadata and ambiguous source coordinates before staging',async()=>{
  const bible={...module,kind:'bible' as const,metadata:{title:'Test',abbreviation:'T',author:'',language:'eng',version:'1',notice:'',strongs:false,rightToLeft:false,verseRules:'',customCss:''},
   entries:[{key:'1',title:'John 3:16',blocks:[],source:'Text',reference:{book:43,chapter:3,verse:16,endVerse:16}}]};
  const disk=store();
  await expect(promoteReadingModule(disk,{...bible,metadata:{...bible.metadata,rightToLeft:'yes' as unknown as boolean}})).rejects.toThrow(/metadata/i);
  await expect(promoteReadingModule(disk,{...bible,entries:[...bible.entries,{...bible.entries[0],key:'2'}]})).rejects.toThrow(/coordinate|duplicate/i);
  expect(await disk.directories()).toEqual([]);
 });
 it('detects damaged installed data instead of exposing it as ready',async()=>{
  const disk=store();const info=await promoteReadingModule(disk,module);await disk.write(info.directory+'/content.json','{}');
  await expect(readInstalledModule(disk,info)).rejects.toThrow(/checksum/i);
 });
});

it('does not activate a generation when its manifest write is corrupted',async()=>{
 const disk=store();const write=disk.write;
 disk.write=async(path,value)=>write(path,path.endsWith('manifest.json')?'{}':value);
 await expect(promoteReadingModule(disk,module)).rejects.toThrow(/manifest/i);
 expect(await disk.directories()).toEqual([]);
});
