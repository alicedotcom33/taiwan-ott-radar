import {withVerifiedIqSnapshot} from './_shared/iq-taiwan-snapshot.mjs';
import {INITIAL_RANKINGS} from './_shared/rankings-seed.mjs';
import {getStore} from '@netlify/blobs';
import {SOURCES,scanRanking,retainRanking} from './_shared/rankings.mjs';
export default async()=>{
 const store=getStore('ott-radar'),cached=await store.get('rankings.json',{type:'json'});
 const old=withVerifiedIqSnapshot(cached?.schema_version===7?cached:INITIAL_RANKINGS);
 const fresh=await Promise.all(SOURCES.map(scanRanking));
 const boards=fresh.map(b=>{const retained=retainRanking(b,old.boards.find(x=>x.platform===b.platform));return b.platform==='Netflix'&&b.status!=='error'?retainRanking(retained,INITIAL_RANKINGS.boards.find(x=>x.platform===b.platform)):retained;});
 await store.setJSON('rankings.json',{schema_version:7,updated_at:new Date().toISOString(),boards});
};
export const config={background:true,path:'/.netlify/functions/refresh-background'};
