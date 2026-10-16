import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWetvHot} from '../netlify/functions/_shared/wetv-home.mjs';
const card=(n,title)=>'<a class="rank_module rank_item'+(n-1)+'" href="/zh-tw/play/id'+n+'"><img alt="'+title+'"><span class="rank-num"><svg><text><tspan style="font-weight:bold">'+n+'</tspan></text></svg></span><span class="rank_item--title nowarp rank-style" title="'+title+'">'+title+'</span></a>';
test('WeTV Hot matches live homepage markup and explicit rank SVG',()=>{
 const html='<h2 class="article_title flex-1">WeTV Hot</h2>'+card(1,'蘭香如故')+card(2,'美人餘')+'<h2>熱門劇集</h2><a href="/zh-tw/play/other">推薦</a>';
 assert.deepEqual(parseWetvHot(html).map(x=>[x.rank,x.title]),[[1,'蘭香如故'],[2,'美人餘']]);
});
test('WeTV does not infer card order or ingest unrelated sections',()=>{
 assert.deepEqual(parseWetvHot('<h2>WeTV Hot</h2><a class="rank_module rank_item0" href="/zh-tw/play/a"><img alt="無編號"></a>'),[]);
 assert.deepEqual(parseWetvHot(card(1,'無榜標題')),[]);
});
