import test from 'node:test';
import assert from 'node:assert/strict';
import {VERIFIED_IQ_SNAPSHOT,withVerifiedIqSnapshot} from '../netlify/functions/_shared/iq-taiwan-snapshot.mjs';
import {withLocalIqBoard} from '../netlify/functions/_shared/iq-upload.mjs';
test('reviewed Taiwan homepage has 10 unique ranked works in screenshot order',()=>{
 const expected=['魅影神捕','一甌春','我不是大師','廚娘','蒸蒸日上','問心2','錦心似玉','街頭世界戰士：表演導演之戰','歸路','RUNNING MAN'];
 const items=VERIFIED_IQ_SNAPSHOT.items;
 assert.deepEqual(items.map(x=>x.title),expected);
 assert.deepEqual(items.map(x=>x.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(new Set(items.map(x=>x.url)).size,10);
});
test('old automated upload cannot silently overwrite the verified screenshot',()=>{
 const seed={schema_version:7,updated_at:'2026-10-15T00:00:00Z',boards:[{platform:'iQIYI',items:[]}]};
 const protectedData=withVerifiedIqSnapshot(seed);
 const local={platform:'iQIYI',verification_mode:'taiwan_local_agent',checked_at:new Date().toISOString(),items:Array.from({length:10},(_,i)=>({rank:i+1,title:'不同的榜單'}))};
 assert.equal(withLocalIqBoard(protectedData,local).boards[0].items[4].title,'蒸蒸日上');
});
