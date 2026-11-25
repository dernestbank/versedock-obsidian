import {describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({setIcon:()=>{}}));
vi.mock('../src/ui/module-management-modal',()=>({ModuleManagementModal:class{}}));
import {renderReadingDownloads} from '../src/ui/reading-downloads';
import type {SwordDockController} from '../src/controller';

class Element {
 children:Element[]=[];parent:Element|null=null;dataset:Record<string,string>={};textContent='';hidden=false;
 listeners=new Map<string,()=>void>();
 constructor(readonly tag:string,readonly ownerDocument:{activeElement:Element|null}){}
 get isConnected():boolean{return this.tag==='root'||!!this.parent?.isConnected;}
 createEl(tag:string,options:{text?:string}={}):Element{const child=new Element(tag,this.ownerDocument);child.textContent=options.text??'';child.parent=this;this.children.push(child);return child;}
 createDiv():Element{return this.createEl('div');}
 setText(text:string):void{this.textContent=text;}
 empty():void{for(const child of this.children)child.parent=null;this.children=[];}
 remove():void{if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;}
 addEventListener(name:string,callback:()=>void):void{this.listeners.set(name,callback);}
 focus():void{this.ownerDocument.activeElement=this;}
 click():void{if(this.isConnected)this.listeners.get('click')?.();}
 all(tag:string):Element[]{return this.children.flatMap(child=>[...(child.tag===tag?[child]:[]),...child.all(tag)]);}
}
function fixture(){
 const doc={activeElement:null as Element|null},root=new Element('root',doc);
 const job={id:'mysword-jfb',title:'JFB',status:'downloading',received:524288,total:5400000,error:''};
 let update=()=>{};const unsubscribe=vi.fn();
 const modules={downloadCapabilities:{networkAbort:true},jobs:new Map([[job.id,job]]),cancel:vi.fn(),install:vi.fn(),subscribe:(listener:()=>void)=>{update=listener;return unsubscribe;}};
 const plugin={modules,openResources:vi.fn(),openMySwordInspector:vi.fn()};
 const stop=renderReadingDownloads(root as unknown as HTMLElement,plugin as unknown as SwordDockController);
 return {root,doc,job,modules,plugin,emit:()=>update(),stop,unsubscribe};
}
describe('download interaction stability',()=>{
 it('keeps the pressed Cancel target connected across byte updates',()=>{
  const f=fixture(),pressed=f.root.all('button')[0];pressed.focus();
  f.job.received=1048576;f.emit();f.job.received=1572864;f.emit();
  expect(f.root.all('button')[0]).toBe(pressed);expect(pressed.isConnected).toBe(true);
  expect(f.doc.activeElement).toBe(pressed);pressed.click();expect(f.modules.cancel).toHaveBeenCalledWith(f.job.id);
  expect(f.root.all('p').some(p=>p.textContent.includes('1.5 MB'))).toBe(true);
 });
 it('changes terminal actions safely while retaining keyboard focus and current handlers',()=>{
  const f=fixture(),cancel=f.root.all('button')[0];cancel.focus();f.job.status='cancelled';f.emit();
  const retry=f.root.all('button')[0];expect(retry.textContent).toBe('Retry');expect(f.doc.activeElement).toBe(retry);
  expect(cancel.isConnected).toBe(false);cancel.click();expect(f.modules.cancel).not.toHaveBeenCalled();
  retry.click();expect(f.modules.install).toHaveBeenCalledWith(f.job.id);
  f.job.status='ready';f.emit();const open=f.root.all('button')[0];expect(open.textContent).toBe('Open');open.click();
  expect(f.plugin.openResources).toHaveBeenCalledWith(f.job.id);
 });
 it('does not steal focus when background status changes and releases its subscription',()=>{
  const f=fixture(),other=f.root.createEl('input');other.focus();f.job.status='failed';f.emit();
  expect(f.doc.activeElement).toBe(other);f.stop();expect(f.unsubscribe).toHaveBeenCalledOnce();
 });
});
