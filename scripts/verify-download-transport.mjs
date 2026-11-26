import {build} from 'esbuild';
import {mkdir,mkdtemp,readFile,writeFile,readdir,rename,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {get} from 'node:https';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';

// Real publisher TLS/downloads; persistence lives only in a disposable temporary store.
await mkdir('.research/modules',{recursive:true});
const reportPath='.research/modules/transport-report.json';
// Invalidate prior success before build, network, assertion or persistence failures.
await writeFile(reportPath,JSON.stringify({complete:false},null,2)+'\n');
await build({stdin:{contents:`
 export * from './src/obsidian/download-transport';
 export * from './src/core/partial-downloads';
 export * from './src/core/reading-catalogue';
 export * from './src/core/reading-install-service';
 `,resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',outfile:'.research/modules/transport-verify.cjs'});
const {createDesktopModuleDownloader,PartialDownloads,READING_SOURCES,ReadingInstallService}= (await import('../.research/modules/transport-verify.cjs?v='+Date.now())).default;
const root=await mkdtemp(join(tmpdir(),'sworddock-download-'));
const store={mkdir:p=>mkdir(join(root,p)),read:p=>readFile(join(root,p),'utf8'),write:(p,v)=>writeFile(join(root,p),v,{flag:'wx'}),
 rename:(a,b)=>rename(join(root,a),join(root,b)),remove:p=>rm(join(root,p),{recursive:true}),
 directories:async()=> (await readdir(root,{withFileTypes:true})).filter(entry=>entry.isDirectory()).map(entry=>entry.name)};
store.measure=async directory=>{
 const entries=await readdir(join(root,directory),{withFileTypes:true});let bytes=0,files=0;
 for(const entry of entries)if(entry.isFile()){bytes+=(await stat(join(root,directory,entry.name))).size;files++;}
 return {bytes,files,complete:true,onlyKnownFiles:entries.every(entry=>entry.isFile()&&['owner.json','manifest.json','content.json'].includes(entry.name))};
};
const requests=[];
const request=(url,headers,callback)=>{
 const record={url:url.href,range:headers.Range??null,status:null,closed:false,destroyed:false};requests.push(record);
 const operation=get(url,{headers,agent:false,maxHeaderSize:16384},response=>{record.status=response.statusCode;callback(response);});
 operation.on('close',()=>{record.closed=true;record.destroyed=operation.destroyed;});return operation;
};
try{
 const source=READING_SOURCES.find(source=>source.id==='mysword-kjv');
 const abort=new AbortController();let cancelledAt=0;
 const first=createDesktopModuleDownloader(store,{request});
 await assert.rejects(first(source,abort.signal,received=>{if(received>=512*1024){cancelledAt=received;abort.abort();}}),/cancelled/i);
 const saved=await new PartialDownloads(store).latest(source);assert.ok(saved);assert.equal(saved.bytes.length,cancelledAt);
 const reopened=createDesktopModuleDownloader(store,{request});let initialProgress=0;
 const bytes=await reopened(source,new AbortController().signal,received=>{initialProgress||=received;});
 assert.equal(initialProgress,cancelledAt);assert.equal(bytes.length,source.compressedBytes);
 assert.ok(requests.some(item=>item.status===206&&item.range==='bytes='+cancelledAt+'-'));
 assert.ok(requests.some(item=>item.status===200&&item.closed&&item.destroyed));
 assert.equal(await new PartialDownloads(store).latest(source),null);
 const sql=await initSqlJs({wasmBinary:new Uint8Array(await readFile('assets/sql-wasm.wasm')).buffer});
 const download=async(candidate,signal,progress)=>candidate.id===source.id?bytes:reopened(candidate,signal,progress);
 const service=new ReadingInstallService(store,async()=>sql,download);await service.initialize();
 for(const item of READING_SOURCES){await service.install(item.id);assert.equal(service.jobs.get(item.id)?.status,'ready',service.jobs.get(item.id)?.error);console.log(JSON.stringify({id:item.id,status:'ready'}));}
 const defaultSource=READING_SOURCES.find(item=>item.type==='book');
 const defaultBytes=await createDesktopModuleDownloader(store)(defaultSource,new AbortController().signal,()=>{});
 assert.equal(defaultBytes.length,defaultSource.compressedBytes);
 const offline=new ReadingInstallService(store,async()=>sql,async()=>{throw Error('Offline reopen must not download');});await offline.initialize();
 assert.equal(offline.installed.length,6);
 const modules=[];for(const info of offline.installed){const module=await offline.load(info.id);modules.push({id:info.id,kind:module.kind,entries:module.entries.length});}
 assert.ok(!(await store.directories()).some(name=>name.startsWith('.stage-')));
 const report={complete:true,actualHttps:true,defaultRequestVerified:true,cancelledAt,savedPrefix:cancelledAt,resumedProgress:initialProgress,modules,requests};
 await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({complete:true,cancelledAt,resumedResponse:206,installedAndReopened:modules.length,records:modules}));
}finally{await rm(root,{recursive:true,force:true});}
