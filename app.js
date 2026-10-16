const LOGOS={'iQIYI':'iqiyi.svg','friDay影音':'friday.svg','Netflix':'netflix.svg','Disney+':'disney.png','Hami Video':'hami.svg','MyVideo':'myvideo.svg','LINE TV':'line.svg','LiTV':'litv.svg','愛爾達':'elta-wordmark.png'};
const BRANDS={'iQIYI':['iQ','#21a044'],'friDay影音':['f','#5269af'],'Netflix':['N','#c62b32'],'Disney+':['D+','#334b82'],'Hami Video':['H','#cf813c'],'MyVideo':['my','#479a8e'],'LINE TV':['L','#27a764'],'LiTV':['Li','#8b60a0'],'愛爾達':['E','#4382a3']};
const P=['全部','iQIYI','friDay影音','Netflix','Disney+','Hami Video','MyVideo','LINE TV','LiTV','愛爾達','WeTV'];let selected='全部',data=null;
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'#';}catch{return '#';}};
function time(t){return t?new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t)):'尚未取得';}

const CATEGORY_COLORS={'陸劇':'#429b80','韓劇':'#5486d0','日劇':'#d79f43','台劇':'#d86b79','泰劇':'#9b79c5','港劇':'#6599a3','韓綜':'#58a7ce','台綜':'#e58f74','陸綜':'#65b3a2','動漫':'#ad82bd','動畫電影':'#bf93ad','電影':'#8294ab','陸片':'#788fa1','日片':'#c6a46b','韓片':'#7d9bc2','短劇':'#c9899a','影集':'#818ca0','戲劇':'#9b9fa9','運動':'#539dab','綜藝':'#9d8a68','美劇':'#6c8db7','英劇':'#8c87ac','日韓劇':'#809ec0','未分類':'#b5bbc5'};
function distributionCounts(items){const counts=new Map();for(const x of items){const category=x.category||'未分類';counts.set(category,(counts.get(category)||0)+1);}return [...counts].map(([category,count])=>({category,count})).sort((a,b)=>b.count-a.count||a.category.localeCompare(b.category,'zh-TW'));}
function distribution(items){if(!items.length)return '';const groups=distributionCounts(items),label=groups.map(x=>x.category+' '+x.count+' 部').join('、');return `<section class="distribution" aria-label="本榜類型分布"><div class="dist-heading"><span>本榜類型分布</span><span>${items.length} 部</span></div><div class="dist-track" role="img" aria-label="${E(label)}">${groups.map(x=>`<span style="width:${100*x.count/items.length}%;background:${CATEGORY_COLORS[x.category]||'#c5c9bd'}" title="${E(x.category)} ${x.count} 部"></span>`).join('')}</div><div class="dist-legend">${groups.map(x=>`<span><i style="background:${CATEGORY_COLORS[x.category]||'#c5c9bd'}" aria-hidden="true"></i>${E(x.category)}<b>${x.count}</b></span>`).join('')}</div></section>`;}

function tabs(){$('#platforms').innerHTML=P.map(p=>`<button class="${p===selected?'active':''}" data-p="${E(p)}" aria-pressed="${p===selected}">${E(p)}</button>`).join('');$('#platforms').querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.p;tabs();render();});}

function workKey(x){return x.title.normalize('NFKC').replace(/^(?:【獨家】|\[獨家\])+/,'').replace(/\s+/g,'').toLocaleLowerCase();}
function workType(x){const c=x.category||'';return /動畫電影/.test(c)?'animated-film':/動漫|動畫/.test(c)?'animation':/綜藝|綜$/.test(c)?'variety':/電影|片$/.test(c)?'film':/戲劇|影集|劇$/.test(c)?'series':c;}
function sharedTag(item){const key=workKey(item),kind=workType(item),country=(item.category||'').match(/^[韓日陸台港泰](?=[劇綜片]$)/)?.[0],peers=data.boards.flatMap(b=>{const hit=b.items.find(x=>{const region=(x.category||'').match(/^[韓日陸台港泰](?=[劇綜片]$)/)?.[0];return workKey(x)===key&&workType(x)===kind&&(!country||!region||region===country);});return hit?[{platform:b.platform,rank:hit.rank}]:[];});if(peers.length<2)return '';const details=peers.map(x=>x.platform+' 第 '+x.rank+' 名').join('、');return `<span class="cross-badge" title="${E(details)}" aria-label="同名作品：${E(details)}">↗ 同名登上 ${peers.length} 榜</span>`;}


