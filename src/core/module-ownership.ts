import {isModuleDirectory,isStageDirectory,isStateDirectory} from './module-paths';
export interface ModuleOwner {format:1;owner:'sworddock';purpose:'module'|'management'|'download';target:string;stage:string}
export function parseModuleOwner(raw:string):ModuleOwner{
 if(raw.length>4096)throw Error('Invalid resource ownership record.');
 const owner=JSON.parse(raw) as ModuleOwner;
 if(owner.format!==1||owner.owner!=='sworddock'||!isStageDirectory(owner.stage)
  ||(owner.purpose==='module'?!isModuleDirectory(owner.target):owner.purpose==='management'?!isStateDirectory(owner.target):owner.purpose==='download'?!/^download-[a-z0-9][a-z0-9-]{0,79}-[a-f0-9]{64}$/.test(owner.target):true))throw Error('Invalid resource ownership record.');
 return owner;
}
export function moduleOwner(purpose:ModuleOwner['purpose'],target:string,stage:string):string{
 const raw=JSON.stringify({format:1,owner:'sworddock',purpose,target,stage});parseModuleOwner(raw);return raw;
}
