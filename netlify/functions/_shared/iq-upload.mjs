import {createPublicKey,createHash,verify} from 'node:crypto';
import {SOURCES,parseRanking} from './rankings.mjs';
export function publicKeyInfo(raw){const jwk=JSON.parse(raw);if(jwk.kty!=='RSA'||jwk.d||Buffer.from(jwk.n||'','base64url').length<256)throw Error('Invalid public key');return {key:createPublicKey({key:jwk,format:'jwk'}),kid:createHash('sha256').update(Buffer.from(jwk.n,'base64url')).digest('hex')};}
export function validateLocalUpload(bytes,signature,publicKey,now=Date.now()){
 if(bytes.length>120000)throw Error('Payload too large');
 if(!verify('RSA-SHA256',bytes,publicKeyInfo(publicKey).key,Buffer.from(signature||'','base64')))throw Error('Invalid signature');
 const data=JSON.parse(bytes.toString('utf8')),captured=Date.parse(data.captured_at);
 if(!Number.isFinite(captured)||captured>now+300000||captured<now-900000)throw Error('Capture time outside allowed window');
 const r=data.response;if(r?.base?.key!=='home_web'||!/台[湾灣]/.test(r.base.name||''))throw Error('Expected Taiwan homepage response');
 const source=SOURCES.find(s=>s.platform==='iQIYI'),parsed=parseRanking(source,JSON.stringify(r));
 if(parsed.items.length!==10||parsed.items.some((x,i)=>x.rank!==i+1||x.title.length>200||new URL(x.url).hostname!=='www.iq.com'||!new URL(x.url).pathname.startsWith('/album/'))||new Set(parsed.items.map(x=>x.url)).size!==10)throw Error('Expected ten distinct ranked works');
 return {...source,...parsed,status:'ok',period_label:'台灣端每日擷取',verification_mode:'taiwan_local_agent',verified_snapshot_id:'iq-local-agent-v1',automatic_updating:true,checked_at:new Date(captured).toISOString(),attempted_at:new Date(captured).toISOString(),received_at:new Date(now).toISOString(),note:'由已配對的台灣電腦擷取官方熱播榜；電腦須開機連網。'};
}
export function withLocalIqBoard(data,local,now=Date.now()){
 const reference=data.boards.find(b=>b.platform==='iQIYI');
 if(local?.verification_mode!=='taiwan_local_agent'||local.items?.length!==10)return data;
 const captured=Date.parse(local.checked_at),referenced=Date.parse(reference?.checked_at);
 if(!Number.isFinite(captured)||captured<=referenced)return data;
 const stale=now-captured>36*3600000;
 const board={...local,stale,status:'partial',automatic_updating:true,verification_mode:'taiwan_local_unverified',note:stale?'台灣端最近一次上傳已超過 36 小時，且尚未與官方前台逐筆核對。':'台灣端本日擷取成功；因之前與官網前台名次不一致，這份榜單仍待人工核對，不代表前台名次已驗證。'};
 return {...data,updated_at:Date.parse(local.checked_at)>Date.parse(data.updated_at)?local.checked_at:data.updated_at,boards:data.boards.map(b=>b.platform==='iQIYI'?board:b)};
}
export function createUploadHandler({publicKey,getStore,now=()=>Date.now()}){return async req=>{
 const key=publicKey();if(!key)return Response.json({error:'Uploader not paired yet'},{status:503});
 if(req.method==='GET'){try{return Response.json({kid:publicKeyInfo(key).kid},{headers:{'cache-control':'no-store'}});}catch{return Response.json({error:'Invalid server configuration'},{status:503});}}
 if(req.method!=='POST')return new Response(null,{status:405,headers:{allow:'GET, POST'}});
 if(!req.headers.get('x-ott-signature'))return Response.json({error:'Signature required'},{status:401});
 let bytes,board;try{if(Number(req.headers.get('content-length'))>120000)return new Response(null,{status:413});const reader=req.body?.getReader(),chunks=[];let size=0;if(!reader)throw Error('Empty body');while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>120000){await reader.cancel();return new Response(null,{status:413});}chunks.push(Buffer.from(value));}bytes=Buffer.concat(chunks);board=validateLocalUpload(bytes,req.headers.get('x-ott-signature'),key,now());}catch{return Response.json({error:'Signature or ranking validation failed'},{status:400});}
 const store=getStore(),old=await store.get('iq-taiwan-local.json',{type:'json'});
 if(old&&Date.parse(board.checked_at)<=Date.parse(old.checked_at))return Response.json({error:'Older or duplicate capture'},{status:409});
 await store.setJSON('iq-taiwan-local.json',board);return Response.json({ok:true,checked_at:board.checked_at,count:board.items.length},{headers:{'cache-control':'no-store'}});
};}