function reliableBoard(b){return Array.isArray(b.items)&&b.items.length>0&&!b.stale&&b.status!=='error'&&b.automatic_updating!==false&&(!b.checked_at||Date.now()-Date.parse(b.checked_at)<36*3600000);}
function observations(boards){
 const good=boards.filter(reliableBoard),groups=new Map(),notes=[];
 for(const board of good)for(const x of board.items){
  if(!x.title)continue;
  const key=workKey(x)+'|'+workType(x);
  const list=groups.get(key)||[];
  if(!list.some(v=>v.platform===board.platform))list.push({title:x.title,platform:board.platform,rank:x.rank});
  groups.set(key,list);
 }
 const shared=[...groups.values()].filter(x=>x.length>1).sort((a,b)=>b.length-a.length);
 if(shared.length){const t=shared[0];notes.push({label:'跨平台熱播',message:'《'+t[0].title+'》同時登上 '+t.length+' 個平台榜單',hint:t.map(x=>x.platform+' 第'+x.rank+'名').join('、')});}
 const ai=good.flatMap(b=>b.items.filter(x=>x.ai_generated===true).map(x=>({title:x.title,platform:b.platform})));
 if(ai.length){const x=ai[0];notes.push({label:'特殊製作',message:'AI 製作作品《'+x.title+'》登上 '+x.platform+' 榜單',hint:'依官網明確標示的 AI 製作資料'});}
 const d=good.find(b=>b.platform==='Disney+');
 if(d&&d.items.some(x=>workKey(x)===workKey({title:'莓好遇見你'})&&x.category==='日韓劇'))notes.push({label:'跨國合作',message:'日韓合作浪漫劇《莓好遇見你》登上 Disney+ 榜單',hint:'依同一作品已核對的官方類型資料'});
 const tally=new Map();for(const b of good)for(const x of b.items){if(!x.category||['未分類','戲劇','影集'].includes(x.category))continue;tally.set(x.category,(tally.get(x.category)||0)+1);}
 const top=[...tally].sort((a,b)=>b[1]-a[1])[0];
 if(top&&top[1]>=5)notes.push({label:'類型焦點',message:top[0]+'有 '+top[1]+' 部作品登上已核對榜單',hint:'榜單週期各異，不代表全市場統計'});
 return notes.slice(0,3);
}
function renderObservations(boards){
 const section=$('#highlights'),list=$('#highlight-items');if(!section||!list)return;
 const data=observations(boards);section.hidden=!data.length;
 list.innerHTML=data.map(x=>'<div class="highlight-pill" title="'+E(x.hint)+'"><b>'+E(x.label)+'</b><span>'+E(x.message)+'</span></div>').join('');
}

