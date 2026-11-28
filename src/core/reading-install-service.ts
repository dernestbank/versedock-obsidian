import { COLLECTIONS, pinnedSource, sourceUrl, type DiscoveryEntry } from './discovery-sources';
import type { SqlJsStatic } from 'sql.js';
import {moduleFailureMessage} from './module-errors';
import { readingSource, type InstallableReadingSource } from './reading-catalogue';
import { normalizeModuleContent } from './normalize-module';
import { checkCancelled, MAX_READING_BYTES, type ReadingModule } from './reading-modules';
import { gunzipBounded, installedModuleFootprint, promoteReadingModule, readInstalledModule, sha256, type InstalledReadingModule, type ModuleStore } from './module-installation';
import { ModuleManagement } from './module-management';
import {ModuleStorage,type StorageReview} from './module-storage';
import { localImportPreview, prepareLocalModule, type LocalFileInput, type LocalImportPreview, type PreparedLocalModule } from './local-module-import';
import type { ReadingKind } from './reading-modules';
export type InstallStatus='queued'|'downloading'|'verifying'|'preparing'|'saving'|'ready'|'cancelled'|'failed';
export interface ReadingInstallJob {id:string;title:string;status:InstallStatus;received:number;total:number;error?:string}
export type ModuleDownloader=((source:InstallableReadingSource,signal:AbortSignal,progress:(bytes:number)=>void)=>Promise<Uint8Array>)&{capabilities?:{networkAbort:boolean;resume:boolean}};
/** Some HTTP stacks honor Content-Encoding: x-gzip and return the SQLite body. */
export async function verifyReadingDownload(source:InstallableReadingSource,bytes:Uint8Array,signal?:AbortSignal):Promise<Uint8Array>{
 checkCancelled(signal);
 let raw:Uint8Array;
 if(bytes[0]===31 && bytes[1]===139){
  if(bytes.length!==source.compressedBytes || await sha256(bytes)!==source.sha256)throw new Error('Publisher file changed or failed its checksum. No module was activated.');
  raw=await gunzipBounded(bytes,undefined,signal);
 }else raw=bytes;
 if(raw.length!==source.databaseBytes || await sha256(raw)!==source.databaseSha256)throw new Error('Publisher database changed or failed its checksum. No module was activated.');
 checkCancelled(signal);return raw;
}
export class ReadingInstallService {
 installed:InstalledReadingModule[]=[];
 readonly jobs=new Map<string,ReadingInstallJob>();
 private listeners=new Set<()=>void>();private controllers=new Map<string,AbortController>();
 private queue:Promise<void>=Promise.resolve(); private cached:{directory:string;module:ReadingModule}|null=null;
 private previewRevision=0;
 private previewController:AbortController|null=null;
 private stopped=false;
 private readonly lifetime=new AbortController();
 private localPreview:{ticket:string;prepared:PreparedLocalModule}|null=null;
 private readonly management:ModuleManagement;
 private readonly storage:ModuleStorage;
 constructor(private readonly store:ModuleStore,private readonly sql:()=>Promise<SqlJsStatic>,private readonly download:ModuleDownloader,
  private readonly protectedIds:()=>readonly string[]=()=>[]){this.management=new ModuleManagement(store);this.storage=new ModuleStorage(store,this.management);}
 get generations(){return this.management.generations;}
 get downloadCapabilities(){return this.download.capabilities??{networkAbort:false,resume:false};}
 get removed(){return this.management.removed;}
 get problems(){return this.management.problems;}
 get pendingStages(){return this.management.pendingStages;}
 get requiresRecovery(){return this.management.requiresRecovery;}
 subscribe(callback:()=>void):()=>void{this.listeners.add(callback);return()=>this.listeners.delete(callback);}
 storageSummary():{bytes:number;files:number}{return this.installed.reduce((total,item)=>{const used=installedModuleFootprint(item);return {bytes:total.bytes+used.bytes,files:total.files+used.files};},{bytes:0,files:0});}
 private assertRunning():void{if(this.stopped)throw new Error('The resource installer has stopped. Reopen SwordDock before making changes.');}
 private async queueWork<T>(action:()=>Promise<T>):Promise<T>{
  this.assertRunning();
  const task=this.queue.then(()=>{this.assertRunning();return action();});this.queue=task.then(()=>{},()=>{});return task;
 }
 previewStorage():Promise<StorageReview>{return this.queueWork(async()=>{await this.management.initialize();this.assertRunning();this.synchronizeInventory();const review=await this.storage.preview();this.assertRunning();return review;});}
 cleanupStorage(ticket:string,directories:readonly string[]){return this.queueWork(async()=>{try{return await this.storage.cleanup(ticket,directories,this.lifetime.signal);}finally{this.synchronizeInventory();}});}
 recoverStage(ticket:string,directory:string){return this.queueWork(async()=>{try{return await this.storage.recover(ticket,directory,this.lifetime.signal);}finally{this.synchronizeInventory();}});}
 private emit():void{for(const listener of this.listeners)listener();}
 private synchronizeInventory():void{this.installed=this.management.installed;this.cached=null;this.emit();}
 async initialize():Promise<void>{
  await this.management.initialize();this.synchronizeInventory();
 }
 private manage(action:()=>Promise<void>):Promise<void>{
  return this.queueWork(async()=>{await action();this.synchronizeInventory();});
 }
 useVersion(directory:string):Promise<void>{return this.manage(()=>this.management.useVersion(directory,this.lifetime.signal));}
 remove(id:string):Promise<void>{return this.manage(()=>this.management.remove(id,this.protectedIds,this.lifetime.signal));}
 restore(id:string):Promise<void>{return this.manage(()=>this.management.restore(id,this.lifetime.signal));}
 recoverSelections():Promise<void>{return this.manage(()=>this.management.recoverSelections(this.lifetime.signal));}
 refreshManagement():Promise<void>{return this.manage(()=>this.management.initialize());}
 async readVersion(directory:string):Promise<ReadingModule>{
  const info=this.generations.find(info=>info.directory===directory);if(!info)throw Error('This stored version is unavailable.');
  return readInstalledModule(this.store,info);
 }
 install(id:string):Promise<void>{
  if(this.stopped)return Promise.resolve();
  const source=readingSource(id);if(!source)return Promise.reject(new Error('This resource has no validated installer.'));
  const existing=this.controllers.get(id);
  if(existing)return existing.signal.aborted?this.queue.then(()=>this.install(id)):this.queue;
  const controller=new AbortController();this.controllers.set(id,controller);
  const job:ReadingInstallJob={id,title:source.title,status:'queued',received:0,total:source.compressedBytes};this.jobs.set(id,job);this.emit();
  const update=(status:InstallStatus):void=>{job.status=status;this.emit();};
  const task=this.queue.then(async()=>{
   try {
    checkCancelled(controller.signal);update('downloading');
    let lastProgressAt=-Infinity;
    const bytes=await this.download(source,controller.signal,received=>{if(!controller.signal.aborted){
     job.received=received;const now=performance.now();if(received===job.total||now-lastProgressAt>=100){lastProgressAt=now;this.emit();}
    }});
    checkCancelled(controller.signal);update('verifying');
    const raw=await verifyReadingDownload(source,bytes,controller.signal);update('preparing');
    const content=await normalizeModuleContent(await this.sql(),raw,source,controller.signal);update('saving');
    await this.management.ensureBaseline(controller.signal);
    const info=await promoteReadingModule(this.store,content,controller.signal);
    await this.management.activate(info,controller.signal);this.synchronizeInventory();update('ready');
   }catch(error){job.error=moduleFailureMessage(error,'Installation failed.');update(controller.signal.aborted?'cancelled':'failed');}
   finally{this.controllers.delete(id);}
  });
  this.queue=task.catch(()=>{});return task;
 }
 cancel(id:string):void{this.controllers.get(id)?.abort();const job=this.jobs.get(id);if(job && !['ready','failed'].includes(job.status)){job.status='cancelled';this.emit();}}
 async previewLocalFile(input:LocalFileInput,kind?:ReadingKind,signal?:AbortSignal):Promise<LocalImportPreview>{
  this.assertRunning();this.discardLocalPreview();
  const revision=this.previewRevision,controller=new AbortController();this.previewController=controller;
  const cancel=():void=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  try{
   checkCancelled(controller.signal);
   // Copy before awaiting WASM so later caller mutations cannot alter the reviewed file.
   if(input.bytes.length>MAX_READING_BYTES)throw new Error('Selected file exceeds the 64 MiB import limit.');
   const owned={name:input.name,bytes:new Uint8Array(input.bytes)};
   const sql=await this.sql();this.assertRunning();
   if(revision!==this.previewRevision)throw new Error('This preview was replaced. Review the selected file again.');
   checkCancelled(controller.signal);
   const prepared=await prepareLocalModule(sql,owned,kind,controller.signal);
   this.assertRunning();checkCancelled(controller.signal);
   if(revision!==this.previewRevision)throw new Error('This preview was replaced. Review the selected file again.');
   const ticket=crypto.randomUUID();this.localPreview={ticket,prepared};return localImportPreview(prepared,ticket);
  }finally{
   signal?.removeEventListener('abort',cancel);
   if(this.previewController===controller)this.previewController=null;
  }
 }
 discardLocalPreview(ticket?:string):void{
  if(ticket!==undefined&&this.localPreview?.ticket!==ticket)return;
  this.previewController?.abort();this.previewController=null;
  this.previewRevision++;this.localPreview=null;
 }
 installLocalFile(ticket:string,citation:string):Promise<InstalledReadingModule>{
  if(!this.localPreview||this.localPreview.ticket!==ticket)return Promise.reject(new Error('Review this file in a fresh preview before installing.'));
  if(typeof citation!=='string'||citation.length>2000)return Promise.reject(new Error('Local provenance notes must be at most 2000 characters.'));
  const original=this.localPreview.prepared.module;
  const module:ReadingModule={...original,provenance:{...original.provenance!,citation:citation.trim()}};
  const id=module.id;
  if(this.controllers.has(id))return Promise.reject(new Error('This resource already has an active installation.'));
  const controller=new AbortController();this.controllers.set(id,controller);
  const job:ReadingInstallJob={id,title:module.title,status:'queued',received:0,total:this.localPreview.prepared.preparedBytes};this.jobs.set(id,job);this.emit();
  const task=this.queue.then(async()=>{
   try{
    checkCancelled(controller.signal);job.status='saving';this.emit();
    await this.management.ensureBaseline(controller.signal);
    const info=await promoteReadingModule(this.store,module,controller.signal);
    await this.management.activate(info,controller.signal);this.synchronizeInventory();job.status='ready';this.emit();return info;
   }catch(error){job.error=moduleFailureMessage(error,'Local import failed.');job.status=controller.signal.aborted?'cancelled':'failed';this.emit();throw new Error(job.error);}
   finally{this.controllers.delete(id);}
  });
  this.queue=task.then(()=>{},()=>{});return task;
 }
 installPublisherMember(entry:DiscoveryEntry,input:LocalFileInput,member:string,archiveHash:string,signal:AbortSignal):Promise<InstalledReadingModule>{
  return this.queueWork(async()=>{
   const controller=new AbortController(),abort=()=>controller.abort();
   signal.addEventListener('abort',abort,{once:true});this.lifetime.signal.addEventListener('abort',abort,{once:true});
   try{
    checkCancelled(signal);checkCancelled(this.lifetime.signal);
    const collection=COLLECTIONS.find(c=>c.key===entry.collection);
    if(!entry.url||!collection||sourceUrl(collection,entry.url,collection.url,true)!==entry.url||pinnedSource(entry.url))throw Error('Invalid discovery download.');
    // The schema identifies Bible, dictionary and commentary modules. Journals
    // need an explicit category to distinguish books, devotionals and atlases.
    const hint=collection.format==='official'?entry.kind:undefined;
    const {module}=await prepareLocalModule(await this.sql(),input,hint,controller.signal);
    const databaseSha256=module.provenance!.databaseSha256;
    const identity=await sha256(new TextEncoder().encode([collection.key,entry.url,member].join('\n')));
    module.id='online-'+module.kind+'-'+identity.slice(0,24);
    delete module.provenance;module.sourcePage=entry.page;module.sourceSha256=archiveHash;
    module.discovery={collection:collection.key,url:entry.url,member,databaseSha256};
    await this.management.ensureBaseline(controller.signal);
    const info=await promoteReadingModule(this.store,module,controller.signal);
    await this.management.activate(info,controller.signal);this.synchronizeInventory();return info;
   }finally{signal.removeEventListener('abort',abort);this.lifetime.signal.removeEventListener('abort',abort);}
  });
 }
 async verify(id:string):Promise<void>{const info=this.installed.find(item=>item.id===id);if(!info)throw new Error("Resource is not installed.");await readInstalledModule(this.store,info);}
 stop():void{this.stopped=true;this.lifetime.abort();for(const controller of this.controllers.values())controller.abort();this.listeners.clear();this.cached=null;this.discardLocalPreview();this.storage.discard();}
 async load(id:string):Promise<ReadingModule>{
  const info=this.installed.find(item=>item.id===id);if(!info)throw new Error('This resource is not installed.');
  if(this.cached?.directory===info.directory)return this.cached.module;
  const module=await readInstalledModule(this.store,info);this.cached={directory:info.directory,module};return module;
 }
}
