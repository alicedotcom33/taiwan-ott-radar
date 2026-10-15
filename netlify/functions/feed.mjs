import {withLocalIqBoard} from './_shared/iq-upload.mjs';
import {withVerifiedIqSnapshot} from './_shared/iq-taiwan-snapshot.mjs';
import {getStore} from '@netlify/blobs';
import {INITIAL_RANKINGS} from './_shared/rankings-seed.mjs';
export default async()=>{
 const store=getStore('ott-radar'),cached=await store.get('rankings.json',{type:'json'}),local=await store.get('iq-taiwan-local.json',{type:'json',consistency:'strong'});
 return Response.json(withLocalIqBoard(withVerifiedIqSnapshot(cached?.schema_version===7?cached:INITIAL_RANKINGS),local),{headers:{'cache-control':'no-store'}});
};
export const config={path:'/.netlify/functions/feed'};
