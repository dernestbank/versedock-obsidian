import {describe,it,expect,vi} from 'vitest';
import type {SqlJsStatic} from 'sql.js';
vi.mock('../src/core/mysword-study-module',()=>({inspectStudyModule:vi.fn()}));
import {inspectStudyModule} from '../src/core/mysword-study-module';
import {normalizeModuleContent} from '../src/core/normalize-module';
import {prepareStudyContent} from '../src/core/imported-study-content';
import type {InspectedStudyModule,StudyModuleKind,StudyRecord} from '../src/core/mysword-study-module';
import type {ReadingSource} from '../src/core/reading-modules';

const metadata={title:'Study fixture',abbreviation:'FIX',author:'A',language:'eng',version:'1',notice:'',strongs:false,rightToLeft:false,verseRules:'',customCss:''};
function fixture(kind:StudyModuleKind) {
 const visited=new Set<number>();
 const records:StudyRecord[]=Array.from({length:501},(_,index)=>{
  const chapter=Math.floor(index/100)+1,verse=index%100+1;
  const common={key:'1.'+chapter+'.'+verse};
  const sourceText=()=>{visited.add(index);return 'Word <FI>retained<Fi>.';};
  if(kind==='dictionary')return {...common,kind,word:'Headword '+index,get source(){return sourceText();}};
  if(kind==='commentary')return {...common,kind,book:1,chapter,fromVerse:verse,toVerse:verse,get source(){return sourceText();}};
  return {...common,kind,book:1,chapter,verse,get source(){return sourceText();}};
 });
 const inspected:InspectedStudyModule={kind,metadata,records,warnings:[]};
 const source:ReadingSource={id:'fixture-'+kind,type:kind,title:metadata.title,sourcePage:'',sha256:'a'.repeat(64)};
 return {inspected,source,visited};
}
const nextTask=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
describe('cooperative study content preparation',()=>{
 it.each(['bible','commentary','dictionary'] as const)('lets pending input run before completing a large %s',async(kind)=>{
  const {inspected,source,visited}=fixture(kind);
  let observed=-1;
  const input=nextTask().then(()=>{observed=visited.size;});
  const module=await prepareStudyContent(inspected,source);
  await input;
  expect(observed).toBeGreaterThan(0);
  expect(observed).toBeLessThan(inspected.records.length);
  expect(module.entries.map(entry=>entry.key)).toEqual(inspected.records.map(record=>record.key));
  expect(visited.size).toBe(inspected.records.length);
 });
 it.each(['bible','commentary','dictionary'] as const)('stops %s preparation when cancellation arrives during work',async(kind)=>{
  const {inspected,source,visited}=fixture(kind),controller=new AbortController();
  const input=nextTask().then(()=>controller.abort());
  const pending=Promise.resolve().then(()=>prepareStudyContent(inspected,source,controller.signal));
  await expect(pending).rejects.toThrow(/cancelled/i);
  await input;
  expect(visited.size).toBeGreaterThan(0);
  expect(visited.size).toBeLessThan(inspected.records.length);
 });
 it('does not read source entries when already cancelled',async()=>{
  const {inspected,source,visited}=fixture('bible'),controller=new AbortController();
  controller.abort();
  await expect(Promise.resolve().then(()=>prepareStudyContent(inspected,source,controller.signal))).rejects.toThrow(/cancelled/i);
  expect(visited.size).toBe(0);
 });
});

describe('study normalization cancellation boundary',()=>{
 it.each(['bible','commentary','dictionary'] as const)('retains cancellation after inspecting %s records',async(kind)=>{
  const {inspected,source,visited}=fixture(kind),controller=new AbortController();
  vi.mocked(inspectStudyModule).mockResolvedValue(inspected);
  const input=nextTask().then(()=>controller.abort());
  // SQL inspection is the boundary stub; preparation and its cancellation are real.
  const pending=normalizeModuleContent({} as SqlJsStatic,new Uint8Array(),source,controller.signal);
  await expect(pending).rejects.toThrow(/cancelled/i);await input;
  expect(visited.size).toBeGreaterThan(0);expect(visited.size).toBeLessThan(inspected.records.length);
 });
 it('honors cancellation arriving while the final batch yields',async()=>{
  const {inspected,source}=fixture('bible'),controller=new AbortController();
  inspected.records=inspected.records.slice(0,250);
  const input=nextTask().then(()=>controller.abort());
  await expect(prepareStudyContent(inspected,source,controller.signal)).rejects.toThrow(/cancelled/i);
  await input;
 });
});
