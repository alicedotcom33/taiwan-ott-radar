export const SOURCES=[
 {platform:'Netflix',url:'https://www.netflix.com/tw/',label:'台灣首頁現正熱播',period:'unspecified'},
 {platform:'friDay影音',url:'https://video.friday.tw/ranking/1',label:'最多人觀看',period:'unspecified'},
 {platform:'Disney+',url:'https://www.disneyplus.com/zh-tw',label:'台灣本日熱播 Top 10',period:'daily'},
 {platform:'Hami Video',url:'https://hamivideo.hinet.net/index.do',label:'本月最熱門',period:'unspecified'},
 {platform:'MyVideo',url:'https://www.myvideo.net.tw/rank/drama/',label:'本日戲劇榜',period:'daily'},
 {platform:'LINE TV',url:'https://www.linetv.tw/',label:'10 大熱門節目',period:'unspecified'},
 {platform:'iQIYI',url:'https://www.iq.com/?lang=zh_tw',label:'熱播榜',period:'unspecified'}
];
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(?:39|x27);/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const clean=s=>decode(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const attr=(s,k)=>decode(s.match(new RegExp('\\b'+k+'=["\\\']([^"\\\']*)["\\\']','i'))?.[1]||'');
function section(html,label,end){const p=html.indexOf(label);if(p<0)return '';const tail=html.slice(p);return tail.slice(0,tail.indexOf(end)>0?tail.indexOf(end):tail.length);}
function item(source,rank,title,url,image=''){return {rank:Number(rank),title:clean(title),url:new URL(decode(url),source.url).href,image:decode(image)};}
export function parseRanking(source,html){let items=[],period_label=source.platform==='Hami Video'?'本月（官網標示）':'官方未公布統計週期';
 if(source.platform==='friDay影音'){
  const body=html;
  for(const m of body.matchAll(/<h3[^>]*class="ranking-text"[^>]*>(\d+)<\/h3>([\s\S]*?)(?=<h3[^>]*class="ranking-text"|$)/g)){
   const a=m[2].match(/<a\b[^>]*href="\/(?:drama|show|movie|anime|kids)\/detail\/[^\"]+"[^>]*>/);if(!a)continue;
   items.push(item(source,m[1],attr(a[0],'title'),attr(a[0],'href'),attr(m[2].match(/<img\b[^>]*data-src=[^>]+>/)?.[0]||'','data-src')));
  }
 }else if(source.platform==='Netflix'){
  // Require the Taiwan marketing homepage, not a global or weekly Top 10 list.
  if(!/<title>Netflix台灣/.test(html))return {items:[],period_label:'台灣首頁'};
  const body=section(html,'現正熱播</h2>','</ul>');
  for(const m of body.matchAll(/<button\b[^>]*data-uia="top-10-element-(\d+)"[^>]*>([\s\S]*?)<\/button>/g)){
   const title=m[2].match(/<\/span>([^<]+)<\/div>/)?.[1];
   if(title)items.push(item(source,m[1],title,source.url,m[2].match(/background-image:url\(([^)]+)\)/)?.[1]));
  }period_label='官網現正熱播 · 未公布統計區間';
 }else if(source.platform==='Disney+'){
  const body=section(html,'台灣本日熱播 Top 10','</ul>');
  for(const m of body.matchAll(/<li\b[^>]*data-testid="collection-tile-(\d+)"[^>]*>([\s\S]*?)<\/li>/g)){
   const a=m[2].match(/<a\b[^>]*aria-label=[^>]*>/)?.[0]||'';if(a)items.push(item(source,+m[1]+1,attr(a,'aria-label'),attr(a,'href'),attr(m[2].match(/<img\b[^>]*>/)?.[0]||'','src')));
  }period_label='本日熱播（官網標示）';
 }else if(source.platform==='Hami Video'){
  const body=section(html,'<h2>本月最熱門</h2>','</section>');
  for(const m of body.matchAll(/<div class="list_item swiper-slide">([\s\S]*?)(?=<div class="list_item swiper-slide">|$)/g)){
   const r=m[1].match(/class="ranking">(\d+)</)?.[1],a=m[1].match(/<a\b[^>]*href=[^>]+>/)?.[0]||'',img=m[1].match(/<img\b[^>]*data-src=[^>]+>/)?.[0]||'';
   if(r&&a)items.push(item(source,r,attr(img,'alt'),attr(a,'href'),attr(img,'data-src')));
  }
 }else if(source.platform==='MyVideo'){
  const body=section(html,'<h2>本日戲劇榜</h2>','</ul>');
  for(const m of body.matchAll(/<li>([\s\S]*?)<\/li>/g)){
   const r=m[1].match(/class="rank">(\d+)</)?.[1],a=m[1].match(/<h3>\s*(<a\b[^>]*>)/)?.[1]||'';
   if(r&&a)items.push(item(source,r,attr(a,'title'),attr(a,'href'),m[1].match(/background-image:\s*url\(([^)]+)\)/)?.[1]));
  }period_label=html.match(/\/rank\/drama\/daily-(\d{8})\//)?.[1]||'本日戲劇榜';
 }else if(source.platform==='LINE TV'){
  const raw=html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)?.[1];if(raw){const d=JSON.parse(raw);const board=d.ssrData?.indexData?.find(x=>x.type==='top10'&&x.title==='10 大熱門節目');items=(board?.datas||[]).slice(0,10).map((x,i)=>item(source,i+1,x.name,'/drama/'+x.dramaId+'/eps/1',x.verticalPosterUrl||x.posterUrl));}
 }else if(source.platform==='iQIYI'){
  const raw=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];if(raw){const d=JSON.parse(raw),state=d.props?.initialState,board=state?.commonConfig?.home_web||state?.commonConfig?.ranking_web;const locale=board?.base?.statistics?.pb_str||'';
   // Never publish a US/global list as Taiwan merely because lang=zh_tw was requested.
   if(/mod=tw(?:&|$)/.test(locale)){const card=board.cards?.find(x=>x.card_type==='pcw_rank_list'&&/热播|熱播/.test(x.name));items=(card?.videos||[]).slice(0,10).map((x,i)=>item(source,i+1,x.title||x.name,x.pageUrl||x.url,x.imageUrl||x.img));}
  }
 }
 const seen=new Set();items=items.filter(x=>x.rank>=1&&x.rank<=10&&x.title&&/^https:/.test(x.url)&&!seen.has(x.rank)&&seen.add(x.rank)).sort((a,b)=>a.rank-b.rank);
 return {items,period_label};
}
export async function scanRanking(source){const attempted_at=new Date().toISOString();try{const r=await fetch(source.url,{headers:{'accept-language':'zh-TW,zh;q=0.9','user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('HTTP '+r.status);const parsed=parseRanking(source,await r.text());if(!parsed.items.length)throw new Error(source.platform==='iQIYI'?'公開頁未提供可核對的台灣排名；未採用其他地區榜單。':'官方排行榜區塊未取得可辨識名次。');return {...source,...parsed,status:parsed.items.length===10?'ok':'partial',attempted_at,checked_at:attempted_at,note:parsed.items.length===10?'':`官方可讀榜單取得 ${parsed.items.length} 筆；不補造名次。`};}catch(e){return {...source,status:'error',attempted_at,items:[],note:String(e.message||e)};}}
export function retainRanking(fresh,old){if(fresh.status==='error'&&old?.items?.length&&old.url===fresh.url)return {...fresh,items:old.items,checked_at:old.checked_at,period_label:old.period_label,stale:true};return fresh;}
