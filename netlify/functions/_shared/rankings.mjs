import {parseAiLabel} from './production-labels.mjs';
export const SOURCES=[
 {platform:'Netflix',url:'https://www.netflix.com/tudum/top10/taiwan/tv',label:'台灣節目 Top 10 週榜',period:'weekly'},
 {platform:'friDay影音',url:'https://video.friday.tw/ranking/1',label:'最多人觀看',period:'unspecified'},
 {platform:'Disney+',url:'https://www.disneyplus.com/zh-tw',label:'台灣本日熱播 Top 10',period:'daily'},
 {platform:'Hami Video',url:'https://hamivideo.hinet.net/index.do',label:'本週人氣榜',period:'weekly'},
 {platform:'MyVideo',url:'https://www.myvideo.net.tw/rank/drama/',label:'本日戲劇榜',period:'daily'},
 {platform:'LINE TV',url:'https://www.linetv.tw/',label:'10 大熱門節目',period:'unspecified'},
 {platform:'iQIYI',url:'https://www.iq.com/ranking?lang=zh_tw',label:'熱播榜',period:'unspecified'},
 {platform:'LiTV',url:'https://www.litv.tv/',label:'首頁戲劇排行',period:'unspecified'},
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
  items=netflixTitleIds(html,items);
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
  }else if(source.platform==='LiTV'){
  try{
   const raw=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1],data=JSON.parse(raw),board=data.props?.pageProps?.mainContent?.find(x=>x.category_id==='56'&&x.category_name==='戲劇排行'&&x.meta_type==='rank'&&x.content_type==='drama');
   for(const x of (board?.programs||[]).slice(0,10)){
    if(!/^VOD\d+$/.test(x.content_id))continue;
    const path='/drama/watch/'+x.content_id,anchor=[...html.matchAll(/<a\b[^>]*href="([^"<>]+)"[^>]*>([\s\S]*?)<\/a>/g)].find(a=>decode(a[1])===path&&a[2].match(/<div[^>]*>\d+<\/div>/));if(!anchor)continue;
    const rank=anchor[2].match(/<div[^>]*>(\d+)<\/div>/)?.[1];if(!rank)continue;
    const entry=item(source,rank,x.title,path);const country=(x.f_countries||'').split(',').map(c=>({CN:'中國大陸',KR:'韓國',JP:'日本',TW:'台灣',HK:'香港',TH:'泰國'}[c]||c)).join('|');entry.category=categoryLabel(country,'戲劇');entry.category_evidence={url:source.url,text:JSON.stringify({title:x.title,content_id:x.content_id,f_countries:x.f_countries,content_type:x.content_type})};items.push(entry);
   }
  }catch{}
 }else if(source.platform==='愛爾達'){
  const body=section(html,'<h2 class="h2Complicate">熱門排行榜</h2>','<div class="h2Div">');
  for(const m of body.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)){
   const rank=m[2].match(/class="lebleTop\d+">(\d+)</)?.[1],img=m[2].match(/<img\b[^>]*>/)?.[0]||'';
   if(rank){const x=item(source,rank,attr(img,'alt')||clean(m[2].match(/<h3>([\s\S]*?)<\/h3>/)?.[1]),m[1],attr(img,'src'));x.category=/\/sports\//.test(x.url)?'運動':/\/drama\//.test(x.url)?'戲劇':'';if(x.category)x.category_evidence={url:source.url,text:x.url};items.push(x);}
  }
 }else if(source.platform==='iQIYI'){
  let data;try{data=JSON.parse(html);}catch{return {items:[],period_label:'熱播榜'};}
  const locale=data.base?.statistics?.pb_str||'';
  // ntw is the region used by the user's Taiwan official ranking request.
  if(data.code===0&&/(?:^|&)mod=ntw(?:&|$)/.test(locale)&&/(?:^|&)lang=zh_tw(?:&|$)/.test(locale)){
   const card=data.cards?.find(x=>x.card_type==='pcw_rank_list'&&/热播榜|熱播榜|人气热榜/.test(x.name||''));
   for(const x of card?.blocks||[]){const kv=x.kv_pair||{},r=Number(x.statistics?.rank);if(!Number.isInteger(r)||r<0||r>9||!x.title||!kv.loc_suffix_album)continue;
    const entry=item(source,r+1,x.title,'https://www.iq.com/album/'+kv.loc_suffix_album,(x.image?.url||'').replace(/^http:/,'https:'));
    const type={'2':'戲劇','6':'綜藝','1':'電影','4':'動漫'}[kv.channel_id]||'';entry.category=categoryLabel(kv.tags||'',type);if(entry.category)entry.category_evidence={url:source.url,text:JSON.stringify({title:x.title,tags:kv.tags,channel_id:kv.channel_id})};items.push(entry);
   }
  }

 }
 const seen=new Set();items=items.filter(x=>x.rank>=1&&x.rank<=10&&x.title&&/^https:/.test(x.url)&&!seen.has(x.rank)&&seen.add(x.rank)).sort((a,b)=>a.rank-b.rank);
 return {items,period_label};
}
export async function scanRanking(source){const attempted_at=new Date().toISOString();try{const r=await fetch(source.platform==='iQIYI'?iqRequestUrl():source.url,{headers:{'accept-language':'zh-TW,zh;q=0.9','user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('HTTP '+r.status);const parsed=parseRanking(source,await r.text());if(['Hami Video','Netflix','LINE TV','Disney+','friDay影音','MyVideo','LiTV','愛爾達'].includes(source.platform))parsed.items=await enrichMetadata(source.platform,parsed.items);if(source.platform==='iQIYI')return {...source,...parsed,unverified_items:parsed.items,items:[],status:'unavailable',attempted_at,note:'此 API 回應與台灣使用者實際熱播榜不一致，尚未驗證地區／個人化差異；暫不顯示可能錯誤的名次。'};if(!parsed.items.length)throw new Error('官方排行榜區塊未取得可辨識名次。');return {...source,...parsed,status:parsed.items.length===10?'ok':'partial',attempted_at,checked_at:attempted_at,note:parsed.items.length===10?'':`官方可讀榜單取得 ${parsed.items.length} 筆；不補造名次。`};}catch(e){return {...source,status:'error',attempted_at,items:[],note:String(e.message||e)};}}
export function retainRanking(fresh,old){if(fresh.platform==='iQIYI'&&old?.verified_snapshot_id&&['unavailable','error'].includes(fresh.status))return {...old,status:'partial',stale:true,attempted_at:fresh.attempted_at,unverified_items:fresh.unverified_items||old.unverified_items||[],note:'目前顯示 10/15 12:29 核對的台灣官方回應。自動來源仍與台灣官網不同，保留這份榜單；尚未完成自動更新。'};if(fresh.status==='error'&&old?.items?.length&&old.url===fresh.url&&old.label===fresh.label)return {...fresh,items:old.items,checked_at:old.checked_at,period_label:old.period_label,stale:true};if(fresh.platform==='iQIYI'&&old?.user_observed_reference)fresh={...fresh,user_observed_reference:old.user_observed_reference};if(fresh.platform==='Netflix'&&old?.items)fresh={...fresh,items:fresh.items.map(x=>{const previous=old.items.find(y=>y.title_evidence&&((y.title_id&&y.title_id===x.title_id&&y.season_number===x.season_number)||(y.ranking_video_id&&y.ranking_video_id===x.ranking_video_id&&y.season_number===x.season_number)||(fresh.period_label&&fresh.period_label===old.period_label&&x.original_title&&x.original_title===y.original_title)));return x.title_pending&&previous?{...x,title_id:previous.title_id,url:previous.url,title:previous.title,title_pending:false,title_evidence:previous.title_evidence,category:previous.category,category_evidence:previous.category_evidence}:x;})};if(fresh.items?.length&&old?.items&&old.url===fresh.url)fresh={...fresh,items:fresh.items.map(x=>{const previous=old.items.find(y=>y.url===x.url&&y.title===x.title&&y.category_evidence);return !x.category&&previous?{...x,category:previous.category,category_evidence:previous.category_evidence}:x;})};if(fresh.items?.length&&old?.items&&old.url===fresh.url)fresh={...fresh,items:fresh.items.map(x=>{const previous=old.items.find(y=>y.url===x.url&&y.title===x.title&&y.cast?.length&&y.cast_evidence);return !x.cast?.length&&previous?{...x,cast:previous.cast,cast_evidence:previous.cast_evidence}:x;})};if(fresh.items?.length&&old?.items&&old.url===fresh.url)fresh={...fresh,items:fresh.items.map(x=>{const previous=old.items.find(y=>y.url===x.url&&y.title===x.title&&y.ai_generated&&y.ai_evidence);return !x.ai_generated&&previous?{...x,ai_generated:true,ai_evidence:previous.ai_evidence}:x;})};return fresh;}
export function categoryLabel(country,type){
 const matches=[['韓國','韓'],['日本','日'],['中國大陸','陸'],['中國','陸'],['大陸','陸'],['台灣','台'],['臺灣','台'],['香港','港'],['泰國','泰']].filter(([name])=>country.includes(name));
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

export function iqRequestUrl(){
 const params=new URLSearchParams({app_k:'appk_pcw',app_lm:'ntw',app_t:'i18nvideo',app_v:'3.1.5',card_v:'v1',att_id:'null',dev_os:'android',dev_ua:'Mozilla/5.0',lang:'zh_tw',mod:'ntw',net_sts:'1',page_st:'ranking_web',platform_id:'48',psp_cki:'',psp_uid:'',psp_status:'-1',secure_p:'pcw',secure_v:'1',timezone:'GMT+8:00',pg_size:'4',channel_id:'0',customized:'1',pg_num:'1',req_times:'1',qyid:crypto.randomUUID().replaceAll('-',''),req_sn:String(Date.now()),sid:String(Date.now())});
 return 'https://api.iq.com/page/pcw_common?'+params.toString();
}

function netflixTitleIds(html,items){
 try{
  const raw=html.match(/graphql\s*=\s*JSON.parse\('([\s\S]*?)'\);/)?.[1];if(!raw)return items;
  const data=JSON.parse(raw.replace(/\\'/g,"'").replace(/\\\\/g,"\\")),titles=new Map(),parents=new Map();
  const walk=x=>{if(!x||typeof x!=='object')return;if(x.__typename==='Top10PulseVideo'&&x.videoId&&x.title)titles.set(x.title,x);if(x.__typename==='Season'&&x.parentShow?.videoId)parents.set(x.videoId,x.parentShow.videoId);Object.values(x).forEach(walk);};walk(data);
  return items.map(x=>{const t=titles.get(x.title),id=parents.get(t?.videoId)||t?.videoId;return id?{...x,title_id:String(id),ranking_video_id:String(t.videoId),season_number:t.number,url:'https://www.netflix.com/tw/title/'+id}:x;});
 }catch{return items;}
}
export function parsePlatformMetadata(platform,html,entry){const metadata=parseWorkMetadata(platform,html,entry);return {...metadata,...parseAiLabel(html,{...entry,title:metadata.title||entry.title})};}
function parseWorkMetadata(platform,html,entry){
 const url=entry.url;
 if(platform==='Netflix'){
  const title=clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'');
  // The title URL must have the same ID as the official weekly chart.
  if(!entry.title_id||new URL(url).pathname!=='/tw/title/'+entry.title_id||!/[\u3400-\u9fff]/.test(title))return {};
  const genres=clean(html.match(/<h4[^>]*>類型<\/h4>\s*<span[^>]*>([\s\S]*?)<\/span>/)?.[1]||'');
  const type=/動畫|動漫/.test(genres)?'動漫':/實境|綜藝/.test(genres)?'綜藝':/戲劇|電視|劇/.test(genres)?'戲劇':'';
  const properties=clean(html.match(/<h4[^>]*>節目性質[^<]*<\/h4>\s*<span[^>]*>([\s\S]*?)<\/span>/)?.[1]||'');
  const regionTags=properties.split(/[、，,和及]/).map(x=>x.trim()).filter(x=>['中國','中國大陸','台灣','臺灣','韓國','日本','泰國','香港'].includes(x)).join('|');
  const category=categoryLabel(genres+'|'+regionTags,type);
  return {...netflixCast(html,entry),title:title+(entry.season_number>1?'：第'+entry.season_number+'季':''),original_title:entry.title,title_pending:false,title_evidence:{url,text:title},...(category?{category,category_evidence:{url,text:JSON.stringify({genres,regionTags,properties})}}:{})};
 }
 if(platform==='LINE TV'){
  try{
   const raw=html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)?.[1];const state=JSON.parse(raw),id=new URL(url).pathname.match(/\/drama\/(\d+)/)?.[1],d=state.entities?.dramaInfo?.byId?.[id];if(!d||clean(d.drama_name)!==entry.title)return {};
   const genres=(d.genres||[]).map(x=>x.key),channels=(state.channelList?.channelList||[]).filter(x=>d.channelIds?.includes(x.id)).map(x=>x.name);
   const type=channels.includes('短劇')?'短劇':channels.includes('動畫')?'動漫':channels.includes('綜藝')?'綜藝':channels.includes('電影')?'電影':channels.includes('戲劇')?'戲劇':'';
   const category=type==='短劇'?'短劇':categoryLabel(genres.join('|'),type);
   return {...castResult((d.actors||[]).map(x=>x.name),url),...(category?{category,category_evidence:{url,text:JSON.stringify({name:d.drama_name,genres,channels})}}:{})};
  }catch{return {};}
 }
 if(platform==='Disney+'){
  try{
   const raw=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1],data=JSON.parse(raw),parts=data.props?.pageProps?.stitchDocument?.mainContent||[],d=parts.find(x=>x._type==='MediaDetails'&&clean(x.title)===entry.title);if(!d)return {};
   const type=d.customFields?.find(x=>x.heading==='類別：')?.value,genres=d.genres||[];
   const category=genres.includes('動畫')?(type==='電影'?'動畫電影':'動漫'):type==='影集'?'影集':type==='電影'?'電影':'';
   return {...castResult((d.credits?.find(x=>/主演|演員/.test(x.heading||''))?.items||[]).map(x=>x.displayText),url),...(category?{category,category_evidence:{url,text:JSON.stringify({name:d.title,type,genres})}}:{})};
  }catch{return {};}
 }
 return {...parseCategory(html,url),...structuredCast(html,entry)};
}
async function enrichMetadata(platform,items){
 const out=[];for(let i=0;i<items.length;i+=5){out.push(...await Promise.all(items.slice(i,i+5).map(async x=>{
  if(platform==='愛爾達'&&x.category==='運動')return x;
  const fallback=platform==='Netflix'?{...x,original_title:x.title,title_pending:true,title:'中文片名待確認（第'+x.rank+'名）'}:x;
  if(platform==='Netflix'&&!x.title_id)return fallback;
  try{const r=await fetch(x.url,{headers:{'accept-language':'zh-TW,zh;q=0.9','user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});if(r.ok){let entry=x;if(platform==='Netflix'){const final=new URL(r.url);if(final.hostname!=='www.netflix.com'||!/^\/tw\/title\/\d+$/.test(final.pathname))return fallback;if(final.pathname!==new URL(x.url).pathname){if(x.title_id!==x.ranking_video_id)return fallback;entry={...x,url:final.href,title_id:final.pathname.split('/').at(-1),title_redirect_evidence:{requested_url:x.url,resolved_url:final.href}};}}let metadata=parsePlatformMetadata(platform,await r.text(),entry);if(platform==='Netflix'&&(!metadata.title||!metadata.cast?.length)){try{const retry=await fetch(entry.url,{headers:{'accept-language':'zh-TW,zh;q=0.9','user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(12000)});if(retry.ok&&new URL(retry.url).pathname===new URL(entry.url).pathname)metadata={...metadata,...parsePlatformMetadata(platform,await retry.text(),entry)};}catch{}}return {...fallback,...(platform==='Netflix'&&metadata.title?{title_id:entry.title_id,url:entry.url,title_redirect_evidence:entry.title_redirect_evidence}:{}),...metadata};}}catch{}return fallback;
 })));}return out;
}

function actorNames(value){return Array.isArray(value)?value.flatMap(actorNames):typeof value==='string'?[value]:value&&typeof value==='object'?actorNames(value.name):[];}
function castResult(names,url){const cast=[...new Set(actorNames(names).map(clean).filter(n=>n&&n.length<=100))].slice(0,2);return cast.length?{cast,cast_evidence:{url,text:JSON.stringify(cast)}}:{};}
function netflixCast(html,entry){
 for(const m of html.matchAll(/"persons"\s*:\s*\{\s*"actors"\s*:\s*(\[[\s\S]*?\])/g)){
  const ids=[...html.slice(Math.max(0,m.index-1200),m.index).matchAll(/"topLevelVideoId"\s*:\s*(\d+)/g)];
  if(ids.at(-1)?.[1]!==String(entry.title_id))continue;
  try{const result=castResult(JSON.parse(m[1]).map(x=>x.name),entry.url);if(result.cast)return result;}catch{}
 }
 return {};
}
export function structuredCast(html,entry){
 try{
  const raw=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if(raw){const state=JSON.parse(raw),p=state.props?.pageProps?.programInformation;if(p&&p.title===entry.title&&new URL(entry.url).pathname.endsWith('/'+p.content_id)){const out=castResult(p.credits?.find(x=>x.type==='actor')?.list||[],entry.url);if(out.cast)return out;}
   const a=state.props?.initialState?.album?.videoAlbumInfo,id=new URL(entry.url).pathname.match(/-([a-z0-9]+)$/)?.[1];if(a&&id&&a.albumLocSuffix?.split('?')[0].endsWith('-'+id)){const out=castResult(a.actorArr||[],entry.url);if(out.cast)return out;}
  }
 }catch{}
 if(new URL(entry.url).hostname==='video.friday.tw'){
  const title=clean(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');if(title.includes(entry.title)){
   const body=section(html,'group-info_tag','</section>');const block=body.match(/<p[^>]*class="item-title item-director"[^>]*>\s*<span>(?:演員|主演|主持人)<\/span>\s*<\/p>([\s\S]*?)<\/ul>/)?.[1];if(block){const out=castResult([...block.matchAll(/<a\b[^>]*href="\/search\?key=[^>]+>([\s\S]*?)<\/a>/g)].map(x=>clean(x[1])),entry.url);if(out.cast)return out;}
  }
 }

 for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{const d=JSON.parse(m[1]),list=Array.isArray(d)?d:d['@graph']||[d];for(const x of list){if(clean(x.name)!==entry.title)continue;if(x.url&&new URL(x.url,entry.url).pathname!==new URL(entry.url).pathname)continue;const actors=x.actor||x.actors;if(!actors)continue;const out=castResult(actors,entry.url);if(out.cast)return out;}}catch{}
 }
 return {};
}
export async function enrichIqCast(items){return enrichMetadata('iQIYI',items);}
