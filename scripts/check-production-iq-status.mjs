const url='https://taiwan-ott-radar.netlify.app/.netlify/functions/feed';
const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(20000)});
if(!r.ok)throw Error('HTTP '+r.status);
const feed=await r.json();const boards=feed.boards||[];
console.log('AUDIT_DATE',new Date().toISOString());
for(const b of boards){
 const works=b.items||[],ranks=works.map(x=>x.rank);
 const uniqueRanks=new Set(ranks).size===ranks.length;
 const oneToTen=ranks.length===10&&ranks.every((rank,index)=>rank===index+1);
 const entries=works.map(x=>({rank:x.rank,title:x.title,url:x.url,category:x.category}));
 console.log('BOARD_AUDIT',JSON.stringify({platform:b.platform,period:b.period_label,checked_at:b.checked_at,received_at:b.received_at,status:b.status,stale:b.stale,verification_mode:b.verification_mode,count:works.length,uniqueRanks,oneToTen,works:entries}));
}
