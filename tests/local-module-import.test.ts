import {beforeAll,describe,expect,it} from 'vitest';
import initSqlJs,{type SqlJsStatic} from 'sql.js';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {prepareLocalModule} from '../src/core/local-module-import';
import {ReadingInstallService} from '../src/core/reading-install-service';
import {sha256,type ModuleStore} from '../src/core/module-installation';
import type {ReadingKind} from '../src/core/reading-modules';

let sql:SqlJsStatic;
beforeAll(async()=>{sql=await initSqlJs({wasmBinary:Uint8Array.from(readFileSync('assets/sql-wasm.wasm')).buffer});});
function fixture(kind:ReadingKind):Uint8Array {
 const db=new sql.Database();
 db.run('CREATE TABLE Details(Title TEXT,Abbreviation TEXT,Author TEXT,Language TEXT,Version TEXT,Comments TEXT)');
 db.run("INSERT INTO Details VALUES('Local test module','LOCAL','Author','eng','1','Retain this source notice')");
 if(kind==='bible'){
  db.run('CREATE TABLE Bible(Book INT,Chapter INT,Verse INT,Scripture TEXT)');
  db.run("INSERT INTO Bible VALUES(43,3,16,'For God<WG2316> so loved<WG25> the world.')");
 } else if(kind==='commentary'){
  db.run('CREATE TABLE Commentary(Book INT,Chapter INT,FromVerse INT,ToVerse INT,Data TEXT)');
  db.run("INSERT INTO Commentary VALUES(43,3,14,18,'<p>Faith <b>and</b> love.</p>')");
 } else if(kind==='dictionary'){
  db.run('CREATE TABLE Dictionary(Word TEXT,Data TEXT)');
  db.run("INSERT INTO Dictionary VALUES('Faith','<p>A source definition.</p>')");
 } else {
  db.run('CREATE TABLE Journal(id TEXT,title TEXT,content TEXT,relativeorder INT,hidden INT)');
  db.run('INSERT INTO Journal VALUES(?,?,?,?,0)',[kind==='devotional'?'18 AM Nov':'first','First entry',kind==='graphics'?'<p>A map</p><img src="map.png">':'<p>Entry <b>content</b>.</p>',1]);
  if(kind==='graphics'){
   db.run('CREATE TABLE Data(id TEXT,filename TEXT,content BLOB)');
   db.run('INSERT INTO Data VALUES(?,?,?)',['map','map.png',new Uint8Array([137,80,78,71,13,10,26,10,0])]);
  }
 }
 const bytes=db.export();db.close();return bytes;
}
function memoryStore():ModuleStore {
 const files=new Map<string,string>();
 return {mkdir:async()=>{},read:async path=>{const value=files.get(path);if(value===undefined)throw Error('Missing');return value;},
  write:async(path,value)=>{files.set(path,value);},rename:async(from,to)=>{for(const [path,value]of [...files])if(path.startsWith(from+'/')){files.set(to+path.slice(from.length),value);files.delete(path);}},
  remove:async path=>{for(const key of files.keys())if(key.startsWith(path+'/'))files.delete(key);},directories:async()=>[...new Set([...files.keys()].map(path=>path.split('/')[0]))]};
}
const noDownload=async():Promise<Uint8Array>=>{throw Error('Local import must never download');};

