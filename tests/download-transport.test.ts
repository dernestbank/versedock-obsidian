import {afterEach,describe,expect,it} from 'vitest';
import {createServer,get,type Server,type RequestListener} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createHash} from 'node:crypto';
import type {InstallableReadingSource} from '../src/core/reading-catalogue';
import type {ModuleStore} from '../src/core/module-installation';
import {createDesktopModuleDownloader,type PublisherRequest} from '../src/obsidian/download-transport';
import {PartialDownloads} from '../src/core/partial-downloads';

const body=Uint8Array.from({length:256*1024},(_,i)=>i%251);
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const source:InstallableReadingSource={id:'test-download',type:'book',title:'Test download',sourcePage:'https://publisher.test',url:'https://publisher.test/file',compressedBytes:body.length,sha256:hash(body),databaseBytes:body.length,databaseSha256:hash(body)};
function memoryStore(){
 const files=new Map<string,string>(),dirs=new Set<string>();
 const store:ModuleStore={mkdir:async p=>{if(dirs.has(p))throw Error('Exists');dirs.add(p);},write:async(p,v)=>{if(files.has(p))throw Error('Immutable');files.set(p,v);},read:async p=>{if(!files.has(p))throw Error('Missing');return files.get(p)!;},directories:async()=>[...dirs],rename:async()=>{throw Error('Must not activate a download');},remove:async p=>{dirs.delete(p);for(const key of files.keys())if(key.startsWith(p+'/'))files.delete(key);}};
 store.measure=async directory=>{const entries=[...files].filter(([path])=>path.startsWith(directory+'/'));return {bytes:entries.reduce((n,[,raw])=>n+new TextEncoder().encode(raw).length,0),files:entries.length,complete:true,onlyKnownFiles:entries.every(([path])=>/\/(content|manifest|owner)\.json$/.test(path))};};
 return {store,files,dirs};
}
const servers:Server[]=[];afterEach(async()=>{for(const server of servers.splice(0)){server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}});
async function serverFor(handler:RequestListener){
 const server=createServer(handler);servers.push(server);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=(server.address() as AddressInfo).port;
 // Route the injected request to a real loopback socket; production uses HTTPS.
 const request:PublisherRequest=(url,headers,callback)=>get({host:'127.0.0.1',port,path:url.pathname+url.search,headers},callback);
 return request;
}

