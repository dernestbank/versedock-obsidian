import {Modal} from 'obsidian';
import type {SwordDockController} from '../controller';
import type {BibleResource} from '../core/library';
import {resourceRangeLabel,type ResourceLink,type ResourceRange} from '../core/resource-links';
import {loadResourcePassagePage,resourceAdjacentChapter,type ResourceChapter} from '../core/resource-passage';
import {refLabel,type PassageReference} from '../core/references';
import {textButton} from './components';

/** Fixed-edition offline preview: source addresses never become application URLs. */
export class ResourcePassageModal extends Modal {
 private revision=0;private closed=false;
 private cursor:ResourceChapter;private page=0;
 private ranges:ResourceRange[];private rangeIndex=0;
 private get range():ResourceRange{return this.ranges[this.rangeIndex];}
 constructor(private readonly plugin:SwordDockController,private readonly target:Extract<ResourceLink,{kind:'scripture'}>,private readonly sourceTitle:string, private bible:BibleResource|null=null){
  super(plugin.app);this.ranges=[target.range,...target.additionalRanges??[]];this.cursor={book:target.range.start.book,chapter:target.range.start.chapter};
 }
 onOpen():void{this.contentEl.addClass('versedock','vd-resource-passage-modal');void this.openBible();}
 private async openBible():Promise<void>{
  this.contentEl.setText('Opening offline passage…');
  const desired=this.target.edition??this.target.module;
  try {
   if(this.ranges.length>32)throw Error('This source citation exceeds the supported reference count. No target was substituted.');
   if(this.bible){await this.render();return;}
   const current=this.plugin.readerBible;
   if(!desired||[current.edition,current.metadata?.abbreviation].some(value=>value?.toLocaleLowerCase()===desired.toLocaleLowerCase()))this.bible=current;
   else {
    const alias=desired.toLocaleLowerCase();const id=alias==='kjv'?'kjv':['web','webp'].includes(alias)?'webp':this.plugin.availableBibleEditions().find(edition=>edition.id.toLocaleLowerCase()===alias&&edition.ready)?.id;
    this.bible=id?await this.plugin.getBibleResource(id):null;
   }
   if(this.closed)return;
   if(!this.bible?.metadata)throw Error('The linked Bible edition '+(desired??'')+' is unavailable. Its reference was not opened in a substitute edition.');
   await this.render();
  }catch(error){if(!this.closed)this.contentEl.setText(error instanceof Error?error.message:'Passage unavailable.');}
 }
 private async render(focus?:string):Promise<void>{
  const revision=++this.revision;const root=this.contentEl,bible=this.bible!;
  root.empty();root.createEl('h2',{text:resourceRangeLabel(this.range)});
  root.createEl('p',{cls:'vd-subtle',text:'Linked from '+this.sourceTitle+'. Source coordinates are retained; preview wording comes from '+bible.metadata!.abbreviation+' · '+bible.metadata!.edition+'.'});
  if(this.ranges.length>1){
   const label=root.createEl('label',{cls:'vd-resource-citation-picker',text:'Source references '});
   const select=label.createEl('select',{attr:{'aria-label':'Select a reference from this source citation'}});select.dataset.previewAction='citation';
   this.ranges.forEach((range,index)=>select.createEl('option',{text:(index+1)+'. '+resourceRangeLabel(range),attr:{value:String(index)}}));select.value=String(this.rangeIndex);
   select.addEventListener('change',()=>{const index=select.selectedIndex;if(index<0||index>=this.ranges.length)return;this.rangeIndex=index;this.cursor={book:this.range.start.book,chapter:this.range.start.chapter};this.page=0;void this.render('citation');});
   if(focus==='citation')select.focus();
  }
  const content=root.createDiv({cls:'vd-resource-passage-preview',attr:{role:'region',tabindex:'0','aria-label':'Offline linked passage'}});
  content.setText('Loading this source chapter…');
  try {
   const loaded=await loadResourcePassagePage(bible,this.range,this.cursor,this.target.wholeChapter);
   if(this.closed||revision!==this.revision)return;
   content.empty();content.createEl('h3',{text:refLabel(loaded.ref)+' · '+bible.metadata!.abbreviation});
   const start=this.page*25;
   for(const verse of loaded.verses.slice(start,start+25)){const line=content.createEl('p');line.createEl('sup',{text:verse.verse+' '});line.appendText(verse.text);}
   const paging=root.createDiv({cls:'vd-action-row'});
   const action=(label:string,available:boolean,change:()=>void):void=>{const button=textButton(paging,label,()=>{change();void this.render(label);});button.disabled=!available;button.dataset.previewAction=label;};
   action('Previous page',this.page>0,()=>{this.page--;});
   paging.createSpan({text:(start+1)+'–'+Math.min(start+25,loaded.verses.length)+' of '+loaded.verses.length+' verses',attr:{role:'status'}});
   action('Next page',start+25<loaded.verses.length,()=>{this.page++;});
   const previous=resourceAdjacentChapter(bible,this.range,this.cursor,-1),next=resourceAdjacentChapter(bible,this.range,this.cursor,1);
   if(previous||next){action('Previous source chapter',!!previous,()=>{this.cursor=previous!;this.page=0;});action('Next source chapter',!!next,()=>{this.cursor=next!;this.page=0;});}
   const actions=root.createDiv({cls:'vd-action-row'});
   textButton(actions,'Open in Reader',()=>{void this.navigate(loaded.ref,bible);},'mod-cta');
   textButton(actions,'Close',()=>this.close());
   if(focus){const button=[...root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('[data-preview-action]')].find(button=>button.dataset.previewAction===focus);if(button&&!button.disabled)button.focus();else content.focus();}
  }catch(error){if(!this.closed&&revision===this.revision)content.setText(error instanceof Error?error.message:'Passage unavailable. No verse was substituted.');}
 }
 private async navigate(ref:PassageReference,bible:BibleResource):Promise<void>{
  if(this.closed)return;await this.plugin.setBibleEdition(bible.edition);
  if(this.closed||this.plugin.settings.bibleEdition!==bible.edition)return;
  this.plugin.selectReference(ref);this.close();await this.plugin.openReader();
 }
 onClose():void{this.closed=true;++this.revision;this.contentEl.empty();}
}
