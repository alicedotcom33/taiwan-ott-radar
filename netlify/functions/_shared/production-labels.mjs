// Labels require explicit current-work official evidence, never a story mentioning AI.
const OFFICIAL_AI=[{host:'www.iq.com',id:'2bc8tk9h1rl',title:'廚娘',url:'https://www.iq.com/album/廚娘-2026-2bc8tk9h1rl?lang=zh_tw',text:'AI劇《廚娘》',checked_at:'2026-10-15T07:00:00Z'}];
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
export function knownAiLabel(entry){try{const u=new URL(entry.url),hit=OFFICIAL_AI.find(x=>u.hostname===x.host&&u.pathname.endsWith('-'+x.id)&&entry.title===x.title);return hit?{ai_generated:true,ai_evidence:{url:hit.url,text:hit.text,checked_at:hit.checked_at}}:{};}catch{return {};}}
export function parseAiLabel(html,entry){
 const known=knownAiLabel(entry);if(known.ai_generated)return known;
 const title=entry.title?.replace(/：第\d+季$/,'');if(!title)return {};
 const descriptions=[];
 for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{const raw=JSON.parse(m[1]),list=Array.isArray(raw)?raw:raw['@graph']||[raw];for(const d of list){if(clean(d.name)!==title)continue;if(d.url&&new URL(d.url,entry.url).pathname!==new URL(entry.url).pathname)continue;descriptions.push(clean(d.description),(Array.isArray(d.genre)?d.genre:[d.genre]).filter(Boolean).join('、'));}}catch{}
 const heading=clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]);
 if(heading===title)for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const tag=m[0];if(!/(?:name|property)=["'](?:description|og:description)["']/i.test(tag))continue;descriptions.push(clean(tag.match(/content=["']([^"']*)["']/i)?.[1]));}
 const evidence=descriptions.find(s=>s&&(/(?:^|[、,])(?:AI|AIGC)[ -]?(?:短劇|短剧|劇|剧|影集)(?:$|[、,])/.test(s)||s.includes('AI劇《'+title+'》')||s.includes('AI剧《'+title+'》')||/(?:本劇|本剧|本影集).{0,20}(?:AI|AIGC).{0,8}(?:生成|製作|制作)|AI-generated (?:series|drama)/i.test(s)));
 return evidence?{ai_generated:true,ai_evidence:{url:entry.url,text:evidence.slice(0,500)}}:{};
}
export function withKnownAiLabels(data){return {...data,boards:data.boards.map(b=>({...b,items:b.items.map(x=>({...x,...knownAiLabel(x)}))}))};}