describe('cancellable publisher byte stream',()=>{
 it('checkpoints an early clean end without Content-Length instead of losing a small resumable prefix',async()=>{
  const disk=memoryStore();let calls=0;
  const request=await serverFor((req,res)=>{
   calls++;
   if(calls===1){res.writeHead(200,{'ETag':'"v1"'});res.write(body.slice(0,32768));res.end();return;}
   const start=32768;expect(req.headers.range).toBe('bytes=32768-');
   res.writeHead(206,{'ETag':'"v1"','Content-Length':body.length-start,'Content-Range':`bytes ${start}-${body.length-1}/${body.length}`});res.end(body.slice(start));
  });
  const download=createDesktopModuleDownloader(disk.store,{request});
  await expect(download(source,new AbortController().signal,()=>{})).rejects.toThrow(/interrupted/i);
  expect((await new PartialDownloads(disk.store).latest(source))?.bytes.length).toBe(32768);
  expect(await download(source,new AbortController().signal,()=>{})).toEqual(body);
 });
 it('explains a dropped response and resumes the saved prefix on retry',async()=>{
  const disk=memoryStore();
  const prefix=32768;
  const request=await serverFor((req,res)=>{
   if(req.headers.range){
    expect(req.headers.range).toBe('bytes='+prefix+'-');
    res.writeHead(206,{'ETag':'"v1"','Content-Length':body.length-prefix,'Content-Range':`bytes ${prefix}-${body.length-1}/${body.length}`});
    res.end(body.slice(prefix));return;
   }
   res.writeHead(200,{'ETag':'"v1"','Content-Length':body.length});
   res.write(body.slice(0,prefix),()=>setTimeout(()=>res.destroy(),20));
  });
  const download=createDesktopModuleDownloader(disk.store,{request});
  await expect(download(source,new AbortController().signal,()=>{})).rejects.toThrow(/connection.*interrupted.*retry/i);
  expect((await new PartialDownloads(disk.store).latest(source))?.bytes).toEqual(body.slice(0,prefix));
  expect(await download(source,new AbortController().signal,()=>{})).toEqual(body);
 });
 it('closes the real socket on cancellation, saves partial bytes, and resumes after recreating the downloader',async()=>{
  const disk=memoryStore(),ranges:(string|undefined)[]=[];
  let closed!:()=>void;const socketClosed=new Promise<void>(resolve=>closed=resolve);
  const request=await serverFor((req,res)=>{
   const range=req.headers.range;ranges.push(range);const start=range?Number(/bytes=(\d+)-/.exec(range)![1]):0;
   res.writeHead(range?206:200,{'ETag':'"v1"','Content-Length':body.length-start,...(range?{'Content-Range':`bytes ${start}-${body.length-1}/${body.length}`}:{})});
   let offset=start;const timer=setInterval(()=>{if(offset===body.length){clearInterval(timer);res.end();return;}res.write(body.slice(offset,offset+16384));offset+=16384;},5);
   res.on('close',()=>{clearInterval(timer);if(!range)closed();});
  });
  const abort=new AbortController();
  const first=createDesktopModuleDownloader(disk.store,{request,checkpointBytes:32768});
  await expect(first(source,abort.signal,received=>{if(received>=65536)abort.abort();})).rejects.toThrow(/cancelled/i);
  await socketClosed;expect(disk.dirs.size).toBe(1);
  let resumedAt=0;
  const reopened=createDesktopModuleDownloader(disk.store,{request,checkpointBytes:32768});
  expect(await reopened(source,new AbortController().signal,received=>{resumedAt||=received;})).toEqual(body);
  expect(ranges).toEqual([undefined,'bytes=65536-']);expect(resumedAt).toBe(65536);expect(disk.dirs.size).toBe(0);
 });
 it.each(['ignored range','changed validator','wrong range'])('restarts safely for %s instead of concatenating unverified bytes',async mode=>{
  const disk=memoryStore();let calls=0;const ranges:(string|undefined)[]=[];
  const request=await serverFor((req,res)=>{
   calls++;ranges.push(req.headers.range);
   if(calls===1){res.writeHead(200,{'ETag':'"v1"','Content-Length':body.length});res.write(body.slice(0,65536));return;}
   if(req.headers.range&&mode!=='ignored range'){
    const start=mode==='wrong range'?10:65536;
    res.writeHead(206,{'ETag':mode==='changed validator'?'"v2"':'"v1"','Content-Length':body.length-start,'Content-Range':`bytes ${start}-${body.length-1}/${body.length}`});res.end(body.slice(start));return;
   }
   res.writeHead(200,{'ETag':'"v1"','Content-Length':body.length});res.end(body);
  });
  const download=createDesktopModuleDownloader(disk.store,{request,checkpointBytes:32768});const abort=new AbortController();
  await expect(download(source,abort.signal,n=>{if(n>=65536)abort.abort();})).rejects.toThrow(/cancelled/i);
  expect(await download(source,new AbortController().signal,()=>{})).toEqual(body);
  expect(ranges[1]).toBe('bytes=65536-');expect(calls).toBe(mode==='ignored range'?2:3);
 });
 it('rejects cross-origin/downgrade redirects and bounds redirect loops',async()=>{
  let location='https://other.test/file',calls=0;
  const request=await serverFor((_req,res)=>{calls++;res.writeHead(302,{Location:location});res.end();});
  const download=createDesktopModuleDownloader(memoryStore().store,{request});
  await expect(download(source,new AbortController().signal,()=>{})).rejects.toThrow(/redirect/i);expect(calls).toBe(1);
  location='http://publisher.test/file';await expect(download(source,new AbortController().signal,()=>{})).rejects.toThrow(/redirect/i);expect(calls).toBe(2);
  location='/file';await expect(download(source,new AbortController().signal,()=>{})).rejects.toThrow(/redirect/i);expect(calls).toBeLessThanOrEqual(6);
 });
 it('never returns changed bytes and rejects oversized responses before buffering them',async()=>{
  let oversized=false;
  const request=await serverFor((_req,res)=>{res.writeHead(200,{'ETag':'"v1"','Content-Length':body.length+(oversized?1:0)});res.end(new Uint8Array(body.length));});
  const disk=memoryStore(),download=createDesktopModuleDownloader(disk.store,{request});
  await expect(download(source,new AbortController().signal,()=>{})).rejects.toThrow(/checksum/i);expect(disk.dirs.size).toBe(0);
  oversized=true;await expect(download(source,new AbortController().signal,()=>{})).rejects.toThrow(/size|length/i);
 });
 it('destroys a request that never receives headers on timeout and makes no request for an already cancelled signal',async()=>{
  let calls=0,closed!:()=>void;const socketClosed=new Promise<void>(resolve=>closed=resolve);
  const request=await serverFor((req)=>{calls++;req.on('close',closed);});
  const download=createDesktopModuleDownloader(memoryStore().store,{request,timeoutMs:100});
  await expect(download(source,new AbortController().signal,()=>{})).rejects.toThrow(/timed out/i);await socketClosed;
  const abort=new AbortController();abort.abort();await expect(download(source,abort.signal,()=>{})).rejects.toThrow(/cancelled/i);expect(calls).toBe(1);
 });
});
