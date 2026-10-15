import {INITIAL_RANKINGS} from './_shared/rankings-seed.mjs';
import {getStore} from '@netlify/blobs';
import {SOURCES,scanRanking,retainRanking} from './_shared/rankings.mjs';
export default async()=>{
 const store=getStore('ott-radar'),old=await store.get('rankings.json',{type:'json'})||INITIAL_RANKINGS;
 const fresh=await Promise.all(SOURCES.map(scanRanking));
 const boards=fresh.map(b=>retainRanking(b,old.boards.find(x=>x.platform===b.platform)));
 await store.setJSON('rankings.json',{schema_version:5,updated_at:new Date().toISOString(),boards});
};
export const config={background:true,path:'/.netlify/functions/refresh-background'};
