import {FileSystemAdapter,Platform,type App} from 'obsidian';
import type {ModuleStore,ModuleMeasurement} from '../core/module-installation';
import {MAX_READING_BYTES} from '../core/reading-modules';
import {isModuleDirectory,isStageDirectory,isStateDirectory,isStorageLeaf} from '../core/module-paths';

/** Canonicalize the vault base, then reject aliases below it before any creation. */
async function pathGuard(app:App,root:string):Promise<(relative:string,allowMissing?:boolean)=>Promise<void>>{
 if(!Platform.isDesktopApp)return async()=>{};
 if(!(app.vault.adapter instanceof FileSystemAdapter))throw Error('This desktop storage adapter cannot establish a safe resource root.');
 const fs=require('node:fs/promises') as typeof import('node:fs/promises');
 const path=require('node:path') as typeof import('node:path');
 const missing=(error:unknown):boolean=>!!error&&typeof error==='object'&&'code' in error&&error.code==='ENOENT';
 const base=app.vault.adapter.getBasePath();
 const actualBase=await fs.realpath(base).catch(()=>{throw Error('The vault resource root is unavailable.');});
 const parts=root.split(/[\\/]+/);
 if(path.isAbsolute(root)||parts.includes('..'))throw Error('Resource storage must stay inside the vault root.');
 let actualRoot=actualBase;
 // Preserve physical casing while refusing existing symlinks, including a linked root.
 for(const part of parts){
  if(!part||part==='.')continue;
  actualRoot=path.join(actualRoot,part);
  const item=await fs.lstat(actualRoot).catch(error=>{if(missing(error))return null;throw Error('The resource root is unavailable.');});
  if(!item)continue;
  if(item.isSymbolicLink())throw Error('Symbolic links and aliases below the vault root are not eligible for resource storage.');
  if(!item.isDirectory())throw Error('A resource root ancestor is not a directory.');
  actualRoot=await fs.realpath(actualRoot).catch(()=>{throw Error('The resource root is unavailable.');});
 }
 const scope=path.relative(actualBase,actualRoot);
 if(!scope||scope==='..'||scope.startsWith('..'+path.sep)||path.isAbsolute(scope))throw Error('Resource storage must stay inside the vault root.');
 return async(relative,allowMissing=false)=>{
  const expected=path.resolve(actualRoot,relative);
  if(expected!==actualRoot&&!expected.startsWith(actualRoot+path.sep))throw Error('Resource operation requires an owned child of the storage root.');
  let candidate=path.resolve(base,root,relative),ancestor=expected;
  for(;;){
   let actual:string;
   try{actual=await fs.realpath(candidate);}
   catch(error){
    // Initialization checks the nearest existing ancestor before each mkdir.
    if(allowMissing&&missing(error)&&ancestor!==actualBase){candidate=path.dirname(candidate);ancestor=path.dirname(ancestor);continue;}
    throw Error('Resource path is unavailable.');
   }
   if(actual!==ancestor)throw Error('Symbolic links and paths outside the resource root are not eligible for resource operations.');
   return;
  }
 };
}

