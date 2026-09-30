import {getStore} from '@netlify/blobs';
import {mergeReleases,safeRelease} from './_shared/releases.mjs';
const VERIFIED=[{id:'Netflix-%E9%BB%91%E7%99%BD%E6%B8%85%E9%81%93%E5%A4%AB-2026-09-17',title:'黑白清道夫',platform:'Netflix',content_type:'戲劇',region:'台灣',release_date:'2026-09-17',release_kind:'新劇首播',episode_info:'共10集，一次全集上架',exclusive_status:'true',exclusive_claim_text:'9月17日獨家全集上線Netflix',verification_status:'verified',source_label:'Netflix 官方新聞稿',source_url:'https://about.netflix.com/zh_tw/news/the-fixers-date-announcement-and-teaser-debut',source_published_at:'2026-08-13',fetched_at:'2026-09-16T00:00:00.000Z',review_note:'官方新聞稿明確提供作品類型、上線日期、集數與獨家文字。'}];

function reviewedReleases(){
  return VERIFIED.map(item=>({...item,verification_method:'manual_verified',
    evidence:[{scope:'manual_review',title:item.title,content_type:item.content_type,release_date:item.release_date,
      url:item.source_url,claim_text:item.title+'：'+item.exclusive_claim_text}]}));
}
export default async()=>{
  const store=getStore('ott-radar'),data=await store.get('releases.json',{type:'json'})||{updated_at:null,items:[]};
  // Apply the guard on read too: deployment must hide unsafe cached dates even
  // before the next scheduled refresh runs.
  const items=mergeReleases([...(data.items||[]),...reviewedReleases()]);
  const verified=items.filter(safeRelease).length;
  return Response.json({...data,stats:{verified,pending:items.length-verified},items},
    {headers:{'cache-control':'no-store'}});
};
export const config={path:'/.netlify/functions/feed'};
