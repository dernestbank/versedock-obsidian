import {describe,it,expect,vi} from 'vitest';
vi.mock('obsidian',()=>({Platform:{isDesktopApp:true},FileSystemAdapter:class{constructor(private base:string){}getBasePath(){return this.base;}}}));
import {FileSystemAdapter,Platform} from 'obsidian';
import type {App} from 'obsidian';
import {mkdtemp,mkdir,readFile,writeFile,readdir,stat,access,rename,rm,symlink} from 'node:fs/promises';
import {join,basename} from 'node:path';import {tmpdir} from 'node:os';
import {createResourceStore} from '../src/obsidian/resource-store';
import {promoteReadingModule} from '../src/core/module-installation';
import type {ReadingModule} from '../src/core/reading-modules';

const content:ReadingModule={format:1,id:'mysword-all-of-grace',kind:'book',title:'Test',author:'A',version:'1',sourcePage:'https://www.mysword.info/download-mysword/books',sourceSha256:'a'.repeat(64),notice:'',images:{},entries:[{key:'1',title:'Entry',blocks:[{type:'text',text:'Text'}]}]};
async function fixture(){
 const base=await mkdtemp(join(tmpdir(),'sworddock-adapter-'));await mkdir(join(base,'.obsidian'));
 const full=(path:string)=>join(base,path);
 const adapter=Object.assign(Object.create(FileSystemAdapter.prototype) as FileSystemAdapter,{
  getBasePath:()=>base,
  exists:async(path:string)=>{try{await access(full(path));return true;}catch{return false;}},
  mkdir:async(path:string)=>{await mkdir(full(path));},read:async(path:string)=>readFile(full(path),'utf8'),write:async(path:string,value:string)=>writeFile(full(path),value),
  stat:async(path:string)=>{try{const item=await stat(full(path));return {type:item.isDirectory()?'folder':'file',size:item.size};}catch{return null;}},
  list:async(path:string)=>{const entries=await readdir(full(path),{withFileTypes:true});const files:string[]=[],folders:string[]=[];for(const entry of entries){const directory=entry.isDirectory()||(entry.isSymbolicLink()&&(await stat(full(path+'/'+entry.name))).isDirectory());(directory?folders:files).push(path+'/'+entry.name);}return {files,folders};},
  rename:async(a:string,b:string)=>rename(full(a),full(b)),rmdir:async(path:string)=>rm(full(path),{recursive:true}),
  trashLocal:async(path:string)=>{await mkdir(join(base,'.trash'),{recursive:true});await rename(full(path),join(base,'.trash',basename(path)));}
 });
 const app={vault:{adapter,configDir:'.obsidian'}} as unknown as App;
 return {base,app,root:join(base,'.obsidian/versedock/modules/v1/reading')};
}
describe('production resource adapter safety',()=>{
 it('rejects a root redirected outside the vault between its ancestor inspection and canonicalization',async()=>{
  const {base,app}=await fixture(),outside=await mkdtemp(join(tmpdir(),'sworddock-outside-'));
  const fs=require('node:fs/promises') as typeof import('node:fs/promises');
  const ancestor=join(await fs.realpath(base),'.obsidian/versedock');await mkdir(ancestor);
  const realpath=fs.realpath;let changed=false;
  await writeFile(join(outside,'keep.txt'),'Keep external data');
  const spy=vi.spyOn(fs,'realpath').mockImplementation((async path=>{
   if(!changed&&String(path)===ancestor){changed=true;await rename(ancestor,ancestor+'-retained');await symlink(outside,ancestor,'dir');}
   return realpath(path);
  }) as typeof fs.realpath);
  try{
   let failure:unknown;try{await createResourceStore(app);}catch(error){failure=error;}
   expect(changed).toBe(true);expect(await readdir(outside)).toEqual(['keep.txt']);
   expect(failure).toBeInstanceOf(Error);expect((failure as Error).message).toMatch(/root|outside/i);
  }finally{spy.mockRestore();await rm(base,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
 });
 it('rejects an aliased ancestor before creating any resource directories outside the vault',async()=>{
  const {base,app}=await fixture(),outside=await mkdtemp(join(tmpdir(),'sworddock-outside-'));
  try{
   await writeFile(join(outside,'keep.txt'),'Keep external data');
   await symlink(outside,join(base,'.obsidian/versedock'),'dir');
   let failure:unknown;try{await createResourceStore(app);}catch(error){failure=error;}
   expect(await readdir(outside)).toEqual(['keep.txt']);
   expect(failure).toBeInstanceOf(Error);expect((failure as Error).message).toMatch(/root|Symbolic|outside/i);
   expect(await readFile(join(outside,'keep.txt'),'utf8')).toBe('Keep external data');
  }finally{await rm(base,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
 });
 it('rejects an already-aliased resource root before accepting a staging write',async()=>{
  const {base,app,root}=await fixture(),outside=await mkdtemp(join(tmpdir(),'sworddock-outside-'));
  try{
   await createResourceStore(app);await rename(root,root+'-retained');await symlink(outside,root,'dir');
   await writeFile(join(outside,'keep.txt'),'Keep external data');
   const stage='.stage-'+crypto.randomUUID();let failure:unknown;
   try{const store=await createResourceStore(app);await store.mkdir(stage);await store.write(stage+'/owner.json','{}');}catch(error){failure=error;}
   expect(await readdir(outside)).toEqual(['keep.txt']);
   expect(failure).toBeInstanceOf(Error);expect((failure as Error).message).toMatch(/root|Symbolic|outside/i);
  }finally{await rm(base,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
 });
 it('refuses staging creation and directory discovery if the root is replaced after initialization',async()=>{
  const {base,app,root}=await fixture(),outside=await mkdtemp(join(tmpdir(),'sworddock-outside-'));
  try{
   const store=await createResourceStore(app);await rename(root,root+'-retained');await symlink(outside,root,'dir');
   await writeFile(join(outside,'keep.txt'),'Keep external data');
   await expect(store.mkdir('.stage-'+crypto.randomUUID())).rejects.toThrow(/root|Symbolic|outside/i);
   expect(await readdir(outside)).toEqual(['keep.txt']);
   await expect(store.directories()).rejects.toThrow(/root|Symbolic|outside/i);
   await expect(store.measureLooseFiles!()).rejects.toThrow(/root|Symbolic|outside/i);
  }finally{await rm(base,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
 });
 it('supports a vault opened through an alias while keeping resource descendants inside its real base',async()=>{
  const {base,app}=await fixture(),container=await mkdtemp(join(tmpdir(),'sworddock-vault-alias-'));
  try{
   const alias=join(container,'vault');await symlink(base,alias,'dir');
   (app.vault.adapter as FileSystemAdapter).getBasePath=()=>alias;
   const store=await createResourceStore(app),info=await promoteReadingModule(store,content);
   expect(await store.read(info.directory+'/content.json')).toContain('Text');
   await store.trash!(info.directory);expect(await readFile(join(base,'.trash',info.directory,'content.json'),'utf8')).toContain('Text');
  }finally{await rm(container,{recursive:true,force:true});await rm(base,{recursive:true,force:true});}
 });
 it('measures actual file bytes and moves resource folders into reversible vault Trash',async()=>{
  const fixtureData=await fixture();const {base,app,root}=fixtureData;
  try{
   const store=await createResourceStore(app);const info=await promoteReadingModule(store,content);const measurement=await store.measure!(info.directory);
   let bytes=0;for(const file of await readdir(join(root,info.directory)))bytes+=(await stat(join(root,info.directory,file))).size;
   expect(measurement).toEqual({bytes,files:3,complete:true,onlyKnownFiles:true});
   await writeFile(join(root,'loose.txt'),'Other data');expect(await store.measureLooseFiles!()).toEqual({bytes:10,files:1,complete:true});
   await expect(store.remove(info.directory)).rejects.toThrow(/Permanent removal/);
   await store.trash!(info.directory);expect(await readFile(join(base,'.trash',info.directory,'content.json'),'utf8')).toContain('Text');
  }finally{await rm(base,{recursive:true,force:true});}
 });
 it('rejects symlinks, aliases and traversal before reads or mutations can escape the owned root',async()=>{
  const {base,app,root}=await fixture(),outside=await mkdtemp(join(tmpdir(),'sworddock-outside-'));
  try{
   const store=await createResourceStore(app);await writeFile(join(outside,'keep.txt'),'Keep external data');
   const stage='.stage-'+crypto.randomUUID();await symlink(outside,join(root,stage),'dir');
   await expect(store.write(stage+'/owner.json','{}')).rejects.toThrow(/Symbolic links|outside/);
   await expect(store.remove(stage)).rejects.toThrow(/Symbolic links|outside/);
   await expect(store.trash!(stage)).rejects.toThrow(/Symbolic links|outside/);
   await expect(store.trash!('../outside')).rejects.toThrow(/Invalid/);
   expect((await store.measure!(stage)).complete).toBe(false);expect(await readFile(join(outside,'keep.txt'),'utf8')).toBe('Keep external data');
  }finally{await rm(base,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
 });
 it('keeps the virtual-adapter branch independent of desktop filesystem access',async()=>{
  const {base,app}=await fixture();Platform.isDesktopApp=false;
  try{
   const adapter={...app.vault.adapter,getBasePath:()=>{throw Error('Desktop path access must not run');}};
   const virtual={vault:{adapter,configDir:'.obsidian'}} as unknown as App;
   const store=await createResourceStore(virtual),stage='.stage-'+crypto.randomUUID();await store.mkdir(stage);await store.write(stage+'/owner.json','{}');
   expect(await store.read(stage+'/owner.json')).toBe('{}');
  }finally{Platform.isDesktopApp=true;await rm(base,{recursive:true,force:true});}
 });
});
