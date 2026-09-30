export const CURATED = {
  "reviewed_at": "2026-09-30T09:00:00.000Z",
  "items": [
    {
      "id": "Netflix-黑白清道夫-2026-09-17",
      "title": "黑白清道夫",
      "platform": "Netflix",
      "content_type": "戲劇",
      "region": "台灣",
      "release_date": "2026-09-17",
      "release_kind": "新劇首播",
      "episode_info": "共10集，一次全集上架",
      "exclusive_status": "true",
      "exclusive_claim_text": "9月17日獨家全集上線Netflix",
      "verification_status": "verified",
      "verification_method": "manual_verified",
      "source_label": "Netflix 官方新聞稿",
      "source_url": "https://about.netflix.com/zh_tw/news/the-fixers-date-announcement-and-teaser-debut",
      "source_published_at": "2026-08-13",
      "fetched_at": "2026-09-16T00:00:00.000Z",
      "review_note": "既有人工核對資料；非本次 FB 抓取結果。",
      "evidence": [
        {
          "scope": "manual_review",
          "title": "黑白清道夫",
          "content_type": "戲劇",
          "release_date": "2026-09-17",
          "url": "https://about.netflix.com/zh_tw/news/the-fixers-date-announcement-and-teaser-debut",
          "claim_text": "黑白清道夫：9月17日獨家全集上線Netflix"
        }
      ]
    },
    {
      "id": "DisneyPlus-你是真的媽-2026-10-20",
      "title": "你是真的媽?",
      "platform": "Disney+",
      "content_type": "戲劇",
      "region": "",
      "release_date": "2026-10-20",
      "release_kind": "新劇首播",
      "episode_info": "",
      "exclusive_status": "unknown",
      "exclusive_claim_text": "",
      "verification_status": "verified",
      "verification_method": "manual_verified",
      "source_label": "Disney+ 台灣官方 FB",
      "source_url": "https://www.facebook.com/DisneyPlusTW/posts/pfbid024W6q7ynmq6mCs5w5rFM9hCcVRWWUVDm8mKM4DNozydwK33RTmMfLYtDVWFB5nipkl",
      "source_published_at": "2026-09-30",
      "fetched_at": "2026-09-30T08:50:00.000Z",
      "review_note": "官方 9/30 貼文公告全新懸疑影集 10/20 上線，依發文日期核對年份為 2026；貼文中的其他推薦作品不套用此日期。",
      "evidence": [
        {
          "scope": "manual_review",
          "title": "你是真的媽?",
          "content_type": "戲劇",
          "release_date": "2026-10-20",
          "url": "https://www.facebook.com/DisneyPlusTW/posts/pfbid024W6q7ynmq6mCs5w5rFM9hCcVRWWUVDm8mKM4DNozydwK33RTmMfLYtDVWFB5nipkl",
          "claim_text": "全新懸疑影集《你是真的媽?》10月20日 Disney+ 精彩上線"
        }
      ]
    }
  ]
};
export const SOCIAL_REVIEW = {
  "checked_at": "2026-09-30T09:00:00.000Z",
  "mode": "scheduled_agent_review",
  "schedule_description": "每日台灣時間上午核對官方 FB；官網每日 06:00 自動掃描",
  "complete": false,
  "sources": [
    {
      "platform": "iQIYI",
      "page_url": "https://www.facebook.com/twiqiyi",
      "status": "partial",
      "posts_read": 1,
      "note": "可讀最新貼文《我不是大師》熱播宣傳，未提供首播日期；較早貼文持續載入。"
    },
    {
      "platform": "friDay影音",
      "page_url": "https://www.facebook.com/FETVOD/",
      "status": "partial",
      "posts_read": 1,
      "note": "最新公告為 10 月电影片單，排除；較早貼文受限。"
    },
    {
      "platform": "Netflix",
      "page_url": "https://www.facebook.com/netflixtw",
      "status": "login_required",
      "posts_read": 0,
      "note": "此瀏覽器被導向登入頁，未完成 FB 核對。"
    },
    {
      "platform": "Disney+",
      "page_url": "https://www.facebook.com/DisneyPlusTW/",
      "status": "partial",
      "posts_read": 1,
      "note": "確認《你是真的媽?》10/20 上線；其他推薦作品未提供日期；較早貼文受限。"
    },
    {
      "platform": "Hami Video",
      "page_url": "https://www.facebook.com/CHTHamiVideo/",
      "status": "partial",
      "posts_read": 1,
      "note": "最新貼文為亞運運動賽事，排除；較早貼文受限。"
    },
    {
      "platform": "MyVideo",
      "page_url": "https://www.facebook.com/MyvideoTWM/",
      "status": "partial",
      "posts_read": 1,
      "note": "最新《飛到我心上》陸劇宣傳未提供首播日期；較早貼文受限。"
    },
    {
      "platform": "LINE TV",
      "page_url": "https://www.facebook.com/LINETV.taiwan/",
      "status": "partial",
      "posts_read": 1,
      "note": "最新《再見1987》全集熱播宣傳未提供首播日期；較早貼文受限。"
    }
  ]
};
