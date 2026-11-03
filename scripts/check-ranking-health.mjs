// Daily production feed sentinel. GitHub Actions reports a failure if a ranking silently goes stale.
const url=process.env.RADAR_FEED_URL||'https://taiwan-ott-radar.netlify.app/.netlify/functions/feed';
const response=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(25000)});
if(!response.ok)throw Error('Production feed HTTP '+response.status);
const feed=await response.json();
const board=p=>feed.boards?.find(x=>x.platform===p);
const disney=board('Disney+'),netflix=board('Netflix');
const localDate=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t));
const today=localDate(Date.now());
const problems=[];
if(!disney||disney.items?.length!==10||disney.status!=='ok'||disney.stale||localDate(disney.checked_at)!==today)problems.push('Disney+ official Taiwan top 10 is not fully refreshed today');
if(!netflix||netflix.items?.length!==10||netflix.stale)problems.push('Netflix Taiwan weekly Top 10 is missing or stale');
for(const x of netflix?.items||[]){
 if(!x.title||/中文片名待確認|待確認（第/.test(x.title))problems.push('Netflix rank '+x.rank+' has a placeholder title');
 if(x.english_title&&!/[A-Za-z]/.test(x.title))problems.push('Netflix rank '+x.rank+' English-title fallback is invalid');
}
console.log(JSON.stringify({checked_at:new Date().toISOString(),disney:{status:disney?.status,checked_at:disney?.checked_at,count:disney?.items?.length,stale:disney?.stale},netflix:{status:netflix?.status,checked_at:netflix?.checked_at,count:netflix?.items?.length,english_titles:(netflix?.items||[]).filter(x=>x.english_title).map(x=>x.title)},problems},null,2));
if(problems.length)process.exitCode=1;