describe('general local module preparation',()=>{
 for(const kind of ['bible','commentary','dictionary','book','devotional','graphics'] as const)
  it('prepares a '+kind+' source using actual content and retains provenance',async()=>{
   const bytes=fixture(kind);const prepared=await prepareLocalModule(sql,{name:'renamed.unrelated',bytes},kind);
   expect(prepared.module.kind).toBe(kind);expect(prepared.module.id).toMatch(new RegExp('^local-'+kind+'-[a-f0-9]{24}$'));
   expect(prepared.module.provenance).toMatchObject({kind:'local-file',fileName:'renamed.unrelated',compressed:false,sourceSha256:await sha256(bytes),databaseSha256:await sha256(bytes)});
   expect(prepared.module.entries[0].source).toBeDefined();expect(prepared.module.sourcePage).toBe('');
  });
 it('detects study tables without a filename hint and treats raw/gzip as the same database identity',async()=>{
  const bytes=fixture('bible');const compressed=new Uint8Array(gzipSync(bytes));
  const plain=await prepareLocalModule(sql,{name:'not-a-bible.zip',bytes});
  const zipped=await prepareLocalModule(sql,{name:'any-name',bytes:compressed});
  expect(plain.module.id).toBe(zipped.module.id);expect(zipped.module.provenance?.compressed).toBe(true);
  expect(zipped.module.provenance?.sourceSha256).not.toBe(plain.module.provenance?.sourceSha256);
 });
 it('rejects unsupported/encrypted content, wrong chosen types and views masquerading as physical tables',async()=>{
  await expect(prepareLocalModule(sql,{name:'encrypted.bbl.mybible',bytes:new Uint8Array(200)})).rejects.toThrow(/unencrypted|SQLite|gzip/);
  await expect(prepareLocalModule(sql,{name:'wrong',bytes:fixture('bible')},'book')).rejects.toThrow(/type|schema/);
  const db=new sql.Database(fixture('bible'));db.run('ALTER TABLE Bible RENAME TO ActualBible');db.run('CREATE VIEW Bible AS SELECT * FROM ActualBible');const bytes=db.export();db.close();
  await expect(prepareLocalModule(sql,{name:'view',bytes})).rejects.toThrow(/physical|schema/);
  const ambiguous=new sql.Database(fixture('bible'));ambiguous.run('CREATE TABLE Dictionary(Word TEXT,Data TEXT)');const both=ambiguous.export();ambiguous.close();
  await expect(prepareLocalModule(sql,{name:'ambiguous',bytes:both})).rejects.toThrow(/Ambiguous|schema/);
 });
 it('rejects a cancelled preview and retains only a safe source basename',async()=>{
  const abort=new AbortController();abort.abort();
  await expect(prepareLocalModule(sql,{name:'file',bytes:fixture('book')},'book',abort.signal)).rejects.toThrow(/cancel/i);
  const prepared=await prepareLocalModule(sql,{name:'/private/source/module.mybible',bytes:fixture('book')});
  expect(prepared.module.provenance?.fileName).toBe('module.mybible');
 });
});

