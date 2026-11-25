import {build} from 'esbuild';
import {readFile,mkdir,mkdtemp,writeFile,rename,rm,readdir,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import assert from 'node:assert/strict';import initSqlJs from 'sql.js';

await mkdir('.research/modules',{recursive:true});
await build({stdin:{contents:`export * from './src/core/reading-install-service';export * from './src/core/local-module-import';export * from './src/core/module-installation';export * from './src/core/module-ownership';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'.research/modules/storage-verify.mjs'});
const {ReadingInstallService,prepareLocalModule,promoteReadingModule,moduleOwner}=await import('../.research/modules/storage-verify.mjs?v='+Date.now());
const sql=await initSqlJs({wasmBinary:new Uint8Array(await readFile('assets/sql-wasm.wasm')).buffer});
const workspace=await mkdtemp(join(tmpdir(),'sworddock-storage-')),root=join(workspace,'resources'),trash=join(workspace,'vault-trash');await mkdir(root);await mkdir(trash);
const store={mkdir:p=>mkdir(join(root,p)),read:p=>readFile(join(root,p),'utf8'),write:(p,v)=>writeFile(join(root,p),v),rename:(a,b)=>rename(join(root,a),join(root,b)),
 remove:p=>rm(join(root,p),{recursive:true,force:true}),directories:async()=> (await readdir(root,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name),
 measure:async directory=>{const entries=await readdir(join(root,directory),{withFileTypes:true});let bytes=0,files=0;for(const entry of entries)if(entry.isFile()){bytes+=(await stat(join(root,directory,entry.name))).size;files++;}return {bytes,files,complete:entries.every(e=>e.isFile()),onlyKnownFiles:entries.every(e=>['content.json','manifest.json','owner.json'].includes(e.name))};},
 measureLooseFiles:async()=>({bytes:0,files:0,complete:true}),trash:p=>rename(join(root,p),join(trash,p))};
const create=()=>new ReadingInstallService(store,async()=>sql,async()=>{throw Error('Offline check must not download');});
try{
 let service=create();await service.initialize();
 const bible=new Uint8Array(await readFile('.research/modules/bible.sqlite'));
 const preview=await service.previewLocalFile({name:'owned-kjv.mybible',bytes:bible});const installed=await service.installLocalFile(preview.ticket,'Local storage QA.');
 const rawBook=new Uint8Array(await readFile('.research/modules/book.sqlite'));
 const prepared=await prepareLocalModule(sql,{name:'owned-book.mybible',bytes:rawBook},'book');const book=await promoteReadingModule(store,prepared.module);
 const stage=JSON.parse(await store.read(book.directory+'/owner.json')).stage;await store.rename(book.directory,stage);
 service=create();await service.initialize();assert.equal(service.installed.length,1);
 const review=await service.previewStorage();assert.equal(review.items.find(item=>item.directory===stage).recoverable,true);
 await service.recoverStage(review.ticket,stage);assert.equal((await service.load(book.id)).entries.length,22);
 const incomplete='.stage-'+crypto.randomUUID();await store.mkdir(incomplete);await store.write(incomplete+'/owner.json',moduleOwner('module',book.directory,incomplete));
 const cleanup=await service.previewStorage();assert.equal(cleanup.complete,true);
 const before=cleanup.totalBytes,filesBefore=cleanup.totalFiles;
 const selected=[stage,incomplete];assert.ok(selected.every(directory=>cleanup.items.some(item=>item.directory===directory&&item.cleanupEligible)));
 const result=await service.cleanupStorage(cleanup.ticket,selected);assert.equal(result.moved,2);
 assert.ok((await readdir(trash)).includes(stage));assert.ok((await readdir(trash)).includes(incomplete));
 service=create();await service.initialize();assert.equal(service.installed.length,2);assert.equal((await service.load(installed.id)).entries.length,31102);assert.equal((await service.load(book.id)).entries.length,22);
 const after=await service.previewStorage();assert.equal(before-after.totalBytes,result.bytes);assert.equal(filesBefore-after.totalFiles,result.files);
 assert.deepEqual(new Uint8Array(await readFile('.research/modules/bible.sqlite')),bible);assert.deepEqual(new Uint8Array(await readFile('.research/modules/book.sqlite')),rawBook);
 const report={complete:true,bibleRecords:31102,bookRecords:22,stagedResourceRecovered:true,incompleteStageNotActivated:true,foldersMovedToRecoverableTrash:result.moved,bytesMoved:result.bytes,filesMoved:result.files,measuredBytesBefore:before,measuredBytesAfter:after.totalBytes,originalsUnchanged:true,offlineReopenPassed:true};
 await writeFile('.research/modules/storage-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await rm(workspace,{recursive:true,force:true});}
