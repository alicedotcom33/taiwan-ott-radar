import {text,candidate,allowed} from './shared.mjs';
const H={headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36','accept-language':'zh-TW,zh;q=0.9,en;q=0.8'}};
export const SOURCES=[
 {platform:'Netflix',urls:['https://about.netflix.com/zh_tw/new-to-watch','https://about.netflix.com/zh_tw/newsroom']},
 {platform:'Disney+',urls:['https://www.disney.com.tw/disneyplus-articles']},
 {platform:'iQIYI',urls:['https://www.iq.com/drama?lang=zh_tw','https://www.iq.com/variety-show?lang=zh_tw','https://www.iq.com/newOnline?lang=zh_tw','https://pca.iq.com/?lang=zh_tw']},
 {platform:'friDay影音',urls:['https://video.friday.tw/drama','https://video.friday.tw/show']},
 {platform:'Hami Video',urls:['https://hamivideo.hinet.net/index.do']},
 {platform:'MyVideo',urls:['https://www.myvideo.net.tw/drama/','https://www.myvideo.net.tw/program/']},
 {platform:'LINE TV',urls:['https://www.linetv.tw/channel/1','https://www.linetv.tw/channel/2']}
];
function isoDate(y,m,d){m=+m;d=+d;if(m<1||m>12||d<1||d>31)return null;return`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function explicitRelease(s,year){const n=String(s).replace(/\s+/g,' ');const patterns=[/(?:上線|上架|首播|開播|播出|登場|全集上線|獨家上線|獨家登場|即將上線|新片上線)[^。！？\n]{0,24}?(\d{1,2})[月/.\-](\d{1,2})日?/i,/(\d{1,2})[月/.\-](\d{1,2})日?[^。！？\n]{0,24}?(?:上線|上架|首播|開播|播出|登場|全集上線|獨家上線|獨家登場|即將上線|新片上線)/i];for(const p of patterns){const m=n.match(p);if(m)return isoDate(year,m[1],m[2])}return null}
function netflixCatalogDate(s,year){const n=String(s).replace(/\s+/g,' ');const m=n.match(new RegExp(`${year}[/.\-](\\d{1,2})[/.\-](\\d{1,2})[^。！？]{0,20}(?:在 Netflix 上觀賞|Play on Netflix)`,'i'));return m?isoDate(year,m[1],m[2]):null}
function typeNear(s){if(/綜藝|實境|真人秀|選秀|variety|reality/i.test(s))return'綜藝';if(/影集|戲劇|劇集|陸劇|韓劇|台劇|日劇|美劇|series|drama/i.test(s))return'戲劇';return''}
function titleFromAnchor(a){return text(a).replace(/(?:立即觀看|線上看|播放|更多|詳情|預告|即將上線|新上架|在 Netflix 上觀賞|Play on Netflix)/gi,'').trim()}
function rejectNews(title,around){const s=`${title} ${around}`;return /獲獎|入圍|提名|排行榜|TOP\s*10|收視|觀看時數|記者會|發布會|預告曝光|海報曝光|演員陣容|開鏡|殺青|製作消息|新聞專區/i.test(s)&&!/定檔|上線|上架|首播|開播|播出|登場/i.test(s)}
function parseAnchors(platform,url,html,year){const out=[],re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;while((m=re.exec(html))){const title=titleFromAnchor(m[2]);if(title.length<2||title.length>80)continue;const around=text(html.slice(Math.max(0,m.index-220),Math.min(html.length,re.lastIndex+220)));if(rejectNews(title,around))continue;const type=typeNear(around),date=platform==='Netflix'&&url.includes('/new-to-watch')?(netflixCatalogDate(around,year)||explicitRelease(around,year)):explicitRelease(around,year);if(!allowed(type,title))continue;let href=m[1];try{href=new URL(href,url).href}catch{}if(date&&type){out.push(candidate({platform,title,url:href,date,type,note:'官方作品區塊包含明確上線／上架／首播日期與內容類型。',claimText:around}))}else if(type&&(/即將上線|新片上線|跟播中|現正熱播/i.test(around))){out.push(candidate({platform,title,url:href,type,note:'官方頁面可辨識作品與狀態，但沒有可安全判定的明確上架日期，因此保留待確認。',claimText:around}))}}
return out}
export async function scanPlatform(source,year){const all=[],diagnostics=[];for(const url of source.urls){try{const r=await fetch(url,H),html=await r.text();const parsed=r.ok?parseAnchors(source.platform,url,html,year):[];all.push(...parsed);diagnostics.push(candidate({platform:source.platform,title:`${source.platform} 來源檢查：${new URL(url).pathname||'/'}`,url,note:r.ok?`官方來源 HTTP ${r.status}，取得 ${html.length} 字元，解析 ${parsed.filter(x=>x.verification_status==='verified').length} 筆已驗證、${parsed.filter(x=>x.verification_status!=='verified').length} 筆待確認。`:`官方來源 HTTP ${r.status}，伺服器目前無法直接取得。`}))}catch(e){diagnostics.push(candidate({platform:source.platform,title:`${source.platform} 官方來源抓取失敗`,url,note:String(e?.message||e)}))}}
const seen=new Set();return[...all,...diagnostics].filter(x=>{const k=`${x.platform}|${x.title}|${x.release_date||''}`;if(seen.has(k))return false;seen.add(k);return true})}
