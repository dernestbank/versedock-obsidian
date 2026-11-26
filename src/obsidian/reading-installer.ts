import { requestUrl, Platform, type App } from 'obsidian';
import { loadBundledSqlite } from '../core/bundled-sqlite';
import { ReadingInstallService, type ModuleDownloader } from '../core/reading-install-service';
import { checkCancelled } from '../core/reading-modules';
import {createResourceStore} from './resource-store';
import {createDesktopModuleDownloader} from './download-transport';

/** Only the curated source object can reach this transport; no user-supplied URL. */
const download:ModuleDownloader=async(source,signal,progress)=>{
 checkCancelled(signal);
 // Obsidian's requestUrl bypasses desktop/mobile CORS without adding Node-only dependencies.
 // It cannot abort a network transfer: cancellation discards it and prevents preparation/activation.
 let timer:ReturnType<typeof setTimeout>|undefined;
 let onAbort:()=>void=()=>{};
 const interrupted=new Promise<never>((_,reject)=>{
  onAbort=()=>reject(new Error('Installation cancelled.'));
  signal.addEventListener('abort',onAbort,{once:true});
  timer=setTimeout(()=>reject(new Error('Publisher download timed out. Retry this resource.')),60000);
 });
 let response;
 try{response=await Promise.race([requestUrl({url:source.url,method:'GET',throw:false}),interrupted]);}
 finally{clearTimeout(timer);signal.removeEventListener('abort',onAbort);}
 checkCancelled(signal);
 if(response.status!==200)throw new Error('Publisher download failed ('+response.status+'). Retry or use the publisher page.');
 const bytes=new Uint8Array(response.arrayBuffer);
 if(bytes.length>Math.max(source.compressedBytes,source.databaseBytes))throw new Error('Download exceeds the supported size limit.');
 progress(bytes.length);return bytes;
};
export async function createReadingInstaller(app:App,protectedIds:()=>readonly string[]=()=>[]):Promise<ReadingInstallService>{
 const store=await createResourceStore(app);
 const service=new ReadingInstallService(store,loadBundledSqlite,Platform.isDesktopApp?createDesktopModuleDownloader(store):download,protectedIds);await service.initialize();return service;
}
