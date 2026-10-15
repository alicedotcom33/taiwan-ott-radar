# 台灣 OTT 熱門榜

各平台官方熱門前十名，前台以簡潔榜單呈現，提供平台切換、原始名次、節目連結、榜單範圍與成功取得時間。

## 榜單來源

|平台|官方榜單|週期|
|---|---|---|
|Netflix|Tudum 台灣節目 Top 10|依使用者指定來源採官方週榜，顯示統計區間|
|friDay影音|最多人觀看|官方未公布統計週期|
|Disney+|台灣本日熱播 Top 10|本日|
|Hami Video|首頁本週人氣榜|本週；照原榜保留電影等類型|
|MyVideo|本日戲劇榜|本日；未取得公開綜合榜，不假稱綜合榜|
|LINE TV|10 大熱門節目|官方未公布統計週期|
|LiTV|首頁戲劇排行|明確 1–10 名，非綜合榜|
|愛爾達|首頁熱門排行榜|官網未公布週期；依原榜包含運動與戲劇|
|iQIYI|指定 ranking 頁熱播榜|地區一致性待核對，暫停顯示名次|

榜單忠實保留官方原始前十名，綜合榜包含電影、動畫等類型。各平台的統計範圍不同，不作跨平台排名。Netflix 公開宣傳首頁會因讀取環境回傳不同片單；/tw/ 網址與繁體中文標題都不能證明榜單地區。改採使用者指定的官方台灣節目週榜，不宣稱為會員今日榜。取得時間與榜單統計日期分開顯示。

## 自動更新

Netlify `scheduled-refresh` 每天 UTC 22:00（台灣 06:00）呼叫 `refresh-background`，並行檢查九個官方來源。結果寫入 Netlify Blobs 的 `rankings.json`；`feed` 只讀快取。使用者重新整理只讀快取，不重抓官方網站，減少額度消耗。

每個來源保留 attempted_at、checked_at、status、period_label、原始來源網址。讀取失敗時保留最後成功榜單與時間，標示 stale，不能宣稱已更新。首份已核對官方 HTML 的榜單以 rankings-seed.mjs 提供冷啟動資料。

iQIYI 嘗試官方 api.iq.com/page/pcw_common 的 ranking_web 資料，僅將熱播榜 pcw_rank_list 的 blocks 及 statistics.rank（0 起算）用於診斷。原先以回應 mod=ntw、lang=zh_tw 核對，但後續實證不足以驗證台灣榜單，現僅保留回應作診斷，不發布名次。公開 API 不需要登入 Cookie，請求使用新產生的暫時識別碼，不儲存或重用使用者提供的裝置識別碼。

舊上新紀錄、curated 模組與 releases.json 保留，前台與每日刷新已切換至排行榜，不再依賴 FB 登入。

## 測試與部署

`npm test` 執行原有資料保護與新排行榜邊界測試。GitHub main 透過既有 Netlify Continuous Deployment 發布。正式站：https://taiwan-ott-radar.netlify.app/

## 作品分類

劇名後的小標籤只採同一作品官方證據。friDay 使用卡片年份／國家和戲劇／綜藝網址，MyVideo 使用戲劇榜卡片國家，Hami 讀取當前作品內頁的類型與 countryOfOrigin 結構化資料。未能核對國家者只標電影／戲劇，沒有類型證據者不標；不從劇情、演員姓名或相鄰作品猜國家。

Netflix 官方台灣週榜的部分作品卡片可能沒有播放連結，仍保留已明示的片名與名次，導向官方週榜；不因海外播放連結缺漏而漏掉台灣榜名次。

## 2026-10-15 來源修正

Netflix 從官方台灣週榜內嵌資料取得作品與母影集 ID，再向相同 ID 的 `/tw/title/` 作品頁取得官方中文 h1；季數保留。不是自行翻譯英文片名，也不改動週榜名次。若新作品中文名稱暫缺，顯示中文待確認；同 ID、同季別的已驗證中文名稱可保留。

LINE TV 讀取同 dramaId 作品的 genres 與 channelIds，並由該頁 channelList 對應戲劇、動畫、綜藝、短劇等類型。Disney+ 只讀取同名 MediaDetails 的 customFields 類別及 genres，先顯示影集／電影／動畫電影，沒有國家證據不猜韓劇或陸劇。

iQIYI pcw_common 雖回應 mod=ntw、lang=zh_tw，但與使用者提供的台灣官網熱播榜截圖第三名起不同，且卡片標記 is_personalized=1。這些區域及語言欄位不能證明台灣實際排行榜一致，具體是 IP 或個人化差異尚未確定。原始回應隔離在 unverified_items，前台不顯示未驗證名次，狀態 unavailable；每日只記錄嘗試，不宣稱成功更新。使用者截圖前六名保留作比對參考，不能自行補出後四名。

LiTV 讀取首頁 category_id=56、meta_type=rank 的戲劇排行，並逐一核對相同 content_id HTML 中的明示名次。分類採同筆 f_countries 與戲劇類型。CATCHPLAY 台灣頁在目前公開讀取環境轉到企業頁，尚無可用官方榜單，本輪不加入。

Netflix 海外週榜回應若缺母影集資料，使用同一官方卡片的季別 videoId 請求台灣作品頁，並接受 Netflix 本身導向母影集的重新導向。保留原始季別 ID 與 requested_url/resolved_url 證據，再讀官方中文片名，避免海外缺播放資料時掉回待確認。
