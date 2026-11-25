import { BOOKS } from './books';
import { tokenizeMySwordGbf } from './mysword-gbf';
import { checkCancelled, decodeReadingEntities, readingBlocks, type ReadingModule, type ReadingSource } from './reading-modules';
import type { VerseData, WordToken } from './library';
import type { InspectedStudyModule } from './mysword-study-module';

/** Postfix lexical markers attach only to the preceding source word. Unknown markup stays visible. */
export function decodeImportedVerse(verse:number,source:string):VerseData {
 const scan=tokenizeMySwordGbf(source);
 const words:WordToken[]=[];let added=false,redLetter=false;const annotations:string[]=[];
 const add=(text:string):void=>{if(text)words.push({text:decodeReadingEntities(text),...(added?{added:true}:{}),...(redLetter?{redLetter:true}:{})});};
 const taggedWord=():WordToken|undefined=>{
  const last=words[words.length-1];if(!last)return undefined;
  if(last.strongs?.length)return last;
  const match=/^(.*?)([^\s]+)$/su.exec(last.text);if(!match)return undefined;
  if(match[1]){last.text=match[1];const token={...last,text:match[2]};words.push(token);return token;}return last;
 };
 for(const token of scan.tokens){
  if(token.family==='RF'||token.family==='TS'){
   if(token.kind==='paired-open')annotations.push(token.family);
   else if(token.kind==='paired-close'&&annotations.pop()!==token.family)throw new Error('Unsupported annotation markup; the source was not activated.');
   continue;
  }
  if(annotations.length)continue;
  if(token.kind==='text'){add(token.raw);continue;}
  if((token.kind==='paired-open'||token.kind==='paired-close')&&['FI','FR'].includes(token.family??'')){
   if(token.family==='FI')added=token.kind==='paired-open';else redLetter=token.kind==='paired-open';continue;
  }
  if(token.kind==='lexical'&&(token.family==='WG'||token.family==='WH')){
   const word=taggedWord();const id=token.raw.slice(2,-1);if(word)word.strongs=[...new Set([...(word.strongs??[]),id])];else add(token.raw);continue;
  }
  if(token.kind==='lexical'&&token.family==='WT'){
   const word=taggedWord();if(word)word.morphology=[...(word.morphology??[]),'mysword:'+token.raw.slice(3,-1)];else add(token.raw);continue;
  }
  if(token.kind==='structural'){if(['CM','CI'].includes(token.family??''))add('\n');continue;}
  // Retain unsupported HTML/GBF literally; it is never interpreted by the DOM.
  add(token.raw);
 }
 if(annotations.length)throw new Error('Unsupported unclosed annotation markup; the source was not activated.');
 return {verse,text:words.map(word=>word.text).join(''),tokens:words,source};
}
/** Yield while decoding large modules so input and cancellation can run. */
export async function prepareStudyContent(inspected:InspectedStudyModule,source:ReadingSource,signal?:AbortSignal):Promise<ReadingModule> {
 checkCancelled(signal);
 const entries:ReadingModule['entries']=[];
 for(const record of inspected.records){
  checkCancelled(signal);
  if(record.kind==='dictionary')entries.push({key:record.key,title:record.word,source:record.source,blocks:readingBlocks(record.source,{})});
  else{
   const first=record.kind==='bible'?record.verse:record.fromVerse;const last=record.kind==='bible'?record.verse:record.toVerse;
   entries.push({key:record.key,title:BOOKS[record.book-1].name+' '+record.chapter+(first?':'+first+(last!==first?'-'+last:''):''),source:record.source,
    reference:{book:record.book,chapter:record.chapter,verse:first,endVerse:last},
    blocks:record.kind==='bible'?[{type:'text',text:decodeImportedVerse(record.verse,record.source).text}]:readingBlocks(record.source,{})});
  }
  if(entries.length%250===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
 }
 checkCancelled(signal);
 const meta=inspected.metadata;
 return {format:1,id:source.id,kind:inspected.kind,title:meta.title.slice(0,300),author:meta.author,version:meta.version,sourcePage:source.sourcePage,sourceSha256:source.sha256,
  metadata:meta,notice:[meta.notice,...inspected.warnings].filter(Boolean).join('\n\n'),images:{},entries};
}
