import {describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({Modal:class{},ItemView:class{},FuzzySuggestModal:class{},MarkdownView:class{},TFile:class{},Menu:class{},Notice:vi.fn(),normalizePath:(value:string)=>value,setIcon:()=>{}}));
vi.mock('../src/ui/resource-content',()=>({renderResourceEntryContent:vi.fn()}));
import {renderResourceEntryContent} from '../src/ui/resource-content';
import {ReadingResourcePanel} from '../src/ui/reading-resource-panel';

function fixture(anchor?:string,clamped=false){
 const target={},other={},doc={activeElement:other};
 const loads:Array<()=>void>=[];
 const image={style:{},addEventListener:(_name:string,callback:()=>void)=>loads.push(callback)};
 let top=80;
 const viewport={ownerDocument:doc,empty:vi.fn(),createEl:vi.fn(),querySelectorAll:()=>[image],
  get scrollTop(){return top;},set scrollTop(value:number){top=clamped?Math.min(value,20):value;}};
 const jump=vi.fn(()=>{top=40;doc.activeElement=target;return true;});
 vi.mocked(renderResourceEntryContent).mockReturnValue({anchor:jump});
 const panel=Object.create(ReadingResourcePanel.prototype);
 const entry={title:'Source entry'};
 Object.assign(panel,{viewport,entry,module:{images:{}},position:{scroll:80,zoom:1},disposed:false});
 Reflect.get(panel,'renderEntry').call(panel,anchor);
 return {panel,viewport,doc,target,other,jump,load:()=>{clamped=false;loads[0]();}};
}
describe('reading-area image loading',()=>{
 it('does not move focus back to an anchor after the user focuses another control',()=>{
  const f=fixture('target');expect(f.doc.activeElement).toBe(f.target);
  f.doc.activeElement=f.other;f.load();
  expect(f.doc.activeElement).toBe(f.other);expect(f.jump).toHaveBeenCalledTimes(1);
 });
 it('keeps a user scroll made after following a source anchor',()=>{
  const f=fixture('target');f.viewport.scrollTop=140;f.load();
  expect(f.viewport.scrollTop).toBe(140);expect(f.jump).toHaveBeenCalledTimes(1);
 });
 it('keeps a user scroll made while ordinary entry images are loading',()=>{
  const f=fixture();f.viewport.scrollTop=140;f.load();expect(f.viewport.scrollTop).toBe(140);
 });
 it('finishes restoring saved scroll when image dimensions become available without intervening input',()=>{
  const f=fixture(undefined,true);expect(f.viewport.scrollTop).toBe(20);
  f.load();expect(f.viewport.scrollTop).toBe(80);
 });
 it('continues anchor alignment when focus and scroll have stayed at the requested source location',()=>{
  const f=fixture('target');f.load();expect(f.jump).toHaveBeenCalledTimes(2);
  expect(f.doc.activeElement).toBe(f.target);
 });
 it.each(['disposed','superseded'] as const)('ignores image loads from %s content',kind=>{
  const f=fixture('target');if(kind==='disposed')f.panel.disposed=true;else f.panel.entry={title:'Replacement'};
  f.load();expect(f.jump).toHaveBeenCalledTimes(1);
 });
});
