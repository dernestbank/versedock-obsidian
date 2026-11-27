import {describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({Plugin:class{},PluginSettingTab:class{},Modal:class{},ItemView:class{},FuzzySuggestModal:class{},MarkdownView:class{},TFile:class{},Setting:class{},Menu:class{},Notice:vi.fn(),normalizePath:(s:string)=>s,setIcon:()=>{}}));
import SwordDockBiblePlugin from '../src/main';
import {ResourcesView} from '../src/ui/resources-view';
import type {App,PluginManifest,WorkspaceLeaf} from 'obsidian';
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(yes=>resolve=yes);return {promise,resolve};}
describe('Resources opening from deferred workspace leaves',()=>{
 it('waits for an existing deferred leaf before selecting the requested installed module',async()=>{
  const plugin=new SwordDockBiblePlugin({} as App,{id:'versedock'} as PluginManifest),gate=deferred();
  const view=new ResourcesView({} as WorkspaceLeaf,plugin),open=vi.spyOn(view,'openModule').mockImplementation(()=>{});
  const leaf={view:{},loadIfDeferred:vi.fn(async()=>{await gate.promise;leaf.view=view;})};
  Object.assign(plugin,{openView:vi.fn(async()=>leaf)});
  const opening=plugin.openResources('local-book', '3');await Promise.resolve();expect(open).not.toHaveBeenCalled();
  gate.resolve();await opening;expect(open).toHaveBeenCalledWith('local-book', '3');
 });
 it('opens a warm Resources view without changing its current module when no target is given',async()=>{
  const plugin=new SwordDockBiblePlugin({} as App,{id:'versedock'} as PluginManifest);
  const view=new ResourcesView({} as WorkspaceLeaf,plugin),open=vi.spyOn(view,'openModule').mockImplementation(()=>{});
  Object.assign(plugin,{openView:vi.fn(async()=>({view,loadIfDeferred:async()=>{}}))});
  await plugin.openResources();expect(open).not.toHaveBeenCalled();
 });
});
