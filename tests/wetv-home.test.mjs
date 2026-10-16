import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWetvHot} from '../netlify/functions/_shared/wetv-home.mjs';
const card=(rank,title)=>'<div class="hot-card"><span class="ranking">'+rank+'</span><a href="/zh-tw/play/'+rank+'" title="'+title+'"><img alt="'+title+'"></a></div>';
test('WeTV Hot only reads explicit ranks and preserves source ordering',()=>{
 const html='<h2>WeTV Hot</h2>'+card(1,'蘭香如故')+card(2,'美人餘')+card(3,'心動的信號 第9季')+'<h2>熱門劇集</h2>'+card(4,'其他片單');
 const items=parseWetvHot(html);
 assert.deepEqual(items.map(x=>x.title),['蘭香如故','美人餘','心動的信號 第9季']);
 assert.deepEqual(items.map(x=>x.rank),[1,2,3]);
});
test('no guesswork from unnumbered cards or detail recommendations',()=>{
 assert.deepEqual(parseWetvHot('<h2>WeTV Hot</h2><a href="/zh-tw/play/1" title="無排名"></a>'),[]);
 assert.deepEqual(parseWetvHot('<h2>熱門劇集</h2>'+card(1,'不是熱門榜')),[]);
});
