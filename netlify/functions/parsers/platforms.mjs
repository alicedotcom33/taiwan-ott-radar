import {text,candidate,allowed} from './shared.mjs';
const H={headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36','accept-language':'zh-TW,zh;q=0.9,en;q=0.8'}};
export const SOURCES=[
 {platform:'Netflix',urls:['https://about.netflix.com/zh_tw/new-to-watch','https://about.netflix.com/zh_tw/newsroom']},
 {platform:'Disney+',urls:['https://www.disney.com.tw/disneyplus-articles']},
 {platform:'iQIYI',urls:['https://www.iq.com/drama?lang=zh_tw','https://www.iq.com/variety-show?lang=zh_tw','https://www.iq.com/newOnline?lang=zh_tw']},
 {platform:'friDay影音',urls:['https://video.friday.tw/']},
 {platform:'Hami Video',urls:['https://hamivideo.hinet.net/index.do']},
 {platform:'MyVideo',urls:['https://www.myvideo.net.tw/drama/','https://www.myvideo.net.tw/program/']},
 {platform:'LINE TV',urls:['https://www.linetv.tw/channel/1','https://www.linetv.tw/channel/2']}
];
function dateNear(s,year){let m=s.match(new RegExp(`(?:${year}[年/.\\-])?(\\d{1,2})[月/.\\-](\\d{1,2})日?`));return m?`${year}-${String(+m[1]).padStart(2,'0')}-${String(+m[2]).padStart(2,'0')}`:null}
function typeNear(s){if(/綜藝|實境|真人秀|選秀|variety|reality/i.test(s))return'綜藝';if(/影集|戲劇|劇集|陸劇|韓劇|台劇|日劇|美劇|series|drama/i.test(s))return'戲劇';return''}
function titleFromAnchor(a){return text(a).replace(/(?:立即觀看|線上看|播放|更多|詳情|預告|即將上線|新上架)/g,'').trim()}
function parseAnchors(platform,url,html,year){const out=[],re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;while((m=re.exec(html))){const title=titleFromAnchor(m[2]);if(title.length<2||title.length>70)continue;const around=text(html.slice(Math.max(0,m.index-350),Math.min(html.length,re.lastIndex+350))),type=typeNear(around),date=dateNear(around,year);if(!allowed(type,title))continue;if(!(type||date))continue;let href=m[1];try{href=new URL(href,url).href}catch{}out.push(candidate({platform,title,url:href,date,type,note:date&&type?'官方頁面同一作品區塊可辨識類型與日期。':'官方頁面找到作品，但日期或類型證據不足，保留待確認。',claimText:around}))}return out}
export async function scanPlatform(source,year){const all=[],diagnostics=[];for(const url of source.urls){try{const r=await fetch(url,H),html=await r.text();if(r.ok){all.push(...parseAnchors(source.platform,url,html,year));if(!all.length)diagnostics.push(candidate({platform:source.platform,title:`${source.platform} 官方來源待解析`,url,note:`官方來源 HTTP ${r.status}，取得 ${html.length} 字元，但未找到同時具備足夠作品證據的項目。`}))}else diagnostics.push(candidate({platform:source.platform,title:`${source.platform} 官方來源 HTTP ${r.status}`,url,note:'此官方來源目前無法由伺服器直接取得，保留待確認並由其他官方來源補充。'}))}catch(e){diagnostics.push(candidate({platform:source.platform,title:`${source.platform} 官方來源抓取失敗`,url,note:String(e?.message||e)}))}}
 const seen=new Set();const items=[...all,...diagnostics].filter(x=>{const k=`${x.platform}|${x.title}|${x.release_date||''}`;if(seen.has(k))return false;seen.add(k);return true});return items}
