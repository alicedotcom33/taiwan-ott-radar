export const SOURCES=[
 {platform:'Netflix',url:'https://www.netflix.com/tudum/top10/taiwan/tv',label:'台灣節目 Top 10 週榜',period:'weekly'},
 {platform:'friDay影音',url:'https://video.friday.tw/ranking/1',label:'最多人觀看',period:'unspecified'},
 {platform:'Disney+',url:'https://www.disneyplus.com/zh-tw',label:'台灣本日熱播 Top 10',period:'daily'},
 {platform:'Hami Video',url:'https://hamivideo.hinet.net/index.do',label:'本週人氣榜',period:'weekly'},
 {platform:'MyVideo',url:'https://www.myvideo.net.tw/rank/drama/',label:'本日戲劇榜',period:'daily'},
 {platform:'LINE TV',url:'https://www.linetv.tw/',label:'10 大熱門節目',period:'unspecified'},
 {platform:'iQIYI',url:'https://www.iq.com/ranking?lang=zh_tw',label:'熱播榜',period:'unspecified'},
 {platform:'愛爾達',url:'https://eltaott.tv/',label:'熱門排行榜',period:'unspecified'}
];
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(?:39|x27);/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const clean=s=>decode(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const attr=(s,k)=>decode(s.match(new RegExp('\\b'+k+'=["\\\']([^"\\\']*)["\\\']','i'))?.[1]||'');
function section(html,label,end){const p=html.indexOf(label);if(p<0)return '';const tail=html.slice(p);return tail.slice(0,tail.indexOf(end)>0?tail.indexOf(end):tail.length);}
function item(source,rank,title,url,image=''){return {rank:Number(rank),title:clean(title),url:new URL(decode(url),source.url).href,image:decode(image)};}
export function parseRanking(source,html){let items=[],period_label=source.platform==='Hami Video'?'本週（官網標示）':'官方未公布統計週期';
 if(source.platform==='friDay影音'){
  const body=html;
  for(const m of body.matchAll(/<h3[^>]*class="ranking-text"[^>]*>(\d+)<\/h3>([\s\S]*?)(?=<h3[^>]*class="ranking-text"|$)/g)){
   const a=m[2].match(/<a\b[^>]*href="\/(?:drama|show|movie|anime|kids)\/detail\/[^\"]+"[^>]*>/);if(!a)continue;
   const x=item(source,m[1],attr(a[0],'title'),attr(a[0],'href'),attr(m[2].match(/<img\b[^>]*data-src=[^>]+>/)?.[0]||'','data-src'));const note=clean(m[2].match(/<p class="note">([\s\S]*?)<\/p>/)?.[1]||'');x.category=categoryLabel(note,/\/show\//.test(x.url)?'綜藝':/\/drama\//.test(x.url)?'戲劇':/\/movie\//.test(x.url)?'電影':'');if(x.category)x.category_evidence={url:source.url,text:note};items.push(x);
  }
 }else if(source.platform==='Netflix'){
  if(!/Top 10 Shows in Taiwan/.test(html))return {items:[],period_label:'台灣官方週榜'};
  const body=section(html,'data-uia="top10-cards"','</ul>');
  for(const m of body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)){
   const rank=m[1].match(/#top10-num-(\d+)/)?.[1],logo=m[1].match(/data-uia="top10-card-logo"[\s\S]*?<img\b[^>]*>/)?.[0]||'',link=m[1].match(/<a\b[^>]*data-uia="play-on-netflix-link"[^>]*>/)?.[0]||'';
   if(rank&&attr(logo,'alt'))items.push(item(source,rank,attr(logo,'alt'),attr(link,'href')||source.url,m[1].match(/background-image:url\(([^)]+)\)/)?.[1]));
  }
  period_label=html.match(/\d{1,2}\/\d{1,2}\/\d{2} - \d{1,2}\/\d{1,2}\/\d{2}/)?.[0]||'官方週榜';
 }else if(source.platform==='Disney+'){
  const body=section(html,'台灣本日熱播 Top 10','</ul>');
  for(const m of body.matchAll(/<li\b[^>]*data-testid="collection-tile-(\d+)"[^>]*>([\s\S]*?)<\/li>/g)){
   const a=m[2].match(/<a\b[^>]*aria-label=[^>]*>/)?.[0]||'';if(a)items.push(item(source,+m[1]+1,attr(a,'aria-label'),attr(a,'href'),attr(m[2].match(/<img\b[^>]*>/)?.[0]||'','src')));
  }period_label='本日熱播（官網標示）';
 }else if(source.platform==='Hami Video'){
  const body=section(html,'<h2>本週人氣榜</h2>','</section>');
  for(const m of body.matchAll(/<div class="list_item swiper-slide">([\s\S]*?)(?=<div class="list_item swiper-slide">|$)/g)){
   const r=m[1].match(/class="ranking">(\d+)</)?.[1],a=m[1].match(/<a\b[^>]*href=[^>]+>/)?.[0]||'',img=m[1].match(/<img\b[^>]*data-src=[^>]+>/)?.[0]||'';
   if(r&&a)items.push(item(source,r,attr(img,'alt'),attr(a,'href'),attr(img,'data-src')));
  }
 }else if(source.platform==='MyVideo'){
  const body=section(html,'<h2>本日戲劇榜</h2>','</ul>');
  for(const m of body.matchAll(/<li>([\s\S]*?)<\/li>/g)){
   const r=m[1].match(/class="rank">(\d+)</)?.[1],a=m[1].match(/<h3>\s*(<a\b[^>]*>)/)?.[1]||'';
   if(r&&a){const x=item(source,r,attr(a,'title'),attr(a,'href'),m[1].match(/background-image:\s*url\(([^)]+)\)/)?.[1]);const note=clean(m[1].match(/<p>([\s\S]*?)<\/p>/)?.[1]||'');x.category=categoryLabel(note,'戲劇');if(x.category)x.category_evidence={url:source.url,text:note+'；本日戲劇榜'};items.push(x);}
  }period_label=html.match(/\/rank\/drama\/daily-(\d{8})\//)?.[1]||'本日戲劇榜';
 }else if(source.platform==='LINE TV'){
  const raw=html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)?.[1];if(raw){const d=JSON.parse(raw);const board=d.ssrData?.indexData?.find(x=>x.type==='top10'&&x.title==='10 大熱門節目');items=(board?.datas||[]).slice(0,10).map((x,i)=>item(source,i+1,x.name,'/drama/'+x.dramaId+'/eps/1',x.verticalPosterUrl||x.posterUrl));}
 }else if(source.platform==='愛爾達'){
  const body=section(html,'<h2 class="h2Complicate">熱門排行榜</h2>','<div class="h2Div">');
  for(const m of body.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)){
   const rank=m[2].match(/class="lebleTop\d+">(\d+)</)?.[1],img=m[2].match(/<img\b[^>]*>/)?.[0]||'';
   if(rank){const x=item(source,rank,attr(img,'alt')||clean(m[2].match(/<h3>([\s\S]*?)<\/h3>/)?.[1]),m[1],attr(img,'src'));x.category=/\/sports\//.test(x.url)?'運動':/\/drama\//.test(x.url)?'戲劇':'';if(x.category)x.category_evidence={url:source.url,text:x.url};items.push(x);}
  }
 }else if(source.platform==='iQIYI'){
  const raw=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];if(raw){const d=JSON.parse(raw),state=d.props?.initialState,board=state?.commonConfig?.ranking_web;const locale=board?.base?.statistics?.pb_str||'';
   // Never publish a US/global list as Taiwan merely because lang=zh_tw was requested.
   if(/mod=tw(?:&|$)/.test(locale)){const card=board.cards?.find(x=>x.card_type==='pcw_rank_list'&&/热播|熱播/.test(x.name));items=(card?.videos||[]).slice(0,10).map((x,i)=>item(source,i+1,x.title||x.name,x.pageUrl||x.url,x.imageUrl||x.img));}
  }
 }
 const seen=new Set();items=items.filter(x=>x.rank>=1&&x.rank<=10&&x.title&&/^https:/.test(x.url)&&!seen.has(x.rank)&&seen.add(x.rank)).sort((a,b)=>a.rank-b.rank);
 return {items,period_label};
}
export async function scanRanking(source){const attempted_at=new Date().toISOString();try{const r=await fetch(source.url,{headers:{'accept-language':'zh-TW,zh;q=0.9','user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('HTTP '+r.status);const parsed=parseRanking(source,await r.text());if(source.platform==='Hami Video')parsed.items=await enrichHami(parsed.items);if(!parsed.items.length)throw new Error(source.platform==='iQIYI'?'公開頁未提供可核對的台灣排名；未採用其他地區榜單。':'官方排行榜區塊未取得可辨識名次。');return {...source,...parsed,status:parsed.items.length===10?'ok':'partial',attempted_at,checked_at:attempted_at,note:parsed.items.length===10?'':`官方可讀榜單取得 ${parsed.items.length} 筆；不補造名次。`};}catch(e){return {...source,status:'error',attempted_at,items:[],note:String(e.message||e)};}}
export function retainRanking(fresh,old){if(fresh.status==='error'&&old?.items?.length&&old.url===fresh.url&&old.label===fresh.label)return {...fresh,items:old.items,checked_at:old.checked_at,period_label:old.period_label,stale:true};return fresh;}
export function categoryLabel(country,type){
 const matches=[['韓國','韓'],['日本','日'],['中國大陸','陸'],['中國','陸'],['台灣','台'],['臺灣','台'],['香港','港'],['泰國','泰']].filter(([name])=>country.includes(name));
 const regions=[...new Set(matches.map(x=>x[1]))];const prefix=regions.length===1?regions[0]:'';
 if(type==='電影')return prefix?prefix+'片':'電影';
 if(type==='動漫')return '動漫';
 if(type==='綜藝')return prefix?prefix+'綜':'綜藝';
 if(type==='戲劇')return prefix?prefix+'劇':'戲劇';
 return '';
}
export function parseCategory(html,url){
 const title=clean(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');
 const explicit=title.match(/(?:線上看|線上觀看)[\s_-]*(韓劇|日劇|陸劇|台劇|港劇|泰劇|韓綜|日綜|陸綜|台綜)/)?.[1];
 if(explicit)return {category:explicit,category_evidence:{url,text:title}};
 // Read origin only from the current work's structured metadata, never story text.
 for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{const data=JSON.parse(m[1]),list=Array.isArray(data)?data:data['@graph']||[data];for(const d of list){if(!d.name||!d.countryOfOrigin||!title.includes(clean(d.name)))continue;if(d.url&&new URL(d.url,url).pathname!==new URL(url).pathname)continue;const country=typeof d.countryOfOrigin==='string'?d.countryOfOrigin:d.countryOfOrigin.name||'';const type=/ - 電影 - /.test(title)||d['@type']==='Movie'?'電影':/ - (?:戲劇|影劇) - /.test(title)?'戲劇':/ - 綜藝 - /.test(title)?'綜藝':'';const category=categoryLabel(country,type);if(category)return {category,category_evidence:{url,text:JSON.stringify({name:d.name,countryOfOrigin:country,type})}};}}catch{}
 }
 return {};
}
async function enrichHami(items){const out=[];for(let i=0;i<items.length;i+=5){out.push(...await Promise.all(items.slice(i,i+5).map(async x=>{try{const r=await fetch(x.url,{signal:AbortSignal.timeout(10000)});if(r.ok)return {...x,...parseCategory(await r.text(),x.url)};}catch{}return x;})));}return out;}
