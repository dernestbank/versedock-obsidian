import {afterEach,describe,expect,it,vi} from 'vitest';
vi.mock('obsidian',()=>({Modal:class{contentEl:any;app:any;constructor(app:any){this.app=app;this.contentEl=app.qaRoot;}open(){this.contentEl.connected=true;(this as any).onOpen();}close(){(this as any).onClose();this.contentEl.connected=false;}},Notice:vi.fn()}));
import {ModuleManagementModal} from '../src/ui/module-management-modal';
import {readingSource} from '../src/core/reading-catalogue';
import type {SwordDockController} from '../src/controller';
import {fixtureApp,button,settle} from './ui-fixture';

function fixture(){
 const app=fixtureApp(),frames:Array<FrameRequestCallback>=[],listeners=new Set<()=>void>(),tasks:Array<{resolve:()=>void;reject:()=>void}>=[];
 app.qaDoc.documentElement=app.qaDoc.body;app.qaDoc.defaultView={requestAnimationFrame:(cb:FrameRequestCallback)=>{frames.push(cb);return frames.length;}};
 const source=readingSource('mysword-all-of-grace')!;
 const info={id:source.id,title:source.title,kind:'book',directory:source.id+'-aaaaaaaaaaaaaaaa',sourceSha256:source.sha256,sha256:'a'.repeat(64),version:'QA',createdAt:1,bytes:1024,entryCount:22};
 const modules={installed:[info],removed:[],generations:[info],problems:[] as any[],pendingStages:[],jobs:new Map(),requiresRecovery:false,
  subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},
  refreshManagement:vi.fn(()=>new Promise<void>((resolve,reject)=>tasks.push({resolve,reject:()=>reject(Error('Controlled failure'))}))),
  readVersion:vi.fn(async()=>({id:source.id,title:source.title,author:'QA',sourcePage:source.sourcePage,notice:'Controlled source notice'}))};
 const plugin={app,settings:{bibleEdition:'kjv'},modules} as unknown as SwordDockController;
 const modal=new ModuleManagementModal(plugin,source.id);modal.open();
 const start=()=>{const action=button(app.qaRoot,'Rescan storage');action.focus();action.click();};
 const finish=async(failed=false,index=0)=>{if(failed)tasks[index].reject();else tasks[index].resolve();await settle();};
 const flush=async()=>{for(const cb of frames.splice(0))cb(0);await settle();};
 const detail=(label:string)=>app.qaRoot.querySelectorAll('details').find(d=>d.querySelector('summary')?.textContent===label)!;
 return {app,modules,modal,start,finish,flush,detail,listeners,tasks};
}
afterEach(()=>vi.unstubAllGlobals());

