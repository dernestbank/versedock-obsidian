import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { readFileSync } from 'node:fs';
import { normalizeReadingModule, devotionalDate, modulePlainText,decodeReadingEntities } from '../src/core/reading-modules';
import {ResourceEntryIndex} from '../src/core/resource-links';
import {validateReadingContent} from '../src/core/module-installation';
let sql: SqlJsStatic;
beforeAll(async () => { sql = await initSqlJs({ wasmBinary: Uint8Array.from(readFileSync('assets/sql-wasm.wasm')).buffer }); });
const source = { id:'mysword-all-of-grace', type:'book' as const, title:'Book', sourcePage:'https://www.mysword.info/download-mysword/books', sha256:'a'.repeat(64) };
function fixture(content='<p>Hello &amp; welcome</p>', image=false) {
 const db=new sql.Database();
 db.run('CREATE TABLE details(title TEXT,author TEXT,version TEXT,comments TEXT)');
 db.run("INSERT INTO details VALUES('Test book','Author','1','Source notice')");
 db.run('CREATE TABLE journal(rowid INTEGER PRIMARY KEY,id TEXT,title TEXT,content TEXT,relativeorder INT,hidden INT)');
 db.run('INSERT INTO journal VALUES(1,?,?,?,2,0)',['01 AM Jan','Morning',content]);
 db.run('CREATE TABLE data(id TEXT,filename TEXT,content BLOB)');
 if(image) db.run('INSERT INTO data VALUES(?,?,?)',['1.jpg','1.jpg',new Uint8Array([255,216,255,224,1,2,3,4])]);
 const bytes=db.export();db.close();return bytes;
}
describe('installed reading content boundary',()=>{
 it('retains bounded publisher metadata so own-module links resolve by source abbreviation',async()=>{
  const db=new sql.Database(fixture());
  db.run('ALTER TABLE details ADD COLUMN abbreviation TEXT');
  db.run("UPDATE details SET abbreviation='TEST'");
  const bytes=db.export();db.close();
  const module=await normalizeReadingModule(sql,bytes,source);
  expect(module.metadata?.abbreviation).toBe('TEST');
  const index=new ResourceEntryIndex(module);
  expect(index.resolve({kind:'entry',collection:'journal',module:'TEST',id:'01 AM Jan'}).entries[0]?.key).toBe('1');
  expect(index.resolve({kind:'entry',collection:'journal',module:'OTHER',id:'01 AM Jan'}).entries).toEqual([]);
  validateReadingContent(module);
  expect(()=>validateReadingContent({...module,metadata:{...module.metadata!,abbreviation:'x'.repeat(81)}})).toThrow(/metadata/i);
 });
 it('converts real journal schema to inert text and source metadata',async()=>{
  const result=await normalizeReadingModule(sql,fixture(),source);
  expect(result.title).toBe('Test book'); expect(modulePlainText(result.entries[0])).toBe('Hello & welcome');
  expect(result.entries[0].key).toBe('1'); expect(result.sourceSha256).toBe(source.sha256);
  expect(result.entries[0].sourceId).toBe('01 AM Jan'); // Distinct from its display title, Morning.
  expect(decodeReadingEntities('&constructor;')).toBe('&constructor;');
 });
 it('drops scripts, styles and executable links, never fetching external images',async()=>{
  const result=await normalizeReadingModule(sql,fixture('<script>steal()</script><style>bad</style><p>Safe <a href="javascript:bad()">label</a></p><img src="https://evil.invalid/x">'),source);
  expect(modulePlainText(result.entries[0])).toBe('Safe label'); expect(result.images).toEqual({});
 });
 it('resolves only embedded raster assets for graphic entries',async()=>{
  const result=await normalizeReadingModule(sql,fixture("<p>Caption</p><img src='1.jpg'>",true),{...source,type:'graphics'});
  expect(result.entries[0].blocks).toContainEqual({type:'image',image:'1.jpg',caption:''});
  expect(result.images['1.jpg'].mime).toBe('image/jpeg');
 });
 it('rejects damaged SQLite and a graphics module without embedded pictures',async()=>{
  await expect(normalizeReadingModule(sql,new Uint8Array(100),source)).rejects.toThrow();
  await expect(normalizeReadingModule(sql,fixture(),{...source,type:'graphics'})).rejects.toThrow(/image/i);
 });
 it('parses the verified morning/evening convention including leap day',()=>{
  expect(devotionalDate('29 PM Feb')).toEqual({month:2,day:29,period:'evening'});
  expect(devotionalDate('31 AM Feb')).toBeNull(); expect(devotionalDate('01 AM Unknown')).toBeNull();
 });
 it('supports bounded cancellation during conversion',async()=>{
  const abort=new AbortController();abort.abort();
  await expect(normalizeReadingModule(sql,fixture(),source,abort.signal)).rejects.toThrow(/cancel/i);
 });
});
