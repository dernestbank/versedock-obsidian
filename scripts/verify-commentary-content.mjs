import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// The oracle is generated directly from the pinned archive through SWORD and
// Python HTMLParser. No source text is printed or copied into a test fixture.
const oracle=JSON.parse(await readFile('.research/modules/mhc-source-oracle.json','utf8'));
const manifest=JSON.parse(await readFile('library/mhc/manifest.json','utf8'));
assert.equal(manifest.schemaVersion,2);assert.equal(manifest.sourceSha256,oracle.sourceSha256);
await build({entryPoints:['src/core/commentary-content.ts'],bundle:true,platform:'node',format:'esm',outfile:'.research/modules/mhc-rich-verify-runtime.mjs'});
const {parseCommentarySource}=await import('../.research/modules/mhc-rich-verify-runtime.mjs?v='+Date.now());
const canon=[...(await readFile('src/core/books.ts','utf8')).matchAll(/"([A-Z0-9]{3})\|([^|]+)\|([^|]+)\|([^"]+)"/g)].map(match=>({code:match[1],osis:match[2],aliases:[match[1],match[2],match[3],...match[4].split(',')]}));
assert.equal(canon.length,66);
const sha=value=>createHash('sha256').update(value).digest('hex');
const allNodes=nodes=>nodes.flatMap(node=>[node,...(node.children?allNodes(node.children):[])]);
const plain=nodes=>nodes.map(node=>node.type==='text'?node.text:node.children?plain(node.children):'').join('').replace(/\s+/g,' ').trim();
const coordinate=value=>{
 const match=/^([1-3]?[A-Za-z]+)\.(\d+)(?:\.(\d+))?$/.exec(value);if(!match)return null;
 const normal=value=>value.toLowerCase().normalize('NFKC').replace(/[\s._-]/g,'');
 const book=canon.findIndex(book=>book.aliases.some(alias=>normal(alias)===normal(match[1])))+1,chapter=Number(match[2]),verse=match[3]===undefined?undefined:Number(match[3]);
 return book>0&&chapter>0&&chapter<=200&&(verse===undefined||verse>0&&verse<=200)?{book,chapter,...(verse===undefined?{}:{verse})}:null;
};
const expectedTarget=source=>{
 const parts=source.trim().split(/ +/);if(!source.trim()||source.length>4096||parts.length>32||/[\u0000-\u001f\u007f]/.test(source))return null;
 const ranges=[];
 for(const part of parts){const endpoints=part.split('-');if(endpoints.length>2)return null;const start=coordinate(endpoints[0]),end=endpoints.length>1?coordinate(endpoints[1]):undefined;
  const rank=p=>p.book*1e6+p.chapter*1000+(p.verse??0);if(!start||end===null||end&&rank(end)<rank(start))return null;
  ranges.push({start,...(end?{end}:{})});}
 return {kind:'scripture',range:ranges[0],...(ranges.length>1?{additionalRanges:ranges.slice(1)}:{})};
};
const report={complete:false,sections:0,sourceExact:0,plainBlocksExact:0,sourceReferences:0,validReferences:0,multipleTargets:0,unavailableReferences:0,emphasis:0,issues:{},unavailableSamples:[],editionEndpoints:{},books:[]};
const editions={};
for(const edition of ['kjv','webp']){
 const chapters=new Map();
 for(const [index,book]of canon.entries())for(const chapter of JSON.parse(await readFile('library/'+edition+'/'+book.code+'.json','utf8')).chapters)chapters.set((index+1)+'.'+chapter.chapter,new Set(chapter.verses.map(verse=>verse.verse)));
 editions[edition]=chapters;report.editionEndpoints[edition]={available:0,missing:0,missingSamples:[]};
}
const visited=new Set();
for(const book of manifest.books){
 const raw=await readFile('library/mhc/'+book.code+'.json');assert.equal(raw.length,book.bytes);assert.equal(sha(raw),book.sha256);
 const data=JSON.parse(raw.toString());assert.equal(data.entries.length,book.entries);
 for(const entry of data.entries){
  const key=book.code+'.'+entry.chapter+'.'+entry.verse,expected=oracle.entries[key];assert.ok(expected,key);visited.add(key);
  assert.equal(sha(entry.source),expected.sourceSha256,key+' raw source');report.sourceExact++;
  const doc=parseCommentarySource(entry.source);assert.equal(doc.complete,true,key+' parser limit');
  assert.equal(sha(JSON.stringify(doc.blocks.map(({kind,text})=>({kind,text})))),expected.blocksSha256,key+' complete text/order');report.plainBlocksExact++;
  const nodes=doc.blocks.flatMap(block=>allNodes(block.nodes)),links=nodes.filter(node=>node.type==='link');
  assert.equal(links.length,expected.references.length,key+' reference labels');
  for(let index=0;index<links.length;index++){
   const reference=expected.references[index];assert.equal(plain(links[index].children),reference.label,key+' source label');
   const target=expectedTarget(reference.reference);assert.deepEqual(links[index].target,target,key+' source address');report.sourceReferences++;
   if(target){
    report.validReferences++;if(target.additionalRanges)report.multipleTargets++;
    for(const [edition,chapters]of Object.entries(editions)){
     const exists=point=>{const verses=chapters.get(point.book+'.'+point.chapter);return !!verses&&(point.verse===undefined||verses.has(point.verse));};
     const available=[target.range,...target.additionalRanges??[]].every(range=>exists(range.start)&&(!range.end||exists(range.end)));
     const record=report.editionEndpoints[edition];if(available)record.available++;else {record.missing++;if(record.missingSamples.length<10)record.missingSamples.push({section:key,address:reference.reference});}
    }
   }
   else {report.unavailableReferences++;if(report.unavailableSamples.length<20)report.unavailableSamples.push({section:key,address:reference.reference});}
  }
  for(const [type,count]of Object.entries(expected.emphasis)){
   const tag={italic:'em',bold:'strong',super:'sup',underline:'u'}[type];
   assert.equal(nodes.filter(node=>node.type==='element'&&(type==='small-caps'?node.smallCaps===true:node.tag===tag)).length,count,key+' '+type);report.emphasis+=count;
  }
  for(const issue of doc.issues)report.issues[issue]=(report.issues[issue]??0)+1;
  report.sections++;
 }
 report.books.push({code:book.code,sections:data.entries.length});
}
assert.equal(visited.size,Object.keys(oracle.entries).length);assert.equal(report.sections,4249);
report.complete=true;await writeFile('.research/modules/mhc-rich-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,books:report.books.length,unavailableSamples:report.unavailableSamples.length}));
console.log('PASS: exact SWORD source, complete ordered text blocks, reference labels/targets and source emphasis across all 4,249 sections.');
