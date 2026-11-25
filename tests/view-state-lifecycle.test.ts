import {afterEach,describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({Modal:class{},ItemView:class{},FuzzySuggestModal:class{},MarkdownView:class{},TFile:class{},Menu:class{},Notice:vi.fn(),setIcon:()=>{}}));
vi.mock('../src/ui/reader-word-details',()=>({ReaderWordDetails:class{dispose(){}}}));
import type {InterlinearVerse} from '../src/core/interlinear';
import {InterlinearPanel} from '../src/ui/interlinear-panel';
import {ReaderView} from '../src/ui/reader-view';
import {ResourcesView} from '../src/ui/resources-view';
import {DEFAULT_SETTINGS,type SwordDockController} from '../src/controller';
import {parseReference} from '../src/core/references';
import type {WorkspaceLeaf} from 'obsidian';
import type {ChapterData} from '../src/core/library';
type Doc={body:Element;activeElement:Element|null};
class Element {
 children:Element[]=[];parent:Element|null=null;dataset:Record<string,string>={};attributes:Record<string,string>={};
 className='';textContent='';scrollTop=0;clientWidth=400;emptyCalls=0;style={setProperty:vi.fn()};
 scrollIntoView=vi.fn();
 constructor(readonly tag:string,readonly ownerDocument:Doc){}
 get isConnected():boolean{return this.tag==='body'||!!this.parent?.isConnected;}
 createEl(tag:string,options:{text?:string;cls?:string;attr?:Record<string,string>;value?:string}={}):Element{
  const child=new Element(tag,this.ownerDocument);child.className=options.cls??'';child.textContent=options.text??'';child.parent=this;
  for(const [key,value]of Object.entries(options.attr??{}))child.setAttribute(key,value);
  this.children.push(child);return child;
 }
 createDiv(options={}){return this.createEl('div',options);}createSpan(options={}){return this.createEl('span',options);}
 setText(text:string){this.textContent=text;}addClass(...names:string[]){this.className+=' '+names.join(' ');}
 hasClass(name:string){return this.className.split(/\s+/).includes(name);}
 setAttribute(key:string,value:string){this.attributes[key]=value;}
 addEventListener(){}toggleClass(name:string,on:boolean){if(on)this.addClass(name);}
 contains(node:Element|null):boolean{for(let at=node;at;at=at.parent)if(at===this)return true;return false;}
 matches(selector:string):boolean{
  if(selector.startsWith('.'))return selector.slice(1).split('.').every(name=>this.hasClass(name));
  const attr=/^\[([^=]+)="([^"]+)"\]$/.exec(selector);return !!attr&&(this.attributes[attr[1]]??this.dataset[attr[1].replace(/^data-/,'').replace(/-([a-z])/g,(_match,letter:string)=>letter.toUpperCase())])===attr[2];
 }
 closest(selector:string):Element|null{for(let at:Element|null=this;at;at=at.parent)if(at.matches(selector))return at;return null;}
 querySelectorAll(selector:string):Element[]{return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
 querySelector(selector:string):Element|null{return this.querySelectorAll(selector)[0]??null;}
 empty(){this.emptyCalls++;if(this.contains(this.ownerDocument.activeElement))this.ownerDocument.activeElement=this.ownerDocument.body;for(const child of this.children)child.parent=null;this.children=[];}
 focus(){this.ownerDocument.activeElement=this;}
}
function environment(){
 const doc={} as Doc;doc.body=new Element('body',doc);doc.activeElement=doc.body;
 vi.stubGlobal('document',doc);vi.stubGlobal('HTMLInputElement',class{});
 vi.stubGlobal('window',{clearTimeout:vi.fn()});
 return {doc,root:doc.body.createDiv(),outside:doc.body.createEl('input')};
}
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(yes=>resolve=yes);return {promise,resolve};}
afterEach(()=>vi.unstubAllGlobals());
function resourceFixture(){
 const env=environment();let emit=()=>{};
 const installed=[{id:'book-one',kind:'book',directory:'book-v1'},{id:'comment-one',kind:'commentary',directory:'comment-v1'}];
 const plugin={currentRef:parseReference('John 3:16'),subscribe:()=>()=>{},modules:{installed,subscribe:(callback:()=>void)=>{emit=callback;return()=>{};}}};
 const view=new ResourcesView({} as WorkspaceLeaf,plugin as unknown as SwordDockController);
 Object.assign(view,{contentEl:env.root,app:{workspace:{requestSaveLayout:vi.fn()}},choices:()=>[]});
 return {...env,view,installed,emit:()=>emit()};
}
describe('Resources inventory render stability',()=>{
 it.each(['type','open-module'] as const)('does not rebuild on unrelated progress after a %s switch',async(kind)=>{
  const f=resourceFixture();await f.view.onOpen();
  if(kind==='type')Reflect.get(f.view,'selectType').call(f.view,'book');else f.view.openModule('book-one');
  const renders=f.root.emptyCalls;f.emit();f.emit();
  expect(f.root.emptyCalls).toBe(renders);await f.view.onClose();
 });
 it('still rebuilds once when the selected type actually changes generation',async()=>{
  const f=resourceFixture();await f.view.onOpen();Reflect.get(f.view,'selectType').call(f.view,'book');
  const renders=f.root.emptyCalls;f.installed[0].directory='book-v2';f.emit();f.emit();
  expect(f.root.emptyCalls).toBe(renders+1);await f.view.onClose();
 });
 it('leaves an unchanged initial inventory alone',async()=>{
  const f=resourceFixture();await f.view.onOpen();const renders=f.root.emptyCalls;f.emit();
  expect(f.root.emptyCalls).toBe(renders);await f.view.onClose();
 });
});
function readerLifecycle(){
 const env=environment(),observers:Array<{observe:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>}>=[];
 vi.stubGlobal('ResizeObserver',class{observe=vi.fn();disconnect=vi.fn();constructor(){observers.push(this);}});
 const plugin={subscribe:()=>vi.fn()};
 const view=new ReaderView({} as WorkspaceLeaf,plugin as unknown as SwordDockController);
 Object.assign(view,{contentEl:env.root,registerDomEvent:vi.fn(),addAction:vi.fn()});
 return {...env,view,observers};
}
describe('Reader opening lifetime',()=>{
 it('does not observe a view closed while its first render was pending',async()=>{
  const f=readerLifecycle(),gate=deferred<void>();f.view.render=()=>gate.promise;
  const opening=f.view.onOpen();await f.view.onClose();gate.resolve();await opening;
  expect(f.observers).toHaveLength(0);
 });
 it('does not attach an observer from an earlier opening after the same view reopens',async()=>{
  const f=readerLifecycle(),first=deferred<void>(),second=deferred<void>();
  f.view.render=vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const old=f.view.onOpen();await f.view.onClose();const fresh=f.view.onOpen();
  first.resolve();await old;expect(f.observers).toHaveLength(0);
  second.resolve();await fresh;expect(f.observers).toHaveLength(1);await f.view.onClose();
  expect(f.observers[0].disconnect).toHaveBeenCalledOnce();
 });
 it('observes a current live view and disconnects it when closed',async()=>{
  const f=readerLifecycle();f.view.render=async()=>{};await f.view.onOpen();
  expect(f.observers).toHaveLength(1);expect(f.observers[0].observe).toHaveBeenCalledWith(f.root);
  await f.view.onClose();expect(f.observers[0].disconnect).toHaveBeenCalledOnce();
 });
});
describe('Reader word focus after asynchronous rendering',()=>{
 it.each([false,true])('respects newer external focus: %s',async(moved)=>{
  const env=environment(),gate=deferred<ChapterData>(),ref=parseReference('John 3:16'),token={text:'loved',strongs:['G25']};
  const plugin={currentRef:ref,settings:{...DEFAULT_SETTINGS,bibleEdition:'kjv'},selectedWord:{ref,token,index:0},
   readerBible:{metadata:{title:'KJV',abbreviation:'KJV',books:[],license:'Public domain'},getChapter:()=>gate.promise},
   getStudyLinkAssignment:()=>({group:'unlinked',mode:'follow'}),canNavigateBack:()=>false,canNavigateForward:()=>false};
  const view=new ReaderView({} as WorkspaceLeaf,plugin as unknown as SwordDockController);
  const old=env.root.createDiv();old.dataset.chapter=ref.book.vpl+'.3';old.dataset.mode='classic';
  const row=old.createDiv({cls:'vd-verse is-selected'});row.dataset.verse='16';row.createEl('button').focus();
  Object.assign(view,{contentEl:env.root,scroll:old});
  const rendering=view.render();if(moved)env.outside.focus();
  gate.resolve({chapter:3,verses:[{verse:16,text:'loved',tokens:[token]}]});await rendering;
  if(moved)expect(env.doc.activeElement).toBe(env.outside);
  else expect(env.doc.activeElement?.dataset.wordIndex).toBe('0');
 });
});

