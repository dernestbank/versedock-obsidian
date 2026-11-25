import {Modal} from 'obsidian';
import type {SwordDockController} from '../controller';
import type {StorageCategory,StorageReview} from '../core/module-storage';
import {formatStorageBytes} from '../core/storage';
import {textButton} from './components';
import {restoreActionFocus} from './focus';

const LABELS:Record<StorageCategory,string>={active:'Active resources',removed:'Removed resources kept for Restore',retained:'Retained versions',damaged:'Damaged generations',staging:'Staged installations',management:'Management records',unknown:'Other data'};

export class ResourceStorageModal extends Modal {
 private revision=0;
 private report:StorageReview|null=null;
 private selected=new Set<string>();
 private busy=false;
 constructor(private readonly plugin:SwordDockController){super(plugin.app);}
 onOpen():void{void this.load();}
 onClose():void{this.revision++;this.report=null;this.contentEl.empty();}
 private async load(message='',restoreFocus=true):Promise<void>{
  const revision=++this.revision;this.busy=true;
  const root=this.contentEl;root.empty();root.addClass('versedock','vd-resource-storage-modal');
  root.createEl('h2',{text:'Review resource storage'});
  const status=root.createEl('p',{attr:{role:'status','aria-live':'polite'},text:'Measuring resource files after current installation work…'});
  textButton(root,'Close',()=>this.close());
  try{
   const report=await this.plugin.modules.previewStorage();if(revision!==this.revision)return;
   this.report=report;this.selected.clear();this.busy=false;this.render(message);
   const refresh=this.contentEl.querySelector<HTMLButtonElement>('[data-storage-refresh]');if(refresh)restoreActionFocus(refresh,restoreFocus);
  }catch(error){if(revision===this.revision){this.busy=false;status.setText(error instanceof Error?error.message:'Storage review is unavailable.');}}
 }
 private refreshIfCurrent(revision:number,message:string,focus:boolean):Promise<void>{
  return revision===this.revision?this.load(message,focus):Promise.resolve();
 }
 private disableControls():void{
  this.busy=true;for(const control of this.contentEl.querySelectorAll<HTMLButtonElement>('button,input'))if(!control.hasAttribute('data-storage-close'))control.disabled=true;
 }
 private render(message:string):void{
  const report=this.report!,root=this.contentEl;root.empty();
  root.createEl('h2',{text:'Review resource storage'});
  root.createEl('p',{cls:'vd-subtle',text:'Review active resources, retained versions, staging and management records. Cleanup moves selected unused folders to this vault’s Trash. Active, Restore and recent rollback data are protected.'});
  root.createEl('p',{text:(report.complete?'Measured data: ':'Measured data (incomplete): ')+formatStorageBytes(report.totalBytes)+' · '+report.totalFiles.toLocaleString()+' files'});
  if(report.looseFiles?.files)root.createEl('p',{cls:'vd-subtle',text:'Other files in the resource root: '+formatStorageBytes(report.looseFiles.bytes)+' · '+report.looseFiles.files+' files, retained for manual review.'});
  const status=root.createEl('p',{attr:{role:'status','aria-live':'polite'},text:message});
  const toolbar=root.createDiv({cls:'vd-action-row'});
  const refresh=textButton(toolbar,'Refresh review',()=>{void this.load('',true);});refresh.setAttribute('data-storage-refresh','');
  const selectAll=textButton(toolbar,'Select eligible data',()=>{
   this.selected=new Set(report.items.filter(item=>item.cleanupEligible).map(item=>item.directory));
   for(const checkbox of root.querySelectorAll<HTMLInputElement>('input[data-storage-directory]'))checkbox.checked=this.selected.has(checkbox.dataset.storageDirectory!);update();
  });
  selectAll.disabled=!report.items.some(item=>item.cleanupEligible);
  const selection=root.createEl('p',{cls:'vd-subtle'});
  const cleanup=textButton(toolbar,'Move selected to vault Trash',()=>{
   if(this.busy||!this.selected.size)return;
   const revision=this.revision,focus=cleanup.ownerDocument.activeElement===cleanup;this.disableControls();status.setText('Rechecking selected files and moving eligible data to Trash…');
   void this.plugin.modules.cleanupStorage(report.ticket,[...this.selected]).then(result=>this.refreshIfCurrent(revision,'Moved '+result.moved+' folder(s), '+formatStorageBytes(result.bytes)+', to vault Trash.',focus))
    .catch(error=>this.refreshIfCurrent(revision,error instanceof Error?error.message:'Cleanup did not complete.',focus));
  },'mod-cta');
  const update=():void=>{
   const items=report.items.filter(item=>this.selected.has(item.directory));cleanup.disabled=!items.length||this.busy;
   selection.setText(items.length+' folder(s) selected · '+formatStorageBytes(items.reduce((n,item)=>n+(item.bytes??0),0)));
  };
  const order:StorageCategory[]=['staging','retained','damaged','management','removed','active','unknown'];
  for(const category of order){
   const items=report.items.filter(item=>item.category===category);if(!items.length)continue;
   const group=root.createEl('details');group.open=category==='staging'||category==='retained';
   group.createEl('summary',{text:LABELS[category]+' · '+items.length+' · '+formatStorageBytes(items.reduce((n,item)=>n+(item.bytes??0),0))});
   for(const item of items){
    const row=group.createDiv({cls:'vd-storage-review-item'});
    if(item.cleanupEligible){
     const label=row.createEl('label');const checkbox=label.createEl('input',{attr:{type:'checkbox','aria-label':'Move '+item.title+' to vault Trash'}});checkbox.dataset.storageDirectory=item.directory;
     label.createSpan({text:item.title});checkbox.addEventListener('change',()=>{if(checkbox.checked)this.selected.add(item.directory);else this.selected.delete(item.directory);update();});
    }else row.createEl('strong',{text:item.title});
    row.createEl('p',{cls:'vd-subtle',text:(item.bytes===null?'Size unavailable':formatStorageBytes(item.bytes))+' · '+(item.files??'?')+' files · '+item.reason});
    if(item.download)row.createEl('p',{text:'Saved '+formatStorageBytes(item.download.received)+' of '+formatStorageBytes(item.download.total)+'. Retry this resource from Discover to resume. Moving it to Trash makes the next retry start again.'});
    const detail=row.createEl('details');detail.createEl('summary',{text:'Stored details'});detail.createEl('p',{text:item.directory});
    if(item.staged){
     detail.createEl('p',{text:item.staged.kind+' · '+item.staged.entries.toLocaleString()+' entries'});
     detail.createEl('p',{text:'Source: '+item.staged.origin});detail.createEl('p',{text:'Source SHA-256: '+item.staged.sourceSha256});detail.createEl('p',{text:'Content SHA-256: '+item.staged.contentSha256});
     detail.createEl('p',{text:item.staged.notice||'No additional notice was supplied.'});
    }
    if(item.recoverable){
     const recover=textButton(row,'Recover this resource',()=>{
      if(this.busy)return;const revision=this.revision,focus=recover.ownerDocument.activeElement===recover;this.disableControls();status.setText('Rechecking and recovering the staged resource…');
      void this.plugin.modules.recoverStage(report.ticket,item.directory).then(info=>this.refreshIfCurrent(revision,info.title+' recovered. Open it from Module Library; the staging copy is retained for cleanup review.',focus))
       .catch(error=>this.refreshIfCurrent(revision,error instanceof Error?error.message:'Recovery did not complete.',focus));
     },'mod-cta');
    }
   }
  }
  if(!report.items.length)root.createEl('p',{cls:'vd-subtle',text:'No stored additional resources or staging folders were found.'});
  root.createEl('p',{cls:'vd-subtle',text:'Trash continues to occupy disk space until emptied separately. Saved notes, original import files and reading settings are outside this cleanup.'});
  textButton(root,'Close',()=>this.close()).setAttribute('data-storage-close','');update();
 }
}
