import {text,candidate,allowed} from './shared.mjs';
import {PARSER_VERSION,officialUrl,excludedUrl,plausibleTitle,validDate} from '../_shared/releases.mjs';
const H={headers:{'user-agent':'Mozilla/5.0','accept-language':'zh-TW,zh;q=0.9,en;q=0.8'}};
export const SOURCES=[
 {platform:'Netflix',urls:['https://about.netflix.com/zh_tw/new-to-watch','https://about.netflix.com/zh_tw/newsroom']},
 {platform:'Disney+',urls:['https://www.disney.com.tw/disneyplus-articles']},
 {platform:'iQIYI',urls:['https://www.iq.com/?lang=zh_tw','https://pca.iq.com/?lang=zh_tw','https://www.iq.com/ranking?lang=zh_tw','https://www.iq.com/newOnline?lang=zh_tw','https://www.iq.com/drama?lang=zh_tw','https://www.iq.com/variety-show?lang=zh_tw']},
 {platform:'friDay影音',urls:['https://video.friday.tw/drama','https://video.friday.tw/show']},
 {platform:'Hami Video',urls:['https://hamivideo.hinet.net/index.do']},
 {platform:'MyVideo',urls:['https://www.myvideo.net.tw/drama/','https://www.myvideo.net.tw/program/']},
 {platform:'LINE TV',urls:['https://www.linetv.tw/channel/1','https://www.linetv.tw/channel/2']}
];

function dateInItem(value) {
  // An unqualified month/day does not establish a year; do not invent one.
  const matches = [...value.matchAll(/(20\d{2})[年/.\-](\d{1,2})[月/.\-](\d{1,2})日?/g)];
  const dates = [...new Set(matches.map(m => m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0')))];
  if (dates.length !== 1 || !validDate(dates[0])) return null;
  return /(?:上線|上架|首播|開播|播出|登場|定檔|在 Netflix 上觀賞|Play on Netflix)/i.test(value) ? dates[0] : null;
}

function typeInItem(value) {
  const variety = /綜藝|實境|真人秀|選秀|\bvariety\b|\breality\b/i.test(value);
  const drama = /影集|戲劇|劇集|陸劇|韓劇|台劇|日劇|美劇|電視劇|\bseries\b|\bdrama\b/i.test(value);
  return variety === drama ? '' : variety ? '綜藝' : '戲劇';
}

function titleInItem(inner,platform) {
  const value = text(inner);
  const quoted = [...value.matchAll(/[《〈「『]([^》〉」』]{2,80})[》〉」』]/g)];
  if (new Set(quoted.map(m=>m[1])).size > 1) return '';
  if (quoted.length) return quoted[0][1].trim();
  const image = inner.match(/<img\b[^>]*alt=["']([^"']+)["']/i);
  if (image?.[1]) return text(image[1]).trim();
  const heading = inner.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
  if (heading) return text(heading[1]).trim();
  if (platform === 'Netflix') {
    const date = value.search(/20\d{2}[年/.\-]\d{1,2}[月/.\-]\d{1,2}/);
    if (date >= 0) return value.slice(0,date).trim();
  }
  // Simple anchor labels only; promotional card text must not become a title.
  return value.length <= 40 && !/上線|上架|首播|開播|播出|登場|定檔|新上架|現正熱播|跟播中|\d+\s*\/\s*\d+/.test(value) ? value : '';
}

function contentUrl(platform,url) {
  if (!officialUrl(platform,url) || excludedUrl(url)) return false;
  const path = new URL(url).pathname;
  if (platform === 'Netflix') return /\/(?:title\/\d+|news\/[^/]+)\/?$/i.test(path);
  if (platform === 'Disney+') return /article/i.test(path) && !/disneyplus-articles\/?$/.test(path);
  if (platform === 'iQIYI') return /\/(?:play|album)\//i.test(path);
  if (platform === 'friDay影音') return /\/(?:drama|show)\/detail\/\d+\/?$/i.test(path);
  if (platform === 'Hami Video') return /product|detail|content|video/i.test(path);
  if (platform === 'MyVideo') return /\/(?:details?|play|video|content)\//i.test(path);
  return /\/(?:drama|show|video|play)\//i.test(path);
}

export function parsePlatform(platform,url,html) {
  const out=[],re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html))) {
    let href;try { href=new URL(match[1].replace(/&amp;/g,'&'),url).href; } catch { continue; }
    if (!contentUrl(platform,href)) continue;
    // Only this anchor supplies evidence; neighbouring cards cannot supply dates,
    // categories, or exclusivity claims for this item.
    const title=titleInItem(match[2],platform);
    if (!plausibleTitle(title)) continue;
    const local=text(match[2]);
    if (!allowed('',local)) continue;
    const type=typeInItem(local.replace(title,'')),date=dateInItem(local);
    const verified=Boolean(date&&type);
    const item=candidate({platform,title,url:href,date:verified?date:null,type,
      verified,verificationMethod:verified?'official_single_item':'pending',
      claimText:verified?local:'',
      note:verified?'同一節目連結內明列片名、類型與完整上線日期。':'已辨識官方節目連結，尚缺同一節目的類型或完整上線日期證據。'});
    item.parser_version=PARSER_VERSION;
    item.evidence=[{scope:'single_item',parser_version:PARSER_VERSION,url:href,title,
      content_type:type,release_date:verified?date:null,claim_text:local}];
    out.push(item);
  }
  return out;
}

export async function scanPlatform(source) {
  const all=[],health=[];
  for(const url of source.urls){
    try{
      const response=await fetch(url,{...H,signal:AbortSignal.timeout(15000)});
      if(!response.ok){health.push({url,status:'http_error',http_status:response.status});continue;}
      const html=await response.text(),items=parsePlatform(source.platform,url,html);
      all.push(...items);health.push({url,status:'ok',parsed:items.length});
    }catch(error){health.push({url,status:'error',error:String(error?.message||error)});}
  }
  const seen=new Set(),items=all.filter(item=>{
    const key=JSON.stringify([item.platform,item.title,item.release_date]);
    if(seen.has(key))return false;seen.add(key);return true;
  });
  items.health=health;
  return items;
}