describe('companion focus after asynchronous loading',()=>{
 it.each(['unchanged','outside-before','outside-after','new-inside','disposed'] as const)('respects current focus: %s',async state=>{
  const env=environment(),gate=deferred<InterlinearVerse>(),ready=vi.fn();
  const plugin={settings:{...DEFAULT_SETTINGS,interlinear:{...DEFAULT_SETTINGS.interlinear}},interlinear:{getVerse:()=>gate.promise},saveSettings:async()=>{}};
  if(state==='outside-before')env.outside.focus();
  const panel=new InterlinearPanel(env.root as unknown as HTMLElement,plugin as unknown as SwordDockController,parseReference('John 3:16'),21,'next',ready);
  if(state==='outside-after')env.outside.focus();
  if(state==='new-inside')env.root.createEl('input').focus();
  if(state==='disposed')panel.dispose();
  gate.resolve({sourceId:'bsb-interlinear',book:parseReference('John 3:16').book,chapter:3,verse:16,words:[]});await Promise.resolve();await Promise.resolve();
  if(state==='unchanged')expect(env.doc.activeElement?.attributes['aria-label']).toBe('Next companion verse');
  else expect(env.doc.activeElement?.attributes['aria-label']).not.toBe('Next companion verse');
  if(state==='outside-before'||state==='outside-after')expect(env.doc.activeElement).toBe(env.outside);
  if(state==='disposed')expect(ready).not.toHaveBeenCalled();panel.dispose();
 });
});

