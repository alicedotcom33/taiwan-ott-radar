import {getStore} from '@netlify/blobs';
import {now,range} from './parsers/shared.mjs';
import {SOURCES,scanPlatform} from './parsers/platforms.mjs';
import {PARSER_VERSION,mergeReleases,safeRelease} from './_shared/releases.mjs';
import {CURATED} from './_shared/curated.mjs';

export default async(req)=>{
  let body={};try{body=await req.json();}catch{}
  const query=String(body.query||'這週').trim()||'這週',q=range(query),store=getStore('ott-radar');
  const old=await store.get('releases.json',{type:'json'})||{items:[]};
  // Preserve the original dataset before the first migration. Do not erase
  // previous evidence while withdrawing unsafe dates from the published feed.
  if(old.parser_version!==PARSER_VERSION&&old.items?.length){
    const backupKey='releases-before-'+PARSER_VERSION+'.json';
    if(!await store.get(backupKey,{type:'json'}))await store.setJSON(backupKey,old);
  }
  const fresh=[],diagnostics=[];
  for(const source of SOURCES){
    const started=Date.now();
    try{
      const got=await scanPlatform(source),health=got.health||[];
      fresh.push(...got);
      const errors=health.filter(x=>x.status!=='ok').length;
      diagnostics.push({platform:source.platform,status:errors===health.length?'error':errors?'partial':'ok',
        verified:got.filter(safeRelease).length,pending:got.filter(x=>!safeRelease(x)).length,
        sources:health,duration_ms:Date.now()-started});
    }catch(error){
      diagnostics.push({platform:source.platform,status:'error',verified:0,pending:0,
        duration_ms:Date.now()-started,error:String(error?.message||error)});
    }
  }
  const items=mergeReleases([...CURATED.items,...(old.items||[]),...fresh]);
  const verified=items.filter(safeRelease).length;
  const payload={schema_version:3,parser_version:PARSER_VERSION,updated_at:now(),last_query:query,
    query_range:q,stats:{verified,pending:items.length-verified},diagnostics,
    verification_flow:'single-item evidence; exact-title merge; legacy dates quarantined',items};
  await store.setJSON('releases.json',payload);
  console.log('OTT radar: '+verified+' verified / '+(items.length-verified)+' pending',JSON.stringify(diagnostics));
};
export const config={background:true,path:'/.netlify/functions/refresh-background'};
