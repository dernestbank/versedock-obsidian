import type { SwordDockController } from '../controller';
import { textButton } from './components';
import { formatStorageBytes } from '../core/storage';
import { readingSource } from '../core/reading-catalogue';
import { isLocalModuleId } from '../core/module-provenance';
import { ModuleManagementModal } from './module-management-modal';
export function renderReadingDownloads(parent:HTMLElement,plugin:SwordDockController):()=>void {
 const root=parent.createDiv({cls:'vd-reading-downloads'});root.createEl('h3',{text:'Module downloads'});
 root.createEl('p',{cls:'vd-subtle',text:plugin.modules.downloadCapabilities.networkAbort
  ? 'Cancel stops the network transfer. Retry uses saved partial bytes when the publisher supplies a compatible response. Saved downloads appear in storage review.'
  : 'Cancel prevents installation. This platform’s download API may finish the network transfer; Retry starts a new download.'});
 const rows=root.createDiv();
 const empty=rows.createEl('p',{cls:'vd-subtle',text:'Choose Install in Discover to add an offline resource.'});
 const entries=new Map<string,{row:HTMLElement;title:HTMLElement;status:HTMLElement;button:HTMLButtonElement|null;action:string}>();
 const render=():void=>{
  empty.hidden=!!plugin.modules.jobs.size;
  for(const [id,entry]of entries)if(!plugin.modules.jobs.has(id)){entry.row.remove();entries.delete(id);}
  for(const job of plugin.modules.jobs.values()){
   let entry=entries.get(job.id);
   if(!entry){
    const row=rows.createDiv({cls:'vd-catalogue-card'});
    entry={row,title:row.createEl('strong',{text:job.title}),status:row.createEl('p',{attr:{role:'status'}}),button:null,action:''};entries.set(job.id,entry);
   }
   if(entry.title.textContent!==job.title)entry.title.setText(job.title);
   const status=job.status==='ready'?'Ready offline':job.status==='downloading'?'Downloading '+formatStorageBytes(job.received)+' of '+formatStorageBytes(job.total)+'…':job.status==='failed'?(job.error??'Installation failed.'):job.status==='cancelled'?'Cancelled':job.status[0].toUpperCase()+job.status.slice(1)+'…';
   if(entry.status.textContent!==status)entry.status.setText(status);
   const action=['ready','failed','cancelled'].includes(job.status)?job.status==='ready'?'Open':'Retry':'Cancel';
   // Byte progress must not detach a pressed pointer target or focused control.
   // Replace only on an action change, so an in-flight Cancel click cannot open a completed resource.
   if(entry.action!==action){
    const focused=!!entry.button&&rows.ownerDocument.activeElement===entry.button;entry.button?.remove();
    const button=textButton(entry.row,action==='Retry'&&!readingSource(job.id)?'Review local file again':action,()=>{if(action==='Open')void plugin.openResources(job.id);else if(action==='Retry'){if(readingSource(job.id))void plugin.modules.install(job.id);else plugin.openMySwordInspector();}else plugin.modules.cancel(job.id);});
    button.dataset.jobAction=action;button.dataset.jobId=job.id;entry.button=button;entry.action=action;
    if(focused)button.focus({preventScroll:true});
   }
  }
 };render();return plugin.modules.subscribe(render);
}
export function renderInstalledReading(parent:HTMLElement,plugin:SwordDockController):()=>void {
 const root=parent.createDiv();let previous='';
 const render=():void=>{const inventory=plugin.modules.installed.map(m=>m.directory).join();if(inventory===previous&&root.childElementCount)return;previous=inventory;root.empty();
  root.createEl('h3',{text:'Installed additional modules'});
  if(!plugin.modules.installed.length)root.createEl('p',{cls:'vd-subtle',text:'Install a resource from Discover to read it here offline.'});
  for(const module of plugin.modules.installed){const card=root.createDiv({cls:'vd-catalogue-card'});card.createEl('strong',{text:module.title});card.createEl('p',{cls:'vd-subtle',text:module.kind+' · '+(isLocalModuleId(module.id)?'Local file':'Catalogue')+' · '+module.entryCount+' entries · '+formatStorageBytes(module.bytes)+' · Ready offline'});textButton(card,'Open',()=>{void plugin.openResources(module.id);});textButton(card,'Manage',()=>new ModuleManagementModal(plugin,module.id).open());}
  textButton(root,'Manage stored and removed resources',()=>new ModuleManagementModal(plugin).open());
 };render();return plugin.modules.subscribe(render);
}
