export function publicFeed(data){
 const boardFields=['platform','url','label','period','period_label','status','stale','checked_at','attempted_at','received_at','verification_mode','verified_snapshot_id','automatic_updating','note'];
 const pick=(x,keys)=>Object.fromEntries(keys.filter(k=>x[k]!==undefined).map(k=>[k,x[k]]));
 return {schema_version:data.schema_version,updated_at:data.updated_at,boards:data.boards.map(b=>({...pick(b,boardFields),items:b.items.map(x=>pick(x,['rank','title','url','category','cast','ai_generated'])),...(b.platform==='WeTV'?{preview_items:(b.unverified_items||[]).slice(0,10).map(x=>pick(x,['rank','title','url']))}:{})}))};
}

export function withIqCast(data,metadata){if(!metadata?.items)return data;return {...data,boards:data.boards.map(b=>b.platform==='iQIYI'?{...b,items:b.items.map(x=>{const c=metadata.items[x.url];return c?.title===x.title?{...x,...(c.cast?.length?{cast:c.cast.slice(0,2)}:{}),...(c.ai_generated?{ai_generated:true,ai_evidence:c.ai_evidence}:{})}:x;})}:b)};}
