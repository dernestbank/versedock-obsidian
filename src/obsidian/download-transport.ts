import type {ClientRequest,IncomingMessage} from 'node:http';
import type {ModuleDownloader} from '../core/reading-install-service';
import type {ModuleStore} from '../core/module-installation';
import {sha256} from '../core/module-installation';
import {PartialDownloads,strongDownloadEtag} from '../core/partial-downloads';
import {checkCancelled} from '../core/reading-modules';

export type PublisherRequest=(url:URL,headers:Record<string,string>,response:(message:IncomingMessage)=>void)=>ClientRequest;
interface TransportOptions {request?:PublisherRequest;checkpointBytes?:number;timeoutMs?:number}
const header=(response:IncomingMessage,key:string):string|undefined=>{
 const value=response.headers[key];return typeof value==='string'?value:undefined;
};
const join=(chunks:readonly Uint8Array[],size:number):Uint8Array=>{
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
};
function publisherUrl(value:string,origin?:string):URL{
 const url=new URL(value);
 if(value.length>2048||url.protocol!=='https:'||url.username||url.password||url.hash||(origin&&url.origin!==origin))throw Error('Publisher redirect must stay on the same HTTPS origin.');
 return url;
}

/** Trusted catalogue URL only. Node HTTPS preserves raw gzip bytes and TLS verification. */
export function createDesktopModuleDownloader(store:ModuleStore,options:TransportOptions={}):ModuleDownloader{
 const cache=new PartialDownloads(store);
 const request:PublisherRequest=options.request??((url,headers,callback)=>{
  const https=require('node:https') as typeof import('node:https');
  return https.get(url,{headers,agent:false,maxHeaderSize:16384},callback);
 });
 const download:ModuleDownloader=async(source,signal,progress)=>{
  checkCancelled(signal);
  if(!Number.isSafeInteger(source.compressedBytes)||source.compressedBytes<1||source.compressedBytes>64*1024*1024)throw Error('Invalid publisher download size.');
  const initial=publisherUrl(source.url),checkpointBytes=options.checkpointBytes??512*1024;
  let active:ClientRequest|undefined,timedOut=false;
  const abort=()=>active?.destroy(new Error('Installation cancelled.'));
  signal.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>{timedOut=true;active?.destroy(new Error('Publisher download timed out. Retry this resource.'));},options.timeoutMs??60000);
  const check=()=>{checkCancelled(signal);if(timedOut)throw Error('Publisher download timed out. Retry this resource.');};
  try{
   let partial=await cache.latest(source),chunks:Uint8Array[]=partial?[partial.bytes]:[];
   let received=partial?.bytes.length??0,saved=received,etag=partial?.etag;
   check();if(received)progress(received);
   for(let attempt=0;attempt<2;attempt++){
    const start=received;let url=initial,response:IncomingMessage|undefined;
    for(let redirects=0;redirects<=3;redirects++){
     check();const headers:Record<string,string>={'Accept-Encoding':'identity'};
     if(start&&etag){headers.Range='bytes='+start+'-';headers['If-Range']=etag;}
     response=await new Promise<IncomingMessage>((resolve,reject)=>{
      active=request(url,headers,message=>{message.on('error',()=>{});resolve(message);});active.on('error',reject);if(signal.aborted)abort();
     });
     check();
     if(![301,302,303,307,308].includes(response.statusCode??0))break;
     const location=header(response,'location');response.destroy();active?.destroy();
     if(!location||redirects===3)throw Error('Publisher redirect limit exceeded.');
     url=publisherUrl(new URL(location,url).href,initial.origin);
    }
    if(!response)throw Error('Publisher response is unavailable.');
    const status=response.statusCode,responseEtag=header(response,'etag');
    if(start&&status!==200){
     const range=header(response,'content-range');
     if(status!==206||range!==`bytes ${start}-${source.compressedBytes-1}/${source.compressedBytes}`||responseEtag!==etag){
      response.destroy();active?.destroy();chunks=[];received=0;saved=0;etag=undefined;partial=null;
      await cache.clear(source);check();continue;
     }
    }else if(status!==200){response.destroy();throw Error('Publisher download failed ('+status+'). Retry this resource.');}
    if(status===200){chunks=[];received=0;saved=0;etag=strongDownloadEtag(responseEtag)?responseEtag:undefined;}
    const remaining=source.compressedBytes-received,length=header(response,'content-length'),encoding=header(response,'content-encoding');
    if((length!==undefined&&length!==String(remaining))||(encoding&&!['identity','gzip','x-gzip'].includes(encoding.toLowerCase()))){response.destroy();throw Error('Publisher response length or encoding does not match the reviewed size.');}
    try{
     for await(const value of response){
      check();const chunk=new Uint8Array(value as Uint8Array);received+=chunk.length;
      if(received>source.compressedBytes)throw Error('Download exceeds the reviewed size limit.');
      chunks.push(chunk);progress(received);check();
      if(etag&&received<source.compressedBytes&&received-saved>=checkpointBytes){await cache.save(source,join(chunks,received),etag);saved=received;check();}
     }
    }catch(error){
     active?.destroy();
     if(etag&&received>saved&&received<source.compressedBytes)await cache.save(source,join(chunks,received),etag);
     check();throw error;
    }
    check();if(received!==source.compressedBytes){
     if(etag&&received>saved)await cache.save(source,join(chunks,received),etag);
     throw Error('Publisher download was interrupted. Retry to resume.');
    }
    const bytes=join(chunks,received);
    if(await sha256(bytes)!==source.sha256){await cache.clear(source);throw Error('Publisher file changed or failed its checksum. No module was activated.');}
    check();await cache.clear(source);check();return bytes;
   }
   throw Error('Publisher range response could not be resumed. Retry this resource.');
  }finally{clearTimeout(timer);signal.removeEventListener('abort',abort);active?.destroy();}
 };download.capabilities={networkAbort:true,resume:true};return download;
}
