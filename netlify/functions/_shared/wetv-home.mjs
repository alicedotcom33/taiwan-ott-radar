// WeTV Hot: extract only explicitly numbered cards from the homepage's ranking module.
const attr=(text,name)=>text.match(new RegExp('\\b'+name+'\\s*=\\s*["\\x27]([^"\\x27]*)["\\x27]','i'))?.[1]||'';
export function parseWetvHot(html,base='https://wetv.vip/zh-tw'){
 const anchor=html.search(/<h2\b[^>]*>\s*WeTV\s+Hot\s*<\/h2>/i);
 if(anchor<0)return [];
 const section=html.slice(anchor,anchor+45000);
 const rows=[];
 for(const m of section.matchAll(/<a\b([^>]*\bclass=["'][^"']*\brank_module\b[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi)){
  const href=attr(m[1],'href');
  const rank=Number(m[2].match(/class=["']rank-num["'][\s\S]*?<tspan\b[^>]*>\s*(10|[1-9])\s*<\/tspan>/i)?.[1]);
  const name=m[2].match(/class=["'][^"']*\brank_item--title\b[^"']*["'][^>]*\btitle=["']([^"']+)["']/i)?.[1]||attr(m[2].match(/<img\b[^>]*>/i)?.[0]||'','alt');
  if(!Number.isInteger(rank)||rank<1||rank>10||!name||!href)continue;
  let uri;try{uri=new URL(href,base);if(uri.protocol!=='https:'||uri.hostname!=='wetv.vip'||!/^\/zh-tw\/play\//.test(uri.pathname))continue;}catch{continue;}
  if(rows.some(x=>x.rank===rank||x.url===uri.href))continue;
  rows.push({rank,title:name.trim(),url:uri.href});
  if(rows.length===10)break;
 }
 return rows.sort((a,b)=>a.rank-b.rank);
}
