# 台灣 OTT 熱門榜

七平台官方熱門前十名，前台以簡潔榜單呈現，提供平台切換、原始名次、節目連結、榜單範圍與成功取得時間。

## 榜單來源

|平台|官方榜單|週期|
|---|---|---|
|Netflix|台灣公開首頁「現正熱播」1–10 名|官方未公布統計區間；每日取得首頁快照|
|friDay影音|最多人觀看|官方未公布統計週期|
|Disney+|台灣本日熱播 Top 10|本日|
|Hami Video|本月最熱門|本月|
|MyVideo|本日戲劇榜|本日；未取得公開綜合榜，不假稱綜合榜|
|LINE TV|10 大熱門節目|官方未公布統計週期|
|iQIYI|首頁熱門榜|公開伺服器回傳其他地區設定或空排名時標示讀取受限，不冒充台灣榜|

榜單忠實保留官方原始前十名，綜合榜包含電影、動畫等類型。各平台的統計範圍不同，不作跨平台排名。Netflix 採用台灣首頁繁體中文片名，不再使用 Tudum 週榜。Netflix 公開首頁以互動卡片展示作品，項目連結導回官方首頁供核對。取得時間與榜單統計日期分開顯示。

## 自動更新

Netlify `scheduled-refresh` 每天 UTC 22:00（台灣 06:00）呼叫 `refresh-background`，並行取得七個官方來源。結果寫入 Netlify Blobs 的 `rankings.json`；`feed` 只讀快取。使用者重新整理只讀快取，不重抓官方網站，減少額度消耗。

每個來源保留 attempted_at、checked_at、status、period_label、原始來源網址。讀取失敗時保留最後成功榜單與時間，標示 stale，不能宣稱已更新。首份已核對官方 HTML 的榜單以 rankings-seed.mjs 提供冷啟動資料。

iQIYI 官網依請求地區回傳不同內容，lang=zh_tw 不能證明為台灣榜；解析器必須檢查地區。讀不到台灣排名時不借用美國或全球榜，不把推薦清單當成排行榜。

舊上新紀錄、curated 模組與 releases.json 保留，前台與每日刷新已切換至排行榜，不再依賴 FB 登入。

## 測試與部署

`npm test` 執行原有資料保護與新排行榜邊界測試。GitHub main 透過既有 Netlify Continuous Deployment 發布。正式站：https://taiwan-ott-radar.netlify.app/