function matches(x){const q=$('#search').value.trim().toLocaleLowerCase(),category=$('#category').value;return (!q||x.title.toLocaleLowerCase().includes(q))&&(!category||(x.category||'未分類')===category);}
function fillCategories(){const previous=$('#category').value,categories=[...new Set(data.boards.flatMap(b=>b.items.map(x=>x.category||'未分類')))].sort((a,b)=>a.localeCompare(b,'zh-TW'));$('#category').innerHTML='<option value="">全部分類</option>'+categories.map(c=>`<option value="${E(c)}">${E(c)}</option>`).join('');$('#category').value=categories.includes(previous)?previous:'';}
function render(){
 if(!data)return;
 const boards=[...data.boards].sort((a,b)=>P.indexOf(a.platform)-P.indexOf(b.platform)),filtered=!!($('#search').value.trim()||$('#category').value),shown=boards.filter(b=>(selected==='全部'||b.platform===selected)&&(!filtered||b.items.some(matches)));
 $('#summary').textContent=filtered?`${shown.length} 個平台 · ${shown.reduce((n,b)=>n+b.items.filter(matches).length,0)} 部符合條件`:`${boards.filter(b=>b.items.length).length} / ${boards.length} 平台有榜單 · ${boards.reduce((n,b)=>n+b.items.length,0)} 部作品`;
 $('#updated').textContent='最後檢查 '+time(data.updated_at);
 renderObservations(boards);
 const warnings=boards.filter(b=>b.stale||b.status==='error'||!b.items.length||b.automatic_updating===false||(b.checked_at&&Date.now()-Date.parse(b.checked_at)>36*3600000));
 $('#freshness').hidden=!warnings.length;$('#freshness').textContent=warnings.length?'更新提醒：'+warnings.map(b=>b.platform).join('、')+' 的資料尚待更新或核對，請查看卡片上的時間與說明。':'';
 $('#content').innerHTML=shown.map(b=>`<article class="board" style="--platform-color:${BRANDS[b.platform]?.[1]||'#245f49'}"><div class="board-windowbar"><span>${E(b.platform)} · top10</span><span aria-hidden="true">— □ ×</span></div><div class="board-head"><div class="board-title"><span class="platform-logo ${b.platform==='Disney+'?'logo-disney':b.platform==='愛爾達'?'logo-elta':''} ${['iQIYI','LiTV','愛爾達','Netflix','MyVideo','Hami Video'].includes(b.platform)?'on-light':''}"><img src="/assets/platforms/${E(LOGOS[b.platform])}" alt="" width="96" height="30"></span><h2 class="sr-only">${E(b.platform)}</h2></div><span class="status ${b.status==='ok'&&!b.stale?'good':''}">${b.verification_mode==='taiwan_local_agent'?(b.stale?'保留台灣榜單':'台灣端已更新'):b.stale?(b.verified_snapshot_id?'保留核對榜單':'保留上次榜單'):b.verified_snapshot_id?'官網回應核對':b.status==='ok'?'已取得':b.items.length?'部分取得':'暫未取得'}</span></div><p class="board-label">${E(b.label)}${b.period_label?' · '+E(b.period_label):''}</p>${distribution(b.items)}${b.platform==='Hami Video'?'<p class="category-note">官方本週人氣榜；每日檢查不代表每日重新排名，榜單可能包含電影。</p>':''}${b.items.some(x=>!x.category||['影集','戲劇'].includes(x.category))?'<p class="category-note">部分作品地區未確認，暫保留一般分類。</p>':''}${b.items.length?`<ol class="ranking">${b.items.filter(matches).map(x=>`<li value="${x.rank}"><span class="rank">${x.rank}</span><div class="work-info"><a href="${E(url(x.url))}" target="_blank" rel="noopener noreferrer">${E(x.title)}</a>${x.cast?.length?`<span class="cast">${E(x.cast.slice(0,2).join('、'))}</span>`:''}${x.ai_generated?'<span class="ai-badge" title="官方明確標示為 AI 製作作品">AI 劇</span>':''}${sharedTag(x)}</div>${x.category?`<span class="category" style="--category-color:${CATEGORY_COLORS[x.category]||'#9b9fa9'}">${E(x.category)}</span>`:''}</li>`).join('')}</ol>`:`<div class="empty">${b.platform==='iQIYI'?'台灣榜單待核對，暫停顯示名次':'暫時無法讀取官方名次'}</div>`}<div class="board-footer"><span>取得 ${E(time(b.checked_at))}</span><a href="${E(url(b.url))}" target="_blank" rel="noopener noreferrer">官方榜單 ↗</a></div>${b.items.length?`<button class="copy-board" type="button" data-copy="${E(b.platform)}">複製完整榜單</button>`:''}${b.verified_snapshot_id?`<p class="footnote">${E(b.note)}</p>`:b.note?`<details><summary>讀取說明</summary><p>${E(b.note)}</p></details>`:''}</article>`).join('')||'<div class="empty no-results">這個範圍沒有符合的作品，試試其他片名或清除篩選。</div>';
 if((selected==='全部'||selected==='WeTV')&&!$('#search').value.trim()&&!$('#category').value){$('#content').insertAdjacentHTML('beforeend','<article class="board wetv-pending" style="--platform-color:#e48b49"><div class="board-windowbar"><span>WeTV · source review</span><span aria-hidden="true">— □ ×</span></div><div class="board-head"><div class="board-title"><h2>WeTV</h2></div><span class="status">來源待驗證</span></div><p class="board-label">繁中站「今日熱播」</p><div class="empty">有公開熱門區，但尚未確認台灣地區專屬名次與資料一致性。暫不顯示名次，也不納入追劇觀察。</div><div class="board-footer"><span>未計入有效平台數</span><a href="https://wetv.vip/zh-tw" target="_blank" rel="noopener noreferrer">官方網站 ↗</a></div></article>');}
 $('#content').querySelectorAll('[data-copy]').forEach(button=>button.onclick=async()=>{const board=data.boards.find(b=>b.platform===button.dataset.copy),text=[board.platform+'｜'+board.label,board.period_label||'',...board.items.map(x=>`${x.rank}. ${x.title}${x.category?'（'+x.category+'）':''}`),'資料取得：'+time(board.checked_at),board.url].filter(Boolean).join('\n');try{await navigator.clipboard.writeText(text);button.textContent='已複製 ✓';}catch{button.textContent='瀏覽器未允許複製，請手動選取榜單';}});
}
async function load(){const b=$('#reload');b.disabled=true;try{const r=await fetch('/.netlify/functions/feed',{cache:'no-store'});if(!r.ok)throw Error();const j=await r.json();if(!Array.isArray(j.boards))throw Error();data=j;fillCategories();render();}catch{$('#summary').textContent='榜單暫時無法讀取，請稍後重新整理。';}finally{b.disabled=false;}}
$('#reload').onclick=load;$('#search').oninput=render;$('#category').onchange=render;$('#clear-filters').onclick=()=>{$('#search').value='';$('#category').value='';render();};tabs();load();
