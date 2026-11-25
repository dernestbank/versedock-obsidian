import type {InstallableReadingSource} from './reading-catalogue';
import {sha256,type ModuleStore} from './module-installation';
import {moduleOwner,parseModuleOwner} from './module-ownership';
import {isStageDirectory} from './module-paths';

export interface PartialDownload {directory:string;bytes:Uint8Array;etag:string;createdAt:number}
interface PartialManifest {
 format:1;purpose:'download';id:string;url:string;sourceSha256:string;databaseSha256:string;
 expectedBytes:number;received:number;etag:string;sha256:string;createdAt:number;
}
export const strongDownloadEtag=(value:unknown):value is string=>typeof value==='string'&&/^"[\x21\x23-\x7e]{0,200}"$/.test(value);
export const downloadOwnerTarget=(source:InstallableReadingSource):string=>'download-'+source.id+'-'+source.sha256;
function encode(bytes:Uint8Array):string{
 let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);
}

/** Immutable prefix snapshots share the owned staging/measurement/Trash boundary. */
export class PartialDownloads {
 constructor(private readonly store:ModuleStore){}
 private async owned(directory:string,source:InstallableReadingSource):Promise<boolean>{
  if(!isStageDirectory(directory))return false;
  try{const owner=parseModuleOwner(await this.store.read(directory+'/owner.json'));
   return owner.purpose==='download'&&owner.stage===directory&&owner.target===downloadOwnerTarget(source);
  }catch{return false;}
 }
 private async directories():Promise<string[]>{
  const directories=await this.store.directories();if(directories.length>20000)throw Error('Download storage exceeds its directory limit.');return directories.filter(isStageDirectory);
 }
 private async removeOwned(directory:string,source:InstallableReadingSource):Promise<void>{
  if(!await this.owned(directory,source))return;
  const measured=await this.store.measure?.(directory);
  if(!measured?.complete||!measured.onlyKnownFiles)return;
  if(await this.owned(directory,source))await this.store.remove(directory);
 }
 async latest(source:InstallableReadingSource):Promise<PartialDownload|null>{
  let latest:PartialDownload|null=null;
  for(const directory of await this.directories()){
   const candidate=await this.read(directory,source);
   if(candidate&&(!latest||candidate.createdAt>latest.createdAt||(candidate.createdAt===latest.createdAt&&candidate.bytes.length>latest.bytes.length)))latest=candidate;
  }
  return latest;
 }
 async read(directory:string,source:InstallableReadingSource):Promise<PartialDownload|null>{
   if(!await this.owned(directory,source))return null;
   try{
    const raw=await this.store.read(directory+'/manifest.json');if(raw.length>10000)return null;
    const manifest=JSON.parse(raw) as PartialManifest;
    if(manifest.format!==1||manifest.purpose!=='download'||manifest.id!==source.id||manifest.url!==source.url
     ||manifest.sourceSha256!==source.sha256||manifest.databaseSha256!==source.databaseSha256||manifest.expectedBytes!==source.compressedBytes
     ||!Number.isSafeInteger(manifest.received)||manifest.received<1||manifest.received>=source.compressedBytes
     ||!Number.isSafeInteger(manifest.createdAt)||manifest.createdAt<0||!strongDownloadEtag(manifest.etag)
     ||typeof manifest.sha256!=='string'||!/^[a-f0-9]{64}$/.test(manifest.sha256))return null;
    const content=await this.store.read(directory+'/content.json');if(content.length>Math.ceil(manifest.received/3)*4+30)return null;
    const base64=(JSON.parse(content) as {base64:unknown}).base64;
    if(typeof base64!=='string'||base64.length!==Math.ceil(manifest.received/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))return null;
    const bytes=Uint8Array.from(atob(base64),char=>char.charCodeAt(0));
    if(bytes.length!==manifest.received||await sha256(bytes)!==manifest.sha256)return null;
    return {directory,bytes,etag:manifest.etag,createdAt:manifest.createdAt};
   }catch{/* Interrupted or modified snapshots remain visible for manual storage review. */}
   return null;
 }
 async save(source:InstallableReadingSource,bytes:Uint8Array,etag:string):Promise<void>{
  if(!bytes.length||bytes.length>=source.compressedBytes||!strongDownloadEtag(etag))return;
  const old=await this.directories(),directory='.stage-'+crypto.randomUUID();
  const owner=moduleOwner('download',downloadOwnerTarget(source),directory);
  const content=JSON.stringify({base64:encode(bytes)});
  const manifest:PartialManifest={format:1,purpose:'download',id:source.id,url:source.url,sourceSha256:source.sha256,databaseSha256:source.databaseSha256,
   expectedBytes:source.compressedBytes,received:bytes.length,etag,sha256:await sha256(bytes),createdAt:Date.now()};
  await this.store.mkdir(directory);await this.store.write(directory+'/owner.json',owner);
  if(await this.store.read(directory+'/owner.json')!==owner)throw Error('Download ownership verification failed.');
  await this.store.write(directory+'/content.json',content);await this.store.write(directory+'/manifest.json',JSON.stringify(manifest));
  if(await this.store.read(directory+'/content.json')!==content||await this.store.read(directory+'/manifest.json')!==JSON.stringify(manifest))throw Error('Partial download checkpoint verification failed.');
  // New checkpoint is durable before an older owned transient copy is removed.
  for(const path of old)await this.removeOwned(path,source);
 }
 async clear(source:InstallableReadingSource):Promise<void>{
  for(const directory of await this.directories())await this.removeOwned(directory,source);
 }
}