describe('Reader position after companion readiness',()=>{
 it.each(['unchanged','scrolled','outside-focus','preferences'] as const)('aligns only the original unchanged context: %s',async state=>{
  const env=environment(),gate=deferred<InterlinearVerse>(),ref=parseReference('John 3:16');
  const plugin={currentRef:ref,settings:{...DEFAULT_SETTINGS,bibleEdition:'kjv',kjvDisplayMode:'interlinear',interlinear:{...DEFAULT_SETTINGS.interlinear}},selectedWord:null,
   readerBible:{metadata:{title:'KJV',abbreviation:'KJV',books:[],license:'Fixture'},getChapter:async()=>({chapter:3,verses:[{verse:16,text:'KJV Scripture'}]})},
   interlinear:{getVerse:()=>gate.promise},getStudyLinkAssignment:()=>({group:'unlinked',mode:'follow'}),canNavigateBack:()=>false,canNavigateForward:()=>false,saveSettings:async()=>{}};
  const view=new ReaderView({} as WorkspaceLeaf,plugin as unknown as SwordDockController);Object.assign(view,{contentEl:env.root});await view.render();
  const row=env.root.querySelector('.vd-verse.is-selected')!,scroll=Reflect.get(view,'scroll') as Element,before=row.scrollIntoView.mock.calls.length;
  if(state==='scrolled')scroll.scrollTop=140;if(state==='outside-focus')env.outside.focus();
  gate.resolve({sourceId:'bsb-interlinear',book:ref.book,chapter:3,verse:16,words:[]});await Promise.resolve();await Promise.resolve();
  expect(row.scrollIntoView).toHaveBeenCalledTimes(before+(state==='scrolled'||state==='outside-focus'?0:1));
  if(state==='preferences'){
   const after=row.scrollIntoView.mock.calls.length;
   Reflect.get(Reflect.get(view,'interlinearPanel'),'update').call(Reflect.get(view,'interlinearPanel'),'font','serif');
   expect(row.scrollIntoView).toHaveBeenCalledTimes(after);
  }
  if(state==='scrolled')expect(scroll.scrollTop).toBe(140);if(state==='outside-focus')expect(env.doc.activeElement).toBe(env.outside);
 });
});
