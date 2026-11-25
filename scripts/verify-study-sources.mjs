import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import initSqlJs from 'sql.js';
await build({entryPoints:['src/core/mysword-study-module.ts'],bundle:true,platform:'node',format:'esm',outfile:'.research/modules/study-verify.mjs'});
const {inspectStudyModule}=await import('../.research/modules/study-verify.mjs?v='+Date.now());
const sql=await initSqlJs({wasmBinary:new Uint8Array(await readFile('assets/sql-wasm.wasm')).buffer});
for(const kind of ['bible','commentary','dictionary']){
 const bytes=new Uint8Array(await readFile('.research/modules/'+kind+'.sqlite'));
 const module=await inspectStudyModule(sql,bytes,kind);
 console.log(kind,module.records.length,'records',module.metadata.abbreviation,'warnings:',module.warnings.length);
 console.log('first:',JSON.stringify({...module.records[0],source:module.records[0].source.slice(0,100)}));
}
