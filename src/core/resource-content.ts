import type {ReadingImage} from './reading-modules';
import {RESOURCE_ENTITIES} from './resource-entities';
import {parseResourceLink,type ResourceLink} from './resource-links';

export const RESOURCE_TAGS=['p','div','span','h1','h2','h3','h4','h5','h6','strong','em','u','s','sup','sub','small','blockquote','ul','ol','li','table','thead','tbody','tfoot','tr','td','th','caption','pre','code'] as const;
export type ResourceTag=typeof RESOURCE_TAGS[number];
export type ResourceNode={type:'text';text:string}|{type:'break'}|{type:'rule'}|{type:'anchor';name:string}
 |{type:'image';image:string;caption:string}
 |{type:'element';tag:ResourceTag;children:ResourceNode[];start?:number;align?:'left'|'center'|'right';smallCaps?:boolean}
 |{type:'link';target:ResourceLink|null;children:ResourceNode[]};
export interface ResourceDocument {nodes:ResourceNode[];issues:string[];complete:boolean}
const allowed=new Set<string>(RESOURCE_TAGS);
const blocks=new Set(['p','div','h1','h2','h3','h4','h5','h6','blockquote','ul','ol','li','table','tr','td','th','caption','pre']);
const blocked=new Set(['script','style','iframe','object','embed','svg','math','template','head','form','button','input','select','textarea','video','audio','canvas','noscript','applet']);
const voids=new Set(['img','br','hr','input','meta','link','base','embed','source','track','wbr','area','param','col']);
const aliases:Record<string,ResourceTag>={b:'strong',i:'em',strike:'s',del:'s',center:'div',font:'span',section:'div',article:'div'};
export function decodeResourceEntities(text:string):string {
 return text.replace(/&(#x[\da-f]+|#\d+|[a-z][a-z0-9]*);/gi,(raw,key:string)=>{
  if(key[0]!=='#')return Object.hasOwn(RESOURCE_ENTITIES,key)?RESOURCE_ENTITIES[key]:raw;
  const value=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));
  return value>0&&value<=0x10ffff&&!(value>=0xd800&&value<=0xdfff)?String.fromCodePoint(value):'�';
 });
}

