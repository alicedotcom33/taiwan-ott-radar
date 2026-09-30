import {getStore} from '@netlify/blobs';
import {mergeReleases,safeRelease} from './_shared/releases.mjs';
import {CURATED,SOCIAL_REVIEW} from './_shared/curated.mjs';
export default async()=>{
  const store=getStore('ott-radar'),data=await store.get('releases.json',{type:'json'})||{updated_at:null,items:[]};
  // Apply the guard on read too: deployment must hide unsafe cached dates even
  // before the next scheduled refresh runs.
  const items=mergeReleases([...CURATED.items,...(data.items||[])]);
  const verified=items.filter(safeRelease).length;
  return Response.json({...data,curated_updated_at:CURATED.reviewed_at,social_review:SOCIAL_REVIEW,stats:{verified,pending:items.length-verified},items},
    {headers:{'cache-control':'no-store'}});
};
export const config={path:'/.netlify/functions/feed'};
