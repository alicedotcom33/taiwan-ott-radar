// Experimental WeTV homepage parser. Only explicit numeric ranks inside WeTV Hot are trusted.
// No ranking is inferred from DOM ordering, recommendations, or programme detail pages.
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const attribute=(tag,key)=>tag.match(new RegExp('\\b'+key+'\\s*=\\s*["\\x27]([^"\\x27]*)["\\x27]','i'))?.[1]||'';
export function parseWetvHot(html,base='https://wetv.vip/zh-tw'){
 const start=html.search(/WeTV\s*Hot/i);
 if(start<0)return [];
 // Limited to the home-page named module, never other carousels or Hot search results.
 const tail=html.slice(start,start+80000);
 const end=tail.slice(8).search(/<h[1-3]\b[^>]*>|(?:熱門劇集|Popular\s+(?:Drama|Series))|data-module=["'](?!wetv-hot)/i);
 const body=end>=0?tail.slice(0,end+8):tail;
 const found=[];
 for(const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
  const tag=m[1],inner=m[2],link=attribute(tag,'href');
  if(!link||!/(?:\/play\/|\/album\/|\/x\/cover\/)/.test(link))continue;
  const before=body.slice(Math.max(0,m.index-450),m.index);
  const match=inner.match(/(?:class=["'][^"']*(?:rank|ranking|number|index)[^"']*["'][^>]*>\s*|aria-label=["'](?:Rank|排名)\s*)(10|[1-9])\b/i)
    ||before.match(/(?:class=["'][^"']*(?:rank|ranking|number|index)[^"']*["'][^>]*>\s*)(10|[1-9])\s*<\/\w+>\s*(?:<[^>]*>\s*){0,3}$/i);
  if(!match)continue;
  const rank=Number(match[1]);const label=attribute(tag,'aria-label')||attribute(tag,'title')||attribute(inner.match(/<img\b[^>]*>/i)?.[0]||'','alt')||clean(inner.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1]||'');
  const title=label.replace(/^\s*(?:排名|Rank)\s*\d+\s*/i,'').trim();
  let url;try{url=new URL(link,base);if(url.protocol!=='https:'||!/(^|\.)wetv\.vip$/.test(url.hostname))continue;}catch{continue;}
  if(!title||found.some(x=>x.rank===rank||x.url===url.href))continue;
  found.push({rank,title,url:url.href});
 }
 return found.sort((a,b)=>a.rank-b.rank).slice(0,10);
}
