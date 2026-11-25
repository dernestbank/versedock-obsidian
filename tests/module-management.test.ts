import {describe,it,expect} from 'vitest';
import {ReadingInstallService} from '../src/core/reading-install-service';
import {promoteReadingModule,readInstalledModule,type ModuleStore,type InstalledReadingModule} from '../src/core/module-installation';
import type {ReadingModule} from '../src/core/reading-modules';

function disk():ModuleStore {
 const files=new Map<string,string>();
 return {mkdir:async()=>{},write:async(path,value)=>{files.set(path,value);},read:async path=>{if(!files.has(path))throw Error('missing');return files.get(path)!;},
  rename:async(from,to)=>{for(const [path,value]of [...files])if(path.startsWith(from+'/')){files.set(to+path.slice(from.length),value);files.delete(path);}},
  remove:async path=>{for(const key of files.keys())if(key.startsWith(path+'/'))files.delete(key);},directories:async()=>[...new Set([...files.keys()].map(path=>path.split('/')[0]))]};
}
const content=(version:string):ReadingModule=>({format:1,id:'mysword-all-of-grace',kind:'book',title:'Test book',author:'Author',version,sourcePage:'https://www.mysword.info/download-mysword/books',sourceSha256:'a'.repeat(64),notice:'Notice',entries:[{key:'1',title:'Entry',blocks:[{type:'text',text:'Version '+version}]}],images:{}});
const service=(store:ModuleStore,protectedIds:()=>readonly string[]=()=>[])=>new ReadingInstallService(store,async()=>{throw Error('No SQL needed');},async()=>{throw Error('No network');},protectedIds);
async function versions(store:ModuleStore):Promise<[InstalledReadingModule,InstalledReadingModule]>{
 const first=await promoteReadingModule(store,content('1')),second=await promoteReadingModule(store,content('2'));
 for(const [info,date]of [[first,1],[second,2]] as const){info.createdAt=date;await store.write(info.directory+'/manifest.json',JSON.stringify(info));}
 return [first,second];
}
describe('persistent module management',()=>{
 it('reactivates an older generation and retains that exact choice after offline restart',async()=>{
  const store=disk();const [first,second]=await versions(store);const modules=service(store);await modules.initialize();
  expect(modules.installed[0].directory).toBe(second.directory);
  await modules.useVersion(first.directory);
  const restarted=service(store);await restarted.initialize();
  expect(restarted.installed[0].directory).toBe(first.directory);expect((await restarted.load(first.id)).version).toBe('1');
  expect(restarted.generations).toHaveLength(2);
 });
 it('removes reversibly across restart and restores the selected version without deleting files',async()=>{
  const store=disk();const [first]=await versions(store);const modules=service(store);await modules.initialize();await modules.useVersion(first.directory);
  await modules.remove(first.id);expect(modules.installed).toEqual([]);
  const restarted=service(store);await restarted.initialize();expect(restarted.installed).toEqual([]);expect(restarted.removed[0].id).toBe(first.id);
  await restarted.restore(first.id);expect(restarted.installed[0].directory).toBe(first.directory);
  expect((await readInstalledModule(store,first)).version).toBe('1');
 });
 it('protects the current default at operation time and refuses unmanaged/bundled identifiers',async()=>{
  const store=disk();const [first]=await versions(store);let current=first.id;const modules=service(store,()=>[current]);await modules.initialize();
  await expect(modules.remove(first.id)).rejects.toThrow(/current|protected/i);
  current='webp';await modules.remove(first.id);await expect(modules.remove('webp')).rejects.toThrow(/managed|installed/i);
 });
 it('checks default protection again before publishing a removal',async()=>{
  const store=disk();const [first]=await versions(store);let current='webp';const modules=service(store,()=>[current]);await modules.initialize();await modules.useVersion(first.directory);
  const write=store.write;store.write=async(path,value)=>{await write(path,value);if(value.includes('"removed":true'))current=first.id;};
  await expect(modules.remove(first.id)).rejects.toThrow(/current|protected/i);
  const restarted=service(store);await restarted.initialize();expect(restarted.installed[0].directory).toBe(first.directory);
 });
 it('keeps the prior selection if a new management snapshot cannot be saved',async()=>{
  const store=disk();const [first,second]=await versions(store);const modules=service(store);await modules.initialize();await modules.useVersion(first.directory);
  const write=store.write;store.write=async(path,value)=>{if(value.includes('"revision":3'))throw Error('Management disk failure');await write(path,value);};
  await expect(modules.useVersion(second.directory)).rejects.toThrow('Management disk failure');
  const restarted=service(store);await restarted.initialize();expect(restarted.installed[0].directory).toBe(first.directory);
  expect((await store.directories()).some(path=>path.startsWith('.stage-'))).toBe(false);
 });
 it('reports damaged selected content without silently choosing a different edition',async()=>{
  const store=disk();const [first,second]=await versions(store);const modules=service(store);await modules.initialize();await modules.useVersion(first.directory);
  await store.write(first.directory+'/content.json','damaged');const restarted=service(store);await restarted.initialize();
  expect(restarted.installed).toEqual([]);expect(restarted.problems.some(problem=>problem.directory===first.directory)).toBe(true);
  await restarted.useVersion(second.directory);expect(restarted.installed[0].directory).toBe(second.directory);
 });
 it('recovers a previous verified management snapshot when the newest one is corrupt',async()=>{
  const store=disk();const [first,second]=await versions(store);const modules=service(store);await modules.initialize();await modules.useVersion(first.directory);await modules.useVersion(second.directory);
  const latest=(await store.directories()).filter(path=>path.startsWith('.state-')).sort().at(-1)!;await store.write(latest+'/content.json','damaged');
  const restarted=service(store);await restarted.initialize();expect(restarted.installed[0].directory).toBe(first.directory);expect(restarted.problems.some(problem=>problem.directory===latest)).toBe(true);
 });
 it('does not resurrect removed resources when every management record is damaged',async()=>{
  const store=disk();const [first]=await versions(store);const modules=service(store);await modules.initialize();await modules.remove(first.id);
  for(const directory of (await store.directories()).filter(path=>path.startsWith('.state-')))await store.write(directory+'/content.json','damaged');
  const restarted=service(store);await restarted.initialize();expect(restarted.requiresRecovery).toBe(true);expect(restarted.installed).toEqual([]);
  await expect(restarted.useVersion(first.directory)).rejects.toThrow(/Recover/);
  await restarted.recoverSelections();expect(restarted.installed).toHaveLength(1);
  const recovered=service(store);await recovered.initialize();expect(recovered.requiresRecovery).toBe(false);expect(recovered.installed).toHaveLength(1);
 });
 it('retains uncommitted generations without silently activating them after restart',async()=>{
  const store=disk();const [first]=await versions(store);const modules=service(store);await modules.initialize();await modules.useVersion(first.directory);
  await promoteReadingModule(store,content('3'));
  const restarted=service(store);await restarted.initialize();expect(restarted.installed[0].directory).toBe(first.directory);expect(restarted.generations).toHaveLength(3);
 });
 it('repairs corrupt content or manifests into a fresh verified generation and retains damaged originals',async()=>{
  for(const damaged of ['content.json','manifest.json','owner.json']){
   const store=disk();const first=await promoteReadingModule(store,content('1'));await store.write(first.directory+'/'+damaged,'damaged');
   const repaired=await promoteReadingModule(store,content('1'));
   expect(repaired.directory).not.toBe(first.directory);expect((await readInstalledModule(store,repaired)).version).toBe('1');
   expect(await store.read(first.directory+'/'+damaged)).toBe('damaged');
   expect((await promoteReadingModule(store,content('1'))).directory).toBe(repaired.directory);
  }
 });
});
