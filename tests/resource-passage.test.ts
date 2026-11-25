import {describe,it,expect} from 'vitest';
import {loadResourcePassagePage,resourceAdjacentChapter} from '../src/core/resource-passage';
import {parseResourceLink} from '../src/core/resource-links';
import type {BibleResource} from '../src/core/library';
const reads:string[]=[];
const bible={getChapterCount:()=>3,getChapter:async(ref:{book:{vpl:string};chapter:number})=>{reads.push(ref.book.vpl+'.'+ref.chapter);return {chapter:ref.chapter,verses:[1,2,3].map(verse=>({verse,text:'Source '+verse}))};}} as unknown as BibleResource;
describe('bounded source passage previews',()=>{
 it('loads only the requested chapter of a cross-chapter range and retains its exact boundaries',async()=>{
  reads.length=0;const link=parseResourceLink('#b1.1.2-1.3.2');if(link?.kind!=='scripture')throw Error('fixture');
  const page=await loadResourcePassagePage(bible,link.range,{book:1,chapter:1});
  expect(page.verses.map(v=>v.verse)).toEqual([2,3]);expect(reads).toEqual(['GEN.1']);
  expect((await loadResourcePassagePage(bible,link.range,{book:1,chapter:3})).verses.map(v=>v.verse)).toEqual([1,2]);
  expect(resourceAdjacentChapter(bible,link.range,{book:1,chapter:1},-1)).toBeNull();
  expect(resourceAdjacentChapter(bible,link.range,{book:1,chapter:1},1)).toEqual({book:1,chapter:2});
 });
 it('refuses nonexistent or out-of-range coordinates without replacing a verse',async()=>{
  await expect(loadResourcePassagePage(bible,{start:{book:1,chapter:1,verse:9}},{book:1,chapter:1})).rejects.toThrow();
  await expect(loadResourcePassagePage(bible,{start:{book:1,chapter:1,verse:1}},{book:1,chapter:2})).rejects.toThrow(/range/i);
 });
 it('rejects a nonexistent far chapter before showing a truncated cross-chapter range',async()=>{
  reads.length=0;
  await expect(loadResourcePassagePage(bible,{start:{book:1,chapter:1,verse:1},end:{book:1,chapter:4,verse:1}},{book:1,chapter:1})).rejects.toThrow(/unavailable/i);
  expect(reads).toEqual([]);
 });
});