/** Pure bounded tokenizer/tree builder. No browser HTML parser or resource loading. */
export function parseResourceContent(source:string,images:Readonly<Record<string,ReadingImage>>):ResourceDocument {
 const nodes:ResourceNode[]=[],issues=new Set<string>();let count=0;
 const fail=():never=>{throw new Error('Formatting limit reached; use the complete plain text and retained original source.');};
 if(typeof source!=='string'||source.length>1024*1024)return {nodes:[],issues:['Source size limit reached; use the retained original source.'],complete:false};
 const stack:Array<{sourceTag:string;children:ResourceNode[]}>= [{sourceTag:'',children:nodes}];
 const anchors=new Map<string,number>();
 const links:Array<{node:Extract<ResourceNode,{type:'link'}>;fragment?:string}>=[];
 const suppressed:string[]=[];
 const add=(node:ResourceNode):void=>{if(++count>20000)fail();stack[stack.length-1].children.push(node);};
 const close=(name:string):void=>{for(let at=stack.length-1;at>0;at--)if(stack[at].sourceTag===name){stack.length=at;return;}};
 const text=(value:string):void=>{if(!value||suppressed.length)return;const preserve=stack.some(frame=>frame.sourceTag==='pre');const decoded=decodeResourceEntities(value);add({type:'text',text:preserve?decoded:decoded.replace(/\s+/g,' ')});};
 try {
  let offset=0;
  while(offset<source.length){
   if(source[offset]!=='<'){const end=source.indexOf('<',offset);text(source.slice(offset,end<0?source.length:end));offset=end<0?source.length:end;continue;}
   if(source.startsWith('<!--',offset)){const end=source.indexOf('-->',offset+4);offset=end<0?source.length:end+3;continue;}
   let end=offset+1,quote='';
   for(;end<source.length;end++){
    if(end-offset>4096)fail();const char=source[end];
    if(quote){if(char===quote)quote='';}else if(char==='"'||char==="'")quote=char;else if(char==='>')break;
   }
   if(end>=source.length){text(source.slice(offset));break;}
   const raw=source.slice(offset,end+1);offset=end+1;
   if(/^<!doctype\b/i.test(raw)||/^<\?/.test(raw)){issues.add('Source declarations are inert.');continue;}
   const match=/^<\s*(\/?)\s*([a-z][a-z0-9:-]*)([\s\S]*?)\/?\s*>$/i.exec(raw);
   if(!match){text(raw);continue;}
   const name=match[2].toLowerCase(),closing=!!match[1],single=voids.has(name)||/\/\s*>$/.test(raw);
   if(suppressed.length){
    if(closing){const at=suppressed.lastIndexOf(name);if(at>=0)suppressed.length=at;}
    else if(blocked.has(name)&&!single)suppressed.push(name);
    if(suppressed.length>32)fail();continue;
   }
   if(blocked.has(name)||['meta','link','base'].includes(name)){
    issues.add('Active, embedded or remote source content is omitted from reading; original source is retained.');
    if(!closing&&!single)suppressed.push(name);continue;
   }
   if(closing){close(name);continue;}
   const attrs:Record<string,string>=Object.create(null);const duplicates=new Set<string>();let attrCount=0;
   for(const attr of match[3].matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)){
    if(++attrCount>64)fail();const key=attr[1].toLowerCase();
    if(Object.hasOwn(attrs,key))duplicates.add(key);else attrs[key]=decodeResourceEntities(attr[2]??attr[3]??attr[4]??'');
    if(key==='style'||key.startsWith('on'))issues.add('Source CSS and event attributes are not applied.');
    if(['face','size','color','width','height','bgcolor'].includes(key))issues.add('Source presentational attributes are omitted; theme styling is used.');
   }
   if(duplicates.has('id')||duplicates.has('name'))issues.add('Ambiguous source anchor attributes are unavailable; original source is retained.');
   for(const anchor of new Set([duplicates.has('id')?undefined:attrs.id,name==='a'&&!duplicates.has('name')?attrs.name:undefined])){
    if(anchor&&anchor.length<=256&&!/[\u0000-\u001f\u007f]/.test(anchor)){add({type:'anchor',name:anchor});anchors.set(anchor,(anchors.get(anchor)??0)+1);}
   }
   if(name==='br'){add({type:'break'});continue;}if(name==='hr'){add({type:'rule'});continue;}
   if(name==='img'){
    if(attrs.src&&Object.hasOwn(images,attrs.src)&&!duplicates.has('src'))add({type:'image',image:attrs.src,caption:(attrs.alt??'').slice(0,500)});
    else issues.add('An image is external, missing or unsupported; no request was made.');
    continue;
   }
   // Recover common malformed publisher nesting at paragraph/cell/list boundaries.
   if(name==='p')close('p');
   if(name==='td'||name==='th'){close('td');close('th');}
   if(name==='tr')close('tr');
   if(name==='li'){
    const list=stack.findLastIndex(frame=>frame.sourceTag==='ul'||frame.sourceTag==='ol');
    const item=stack.findLastIndex(frame=>frame.sourceTag==='li');if(item>list)close('li');
   }
   if(name==='a'){
    close('a');
    if(attrs.href===undefined){const node:ResourceNode={type:'element',tag:'span',children:[]};add(node);if(!single){stack.push({sourceTag:name,children:node.children});if(stack.length>33)fail();}continue;}
    const target=duplicates.has('href')?null:parseResourceLink(attrs.href);
    const node:ResourceNode={type:'link',target,children:[]};add(node);
    let fragment:string|undefined;
    if(!duplicates.has('href')&&attrs.href.startsWith('#')&&!attrs.href.slice(1).includes('#')){
     try{const decoded=decodeURIComponent(attrs.href.slice(1));if(decoded.length<=256&&!/[\u0000-\u001f\u007f]/.test(decoded))fragment=decoded;}catch{/* Invalid escapes remain inert. */}
    }
    links.push({node,fragment});
    if(!single){stack.push({sourceTag:name,children:node.children});if(stack.length>33)fail();}continue;
   }
   const tag=Object.hasOwn(aliases,name)?aliases[name]:(allowed.has(name)?name as ResourceTag:null);
   if(!tag){issues.add('Unsupported wrapper markup is omitted; its ordinary text and original source are retained.');continue;}
   const node:ResourceNode={type:'element',tag,children:[]};
   if(tag==='ol'&&attrs.start&&/^\d{1,4}$/.test(attrs.start)&&Number(attrs.start)>0)node.start=Number(attrs.start);
   const align=name==='center'?'center':attrs.align?.toLowerCase();if(['left','center','right'].includes(align??''))node.align=align as 'left'|'center'|'right';
   add(node);if(!single){stack.push({sourceTag:name,children:node.children});if(stack.length>33)fail();}
  }
  for(const link of links){
   if(link.fragment!==undefined&&anchors.has(link.fragment)){
    if(anchors.get(link.fragment)===1)link.node.target={kind:'anchor',id:link.fragment};
    else {link.node.target=null;issues.add('An ambiguous local anchor is unavailable; original source is retained.');}
   }
   if(!link.node.target)issues.add('An unsupported or unsafe source link is shown as inert text.');
  }
  if(suppressed.length)issues.add('Unclosed active source content is quarantined; original source is retained.');
  return {nodes,issues:[...issues],complete:true};
 }catch(error){return {nodes:[],issues:[...issues,error instanceof Error?error.message:'Formatting unavailable; original source is retained.'],complete:false};}
}
export function resourceContentText(doc:ResourceDocument):string {
 const text=(node:ResourceNode):string=>node.type==='text'?node.text:node.type==='break'||node.type==='rule'?'\n':node.type==='anchor'?'':node.type==='image'?node.caption+'\n'
  :node.children.map(text).join('')+(node.type==='element'&&blocks.has(node.tag)?'\n':'');
 return doc.nodes.map(text).join('');
}
