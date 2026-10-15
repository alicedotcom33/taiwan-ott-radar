const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const entity=url=>{try{const u=new URL(url);return u.hostname==='www.disneyplus.com'?u.pathname.match(/\/browse\/(entity-[\w-]+)$/)?.[1]:null;}catch{return null;}};
export function parseEltaCategories(html,items,url='https://eltaott.tv/drama/'){
 const labels=new Map([...html.matchAll(/<a\b[^>]*data-cat=["'](\d+)["'][^>]*>([\s\S]*?)<\/a>/g)].map(m=>[m[1],clean(m[2])]));
 const cards=html.split(/(?=<div\b[^>]*class="[^"]*\bcat_div\b)/);
 return items.map(x=>{if(!/\/drama\/play\//.test(x.url))return x;for(const card of cards){const id=card.match(/\bcat_(\d+)\b/)?.[1],category=labels.get(id);if(!['陸劇','韓劇','日劇','台劇','泰劇','港劇'].includes(category))continue;
  if([...card.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)].some(m=>{try{return new URL(m[1],url).href===x.url&&clean(m[2])===x.title;}catch{return false;}}))return {...x,category,category_evidence:{url,text:category+'｜'+x.title,work_url:x.url}};
 }return x;});
}
function burgerData(html){const match=/(?:Grill\.burger)\s*=\s*/.exec(html);if(!match)return null;const start=match.index+match[0].length;if(html[start]!=='{')return null;let depth=0,string=false,escaped=false;for(let i=start;i<html.length;i++){const c=html[i];if(string){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')string=false;}else if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return JSON.parse(html.slice(start,i+1));}return null;}
export function parseDisneyEditorial(html,entry,url){
 const id=entity(entry.url);if(!id)return {};
 const base=s=>clean(s).replace(/\s*[：:]?\s*第\s*\d+\s*季$/,'');
 let found=null;const walk=o=>{if(!o||typeof o!=='object'||found)return;if(o.short_desc){const text=clean(o.short_desc),m=text.match(/^(?:熱播)?(陸劇|韓劇|日劇|台劇|美劇|英劇)(?:推薦)?\s*[:：]\s*(.+)$/);if(m&&base(m[2])===base(entry.title)){let same=false;const links=x=>{if(!x||typeof x!=='object')return;if(typeof x.href==='string'&&entity(x.href)===id)same=true;Object.values(x).forEach(links);};links(o);if(same)found={category:m[1],category_evidence:{url,text,work_url:entry.url}};}}Object.values(o).forEach(walk);};
 try{walk(burgerData(html));}catch{}
 if(found)return found;
 // Explicit same-work headings in the official Chinese-drama editorial, not adjacent text.
 if(url==='https://www.disney.com.tw/disneyplus-articles/chinese-drama')for(const m of html.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g)){const text=clean(m[1]);if(text.includes('《'+entry.title+'》')&&/陸劇推薦/.test(text))return {category:'陸劇',category_evidence:{url,text,work_url:entry.url}};}
 return {};
}
export const DISNEY_EDITORIALS=['https://www.disney.com.tw/disneyplus_latestlist','https://www.disney.com.tw/disneyplus-korean-dramas','https://www.disney.com.tw/disneyplus-american-tv-series','https://www.disney.com.tw/disneyplus-articles/chinese-drama'];
async function read(url){try{const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept-language':'zh-TW,zh;q=0.9'},signal:AbortSignal.timeout(15000)});return r.ok?await r.text():'';}catch{return '';}}
export async function enrichEltaCategories(items){const html=await read('https://eltaott.tv/drama/');return html?parseEltaCategories(html,items):items;}
export async function enrichDisneyCategories(items){const pages=await Promise.all(DISNEY_EDITORIALS.map(async url=>({url,html:await read(url)})));return items.map(x=>{if(x.category==='日韓劇'||!['影集','戲劇','陸劇','韓劇','日劇','台劇','美劇','英劇'].includes(x.category))return x;for(const p of pages){const metadata=parseDisneyEditorial(p.html,x,p.url);if(metadata.category)return {...x,...metadata};}return x;});}
