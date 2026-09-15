import { getStore } from "@netlify/blobs";

const SOURCES = [
  ["Netflix", "https://about.netflix.com/zh_tw/new-to-watch"],
  ["Disney+", "https://www.disney.com.tw/disneyplus-articles"],
  ["iQIYI", "https://www.iq.com/?lang=zh_tw"],
  ["friDay影音", "https://video.friday.tw/"],
  ["Hami Video", "https://hamivideo.hinet.net/"],
  ["MyVideo", "https://www.myvideo.net.tw/"],
  ["LINE TV", "https://www.linetv.tw/"],
];

const now = () => new Date().toISOString();

function taiwanToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toISODate(year, month, day) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00+08:00`);
  date.setDate(date.getDate() + days);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getMonday(dateString) {
  const date = new Date(`${dateString}T12:00:00+08:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(dateString, diff);
}

/**
 * 日期規則：
 * 這週      => 本週一 ～ 今天
 * 上週      => 上週一 ～ 上週日
 * 9/7       => 今年 9/7 ～ 今天
 * 2026/9/7  => 2026/9/7 ～ 今天
 * 9/7～9/13 => 指定區間
 */
function parseDateRange(input) {
  const today = taiwanToday();
  const currentYear = Number(today.slice(0, 4));

  const raw = String(input || "這週")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[－—–~至]/g, "～");

  if (raw === "這週" || raw === "本週") {
    return {
      start: getMonday(today),
      end: today,
      label: "這週",
    };
  }

  if (raw === "上週") {
    const thisMonday = getMonday(today);
    const lastSunday = addDays(thisMonday, -1);
    const lastMonday = addDays(lastSunday, -6);

    return {
      start: lastMonday,
      end: lastSunday,
      label: "上週",
    };
  }

  const rangeMatch = raw.match(
    /^(\d{1,4})\/(\d{1,2})(?:\/(\d{1,2}))?～(?:(\d{1,4})\/)?(\d{1,2})\/(\d{1,2})$/
  );

  if (rangeMatch) {
    let startYear;
    let startMonth;
    let startDay;
    let endYear;
    let endMonth;
    let endDay;

    if (rangeMatch[3]) {
      startYear = Number(rangeMatch[1]);
      startMonth = Number(rangeMatch[2]);
      startDay = Number(rangeMatch[3]);
    } else {
      startYear = currentYear;
      startMonth = Number(rangeMatch[1]);
      startDay = Number(rangeMatch[2]);
    }

    endYear = rangeMatch[4]
      ? Number(rangeMatch[4])
      : startYear;

    endMonth = Number(rangeMatch[5]);
    endDay = Number(rangeMatch[6]);

    return {
      start: toISODate(startYear, startMonth, startDay),
      end: toISODate(endYear, endMonth, endDay),
      label: raw,
    };
  }

  const fullDate = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);

  if (fullDate) {
    const start = toISODate(
      Number(fullDate[1]),
      Number(fullDate[2]),
      Number(fullDate[3])
    );

    return {
      start,
      end: today,
      label: `${raw}～今天`,
    };
  }

  const shortDate = raw.match(/^(\d{1,2})\/(\d{1,2})$/);

  if (shortDate) {
    const start = toISODate(
      currentYear,
      Number(shortDate[1]),
      Number(shortDate[2])
    );

    return {
      start,
      end: today,
      label: `${raw}～今天`,
    };
  }

  return {
    start: getMonday(today),
    end: today,
    label: "這週",
  };
}

/**
 * 獨家語意判斷
 *
 * true    = 官方明確表示平台獨播／獨家
 * false   = 明確不是獨家語意
 * unknown = 資訊不足
 */
function detectExclusive(text = "") {
  const normalized = String(text)
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return {
      status: "unknown",
      claim: "",
    };
  }

  // 這些不能直接當成平台獨家
  const misleadingPatterns = [
    /獨家專訪/i,
    /獨家訪問/i,
    /獨家花絮/i,
    /獨家片段/i,
    /獨家預告/i,
    /獨家搶先看/i,
    /VIP\s*獨家搶先/i,
    /會員獨家/i,
  ];

  if (misleadingPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      status: "unknown",
      claim: "",
    };
  }

  const exclusivePatterns = [
    /全台獨家/i,
    /全網獨播/i,
    /全網獨家/i,
    /全台獨播/i,
    /獨家播出/i,
    /獨家上線/i,
    /獨家全集上線/i,
    /獨家首播/i,
    /平台獨家/i,
    /\bexclusive\b/i,
    /\bonly\s+on\b/i,
    /僅在.{0,30}(?:播出|上線|觀看)/i,
    /只在.{0,30}(?:播出|上線|觀看)/i,
  ];

  const matched = exclusivePatterns.find((pattern) =>
    pattern.test(normalized)
  );

  if (!matched) {
    return {
      status: "unknown",
      claim: "",
    };
  }

  const result = normalized.match(matched);

  return {
    status: "true",
    claim: result?.[0] || "",
  };
}

export default async (req) => {
  let payload = {};

  try {
    payload = await req.json();
  } catch {}

  const query = payload.query || "這週";
  const range = parseDateRange(query);

  const store = getStore("ott-radar");

  const old =
    (await store.get("releases.json", {
      type: "json",
    })) || { items: [] };

  const pending = [];

  for (const [platform, url] of SOURCES) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
          "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
        },
      });

      const html = await response.text();

      // 先建立獨家語意能力。
      // 後續平台解析器會針對「單一作品文字」呼叫這個判斷，
      // 目前不能拿整頁文字直接判定某一作品獨家。
      const exclusiveTest = detectExclusive("");

      pending.push({
        id: `source-${platform}-${Date.now()}`,
        title: `${platform} 官方來源待解析`,
        platform,
        content_type: "",
        region: "",
        release_date: null,
        release_kind: "來源檢查",
        episode_info: "",
        exclusive_status: exclusiveTest.status,
        exclusive_claim_text: exclusiveTest.claim,
        verification_status: "pending",
        source_label: `${platform} 官方頁`,
        source_url: url,
        source_published_at: null,
        fetched_at: now(),

        query_start_date: range.start,
        query_end_date: range.end,

        review_note:
          response.ok
            ? `官方來源取得成功（HTTP ${response.status}）。查詢區間：${range.start}～${range.end}。頁面取得 ${html.length} 字元；尚待平台逐節目解析器處理，因此不猜劇名、日期或獨家。`
            : `官方來源回應 HTTP ${response.status}。查詢區間：${range.start}～${range.end}。尚未驗證作品資料。`,
      });
    } catch (error) {
      pending.push({
        id: `source-${platform}-${Date.now()}`,
        title: `${platform} 官方來源抓取失敗`,
        platform,
        content_type: "",
        region: "",
        release_date: null,
        release_kind: "來源檢查",
        episode_info: "",
        exclusive_status: "unknown",
        exclusive_claim_text: "",
        verification_status: "pending",
        source_label: `${platform} 官方頁`,
        source_url: url,
        source_published_at: null,
        fetched_at: now(),

        query_start_date: range.start,
        query_end_date: range.end,

        review_note: String(error?.message || error),
      });
    }
  }

  const verified = (old.items || []).filter(
    (item) => item.verification_status === "verified"
  );

  await store.setJSON("releases.json", {
    updated_at: now(),

    last_query: query,
    query_range: {
      start: range.start,
      end: range.end,
      label: range.label,
    },

    items: [...verified, ...pending],
  });
};

export const config = {
  background: true,
  path: "/.netlify/functions/refresh-background",
};
