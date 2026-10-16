import {parseWetvHot} from '../netlify/functions/_shared/wetv-home.mjs';
const url='https://wetv.vip/zh-tw';
try{
 const response=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept-language':'zh-TW,zh;q=0.9'},signal:AbortSignal.timeout(25000)});
 const html=await response.text();
 const patterns=['蘭香如故','美人餘','心動的信號','WeTV Hot','wetv hot','hot_rank','ranking','rank','__NEXT_DATA__','__NUXT__','INITIAL_STATE','__NEXT_DATA__','hot_list','hotlist','hotList','data-reactroot'];
 const matches=Object.fromEntries(patterns.map(p=>{const i=html.toLowerCase().indexOf(p.toLowerCase());return [p,{index:i,near:i>=0?html.slice(Math.max(0,i-160),i+230):null}]}));
 const start=html.indexOf('WeTV Hot');console.log('HOT_SECTION_HTML',html.slice(start,start+11000));
}catch(error){console.log(String(error));}
