import { BOOKS, type BookInfo } from './books';
import type { BibleResource, ChapterData, LibraryManifest, LibraryStorageSummary, SearchPage, WordSearchPage } from './library';
import { decodeImportedVerse } from './imported-study-content';
import { referenceContainsVerse, refLabel, type PassageReference } from './references';
import { booksForSearchScope, boundedSearchLimit, currentChapterForSearchScope, prepareBibleSearchQuery, verseMatchesSearch, type BibleSearchRequest } from './search';
import type { ReadingModule } from './reading-modules';
import { checkCancelled } from './reading-modules';
import type { IntegrityReport } from './integrity';
import { moduleOrigin, moduleSourceNotice } from './module-provenance';
export class ImportedBibleResource implements BibleResource {
 readonly edition:string;readonly metadata:LibraryManifest;
 /** Decodes in batches and publishes only a complete, uncancelled resource. */
 static async create(module:ReadingModule,storage:{bytes:number;files:number},verify:()=>Promise<void>,signal?:AbortSignal):Promise<ImportedBibleResource>{
  checkCancelled(signal);
  if(module.kind!=='bible')throw new Error('Selected resource is not a Bible.');
  const chapters=new Map<string,ChapterData>();let count=0;
  for(const entry of module.entries){
   checkCancelled(signal);
   const ref=entry.reference;if(!ref||!ref.verse||entry.source===undefined)throw new Error('Bible entry lacks source coordinates.');
   const key=ref.book+'.'+ref.chapter,chapter=chapters.get(key)??{chapter:ref.chapter,verses:[]};
   chapter.verses.push(decodeImportedVerse(ref.verse,entry.source));chapters.set(key,chapter);
   if(++count%250===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  checkCancelled(signal);
  return new ImportedBibleResource(module,chapters,storage,verify);
 }
 private constructor(module:ReadingModule,private readonly chapters:Map<string,ChapterData>,private readonly storage:{bytes:number;files:number},private readonly verify:()=>Promise<void>){
  this.edition=module.id;
  const books=BOOKS.map((book,index)=>({code:book.vpl,chapters:this.getChapterCount(book),verses:[...this.chapters].filter(([key])=>key.startsWith((index+1)+'.')).reduce((n,[,chapter])=>n+chapter.verses.length,0),bytes:0,sha256:module.sourceSha256})).filter(book=>book.chapters>0);
  this.metadata={id:module.id,abbreviation:module.metadata?.abbreviation||module.title,title:module.title,edition:'MySword '+module.version,language:module.metadata?.language,rightToLeft:module.metadata?.rightToLeft,license:'See source notice',licenseNotice:moduleSourceNotice(module),source:module.provenance?moduleOrigin(module):'Publisher MySword module',sourcePage:module.sourcePage,sourceSha256:module.sourceSha256,verseCount:module.entries.length,books};
 }
 getChapterCount(book:BookInfo):number{const number=BOOKS.findIndex(known=>known.osis===book.osis)+1;return Math.max(0,...[...this.chapters.keys()].filter(key=>key.startsWith(number+'.')).map(key=>Number(key.split('.')[1])));}
 async getChapter(ref:PassageReference):Promise<ChapterData>{const number=BOOKS.findIndex(book=>book.osis===ref.book.osis)+1;const chapter=this.chapters.get(number+'.'+ref.chapter);if(!chapter)throw new Error('This edition has no '+ref.book.name+' '+ref.chapter+'.');return chapter;}
 async getPassage(ref:PassageReference){const chapter=await this.getChapter(ref);if(ref.verse===undefined)return chapter.verses;
  const verses=chapter.verses.filter(verse=>referenceContainsVerse(ref,verse.verse));if(verses.length!==(ref.endVerse??ref.verse)-ref.verse+1||verses.some((verse,index)=>verse.verse!==ref.verse!+index))throw new Error('No complete source passage at '+refLabel(ref)+'.');return verses;
 }
 async search(request:BibleSearchRequest):Promise<SearchPage>{
  const query=prepareBibleSearchQuery(request.phrase,request.match),limit=boundedSearchLimit(request.limit);const results:SearchPage['results']=[];
  const current=currentChapterForSearchScope(request.scope,request.currentChapter);
  for(const book of booksForSearchScope(request.scope,request.currentBook,request.selectedBook)){
   checkCancelled(request.signal);const number=BOOKS.findIndex(b=>b.osis===book.osis)+1;
   for(const [key,chapter]of this.chapters){if(!key.startsWith(number+'.')||(current!==undefined&&chapter.chapter!==current))continue;
    for(const verse of chapter.verses)if(verseMatchesSearch(verse.text,query)){results.push({label:book.name+' '+chapter.chapter+':'+verse.verse,text:verse.text,book,chapter:chapter.chapter,verse:verse.verse});if(results.length>limit)return {results:results.slice(0,limit),truncated:true};}
   }
   await new Promise<void>(resolve=>setTimeout(resolve,0));
  }return {results,truncated:false};
 }
 async findStrongs(key:string,limit=50,signal?:AbortSignal,offset=0):Promise<WordSearchPage>{
  if(!/^[GH][1-9]\d{0,4}$/.test(key)||!Number.isSafeInteger(offset)||offset<0)throw new Error('Invalid lexical search.');
  const results:WordSearchPage['results']=[];let total=0;const count=Math.min(100,Math.max(1,limit));
  for(const [id,chapter]of this.chapters){checkCancelled(signal);const book=BOOKS[Number(id.split('.')[0])-1];for(const verse of chapter.verses)if(verse.tokens?.some(token=>token.strongs?.includes(key))){if(total>=offset&&results.length<count)results.push({label:book.name+' '+chapter.chapter+':'+verse.verse,text:verse.text,book,chapter:chapter.chapter,verse:verse.verse});total++;}}
  return {results,total,offset,truncated:offset+results.length<total};
 }
 async getStorageSummary():Promise<LibraryStorageSummary>{return {...this.storage,missing:0};}
 async verifyIntegrity(onProgress?:(checked:number,total:number)=>void):Promise<IntegrityReport>{try{await this.verify();onProgress?.(1,1);return {checked:1,total:1,issues:[]};}catch{return {checked:1,total:1,issues:[{code:'module',problem:'Imported package integrity check failed.'}]};}}
}
