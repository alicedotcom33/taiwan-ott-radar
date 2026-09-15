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
目前自動抓取只確認官方來源是否可取得。由於各平台 HTML / JS / 社群結構不同，在沒有穩定逐節目 parser 前，抓到的內容只進「待確認」，不會猜劇名、日期或獨家冒充正式資料。

## 部署方式（重要）
V1 用拖曳即可，但 V2 有 Functions 與排程，建議改成 GitHub + Netlify Continuous Deployment：
1. 建立 GitHub repository，把 ZIP 解壓後的所有檔案上傳。
2. Netlify → Add new project / Import an existing project → 選該 repository。
3. Deploy。
4. Netlify Functions 頁應看到 feed、manual-refresh、refresh-background、scheduled-refresh。
5. scheduled-refresh 每天 UTC 22:00 執行，即台灣 06:00。

正式資料欄位包含 source_url、source_published_at、fetched_at、verification_status、exclusive_claim_text。
