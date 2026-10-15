import {getStore} from '@netlify/blobs';
import {INITIAL_RANKINGS} from './_shared/rankings-seed.mjs';
export default async()=>{
 const store=getStore('ott-radar'),cached=await store.get('rankings.json',{type:'json'});
 return Response.json(cached?.schema_version===4?cached:INITIAL_RANKINGS,{headers:{'cache-control':'no-store'}});
};
export const config={path:'/.netlify/functions/feed'};
