import {describe,expect,it} from 'vitest';
import {readFileSync,statSync} from 'node:fs';
import {InterlinearLibrary,decodeInterlinearChapter,interlinearWordsForOrder,interlinearLexiconKey} from '../src/core/interlinear';
import {parseReference} from '../src/core/references';

const read=async(file:string)=>readFileSync('library/interlinear/'+file,'utf8');
const size=async(file:string)=>statSync('library/interlinear/'+file).size;
const library=()=>new InterlinearLibrary(read,size);
describe('attributed original-language interlinear',()=>{
 it('retains exact Hebrew source words, null rows and separate repeated Strong’s occurrences',async()=>{
  const data=library();expect(await data.initialize()).toBe(true);
  const verse=await data.getVerse(parseReference('Genesis 1:1'));expect(verse?.sourceId).toBe('bsb-interlinear');
  expect(verse?.words).toHaveLength(7);
  expect(verse?.words[2]).toMatchObject({pos:3,bsbPos:2,language:'hebrew',text:'אֱלֹהִ֑ים',strongs:'H0430',gloss:'God'});
  expect(verse?.words[3]).toMatchObject({pos:4,strongs:'H0853',gloss:null,parsing:'DirObjM'});
  expect(verse?.words.filter(word=>word.strongs==='H0853').map(word=>word.pos)).toEqual([4,6]);
  expect(interlinearWordsForOrder(verse!.words,'english').map(word=>word.pos)).toEqual([1,3,4,2,5,6,7]);
  expect(verse?.words.map(word=>word.pos)).toEqual([1,2,3,4,5,6,7]);
  expect(Object.isFrozen(verse?.words[0])).toBe(true);
 });
 it('preserves Greek and Aramaic source rows and returns no nearest verse for unavailable coordinates',async()=>{
  const data=library();await data.initialize();
  const greek=await data.getVerse(parseReference('John 3:16'));
  expect(greek?.words.find(word=>word.strongs==='G0025')).toMatchObject({language:'greek',text:'ἠγάπησεν',gloss:'loved'});
  expect((await data.getVerse(parseReference('Daniel 2:4')))?.words.some(word=>word.language==='aramaic')).toBe(true);
  expect(await data.getVerse(parseReference('John 3'))).toBeNull();
  expect(await data.getVerse(parseReference('John 3:199'))).toBeNull();
  expect((await data.getVerse(parseReference('Acts 8:37')))?.words).toEqual([]);
  expect((await data.getVerse(parseReference('Acts 8:36')))?.words.length).toBeGreaterThan(0);
  expect(interlinearLexiconKey('H0430')).toBe('H430');expect(interlinearLexiconKey('G0025')).toBe('G25');
  for(const invalid of [null,'G0000','../G25','G25<script>'])expect(interlinearLexiconKey(invalid)).toBeNull();
 });
 it('refuses tampering and oversized files before rendering words',async()=>{
  const corrupt=new InterlinearLibrary(async file=>file==='GEN-1.json'?(await read(file)).replace('God','Dog'):read(file),size);
  await corrupt.initialize();await expect(corrupt.getVerse(parseReference('Genesis 1:1'))).rejects.toThrow(/unavailable|damaged/i);
  let readChapter=false;
  const oversized=new InterlinearLibrary(async file=>{if(file==='GEN-1.json')readChapter=true;return read(file);},async file=>file==='GEN-1.json'?9999999:size(file));
  await oversized.initialize();await expect(oversized.getVerse(parseReference('Genesis 1:1'))).rejects.toThrow(/unavailable|damaged/i);expect(readChapter).toBe(false);
  const badManifest=new InterlinearLibrary(async file=>file==='manifest.json'?(await read(file)).replace('443625','443626'):read(file),size);
  expect(await badManifest.initialize()).toBe(false);
 });
 it('rejects malformed source/English ranks and hostile coordinates without silently merging words',async()=>{
  const raw=JSON.parse(await read('GEN-1.json'));
  raw.verses[0][1][1][0]=1;expect(()=>decodeInterlinearChapter(raw,'GEN',1)).toThrow(/position|rank/i);
  raw.verses[0][1][1][0]=2;raw.verses[0][1][1][1]=1;expect(()=>decodeInterlinearChapter(raw,'GEN',1)).toThrow(/position|rank/i);
  const good=JSON.parse(await read('GEN-1.json'));good.sourceBook='JHN';expect(()=>decodeInterlinearChapter(good,'GEN',1)).toThrow(/coordinate/i);
  const data=library();await data.initialize();
  await expect(data.getVerse({book:{vpl:'../GEN',osis:'Gen',name:'bad',aliases:[]},chapter:1,verse:1})).rejects.toThrow(/coordinate|book/i);
 });
 it('bounds the chapter cache and rejects in-flight data after source reinitialization',async()=>{
  const counts=new Map<string,number>();let release!:()=>void;let hold=false;
  const data=new InterlinearLibrary(async file=>{counts.set(file,(counts.get(file)??0)+1);if(hold&&file==='GEN-1.json')await new Promise<void>(resolve=>release=resolve);return read(file);},size);
  await data.initialize();
  for(const ref of ['Genesis 1:1','Genesis 2:1','Genesis 3:1','Genesis 1:1'])await data.getVerse(parseReference(ref));
  expect(counts.get('GEN-1.json')).toBe(2);
  await data.initialize();hold=true;const pending=data.getVerse(parseReference('Genesis 1:1'));
  while(!release)await new Promise(resolve=>setTimeout(resolve,0));
  await data.initialize();release();await expect(pending).rejects.toThrow(/changed|reopen/i);
 });
});
