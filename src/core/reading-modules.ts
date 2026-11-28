import type { Database, SqlJsStatic } from 'sql.js';
import {readModuleSourceMetadata,type ModuleSourceMetadata} from './module-source-metadata';

export type ReadingKind = 'book' | 'devotional' | 'graphics' | 'bible' | 'commentary' | 'dictionary';
export interface ReadingSource { id: string; type: ReadingKind; title: string; sourcePage: string; sha256: string }
export interface DevotionalDate { month: number; day: number; period: 'morning' | 'evening' }
export type ReadingBlock = {type:'text';text:string} | {type:'image';image:string;caption:string};
export interface ReadingEntry { key:string; title:string; blocks:ReadingBlock[]; date?:DevotionalDate; source?:string; sourceId?:string; reference?:{book:number;chapter:number;verse:number;endVerse:number} }
export interface ReadingImage { mime:string; base64:string }
export interface LocalFileProvenance {
 kind:'local-file';fileName:string;sourceSha256:string;databaseSha256:string;compressed:boolean;citation:string;
}
export interface ReadingModule {
 format:1; id:string; kind:ReadingKind; title:string; author:string; version:string;
 sourcePage:string; sourceSha256:string; notice:string; entries:ReadingEntry[]; images:Record<string,ReadingImage>;
 metadata?:ModuleSourceMetadata;
 provenance?:LocalFileProvenance;
 discovery?:{collection:string;url:string;member:string;databaseSha256:string};
}
export const MAX_READING_BYTES = 64 * 1024 * 1024;
export function checkCancelled(signal?:AbortSignal):void { if(signal?.aborted) throw new Error('Installation cancelled.'); }
export function devotionalDate(id:string):DevotionalDate|null {
 const match=/^(\d{2}) (AM|PM) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.exec(id);
 if(!match) return null;
 const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(match[3])+1;
 const day=Number(match[1]);
 if(day<1 || day>[31,29,31,30,31,30,31,31,30,31,30,31][month-1]) return null;
 return {month,day,period:match[2]==='AM'?'morning':'evening'};
}
export function decodeReadingEntities(value:string):string {
 const named:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',mdash:'—',ndash:'–',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',hellip:'…'};
 return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(all,key:string)=>{
  if(key[0]!=='#') return Object.hasOwn(named,key.toLowerCase())?named[key.toLowerCase()]:all;
  const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));
  return n>0 && n<=0x10ffff && !(n>=0xd800 && n<=0xdfff)?String.fromCodePoint(n):'�';
 });
}
/** Never produces DOM, CSS, executable links or remote image requests. */
export function readingBlocks(html:string, images:Record<string,ReadingImage>):ReadingBlock[] {
 const clean=html.replace(/<(script|style|iframe|object)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
 const blocks:ReadingBlock[]=[];
 let start=0;
 const text=(part:string):void=>{
  const plain=decodeReadingEntities(part.replace(/<(?:br\b[^>]*|\/(?:p|div|h[1-6]|li|tr|blockquote))>/gi,'\n\n').replace(/<[^>]*>/g,''));
  for(const paragraph of plain.split(/\n\s*\n/)) {
   const value=paragraph.replace(/\s+/g,' ').trim(); if(value) blocks.push({type:'text',text:value});
  }
 };
 const pattern=/<img\b[^>]*>/gi;
 for(const match of clean.matchAll(pattern)) {
  text(clean.slice(start,match.index)); start=match.index!+match[0].length;
  const src=/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(match[0]);
  const key=decodeReadingEntities(src?.[1]??src?.[2]??src?.[3]??'');
  if(Object.hasOwn(images,key)) {
   const alt=/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(match[0]);
   blocks.push({type:'image',image:key,caption:decodeReadingEntities(alt?.[1]??alt?.[2]??'').slice(0,500)});
  }
 }
 text(clean.slice(start));return blocks;
}
export function modulePlainText(entry:ReadingEntry):string {return entry.blocks.filter(b=>b.type==='text').map(b=>b.text).join('\n\n');}
function columns(db:Database,table:'details'|'journal'|'data'):Set<string> {
 return new Set(db.exec(`PRAGMA table_info("${table}")`)[0]?.values.map(row=>String(row[1]).toLowerCase())??[]);
}
function rasterMime(data:Uint8Array):string|null {
 if(data[0]===255 && data[1]===216 && data[2]===255) return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((v,i)=>data[i]===v)) return 'image/png';
 if(new TextDecoder().decode(data.slice(0,6)).match(/^GIF8[79]a$/)) return 'image/gif';
 if(new TextDecoder().decode(data.slice(0,4))==='RIFF' && new TextDecoder().decode(data.slice(8,12))==='WEBP') return 'image/webp';
 return null;
}
function base64(bytes:Uint8Array):string {
 let result=''; for(let i=0;i<bytes.length;i+=8192) result+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(result);
}
export async function normalizeReadingModule(sql:SqlJsStatic,bytes:Uint8Array,source:ReadingSource,signal?:AbortSignal):Promise<ReadingModule> {
 checkCancelled(signal);
 if(bytes.length<100 || bytes.length>MAX_READING_BYTES || new TextDecoder().decode(bytes.slice(0,16))!=='SQLite format 3\0') throw new Error('Unsupported or damaged SQLite module.');
 const db=new sql.Database(bytes);
 try {
  db.run('PRAGMA trusted_schema=OFF');db.run('PRAGMA query_only=ON');
  if(db.exec('PRAGMA quick_check(1)')[0]?.values[0]?.[0]!=='ok') throw new Error('Module integrity check failed.');
  const tables=new Set(db.exec("SELECT lower(name) FROM sqlite_master WHERE type='table' AND sql NOT LIKE 'CREATE VIRTUAL%'")[0]?.values.map(r=>String(r[0]))??[]);
  if(!tables.has('details') || !tables.has('journal')) throw new Error('A Book-container module with physical Details and Journal tables is required.');
  if(!['id','title','content','relativeorder','hidden'].every(c=>columns(db,'journal').has(c))) throw new Error('Unsupported Journal schema.');
  const details=db.exec('SELECT * FROM details LIMIT 2')[0];
  if(!details || details.values.length!==1) throw new Error('Expected exactly one Details record.');
  const meta=Object.fromEntries(details.columns.map((name,i)=>[name.toLowerCase(),details.values[0][i]]));
  const str=(v:unknown,max=300):string=>typeof v==='string'?v.slice(0,max).trim():'';
  const images:Record<string,ReadingImage>=Object.create(null);
  if(tables.has('data') && ['id','filename','content'].every(c=>columns(db,'data').has(c))) {
   const rows=db.exec('SELECT id,filename,content FROM data LIMIT 501')[0]?.values??[];
   if(rows.length>500) throw new Error('Module has too many embedded assets.');
   let total=0;
   for(const row of rows) {
    checkCancelled(signal); const data=row[2];
    if(!(data instanceof Uint8Array)) continue;
    total+=data.length; if(data.length>12*1024*1024 || total>48*1024*1024) throw new Error('Embedded images exceed the storage limit.');
    const mime=rasterMime(data); if(!mime) continue;
    const image={mime,base64:base64(data)};
    for(const key of [row[0],row[1]]) if(typeof key==='string' && /^[\w .()-]{1,160}$/.test(key)) images[key]=image;
    await new Promise<void>(resolve=>setTimeout(resolve,0));
   }
  }
  const stmt=db.prepare('SELECT rowid,id,title,content FROM journal WHERE coalesce(hidden,0)=0 ORDER BY relativeorder,rowid LIMIT 10001');
  const entries:ReadingEntry[]=[];
  let total=0;
  try {while(stmt.step()) {
   checkCancelled(signal);const row=stmt.get();
   if(entries.length>=10000 || typeof row[3]!=='string' || row[3].length>1024*1024) throw new Error('Unsupported entry count or content length.');
   total+=row[3].length; if(total>32*1024*1024) throw new Error('Module text exceeds the storage limit.');
   if(typeof row[1]!=='string'||!row[1].length||row[1].length>512)throw new Error('Unsupported Journal source ID.');
   const entry:ReadingEntry={key:String(row[0]),sourceId:row[1],title:str(row[2])||str(row[1])||'Untitled',blocks:readingBlocks(row[3],images),source:row[3]};
   if(source.type==='devotional') {const date=devotionalDate(str(row[1]));if(date) entry.date=date;}
   entries.push(entry); if(entries.length%25===0) await new Promise<void>(resolve=>setTimeout(resolve,0));
  }}finally{stmt.free();}
  if(!entries.length) throw new Error('Module has no readable entries.');
  if(source.type==='devotional' && !entries.some(entry=>entry.date)) throw new Error('No supported dated devotional entries were found.');
  if(source.type==='graphics' && !entries.some(entry=>entry.blocks.some(b=>b.type==='image'))) throw new Error('No supported embedded images were found.');
  return {format:1,id:source.id,kind:source.type,title:str(meta.title)||source.title,author:str(meta.author),version:str(meta.versiondate)||str(meta.version),sourcePage:source.sourcePage,sourceSha256:source.sha256,notice:readingBlocks(str(meta.comments,20000),{}).filter(b=>b.type==='text').map(b=>b.text).join('\n\n'),metadata:readModuleSourceMetadata(meta),entries,images};
 }finally{db.close();}
}
