import {isDiscoveredId} from './discovery-sources';
import {isModuleDirectory,parseInstalledInfo,readInstalledModule,sha256,type InstalledReadingModule,type ModuleStore} from './module-installation';
import {isLocalModuleId} from './module-provenance';
import {readingSource} from './reading-catalogue';
import {checkCancelled} from './reading-modules';
import {moduleOwner,parseModuleOwner} from './module-ownership';

interface Selection {id:string;directory:string;removed:boolean}
interface Snapshot {format:1;revision:number;selections:Selection[]}
export interface ModuleProblem {directory:string;id?:string;message:string}
const STATE=/^\.state-(\d{12})-([a-f0-9]{16})$/;
const allowed=(info:InstalledReadingModule):boolean=>!!readingSource(info.id)||(isLocalModuleId(info.id,info.kind)||isDiscoveredId(info.id,info.kind));

/** Immutable management snapshots make selection/removal atomic without overwriting files. */
export class ModuleManagement {
  generations:InstalledReadingModule[]=[];
  problems:ModuleProblem[]=[];
  pendingStages:string[]=[];
  stateDirectories:string[]=[];
  requiresRecovery=false;
  private state:Snapshot|null=null;
  private maxRevision=0;
  constructor(private readonly store:ModuleStore){}

  get installed():InstalledReadingModule[]{
    if(this.requiresRecovery)return [];
    if(!this.state)return this.legacySelection();
    return this.state.selections.filter(entry=>!entry.removed).flatMap(entry=>{
      const info=this.generations.find(info=>info.id===entry.id&&info.directory===entry.directory);return info?[info]:[];
    });
  }
  get removed():InstalledReadingModule[]{
    return this.state?.selections.filter(entry=>entry.removed).flatMap(entry=>{
      const info=this.generations.find(info=>info.id===entry.id&&info.directory===entry.directory)
        ??this.generations.find(info=>info.id===entry.id);return info?[info]:[];
    })??[];
  }
  private legacySelection():InstalledReadingModule[]{
    const sorted=[...this.generations].sort((a,b)=>b.createdAt-a.createdAt||a.directory.localeCompare(b.directory));
    return sorted.filter((info,index)=>sorted.findIndex(candidate=>candidate.id===info.id)===index);
  }
  private async readSnapshot(directory:string):Promise<Snapshot>{
    const match=STATE.exec(directory);if(!match)throw Error('Invalid management directory.');
    const metadata=await this.store.read(directory+'/manifest.json');if(metadata.length>10000)throw Error('Management manifest exceeds its limit.');
    const manifest=JSON.parse(metadata) as {format:number;kind:string;revision:number;bytes:number;sha256:string;files?:number};
    const raw=await this.store.read(directory+'/content.json');
    if(raw.length>1024*1024||manifest.format!==1||manifest.kind!=='management'||manifest.revision!==Number(match[1])
      ||!Number.isSafeInteger(manifest.bytes)||manifest.bytes<1||manifest.bytes>1024*1024
      ||(manifest.files!==undefined&&manifest.files!==3)||!/^[a-f0-9]{64}$/.test(manifest.sha256)||!manifest.sha256.startsWith(match[2]))throw Error('Invalid management manifest.');
    if(manifest.files===3){const owner=parseModuleOwner(await this.store.read(directory+'/owner.json'));if(owner.purpose!=='management'||owner.target!==directory)throw Error('Management ownership record does not match.');}
    const bytes=new TextEncoder().encode(raw);
    if(bytes.length!==manifest.bytes||await sha256(bytes)!==manifest.sha256)throw Error('Management checksum failed.');
    const snapshot=JSON.parse(raw) as Snapshot;
    if(snapshot.format!==1||snapshot.revision!==manifest.revision||!Array.isArray(snapshot.selections)||snapshot.selections.length>5000)throw Error('Invalid management record.');
    const ids=new Set<string>();
    for(const entry of snapshot.selections){
      if(typeof entry.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(entry.id)||ids.has(entry.id)
        ||typeof entry.directory!=='string'||!isModuleDirectory(entry.directory)||!entry.directory.startsWith(entry.id+'-')
        ||typeof entry.removed!=='boolean')throw Error('Invalid management selection.');
      ids.add(entry.id);
    }
    return snapshot;
  }
  async initialize():Promise<void>{
    this.generations=[];this.problems=[];this.pendingStages=[];this.stateDirectories=[];this.state=null;this.maxRevision=0;this.requiresRecovery=false;
    const snapshots:Array<{directory:string;value:Snapshot}>=[];
    const directories=await this.store.directories();
    if(directories.length>20000)throw Error('Resource storage needs cleanup before scanning more directories.');
    for(const directory of directories){
      const state=STATE.exec(directory);
      if(state){
        this.stateDirectories.push(directory);this.maxRevision=Math.max(this.maxRevision,Number(state[1]));
        try{snapshots.push({directory,value:await this.readSnapshot(directory)});}
        catch{this.problems.push({directory,message:'A management record is damaged. Earlier verified choices are used if available; version and removal choices may have rolled back. Review the library.'});}
      }else if(/^\.stage-[a-f0-9-]{36}$/.test(directory))this.pendingStages.push(directory);
      else if(isModuleDirectory(directory)){
        let id:string|undefined;
        try{const info=parseInstalledInfo(await this.store.read(directory+'/manifest.json'),directory);id=info.id;
          if(allowed(info)){await readInstalledModule(this.store,info);this.generations.push(info);}
        }catch{this.problems.push({directory,id,message:'This stored generation failed verification. Repair it or select a verified version.'});}
      }
    }
    snapshots.sort((a,b)=>b.value.revision-a.value.revision);
    if(snapshots.length){
      if(snapshots[1]?.value.revision===snapshots[0].value.revision){
        this.requiresRecovery=true;this.problems.push({directory:snapshots[0].directory,message:'Conflicting management records need an explicit recovery choice.'});
      }else this.state=snapshots[0].value;
    }else if(this.stateDirectories.length)this.requiresRecovery=true;
    for(const entry of this.state?.selections??[])if(!entry.removed&&!this.generations.some(info=>info.id===entry.id&&info.directory===entry.directory))
      this.problems.push({id:entry.id,directory:entry.directory,message:'The selected version is unavailable. Choose a verified retained version or repair the resource.'});
  }
  private async persist(selections:Selection[],signal?:AbortSignal,beforeCommit?:()=>void):Promise<void>{
    checkCancelled(signal);
    const revision=this.maxRevision+1;
    if(revision>999999999999)throw Error('Management revision limit reached.');
    const snapshot:Snapshot={format:1,revision,selections:[...selections].sort((a,b)=>a.id.localeCompare(b.id))};
    const raw=JSON.stringify(snapshot),bytes=new TextEncoder().encode(raw);
    if(bytes.length>1024*1024||selections.length>5000)throw Error('Management record exceeds its limit.');
    const hash=await sha256(bytes),directory='.state-'+String(revision).padStart(12,'0')+'-'+hash.slice(0,16);
    const manifest=JSON.stringify({format:1,kind:'management',revision,bytes:bytes.length,sha256:hash,files:3});
    const stage='.stage-'+crypto.randomUUID();await this.store.mkdir(stage);
    try{
      const owner=moduleOwner('management',directory,stage);await this.store.write(stage+'/owner.json',owner);
      if(await this.store.read(stage+'/owner.json')!==owner)throw Error('Management ownership verification failed.');
      await this.store.write(stage+'/content.json',raw);checkCancelled(signal);
      if(await this.store.read(stage+'/content.json')!==raw)throw Error('Management content verification failed.');
      await this.store.write(stage+'/manifest.json',manifest);
      if(await this.store.read(stage+'/manifest.json')!==manifest)throw Error('Management manifest verification failed.');
      checkCancelled(signal);beforeCommit?.();await this.store.rename(stage,directory);
      this.state=snapshot;this.maxRevision=revision;this.stateDirectories.push(directory);this.requiresRecovery=false;
      this.problems=this.problems.filter(problem=>!problem.message.startsWith('The selected version is unavailable.'));
    }catch(error){await this.store.remove(stage).catch(()=>{});throw error;}
  }
  async ensureBaseline(signal?:AbortSignal):Promise<void>{
    if(this.requiresRecovery)throw Error('Recover the resource management records before making changes.');
    if(!this.state)await this.persist(this.legacySelection().map(info=>({id:info.id,directory:info.directory,removed:false})),signal);
  }
  async storageProtection():Promise<Set<string>>{
    if(this.requiresRecovery)throw Error('Review management recovery before cleaning resource storage.');
    const protectedPaths=new Set(this.installed.map(info=>info.directory));
    const directories=[...this.stateDirectories].sort().reverse();
    if(directories[0])protectedPaths.add(directories[0]);
    let records=0;
    for(const directory of directories){
      try{const state=await this.readSnapshot(directory);protectedPaths.add(directory);
        for(const entry of state.selections)protectedPaths.add(entry.directory);
        if(++records===2)break;
      }catch{/* Damaged records are reviewed separately; the highest revision remains protected. */}
    }
    return protectedPaths;
  }
  async ownsState(directory:string):Promise<boolean>{try{await this.readSnapshot(directory);return true;}catch{return false;}}
  async activate(info:InstalledReadingModule,signal?:AbortSignal):Promise<void>{
    await readInstalledModule(this.store,info);if(!allowed(info))throw Error('This resource is not managed.');
    await this.ensureBaseline(signal);
    this.generations=this.generations.filter(item=>item.directory!==info.directory).concat(info);
    await this.persist(this.state!.selections.filter(entry=>entry.id!==info.id).concat({id:info.id,directory:info.directory,removed:false}),signal);
  }
  async useVersion(directory:string,signal?:AbortSignal):Promise<void>{
    if(!isModuleDirectory(directory))throw Error('Invalid stored version.');
    const info=parseInstalledInfo(await this.store.read(directory+'/manifest.json'),directory);
    await this.activate(info,signal);
  }
  async remove(id:string,protectedIds:()=>readonly string[],signal?:AbortSignal):Promise<void>{
    const info=this.installed.find(info=>info.id===id);if(!info)throw Error('This resource is not installed or managed.');
    const checkProtection=():void=>{if(protectedIds().includes(id))throw Error('The current default Bible is protected. Select another Bible before removing it.');};checkProtection();
    await this.ensureBaseline(signal);
    await this.persist(this.state!.selections.map(entry=>entry.id===id?{...entry,removed:true}:entry),signal,checkProtection);
  }
  async restore(id:string,signal?:AbortSignal):Promise<void>{
    const entry=this.state?.selections.find(entry=>entry.id===id&&entry.removed);
    if(!entry)throw Error('This resource is not in removed resources.');
    await this.useVersion(entry.directory,signal);
  }
  /** Rebuild choices only after explicit review when no unambiguous management record remains. */
  async recoverSelections(signal?:AbortSignal):Promise<void>{
    await this.persist(this.legacySelection().map(info=>({id:info.id,directory:info.directory,removed:false})),signal);
  }
}
