import {vi} from 'vitest';
export class FixtureElement {
 children:FixtureElement[]=[];parent:FixtureElement|null=null;dataset:Record<string,string>={};attrs:Record<string,string>={};listeners=new Map<string,Array<(event:any)=>void>>();
 selectionDirection:'forward'|'backward'|'none'='none';
 className='';value='';open=false;disabled=false;hidden=false;checked=false;connected=true;selectionStart=0;selectionEnd=0;scrollTop=0;tabIndex=0;style={setProperty:vi.fn()};private ownText='';
 constructor(readonly tag:string,readonly ownerDocument:any){}
 get tagName(){return this.tag.toUpperCase();}get parentElement(){return this.parent;}
 closest(selector:string):FixtureElement|null{for(let at:FixtureElement|null=this;at;at=at.parent)if(at.matches(selector))return at;return null;}
 get textContent():string{return this.ownText+this.children.map(c=>c.textContent).join('');}set textContent(text:string){this.ownText=text;this.children=[];}
 get isConnected():boolean{return this.connected&&(this.tag==='body'||!!this.parent?.isConnected);}
 get childElementCount(){return this.children.length;}get options(){return this.children.filter(c=>c.tag==='option');}get selectedIndex(){return this.options.findIndex(c=>c.value===this.value);}
 createEl(tag:string,options:any={}){const child=new FixtureElement(tag,this.ownerDocument);child.className=options.cls??'';child.textContent=options.text??'';if(options.value!==undefined)child.value=options.value;for(const [k,v]of Object.entries(options.attr??{}))child.setAttribute(k,String(v));this.append(child);return child;}
 createDiv(options={}){return this.createEl('div',options);}createSpan(options={}){return this.createEl('span',options);}append(child:FixtureElement){child.parent=this;this.children.push(child);if(this.tag==='select'&&child.tag==='option'&&this.children.length===1)this.value=child.value;}appendText(text:string){this.ownText+=text;}
 hasClass(name:string){return this.className.split(/\s+/).includes(name);}
 setSelectionRange(start:number,end:number,direction:'forward'|'backward'|'none'='none'){this.selectionStart=start;this.selectionEnd=end;this.selectionDirection=direction;}
 addClass(...names:string[]){this.className+=' '+names.join(' ');}setText(text:string){this.textContent=text;}
 setAttribute(key:string,value:string){this.attrs[key]=value;if(key==='value')this.value=value;if(key==='disabled')this.disabled=true;if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;}
 getAttribute(key:string){return key.startsWith('data-')?this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]??null:this.attrs[key]??null;}hasAttribute(key:string){return this.getAttribute(key)!==null;}
 addEventListener(name:string,callback:(event:any)=>void){this.listeners.set(name,[...this.listeners.get(name)??[],callback]);}
 dispatch(name:string){for(const callback of this.listeners.get(name)??[])callback({target:this,key:'Enter',preventDefault(){},stopPropagation(){},detail:0});}click(){if(!this.disabled)this.dispatch('click');}
 focus(){this.ownerDocument.activeElement=this;}select(){this.selectionStart=0;this.selectionEnd=this.value.length;}scrollIntoView(){}
 empty(){if(this.contains(this.ownerDocument.activeElement))this.ownerDocument.activeElement=this.ownerDocument.body;for(const c of this.children)c.parent=null;this.children=[];this.ownText='';}
 contains(node:FixtureElement|null):boolean{for(let at=node;at;at=at.parent)if(at===this)return true;return false;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
 matches(selector:string){const tag=/^[a-z]+/.exec(selector)?.[0];if(tag&&tag!==this.tag)return false;for(const cls of selector.matchAll(/\.([\w-]+)/g))if(!this.className.split(/\s+/).includes(cls[1]))return false;for(const attr of selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g))if(attr[2]===undefined?!this.hasAttribute(attr[1]):this.getAttribute(attr[1])!==attr[2])return false;return true;}
 querySelectorAll(selector:string):FixtureElement[]{return this.children.flatMap(c=>[...(selector.split(',').some(s=>c.matches(s.trim()))?[c]:[]),...c.querySelectorAll(selector)]);}
 querySelector(selector:string){return this.querySelectorAll(selector)[0]??null;}
}
export function fixtureApp(){const doc:any={};doc.body=new FixtureElement('body',doc);doc.activeElement=doc.body;const root:FixtureElement=doc.body.createDiv();return {qaRoot:root,qaDoc:doc,workspace:{getActiveViewOfType:()=>null,getLeavesOfType:()=>[],requestSaveLayout:vi.fn()},vault:{getName:()=> 'QA'}};}
export function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(yes=>resolve=yes);return {promise,resolve};}
export const settle=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
export function button(root:FixtureElement,text:string){const found=root.querySelectorAll('button').find(b=>b.textContent===text);if(!found)throw Error('Missing button '+text);return found;}
