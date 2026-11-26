import {tokenizeMySwordGbf} from './mysword-gbf';
import type {ResourceRange} from './resource-links';
export function resourceBibleSource(source:string):{annotations:Array<{kind:'note'|'heading';source:string}>;references:ResourceRange[];issues:string[]} {
 const scan=tokenizeMySwordGbf(source);
 const annotations:Array<{kind:'note'|'heading';source:string}>=[],references:ResourceRange[]=[],issues=[...scan.issues];
 const stack:Array<{family:string;start:number;kind:'note'|'heading'}>=[];
 for(const token of scan.tokens){
  if(token.kind==='cross-reference'&&token.reference)references.push({start:token.reference.start,...(token.reference.end?{end:token.reference.end}:{})});
  if(token.family==='RF'||token.family==='TS'){
   if(token.kind==='paired-open')stack.push({family:token.family,start:token.end,kind:token.family==='RF'?'note':'heading'});
   if(token.kind==='paired-close'){
    const opening=stack.pop();if(opening?.family===token.family&&!stack.length)annotations.push({kind:opening.kind,source:source.slice(opening.start,token.start)});
   }
  }
 }
 if(scan.tokens.some(token=>token.kind==='unknown'||token.kind==='html'))issues.push('Unsupported source markup remains visible in the original source.');
 return {annotations,references,issues};
}
