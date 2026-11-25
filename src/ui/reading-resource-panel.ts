import { Notice, normalizePath, TFile } from 'obsidian';
import type { SwordDockController } from '../controller';
import { modulePlainText, type ReadingEntry, type ReadingModule } from '../core/reading-modules';
import { ModuleImageModal } from './module-image-modal';
import { textButton } from './components';
import { renderModuleSource } from './module-source';
import { readingReflectionFileName, readingReflectionMarkdown } from '../core/reading-reflection';
import {ResourceEntryIndex,type ResourceLink} from '../core/resource-links';
import {renderResourceEntryContent} from './resource-content';
import {ResourcePassageModal} from './resource-passage-modal';
import {ResourceEntryModal,ResourceNoteModal} from './resource-entry-modal';
export interface ReadingPosition { entry:string;scroll:number;bookmarks:string[];zoom:number }
export function restoredReadingPositions(raw:unknown):Record<string,ReadingPosition>{
 const result:Record<string,ReadingPosition>={};if(!raw || typeof raw!=='object')return result;
 for(const [id,value] of Object.entries(raw)){
  if(!/^[a-z0-9-]{1,80}$/.test(id) || !value || typeof value!=='object')continue;
  const v=value as Record<string,unknown>;
  result[id]={entry:typeof v.entry==='string'?v.entry.slice(0,512):'',scroll:typeof v.scroll==='number'&&Number.isFinite(v.scroll)?Math.max(0,Math.min(v.scroll,1e7)):0,
   bookmarks:Array.isArray(v.bookmarks)?v.bookmarks.filter((k):k is string=>typeof k==='string'&&k.length<=40).slice(0,1000):[],zoom:typeof v.zoom==='number'&&Number.isFinite(v.zoom)?Math.max(.5,Math.min(v.zoom,4)):1};
 }return result;
}
/** Each module owns its entry, scroll and bookmarks; Bible updates never rerender it. */
export class ReadingResourcePanel {
 private disposed=false;private module:ReadingModule|null=null;private entry:ReadingEntry|null=null;
 private viewport:HTMLElement|null=null;private imageURLs=new Map<string,string>();
 private position:ReadingPosition;
 private index:ResourceEntryIndex|null=null;
 private navigateEntry:((entry:ReadingEntry,anchor?:string)=>void)|null=null;
 constructor(private readonly root:HTMLElement,private readonly plugin:SwordDockController,private readonly id:string,
  position:ReadingPosition|undefined,private readonly save:(position:ReadingPosition)=>void){
  this.position=position??{entry:'',scroll:0,bookmarks:[],zoom:1};void this.load();
 }
 dispose():void{this.disposed=true;for(const url of this.imageURLs.values())URL.revokeObjectURL(url);this.imageURLs.clear();}
 private imageUrl(key:string):string{
  const existing=this.imageURLs.get(key);if(existing)return existing;
  const asset=this.module!.images[key];const raw=atob(asset.base64);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const url=URL.createObjectURL(new Blob([bytes],{type:asset.mime}));this.imageURLs.set(key,url);return url;
 }
 private persist():void{this.save({...this.position,bookmarks:[...this.position.bookmarks]});}
 private async load():Promise<void>{
  this.root.setText('Opening offline resource…');
  try {const module=await this.plugin.modules.load(this.id);if(this.disposed || !this.root.isConnected)return;this.module=module;this.index=new ResourceEntryIndex(module);this.render();}
  catch(error){if(!this.disposed)this.root.setText(error instanceof Error?error.message:'Resource unavailable.');}
 }
 private entries():ReadingEntry[]{
  const module=this.module!;
  if(module.kind==='devotional')return [...module.entries.filter(e=>e.date).sort((a,b)=>(a.date!.month*10000+a.date!.day*10+(a.date!.period==='evening'?1:0))-(b.date!.month*10000+b.date!.day*10+(b.date!.period==='evening'?1:0))),...module.entries.filter(e=>!e.date)];
  return module.entries;
 }
 private render():void {
  const root=this.root;const module=this.module!;const entries=this.entries();root.empty();root.addClass('vd-reading-resource');
  root.createEl('h3',{text:module.title});root.createEl('p',{cls:'vd-subtle',text:[module.author,module.version.split(' ')[0],'Offline'].filter(Boolean).join(' · ')});
  const controls=root.createDiv({cls:'vd-reading-controls'});
  const tools=controls.createEl('details',{cls:'vd-reading-search-tools'});tools.createEl('summary',{text:'Search & saved bookmarks'});
  const search=tools.createEl('input',{attr:{type:'search',placeholder:'Search this resource',maxlength:'100','aria-label':'Search '+module.title}});
  const count=tools.createEl('p',{cls:'vd-subtle',attr:{role:'status'}});
  const select=controls.createEl('select',{attr:{'aria-label':module.kind==='graphics'?'Contents and maps':'Contents'}});
  const navigation=controls.createDiv({cls:'vd-action-row'});
  const imageControls:HTMLButtonElement[]=[];
  let dateInput:HTMLInputElement|null=null;let period:HTMLSelectElement|null=null;
  const filtered=():ReadingEntry[]=>{const q=search.value.trim().toLocaleLowerCase();return entries.filter(e=>!q||(e.title+' '+modulePlainText(e)).toLocaleLowerCase().includes(q));};
  const refresh=():void=>{const choices=filtered();select.empty();
   if(module.kind==='devotional'){for(const [dated,label]of [[true,'Daily readings'],[false,'Index and navigation']] as const){const group=select.createEl('optgroup',{attr:{label}});for(const e of choices.filter(e=>!!e.date===dated))group.createEl('option',{value:e.key,text:e.title});}}
   else for(const e of choices)select.createEl('option',{value:e.key,text:e.title});
   if(this.entry&&!choices.some(entry=>entry.key===this.entry!.key))select.createEl('option',{value:this.entry.key,text:'Linked entry: '+this.entry.title});
   select.value=this.entry?.key??'';select.disabled=!select.options.length;count.setText(choices.length+' entries');};
  const updateDate=():void=>{if(this.entry?.date && dateInput && period){const d=this.entry.date;const year=d.month===2&&d.day===29?2000:new Date().getFullYear();dateInput.value=String(year)+'-'+String(d.month).padStart(2,'0')+'-'+String(d.day).padStart(2,'0');period.value=d.period;}};
  const choose=(entry:ReadingEntry,restore=false,anchor?:string):void=>{
   this.entry=entry;this.position.entry=entry.key;if(!restore)this.position.scroll=0;refresh();updateDate();this.renderEntry(anchor);this.persist();
   previous.disabled=entries.indexOf(entry)<=0;next.disabled=entries.indexOf(entry)>=entries.length-1;
   bookmark.setAttribute('aria-pressed',String(this.position.bookmarks.includes(entry.key)));
   for(const control of imageControls)control.disabled=!entry.blocks.some(block=>block.type==='image');
  };
  const previous=textButton(navigation,'Previous',()=>{const index=entries.indexOf(this.entry!);if(index>0)choose(entries[index-1]);});
  const next=textButton(navigation,'Next',()=>{const index=entries.indexOf(this.entry!);if(index+1<entries.length)choose(entries[index+1]);});
  const history:Array<{entry:ReadingEntry;scroll:number}>=[];
  const back=textButton(navigation,'Back',()=>{const saved=history.pop();if(saved){this.position.scroll=saved.scroll;choose(saved.entry,true);back.disabled=!history.length;this.viewport?.focus({preventScroll:true});}});back.disabled=true;back.title='Back to the previous linked entry';
  this.navigateEntry=(entry,anchor)=>{if(this.entry)history.push({entry:this.entry,scroll:this.viewport?.scrollTop??0});if(history.length>50)history.shift();choose(entry,false,anchor);back.disabled=!history.length;if(!anchor)this.viewport?.querySelector<HTMLElement>('h4')?.focus({preventScroll:true});};
  const bookmark=textButton(navigation,'Bookmark',()=>{
   if(!this.entry)return;const key=this.entry.key;const exists=this.position.bookmarks.includes(key);
   this.position.bookmarks=exists?this.position.bookmarks.filter(k=>k!==key):[...this.position.bookmarks,key];bookmark.setAttribute('aria-pressed',String(!exists));this.persist();
  });
  const marks=tools.createEl('select',{attr:{'aria-label':'Saved resource bookmarks'}});
  const refreshMarks=():void=>{marks.empty();marks.createEl('option',{value:'',text:'Saved bookmarks'});for(const e of entries.filter(e=>this.position.bookmarks.includes(e.key)))marks.createEl('option',{value:e.key,text:e.title});};
  refreshMarks();bookmark.addEventListener('click',refreshMarks);marks.addEventListener('change',()=>{const e=entries.find(e=>e.key===marks.value);if(e)choose(e);});
  if(module.kind==='devotional') {
   const dated=controls.createDiv({cls:'vd-action-row'});
   dateInput=dated.createEl('input',{attr:{type:'date','aria-label':'Devotional date'}});
   period=dated.createEl('select',{attr:{'aria-label':'Devotional reading time'}});period.createEl('option',{value:'morning',text:'Morning'});period.createEl('option',{value:'evening',text:'Evening'});
   const findDate=():void=>{const match=/^\d{4}-(\d{2})-(\d{2})$/.exec(dateInput!.value);const e=entries.find(e=>match&&e.date?.month===Number(match[1])&&e.date.day===Number(match[2])&&e.date.period===period!.value);if(e)choose(e);else new Notice('No reading is supplied for this date and time.');};
   dateInput.addEventListener('change',findDate);period.addEventListener('change',findDate);
   textButton(dated,'Today',()=>{const today=new Date();dateInput!.value=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');findDate();});
   textButton(controls,'Write reflection',()=>{void this.reflection();});
  }
  if(module.kind==='graphics') {
   const thumbs=controls.createEl('details',{cls:'vd-resource-thumbnails'});thumbs.createEl('summary',{text:'Browse image thumbnails'});
   const grid=thumbs.createDiv();for(const e of entries){const block=e.blocks.find(b=>b.type==='image');if(block?.type!=='image')continue;
    const button=grid.createEl('button',{attr:{type:'button','aria-label':e.title}});button.createEl('img',{attr:{src:this.imageUrl(block.image),alt:e.title,loading:'lazy',decoding:'async'}});button.addEventListener('click',()=>choose(e));
   }
   const zoom=controls.createDiv({cls:'vd-action-row'});
   const scale=(n:number):void=>{this.position.zoom=Math.max(.5,Math.min(n,4));this.applyZoom();this.persist();};
   imageControls.push(textButton(zoom,'Zoom out',()=>scale(this.position.zoom-.25)),textButton(zoom,'Fit',()=>scale(1)),textButton(zoom,'Zoom in',()=>scale(this.position.zoom+.25)),textButton(zoom,'Larger view',()=>{if(this.entry)new ModuleImageModal(this.plugin.app,module,this.entry).open();}));
  }
  this.viewport=root.createDiv({cls:'vd-resource-reading-content',attr:{tabindex:'0','aria-label':module.title+' reading area'}});
  this.viewport.addEventListener('scroll',()=>{this.position.scroll=this.viewport!.scrollTop;this.persist();},{passive:true});
  const credits=root.createEl('details',{cls:'vd-resource-source-notice'});credits.createEl('summary',{text:'Source and attribution'});
  renderModuleSource(credits,module);
  select.addEventListener('change',()=>{const e=entries.find(e=>e.key===select.value);if(e)choose(e);});search.addEventListener('input',refresh);
  const saved=entries.find(e=>e.key===this.position.entry);
  const now=new Date();const today=entries.find(e=>e.date?.month===now.getMonth()+1&&e.date.day===now.getDate()&&e.date.period==='morning');
  choose(saved??today??entries[0],!!saved);
 }
 private applyZoom():void{for(const image of this.viewport?.querySelectorAll<HTMLImageElement>('img')??[])image.style.width=this.position.zoom*100+'%';}
 private renderEntry(anchor?:string):void{
  const viewport=this.viewport!;const entry=this.entry!;viewport.empty();viewport.createEl('h4',{text:entry.title,attr:{tabindex:'-1'}});
  const content=renderResourceEntryContent(viewport,this.module!,entry,{imageUrl:key=>this.imageUrl(key),open:target=>this.openLink(target)});
  this.applyZoom();const top=this.position.scroll;viewport.scrollTop=top;
  if(anchor&&!content.anchor(anchor))new Notice('The linked anchor is missing or ambiguous in this source entry.');
  const anchorFocus=viewport.ownerDocument.activeElement;let alignedScroll=viewport.scrollTop;
  const restore=():void=>{
   if(this.disposed||this.entry!==entry||viewport.scrollTop!==alignedScroll)return;
   // Late images may finish alignment, but must not undo a user's focus or scroll.
   if(anchor){if(viewport.ownerDocument.activeElement!==anchorFocus)return;content.anchor(anchor);}
   else viewport.scrollTop=top;
   alignedScroll=viewport.scrollTop;
  };
  for(const image of viewport.querySelectorAll('img'))image.addEventListener('load',restore,{once:true});
 }
 private openLink(target:ResourceLink):void{
  if(this.disposed||!this.module)return;
  if(target.kind==='scripture'){new ResourcePassageModal(this.plugin,target,this.module.title).open();return;}
  if(target.kind==='entry'||target.kind==='commentary'){
   const result=this.index!.resolve(target);if(!result.entries.length){new Notice(result.reason??'Linked entry unavailable.');return;}
   if(target.kind==='entry')this.navigateEntry?.(result.entries[0],target.anchor);
   else new ResourceEntryModal(this.plugin,this.module,result.entries).open();
  }else if(target.kind==='note')new ResourceNoteModal(this.plugin,target.text).open();
  else if(target.kind==='anchor')new Notice('This source anchor is missing or ambiguous.');
 }
 private async reflection():Promise<void>{
  const module=this.module;const entry=this.entry;if(!module||!entry)return;
  try {const folder=normalizePath(this.plugin.settings.studyNoteFolder+'/Reflections');const adapter=this.plugin.app.vault.adapter;
   let current='';for(const part of folder.split('/')){current=current?current+'/'+part:part;if(!await adapter.exists(current))await this.plugin.app.vault.createFolder(current);}
   const path=folder+'/'+readingReflectionFileName(module,entry);let file=this.plugin.app.vault.getAbstractFileByPath(path);
   if(!file)file=await this.plugin.app.vault.create(path,readingReflectionMarkdown(module,entry));
   if(file instanceof TFile){
    const existing=this.plugin.app.workspace.getLeavesOfType('markdown').find(leaf=>('file' in leaf.view)&&leaf.view.file===file);
    await (existing??this.plugin.app.workspace.getLeaf(true)).openFile(file);
   }
  }catch(error){new Notice(error instanceof Error?error.message:'Unable to open reflection note.');}
 }
}
