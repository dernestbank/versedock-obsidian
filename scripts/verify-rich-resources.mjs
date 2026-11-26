import fs from 'node:fs/promises';
import {build} from 'esbuild';
import initSqlJs from 'sql.js';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {assertCompleteRichCoverage} from './rich-verification.mjs';
import {pathToFileURL} from 'node:url';

const reportPath='.research/modules/rich-report.json';
const report={complete:false,kinds:{}};
// Invalidate prior success before any oracle, build or source validation can fail.
await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
execFileSync('python3',['scripts/rich_source_expectations.py'],{stdio:'inherit'});
const out='.research/modules/rich-runtime.mjs';
await build({stdin:{contents:[
 "export * from './src/core/normalize-module';","export * from './src/core/resource-content';","export * from './src/core/resource-links';",
 "export * from './src/core/resource-bible-source';","export * from './src/core/reading-catalogue';","export * from './src/core/books';"
].join('\n'),resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:out});
const api=await import(pathToFileURL(process.cwd()+'/'+out).href);
const sql=await initSqlJs({wasmBinary:new Uint8Array(await fs.readFile('assets/sql-wasm.wasm')).buffer});
const expected=JSON.parse(await fs.readFile('.research/modules/rich-source-expectations.json','utf8'));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const identity=record=>JSON.stringify([record.source,record.sourceId??null]);
for(const kind of ['book','devotional','graphics','commentary','dictionary','bible']){
 const source=api.READING_SOURCES.find(source=>source.type===kind);
 const raw=new Uint8Array(await fs.readFile('.research/modules/'+kind+'.sqlite'));
 assert.equal(hash(raw),source.databaseSha256);
 const module=await api.normalizeModuleContent(sql,raw,source);
 assert.equal(module.entries.length,expected[kind].length);
 const records=new Map();for(const record of expected[kind]){const key=identity(record);records.set(key,[...(records.get(key)??[]),record]);}
 const index=new api.ResourceEntryIndex(module),anchorMaps=new Map(),pendingAnchors=[];
 const stats={entries:module.entries.length,sourceFieldsExact:0,textExact:0,nodes:0,tags:{},links:{},resolvedEntries:0,unresolvedEntries:0,unsupportedLinks:0,anchors:0,annotations:0,crossReferences:0,formatNotices:{},samples:[],fallbacks:[]};
 for(const entry of module.entries){
  const key=identity({source:hash(entry.source),sourceId:entry.sourceId});
  const oracle=records.get(key)?.pop();assert(oracle,'Unretained source or Journal source ID: '+entry.title);stats.sourceFieldsExact++;
  if(kind==='bible'){
   const info=api.resourceBibleSource(entry.source);stats.annotations+=info.annotations.length;stats.crossReferences+=info.references.length;continue;
  }
  const doc=api.parseResourceContent(entry.source,module.images);
  if(!doc.complete){stats.fallbacks.push(entry.title);continue;}
  for(const issue of doc.issues)stats.formatNotices[issue]=(stats.formatNotices[issue]??0)+1;
  const text=[],anchors=new Map();
  const walk=nodes=>{for(const node of nodes){
   stats.nodes++;
   if(node.type==='text')text.push(node.text);
   if(node.type==='anchor'){stats.anchors++;anchors.set(node.name,(anchors.get(node.name)??0)+1);}
   if(node.type==='element')stats.tags[node.tag]=(stats.tags[node.tag]??0)+1;
   if(node.type==='link'){
    if(!node.target)stats.unsupportedLinks++;
    else {
     stats.links[node.target.kind]=(stats.links[node.target.kind]??0)+1;
     if(['entry','commentary'].includes(node.target.kind)){
      const result=index.resolve(node.target);
      if(result.entries.length){stats.resolvedEntries++;if(node.target.anchor)pendingAnchors.push([result.entries[0].key,node.target.anchor,entry.title]);}
      else {stats.unresolvedEntries++;if(stats.samples.length<20)stats.samples.push({entry:entry.title,target:node.target,reason:result.reason});}
     }else if(node.target.kind==='anchor')pendingAnchors.push([entry.key,node.target.id,entry.title]);
    }
   }
   if('children'in node)walk(node.children);
  }};
  walk(doc.nodes);anchorMaps.set(entry.key,anchors);
  assert.equal(hash(text.join('').replace(/\s+/gu,'')),oracle.text,'Ordinary source text changed: '+kind+' '+entry.title);stats.textExact++;
 }
 assert([...records.values()].every(records=>records.length===0),'Source records were omitted');
 stats.unresolvedAnchors=pendingAnchors.filter(([key,name])=>anchorMaps.get(key)?.get(name)!==1);
 assertCompleteRichCoverage(kind,stats);
 report.kinds[kind]=stats;
 console.log(kind,JSON.stringify({...stats,samples:stats.samples.length,unresolvedAnchors:stats.unresolvedAnchors.length,tags:Object.keys(stats.tags),formatNotices:Object.keys(stats.formatNotices)}));
}
report.complete=true;
await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log('All retained sources/IDs and complete rich projections match the independent SQLite/HTMLParser oracle. Source unresolved targets remain explicit in rich-report.json.');
