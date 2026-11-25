import {describe,it,expect} from 'vitest';
import {decodeImportedVerse,prepareStudyContent} from '../src/core/imported-study-content';
import {ImportedBibleResource} from '../src/core/imported-bible';
import {parseReference} from '../src/core/references';
import type {InspectedStudyModule} from '../src/core/mysword-study-module';
const metadata={title:'Imported Bible',abbreviation:'IMP',author:'A',language:'eng',version:'1',notice:'Source notice',strongs:true,rightToLeft:false,verseRules:'',customCss:''};
const source={id:'mysword-kjv',type:'bible' as const,title:'Bible',sourcePage:'https://www.mysword.info/download-mysword/bibles',sha256:'a'.repeat(64)};
const records:InspectedStudyModule={kind:'bible',metadata,records:[{kind:'bible',key:'43.3.16',book:43,chapter:3,verse:16,source:'For God<WG2316> so loved<WG25> the world.'},{kind:'bible',key:'43.3.17',book:43,chapter:3,verse:17,source:'For God sent not his Son.'}],warnings:[]};
describe('installed study content',()=>{
 it('decodes source formatting and postfix word tags without including translator notes in Scripture',()=>{
  const verse=decodeImportedVerse(16,'<FR>God<WG2316> so loved<WG25> the world<Fr> <FI>indeed<Fi>.<RF>Translator note<Rf>');
  expect(verse.text).toBe('God so loved the world indeed.');
  expect(verse.tokens?.find(t=>t.text==='loved')).toMatchObject({strongs:['G25'],redLetter:true});
  expect(verse.tokens?.find(t=>t.text==='indeed')).toMatchObject({added:true});
 });
 it('retains unsupported tags visibly instead of silently discarding them',()=>{
  expect(decodeImportedVerse(1,'Text <UNKNOWN> remains').text).toContain('<UNKNOWN>');
 });
 it('refuses an unclosed annotation rather than silently hiding the rest of Scripture',()=>{
  expect(()=>decodeImportedVerse(1,'Scripture <RF>unclosed note and remaining source')).toThrow(/annotation|markup/i);
 });
 it('handles independent overlapping added-word and red-letter switches in the real publisher source',()=>{
  const verse=decodeImportedVerse(23,'<FR>If any <FI>man<Fr><Fi><WG1536><FR> will come after me.<Fr>');
  expect(verse.text).toBe('If any man will come after me.');
  expect(verse.tokens?.find(token=>token.text==='man')).toMatchObject({added:true,redLetter:true,strongs:['G1536']});
 });
 it('retains an explicitly empty source verse without fabricating words',async()=>{
  const blank={...records,records:[{kind:'bible' as const,key:'43.3.16',book:43,chapter:3,verse:16,source:''}]};
  const bible=await ImportedBibleResource.create(await prepareStudyContent(blank,source),{bytes:100,files:2},async()=>{});
  expect((await bible.getPassage(parseReference('John 3:16')))[0].text).toBe('');
 });
 it('preserves source records and coordinates in the prepared package',async()=>{
  const module=await prepareStudyContent(records,source);expect(module.kind).toBe('bible');
  expect(module.entries[0].reference).toEqual({book:43,chapter:3,verse:16,endVerse:16});
  expect(module.entries[0].source).toContain('<WG25>');
 });
 it('identifies a local Bible by its actual file and retained citation instead of claiming a publisher source',async()=>{
  const module=await prepareStudyContent(records,source);
  const local={...module,id:'local-bible-'+ 'b'.repeat(24),sourcePage:'',provenance:{kind:'local-file' as const,fileName:'owned.sqlite',compressed:false,sourceSha256:module.sourceSha256,databaseSha256:'b'.repeat(64),citation:'Local permission note'}};
  const bible=await ImportedBibleResource.create(local,{bytes:100,files:2},async()=>{});
  expect(bible.metadata.source).toBe('Local file · owned.sqlite');expect(bible.metadata.licenseNotice).toContain('Local permission note');
 });
 it('reads only actual imported verses and keeps a complete range without remapping',async()=>{
  const module=await prepareStudyContent(records,source);const bible=await ImportedBibleResource.create(module,{bytes:100,files:2},async()=>{});
  expect(bible.edition).toBe('mysword-kjv');expect(bible.metadata.abbreviation).toBe('IMP');
  expect((await bible.getPassage(parseReference('John 3:16-17'))).map(v=>v.verse)).toEqual([16,17]);
  await expect(bible.getPassage(parseReference('John 3:15-17'))).rejects.toThrow(/complete/);
 });
 it('supports edition-local text search and reports real installed coverage',async()=>{
  const bible=await ImportedBibleResource.create(await prepareStudyContent(records,source),{bytes:100,files:2},async()=>{});
  expect(bible.getChapterCount(parseReference('John 3').book)).toBe(3);
  expect(bible.getChapterCount(parseReference('Genesis 1').book)).toBe(0);
  const result=await bible.search({phrase:'loved',scope:'all',match:'phrase',currentBook:parseReference('John 3').book});
  expect(result.results).toHaveLength(1);expect(result.results[0].verse).toBe(16);
 });
 it('rejects a requested range with an internal source gap',async()=>{
  const sparse={...records,records:[records.records[0],{kind:'bible' as const,key:'43.3.18',book:43,chapter:3,verse:18,source:'Verse eighteen.'}]};
  const bible=await ImportedBibleResource.create(await prepareStudyContent(sparse,source),{bytes:100,files:2},async()=>{});
  await expect(bible.getPassage(parseReference('John 3:16-18'))).rejects.toThrow(/complete/);
 });
});
