import {describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({Plugin:class{},PluginSettingTab:class{},Modal:class{},ItemView:class{},FuzzySuggestModal:class{},MarkdownView:class{},TFile:class{},Setting:class{},Menu:class{},Notice:vi.fn(),normalizePath:(value:string)=>value,setIcon:()=>{}}));
import SwordDockBiblePlugin from '../src/main';
import type {App,PluginManifest} from 'obsidian';
import type {BibleResource} from '../src/core/library';
import type {ReadingModule} from '../src/core/reading-modules';
import {ReadingInstallService} from '../src/core/reading-install-service';
import {promoteReadingModule,type ModuleStore} from '../src/core/module-installation';
const plugin=()=>new SwordDockBiblePlugin({} as App,{id:'versedock'} as PluginManifest);
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(yes=>{resolve=yes;});return {promise,resolve};}
describe('Bible edition and stored-version switching',()=>{
 it('keeps the latest user edition choice when an earlier source finishes loading late',async()=>{
  const app=plugin();const slow=deferred<BibleResource>();
  app.getBibleResource=vi.fn((id:string)=>id==='slow'?slow.promise:Promise.resolve({edition:id,metadata:{title:'Fast'}} as BibleResource));
  app.saveSettings=vi.fn(async()=>{});
  const first=app.setBibleEdition('slow');await app.setBibleEdition('fast');
  slow.resolve({edition:'slow',metadata:{title:'Slow'}} as BibleResource);await first;
  expect(app.settings.bibleEdition).toBe('fast');
 });
 it('does not cache a superseded stored generation after a newer one has loaded',async()=>{
  const app=plugin(),slow=deferred<ReadingModule>();const id='mysword-kjv';app.settings.bibleEdition=id;
  const module=(title:string):ReadingModule=>({format:1,id,kind:'bible',title,author:'A',version:title,sourcePage:'https://www.mysword.info/download-mysword/bibles',sourceSha256:'a'.repeat(64),notice:'',images:{},entries:[{key:'43.3.16',title:'John 3:16',source:title,reference:{book:43,chapter:3,verse:16,endVerse:16},blocks:[{type:'text',text:title}]}]});
  const oldInfo={id,kind:'bible',directory:'old',bytes:100},newInfo={...oldInfo,directory:'new'};
  const modules={installed:[oldInfo],load:vi.fn(()=>slow.promise),verify:async()=>{}};
  app.modules=modules as unknown as ReadingInstallService;
  const old=app.getBibleResource(id);modules.installed=[newInfo];modules.load.mockImplementation(()=>Promise.resolve(module('New')));
  await app.getBibleResource(id);slow.resolve(module('Old'));await old;
  expect(app.readerBible.metadata?.title).toBe('New');
 });
});

function decodingModule(title:string,onRead:()=>void=()=>{}):ReadingModule {
 return {format:1,id:'mysword-kjv',kind:'bible',title,author:'A',version:title,sourcePage:'',sourceSha256:'a'.repeat(64),notice:'',images:{},
  entries:Array.from({length:501},(_,index)=>{
   const chapter=Math.floor(index/100)+1,verse=index%100+1;
   return {key:'1.'+chapter+'.'+verse,title:'Verse',reference:{book:1,chapter,verse,endVerse:verse},blocks:[],get source(){onRead();return title;}};
  })};
}
describe('Bible loading across cooperative decoding',()=>{
 it('rechecks the installed generation after decoding yields to a replacement',async()=>{
  const app=plugin(),began=deferred<void>(),id='mysword-kjv';
  const old=decodingModule('Old',()=>began.resolve()),fresh=decodingModule('New');
  const oldInfo={id,kind:'bible',directory:'old',bytes:100},newInfo={...oldInfo,directory:'new'};
  const modules={installed:[oldInfo],load:vi.fn(async()=>old),verify:async()=>{}};
  app.modules=modules as unknown as ReadingInstallService;app.settings.bibleEdition=id;
  const pending=app.getBibleResource(id);await began.promise;
  modules.installed=[newInfo];modules.load.mockImplementation(async()=>fresh);
  await app.getBibleResource(id);
  expect((await pending)?.metadata?.title).toBe('New');
  expect(app.readerBible.metadata?.title).toBe('New');
 });
 it('abandons decoding when the plugin unloads and leaves the cache empty',async()=>{
  const app=plugin(),began=deferred<void>(),id='mysword-kjv';
  const module=decodingModule('Old',()=>began.resolve());
  app.modules={installed:[{id,kind:'bible',directory:'old',bytes:100}],load:async()=>module,verify:async()=>{},stop:vi.fn()} as unknown as ReadingInstallService;
  Object.assign(app,{app:{workspace:{detachLeavesOfType:vi.fn()}}});
  const pending=app.getBibleResource(id),rejected=expect(pending).rejects.toThrow(/cancelled/i);
  await began.promise;app.onunload();await rejected;
  expect(Reflect.get(app,'importedBibles').size).toBe(0);
 });
});

function generationStore(){
 const files=new Map<string,string>();
 const disk:ModuleStore={mkdir:async()=>{},write:async(path,value)=>{files.set(path,value);},
  read:async path=>{const value=files.get(path);if(value===undefined)throw Error('Missing file');return value;},
  rename:async(from,to)=>{for(const [path,value]of [...files])if(path.startsWith(from+'/')){files.set(to+path.slice(from.length),value);files.delete(path);}},
  remove:async path=>{for(const key of files.keys())if(key.startsWith(path+'/'))files.delete(key);},
  directories:async()=>[...new Set([...files.keys()].map(path=>path.split('/')[0]))]};
 return {disk,files};
}
function versionedBible(version:string):ReadingModule{
 return {format:1,id:'mysword-kjv',kind:'bible',title:'Retained Bible '+version,author:'A',version,
  sourcePage:'https://www.mysword.info/download-mysword/bibles',sourceSha256:(version==='1'?'a':'b').repeat(64),notice:'Source '+version,images:{},
  metadata:{title:'Retained Bible '+version,abbreviation:'GEN'+version,author:'A',language:'eng',version,notice:'',strongs:false,rightToLeft:false,verseRules:'',customCss:''},
  entries:[{key:'43.3.16',title:'John 3:16',source:'Source text '+version,reference:{book:43,chapter:3,verse:16,endVerse:16},blocks:[{type:'text',text:'Source text '+version}]}]};
}
describe('imported Bible integrity generation binding',()=>{
 it.each(['displayed','current'] as const)('checks the displayed generation when the %s copy is damaged',async(damaged)=>{
  const {disk,files}=generationStore(),first=await promoteReadingModule(disk,versionedBible('1')),second=await promoteReadingModule(disk,versionedBible('2'));
  const modules=new ReadingInstallService(disk,async()=>{throw Error('No SQL needed');},async()=>{throw Error('No network');});
  await modules.initialize();await modules.useVersion(first.directory);
  const app=plugin();app.modules=modules;
  const displayed=await app.getBibleResource(first.id);expect(displayed?.metadata?.abbreviation).toBe('GEN1');
  await modules.useVersion(second.directory);
  files.set((damaged==='displayed'?first:second).directory+'/content.json','damaged');
  const result=await displayed!.verifyIntegrity();
  expect(result.issues).toHaveLength(damaged==='displayed'?1:0);
  expect(displayed?.metadata?.abbreviation).toBe('GEN1');
 });
});
