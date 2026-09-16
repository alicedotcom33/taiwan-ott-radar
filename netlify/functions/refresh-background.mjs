import {getStore} from '@netlify/blobs';
import {now,range,twToday} from './parsers/shared.mjs';
import {SOURCES,scanPlatform} from './parsers/platforms.mjs';

function dedupe(items){const m=new Map();for(const x of items){const k=`${x.platform}|${x.title}|${x.release_date||''}`;const old=m.get(k);if(!old||old.verification_status!=='verified'&&x.verification_status==='verified')m.set(k,x)}return [...m.values()]}
export default async(req)=>{let body={};try{body=await req.json()}catch{}const query=String(body.query||'這週').trim()||'這週',q=range(query),year=+twToday().slice(0,4),store=getStore('ott-radar');const old=await store.get('releases.json',{type:'json'})||{items:[]};const previous=(old.items||[]).filter(x=>x.verification_status==='verified');const fresh=[];for(const source of SOURCES){fresh.push(...await scanPlatform(source,year))}
const items=dedupe([...previous,...fresh]);const verified=items.filter(x=>x.verification_status==='verified'),pending=items.filter(x=>x.verification_status!=='verified');await store.setJSON('releases.json',{updated_at:now(),last_query:query,query_range:q,stats:{verified:verified.length,pending:pending.length},items});console.log(`OTT radar: ${verified.length} verified / ${pending.length} pending`)};
export const config={background:true,path:'/.netlify/functions/refresh-background'};
