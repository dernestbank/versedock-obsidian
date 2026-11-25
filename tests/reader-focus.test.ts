import {describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({Modal:class{},ItemView:class{},FuzzySuggestModal:class{},MarkdownView:class{},TFile:class{},Menu:class{},Notice:vi.fn(),setIcon:()=>{}}));
import {ReaderView} from '../src/ui/reader-view';
import type {WorkspaceLeaf} from 'obsidian';
import type {SwordDockController} from '../src/controller';

function deferred(){let resolve!:()=>void;const promise=new Promise<void>(yes=>resolve=yes);return {promise,resolve};}
function fixture(){
 const view=new ReaderView({} as WorkspaceLeaf,{} as SwordDockController);
 const body={},doc={body,activeElement:body};
 const selected={focus:vi.fn(),scrollIntoView:vi.fn()};
 const scroll={querySelector:vi.fn(()=>selected),focus:vi.fn()};
 const root={isConnected:true,ownerDocument:doc};let active=true;
 Object.assign(view,{contentEl:root,scroll,app:{workspace:{getActiveViewOfType:()=>active?view:null}}});
 return {view,selected,scroll,doc,deactivate:()=>{active=false;}};
}
describe('explicit Reader focus handoff',()=>{
 it('waits for the selected passage to render before focusing it',async()=>{
  const f=fixture(),pending=deferred();Object.assign(f.view,{rendering:pending.promise});
  const action=f.view.focusPassage();expect(f.selected.focus).not.toHaveBeenCalled();
  pending.resolve();await action;
  expect(f.selected.focus).toHaveBeenCalledWith({preventScroll:true});
  expect(f.selected.scrollIntoView).toHaveBeenCalledWith({block:'nearest',behavior:'auto'});
 });
 it('waits for a superseding render and does not focus content from the earlier one',async()=>{
  const f=fixture(),first=deferred(),second=deferred();Object.assign(f.view,{rendering:first.promise});
  const action=f.view.focusPassage();Object.assign(f.view,{rendering:second.promise});first.resolve();
  await Promise.resolve();expect(f.selected.focus).not.toHaveBeenCalled();second.resolve();await action;
  expect(f.selected.focus).toHaveBeenCalledTimes(1);
 });
 it('leaves focus alone when the user moves to another control or another view while loading',async()=>{
  for(const leaveView of [false,true]){
   const f=fixture(),pending=deferred();Object.assign(f.view,{rendering:pending.promise});
   const action=f.view.focusPassage();if(leaveView)f.deactivate();else f.doc.activeElement={};
   pending.resolve();await action;expect(f.selected.focus).not.toHaveBeenCalled();expect(f.scroll.focus).not.toHaveBeenCalled();
  }
 });
 it('focuses the reading region for a chapter selection without a selected verse',async()=>{
  const f=fixture();f.scroll.querySelector.mockReturnValue(null as unknown as typeof f.selected);
  await f.view.focusPassage();expect(f.scroll.focus).toHaveBeenCalledWith({preventScroll:true});
 });
});
