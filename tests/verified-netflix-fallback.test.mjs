import test from 'node:test';
import assert from 'node:assert/strict';
import {withVerifiedMetadata} from '../netlify/functions/_shared/verified-metadata.mjs';
import {publicFeed} from '../netlify/functions/_shared/public-feed.mjs';
test('Netflix Taiwanese show season id 83124330 resolves verified Chinese show name',()=>{
 const entry={rank:2,title:'Driving Mom Crazy: Limited Series',original_title:'Driving Mom Crazy: Limited Series',title_id:'83124330',url:'https://www.netflix.com/tw/title/83124330',title_pending:true,english_title:true};
 const feed=withVerifiedMetadata({schema_version:7,boards:[{platform:'Netflix',items:[entry]}]});
 const result=feed.boards[0].items[0];
 assert.equal(result.title,'新手上路');
 assert.equal(result.url,'https://www.netflix.com/tw/title/83124329');
 assert.equal(result.english_title,false);
 assert.equal(result.category,'台劇');
});
test('When only English Netflix name is available, public feed preserves it and labels it',()=>{
 const data={schema_version:7,updated_at:'2026-11-03T02:00:00Z',boards:[{platform:'Netflix',label:'Top 10',items:[{rank:2,title:'English Example Title',original_title:'English Example Title',english_title:true}]}]};
 const result=publicFeed(withVerifiedMetadata(data)).boards[0].items[0];
 assert.equal(result.title,'English Example Title');
 assert.equal(result.english_title,true);
});
