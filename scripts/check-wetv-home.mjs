import {parseWetvHot} from '../netlify/functions/_shared/wetv-home.mjs';
const url='https://wetv.vip/zh-tw';
const response=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept-language':'zh-TW,zh;q=0.9'},signal:AbortSignal.timeout(25000)});
const html=await response.text();
const rows=parseWetvHot(html,url);
console.log(JSON.stringify({http:response.status,source:url,bytes:html.length,ranked:rows.map(({rank,title})=>({rank,title})),status:rows.length?'parsed_for_review':'unavailable'},null,2));
if(response.status!==200)process.exitCode=1;
