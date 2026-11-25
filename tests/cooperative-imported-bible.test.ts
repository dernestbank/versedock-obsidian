import {describe,it,expect} from 'vitest';
import {ImportedBibleResource} from '../src/core/imported-bible';
import type {ReadingModule} from '../src/core/reading-modules';

function fixture() {
 const visited=new Set<number>();
 const module:ReadingModule={format:1,id:'fixture-bible',kind:'bible',title:'Fixture',author:'A',version:'1',sourcePage:'',sourceSha256:'a'.repeat(64),notice:'',images:{},
  entries:Array.from({length:501},(_,index)=>{
   const chapter=Math.floor(index/100)+1,verse=index%100+1;
   return {key:'1.'+chapter+'.'+verse,title:'Verse',reference:{book:1,chapter,verse,endVerse:verse},blocks:[],
    get source(){visited.add(index);return 'Word<WH1697> retained.';}};
  })};
 return {module,visited};
}
const nextTask=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
describe('cooperative installed Bible opening',()=>{
 it('runs pending input before publishing a complete Bible with lexical tokens',async()=>{
  const {module,visited}=fixture();let observed=-1;
  const input=nextTask().then(()=>{observed=visited.size;});
  const bible=await ImportedBibleResource.create(module,{bytes:100,files:3},async()=>{});
  await input;
  expect(observed).toBeGreaterThan(0);expect(observed).toBeLessThan(module.entries.length);
  expect(bible.metadata.verseCount).toBe(501);
  expect((await bible.findStrongs('H1697')).total).toBe(501);
  expect((await bible.getStorageSummary()).files).toBe(3);
 });
 it('abandons partial decoding when cancellation arrives',async()=>{
  const {module,visited}=fixture(),controller=new AbortController();
  const input=nextTask().then(()=>controller.abort());
  const pending=Promise.resolve().then(()=>ImportedBibleResource.create(module,{bytes:100,files:3},async()=>{},controller.signal));
  await expect(pending).rejects.toThrow(/cancelled/i);await input;
  expect(visited.size).toBeGreaterThan(0);expect(visited.size).toBeLessThan(module.entries.length);
 });
 it('does not read entries when already cancelled',async()=>{
  const {module,visited}=fixture(),controller=new AbortController();controller.abort();
  await expect(Promise.resolve().then(()=>ImportedBibleResource.create(module,{bytes:100,files:3},async()=>{},controller.signal))).rejects.toThrow(/cancelled/i);
  expect(visited.size).toBe(0);
 });
});

it('rejects cancellation arriving during the final Bible decoding yield',async()=>{
 const {module}=fixture(),controller=new AbortController();module.entries=module.entries.slice(0,250);
 const input=nextTask().then(()=>controller.abort());
 await expect(ImportedBibleResource.create(module,{bytes:100,files:3},async()=>{},controller.signal)).rejects.toThrow(/cancelled/i);
 await input;
});
