import { checkCancelled, MAX_READING_BYTES, type ReadingModule, type ReadingKind } from './reading-modules';
import { isLocalModuleId, validateLocalProvenance } from './module-provenance';
import {moduleOwner,parseModuleOwner} from './module-ownership';
export {isModuleDirectory} from './module-paths';
export interface ModuleMeasurement {bytes:number;files:number;complete:boolean;onlyKnownFiles:boolean}
export interface ModuleStore {
 mkdir(path:string):Promise<void>;read(path:string):Promise<string>;write(path:string,value:string):Promise<void>;
 rename(from:string,to:string):Promise<void>;remove(path:string):Promise<void>;directories():Promise<string[]>;
 measure?(directory:string):Promise<ModuleMeasurement>;
 measureLooseFiles?():Promise<{bytes:number;files:number;complete:boolean}>;
 trash?(directory:string):Promise<void>;
}
export interface InstalledReadingModule {
 format:1; id:string;kind:ReadingKind;title:string;author:string;version:string;directory:string;
 createdAt:number;bytes:number;sha256:string;sourceSha256:string;entryCount:number;
 files?:2|3;
}
export async function sha256(bytes:Uint8Array):Promise<string> {
 const digest=await crypto.subtle.digest('SHA-256',new Uint8Array(bytes).buffer);
 return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function gunzipBounded(bytes:Uint8Array,limit=MAX_READING_BYTES,signal?:AbortSignal):Promise<Uint8Array> {
 checkCancelled(signal);
 if(bytes[0]!==31 || bytes[1]!==139) throw new Error('The publisher did not return a gzip module.');
 const stream=new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('gzip'));
 const reader=stream.getReader();const chunks:Uint8Array[]=[];let size=0;
 const cancel=():void=>{void reader.cancel().catch(()=>{});};signal?.addEventListener('abort',cancel,{once:true});
 try {for(;;){checkCancelled(signal);const next=await reader.read();if(next.done)break;size+=next.value.length;
  if(size>limit)throw new Error('Expanded module exceeds the size limit.');chunks.push(next.value);
 }}finally{signal?.removeEventListener('abort',cancel);await reader.cancel().catch(()=>{});}
 checkCancelled(signal);const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
const safeId=(id:string):boolean=>/^[a-z0-9][a-z0-9-]{0,79}$/.test(id);
export function parseInstalledInfo(raw:string,directory:string):InstalledReadingModule {
 if(raw.length>10000)throw new Error('Invalid installed manifest.');const item=JSON.parse(raw) as InstalledReadingModule;
 if(item.format!==1 || !safeId(item.id) || !['book','devotional','graphics','bible','commentary','dictionary'].includes(item.kind)
  || !new RegExp('^'+item.id+'-[a-f0-9]{16}(?:-r-[a-f0-9]{8})?$').test(directory) || item.directory!==directory
  || typeof item.sha256!=='string'||typeof item.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(item.sha256) || !/^[a-f0-9]{64}$/.test(item.sourceSha256)
  || !directory.startsWith(item.id+'-'+item.sha256.slice(0,16))
  || !Number.isSafeInteger(item.bytes) || item.bytes<1 || item.bytes>MAX_READING_BYTES
  || !Number.isSafeInteger(item.entryCount) || item.entryCount<1 || item.entryCount>100000
  || (item.files!==undefined&&item.files!==2&&item.files!==3)||!Number.isFinite(item.createdAt) || typeof item.title!=='string' || item.title.length>300
  || typeof item.author!=='string' || item.author.length>300 || typeof item.version!=='string' || item.version.length>300)throw new Error('Invalid installed manifest.');
 return item;
}
export function installedModuleFootprint(info:InstalledReadingModule):{bytes:number;files:number}{
 const owner=info.files===3?moduleOwner('module',info.directory,'.stage-'+'0'.repeat(36)):'';
 return {bytes:info.bytes+new TextEncoder().encode(JSON.stringify(info)+owner).length,files:info.files??2};
}
export function validateReadingContent(module:ReadingModule):void {
 if(module.format!==1 || !safeId(module.id) || !['book','devotional','graphics','bible','commentary','dictionary'].includes(module.kind)
  || typeof module.title!=='string' || module.title.length>300 || typeof module.author!=='string' || module.author.length>300
  || typeof module.version!=='string'||module.version.length>300||typeof module.notice!=='string'||module.notice.length>110000
  || !/^[a-f0-9]{64}$/.test(module.sourceSha256) || !Array.isArray(module.entries) || !module.entries.length || module.entries.length>100000
  || !module.images || typeof module.images!=='object')throw new Error('Invalid reading content.');
 const study=['bible','commentary','dictionary'].includes(module.kind);
 if(study||module.metadata!==undefined){
  const meta=module.metadata;
  if(!meta||typeof meta!=='object'||typeof meta.strongs!=='boolean'||typeof meta.rightToLeft!=='boolean')throw new Error('Invalid study metadata.');
  for(const [key,limit]of [['title',3000],['abbreviation',80],['author',300],['language',40],['version',300],['notice',100000],['verseRules',100000],['customCss',100000]] as const)
   if(typeof meta[key]!=='string'||meta[key].length>limit)throw new Error('Invalid study metadata.');
 }
 const keys=new Set<string>();const coordinates=new Set<string>();
 for(const entry of module.entries){
  if(typeof entry.key!=='string' || entry.key.length>512 || keys.has(entry.key) || typeof entry.title!=='string' || entry.title.length>512 || !Array.isArray(entry.blocks) || entry.blocks.length>20000)throw new Error('Invalid reading entry.');
  keys.add(entry.key);
  if(entry.source!==undefined && (typeof entry.source!=='string'||entry.source.length>1024*1024))throw new Error('Invalid retained source text.');
  if(entry.sourceId!==undefined&&(typeof entry.sourceId!=='string'||!entry.sourceId.length||entry.sourceId.length>512))throw new Error('Invalid retained source ID.');
  if(entry.reference){const ref=entry.reference;
   if(![ref.book,ref.chapter,ref.verse,ref.endVerse].every(Number.isSafeInteger)||ref.book<1||ref.book>66||ref.chapter<0||ref.chapter>200||ref.verse<0||ref.endVerse<ref.verse||ref.endVerse>200)throw new Error('Invalid source reference.');
   const coordinate=[ref.book,ref.chapter,ref.verse,ref.endVerse].join('.');
   if(coordinates.has(coordinate))throw new Error('Duplicate source coordinate.');coordinates.add(coordinate);
  }
  if(study&&entry.source===undefined)throw new Error('Retained study source text is missing.');
  if(module.kind==='commentary'&&!entry.reference)throw new Error('Commentary source coordinates are missing.');
  if(module.kind==='bible'&&(!entry.reference||!entry.reference.chapter||!entry.reference.verse||entry.source===undefined))throw new Error('Bible source coordinates are missing.');
  if(entry.date && (!Number.isInteger(entry.date.month) || entry.date.month<1 || entry.date.month>12
   || !Number.isInteger(entry.date.day) || entry.date.day<1 || entry.date.day>31
   || !['morning','evening'].includes(entry.date.period)))throw new Error('Invalid devotional date.');
  for(const block of entry.blocks){
   if(block.type==='text'){if(typeof block.text!=='string' || block.text.length>1024*1024)throw new Error('Invalid reading text.');}
   else if(block.type==='image'){if(typeof block.image!=='string' || !Object.hasOwn(module.images,block.image) || typeof block.caption!=='string')throw new Error('Invalid image reference.');}
   else throw new Error('Unsupported reading block.');
  }
 }
 for(const image of Object.values(module.images))if(!['image/jpeg','image/png','image/gif','image/webp'].includes(image.mime)
  || typeof image.base64!=='string' || image.base64.length>16*1024*1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64))throw new Error('Invalid installed image.');
 if(module.kind==='devotional' && !module.entries.some(entry=>entry.date))throw new Error('No dated readings in installed devotional.');
 if(module.kind==='graphics' && !module.entries.some(entry=>entry.blocks.some(block=>block.type==='image')))throw new Error('No images in installed graphics module.');
 if(module.provenance || isLocalModuleId(module.id))validateLocalProvenance(module);
 else if(typeof module.sourcePage!=='string' || !module.sourcePage.startsWith('https://www.mysword.info/'))throw new Error('Invalid publisher source.');
}
export async function readInstalledModule(store:Pick<ModuleStore,'read'>,info:InstalledReadingModule):Promise<ReadingModule> {
 parseInstalledInfo(JSON.stringify(info),info.directory);
 if(info.files===3){const owner=parseModuleOwner(await store.read(info.directory+'/owner.json'));
  if(owner.purpose!=='module'||owner.target!==info.directory)throw Error('Installed ownership record does not match the resource.');
 }
 const raw=await store.read(info.directory+'/content.json');const bytes=new TextEncoder().encode(raw);
 if(bytes.length!==info.bytes || await sha256(bytes)!==info.sha256)throw new Error('Installed module checksum failed. Reinstall this resource.');
 const module=JSON.parse(raw) as ReadingModule;validateReadingContent(module);
 if(module.id!==info.id || module.kind!==info.kind || module.entries.length!==info.entryCount || module.sourceSha256!==info.sourceSha256
  || module.title!==info.title || module.author!==info.author || module.version!==info.version)throw new Error('Installed content does not match its manifest.');return module;
}
export async function promoteReadingModule(store:ModuleStore,module:ReadingModule,signal?:AbortSignal):Promise<InstalledReadingModule> {
 checkCancelled(signal);validateReadingContent(module);
 const raw=JSON.stringify(module);const bytes=new TextEncoder().encode(raw);
 if(bytes.length>MAX_READING_BYTES)throw new Error('Prepared module exceeds the size limit.');
 const hash=await sha256(bytes);const canonical=module.id+'-'+hash.slice(0,16);const directories=await store.directories();
 // Reuse only a complete verified generation, including its actual stored manifest.
 for(const candidate of directories.filter(path=>path===canonical||new RegExp('^'+canonical+'-r-[a-f0-9]{8}$').test(path))) {
  try {const existing=parseInstalledInfo(await store.read(candidate+'/manifest.json'),candidate);
   if(existing.sha256===hash){await readInstalledModule(store,existing);return existing;}
  }catch{/* Damaged originals remain available for inspection; repairs never overwrite them. */}
 }
 const directory=directories.includes(canonical)?canonical+'-r-'+crypto.randomUUID().replace(/-/g,'').slice(0,8):canonical;
 const info:InstalledReadingModule={format:1,id:module.id,kind:module.kind,title:module.title,author:module.author,version:module.version,directory,createdAt:Date.now(),bytes:bytes.length,sha256:hash,sourceSha256:module.sourceSha256,entryCount:module.entries.length,files:3};
 const stage='.stage-'+crypto.randomUUID();await store.mkdir(stage);
 try {
  const owner=moduleOwner('module',directory,stage);await store.write(stage+'/owner.json',owner);
  if(await store.read(stage+'/owner.json')!==owner)throw Error('Resource ownership verification failed.');
  await store.write(stage+'/content.json',raw);checkCancelled(signal);
  const roundtrip=await store.read(stage+'/content.json');
  if(await sha256(new TextEncoder().encode(roundtrip))!==hash)throw new Error('Staged module checksum failed.');
  const manifest=JSON.stringify(info);
  await store.write(stage+'/manifest.json',manifest);
  if(await store.read(stage+'/manifest.json')!==manifest)throw new Error('Staged manifest verification failed.');
  checkCancelled(signal);
  await store.rename(stage,directory);return info;
 }catch(error){await store.remove(stage).catch(()=>{});throw error;}
}
