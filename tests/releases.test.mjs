import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePlatform,scanPlatform} from '../netlify/functions/parsers/platforms.mjs';
import {mergeReleases,safeRelease,sanitizeItems} from '../netlify/functions/_shared/releases.mjs';

const friday='https://video.friday.tw/show';
function card(title,date='2026/9/28',kind='綜藝',id='100'){
  return '<a href="/show/detail/'+id+'"><h3>'+title+'</h3><span>'+kind+'</span><span>'+date+'上線</span></a>';
}

test('production regression: a movie on a variety listing is excluded',()=>{
  const html='<a href="/movie/detail/147040">屍變焚場 系列至今最兇殘、駭人的全新篇章 4 / 5</a>'+card('戀愛實境秀');
  const rows=parsePlatform('friDay影音',friday,html);
  assert.equal(rows.length,1);
  assert.equal(rows[0].title,'戀愛實境秀');
  const cached={platform:'friDay影音',title:'屍變焚場 系列至今最兇殘、駭人的全新篇章 4 / 5',
    source_url:'https://video.friday.tw/movie/detail/147040',content_type:'綜藝',
    release_date:'2026-09-28',verification_status:'verified',verification_method:'official_explicit'};
  assert.deepEqual(mergeReleases([cached]),[]);
});

test('neighbouring programme dates and exclusive claims are never borrowed',()=>{
  const html='<a href="/show/detail/101"><h3>甲節目</h3><span>綜藝</span></a>'+card('乙節目')+'全台獨家';
  const rows=parsePlatform('friDay影音',friday,html);
  assert.equal(rows[0].title,'甲節目');
  assert.equal(rows[0].verification_status,'pending');
  assert.equal(rows[0].release_date,null);
  assert.equal(rows[1].release_date,'2026-09-28');
  assert.equal(rows[1].exclusive_status,'unknown');
});

test('Disney article headlines do not borrow a neighbouring article date',()=>{
  const html='<a href="/disneyplus-article/a">Disney+《甲劇》影集</a>'+
    '<a href="/disneyplus-article/b">Disney+《乙劇》影集 2026/9/28上線</a>';
  const rows=parsePlatform('Disney+','https://www.disney.com.tw/disneyplus-articles',html);
  assert.equal(rows[0].release_date,null);
  assert.equal(rows[1].release_date,'2026-09-28');
});

test('new verified rows survive without a pending duplicate',()=>{
  const rows=parsePlatform('friDay影音',friday,card('戀愛實境秀'));
  assert.equal(rows[0].verification_status,'verified');
  assert.equal(safeRelease(rows[0]),true);
  assert.equal(mergeReleases(rows).length,1);
});

test('merge uses exact titles and preserves different dates',()=>{
  const rows=parsePlatform('friDay影音',friday,card('長安','2026/9/28','綜藝','100')+
    card('長安','2026/9/29','綜藝','101'));
  const pending={...rows[0],title:'長安十二時辰',release_date:null,verification_status:'pending'};
  const result=mergeReleases([...rows,pending]);
  assert.equal(result.length,3);
  assert.equal(result.find(x=>x.title==='長安十二時辰').verification_status,'pending');
});

test('legacy verified cache is quarantined on read, with the old date retained for review',()=>{
  const legacy={platform:'friDay影音',title:'甲節目',source_url:'https://video.friday.tw/show/detail/100',
    content_type:'綜藝',release_date:'2026-09-28',verification_status:'verified',
    verification_method:'official_explicit',exclusive_status:'true',exclusive_claim_text:'全台獨家'};
  const [row]=sanitizeItems([legacy]);
  assert.equal(row.verification_status,'pending');
  assert.equal(row.release_date,null);
  assert.equal(row.previous_release_date,'2026-09-28');
  assert.equal(row.exclusive_status,'unknown');
});

test('yearless, impossible, and ambiguous dates stay pending',()=>{
  for(const date of ['9/28','2026/2/30','2026/9/28及2026/9/29']){
    const [row]=parsePlatform('friDay影音',friday,card('甲節目',date));
    assert.equal(row.verification_status,'pending');
    assert.equal(row.release_date,null);
  }
});

test('Netflix accepts HTML whitespace and does not assume every title is a drama',()=>{
  const html='<a href="https://www.netflix.com/title/100"><h3>冬日戀歌</h3><span>影集</span>'+
    '<span>2026/9/28</span><span>在 Netflix 上觀賞</span></a>'+
    '<a href="https://www.netflix.com/title/101">戀愛充電中<span>2026/9/29</span><span>在 Netflix 上觀賞</span></a>';
  const rows=parsePlatform('Netflix','https://about.netflix.com/zh_tw/new-to-watch',html);
  assert.equal(rows[0].release_date,'2026-09-28');
  assert.equal(rows[0].content_type,'戲劇');
  assert.equal(rows[1].verification_status,'pending');
  assert.equal(rows[1].content_type,'');
});

test('multiple titled programmes in one anchor are not treated as one verified item',()=>{
  const html='<a href="/show/detail/100">綜藝《甲節目》與《乙節目》2026/9/28上線</a>';
  assert.deepEqual(parsePlatform('friDay影音',friday,html),[]);
});

test('external links, excluded categories, and navigation never become programmes',()=>{
  const html='<a href="https://video.friday.tw.evil.example/show/detail/100">綜藝《甲節目》2026/9/28上線</a>'+
    '<a href="/show">全部綜藝</a>'+card('甲電影')+
    '<a href="/movie/detail/100">戲劇《假節目》2026/9/28上線</a>';
  assert.deepEqual(parsePlatform('friDay影音',friday,html),[]);
});

test('source failures remain visible in diagnostics',async(t)=>{
  t.mock.method(globalThis,'fetch',async()=>({ok:false,status:403}));
  const rows=await scanPlatform({platform:'friDay影音',urls:[friday]});
  assert.equal(rows.length,0);
  assert.equal(rows.health[0].status,'http_error');
  assert.equal(rows.health[0].http_status,403);
});
