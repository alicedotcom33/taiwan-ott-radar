import {withHamiDrama} from './_shared/hami-drama-snapshot.mjs';
import {withVerifiedRegions} from './_shared/verified-regions.mjs';
import {withVerifiedMetadata} from './_shared/verified-metadata.mjs';
import {withKnownAiLabels} from './_shared/production-labels.mjs';
import {publicFeed,withIqCast} from './_shared/public-feed.mjs';
import {withLocalIqBoard} from './_shared/iq-upload.mjs';
import {withVerifiedIqSnapshot} from './_shared/iq-taiwan-snapshot.mjs';
import {getStore} from '@netlify/blobs';
import {INITIAL_RANKINGS} from './_shared/rankings-seed.mjs';
export default async()=>{
 const store=getStore('ott-radar'),[cached,local,casts]=await Promise.all([store.get('rankings.json',{type:'json'}),store.get('iq-taiwan-local.json',{type:'json',consistency:'strong'}),store.get('iq-cast.json',{type:'json'})]);
 return Response.json(publicFeed(withHamiDrama(withVerifiedRegions(withVerifiedMetadata(withKnownAiLabels(withIqCast(withLocalIqBoard(withVerifiedIqSnapshot(cached?.schema_version===7?cached:INITIAL_RANKINGS),local),casts)))))),{headers:{'cache-control':'no-store'}});
};
export const config={path:'/.netlify/functions/feed'};
