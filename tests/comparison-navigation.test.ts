import {afterEach,describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({Plugin:class{},PluginSettingTab:class{},Modal:class{},ItemView:class{async setState(){}},FuzzySuggestModal:class{},MarkdownView:class{},TFile:class{},Setting:class{},Menu:class{},Notice:vi.fn(),normalizePath:(s:string)=>s,setIcon:()=>{}}));
vi.mock('../src/ui/reader-word-details',()=>({ReaderWordDetails:class{dispose(){}pin(){}}}));
import {ComparisonView} from '../src/ui/comparison-view';
import {parseReference,referenceId,type PassageReference} from '../src/core/references';
import {StudyLinkBus,type StudyLinkAssignment,type StudyLinkEvent,type StudyLinkOrigin,type StudyLinkCause} from '../src/core/link-groups';
import {DEFAULT_SETTINGS,type SwordDockController} from '../src/controller';
import type {WorkspaceLeaf,ViewStateResult} from 'obsidian';
class Element {
 children:Element[]=[];dataset:Record<string,string>={};attrs:Record<string,string>={};className='';textContent='';scrollTop=0;disabled=false;isConnected=true;
 listeners:Record<string,()=>void>={};
 createEl(_tag:string,options:{text?:string;cls?:string;attr?:Record<string,string>;value?:string}={}){const child=new Element();child.textContent=options.text??'';child.className=options.cls??'';Object.assign(child.attrs,options.attr);this.children.push(child);return child;}
 createDiv(options={}){return this.createEl('div',options);}createSpan(options={}){return this.createEl('span',options);}
 addClass(...names:string[]){this.className+=' '+names.join(' ');}setAttribute(key:string,value:string){this.attrs[key]=value;}
 setText(text:string){this.textContent=text;}addEventListener(name:string,callback:()=>void){this.listeners[name]=callback;}
 empty(){this.children=[];}toggleClass(){}focus(){}click(){if(!this.disabled)this.listeners.click?.();}
 matches(selector:string){if(selector.startsWith('.'))return this.className.split(/\s+/).includes(selector.slice(1));const attr=/^\[([^=]+)="([^"]+)"\]$/.exec(selector);return !!attr&&this.attrs[attr[1]]===attr[2];}
 querySelectorAll(selector:string):Element[]{return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
 querySelector(selector:string){return this.querySelectorAll(selector)[0]??null;}
}
afterEach(()=>vi.unstubAllGlobals());
function fixture(assignment:StudyLinkAssignment){
 vi.stubGlobal('window',{clearTimeout:vi.fn()});const bus=new StudyLinkBus(),root=new Element();
 const plugin={settings:{...DEFAULT_SETTINGS},currentRef:parseReference('John 3:16'),library:{getChapterCount:()=>21},
  availableBibleEditions:()=>[{id:'webp',title:'WEB'},{id:'kjv',title:'KJV'}],getStudyLinkAssignment:()=>assignment,
  subscribe:()=>()=>{},subscribeStudyLinks:(listener:(event:StudyLinkEvent)=>void)=>bus.subscribe(listener),
  getBibleResource:async()=>({metadata:{title:'Bible'},getChapter:async()=>({verses:[{verse:16,text:'Source text'}]})}),
  canNavigateBack:()=>true,canNavigateForward:()=>true,navigateBack:vi.fn(),navigateForward:vi.fn(),
  selectReference:vi.fn((ref:PassageReference,origin:StudyLinkOrigin,cause:StudyLinkCause)=>{plugin.currentRef=ref;if(assignment.group!=='unlinked')bus.publish({eventId:crypto.randomUUID(),timestamp:1,origin,group:assignment.group,osis:referenceId(ref),cause,sourceVersification:'osis',selectionKind:'chapter'});})};
 const view=new ComparisonView({} as WorkspaceLeaf,plugin as unknown as SwordDockController);
 Object.assign(view,{contentEl:root,app:{workspace:{requestSaveLayout:vi.fn()}}});
 const button=(name:string)=>{const value=root.querySelector('[aria-label="'+name+'"]');if(!value)throw Error('Missing '+name);return value;};
 const emit=(osis:string,group:'A'|'B'='A')=>bus.publish({eventId:crypto.randomUUID(),timestamp:1,origin:'reader',group,osis,cause:'navigation',sourceVersification:'osis',selectionKind:'chapter'});
 return {view,plugin,button,emit,ref:()=>view.getState().reference};
}
const back='Back to previous passage',forward='Forward to next passage',next='Next chapter';
describe('Comparison pane navigation history',()=>{
 it('starts empty even when Reader has back and forward history',async()=>{
  const f=fixture({group:'unlinked',mode:'follow'});await f.view.onOpen();
  expect(f.button(back).disabled).toBe(true);expect(f.button(forward).disabled).toBe(true);await f.view.onClose();
 });
 it.each([{group:'unlinked',mode:'follow'},{group:'A',mode:'pinned'}] as const)('travels through its own chapters without changing Reader: %j',async assignment=>{
  const f=fixture(assignment);await f.view.onOpen();f.button(next).click();expect(f.ref()).toBe('John.4');
  f.button(back).click();expect(f.ref()).toBe('John.3.16');expect(f.button(back).disabled).toBe(true);
  f.button(forward).click();expect(f.ref()).toBe('John.4');expect(f.button(forward).disabled).toBe(true);
  expect(referenceId(f.plugin.currentRef)).toBe('John.3.16');expect(f.plugin.navigateBack).not.toHaveBeenCalled();expect(f.plugin.navigateForward).not.toHaveBeenCalled();await f.view.onClose();
 });
 it('clears the forward branch after a new chapter navigation',async()=>{
  const f=fixture({group:'unlinked',mode:'follow'});await f.view.onOpen();f.button(next).click();f.button(next).click();
  f.button(back).click();expect(f.ref()).toBe('John.4');f.button('Previous chapter').click();
  expect(f.ref()).toBe('John.3');expect(f.button(forward).disabled).toBe(true);await f.view.onClose();
 });
 it('records followed link changes and sends history through the Comparison origin',async()=>{
  const f=fixture({group:'A',mode:'follow'});await f.view.onOpen();f.emit('John.8');f.emit('John.8');f.emit('John.12','B');
  expect(f.ref()).toBe('John.8');f.button(back).click();expect(f.ref()).toBe('John.3.16');expect(f.button(back).disabled).toBe(true);
  expect(f.plugin.selectReference).toHaveBeenLastCalledWith(parseReference('John 3:16'),'comparison','history');
  f.button(forward).click();expect(f.ref()).toBe('John.8');expect(f.button(forward).disabled).toBe(true);await f.view.onClose();
 });
 it('resets transient history when workspace state restores a different passage',async()=>{
  const f=fixture({group:'unlinked',mode:'follow'});await f.view.onOpen();f.button(next).click();
  await f.view.setState({reference:'Ps.119.1-176',leftEdition:'webp',rightEdition:'kjv'},{} as ViewStateResult);
  expect(f.ref()).toBe('Ps.119.1-176');expect(f.button(back).disabled).toBe(true);expect(f.button(forward).disabled).toBe(true);await f.view.onClose();
 });
 it.each([{group:'unlinked',mode:'follow'},{group:'A',mode:'pinned'}] as const)('ignores incoming Reader links while independent: %j',async assignment=>{
  const f=fixture(assignment);await f.view.onOpen();f.emit('John.8');expect(f.ref()).toBe('John.3.16');await f.view.onClose();
 });
 it('records pinned word passages and clears a stale forward branch',async()=>{
  const f=fixture({group:'unlinked',mode:'follow'});await f.view.onOpen();f.button(next).click();f.button(back).click();
  expect(f.button(forward).disabled).toBe(false);
  Reflect.get(f.view,'pinWord').call(f.view,{ref:parseReference('John 3:17')});
  expect(f.ref()).toBe('John.3.17');expect(f.button(forward).disabled).toBe(true);expect(f.button(back).disabled).toBe(false);
  f.button(back).click();expect(f.ref()).toBe('John.3.16');expect(referenceId(f.plugin.currentRef)).toBe('John.3.16');await f.view.onClose();
 });
 it('bounds transient history while retaining the most recent passages',async()=>{
  const f=fixture({group:'A',mode:'follow'});await f.view.onOpen();
  for(let verse=1;verse<=150;verse++)f.emit('Ps.119.'+verse);
  let traversed=0;while(!f.button(back).disabled&&traversed<200){f.button(back).click();traversed++;}
  expect(traversed).toBe(100);expect(f.ref()).toBe('Ps.119.50');await f.view.onClose();
 });
});
