import {allowed} from '../parsers/shared.mjs';

export const PARSER_VERSION = 'single-item-v1';
const HOSTS = {
  Netflix: ['about.netflix.com', 'www.netflix.com'],
  'Disney+': ['www.disney.com.tw'],
  iQIYI: ['www.iq.com', 'pca.iq.com'],
  'friDay影音': ['video.friday.tw'],
  'Hami Video': ['hamivideo.hinet.net'],
  MyVideo: ['www.myvideo.net.tw'],
  'LINE TV': ['www.linetv.tw'],
};
export const SOCIAL_PAGES = {
  Netflix: 'netflixtw', 'Disney+': 'DisneyPlusTW', iQIYI: 'twiqiyi',
  'friDay影音': 'FETVOD', 'Hami Video': 'CHTHamiVideo', MyVideo: 'MyvideoTWM', 'LINE TV': 'LINETV.taiwan',
};

export function normalizeTitle(value = '') {
  return String(value).toLowerCase().replace(/[《》〈〉「」『』【】\s:：·・\-—_.,，。!?！？'"()（）]/g, '');
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function officialUrl(platform, value) {
  try {
    const url = new URL(value);
    if(url.protocol !== 'https:' || url.username || url.password) return false;
    if(HOSTS[platform]?.includes(url.hostname)) return true;
    const parts=url.pathname.split('/').filter(Boolean);
    return url.hostname==='www.facebook.com' && parts.length===3 &&
      parts[0].toLowerCase()===SOCIAL_PAGES[platform]?.toLowerCase() && parts[1]==='posts' &&
      /^(?:pfbid[A-Za-z0-9]+|\d+)$/.test(parts[2]);
  } catch { return false; }
}

export function excludedUrl(value = '') {
  try {
    return /\/(?:movies?|films?|animation|anime|documentary|shorts?|sports?)(?:\/|$)/i.test(new URL(value).pathname);
  } catch { return true; }
}

export function plausibleTitle(value = '') {
  const title = String(value).trim();
  return title.length >= 2 && title.length <= 80 &&
    !/^(?:首頁|更多|最新|熱門|登入|註冊|會員|搜尋|立即觀看|線上看|播放|節目表|關於我們|官方來源|全部|新上架|即將上線)/.test(title) &&
    !/\d+\s*\/\s*\d+\s*$/.test(title) && allowed('', title);
}

export function safeRelease(item) {
  if (item.verification_status !== 'verified' || !plausibleTitle(item.title) ||
      !['戲劇', '綜藝'].includes(item.content_type) || !validDate(item.release_date) ||
      !officialUrl(item.platform, item.source_url) || excludedUrl(item.source_url)) return false;
  if(new URL(item.source_url).hostname==='www.facebook.com' && item.verification_method!=='manual_verified') return false;
  const scopes = item.verification_method === 'manual_verified' ? ['manual_review'] : ['single_item'];
  return Array.isArray(item.evidence) && item.evidence.some(e =>
    scopes.includes(e.scope) && (e.scope === 'manual_review' || e.parser_version === PARSER_VERSION) &&
    normalizeTitle(e.title) === normalizeTitle(item.title) && e.release_date === item.release_date &&
    e.content_type === item.content_type && e.url === item.source_url &&
    String(e.claim_text || '').includes(item.title));
}

export function sanitizeItems(items = []) {
  return items.filter(item => plausibleTitle(item.title) &&
    officialUrl(item.platform, item.source_url) && !excludedUrl(item.source_url)).map(item => {
    if (safeRelease(item)) return item;
    return {...item, previous_release_date: item.previous_release_date || item.release_date || null,
      release_date: null, release_kind: '待確認', verification_status: 'pending', verification_method: 'pending',
      exclusive_status: 'unknown', exclusive_claim_text: '',
      review_note: item.verification_status === 'verified'
        ? '舊解析結果缺少同一節目的片名、類型與日期證據，已移至待確認，需重新驗證。'
        : item.review_note};
  });
}

function key(item) {
  return `${item.platform}|${normalizeTitle(item.title)}|${item.release_date || 'pending'}`;
}

export function mergeReleases(items = []) {
  const safe = sanitizeItems(items), verified = safe.filter(safeRelease);
  // Pending rows are suppressed only by an exact title match, never a substring.
  const verifiedTitles = new Set(verified.map(item => `${item.platform}|${normalizeTitle(item.title)}`));
  const result = new Map();
  for (const item of safe) {
    if (!safeRelease(item) && verifiedTitles.has(`${item.platform}|${normalizeTitle(item.title)}`)) continue;
    const previous = result.get(key(item));
    if (!previous || (!safeRelease(previous) && safeRelease(item))) result.set(key(item), item);
  }
  return [...result.values()];
}