export async function createResourceStore(app:App):Promise<ModuleStore>{
 const adapter=app.vault.adapter,root=app.vault.configDir+'/versedock/modules/v1/reading';
 const guard=await pathGuard(app,root);
 for(const part of [app.vault.configDir+'/versedock',app.vault.configDir+'/versedock/modules',app.vault.configDir+'/versedock/modules/v1',root]){await guard('',true);if(!await adapter.exists(part))await adapter.mkdir(part);}
 await guard('');
 const directory=(value:string):string=>{
  if(!isModuleDirectory(value)&&!isStageDirectory(value)&&!isStateDirectory(value))throw Error('Invalid resource directory.');return root+'/'+value;
 };
 const file=(value:string):{full:string;directory:string;limit:number}=>{
  const match=/^([^/]+)\/(content|manifest|owner)\.json$/.exec(value);if(!match)throw Error('Invalid resource file.');
  const folder=directory(match[1]),limit=match[2]==='owner'?4096:match[2]==='manifest'?10000:MAX_READING_BYTES;
  return {full:folder+'/'+match[2]+'.json',directory:match[1],limit};
 };
 const measure=async(relative:string):Promise<ModuleMeasurement>=>{
  if(!isStorageLeaf(relative))throw Error('Invalid storage measurement target.');
  let bytes=0,files=0,complete=true,onlyKnownFiles=true,visited=0;
  const walk=async(part:string,depth:number):Promise<void>=>{
   if(depth>8||++visited>10000){complete=false;return;}
   try{
    await guard(part);const full=root+'/'+part,listing=await adapter.list(full);
    if(listing.folders.length)onlyKnownFiles=false;
    for(const candidate of listing.files){
     if(!candidate.startsWith(full+'/')){complete=false;onlyKnownFiles=false;continue;}
     const name=candidate.slice(full.length+1);
     if(!isStorageLeaf(name)){complete=false;onlyKnownFiles=false;continue;}
     if(depth!==0||!['content.json','manifest.json','owner.json'].includes(name))onlyKnownFiles=false;
     if(++visited>10000){complete=false;return;}
     try{await guard(part+'/'+name);const stat=await adapter.stat(candidate);
      if(stat?.type==='file'&&Number.isSafeInteger(stat.size)&&stat.size>=0){bytes+=stat.size;files++;}else complete=false;
     }catch{complete=false;}
    }
    for(const candidate of listing.folders){
     if(!candidate.startsWith(full+'/')){complete=false;continue;}const name=candidate.slice(full.length+1);
     if(isStorageLeaf(name))await walk(part+'/'+name,depth+1);else complete=false;
    }
   }catch{complete=false;}
  };
  await walk(relative,0);return {bytes,files,complete,onlyKnownFiles};
 };
 return {
  mkdir:async relative=>{if(!isStageDirectory(relative))throw Error('Only new staging directories may be created.');const full=directory(relative);await guard('');if(await adapter.exists(full))throw Error('Staging directory already exists.');await adapter.mkdir(full);await guard(relative);},
  read:async relative=>{const target=file(relative);await guard(target.directory);await guard(relative);const stat=await adapter.stat(target.full);if(stat?.type!=='file'||stat.size>target.limit)throw Error('Resource file is missing or exceeds its read limit.');return adapter.read(target.full);},
  write:async(relative,value)=>{const target=file(relative);if(!isStageDirectory(target.directory)||new TextEncoder().encode(value).length>target.limit)throw Error('Invalid staged resource write.');await guard(target.directory);if(await adapter.exists(target.full))throw Error('Staged files are immutable once written.');await adapter.write(target.full,value);},
  rename:async(from,to)=>{if(!isStageDirectory(from))throw Error('Only a verified staging directory may be promoted.');await guard(from);const target=directory(to);if(await adapter.exists(target))throw Error('Resource target already exists.');await adapter.rename(directory(from),target);},
  remove:async relative=>{if(!isStageDirectory(relative))throw Error('Permanent removal is limited to owned transient staging.');await guard(relative);await adapter.rmdir(directory(relative),true);},
  directories:async()=>{await guard('');const listing=await adapter.list(root);return listing.folders.filter(folder=>folder.startsWith(root+'/')).map(folder=>folder.slice(root.length+1)).filter(isStorageLeaf);},
  measure,
  measureLooseFiles:async()=>{
   await guard('');let bytes=0,files=0,complete=true;const listing=await adapter.list(root);
   for(const candidate of listing.files){
    if(!candidate.startsWith(root+'/')){complete=false;continue;}
    const name=candidate.slice(root.length+1);if(!isStorageLeaf(name)){complete=false;continue;}
    try{await guard(name);const stat=await adapter.stat(candidate);if(stat?.type==='file'&&Number.isSafeInteger(stat.size)&&stat.size>=0){bytes+=stat.size;files++;}else complete=false;}catch{complete=false;}
   }
   return {bytes,files,complete};
  },
  trash:async relative=>{const full=directory(relative);await guard(relative);await adapter.trashLocal(full);}
 };
}