describe('resource management operation context',()=>{
 it.each([false,true])('preserves newer Close focus after completion, failed=%s',async failed=>{
  const f=fixture();f.start();button(f.app.qaRoot,'Close').focus();await f.finish(failed);await f.flush();
  expect(f.app.qaDoc.activeElement).toBe(button(f.app.qaRoot,'Close'));f.modal.close();
 });
 it.each([false,true])('keeps an expanded and focused source summary, failed=%s',async failed=>{
  const f=fixture(),details=f.detail('Publisher reinstall source');details.open=true;f.start();details.querySelector('summary')!.focus();
  await f.finish(failed);await f.flush();const next=f.detail('Publisher reinstall source');
  expect(next.open).toBe(true);expect(f.app.qaDoc.activeElement).toBe(next.querySelector('summary'));f.modal.close();
 });
 it('preserves a focused publisher link and its expanded details',async()=>{
  const f=fixture(),details=f.detail('Publisher reinstall source');details.open=true;f.start();details.querySelector('a')!.focus();
  await f.finish();await f.flush();const next=f.detail('Publisher reinstall source');expect(next.open).toBe(true);expect(f.app.qaDoc.activeElement).toBe(next.querySelector('a'));f.modal.close();
 });
 it('keeps attribution open and offers its summary while its link is reloading',async()=>{
  const f=fixture();await settle();const details=f.detail('Source and attribution');details.open=true;f.start();details.querySelector('a')!.focus();
  await f.finish();await f.flush();const next=f.detail('Source and attribution');expect(next.open).toBe(true);
  expect(f.app.qaDoc.activeElement).toBe(next.querySelector('summary'));f.modal.close();
 });
 it('preserves newer input outside the dialog',async()=>{
  const f=fixture(),outside=f.app.qaDoc.body.createEl('input');outside.value='Newer typing';f.start();outside.focus();
  await f.finish();await f.flush();expect(f.app.qaDoc.activeElement).toBe(outside);expect(outside.value).toBe('Newer typing');f.modal.close();
 });
 it('restores the initiating action when focus has settled on the document',async()=>{
  const f=fixture();f.start();f.app.qaDoc.activeElement=f.app.qaDoc.body;await f.finish();await f.flush();
  expect(f.app.qaDoc.activeElement).toBe(button(f.app.qaRoot,'Rescan storage'));expect(f.app.qaRoot.textContent).toContain('Resource library updated.');f.modal.close();
 });
 it('does not replace focus moved after rendering but before the restoration frame',async()=>{
  const f=fixture();f.start();button(f.app.qaRoot,'Close').focus();await f.finish();const outside=f.app.qaDoc.body.createEl('input');outside.focus();
  await f.flush();expect(f.app.qaDoc.activeElement).toBe(outside);f.modal.close();
 });
 it('retains dialog scroll and both source disclosures through inventory changes',async()=>{
  const f=fixture();f.detail('Publisher reinstall source').open=true;f.detail('Source and attribution').open=true;f.app.qaRoot.scrollTop=123;
  const empty=f.app.qaRoot.empty.bind(f.app.qaRoot);vi.spyOn(f.app.qaRoot,'empty').mockImplementation(()=>{empty();f.app.qaRoot.scrollTop=0;});
  f.start();f.modules.problems.push({directory:'new-issue',message:'Controlled issue'});await f.finish();await f.flush();
  expect(f.app.qaRoot.scrollTop).toBe(123);expect(f.detail('Publisher reinstall source').open).toBe(true);expect(f.detail('Source and attribution').open).toBe(true);f.modal.close();
 });
 it.each([false,true])('ignores old completion after the same modal reopens, failed=%s',async failed=>{
  const f=fixture();f.start();f.modal.close();f.modal.open();const root=f.app.qaRoot,children=[...root.children];
  await f.finish(failed);await f.flush();expect(root.children.length).toBe(children.length);expect(root.children.every((child,index)=>child===children[index])).toBe(true);expect(root.textContent).not.toContain(failed?'Controlled failure':'Resource library updated.');f.modal.close();
 });
 it('allows a new opening to work and keeps its busy state after an old completion',async()=>{
  const f=fixture();f.start();f.modal.close();f.modal.open();f.start();expect(f.modules.refreshManagement).toHaveBeenCalledTimes(2);
  await f.finish(false,0);await f.flush();expect(button(f.app.qaRoot,'Rescan storage').disabled).toBe(true);expect(f.app.qaRoot.textContent).toContain('Working…');
  await f.finish(false,1);await f.flush();expect(button(f.app.qaRoot,'Rescan storage').disabled).toBe(false);f.modal.close();
 });
 it('preserves current source focus and disclosure on a real inventory notification',async()=>{
  const f=fixture(),details=f.detail('Publisher reinstall source');details.open=true;details.querySelector('summary')!.focus();
  f.modules.problems.push({directory:'new-issue',message:'Controlled inventory issue'});for(const notify of f.listeners)notify();await f.flush();
  const next=f.detail('Publisher reinstall source');expect(next.open).toBe(true);expect(f.app.qaDoc.activeElement).toBe(next.querySelector('summary'));f.modal.close();
 });
 it('starts a different resource with its own closed disclosures',async()=>{
  const f=fixture();f.detail('Publisher reinstall source').open=true;const source=readingSource('mysword-eastons')!;
  const other={...f.modules.generations[0],id:source.id,title:source.title,kind:'dictionary',directory:source.id+'-bbbbbbbbbbbbbbbb',sourceSha256:source.sha256};
  f.modules.generations.push(other);f.modules.installed.push(other);for(const notify of f.listeners)notify();await f.flush();
  const select=f.app.qaRoot.querySelector('.vd-manage-module')!;select.value=source.id;select.dispatch('change');await f.flush();
  expect(f.detail('Publisher reinstall source').open).toBe(false);expect(f.app.qaDoc.activeElement).toBe(f.app.qaRoot.querySelector('.vd-manage-module'));f.modal.close();
 });

 it('keeps newer Close focus when the reviewed resource disappears during rescan',async()=>{
  const f=fixture();f.start();button(f.app.qaRoot,'Close').focus();f.modules.generations=[];f.modules.installed=[];
  await f.finish();await f.flush();expect(f.app.qaDoc.activeElement).toBe(button(f.app.qaRoot,'Close'));expect(f.app.qaRoot.textContent).toContain('No additional stored resources');f.modal.close();
 });

});
