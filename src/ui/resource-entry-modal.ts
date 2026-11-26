import {Modal,Notice} from 'obsidian';
import type {SwordDockController} from '../controller';
import type {ReadingEntry,ReadingModule} from '../core/reading-modules';
import {ResourceEntryIndex,type ResourceLink} from '../core/resource-links';
import {ResourcePassageModal} from './resource-passage-modal';
import {renderResourceEntryContent} from './resource-content';
import {textButton} from './components';

/** Linked commentary entries stay in their own source context with a local Back stack. */
export class ResourceEntryModal extends Modal {
 private index:ResourceEntryIndex;private history:Array<{entries:ReadingEntry[];entry:ReadingEntry}>=[];
 private entries:ReadingEntry[];private entry:ReadingEntry;
 constructor(private readonly plugin:SwordDockController,private readonly module:ReadingModule,entries:ReadingEntry|ReadingEntry[]){super(plugin.app);this.index=new ResourceEntryIndex(module);this.entries=Array.isArray(entries)?entries:[entries];this.entry=this.entries[0];}
 onOpen():void{this.contentEl.addClass('versedock','vd-resource-entry-modal');this.render();}
 private render(anchor?:string):void{
  const root=this.contentEl;root.empty();root.createEl('h2',{text:this.entry.title,attr:{tabindex:'-1'}});
  root.createEl('p',{cls:'vd-subtle',text:this.module.title+' · linked source entry · Reader passage is unchanged.'});
  const controls=root.createDiv({cls:'vd-action-row'});
  const back=textButton(controls,'Back',()=>{const previous=this.history.pop();if(previous){this.entries=previous.entries;this.entry=previous.entry;this.render();}});back.disabled=!this.history.length;
  textButton(controls,'Close',()=>this.close());
  if(this.entries.length>1){
   const at=this.entries.indexOf(this.entry);
   const previous=textButton(controls,'Previous source entry',()=>{this.entry=this.entries[at-1];this.render();});previous.disabled=at===0;
   controls.createSpan({text:(at+1)+' of '+this.entries.length+' matching source entries'});
   const next=textButton(controls,'Next source entry',()=>{this.entry=this.entries[at+1];this.render();});next.disabled=at+1===this.entries.length;
  }
  const rendered=renderResourceEntryContent(root,this.module,this.entry,{open:target=>this.openLink(target)});
  if(anchor&&!rendered.anchor(anchor))new Notice('The linked anchor is missing or ambiguous in this source entry.');
  else if(!anchor)root.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});
 }
 private openLink(target:ResourceLink):void{
  if(target.kind==='scripture'){new ResourcePassageModal(this.plugin,target,this.module.title).open();return;}
  if(target.kind==='entry'||target.kind==='commentary'){
   const result=this.index.resolve(target);if(!result.entries.length){new Notice(result.reason??'Linked source entry unavailable.');return;}
   this.history=[...this.history.slice(-49),{entries:this.entries,entry:this.entry}];this.entries=result.entries;this.entry=result.entries[0];this.render(target.kind==='entry'?target.anchor:undefined);
  }else if(target.kind==='note')new ResourceNoteModal(this.plugin,target.text).open();
  else if(target.kind==='anchor')new Notice('This source anchor is missing or ambiguous.');
 }
 onClose():void{this.contentEl.empty();}
}
export class ResourceNoteModal extends Modal {
 constructor(plugin:SwordDockController,private readonly text:string){super(plugin.app);}
 onOpen():void{this.contentEl.addClass('versedock');this.contentEl.createEl('h2',{text:'Source note'});this.contentEl.createEl('p',{text:this.text});}
 onClose():void{this.contentEl.empty();}
}
