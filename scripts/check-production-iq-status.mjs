const url='https://taiwan-ott-radar.netlify.app/.netlify/functions/feed';try{const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(20000)});const x=await r.json();const b=x.boards?.find(b=>b.platform==='iQIYI');console.log(JSON.stringify({http:r.status,feed_updated_at:x.updated_at,iq:b?{checked_at:b.checked_at,received_at:b.received_at,attempted_at:b.attempted_at,mode:b.verification_mode,stale:b.stale,automatic_updating:b.automatic_updating,verified_snapshot_id:b.verified_snapshot_id,top:b.items?.slice(0,3).map(v=>v.title)}:null},null,2));}catch(e){console.log('Feed diagnostic unavailable: '+String(e));}
const base='https://taiwan-ott-radar.netlify.app/.netlify/functions';
try{
 const r=await fetch(base+'/refresh-background',{method:'POST',signal:AbortSignal.timeout(30000)});
 console.log('LIVE_REFRESH',r.status);
 if(r.status!==202&&r.status!==200)throw Error('Refresh failed: '+r.status);
 for(let i=0;i<12;i++){
  await new Promise(resolve=>setTimeout(resolve,10000));
  const x=await (await fetch(base+'/feed',{headers:{accept:'application/json'},signal:AbortSignal.timeout(20000)})).json();
  const boards=Object.fromEntries((x.boards||[]).filter(b=>['Netflix','Disney+'].includes(b.platform)).map(b=>[b.platform,{status:b.status,checked_at:b.checked_at,stale:b.stale,items:b.items?.slice(0,3)}]));
  console.log('LIVE_VERIFY',JSON.stringify({i,updated_at:x.updated_at,boards}));
  if(boards['Disney+']?.status==='ok'&&!boards['Disney+']?.stale&&boards['Netflix']?.items?.[1]?.title==='新手上路')break;
 }
}catch(e){console.log('LIVE_VERIFY_ERR',String(e));process.exitCode=1;}
