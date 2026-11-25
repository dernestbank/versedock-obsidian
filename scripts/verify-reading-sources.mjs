// Local research fixtures are downloaded from the original publisher, never packaged.
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import initSqlJs from 'sql.js';
const out=new URL('../.research/modules/reading-verify.mjs',import.meta.url);
await build({entryPoints:['src/core/reading-modules.ts'],bundle:true,platform:'node',format:'esm',outfile:out.pathname});
const {normalizeReadingModule}=await import(out.href+'?v='+Date.now());
const sql=await initSqlJs({wasmBinary:new Uint8Array(await readFile('assets/sql-wasm.wasm')).buffer});
const expected={book:22,devotional:745,graphics:36};
for(const kind of Object.keys(expected)) {
 const bytes=new Uint8Array(await readFile('.research/modules/'+kind+'.sqlite'));
 const content=await normalizeReadingModule(sql,bytes,{id:'qa-'+kind,type:kind,title:kind,sourcePage:'https://www.mysword.info',sha256:'a'.repeat(64)});
 if(content.entries.length!==expected[kind])throw Error('Entry count mismatch: '+kind);
 const imageEntries=content.entries.filter(e=>e.blocks.some(b=>b.type==='image')).length;
 const dated=content.entries.filter(e=>e.date).length;
 if(kind==='graphics'&&imageEntries!==32)throw Error('Atlas images missing');
 if(kind==='devotional'&&dated!==732)throw Error('Devotional date coverage missing');
 console.log(kind,content.entries.length,'entries',dated,'dated',imageEntries,'image entries',JSON.stringify(content).length,'characters');
}
