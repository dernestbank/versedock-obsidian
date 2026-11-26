import {build} from 'esbuild';
import {readFile,mkdir,mkdtemp,writeFile,rename,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';

// Exercise the public review/install path with real corpora in a disposable store.
await mkdir('.research/modules',{recursive:true});
await build({entryPoints:['src/core/reading-install-service.ts'],bundle:true,platform:'node',format:'esm',outfile:'.research/modules/local-import-verify.mjs'});
const {ReadingInstallService}=await import('../.research/modules/local-import-verify.mjs?v='+Date.now());
const sql=await initSqlJs({wasmBinary:new Uint8Array(await readFile('assets/sql-wasm.wasm')).buffer});
const directory=await mkdtemp(join(tmpdir(),'sworddock-local-import-'));
const store={mkdir:p=>mkdir(join(directory,p)),read:p=>readFile(join(directory,p),'utf8'),write:(p,v)=>writeFile(join(directory,p),v),
 rename:(a,b)=>rename(join(directory,a),join(directory,b)),remove:p=>rm(join(directory,p),{recursive:true,force:true}),
 directories:async()=> (await readdir(directory,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name)};
const noDownload=async()=>{throw Error('Local imports must not use the network');};
const counts={bible:31102,commentary:21114,dictionary:3965,book:22,devotional:745,graphics:36};
const report=[];
try {
 const service=new ReadingInstallService(store,async()=>sql,noDownload);
 for(const [kind,count]of Object.entries(counts)){
  const raw=new Uint8Array(await readFile('.research/modules/'+kind+'.sqlite'));
  const expectedBefore=(await store.directories()).sort();
  const plain=await service.previewLocalFile({name:'renamed-file.bin',bytes:raw},kind);
  assert.deepEqual((await store.directories()).sort(),expectedBefore,'Preview must never stage data');
  const compressed=new Uint8Array(gzipSync(raw));
  const preview=await service.previewLocalFile({name:kind+'.mybible.gz',bytes:compressed},kind);
  assert.equal(preview.id,plain.id);assert.equal(preview.entryCount,count);assert.equal(preview.compressed,true);
  await assert.rejects(()=>service.installLocalFile(plain.ticket,''),/preview|review/);
  const info=await service.installLocalFile(preview.ticket,'Local QA source review.');
  const module=await service.load(info.id);assert.equal(module.entries.length,count);
  assert.equal(module.provenance.citation,'Local QA source review.');assert.equal(module.provenance.databaseSha256,plain.databaseSha256);
  assert.ok(module.entries.every(entry=>typeof entry.source==='string'),'Every original source record must be retained');
  report.push({kind,id:info.id,records:count,sourceSha256:preview.sourceSha256,databaseSha256:preview.databaseSha256,selectedBytes:compressed.length,databaseBytes:raw.length,preparedBytes:info.bytes});
  console.log(JSON.stringify(report.at(-1)));
 }
 service.discardLocalPreview();
 const restarted=new ReadingInstallService(store,async()=>sql,noDownload);await restarted.initialize();
 assert.equal(restarted.installed.length,6);
 for(const info of restarted.installed){await restarted.verify(info.id);assert.equal((await restarted.load(info.id)).provenance.kind,'local-file');}
 assert.ok(!(await store.directories()).some(name=>name.startsWith('.stage-')));
 await writeFile('.research/modules/local-import-report.json',JSON.stringify({complete:true,modules:report,offlineReopened:6},null,2)+'\n');
 console.log('PASS: all six real corpora preview raw/gzip, install reviewed snapshots and reopen offline with retained source records.');
}finally{await rm(directory,{recursive:true,force:true});}
