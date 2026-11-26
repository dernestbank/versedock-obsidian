// Independent full-corpus field comparison; the runtime loader reads only local assets.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';

const root=process.cwd(), work=path.join(root,'.research/interlinear');
const outfile=path.join(work,'runtime-verification.mjs');
await build({entryPoints:['src/core/interlinear.ts'],bundle:true,platform:'node',format:'esm',outfile});
const {InterlinearLibrary}=await import(pathToFileURL(outfile).href);
const assets=path.join(root,'library/interlinear');
const read=file=>fs.readFile(path.join(assets,file),'utf8');
const size=async file=>(await fs.stat(path.join(assets,file))).size;
const manifest=JSON.parse(await read('manifest.json'));
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const sourceReport=JSON.parse(await fs.readFile(path.join(work,'corpus-report.json'),'utf8'));
assert.equal(sha(sourceReport.files.map(file=>file.key+':'+file.sha256).join('\n')),'3a58643986cb4f11cb45ecf1227ed33de1f1760bb0becc8556d0d6e99cf6420f');
const booksRuntime=path.join(work,'books-runtime.mjs');
await build({entryPoints:['src/core/books.ts'],bundle:true,platform:'node',format:'esm',outfile:booksRuntime});
const {BOOKS}=await import(pathToFileURL(booksRuntime).href);
const data=new InterlinearLibrary(read,size);assert.equal(await data.initialize(),true);
const fields=['pos','bsbPos','language','text','transliteration','parsing','parsingFull','strongs','gloss'];
let verses=0,words=0,maxLoadMs=0,totalLoadMs=0;
const emptyVerses=[];
const languages={},nulls={};
for(const entry of manifest.chapters){
  const sourceRaw=await fs.readFile(path.join(work,'chapters',`${entry.sourceBook}-${entry.chapter}.json`));
  const pinned=sourceReport.files.find(file=>file.key===`${entry.sourceBook}-${entry.chapter}`);
  assert.equal(sha(sourceRaw),pinned.sha256);assert.equal(entry.rawSha256,pinned.sha256);
  const source=JSON.parse(sourceRaw);
  const book=BOOKS.find(book=>book.vpl===entry.book);
  const begin=performance.now();
  for(const verse of source.chapter.content){
    const loaded=await data.getVerse({book,chapter:entry.chapter,verse:verse.verse});
    if(!loaded.words.length)emptyVerses.push(`${entry.book} ${entry.chapter}:${verse.verse}`);
    assert.equal(loaded.sourceId,'bsb-interlinear');assert.equal(loaded.words.length,verse.words.length);
    for(let index=0;index<verse.words.length;index++){
      for(const field of fields){
        assert.deepEqual(loaded.words[index][field],verse.words[index][field],`${entry.file}:${verse.verse}:${index}:${field}`);
        if(loaded.words[index][field]===null)nulls[field]=(nulls[field]??0)+1;
      }
      const lang=loaded.words[index].language;languages[lang]=(languages[lang]??0)+1;words++;
    }
    verses++;
  }
  const elapsed=performance.now()-begin;totalLoadMs+=elapsed;maxLoadMs=Math.max(maxLoadMs,elapsed);
}
assert.equal(verses,31102);assert.equal(words,443625);
const reopened=new InterlinearLibrary(read,size);assert.equal(await reopened.initialize(),true);
assert.equal((await reopened.getVerse({book:BOOKS[0],chapter:1,verse:1})).words[2].gloss,'God');
const report={complete:true,sourceId:manifest.id,snapshot:manifest.snapshot,chapters:manifest.chapters.length,verses,words,emptyVerses,languages,nulls,totalLoadMs,maxLoadMs,
  scope:'All nine source word fields compared exactly with pinned raw corpus. Local macOS Node timings include comparisons; not slower-device or native UI evidence.'};
await fs.writeFile(path.join(work,'product-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
