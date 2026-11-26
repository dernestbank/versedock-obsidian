export interface ModuleSourceMetadata {
 title:string;abbreviation:string;author:string;language:string;version:string;
 notice:string;strongs:boolean;rightToLeft:boolean;verseRules:string;customCss:string;
}

/** Shared physical Details boundary. Markup, CSS and rules remain inert data. */
export function readModuleSourceMetadata(fields:Record<string,unknown>):ModuleSourceMetadata {
 const value=(name:string):unknown=>Object.hasOwn(fields,name)?fields[name]:undefined;
 const text=(name:string,max=300):string=>{
  const raw=value(name);if(raw==null)return '';
  if(typeof raw!=='string'||raw.length>max)throw new Error('Invalid metadata '+name+' text.');
  return raw.trim();
 };
 return {
  title:text('title')||text('description',3000)||'Untitled module',
  abbreviation:text('abbreviation',80),author:text('author'),language:text('language',40),
  version:text('versiondate')||text('version'),notice:text('comments',100000),
  strongs:Number(value('strong'))===1,rightToLeft:Number(value('righttoleft'))===1,
  verseRules:text('verserules',100000),customCss:text('customcss',100000),
 };
}
