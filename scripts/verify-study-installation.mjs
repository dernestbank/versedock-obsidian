import {build} from 'esbuild';
import {readFile,mkdir,mkdtemp,writeFile,rename,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';

// Uses actual pinned research fixtures; never writes to an Obsidian vault.
await mkdir('.research/modules',{recursive:true});
await build({stdin:{contents:`
 export * from './src/core/reading-install-service';
 export * from './src/core/imported-bible';
 export * from './src/core/installed-study';
 export * from './src/core/references';
 export * from './src/core/mysword-gbf';
 `,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'.research/modules/install-verify.mjs'});
const {ReadingInstallService,ImportedBibleResource,commentaryForPassage,commentarySectionsForPassage,dictionaryHeadwords,parseReference,tokenizeMySwordGbf}=await import('../.research/modules/install-verify.mjs?v='+Date.now());
const sql=await initSqlJs({wasmBinary:new Uint8Array(await readFile('assets/sql-wasm.wasm')).buffer});
const directory=await mkdtemp(join(tmpdir(),'sworddock-study-'));
const store={mkdir:p=>mkdir(join(directory,p)),read:p=>readFile(join(directory,p),'utf8'),write:(p,v)=>writeFile(join(directory,p),v),
 rename:(a,b)=>rename(join(directory,a),join(directory,b)),remove:p=>rm(join(directory,p),{recursive:true,force:true}),
 directories:async()=> (await readdir(directory,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name)};
const sources=[['mysword-kjv','bible',31102],['mysword-jfb','commentary',21114],['mysword-eastons','dictionary',3965]];
try {
 const service=new ReadingInstallService(store,async()=>sql,async source=>new Uint8Array(await readFile('.research/modules/'+source.type+'.sqlite')));
 for(const [id,kind,count] of sources){
  const started=performance.now();await service.install(id);
  assert.equal(service.jobs.get(id)?.status,'ready',service.jobs.get(id)?.error);
  const module=await service.load(id);assert.equal(module.kind,kind);assert.equal(module.entries.length,count);
  assert.ok(module.entries.every(entry=>typeof entry.source==='string'));
  if(kind==='bible'){
   const info=service.installed.find(item=>item.id===id);
   const bible=await ImportedBibleResource.create(module,{bytes:info.bytes,files:2},()=>service.verify(id));
   const [verse]=await bible.getPassage(parseReference('John 3:16'));
   assert.match(verse.text,/For God so loved the world/);assert.ok(verse.tokens.some(token=>token.strongs?.includes('G25')));
   assert.equal((await bible.verifyIntegrity()).issues.length,0);
   const formatIssues=module.entries.flatMap(entry=>tokenizeMySwordGbf(entry.source).issues.map(issue=>({key:entry.key,issue})));
   console.log(JSON.stringify({id,formatIssueCount:formatIssues.length,examples:formatIssues.slice(0,5)}));
  }
  if(kind==='commentary'){
   assert.ok(commentaryForPassage(module.entries,parseReference('John 3:16')).some(entry=>entry.reference.chapter===3));
   const sections=commentarySectionsForPassage(module.entries,parseReference('Proverbs 5:3'));
   assert.equal(sections.passage.length,1);assert.equal(sections.passage[0].reference.verse,3);
   assert.match(sections.passage[0].blocks.map(block=>block.type==='text'?block.text:'').join(' '),/enticing promises/);
   assert.equal(sections.introductions.length,2);
   assert.ok(sections.introductions.some(entry=>entry.reference.chapter===0));
   assert.ok(sections.introductions.some(entry=>entry.reference.chapter===5&&entry.reference.verse===0));
  }
  if(kind==='dictionary')assert.ok(dictionaryHeadwords(module.entries,'Abraham').entries.some(entry=>entry.title.toLowerCase()==='abraham'));
  console.log(JSON.stringify({id,count,preparedBytes:service.installed.find(item=>item.id===id).bytes,milliseconds:Math.round(performance.now()-started)}));
 }
 const restarted=new ReadingInstallService(store,async()=>sql,async()=>{throw Error('Offline restart must not download');});
 await restarted.initialize();assert.equal(restarted.installed.length,3);
 for(const [id,,count]of sources)assert.equal((await restarted.load(id)).entries.length,count);
 assert.ok(!(await store.directories()).some(name=>name.startsWith('.stage-')));
 console.log('PASS: all three pinned study sources install, verify, preserve source records and reopen offline.');
}finally{await rm(directory,{recursive:true,force:true});}
