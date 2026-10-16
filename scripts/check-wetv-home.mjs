import {parseWetvHot} from '../netlify/functions/_shared/wetv-home.mjs';
const url='https://wetv.vip/zh-tw';
try {
  const resp=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept-language':'zh-TW,zh;q=0.9'},signal:AbortSignal.timeout(25000)});
  const html=await resp.text();
  const list=parseWetvHot(html,url);
  console.log(JSON.stringify({source:url,status:resp.status,html_bytes:html.length,has_hot:/WeTV\\s*Hot/i.test(html),ranked:list.map(({rank,title})=>({rank,title}))},null,2));
} catch(err){console.log('WeTV diagnostic fetch failed:',String(err));}
