import test from 'node:test';import assert from 'node:assert/strict';import {parseEltaCategories,parseDisneyEditorial} from '../netlify/functions/_shared/regions.mjs';import {withVerifiedRegions,VERIFIED_REGIONS} from '../netlify/functions/_shared/verified-regions.mjs';
test('ELTA joins each current title and URL to its own explicit catalogue category, never neighbouring plot',()=>{
 const a={title:'目前戲',url:'https://eltaott.tv/drama/play/2/123',category:'戲劇'},b={title:'別部戲',url:'https://eltaott.tv/drama/play/2/456',category:'戲劇'},sport={title:'球賽',url:'https://eltaott.tv/sports/play/1/77',category:'運動'};
 const html='<a data-cat="21">陸劇</a><a data-cat="18">韓劇</a><div class="areaDiv cat_div cat_21"><a href="/drama/play/2/123">目前戲</a><p>改編韓劇故事</p></div><div class="areaDiv cat_div cat_18"><a href="/drama/play/2/456">別部戲</a></div>';
 const out=parseEltaCategories(html,[a,b,sport]);assert.equal(out[0].category,'陸劇');assert.equal(out[1].category,'韓劇');assert.equal(out[2],sport);assert.equal(parseEltaCategories(html,[{...a,title:'同網址錯片名'}])[0].category,'戲劇');
});
test('Disney editorial must join exact title and entity ID, independently of URL language',()=>{
 const entry={title:'目前戲',url:'https://www.disneyplus.com/zh-tw/browse/entity-abc'},url='https://www.disney.com.tw/disneyplus_latestlist';const card={short_desc:'韓劇推薦 : 目前戲',cta_links:{primary_button:{href:'https://www.disneyplus.com/zh-hant/browse/entity-abc'}}};const html=o=>'this.Grill?Grill.burger='+JSON.stringify({modules:[o]})+':null;';
 assert.equal(parseDisneyEditorial(html(card),entry,url).category,'韓劇');assert.equal(parseDisneyEditorial(html({...card,short_desc:'韓劇推薦 : 他劇'}),entry,url).category,undefined);assert.equal(parseDisneyEditorial(html(card),{...entry,url:entry.url+'-wrong'},url).category,undefined);
});
test('Disney Chinese editorial headings do not borrow neighbouring genres',()=>{
 const url='https://www.disney.com.tw/disneyplus-articles/chinese-drama',entry={title:'百花殺',url:'https://www.disneyplus.com/zh-tw/browse/entity-abc'};
 assert.equal(parseDisneyEditorial('<h3>2026 陸劇推薦TOP 1《百花殺》</h3>',entry,url).category,'陸劇');assert.equal(parseDisneyEditorial('<h3>2026 陸劇推薦TOP 1《他劇》</h3><h3>《百花殺》</h3>',entry,url).category,undefined);
});
test('verified region fallback requires matching platform, title, URL and generic source category',()=>{
 assert.equal(VERIFIED_REGIONS.length,11);const v=VERIFIED_REGIONS[0],make=x=>({boards:[{platform:v.platform,items:[x]}]}),x={title:v.title,url:v.url,category:'影集'};
 assert.equal(withVerifiedRegions(make(x)).boards[0].items[0].category,v.category);assert.equal(withVerifiedRegions(make({...x,title:'同名不同作品'})).boards[0].items[0].category,'影集');assert.equal(withVerifiedRegions(make({...x,category:'台劇'})).boards[0].items[0].category,'台劇');
});
import {parsePlatformMetadata} from '../netlify/functions/_shared/rankings.mjs';
test('Disney co-production comes from explicit work label, never a story location',()=>{
 const entry={title:'目前戲',url:'https://www.disneyplus.com/zh-tw/browse/entity-abc'},page=summary=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{stitchDocument:{mainContent:[{_type:'MediaDetails',title:'目前戲',customFields:[{heading:'類別：',value:'影集'}],genres:['愛情'],summary}]}}}})+'</script>';
 assert.equal(parsePlatformMetadata('Disney+',page('韓國設計師前往日本小島'),entry).category,'影集');assert.equal(parsePlatformMetadata('Disney+',page('一部日韓浪漫喜劇'),entry).category,'日韓劇');
});
