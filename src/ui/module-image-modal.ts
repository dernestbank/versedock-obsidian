import { Modal, type App } from 'obsidian';
import type { ReadingEntry, ReadingModule } from '../core/reading-modules';
import { textButton } from './components';
/** A larger, explicit view of embedded images; no external URL is requested. */
export class ModuleImageModal extends Modal {
 private urls:string[]=[];
 constructor(app:App,private readonly module:ReadingModule,private readonly entry:ReadingEntry){super(app);}
 onOpen():void{
  const root=this.contentEl;root.addClass('versedock','vd-module-image-modal');root.createEl('h2',{text:this.entry.title});
  root.createEl('p',{cls:'vd-subtle',text:this.module.title+' · '+this.module.author});
  const controls=root.createDiv({cls:'vd-action-row'});let zoom=1;
  const viewport=root.createDiv({cls:'vd-module-image-viewport',attr:{tabindex:'0','aria-label':'Map viewing area; scroll to pan'}});
  const scale=(value:number):void=>{zoom=Math.max(.5,Math.min(value,4));for(const img of viewport.querySelectorAll<HTMLImageElement>('img'))img.style.width=zoom*100+'%';};
  textButton(controls,'Zoom out',()=>scale(zoom-.25));textButton(controls,'Fit',()=>{scale(1);viewport.scrollTop=0;viewport.scrollLeft=0;});textButton(controls,'Zoom in',()=>scale(zoom+.25));
  textButton(controls,'Close',()=>this.close());
  for(const block of this.entry.blocks){if(block.type!=='image')continue;const asset=this.module.images[block.image];
   const bytes=Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:asset.mime}));this.urls.push(url);
   viewport.createEl('img',{attr:{src:url,alt:block.caption||this.entry.title,decoding:'async'}});
  }
 }
 onClose():void{for(const url of this.urls)URL.revokeObjectURL(url);this.urls=[];this.contentEl.empty();}
}
