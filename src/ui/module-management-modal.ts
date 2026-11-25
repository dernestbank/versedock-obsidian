import {Modal} from 'obsidian';
import type {SwordDockController} from '../controller';
import {readingSource} from '../core/reading-catalogue';
import {isLocalModuleId} from '../core/module-provenance';
import {formatStorageBytes} from '../core/storage';
import {textButton} from './components';
import {restoreActionFocus} from './focus';
import {renderModuleSource} from './module-source';
import {ResourceStorageModal} from './resource-storage-modal';

export class ModuleManagementModal extends Modal {
  private unsubscribe:(()=>void)|null=null;
  private selectedId:string;
  private selectedDirectory:string|null=null;
  private busy=false;
  private version=0;
  private opening=0;
  private renderedId='';
  private inventory='';
  private status:HTMLElement|null=null;
  constructor(private readonly plugin:SwordDockController,id=''){super(plugin.app);this.selectedId=id;}

  onOpen():void{
    this.opening++;this.busy=false;
    this.unsubscribe?.();
    this.render();this.inventory=this.inventoryKey();
    this.unsubscribe=this.plugin.modules.subscribe(()=>{
      if(this.busy){
        const job=this.plugin.modules.jobs.get(this.selectedId);
        if(job&&this.status)this.status.setText(job.status==='failed'?job.error??'Installation failed.':job.status[0].toUpperCase()+job.status.slice(1)+'…');
        return;
      }
      const next=this.inventoryKey();if(next!==this.inventory){this.inventory=next;this.render();}
    });
  }
  onClose():void{this.opening++;this.version++;this.unsubscribe?.();this.unsubscribe=null;this.contentEl.empty();}
  private inventoryKey():string{
    const modules=this.plugin.modules;
    return [modules.installed.map(info=>info.directory).join(),modules.removed.map(info=>info.directory).join(),
      modules.generations.map(info=>info.directory).join(),modules.problems.map(problem=>problem.directory).join(),modules.pendingStages.join()].join('|');
  }
  private run(button:HTMLButtonElement,task:()=>Promise<void>):void{
    if(this.busy)return;
    const focus=button.ownerDocument.activeElement===button,key=button.dataset.action,opening=this.opening;
    this.busy=true;
    for(const control of this.contentEl.querySelectorAll<HTMLButtonElement>('button,input,select,textarea'))if(control.dataset.action!=='close')control.disabled=true;
    this.status?.setText('Working…');
    void task().then(()=>this.finish('Resource library updated.',key,focus,opening))
      .catch(error=>this.finish(error instanceof Error?error.message:'The resource operation failed.',key,focus,opening));
  }
  private finish(message:string,key:string|undefined,focus:boolean,opening:number):void{
    if(opening!==this.opening)return;
    const doc=this.contentEl.ownerDocument,active=doc.activeElement;
    const returnToAction=focus&&(active===null||active===doc.body||active===doc.documentElement);
    this.busy=false;if(!this.contentEl.isConnected)return;
    this.inventory=this.inventoryKey();this.render();this.status?.setText(message);
    const target=[...this.contentEl.querySelectorAll<HTMLButtonElement>('[data-action]')].find(button=>button.dataset.action===key&&!button.disabled)
      ??this.contentEl.querySelector<HTMLSelectElement>('.vd-manage-module');
    if(target)restoreActionFocus(target,returnToAction);
  }
  private focusKey(element:HTMLElement):string|null{
    const value=element.dataset.action??element.getAttribute('aria-label')??element.getAttribute('href')
      ??(element.tagName==='SUMMARY'?'summary':null);
    if(value===null)return null;
    return [element.closest<HTMLElement>('details')?.dataset.context??'',element.tagName,value].join('\n');
  }
  private captureContext():()=>void{
    const root=this.contentEl,id=this.selectedId;
    if(this.renderedId!==id)return()=>{};
    const active=root.ownerDocument.activeElement as HTMLElement|null;
    const focused=active&&root.contains(active)?active:null,key=focused?this.focusKey(focused):null;
    const scope=focused?.closest<HTMLElement>('details')?.dataset.context;
    const expanded=new Set([...root.querySelectorAll<HTMLDetailsElement>('details')].filter(detail=>detail.open).map(detail=>detail.dataset.context));
    const scrollTop=root.scrollTop;
    return()=>{
      if(this.selectedId!==id){
        const close=root.querySelector<HTMLElement>('[data-action="close"]');
        if(key&&close)restoreActionFocus(close,true);
        return;
      }
      const details=[...root.querySelectorAll<HTMLDetailsElement>('details')];
      for(const detail of details)if(detail.dataset.context)detail.open=expanded.has(detail.dataset.context);
      root.scrollTop=scrollTop;
      if(!key)return;
      const target=[...root.querySelectorAll<HTMLElement>('button,select,a[href],summary')]
        .find(control=>this.focusKey(control)===key&&!(control as HTMLButtonElement).disabled)
        ??details.find(detail=>detail.dataset.context===scope)?.querySelector<HTMLElement>('summary')
        ??root.querySelector<HTMLElement>('.vd-manage-module');
      if(target)restoreActionFocus(target,true);
    };
  }
  private render():void{
    const restoreContext=this.captureContext();
    const version=++this.version,root=this.contentEl,modules=this.plugin.modules;
    root.empty();root.addClass('versedock','vd-module-management-modal');
    root.createEl('h2',{text:'Manage resources'});
    root.createEl('p',{cls:'vd-subtle',text:'Review stored versions and source changes, repair downloads, or remove and restore resources in this vault.'});
    const controls=root.createDiv({cls:'vd-action-row'});
    const rescan=textButton(controls,'Rescan storage',()=>this.run(rescan,()=>modules.refreshManagement()));rescan.dataset.action='rescan';
    textButton(controls,'Import local file',()=>{this.close();this.plugin.openMySwordInspector();});
    textButton(controls,'Storage and staged recovery',()=>{this.close();new ResourceStorageModal(this.plugin).open();});
    this.status=root.createDiv({attr:{role:'status','aria-live':'polite'}});
    const known=new Map(modules.generations.map(info=>[info.id,info.title]));
    for(const problem of modules.problems){
      const id=problem.id??problem.directory.replace(/-[a-f0-9]{16}(?:-r-[a-f0-9]{8})?$/,'');
      if(readingSource(id)||isLocalModuleId(id))known.set(id,known.get(id)??readingSource(id)?.title??id);
    }
    const label=root.createEl('label',{text:'Resource'});
    const select=label.createEl('select',{cls:'vd-manage-module',attr:{'aria-label':'Resource to manage'}});
    if(!known.size)select.createEl('option',{value:'',text:'No additional stored resources'});
    for(const [id,title]of [...known].sort((a,b)=>a[1].localeCompare(b[1])))select.createEl('option',{value:id,text:title+' · '+(isLocalModuleId(id)?'Local file':'Catalogue')+(modules.removed.some(info=>info.id===id)?' · Removed':'')});
    if(!known.has(this.selectedId))this.selectedId=select.options[0]?.value??'';
    select.value=this.selectedId;select.disabled=!known.size;
    select.addEventListener('change',()=>{this.selectedId=select.value;this.selectedDirectory=null;this.render();this.contentEl.querySelector<HTMLElement>('.vd-manage-module')?.focus({preventScroll:true});});
    const current=modules.installed.find(info=>info.id===this.selectedId);
    const removed=modules.removed.find(info=>info.id===this.selectedId);
    const versions=modules.generations.filter(info=>info.id===this.selectedId).sort((a,b)=>b.createdAt-a.createdAt);
    if(this.selectedId){
      root.createEl('p',{cls:'vd-subtle',text:current?'In library · '+(current.id===this.plugin.settings.bibleEdition?'Current default Bible':'Ready offline'):removed?'Removed from library · stored files retained':'No active verified version'});
      const actions=root.createDiv({cls:'vd-action-row'});
      const remove=textButton(actions,'Remove from library',()=>this.run(remove,()=>modules.remove(this.selectedId)));
      remove.dataset.action='remove';remove.disabled=!current||current.id===this.plugin.settings.bibleEdition;
      remove.title=current?.id===this.plugin.settings.bibleEdition?'Select another Bible before removing this default.':'Files and saved reading state are retained for Restore.';
      if(removed){const restore=textButton(actions,'Restore',()=>this.run(restore,()=>modules.restore(this.selectedId)),'mod-cta');restore.dataset.action='restore';}
      const source=readingSource(this.selectedId);
      if(source){
        const update=!!current&&source.sha256!==current.sourceSha256;
        const review=root.createEl('details');review.dataset.context='catalogue';review.createEl('summary',{text:update?'Reviewed catalogue update':'Publisher reinstall source'});
        review.createEl('p',{text:source.title+' · '+formatStorageBytes(source.compressedBytes)});
        if(current)review.createEl('p',{text:'Current source SHA-256: '+current.sourceSha256});
        review.createEl('p',{text:'Reviewed source SHA-256: '+source.sha256});
        review.createEl('a',{text:'Publisher source page',attr:{href:source.sourcePage,target:'_blank',rel:'noreferrer'}});
        review.createEl('p',{cls:'vd-subtle',text:'The selected source must match the reviewed fingerprints. Its verified generation becomes active; prior versions stay available below.'});
        const repair=textButton(review,update?'Install reviewed update':'Reinstall / repair',()=>this.run(repair,async()=>{
          await modules.install(source.id);const job=modules.jobs.get(source.id);if(job?.status!=='ready')throw Error(job?.error??'Installation did not complete.');
        }),'mod-cta');repair.dataset.action='repair';
      }else textButton(actions,'Import file to repair',()=>{this.close();this.plugin.openMySwordInspector();});
      if(versions.length){
        const versionLabel=root.createEl('label',{text:'Stored version to review'});
        const choices=versionLabel.createEl('select',{attr:{'aria-label':'Stored resource version'}});
        for(const info of versions)choices.createEl('option',{value:info.directory,text:(info.version||'Unversioned')+' · '+new Date(info.createdAt).toLocaleString()+' · '+info.sha256.slice(0,8)+(info.directory===current?.directory?' · Active':'')});
        let chosen=versions.find(info=>info.directory===this.selectedDirectory)??versions.find(info=>info.directory===(current??removed)?.directory)??versions[0];
        choices.value=chosen.directory;this.selectedDirectory=chosen.directory;
        const facts=root.createDiv({cls:'vd-manage-version-facts'});
        const use=textButton(root,'Use this version',()=>this.run(use,()=>modules.useVersion(chosen.directory)),'mod-cta');use.dataset.action='use-version';
        let factsVersion=0;
        const review=():void=>{
          const check=++factsVersion;facts.empty();use.disabled=chosen.directory===current?.directory;
          facts.createEl('p',{text:chosen.title+' · '+chosen.entryCount.toLocaleString()+' entries · '+formatStorageBytes(chosen.bytes)});
          facts.createEl('p',{text:'Content SHA-256: '+chosen.sha256});facts.createEl('p',{text:'Source SHA-256: '+chosen.sourceSha256});
          const notice=facts.createEl('details');notice.dataset.context='attribution';notice.createEl('summary',{text:'Source and attribution'});
          const body=notice.createDiv();body.setText('Reading stored source notice…');
          void modules.readVersion(chosen.directory).then(module=>{
            if(version!==this.version||check!==factsVersion||!body.isConnected)return;body.empty();renderModuleSource(body,module);
          }).catch(()=>{if(body.isConnected&&check===factsVersion)body.setText('This version could not be verified. Rescan storage before selecting it.');});
        };
        choices.addEventListener('change',()=>{chosen=versions.find(info=>info.directory===choices.value)??chosen;this.selectedDirectory=chosen.directory;review();});review();
      }
    }
    if(modules.problems.length){
      const problems=root.createEl('details');problems.dataset.context='problems';problems.createEl('summary',{text:modules.problems.length+' stored resource or management issues'});
      for(const problem of modules.problems)problems.createEl('p',{text:problem.message+' · '+problem.directory});
    }
    if(modules.pendingStages.length)root.createEl('p',{cls:'vd-subtle',text:modules.pendingStages.length+' interrupted staging folder(s) retained for recovery review.'});
    if(modules.requiresRecovery){
      root.createEl('p',{text:'Management records need recovery. Rebuild choices from the newest verified stored versions; previously removed resources may reappear. Review the stored versions before continuing.'});
      const recover=textButton(root,'Recover verified stored versions',()=>this.run(recover,()=>modules.recoverSelections()),'mod-cta');recover.dataset.action='recover';
    }
    textButton(root,'Close',()=>this.close()).dataset.action='close';
    this.renderedId=this.selectedId;restoreContext();
  }
}
