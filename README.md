# 台灣 OTT 上新雷達 V2

可直接部署到 Netlify 的完整 V2 骨架。

## 已完成
- 日期由新到舊，同日期再依平台分組
- iQIYI / friDay影音 / Netflix / Disney+ / Hami Video / MyVideo / LINE TV 平台切換
- 本週、即將、待確認
- 類型、地區、獨家篩選
- 「9/18、2026/9/18、這週、下週」文字抓取入口
- Netlify Blobs 資料層
- 每天台灣時間 06:00 Scheduled Function
- Background Function 逐一檢查 7 個官方來源

## 正確性保護
自動抓取採用保守的逐節目連結解析（`single-item-v1`）。只有同一個節目連結內明確包含片名、戲劇／綜藝類型、完整年／月／日與上線文字，且目標為該平台官方節目網址時，才能列為「已驗證」。不使用連結前後文字，不從列表頁網址推定節目類型，不為只有月／日的文字補上年份。

- 電影、動畫、短劇等不在收錄範圍；電影網址即使出現在綜藝列表也會被排除。
- Netflix 不再將所有作品預設為戲劇；缺少類型證據時保留待確認。
- 缺少逐節目證據的舊版已驗證資料會撤回日期、獨家標記並移至待確認；電影與不合格片名不會出現在 feed。
- 同平台的證據合併只比對完整正規化片名，保留已驗證項目及不同日期，不做子字串配對。
- feed 在讀取時也會檢查舊資料，無須等排程刷新才撤回不安全結果。
- 第一次資料遷移會備份原始資料到 `releases-before-single-item-v1.json`；舊日期保留在 `previous_release_date` 供複核。
- 各來源的 HTTP 失敗會出現在 diagnostics，取得頁面不代表已解析出節目。

目前尚未完成七平台的專用卡片、內頁、結構化資料與歷史分頁解析；待確認或零筆不能解讀為沒有新節目。Netflix《黑白清道夫》為既有人工核對資料，不代表自動 parser 成效。

## 部署方式（重要）
V1 用拖曳即可，但 V2 有 Functions 與排程，建議改成 GitHub + Netlify Continuous Deployment：
1. 建立 GitHub repository，把 ZIP 解壓後的所有檔案上傳。
2. Netlify → Add new project / Import an existing project → 選該 repository。
3. Deploy。
4. Netlify Functions 頁應看到 feed、manual-refresh、refresh-background、scheduled-refresh。
5. scheduled-refresh 每天 UTC 22:00 執行，即台灣 06:00。

正式資料欄位包含 source_url、source_published_at、fetched_at、verification_status、exclusive_claim_text。

## 官方 FB 持續更新
已建立 ChatGPT 每日台灣時間上午 08:00–09:00 的排程核對工作，自 2026-10-01 開始。這是與網站官網排程分開的瀏覽與發布流程：讀取七平台官方 FB、核對每作品證據、更新 `_shared/curated.mjs`、執行測試、合併 GitHub 並部署既有 Netlify 正式站。不是 Netlify Function 自動滑 FB，也不保證登入狀態或 FB 讀取可用。排程依賴 ChatGPT 工作及 GitHub／Netlify 工具連線保持有效；失敗必須回報。

官網每天 06:00 的 Scheduled Function 繼續運作，所有查到的符合規則資料（含未來上線）均保留，不再只儲存本週。前台預設本週不沿用全站最後一次他人查詢區間。

`_shared/curated.mjs` 是可持續追加的官方核對資料與七平台讀取狀態。FB 已驗證紀錄必須使用指定官方專頁的貼文網址、manual_review 逐作品證據；不允許其他帳號、分享短鏈結或未核對的自動 FB 紀錄。未讀到日期的熱播宣傳不能當新上架。前台顯示最後核對時間、每平台已讀筆數與 partial/login_required/error，讀取失敗不清除既有已驗證資料。

2026-09-30 公開讀取僅取得六平台最新各一則，Netflix 登入受限、其他歷史貼文受限；新增 Disney+《你是真的媽?》2026-10-20，其他推薦劇不沿用同一日期。片單仍不完整。
