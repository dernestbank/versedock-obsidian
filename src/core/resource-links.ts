import {BOOKS} from './books';
import {parseReference} from './references';
import type {ReadingEntry,ReadingModule} from './reading-modules';

export interface ResourcePoint {book:number;chapter:number;verse?:number}
export interface ResourceRange {start:ResourcePoint;end?:ResourcePoint}
interface RangeLink {range:ResourceRange;edition?:string;module?:string;wholeChapter?:boolean}
export type ResourceLink =
 | RangeLink & {kind:'scripture';additionalRanges?:ResourceRange[]}
 | RangeLink & {kind:'commentary'}
 | {kind:'entry';collection:'journal'|'book'|'dictionary';id:string;anchor?:string;module?:string}
 | {kind:'anchor';id:string}
 | {kind:'external';url:string}
 | {kind:'note';text:string};

const controls=/[\u0000-\u001f\u007f]/;
const pointOrder=(p:ResourcePoint):number=>p.book*1e6+p.chapter*1000+(p.verse??0);
function valid(point:ResourcePoint,intro:boolean):boolean {
 return Number.isInteger(point.book)&&point.book>=1&&point.book<=66&&Number.isInteger(point.chapter)&&point.chapter>=(intro?0:1)&&point.chapter<=200
  && (point.verse===undefined||Number.isInteger(point.verse)&&point.verse>=(intro?0:1)&&point.verse<=200)
  && (point.chapter!==0||point.verse===0);
}
function parseRange(value:string,intro:boolean):ResourceRange|null {
 const numeric=/^(\d{1,2})\.(\d{1,3})(?:\.(\d{1,3}))?(?:-(?:(\d{1,2})\.(\d{1,3})\.)?(\d{1,3}))?$/.exec(value);
 let start:ResourcePoint,end:ResourcePoint|undefined;
 if(numeric){
  // The acquired publishers use verse zero as a whole-chapter address (e.g. Lev. 8).
  start={book:Number(numeric[1]),chapter:Number(numeric[2]),...(numeric[3]!==undefined&&(intro||numeric[3]!=='0')?{verse:Number(numeric[3])}:{})};
  if(numeric[6]!==undefined)end={book:numeric[4]!==undefined?Number(numeric[4]):start.book,chapter:numeric[5]!==undefined?Number(numeric[5]):start.chapter,...(intro||numeric[6]!=='0'?{verse:Number(numeric[6])}:{})};
 }else {
  // The existing reference parser owns aliases; split only a cross-chapter end.
  const cross=/^(.+?\d+[:.]\d+)\s*[-–—]\s*(?:(.+?)\s+)?(\d+)[:.](\d+)$/.exec(value);
  try {
   const ref=parseReference(cross?cross[1]:value);
   start={book:BOOKS.findIndex(book=>book.osis===ref.book.osis)+1,chapter:ref.chapter,...(ref.verse!==undefined?{verse:ref.verse}:{})};
   if(cross){const last=parseReference((cross[2]??ref.book.name)+' '+cross[3]+':'+cross[4]);end={book:BOOKS.findIndex(book=>book.osis===last.book.osis)+1,chapter:last.chapter,verse:last.verse};}
   else if(ref.endVerse!==undefined)end={...start,verse:ref.endVerse};
  }catch{return null;}
 }
 if(!valid(start,intro)||end&&(!valid(end,intro)||pointOrder(end)<pointOrder(start)))return null;
 return {start,...(end?{end}:{})};
}

