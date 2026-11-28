import {isDiscoveredId} from './discovery-sources';
import {installedModuleFootprint,parseInstalledInfo,promoteReadingModule,readInstalledModule,sha256,type InstalledReadingModule,type ModuleMeasurement,type ModuleStore} from './module-installation';
import {isModuleDirectory,isStageDirectory,isStateDirectory,isStorageLeaf} from './module-paths';
import {parseModuleOwner} from './module-ownership';
import type {ModuleManagement} from './module-management';
import {readingSource,READING_SOURCES} from './reading-catalogue';
import {PartialDownloads,downloadOwnerTarget} from './partial-downloads';
import {isLocalModuleId} from './module-provenance';
import {moduleOrigin,moduleSourceNotice} from './module-provenance';
import {checkCancelled,type ReadingModule} from './reading-modules';

export type StorageCategory='active'|'removed'|'retained'|'damaged'|'staging'|'management'|'unknown';
export interface StorageReviewItem {
 directory:string;title:string;category:StorageCategory;bytes:number|null;files:number|null;
 cleanupEligible:boolean;recoverable:boolean;reason:string;
 staged?:{id:string;kind:string;entries:number;sourceSha256:string;contentSha256:string;origin:string;notice:string};
 download?:{id:string;received:number;total:number};
}
export interface StorageReview {ticket:string;items:StorageReviewItem[];looseFiles:{bytes:number;files:number;complete:boolean}|null;totalBytes:number;totalFiles:number;complete:boolean;cleanupBytes:number;cleanupFiles:number}
interface InspectedItem {view:StorageReviewItem;fingerprint:string;measurementComplete:boolean}
const allowed=(info:InstalledReadingModule):boolean=>!!readingSource(info.id)||(isLocalModuleId(info.id,info.kind)||isDiscoveredId(info.id,info.kind));

/** Review tickets bind cleanup/recovery to the exact verified files the user saw. */
export class ModuleStorage {
 private review:{ticket:string;items:InspectedItem[]}|null=null;
 constructor(private readonly store:ModuleStore,private readonly management:ModuleManagement){}

