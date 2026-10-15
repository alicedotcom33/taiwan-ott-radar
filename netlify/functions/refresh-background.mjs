import {withVerifiedIqSnapshot} from './_shared/iq-taiwan-snapshot.mjs';
import {INITIAL_RANKINGS} from './_shared/rankings-seed.mjs';
import {getStore} from '@netlify/blobs';
import {SOURCES,scanRanking,retainRanking,enrichIqCast} from './_shared/rankings.mjs';
export default async()=>{
 const store=getStore('ott-radar'),cached=await store.get('rankings.json',{type:'json'});
 const old=withVerifiedIqSnapshot(cached?.schema_version===7?cached:INITIAL_RANKINGS);
 const fresh=await Promise.all(SOURCES.map(scanRanking));
 const boards=fresh.map(b=>{const retained=retainRanking(b,old.boards.find(x=>x.platform===b.platform));return b.platform==='Netflix'&&b.status!=='error'?retainRanking(retained,INITIAL_RANKINGS.boards.find(x=>x.platform===b.platform)):retained;});
 const local=await store.get('iq-taiwan-local.json',{type:'json',consistency:'strong'});
 const iqItems=local?.items||old.boards.find(x=>x.platform==='iQIYI')?.items||[];
 const castItems=await enrichIqCast(iqItems);
 await store.setJSON('iq-cast.json',{updated_at:new Date().toISOString(),items:Object.fromEntries(castItems.filter(x=>x.cast?.length||x.ai_generated).map(x=>[x.url,{title:x.title,cast:x.cast,cast_evidence:x.cast_evidence,ai_generated:x.ai_generated,ai_evidence:x.ai_evidence}]))});
 await store.setJSON('rankings.json',{schema_version:7,updated_at:new Date().toISOString(),boards});
};
export const config={background:true,path:'/.netlify/functions/refresh-background'};
