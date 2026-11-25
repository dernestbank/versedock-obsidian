import {afterEach,describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({ItemView:class{app:any;contentEl:any;constructor(leaf:any){this.app=leaf.app;this.contentEl=leaf.app.qaRoot;}},Modal:class{app:any;contentEl:any;constructor(app:any){this.app=app;this.contentEl=app.qaRoot;}open(){this.contentEl.connected=true;(this as any).onOpen();}close(){(this as any).onClose();this.contentEl.connected=false;}},MarkdownView:class{},FuzzySuggestModal:class{},TFile:class{},Menu:class{},Notice:vi.fn(),setIcon:()=>{}}));
vi.mock('../src/ui/search-highlights',()=>({renderSearchHighlights:(target:any,text:string)=>target.setText(text)}));
import {MarkdownView} from 'obsidian';
import {SearchView} from '../src/ui/search-view';
import {LibraryView} from '../src/ui/library-view';
import {ReferenceModal} from '../src/ui/reference-modal';
import {ResourceStorageModal} from '../src/ui/resource-storage-modal';
import {DEFAULT_SETTINGS,type SwordDockController} from '../src/controller';
import {parseReference} from '../src/core/references';
import {fixtureApp,deferred,settle,button} from './ui-fixture';
import type {WorkspaceLeaf} from 'obsidian';
const ref=parseReference('John 3:16');
function bible(abbreviation:string){const verse={verse:16,text:abbreviation+' mercy'};return {edition:'local-bible-one',metadata:{abbreviation,title:abbreviation},getPassage:vi.fn(async()=>[verse]),search:vi.fn(async(_options:any)=>({results:[{...verse,label:'John 3:16',book:ref.book,chapter:3}],truncated:false,total:1}))};}
function fixture(){
 const app=fixtureApp(),listeners=new Set<()=>void>();let current=bible('OLD');
 vi.stubGlobal('document',app.qaDoc);vi.stubGlobal('window',{setTimeout,clearTimeout});
 const blank=()=>({metadata:null,initialize:vi.fn(async()=>true),getStorageSummary:async()=>({bytes:0,files:0,missing:0})});
 const plugin={app,settings:{...DEFAULT_SETTINGS,bibleEdition:'local-bible-one'},currentRef:ref,get readerBible(){return current;},
  library:blank(),kjv:blank(),lexicon:blank(),crossReferences:blank(),commentary:blank(),interlinear:{...blank(),available:false},
  subscribe(callback:()=>void){listeners.add(callback);return()=>listeners.delete(callback);},
  modules:{installed:[] as any[],jobs:new Map(),subscribe:()=>()=>{},storageSummary:()=>({bytes:0,files:0})},saveSettings:async()=>{}};
 return {app,plugin:plugin as unknown as SwordDockController,raw:plugin,listeners,old:current,use(next:ReturnType<typeof bible>){current=next;this.emit();},emit(){for(const callback of listeners)callback();}};
}
afterEach(()=>vi.unstubAllGlobals());
async function searchFixture(){const f=fixture(),view=new SearchView({app:f.app} as unknown as WorkspaceLeaf,f.plugin);await view.onOpen();const input=f.app.qaRoot.querySelector('input[aria-label="Bible search phrase"]')!;input.value='mercy';return {...f,view,input,search:()=>button(f.app.qaRoot,'Search').click()};}
describe('Search source ownership',()=>{
 it('refreshes results after the same edition ID receives a new Bible generation',async()=>{
  const f=await searchFixture();f.search();await settle();expect(f.app.qaRoot.textContent).toContain('OLD mercy');
  const fresh=bible('NEW');f.use(fresh);await settle();expect(f.app.qaRoot.textContent).toContain('NEW mercy');expect(f.app.qaRoot.textContent).not.toContain('OLD mercy');expect(f.input.value).toBe('mercy');await f.view.onClose();
 });
 it('aborts an old generation search and ignores its late result',async()=>{
  const f=await searchFixture(),gate=deferred<any>();f.old.search.mockImplementationOnce(()=>gate.promise);f.search();const signal=f.old.search.mock.calls[0][0].signal;
  f.use(bible('NEW'));await settle();expect(signal.aborted).toBe(true);gate.resolve({results:[{verse:16,text:'STALE mercy',label:'John 3:16',book:ref.book,chapter:3}],truncated:false});await settle();expect(f.app.qaRoot.textContent).toContain('NEW mercy');expect(f.app.qaRoot.textContent).not.toContain('STALE mercy');await f.view.onClose();
 });
 it('preserves query, input identity and ready results on unrelated notifications',async()=>{
  const f=await searchFixture();f.search();await settle();f.input.focus();f.emit();await settle();expect(f.old.search).toHaveBeenCalledOnce();expect(f.app.qaDoc.activeElement).toBe(f.input);expect(f.app.qaRoot.querySelector('input[aria-label="Bible search phrase"]')).toBe(f.input);await f.view.onClose();
 });
 it('clears busy state when a short query replaces a pending search',async()=>{
  const f=await searchFixture(),gate=deferred<any>();f.old.search.mockImplementationOnce(()=>gate.promise);f.search();f.input.value='x';f.search();expect(f.app.qaRoot.querySelector('.vd-search-status')?.getAttribute('aria-busy')).toBe('false');gate.resolve({results:[],truncated:false});await settle();expect(f.app.qaRoot.textContent).toContain('Enter a search term');await f.view.onClose();
 });
 it('still reruns scoped searches when Reader changes the current chapter',async()=>{
  const f=await searchFixture(),scope=f.app.qaRoot.querySelector('select[aria-label="Bible search scope"]')!;scope.value='current-chapter';f.search();await settle();f.raw.currentRef=parseReference('John 4:1');f.emit();await settle();expect(f.old.search).toHaveBeenCalledTimes(2);expect(f.old.search.mock.calls[1][0].currentChapter).toBe(4);await f.view.onClose();
 });
});
describe('Quick Jump/Insert source ownership',()=>{
 it.each(['pending','ready'] as const)('refreshes a %s preview after a source-generation switch',async stage=>{
  const f=fixture(),gate=deferred<any>();if(stage==='pending')f.old.getPassage.mockImplementationOnce(()=>gate.promise);
  const modal=new ReferenceModal(f.plugin,'insert');modal.onOpen();if(stage==='ready')await settle();const input=f.app.qaRoot.querySelector('input[aria-label="Scripture reference"]')!;
  f.use(bible('NEW'));if(stage==='pending')gate.resolve([{verse:16,text:'OLD mercy'}]);await settle();
  expect(f.app.qaRoot.textContent).toContain('NEW mercy');expect(f.app.qaRoot.textContent).not.toContain('OLD mercy');expect(input.value).toBe('John 3:16');expect(f.app.qaDoc.activeElement).toBe(input);modal.onClose();
 });
 it('ignores unrelated events and removes its source subscription when closed',async()=>{
  const f=fixture(),modal=new ReferenceModal(f.plugin,'insert');modal.onOpen();await settle();f.emit();await settle();expect(f.old.getPassage).toHaveBeenCalledOnce();modal.onClose();const fresh=bible('NEW');f.use(fresh);await settle();expect(fresh.getPassage).not.toHaveBeenCalled();expect(f.listeners.size).toBe(0);
 });
});
describe('Library measurements and recheck lifetime',()=>{
 it.each(['kjv','lexicon','interlinear','local'] as const)('shows measured storage when only %s is ready',async type=>{
  const f=fixture();if(type==='local'){f.raw.modules.installed.push({id:'local-one'});f.raw.modules.storageSummary=()=>({bytes:4096,files:2});}
  else {const resource=f.raw[type] as any;if(type==='interlinear')resource.available=true;else resource.metadata={title:'Ready'};resource.getStorageSummary=async()=>({bytes:4096,files:2,missing:0});}
  const view=new LibraryView({app:f.app} as unknown as WorkspaceLeaf,f.plugin);await Reflect.get(view,'updateStorageMetrics').call(view,f.app.qaRoot);
  expect(f.app.qaRoot.textContent).toContain('4.0 KB measured locally');expect(f.app.qaRoot.textContent).toContain('2 files');
 });
 it('retains the empty-storage message when nothing is measured',async()=>{
  const f=fixture(),view=new LibraryView({app:f.app} as unknown as WorkspaceLeaf,f.plugin);await Reflect.get(view,'updateStorageMetrics').call(view,f.app.qaRoot);expect(f.app.qaRoot.textContent).toBe('No installed files measured.');
 });
 it.each(['closed','reopened','current'] as const)('refreshes only its current opening after recheck: %s',async state=>{
  const f=fixture(),gate=deferred<boolean>();f.raw.library.initialize.mockImplementationOnce(()=>gate.promise);
  const view=new LibraryView({app:f.app} as unknown as WorkspaceLeaf,f.plugin),render=vi.spyOn(view as any,'render').mockImplementation(()=>{});
  await view.onOpen();Reflect.get(view,'recheck').call(view);if(state!=='current')await view.onClose();if(state==='reopened')await view.onOpen();const before=render.mock.calls.length;
  gate.resolve(true);await settle();expect(render).toHaveBeenCalledTimes(before+(state==='current'?1:0));await view.onClose();
 });
});
describe('Storage operation completion ownership',()=>{
 it.each(['cleanup','recover'] as const)('does not load another review after %s finishes in an old opening',async operation=>{
  for(const reopen of [false,true]){
   const f=fixture(),gate=deferred<any>(),item={directory:'owned-stage',title:'QA data',category:'staging',bytes:512,files:3,cleanupEligible:true,recoverable:operation==='recover',reason:'Reviewed fixture'};
   const previewStorage=vi.fn(async()=>({ticket:'review',items:[item],totalBytes:512,totalFiles:3,complete:true}));Object.assign(f.raw.modules,{previewStorage,cleanupStorage:()=>gate.promise,recoverStage:()=>gate.promise});
   const modal=new ResourceStorageModal(f.plugin);modal.open();await settle();if(operation==='cleanup'){button(f.app.qaRoot,'Select eligible data').click();button(f.app.qaRoot,'Move selected to vault Trash').click();}else button(f.app.qaRoot,'Recover this resource').click();
   modal.close();if(reopen){modal.open();await settle();}const before=previewStorage.mock.calls.length;
   gate.resolve(operation==='cleanup'?{moved:1,bytes:512}:{title:'Recovered fixture'});await settle();expect(previewStorage).toHaveBeenCalledTimes(before);if(reopen)modal.close();
  }
 });
});
it('does not insert an old source after its preview has changed to a new generation',async()=>{
 const f=fixture(),gate=deferred<any>(),editor={getValue:()=> 'Original note',getCursor:()=>({line:0,ch:0}),replaceRange:vi.fn()},view=new MarkdownView({} as WorkspaceLeaf);
 Object.assign(view,{file:{path:'QA.md'},editor,getMode:()=> 'source'});Object.assign(f.app.workspace,{getActiveViewOfType:()=>view,getLeavesOfType:()=>[{view}]});
 const modal=new ReferenceModal(f.plugin,'insert');modal.onOpen();await settle();f.old.getPassage.mockImplementationOnce(()=>gate.promise);button(f.app.qaRoot,'Insert callout').click();
 f.use(bible('NEW'));gate.resolve([{verse:16,text:'OLD mercy'}]);await settle();expect(editor.replaceRange).not.toHaveBeenCalled();expect(f.app.qaRoot.textContent).toContain('NEW mercy');modal.onClose();
});
it('refreshes a current storage dialog after its reviewed cleanup finishes',async()=>{
 const f=fixture(),gate=deferred<any>(),item={directory:'owned-stage',title:'QA data',category:'staging',bytes:512,files:3,cleanupEligible:true,recoverable:false,reason:'Reviewed fixture'};
 const previewStorage=vi.fn(async()=>({ticket:'review',items:[item],totalBytes:512,totalFiles:3,complete:true}));Object.assign(f.raw.modules,{previewStorage,cleanupStorage:()=>gate.promise});
 const modal=new ResourceStorageModal(f.plugin);modal.open();await settle();button(f.app.qaRoot,'Select eligible data').click();button(f.app.qaRoot,'Move selected to vault Trash').click();gate.resolve({moved:1,bytes:512});await settle();expect(previewStorage).toHaveBeenCalledTimes(2);expect(f.app.qaRoot.textContent).toContain('Moved 1 folder(s)');modal.close();
});