describe('reviewed local import transaction',()=>{
 it('rejects previews requested after stop without loading WASM or writing storage',async()=>{
  const disk=memoryStore();let loads=0;
  const service=new ReadingInstallService(disk,async()=>{loads++;return sql;},noDownload);
  service.stop();
  await expect(service.previewLocalFile({name:'late.sqlite',bytes:fixture('book')})).rejects.toThrow(/stopped/i);
  expect(loads).toBe(0);expect(await disk.directories()).toEqual([]);
 });
 it('does not inspect a local database when WASM finishes loading after stop',async()=>{
  const disk=memoryStore();let release!:(value:SqlJsStatic)=>void,databases=0;
  const gate=new Promise<SqlJsStatic>(resolve=>release=resolve);
  const observed=new Proxy(sql,{get(target,key,receiver){if(key==='Database')databases++;return Reflect.get(target,key,receiver);}});
  const service=new ReadingInstallService(disk,()=>gate,noDownload);
  const pending=service.previewLocalFile({name:'waiting.sqlite',bytes:fixture('book')});
  service.stop();release(observed);
  await expect(pending).rejects.toThrow(/stopped/i);
  expect(databases).toBe(0);expect(await disk.directories()).toEqual([]);
 });
 it('does not remove an installed resource when its queued action reaches a stopped service',async()=>{
  const disk=memoryStore();let started!:()=>void,release!:()=>void;
  const began=new Promise<void>(resolve=>started=resolve),gate=new Promise<void>(resolve=>release=resolve);
  const service=new ReadingInstallService(disk,async()=>sql,async()=>{started();await gate;return new Uint8Array();});
  const preview=await service.previewLocalFile({name:'retained.sqlite',bytes:fixture('book')});
  const original=await service.installLocalFile(preview.ticket,'Keep this reviewed copy.');
  const before=await disk.directories();
  const download=service.install('mysword-all-of-grace');await began;
  const removed=expect(service.remove(original.id)).rejects.toThrow(/stopped/i);
  service.stop();release();await Promise.all([download,removed]);
  expect(await disk.directories()).toEqual(before);
  const reopened=new ReadingInstallService(disk,async()=>sql,noDownload);await reopened.initialize();
  expect(reopened.installed.map(info=>info.directory)).toEqual([original.directory]);
  expect((await reopened.load(original.id)).provenance?.citation).toBe('Keep this reviewed copy.');
 });
 it('abandons an uncommitted management change when stop occurs during its verification read',async()=>{
  const disk=memoryStore(),service=new ReadingInstallService(disk,async()=>sql,noDownload);
  const preview=await service.previewLocalFile({name:'retained.sqlite',bytes:fixture('book')});
  const original=await service.installLocalFile(preview.ticket,'Retained before unload.');
  const before=await disk.directories(),read=disk.read;
  let started!:()=>void,release!:()=>void;
  const began=new Promise<void>(resolve=>started=resolve),gate=new Promise<void>(resolve=>release=resolve);
  disk.read=async path=>{const raw=await read(path);if(path.startsWith('.stage-')&&path.endsWith('/content.json')){started();await gate;}return raw;};
  const removed=expect(service.remove(original.id)).rejects.toThrow(/cancel|stopped/i);
  await began;service.stop();release();await removed;disk.read=read;
  expect(await disk.directories()).toEqual(before);
  const reopened=new ReadingInstallService(disk,async()=>sql,noDownload);await reopened.initialize();
  expect(reopened.installed.map(info=>info.directory)).toEqual([original.directory]);
 });
 it('explains save-permission failures without paths, preserves the prior choice and retries the same review',async()=>{
  const disk=memoryStore(),service=new ReadingInstallService(disk,async()=>sql,noDownload);
  const preview=await service.previewLocalFile({name:'source.sqlite',bytes:fixture('book')});
  const original=await service.installLocalFile(preview.ticket,'Original review.');
  const originalRaw=await disk.read(original.directory+'/content.json'),mkdir=disk.mkdir;
  disk.mkdir=async()=>{throw Object.assign(new Error("EACCES: permission denied, mkdir '/Users/private/vault/.stage-test'"),{code:'EACCES'});};
  await expect(service.installLocalFile(preview.ticket,'Updated review.')).rejects.toThrow(/write permission/i);
  expect(service.jobs.get(preview.id)?.error).not.toMatch(/Users|private|stage-test/);
  expect(service.installed[0].directory).toBe(original.directory);
  expect(await disk.read(original.directory+'/content.json')).toBe(originalRaw);
  disk.mkdir=mkdir;const retry=await service.installLocalFile(preview.ticket,'Updated review.');
  expect(retry.directory).not.toBe(original.directory);expect((await service.load(retry.id)).provenance?.citation).toBe('Updated review.');
 });
 it('does not write during preview, installs only the reviewed snapshot and reopens offline',async()=>{
  const disk=memoryStore();const service=new ReadingInstallService(disk,async()=>sql,noDownload);
  const bytes=fixture('dictionary');const preview=await service.previewLocalFile({name:'dictionary.sqlite',bytes});
  expect(preview.abbreviation).toBe('LOCAL');expect(preview.language).toBe('eng');
  expect(await disk.directories()).toEqual([]);bytes.fill(0);
  const info=await service.installLocalFile(preview.ticket,'Publisher permission recorded locally.');
  expect(info.id).toBe(preview.id);expect(service.jobs.get(info.id)?.status).toBe('ready');
  const saved=await service.load(info.id);expect(saved.provenance?.citation).toBe('Publisher permission recorded locally.');
  expect(saved.entries[0].title).toBe('Faith');
  const restarted=new ReadingInstallService(disk,async()=>sql,noDownload);await restarted.initialize();
  expect(restarted.installed.map(module=>module.id)).toEqual([info.id]);
  expect((await restarted.load(info.id)).provenance?.fileName).toBe('dictionary.sqlite');
 });
 it('rejects stale or discarded preview tickets before any write',async()=>{
  const disk=memoryStore();const service=new ReadingInstallService(disk,async()=>sql,noDownload);
  const first=await service.previewLocalFile({name:'first',bytes:fixture('book')});
  await service.previewLocalFile({name:'second',bytes:fixture('dictionary')});
  await expect(service.installLocalFile(first.ticket,'')).rejects.toThrow(/preview|review/i);
  service.discardLocalPreview();await expect(service.installLocalFile('made-up','')).rejects.toThrow(/preview|review/i);
  expect(await disk.directories()).toEqual([]);
 });
 it('invalidates the previous review when a newly selected file fails preparation',async()=>{
  const disk=memoryStore();const service=new ReadingInstallService(disk,async()=>sql,noDownload);
  const preview=await service.previewLocalFile({name:'valid',bytes:fixture('bible')});
  await expect(service.previewLocalFile({name:'invalid',bytes:new Uint8Array(200)})).rejects.toThrow();
  await expect(service.installLocalFile(preview.ticket,'')).rejects.toThrow(/preview|review/i);expect(await disk.directories()).toEqual([]);
 });
 it('discards a late preview after cancellation while WASM is loading and owns bytes before that wait',async()=>{
  const disk=memoryStore();let release!:(value:SqlJsStatic)=>void;
  const gate=new Promise<SqlJsStatic>(resolve=>{release=resolve;});
  const service=new ReadingInstallService(disk,()=>gate,noDownload);const bytes=fixture('book');
  const pending=service.previewLocalFile({name:'waiting',bytes});bytes.fill(0);service.discardLocalPreview();release(sql);
  await expect(pending).rejects.toThrow(/preview|review/i);expect(await disk.directories()).toEqual([]);
 });
 it('keeps detached preview edits out of the prepared snapshot and validates the local citation before writes',async()=>{
  const disk=memoryStore();const service=new ReadingInstallService(disk,async()=>sql,noDownload);
  const preview=await service.previewLocalFile({name:'source.sqlite',bytes:fixture('dictionary')});
  preview.title='Changed review object';preview.samples[0].text='Changed sample';
  await expect(service.installLocalFile(preview.ticket,'x'.repeat(2001))).rejects.toThrow(/2000/);
  expect(await disk.directories()).toEqual([]);
  const info=await service.installLocalFile(preview.ticket,'');
  expect((await service.load(info.id)).title).toBe('Local test module');
  expect((await service.load(info.id)).entries[0].blocks).toEqual([{type:'text',text:'A source definition.'}]);
 });
 it('leaves no active resource when installation is cancelled or staging fails',async()=>{
  const disk=memoryStore();const service=new ReadingInstallService(disk,async()=>sql,noDownload);
  const preview=await service.previewLocalFile({name:'cancelled',bytes:fixture('commentary')});
  const pending=service.installLocalFile(preview.ticket,'');service.cancel(preview.id);
  await expect(pending).rejects.toThrow(/cancel/i);expect(service.installed).toEqual([]);expect(await disk.directories()).toEqual([]);
  const failed=await service.previewLocalFile({name:'disk-failure',bytes:fixture('book')});disk.rename=async()=>{throw Error('Disk failure');};
  await expect(service.installLocalFile(failed.ticket,'')).rejects.toThrow('Disk failure');
  expect(service.installed).toEqual([]);expect(await disk.directories()).toEqual([]);
 });
});

