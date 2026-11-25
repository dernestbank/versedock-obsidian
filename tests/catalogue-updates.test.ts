import {afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import {mkdtemp,mkdir,readFile,writeFile,rename,rm,readdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import initSqlJs,{type SqlJsStatic} from 'sql.js';
import type {InstallableReadingSource} from '../src/core/reading-catalogue';
import type {ModuleStore} from '../src/core/module-installation';
import type {SwordDockController} from '../src/controller';
import {fixtureApp,button,settle} from './ui-fixture';

const catalogue=vi.hoisted(()=>({source:null as InstallableReadingSource|null}));
vi.mock('../src/core/reading-catalogue',()=>({
 readingSource:(id:string)=>catalogue.source?.id===id?catalogue.source:null,
 get READING_SOURCES(){return catalogue.source?[catalogue.source]:[];}
}));
vi.mock('obsidian',()=>({Modal:class{contentEl:any;app:any;constructor(app:any){this.app=app;this.contentEl=app.qaRoot;}open(){(this as any).onOpen();}close(){(this as any).onClose();}},Notice:vi.fn()}));
import {ReadingInstallService} from '../src/core/reading-install-service';
import {ModuleManagementModal} from '../src/ui/module-management-modal';
import {sha256} from '../src/core/module-installation';

let sql:SqlJsStatic;
const cleanup:Array<()=>Promise<void>>=[];
beforeAll(async()=>{sql=await initSqlJs({wasmBinary:Uint8Array.from(readFileSync('assets/sql-wasm.wasm')).buffer});});
afterEach(async()=>{catalogue.source=null;for(const clear of cleanup.splice(0).reverse())await clear();});

async function edition(version:string){
 const db=new sql.Database();
 db.run('CREATE TABLE Details(Title TEXT,Author TEXT,Version TEXT,Comments TEXT)');
 db.run('INSERT INTO Details VALUES(?,?,?,?)',['Controlled catalogue book','QA author',version,'Source notice '+version]);
 db.run('CREATE TABLE Journal(id TEXT,title TEXT,content TEXT,relativeorder INT,hidden INT)');
 db.run('INSERT INTO Journal VALUES(?,?,?,?,0)',['first','First chapter','<p>Edition '+version+' content.</p>',1]);
 const raw=db.export();db.close();const gzip=new Uint8Array(gzipSync(raw));
 const source:InstallableReadingSource={id:'mysword-all-of-grace',type:'book',title:'Controlled catalogue book',
  sourcePage:'https://www.mysword.info/download-mysword/books#controlled-qa-'+version,url:'https://example.invalid/source-'+version+'.gz',
  sha256:await sha256(gzip),compressedBytes:gzip.length,databaseSha256:await sha256(raw),databaseBytes:raw.length};
 return {raw,gzip,source};
}
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'sworddock-catalogue-update-'));
 cleanup.push(()=>rm(root,{recursive:true,force:true}));
 let failManagement=false;
 const disk:ModuleStore={
  mkdir:path=>mkdir(join(root,path)),
  read:path=>readFile(join(root,path),'utf8'),
  async write(path,value){
   if(failManagement&&JSON.parse(value).kind==='management')throw Error('Controlled management save failure');
   await writeFile(join(root,path),value);
  },
  rename:(from,to)=>rename(join(root,from),join(root,to)),
  remove:path=>rm(join(root,path),{recursive:true,force:true}),
  directories:async()=> (await readdir(root,{withFileTypes:true})).filter(entry=>entry.isDirectory()).map(entry=>entry.name)
 };
 const first=await edition('1'),next=await edition('2');
 catalogue.source=first.source;
 const download=vi.fn(async(source:InstallableReadingSource,_signal:AbortSignal,_progress:(n:number)=>void)=>
  source.sha256===first.source.sha256?new Uint8Array(first.gzip):new Uint8Array(next.gzip));
 const service=new ReadingInstallService(disk,async()=>sql,download);
 cleanup.push(async()=>{service.stop();});
 await service.initialize();await service.install(first.source.id);
 expect(service.jobs.get(first.source.id)?.status,service.jobs.get(first.source.id)?.error).toBe('ready');
 const original=service.installed[0];
 const originalFiles=new Map<string,string>();
 for(const directory of await disk.directories())for(const file of await readdir(join(root,directory))){
  originalFiles.set(directory+'/'+file,await disk.read(directory+'/'+file));
 }
 catalogue.source=next.source;download.mockClear();
 const reopen=async()=>{const offline=new ReadingInstallService(disk,async()=>sql,async()=>{throw Error('Offline restart must not download');});await offline.initialize();cleanup.push(async()=>{offline.stop();});return offline;};
 const expectOriginal=async()=>{
  expect(service.installed[0].directory).toBe(original.directory);
  expect((await service.load(original.id)).entries[0].source).toContain('Edition 1 content.');
  const restarted=await reopen();expect(restarted.installed[0].directory).toBe(original.directory);
  for(const [path,value]of originalFiles)expect(await disk.read(path),path).toBe(value);
 };
 return {service,disk,download,first,next,original,originalFiles,reopen,expectOriginal,failSave:()=>{failManagement=true;}};
}

