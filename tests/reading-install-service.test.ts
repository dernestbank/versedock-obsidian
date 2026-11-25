import { describe,it,expect,vi } from 'vitest';
import { ReadingInstallService } from '../src/core/reading-install-service';
import type {ModuleStore} from '../src/core/module-installation';
const disk:ModuleStore={mkdir:async()=>{throw Error('must not stage');},read:async()=>'',write:async()=>{throw Error('must not write');},rename:async()=>{},remove:async()=>{},directories:async()=>[]};
describe('catalogue install queue',()=>{
 it('does not start a queued retry after the installer has stopped',async()=>{
  let release!:()=>void,started!:()=>void;const held=new Promise<void>(resolve=>release=resolve),began=new Promise<void>(resolve=>started=resolve);
  let requests=0;
  const service=new ReadingInstallService(disk,async()=>{throw Error('Must not parse');},async()=>{requests++;if(requests===1){started();await held;}return new Uint8Array([1,2,3]);});
  const first=service.install('mysword-all-of-grace');await began;service.cancel('mysword-all-of-grace');
  const retry=service.install('mysword-all-of-grace');service.stop();release();await Promise.all([first,retry]);
  expect(requests).toBe(1);expect(service.jobs.get('mysword-all-of-grace')?.status).toBe('cancelled');
 });
 it('bounds streamed progress notifications while preserving the latest received count',async()=>{
  const clock=vi.spyOn(performance,'now').mockReturnValue(500);let notifications=0;
  const service=new ReadingInstallService(disk,async()=>{throw Error('Must not parse');},async(_source,_signal,progress)=>{for(let n=1;n<=1000;n++)progress(n);return new Uint8Array([1,2,3]);});
  service.subscribe(()=>{if(service.jobs.get('mysword-all-of-grace')?.status==='downloading')notifications++;});
  try{await service.install('mysword-all-of-grace');expect(notifications).toBeLessThanOrEqual(2);expect(service.jobs.get('mysword-all-of-grace')?.received).toBe(1000);}
  finally{clock.mockRestore();}
 });
 it('honors Retry requested while a cancelled transfer is still finishing its checkpoint',async()=>{
  let release!:()=>void,started!:()=>void;const held=new Promise<void>(resolve=>release=resolve),began=new Promise<void>(resolve=>started=resolve);
  let requests=0;
  const service=new ReadingInstallService(disk,async()=>{throw Error('Must not parse');},async()=>{requests++;if(requests===1){started();await held;}return new Uint8Array([1,2,3]);});
  const first=service.install('mysword-all-of-grace');await began;service.cancel('mysword-all-of-grace');
  const retried=service.install('mysword-all-of-grace');release();await Promise.all([first,retried]);
  expect(requests).toBe(2);expect(service.jobs.get('mysword-all-of-grace')?.status).toBe('failed');
  expect(service.jobs.get('mysword-all-of-grace')?.error).toMatch(/checksum/);
 });
 it('rejects an altered publisher artifact without preparing or installing it',async()=>{
  const service=new ReadingInstallService(disk,async()=>{throw Error('must not parse');},async()=>new Uint8Array([1,2,3]));
  await service.install('mysword-all-of-grace');
  expect(service.jobs.get('mysword-all-of-grace')?.status).toBe('failed');
  expect(service.jobs.get('mysword-all-of-grace')?.error).toMatch(/checksum/);expect(service.installed).toEqual([]);
 });
 it('cancels a queued job before network access and rejects unknown download identifiers',async()=>{
  const requested:string[]=[];
  const service=new ReadingInstallService(disk,async()=>{throw Error('must not parse');},async source=>{requested.push(source.id);return new Uint8Array();});
  const one=service.install('mysword-all-of-grace');const two=service.install('mysword-sunday-atlas');service.cancel('mysword-sunday-atlas');
  await Promise.all([one,two]);expect(requested).toEqual(['mysword-all-of-grace']);expect(service.jobs.get('mysword-sunday-atlas')?.status).toBe('cancelled');
  await expect(service.install('https://evil.invalid')).rejects.toThrow(/validated installer/);
 });
});

it('verifies compressed and transport-decompressed artifacts against distinct pinned hashes',async()=>{
 const {verifyReadingDownload}=await import('../src/core/reading-install-service');
 const {sha256}=await import('../src/core/module-installation');const {gzipSync}=await import('node:zlib');
 const raw=new TextEncoder().encode('SQLite format 3\0verified source bytes');const compressed=new Uint8Array(gzipSync(raw));
 const source={id:'test',type:'book' as const,title:'Test',sourcePage:'https://example.com',url:'https://example.com/file.gz',compressedBytes:compressed.length,sha256:await sha256(compressed),databaseBytes:raw.length,databaseSha256:await sha256(raw)};
 expect(await verifyReadingDownload(source,raw)).toEqual(raw);expect(await verifyReadingDownload(source,compressed)).toEqual(raw);
 await expect(verifyReadingDownload({...source,databaseSha256:'0'.repeat(64)},raw)).rejects.toThrow(/checksum/);
});