function observedBiblePreparation() {
 let began!:()=>void;
 const started=new Promise<void>(resolve=>began=resolve);
 let rows=0,closed=0;
 const Database=new Proxy(sql.Database,{construct(Target,args){
  const db=Reflect.construct(Target,args) as InstanceType<SqlJsStatic['Database']>;
  const prepare=db.prepare.bind(db),close=db.close.bind(db);
  db.close=()=>{closed++;close();};
  db.prepare=(query,...parameters)=>{
   const statement=prepare(query,...parameters);
   if(query.startsWith('SELECT Book,Chapter,Verse,Scripture FROM Bible')){
    const step=statement.step.bind(statement);
    statement.step=()=>{const hasRow=step();if(hasRow&&++rows===100)began();return hasRow;};
   }
   return statement;
  };
  return db;
 }});
 return {sql:new Proxy(sql,{get(target,key,receiver){return key==='Database'?Database:Reflect.get(target,key,receiver);}}),
  started,rows:()=>rows,closed:()=>closed};
}
function largeBibleFixture():Uint8Array {
 const db=new sql.Database(fixture('bible'));db.run('DELETE FROM Bible');
 const insert=db.prepare('INSERT INTO Bible VALUES(1,?,?,?)');
 for(let index=0;index<501;index++)insert.run([Math.floor(index/100)+1,index%100+1,'Source word<WH1697>.']);
 insert.free();const bytes=db.export();db.close();return bytes;
}
describe('local preview work cancellation',()=>{
 it.each(['stop','discard','replace'] as const)('interrupts active SQLite preparation on %s without writing resources',async(action)=>{
  const observed=observedBiblePreparation(),disk=memoryStore();
  const service=new ReadingInstallService(disk,async()=>observed.sql,noDownload);
  const pending=service.previewLocalFile({name:'large.sqlite',bytes:largeBibleFixture()});
  const rejected=expect(pending).rejects.toThrow(/stopped|cancel|preview|review/i);
  await observed.started;
  let replacement;
  if(action==='stop')service.stop();
  else if(action==='discard')service.discardLocalPreview();
  else replacement=await service.previewLocalFile({name:'replacement.sqlite',bytes:fixture('book')});
  await rejected;
  expect(observed.rows()).toBeGreaterThan(0);expect(observed.rows()).toBeLessThan(501);
  expect(observed.closed()).toBeGreaterThanOrEqual(2);
  expect(await disk.directories()).toEqual([]);
  if(replacement){
   const installed=await service.installLocalFile(replacement.ticket,'Replacement review.');
   expect(installed.kind).toBe('book');
   expect((await service.load(installed.id)).provenance?.fileName).toBe('replacement.sqlite');
  }
 });
 it('keeps caller cancellation effective during active SQLite work',async()=>{
  const observed=observedBiblePreparation(),disk=memoryStore(),controller=new AbortController();
  const service=new ReadingInstallService(disk,async()=>observed.sql,noDownload);
  const pending=service.previewLocalFile({name:'large.sqlite',bytes:largeBibleFixture()},undefined,controller.signal);
  const rejected=expect(pending).rejects.toThrow(/cancel/i);await observed.started;controller.abort();await rejected;
  expect(observed.rows()).toBeLessThan(501);expect(await disk.directories()).toEqual([]);
 });
});

