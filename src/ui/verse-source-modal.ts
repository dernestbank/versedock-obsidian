import {Modal,Notice} from 'obsidian';
import type {SwordDockController} from '../controller';
import {resourceBibleSource} from '../core/resource-bible-source';
import {resourceRangeLabel,type ResourceLink} from '../core/resource-links';
import {refLabel,type PassageReference} from '../core/references';
import {renderResourceEntryContent} from './resource-content';
import {ResourcePassageModal} from './resource-passage-modal';
import {ResourceNoteModal} from './resource-entry-modal';
import {textButton} from './components';
/** Notes/heading markup remains separate from displayed Scripture. */
export class VerseSourceModal extends Modal {
 constructor(private readonly plugin:SwordDockController,private readonly ref:PassageReference,private readonly source:string,private readonly edition:string){super(plugin.app);}
 onOpen():void{
  const root=this.contentEl;root.addClass('versedock','vd-verse-source-modal');root.createEl('h2',{text:refLabel(this.ref)+' · source notes and markup'});
  root.createEl('p',{cls:'vd-subtle',text:this.edition+' · retained source. Notes and headings are separate from Scripture wording.'});
  const details=resourceBibleSource(this.source);
  for(const [index,note]of details.annotations.entries()){
   root.createEl('h3',{text:(note.kind==='note'?'Source note':'Source heading')+' '+(index+1)});
   renderResourceEntryContent(root,{images:{}},{key:String(index),title:'Source note',blocks:[],source:note.source.replace(/<FI>/g,'<em>').replace(/<Fi>/g,'</em>')},{originalSource:note.source,open:target=>this.openLink(target)});
  }
  if(!details.annotations.length)root.createEl('p',{text:'No separate notes or headings are supplied for this verse.'});
  if(details.references.length){root.createEl('h3',{text:'Source cross-references'});for(const range of details.references.slice(0,50))textButton(root,resourceRangeLabel(range),()=>this.openLink({kind:'scripture',range}));
   if(details.references.length>50)root.createEl('p',{text:'Showing the first 50 reference controls; all source markers remain below.'});}
  for(const issue of details.issues)root.createEl('p',{cls:'vd-subtle',text:issue});
  const original=root.createEl('details',{cls:'vd-retained-source'});original.createEl('summary',{text:'Complete original verse source'});original.createEl('pre',{text:this.source});
  textButton(root,'Close',()=>this.close()).focus({preventScroll:true});
 }
 private openLink(target:ResourceLink):void{
  if(target.kind==='scripture')new ResourcePassageModal(this.plugin,target,this.edition).open();
  else if(target.kind==='note')new ResourceNoteModal(this.plugin,target.text).open();
  else new Notice('This source target is not available in the Bible notes view; its source is retained.');
 }
 onClose():void{this.contentEl.empty();}
}
