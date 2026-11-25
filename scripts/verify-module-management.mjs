import {build} from 'esbuild';
import {readFile,mkdir,mkdtemp,writeFile,rename,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';import initSqlJs from 'sql.js';

// Real KJV records; only local review citations vary between the two stored snapshots.
await mkdir('.research/modules',{recursive:true});
await build({entryPoints:['src/core/reading-install-service.ts'],bundle:true,platform:'node',format:'esm',outfile:'.research/modules/management-verify.mjs'});
const {ReadingInstallService}=await import('../.research/modules/management-verify.mjs?v='+Date.now());
const sql=await initSqlJs({wasmBinary:new Uint8Array(await readFile('assets/sql-wasm.wasm')).buffer});
const directory=await mkdtemp(join(tmpdir(),'sworddock-management-'));let failState=false;
const store={mkdir:p=>mkdir(join(directory,p)),read:p=>readFile(join(directory,p),'utf8'),
 write:(p,v)=>{if(failState&&v.includes('"kind":"management"'))throw Error('Injected management write failure');return writeFile(join(directory,p),v);},
 rename:(a,b)=>rename(join(directory,a),join(directory,b)),remove:p=>rm(join(directory,p),{recursive:true,force:true}),
 directories:async()=> (await readdir(directory,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name)};
const create=()=>new ReadingInstallService(store,async()=>sql,async()=>{throw Error('Network disabled');});
try{
 const raw=new Uint8Array(await readFile('.research/modules/bible.sqlite')),original=new Uint8Array(raw);
 let service=create();await service.initialize();
 const a=await service.previewLocalFile({name:'owned-kjv.mybible',bytes:raw});const first=await service.installLocalFile(a.ticket,'First local QA review.');
 const b=await service.previewLocalFile({name:'owned-kjv.mybible.gz',bytes:new Uint8Array(gzipSync(raw))});const second=await service.installLocalFile(b.ticket,'Second local QA review.');
 assert.equal(first.id,second.id);assert.notEqual(first.directory,second.directory);
 await service.useVersion(first.directory);service=create();await service.initialize();
 assert.equal(service.installed[0].directory,first.directory);assert.equal((await service.load(first.id)).provenance.citation,'First local QA review.');
 await service.remove(first.id);service=create();await service.initialize();assert.equal(service.installed.length,0);assert.equal(service.removed.length,1);
 await service.restore(first.id);assert.equal(service.installed[0].directory,first.directory);
 await store.write(first.directory+'/content.json','Injected damaged copy');await service.refreshManagement();assert.equal(service.installed.length,0);
 const repair=await service.previewLocalFile({name:'owned-kjv.mybible',bytes:raw});const repaired=await service.installLocalFile(repair.ticket,'First local QA review.');
 assert.notEqual(repaired.directory,first.directory);assert.match(repaired.directory,/-r-[a-f0-9]{8}$/);
 assert.equal(await store.read(first.directory+'/content.json'),'Injected damaged copy');assert.equal((await service.load(first.id)).entries.length,31102);
 failState=true;await assert.rejects(()=>service.useVersion(second.directory),/Injected management write failure/);failState=false;
 service=create();await service.initialize();assert.equal(service.installed[0].directory,repaired.directory);await service.verify(first.id);
 assert.deepEqual(new Uint8Array(await readFile('.research/modules/bible.sqlite')),original);
 assert.ok(!(await store.directories()).some(path=>path.startsWith('.stage-')));
 const report={complete:true,sourceRecords:31102,retainedGenerations:service.generations.length,damagedGenerations:service.problems.filter(problem=>problem.directory===first.directory).length,
  olderSelectionPersisted:true,removeRestorePersisted:true,repairPreservedDamagedCopy:true,failedSelectionPreservedPrior:true,originalFileUnchanged:true};
 await writeFile('.research/modules/management-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await rm(directory,{recursive:true,force:true});}
