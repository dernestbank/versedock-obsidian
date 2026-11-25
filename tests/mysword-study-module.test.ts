import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { readFileSync } from 'node:fs';
import { inspectStudyModule } from '../src/core/mysword-study-module';
let sql:SqlJsStatic;
beforeAll(async()=>{sql=await initSqlJs({wasmBinary:Uint8Array.from(readFileSync('assets/sql-wasm.wasm')).buffer});});
function fixture(kind:'bible'|'commentary'|'dictionary',bad=false):Uint8Array{
 const db=new sql.Database();db.run('CREATE TABLE Details (Title TEXT,Abbreviation TEXT,Comments TEXT,Language TEXT,Strong INT)');db.run("INSERT INTO Details VALUES('Test module','TEST','Source notice','eng',1)");
 if(kind==='bible') {db.run('CREATE TABLE Bible(Book INT,Chapter INT,Verse INT,Scripture TEXT)');db.run('INSERT INTO Bible VALUES(?,?,?,?)',[bad?67:43,3,16,'For God so loved<WG25> the world.']);}
 if(kind==='commentary') {db.run('CREATE TABLE Commentary(id INTEGER PRIMARY KEY,Book INT,Chapter INT,FromVerse INT,ToVerse INT,Data TEXT)');db.run('INSERT INTO Commentary VALUES(1,43,3,?,?,?)',[16,bad?15:18,'<p>Faith <b>and</b> love.</p>']);}
 if(kind==='dictionary') {db.run('CREATE TABLE Dictionary(Word TEXT,Data TEXT)');db.run('INSERT INTO Dictionary VALUES(?,?)',['Faith','<p>Definition with <a href="#b43.3.16">John 3:16</a></p>']);if(bad)db.run("INSERT INTO Dictionary VALUES('faith','Duplicate case-insensitive key')");}
 const bytes=db.export();db.close();return bytes;
}
describe('validated Bible/commentary/dictionary import records',()=>{
 it('retains exact Bible source text, coordinate and declared capabilities',async()=>{
  const module=await inspectStudyModule(sql,fixture('bible'),'bible');expect(module.kind).toBe('bible');expect(module.metadata.abbreviation).toBe('TEST');
  expect(module.records[0]).toMatchObject({kind:'bible',book:43,chapter:3,verse:16,source:'For God so loved<WG25> the world.'});
 });
 it('keeps commentary ranges rather than silently remapping to a single verse',async()=>{
  const module=await inspectStudyModule(sql,fixture('commentary'),'commentary');expect(module.records[0]).toMatchObject({kind:'commentary',book:43,chapter:3,fromVerse:16,toVerse:18});
 });
 it('keeps dictionary headwords and markup as inert data for later safe rendering',async()=>{
  const module=await inspectStudyModule(sql,fixture('dictionary'),'dictionary');expect(module.records[0]).toMatchObject({kind:'dictionary',word:'Faith'});expect(module.records[0].source).toContain('#b43.3.16');
 });
 it('rejects invalid coordinates, descending ranges and ambiguous headwords',async()=>{
  for(const kind of ['bible','commentary','dictionary'] as const)await expect(inspectStudyModule(sql,fixture(kind,true),kind)).rejects.toThrow();
 });
 it('rejects a mismatched schema and cancelled inspection',async()=>{
  await expect(inspectStudyModule(sql,fixture('dictionary'),'bible')).rejects.toThrow(/schema|table/i);
  const abort=new AbortController();abort.abort();await expect(inspectStudyModule(sql,fixture('bible'),'bible',abort.signal)).rejects.toThrow(/cancel/i);
 });
 it('does not accept a view masquerading as a content table',async()=>{
  const db=new sql.Database(fixture('bible'));db.run('ALTER TABLE Bible RENAME TO ActualBible');db.run('CREATE VIEW Bible AS SELECT * FROM ActualBible');const bytes=db.export();db.close();
  await expect(inspectStudyModule(sql,bytes,'bible')).rejects.toThrow(/physical|table/i);
 });
});
