import {BOOKS,bookByName} from './books';
import {decodeResourceEntities,resourceContentText,type ResourceNode} from './resource-content';
import type {ResourceLink,ResourcePoint,ResourceRange} from './resource-links';

export interface CommentaryBlock {kind:'paragraph'|'heading'|'quotation';text:string;nodes?:ResourceNode[]}
export interface CommentaryContent {blocks:CommentaryBlock[];issues:string[];complete:boolean}

/** Qualified OSIS coordinates only. An invalid member makes the whole source link unavailable. */
export function parseOsisResourceReference(raw:string):Extract<ResourceLink,{kind:'scripture'}>|null {
 if(typeof raw!=='string'||raw.length>4096||/[\u0000-\u001f\u007f]/.test(raw))return null;
 const members=raw.trim().split(/ +/);if(!raw.trim()||members.length>32)return null;
 const point=(value:string):ResourcePoint|null=>{
  const match=/^([1-3]?[A-Za-z]+)\.(\d{1,3})(?:\.(\d{1,3}))?$/.exec(value);if(!match)return null;
  const named=bookByName(match[1]),book=named?BOOKS.indexOf(named)+1:0,chapter=Number(match[2]),verse=match[3]===undefined?undefined:Number(match[3]);
  return book>0&&chapter>0&&chapter<=200&&(verse===undefined||verse>0&&verse<=200)?{book,chapter,...(verse===undefined?{}:{verse})}:null;
 };
 const order=(p:ResourcePoint):number=>p.book*1e6+p.chapter*1000+(p.verse??0);
 const ranges:ResourceRange[]=[];
 for(const member of members){
  const parts=member.split('-');if(parts.length>2)return null;
  const start=point(parts[0]),end=parts.length===2?point(parts[1]):undefined;
  if(!start||end===null||end&&order(end)<order(start))return null;
  ranges.push({start,...(end?{end}:{})});
 }
 return {kind:'scripture',range:ranges[0],...(ranges.length>1?{additionalRanges:ranges.slice(1)}:{})};
}

/** Parse the pinned SWORD OSIS vocabulary as inert data, never browser markup. */
export function parseCommentarySource(source:string):CommentaryContent {
 const blocks:CommentaryBlock[]=[],issues=new Set<string>();let nodes:ResourceNode[]=[];
 type InlineNode=Extract<ResourceNode,{type:'element'|'link'}>;
 let stack:Array<{name:string;node:InlineNode}>=[];
 let kind:CommentaryBlock['kind']='paragraph',superscripts=0,count=0;
 const fail=():never=>{throw Error('Commentary formatting limit reached; complete original source remains available.');};
 if(typeof source!=='string'||source.length>1024*1024)return {blocks:[],issues:['Commentary source size limit reached; complete original source remains available.'],complete:false};
 const add=(node:ResourceNode):void=>{if(++count>20000)fail();(stack.at(-1)?.node.children??nodes).push(node);};
 const push=(name:string,node:InlineNode):void=>{add(node);stack.push({name,node});if(stack.length>32)fail();};
 const close=(name:string):void=>{const at=stack.findLastIndex(frame=>frame.name===name);if(at>=0)stack.length=at;};
 const flush=():void=>{
  const text=resourceContentText({nodes,issues:[],complete:true}).replace(/\s+/g,' ').trim();
  if(text){
   if(text.length>100000||blocks.length>=2000)fail();
   blocks.push({kind:kind==='paragraph'&&superscripts>=2?'quotation':kind,text,nodes});
  }
  const previous=stack;nodes=[];stack=[];superscripts=0;
  for(const frame of previous)push(frame.name,{...frame.node,children:[]});
 };
 const suppressed:string[]=[];
 const active=new Set(['script','style','iframe','object','svg','math','template']);
 try {
  let offset=0;
  while(offset<source.length){
   if(source[offset]!=='<'){
    const next=source.indexOf('<',offset),end=next<0?source.length:next;
    if(!suppressed.length)add({type:'text',text:decodeResourceEntities(source.slice(offset,end)).replace(/\s+/g,' ')});
    offset=end;continue;
   }
   if(source.startsWith('<!--',offset)){const end=source.indexOf('-->',offset+4);offset=end<0?source.length:end+3;continue;}
   let end=offset+1,quote='';
   for(;end<source.length;end++){
    if(end-offset>4096)fail();const char=source[end];
    if(quote){if(char===quote)quote='';}else if(char==='"'||char==="'")quote=char;else if(char==='>')break;
   }
   if(end>=source.length){if(!suppressed.length)add({type:'text',text:source.slice(offset)});break;}
   const raw=source.slice(offset,end+1);offset=end+1;
   const match=/^<\s*(\/?)\s*([a-z][a-z0-9:-]*)([\s\S]*?)\/?\s*>$/i.exec(raw);
   if(!match){issues.add('Unsupported source markup remains available as original text.');continue;}
   const name=match[2].toLowerCase(),closing=!!match[1],single=/\/\s*>$/.test(raw);
   if(suppressed.length){if(closing){const at=suppressed.lastIndexOf(name);if(at>=0)suppressed.length=at;}else if(active.has(name)&&!single){suppressed.push(name);if(suppressed.length>32)fail();}continue;}
   if(active.has(name)){issues.add('Active source markup is inert and omitted from reading.');if(!closing&&!single)suppressed.push(name);continue;}
   if(['div','l','lg','title'].includes(name))flush();
   if(name==='title'){kind=closing?'paragraph':'heading';continue;}
   if(['div','l','lg','chapter','milestone'].includes(name))continue;
   if(closing){close(name);continue;}
   const attrs:Record<string,string>=Object.create(null),duplicates=new Set<string>();let attrCount=0;
   for(const attr of match[3].matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)){
    if(++attrCount>64)fail();const key=attr[1].toLowerCase();
    if(Object.hasOwn(attrs,key))duplicates.add(key);else attrs[key]=decodeResourceEntities(attr[2]??attr[3]??attr[4]??'');
    if(key==='style'||key.startsWith('on'))issues.add('Source CSS and event attributes are not applied.');
   }
   let node:InlineNode;
   if(name==='reference'){
    const target=duplicates.has('osisref')?null:parseOsisResourceReference(attrs.osisref??'');
    if(!target)issues.add('An incomplete, ambiguous or unsupported source reference is unavailable; its label and original source are retained.');
    node={type:'link',target,children:[]};
   }else if(name==='hi'){
    const type=duplicates.has('type')?'':attrs.type;
    const tags={italic:'em',bold:'strong',super:'sup',underline:'u'} as const;
    const tag=Object.hasOwn(tags,type)?tags[type as keyof typeof tags]:'span';
    if(type==='super')superscripts++;
    if(!Object.hasOwn(tags,type)&&type!=='small-caps')issues.add('Unsupported source emphasis is displayed as ordinary text.');
    node={type:'element',tag,children:[],...(type==='small-caps'?{smallCaps:true}:{})};
   }else {
    if(name!=='note')issues.add('Unsupported wrapper markup is omitted; its ordinary text and original source are retained.');
    node={type:'element',tag:'span',children:[]};
   }
   if(single)add(node);else push(name,node);
  }
  flush();if(suppressed.length)issues.add('Unclosed active source markup is quarantined; original source remains available.');
  return {blocks,issues:[...issues],complete:true};
 }catch(error){return {blocks:[],issues:[...issues,error instanceof Error?error.message:'Formatting unavailable; original source remains available.'],complete:false};}
}