describe('reviewed catalogue source updates',()=>{
 it('retains the chosen source when only catalogue pins change, including after offline restart',async()=>{
  const f=await fixture();const reopened=await f.reopen();
  expect(reopened.installed[0].sourceSha256).toBe(f.first.source.sha256);
  expect(reopened.installed[0].directory).toBe(f.original.directory);
  expect(f.download).not.toHaveBeenCalled();await f.expectOriginal();
 });

 it('shows current and reviewed source fingerprints before the UI installs a new offline generation',async()=>{
  const f=await fixture(),app=fixtureApp();
  const plugin={app,settings:{bibleEdition:'kjv'},modules:f.service} as unknown as SwordDockController;
  const modal=new ModuleManagementModal(plugin,f.original.id);modal.open();await settle();
  expect(app.qaRoot.textContent).toContain('Reviewed catalogue update');
  expect(app.qaRoot.textContent).toContain('Current source SHA-256: '+f.first.source.sha256);
  expect(app.qaRoot.textContent).toContain('Reviewed source SHA-256: '+f.next.source.sha256);
  expect(app.qaRoot.querySelector('a')?.getAttribute('href')).toBe(f.next.source.sourcePage);
  expect(f.download).not.toHaveBeenCalled();
  button(app.qaRoot,'Install reviewed update').click();
  await vi.waitFor(()=>expect(app.qaRoot.textContent).toContain('Resource library updated.'));
  expect(f.download).toHaveBeenCalledTimes(1);
  expect(f.download.mock.calls[0][0]).toEqual(f.next.source);
  const current=f.service.installed[0];expect(current.directory).not.toBe(f.original.directory);
  expect(current.sourceSha256).toBe(f.next.source.sha256);
  expect((await f.service.load(current.id)).entries[0].source).toContain('Edition 2 content.');
  expect((await f.service.readVersion(f.original.directory)).entries[0].source).toContain('Edition 1 content.');
  const reopened=await f.reopen();expect(reopened.installed[0].directory).toBe(current.directory);
  expect((await reopened.load(current.id)).version).toBe('2');modal.close();
 });

 it.each(['altered-response','old-artifact'] as const)('rejects an %s update and preserves every prior stored byte',async mode=>{
  const f=await fixture(),bytes=mode==='old-artifact'?new Uint8Array(f.first.gzip):new Uint8Array(f.next.gzip);
  if(mode==='altered-response')bytes[bytes.length-1]^=1;
  f.download.mockImplementationOnce(async()=>bytes);
  await f.service.install(f.original.id);
  expect(f.service.jobs.get(f.original.id)?.status).toBe('failed');
  expect(f.service.jobs.get(f.original.id)?.error).toMatch(/checksum/);
  await f.expectOriginal();expect((await f.disk.directories()).length).toBe(new Set([...f.originalFiles.keys()].map(path=>path.split('/')[0])).size);
 });

 it('cancels an active update and retains the prior readable generation after restart',async()=>{
  const f=await fixture();let started!:()=>void,release!:()=>void,signal:AbortSignal|undefined;
  const began=new Promise<void>(resolve=>started=resolve),gate=new Promise<void>(resolve=>release=resolve);
  f.download.mockImplementationOnce(async(_source,current)=>{signal=current;started();await gate;return f.next.gzip;});
  const pending=f.service.install(f.original.id);await began;f.service.cancel(f.original.id);
  try{expect(signal?.aborted).toBe(true);}finally{release();await pending;}
  expect(f.service.jobs.get(f.original.id)?.status).toBe('cancelled');await f.expectOriginal();
 });

 it('keeps the previous choice when activation fails and retains the uncommitted verified generation',async()=>{
  const f=await fixture();f.failSave();await f.service.install(f.original.id);
  expect(f.service.jobs.get(f.original.id)?.status).toBe('failed');
  expect(f.service.jobs.get(f.original.id)?.error).toContain('Controlled management save failure');
  await f.expectOriginal();const reopened=await f.reopen();
  expect(reopened.generations).toHaveLength(2);expect(reopened.installed[0].directory).toBe(f.original.directory);
  const retained=reopened.generations.find(info=>info.directory!==f.original.directory)!;
  expect(retained.sourceSha256).toBe(f.next.source.sha256);
  expect((await reopened.readVersion(retained.directory)).version).toBe('2');
 });

 it('can explicitly roll back a successful update and persist that exact source choice offline',async()=>{
  const f=await fixture();await f.service.install(f.original.id);
  expect(f.service.jobs.get(f.original.id)?.status).toBe('ready');
  const current=f.service.installed[0];await f.service.useVersion(f.original.directory);
  let reopened=await f.reopen();expect(reopened.installed[0].directory).toBe(f.original.directory);
  expect((await reopened.load(f.original.id)).sourceSha256).toBe(f.first.source.sha256);
  await reopened.useVersion(current.directory);reopened=await f.reopen();
  expect(reopened.installed[0].directory).toBe(current.directory);
  expect((await reopened.load(f.original.id)).sourceSha256).toBe(f.next.source.sha256);
 });
});