/** Addresses are parsed as data. Never pass a source href to Obsidian or location. */
export function parseResourceLink(raw:string):ResourceLink|null {
 if(typeof raw!=='string'||!raw.length||raw.length>4096||controls.test(raw)||/%(?![a-f0-9]{2})/i.test(raw))return null;
 if(/^https:\/\//i.test(raw)){
  try{const url=new URL(raw);return url.protocol==='https:'&&!url.username&&!url.password?{kind:'external',url:url.href}:null;}catch{return null;}
 }
 let text:string;
 try{text=decodeURIComponent(raw);}catch{return null;}
 if(controls.test(text))return null;
 if(/^[a-z][a-z0-9+.-]*:/i.test(text)&&!/^b[a-z1-3 ]+\d+:/i.test(text))return null;
 const fragment=text.startsWith('#');if(fragment)text=text.slice(1);
 if(!text||text.length>2048)return null;
 const prefix=text[0];let body=text.slice(1);
 if(prefix==='b'||prefix==='c'){
  let module:string|undefined,edition:string|undefined;
  if(body.startsWith('-')){const match=/^-([A-Za-z0-9][A-Za-z0-9_-]{0,79}) (.+)$/.exec(body);if(!match)return null;module=match[1];body=match[2];}
  const wholeChapter=body.endsWith('&w=1');if(wholeChapter)body=body.slice(0,-4);
  const slash=/\/([A-Za-z0-9][A-Za-z0-9_-]{0,79})$/.exec(body);
  const suffix=/\.([A-Za-z][A-Za-z0-9_-]{0,79})$/.exec(body);
  if(slash||suffix){const match=slash??suffix!;edition=match[1];body=body.slice(0,match.index);}
  const range=parseRange(body.trim(),prefix==='c');if(!range||prefix==='c'&&edition)return null;
  return {kind:prefix==='b'?'scripture':'commentary',range,...(module?{module}:{}),...(edition?{edition}:{}),...(wholeChapter?{wholeChapter:true}:{})};
 }
 if(['j','k','d'].includes(prefix)){
  let module:string|undefined;
  if(body.startsWith('-')){const match=/^-([A-Za-z0-9][A-Za-z0-9_-]{0,79}) (.+)$/.exec(body);if(match){module=match[1];body=match[2];}else if(prefix!=='d'&&!body.includes(' '))body=body.slice(1);else return null;}
  body=body.trim();const hash=body.indexOf('#');const id=hash<0?body:body.slice(0,hash);const anchor=hash<0?undefined:body.slice(hash+1);
  if(!id||id.length>512||anchor!==undefined&&(!anchor||anchor.length>256||anchor.includes('#')))return null;
  return {kind:'entry',collection:prefix==='d'?'dictionary':prefix==='k'?'book':'journal',id,...(anchor?{anchor}:{}),...(module?{module}:{})};
 }
 if(prefix==='r'&&body)return {kind:'note',text:body};
 // A bare fragment is confined to anchors in the current entry; no URL navigation.
 if(fragment&&!text.includes(':')&&!text.includes('/')&&text.length<=256)return {kind:'anchor',id:text};
 return null;
}
export function resourceRangeLabel(range:ResourceRange):string {
 const point=(p:ResourcePoint,book=true):string=>(book?BOOKS[p.book-1]?.name+' ':'')+p.chapter+(p.verse===undefined?'':':'+p.verse);
 if(!range.end)return point(range.start);
 if(range.start.book===range.end.book&&range.start.chapter===range.end.chapter)return point(range.start)+(range.end.verse===undefined?'':'–'+range.end.verse);
 return point(range.start)+'–'+point(range.end,range.start.book!==range.end.book);
}
export interface ResourceEntryResolution {entries:ReadingEntry[];reason?:string}
/** Indexed once per displayed module, retaining duplicate source-address ambiguity. */
export class ResourceEntryIndex {
 private journal=new Map<string,ReadingEntry[]>();private dictionary=new Map<string,ReadingEntry[]>();
 constructor(private readonly module:ReadingModule){
  for(const entry of module.entries){
   if(entry.sourceId!==undefined)this.add(this.journal,entry.sourceId,entry);
   if(module.kind==='dictionary')this.add(this.dictionary,entry.key,entry);
  }
 }
 private add(map:Map<string,ReadingEntry[]>,key:string,entry:ReadingEntry):void{map.set(key,[...map.get(key)??[],entry]);}
 resolve(target:Extract<ResourceLink,{kind:'entry'|'scripture'|'commentary'}>):ResourceEntryResolution {
  const no=(reason:string):ResourceEntryResolution=>({entries:[],reason});
  if(target.module&&![this.module.id,this.module.metadata?.abbreviation].some(alias=>alias?.toLocaleLowerCase()===target.module!.toLocaleLowerCase()))return no('The linked module '+target.module+' is not this resource. Its source address is retained.');
  if(target.kind==='scripture')return no('Open this reference in an offline Bible preview.');
  if(target.kind==='commentary'){
   if(this.module.kind!=='commentary')return no('This resource is not the linked commentary.');
   const start=pointOrder(target.range.start),end=pointOrder(target.range.end??target.range.start);
   const entries=this.module.entries.filter(entry=>{const ref=entry.reference;return ref&&pointOrder({book:ref.book,chapter:ref.chapter,verse:ref.verse})<=end&&pointOrder({book:ref.book,chapter:ref.chapter,verse:ref.endVerse})>=start;});
   return entries.length?{entries}:no('This commentary supplies no entry at that source coordinate.');
  }
  const isDictionary=target.collection==='dictionary';
  if(isDictionary&&this.module.kind!=='dictionary'||!isDictionary&&!['book','devotional','graphics'].includes(this.module.kind))return no('The linked entry type is not available in this resource.');
  const entries=(isDictionary?this.dictionary.get(target.id.normalize('NFKC').toLocaleLowerCase()):this.journal.get(target.id))??[];
  if(entries.length>1)return no('The source entry address is ambiguous. No entry was selected.');
  if(!entries.length)return no(!isDictionary&&this.module.entries.some(entry=>entry.sourceId===undefined)?'This saved package lacks retained Journal source IDs. Reinstall or reimport this resource to enable its entry links.':'The linked entry is not supplied by this resource.');
  return {entries};
 }
}
