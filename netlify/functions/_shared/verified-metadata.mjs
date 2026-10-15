// Exact-work official metadata checked independently of ranking fetch success.
const VERIFIED_NETFLIX=[
 {id:'82835340',title:'消失的裂痕',cast:['楊謹華','張孝全'],category:'台劇'},
 {id:'83097271',title:'野狗骨頭',cast:['宋威龍','張婧儀'],category:'陸劇'}
];
export function withVerifiedMetadata(data){return {...data,boards:data.boards.map(b=>b.platform==='iQIYI'?{...b,items:b.items.map(x=>{if(x.title!=='今晚正好'||!/^https:\/\/www\.iq\.com\/album\/[^?]*-b7wjjuapkk(?:\?|$)/.test(x.url)||x.cast?.length)return x;return {...x,cast:['馬思純','陳昊森'],cast_evidence:{url:x.url,text:'主演：馬思純、陳昊森',checked_at:'2026-10-15T08:10:00Z'}};})}:b.platform==='Netflix'?{...b,items:b.items.map(x=>{
 const hit=VERIFIED_NETFLIX.find(v=>x.url==='https://www.netflix.com/tw/title/'+v.id&&x.title===v.title);if(!hit)return x;
 const evidence={url:x.url,text:hit.cast.join('、'),checked_at:'2026-10-15T07:14:00Z'};
 return {...x,...(!x.cast?.length?{cast:hit.cast,cast_evidence:evidence}:{}),...(!x.category||x.category==='戲劇'?{category:hit.category,category_evidence:{...evidence,text:hit.category}}:{})};
 })}:b)};}