 private async readOptional(directory:string,file:'content'|'manifest'|'owner'):Promise<string|null>{
  try{return await this.store.read(directory+'/'+file+'.json');}catch{return null;}
 }
 private async stageContent(directory:string):Promise<{info:InstalledReadingModule;module:ReadingModule}>{
  if(!isStageDirectory(directory))throw Error('Invalid staging directory.');
  const manifest=await this.store.read(directory+'/manifest.json');
  if(manifest.length>10000)throw Error('Invalid staging manifest.');
  const declared=JSON.parse(manifest) as InstalledReadingModule;
  const info=parseInstalledInfo(manifest,declared.directory);
  if(!allowed(info))throw Error('Unrecognized staged resource.');
  const module=await readInstalledModule({read:async path=>{
   const file=path===info.directory+'/content.json'?'content.json':path===info.directory+'/owner.json'?'owner.json':null;
   if(!file)throw Error('Invalid staging read.');return this.store.read(directory+'/'+file);
  }},info);
  return {info,module};
 }
 private async inspect(directory:string,protectedPaths:Set<string>,blocked:boolean):Promise<InspectedItem>{
  const view:StorageReviewItem={directory,title:directory,category:'unknown',bytes:null,files:null,cleanupEligible:false,recoverable:false,reason:'Unrecognized data is kept for manual review.'};
  if(!isStorageLeaf(directory))return {view,fingerprint:'',measurementComplete:false};
  let measure:ModuleMeasurement|undefined;
  try{measure=await this.store.measure?.(directory);if(measure){view.bytes=measure.bytes;view.files=measure.files;}}catch{/* Unmeasured data stays visible and cannot be cleaned. */}
  if(!isModuleDirectory(directory)&&!isStageDirectory(directory)&&!isStateDirectory(directory))return {view,fingerprint:'',measurementComplete:measure?.complete??false};
  const [content,manifest,ownerRaw]=await Promise.all([this.readOptional(directory,'content'),this.readOptional(directory,'manifest'),this.readOptional(directory,'owner')]);
  let owned=false,downloadSource:ReturnType<typeof readingSource>=null;
  try{const owner=parseModuleOwner(ownerRaw??'');owned=isStageDirectory(directory)?owner.stage===directory:owner.target===directory;
   if(owned&&owner.purpose==='download')downloadSource=READING_SOURCES.find(source=>downloadOwnerTarget(source)===owner.target)??null;
  }catch{/* Legacy complete manifests can establish ownership below. */}
  if(isModuleDirectory(directory)){
   const info=this.management.generations.find(info=>info.directory===directory);
   view.category=this.management.installed.some(info=>info.directory===directory)?'active'
    :this.management.removed.some(info=>info.directory===directory)?'removed':info?'retained':'damaged';
   view.title=info?.title??directory;
   try{const parsed=parseInstalledInfo(manifest??'',directory);if(allowed(parsed)){owned=true;view.title=parsed.title;}}catch{/* Ownership marker is required when the manifest is invalid. */}
   if(!measure&&info){const footprint=installedModuleFootprint(info);view.bytes=footprint.bytes;view.files=footprint.files;}
  }else if(isStateDirectory(directory)){
   view.category='management';owned=owned||await this.management.ownsState(directory);
  }else{
   view.category='staging';
   const prefix=downloadSource?await new PartialDownloads(this.store).read(directory,downloadSource):null;
   if(prefix&&downloadSource){view.title=downloadSource.title+' · partial download';view.download={id:downloadSource.id,received:prefix.bytes.length,total:downloadSource.compressedBytes};}
   try{const stage=await this.stageContent(directory);owned=true;view.title=stage.info.title;
    view.recoverable=!blocked&&!this.management.installed.some(info=>info.id===stage.info.id&&info.sha256===stage.info.sha256);
    view.staged={id:stage.info.id,kind:stage.info.kind,entries:stage.info.entryCount,sourceSha256:stage.info.sourceSha256,contentSha256:stage.info.sha256,origin:moduleOrigin(stage.module),notice:moduleSourceNotice(stage.module)};
   }catch{/* Incomplete owned stages can be trashed but never activated. */}
  }
  view.cleanupEligible=!!this.store.trash&&!!measure?.complete&&!!measure.onlyKnownFiles&&owned&&!protectedPaths.has(directory)&&!blocked;
  view.reason=blocked?'Management recovery must be reviewed first.':protectedPaths.has(directory)?'Protected active, restore or rollback data.'
   :!owned?'Ownership could not be verified; retained for manual review.':!measure?.complete?'Complete measurement is unavailable.'
   :!measure.onlyKnownFiles?'Contains unexpected files; retained for manual review.':!this.store.trash?'Reversible Trash is unavailable.'
   :view.recoverable?'Verified staged resource; review Recover or move the copy to Trash.':view.download?'Saved partial download. Retry this resource to resume, or move its saved bytes to Trash.':'Unused managed data can be moved to Trash.';
  const hashes=await Promise.all([content,manifest,ownerRaw].map(raw=>raw===null?null:sha256(new TextEncoder().encode(raw))));
  const fingerprint=await sha256(new TextEncoder().encode(JSON.stringify([measure??null,...hashes])));
  return {view,fingerprint,measurementComplete:measure?.complete??false};
 }
 private async scan():Promise<InspectedItem[]>{
  let protectedPaths=new Set<string>(),blocked=false;
  try{protectedPaths=await this.management.storageProtection();}catch{blocked=true;}
  const directories=await this.store.directories();if(directories.length>20000)throw Error('Storage review exceeds the directory limit.');
  const items:InspectedItem[]=[];
  for(const directory of directories.sort())items.push(await this.inspect(directory,protectedPaths,blocked));
  return items;
 }
 async preview():Promise<StorageReview>{
  const items=await this.scan(),ticket=crypto.randomUUID();this.review={ticket,items};
  const views=items.map(item=>({...item.view,...(item.view.staged?{staged:{...item.view.staged}}:{}),...(item.view.download?{download:{...item.view.download}}:{})}));
  let looseFiles:StorageReview['looseFiles']=null;try{looseFiles=await this.store.measureLooseFiles?.()??null;}catch{/* Incomplete totals stay labelled. */}
  return {ticket,items:views,looseFiles,totalBytes:views.reduce((n,item)=>n+(item.bytes??0),looseFiles?.bytes??0),totalFiles:views.reduce((n,item)=>n+(item.files??0),looseFiles?.files??0),
   complete:items.every(item=>item.measurementComplete)&&!!this.store.measure&&!!looseFiles?.complete,
   cleanupBytes:views.filter(item=>item.cleanupEligible).reduce((n,item)=>n+(item.bytes??0),0),cleanupFiles:views.filter(item=>item.cleanupEligible).reduce((n,item)=>n+(item.files??0),0)};
 }
 async cleanup(ticket:string,directories:readonly string[],signal?:AbortSignal):Promise<{moved:number;bytes:number;files:number}>{
  checkCancelled(signal);
  const review=this.review;if(!review||review.ticket!==ticket)throw Error('Review resource storage again before cleanup.');
  if(!this.store.trash)throw Error('Reversible Trash is unavailable.');
  const selected=[...new Set(directories)];if(selected.length>5000)throw Error('Cleanup selection exceeds its limit.');
  for(const directory of selected)if(!review.items.some(item=>item.view.directory===directory&&item.view.cleanupEligible))throw Error('This directory was not eligible in the reviewed cleanup.');
  await this.management.initialize();const fresh=await this.scan();
  for(const directory of selected){
   const old=review.items.find(item=>item.view.directory===directory)!,now=fresh.find(item=>item.view.directory===directory);
   if(!now?.view.cleanupEligible||now.fingerprint!==old.fingerprint)throw Error('Storage changed or is protected. Review cleanup again.');
  }
  let moved=0,bytes=0,files=0;
  for(const directory of selected){
   const current=fresh.find(item=>item.view.directory===directory)!;
   const rechecked=await this.inspect(directory,await this.management.storageProtection(),false);
   if(!rechecked.view.cleanupEligible||rechecked.fingerprint!==current.fingerprint)throw Error('Storage changed during cleanup. '+moved+' folder(s) were already moved to Trash.');
   if(signal?.aborted)throw Error('Storage cleanup cancelled after '+moved+' folder(s) moved to Trash. Remaining files are retained.');
   try{await this.store.trash(directory);}catch{throw Error('Cleanup stopped after '+moved+' folder(s) moved to Trash. Remaining files are retained.');}
   moved++;bytes+=current.view.bytes??0;files+=current.view.files??0;
  }
  this.review=null;await this.management.initialize();return {moved,bytes,files};
 }
 async recover(ticket:string,directory:string,signal?:AbortSignal):Promise<InstalledReadingModule>{
  checkCancelled(signal);
  const review=this.review,old=review?.items.find(item=>item.view.directory===directory&&item.view.recoverable);
  if(!review||review.ticket!==ticket||!old)throw Error('Review this staged resource before recovery.');
  await this.management.initialize();const fresh=(await this.scan()).find(item=>item.view.directory===directory);
  if(!fresh?.view.recoverable||fresh.fingerprint!==old.fingerprint)throw Error('The stage changed. Review it again before recovery.');
  const staged=await this.stageContent(directory);checkCancelled(signal);await this.management.ensureBaseline(signal);
  const info=await promoteReadingModule(this.store,staged.module,signal);await this.management.activate(info,signal);
  this.review=null;return info;
 }
 discard():void{this.review=null;}
}
