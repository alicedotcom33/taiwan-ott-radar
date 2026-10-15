import test from 'node:test';import assert from 'node:assert/strict';import {parseAiLabel,knownAiLabel,withKnownAiLabels} from '../netlify/functions/_shared/production-labels.mjs';
const entry={title:'測試作品',url:'https://www.netflix.com/tw/title/123'};
test('AI label requires explicit current-work official metadata, not story or recommendation',()=>{
 const ld=d=>'<script type="application/ld+json">'+JSON.stringify(d)+'</script>';
 assert.equal(parseAiLabel(ld({name:entry.title,url:entry.url,description:'AI劇《測試作品》全新上線'}),entry).ai_generated,true);
 assert.equal(parseAiLabel(ld({name:entry.title,url:entry.url,description:'工程師與 AI 展開冒險'}),entry).ai_generated,undefined);
 assert.equal(parseAiLabel(ld({name:'別的作品',description:'AI劇《測試作品》'}),entry).ai_generated,undefined);
 assert.equal(parseAiLabel(ld({name:entry.title,url:'/tw/title/999',genre:'AI劇'}),entry).ai_generated,undefined);
 assert.equal(parseAiLabel('<h1>測試作品</h1><meta name="description" content="AI劇《測試作品》">',entry).ai_generated,true);
 assert.equal(parseAiLabel('<h1>測試作品</h1><p>推薦：AI劇《測試作品》</p>',entry).ai_generated,undefined);
});
test('verified Culinary Queen label requires exact work and official album ID, survives local uploads',()=>{
 const e={title:'廚娘',url:'https://www.iq.com/album/a-2bc8tk9h1rl?lang=zh_tw'};
 assert.equal(knownAiLabel(e).ai_generated,true);assert.equal(knownAiLabel({...e,title:'御妖廚娘'}).ai_generated,undefined);assert.equal(knownAiLabel({...e,url:'https://evil.example/album/a-2bc8tk9h1rl'}).ai_generated,undefined);
 assert.equal(withKnownAiLabels({boards:[{platform:'iQIYI',items:[e]}]}).boards[0].items[0].ai_generated,true);
});
