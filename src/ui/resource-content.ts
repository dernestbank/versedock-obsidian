import {resourceAnnotations} from './resource-annotations';
import type {SwordDockController} from '../controller';
import {parseResourceContent,type ResourceNode} from '../core/resource-content';
import type {ResourceLink} from '../core/resource-links';
import type {ReadingEntry,ReadingModule} from '../core/reading-modules';

export interface ResourceContentActions {open(target:ResourceLink):void;imageUrl?:(key:string)=>string;originalSource?:string}
/** No source markup/attributes are ever attached to the document. */
export function renderResourceNodes(content:HTMLElement,nodes:readonly ResourceNode[],actions:ResourceContentActions,title='Source image'):{anchor:(id:string)=>boolean} {
 const anchors=new Map<string,HTMLElement[]>();
 const anchor=(id:string):boolean=>{
  const found=anchors.get(id);if(found?.length!==1)return false;
  found[0].scrollIntoView({block:'start'});found[0].focus({preventScroll:true});return true;
 };
 const render=(host:HTMLElement,nodes:readonly ResourceNode[]):void=>{
  for(const node of nodes){
   if(node.type==='text'){host.appendText(node.text);continue;}
   if(node.type==='break'){host.createEl('br');continue;}if(node.type==='rule'){host.createEl('hr');continue;}
   if(node.type==='anchor'){
    const mark=host.createSpan({attr:{tabindex:'-1',role:'group','aria-label':'Source location: '+node.name,'data-source-anchor':node.name}});
    anchors.set(node.name,[...anchors.get(node.name)??[],mark]);continue;
   }
   if(node.type==='image'){
    if(!actions.imageUrl){host.createEl('p',{text:'Embedded image unavailable in this view.'});continue;}
    const figure=host.createSpan({cls:'vd-resource-figure'});
    figure.createEl('img',{attr:{src:actions.imageUrl(node.image),alt:node.caption||title,decoding:'async'}});
    if(node.caption)figure.createSpan({cls:'vd-resource-image-caption',text:node.caption});continue;
   }
   if(node.type==='element'){
    const container=node.tag==='table'?host.createDiv({cls:'vd-resource-table-wrap',attr:{tabindex:'0','aria-label':'Source table; scroll horizontally if needed'}}):host;
    const element=container.createEl(node.tag);
    if(node.start!==undefined&&node.tag==='ol')element.setAttribute('start',String(node.start));
    if(node.align)element.style.textAlign=node.align;
    if(node.smallCaps)element.addClass('vd-resource-small-caps');
    render(element,node.children);continue;
   }
   const target=node.target;
   if(!target){const inert=host.createSpan({cls:'vd-resource-link-unavailable',attr:{title:'Unsupported or unsafe source link. See Original source.'}});render(inert,node.children);continue;}
   const link=host.createEl('a',{cls:'vd-resource-inline-link',attr:target.kind==='external'?{href:target.url,target:'_blank',rel:'noreferrer noopener'}:{href:'#','data-resource-link':target.kind}});
   render(link,node.children);
   if(target.kind!=='external')link.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    if(target.kind==='anchor'&&anchor(target.id))return;
    actions.open(target);
   });
  }
 };
 render(content,nodes);return {anchor};
}

export function renderResourceEntryContent(parent:HTMLElement,module:Pick<ReadingModule,'images'|'title'|'id'>,entry:ReadingEntry,actions:ResourceContentActions,plugin?:SwordDockController):{anchor:(id:string)=>boolean} {
 const content=parent.createDiv({cls:'vd-rich-resource'});
 const doc=entry.source!==undefined?parseResourceContent(entry.source,module.images):null;
 const result=doc?.complete?renderResourceNodes(content,doc.nodes,actions,entry.title):{anchor:(_id:string)=>false};
 if(!doc?.complete){
  for(const block of entry.blocks){
   if(block.type==='text')content.createEl('p',{text:block.text});
   else if(actions.imageUrl){const figure=content.createSpan({cls:'vd-resource-figure'});figure.createEl('img',{attr:{src:actions.imageUrl(block.image),alt:block.caption||entry.title}});}
  }
 }
 if(plugin && content.textContent?.trim())resourceAnnotations(content,plugin,module.id,entry.key,module.title+" · "+entry.title);
 if(!doc||doc.issues.length){
  const explanation=parent.createEl('details',{cls:'vd-resource-format-notice'});explanation.createEl('summary',{text:doc?.complete?'Source formatting notes':'Plain text display · source formatting unavailable'});
  for(const issue of doc?.issues??['This saved generation does not retain original markup. Reinstall or reimport it to enable supported formatting and links.'])explanation.createEl('p',{text:issue});
 }
 if(entry.source!==undefined){const original=parent.createEl('details',{cls:'vd-retained-source'});original.createEl('summary',{text:'Original source text'});original.createEl('pre',{text:actions.originalSource??entry.source});}
 return result;
}