describe('overlapping local preview cancellation',()=>{
 it('keeps the replacement cancellable after the old preview finishes unwinding',async()=>{
  const first=observedBiblePreparation(),second=observedBiblePreparation(),disk=memoryStore();let loads=0;
  const service=new ReadingInstallService(disk,async()=>loads++===0?first.sql:second.sql,noDownload);
  const old=service.previewLocalFile({name:'old.sqlite',bytes:largeBibleFixture()});
  const oldRejected=expect(old).rejects.toThrow(/cancel|preview|review/i);await first.started;
  const latest=service.previewLocalFile({name:'latest.sqlite',bytes:largeBibleFixture()});
  const latestRejected=expect(latest).rejects.toThrow(/cancel|stopped/i);
  await second.started;await oldRejected;service.stop();await latestRejected;
  expect(first.rows()).toBeLessThan(501);expect(second.rows()).toBeLessThan(501);
  expect(await disk.directories()).toEqual([]);
 });
 it('ignores a stale review discard while a newer file is preparing',async()=>{
  const observed=observedBiblePreparation(),disk=memoryStore();
  const service=new ReadingInstallService(disk,async()=>observed.sql,noDownload);
  const previous=await service.previewLocalFile({name:'prior.sqlite',bytes:fixture('book')});
  const latest=service.previewLocalFile({name:'latest.sqlite',bytes:largeBibleFixture()});
  await observed.started;service.discardLocalPreview(previous.ticket);
  const reviewed=await latest;const installed=await service.installLocalFile(reviewed.ticket,'Latest source.');
  expect((await service.load(installed.id)).provenance?.fileName).toBe('latest.sqlite');
  expect(observed.rows()).toBe(501);
 });
});
