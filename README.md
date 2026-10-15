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

## iQIYI 台灣核對榜單（2026-10-15 12:29）

使用者提供 home_web 官方 API 回應，人气热榜明示 0–29 名，前六名與官網截圖一致。投影其中前十筆的片名、名次、作品網址及類型證據存入 iq-taiwan-snapshot.mjs；不保存使用者裝置識別碼或完整請求。feed 與排程讀取快取時補上這份 verified_snapshot_id 的核對資料，不重置其他平台快取。

此為官方回應匯入，並非已完成持續自動更新。已測同分組、同裝置、home_web 伺服器回應仍不同；本站 Origin 沒有收到跨站讀取許可標頭，callback/cb 也未產生 JSONP。原因尚未證實。每日無法通過地區核對時保留核對榜單與 checked_at，更新 attempted_at 並顯示警示，不允許錯誤回應覆蓋已核對榜單。

## 台灣 Windows 每日上傳（配對後啟用）

`scripts/windows/Install-OttRadar.ps1` 是獨立安裝程式，內嵌固定版本的擷取程式；不自動下載或執行新版程式。先測試台灣 home_web 榜單，再於 `%LOCALAPPDATA%\OttRadar` 建立 2048-bit RSA 私鑰（Windows DPAPI、目前使用者綁定），只輸出公開 JWK。網站設定 `IQ_UPLOADER_PUBLIC_JWK`（production / Functions scope）後部署，安裝程式辨認相同 modulus 指紋才進行第一次簽章上傳。

首次上傳確認成功後，建立目前登入者、Limited 權限的 `OTT Radar Taiwan iQIYI` 工作：本機時間每日 09:00，加登入補跑；一天成功一次後跳過，失敗最多三次、間隔 15 分鐘重試。電腦必須登入、開機連網。安裝程式等待配對 20 分鐘，逾時不建立排程；重跑沿用私鑰。可用 `Disable-ScheduledTask -TaskName 'OTT Radar Taiwan iQIYI'` 停止。

安全邊界：只主動 HTTPS 讀 api.iq.com、上傳既有正式站，不開監聽埠、不裝遠端控制、不變更防火牆／防毒／全域 PowerShell 設定、不需管理員。遠端回應只作 JSON 資料，不執行指令。專案目錄 ACL 限目前使用者與 SYSTEM。私鑰不送出，完整愛奇藝請求／裝置 ID 不保存上傳。網站只接受預先配對私鑰的 RSA-SHA256 簽章、15 分鐘內擷取、明示 1–10 名與唯一官方作品網址的資料；拒絕篡改、重複和過期資料。簽章證明授權電腦提交，不能獨立證明來源地理位置；換網路／VPN 後仍應比對實際榜單。

上傳寫獨立 `iq-taiwan-local.json`，不與全平台排程共用寫入鍵。feed 合併資料，超過 36 小時未更新標示 stale。未配對時接收端回 503，既有榜單不受影響。網站端安全與資料保護已測試；Linux 環境無法實際執行 Windows Task Scheduler / DPAPI，須於目標 Windows 完成安裝與第一次上傳測試後，才可宣稱每日更新已啟用。

## 配對與介面更新

配對公鑰已固定於 iq-uploader-public-key.mjs（只含公鑰，沒有私鑰），接收端不再依賴未生效的環境變數。公鑰是公開驗證資料，可安全隨部署配送，私鑰仍只存在使用者的 Windows DPAPI 加密檔案。輪替公鑰須更新此模組及部署。

介面加入原創 OTT RADAR SVG 標誌、淡色背景、平台文字識別與色彩、精簡卡片與手機版。平台文字識別不宣稱是官方授權 logo。公開 feed 只傳前台使用的片名／名次／連結／分類與更新狀態，圖片與詳細證據保留於原始儲存資料，減少流量。

## 本次整批介面改善

每平台增加純前端的前十名分類比例圖（含部數與可讀文字，不增加 API 呼叫）、片名搜尋、分類篩選、更新提醒與使用者主動點擊的一鍵複製完整榜單。搜尋保留官方名次，分類圖始終反映完整原榜。Netflix 同作品「節目性質」的明示國家標籤也納入分類，沒有地區標籤的華語節目仍不推定為陸劇。

同名登榜標籤以現有前十名資料在瀏覽器計算，保留季別，區分電影／戲劇／綜藝及已知國家，提示各平台原始名次；不另增 API 查詢。

卡司最多兩位，依同一作品官方演員／主演／主持人原始順序，排除導演與推薦節目。Netflix 以 current title ID 的 actors、LINE 以同 dramaId 的 actors、Disney+ 以同名 MediaDetails 主演 credits、LiTV 以同 content_id 演員 credits、friDay 以當前作品參與人員區、Hami/MyVideo 以同作品 JSON-LD actor。iQIYI 以 album URL 唯一識別碼對應官方 actorArr；官方英文名不自行翻譯。缺乏可核對演員資料的作品不補造，運動榜也不假造演員。每日背景刷新另外維護 iq-cast.json，feed 只以相同作品 URL 與片名合併到台灣電腦上傳榜單，避免因補卡司而阻塞簽章上傳或改變榜單。

## 待審新版（尚未部署）

改為白灰底、官方平台 Logo（來源記錄於 assets/platforms/sources.json），各平台代表色與較易區分的分類圖。首頁移除播放框／票券裝飾，縮短封面。AI 劇標籤置於卡司旁，只有同一作品的官方資訊明確標示才採用，故事提及 AI 不算；廚娘的官方證據已核對。標籤獨立於原始作品類型。Netflix 作品頁請求增加一般瀏覽器 User-Agent，卡司缺漏時僅針對同一官方作品頁重試一次；仍缺漏就留白。瀏覽端不增加逐作品查詢。

Windows 安裝程式修正只寫入變更的 DACL，避免 Set-Acl 要求 SeSecurityPrivilege，保留既有 DPAPI 私鑰。

## 地區分類補強（待部署）

Disney+ 作品頁未提供產地時，以迪士尼台灣官方主題片單／月片單的同一作品標題與 entity ID 交叉核對分類，每日後端批次更新；不以演員國籍、故事發生地或片名猜測。莓好遇見你官方作品簡介明示「日韓浪漫喜劇」，保留日韓劇標籤。愛爾達使用戲劇目錄的分類選單 ID 與同一作品卡片 cat_ID，核對完整作品網址及片名，四部目前榜上戲劇均屬陸劇。未能確認地區時維持影集／戲劇，平台欄位加小字提示。電影、動漫、運動不改造成戲劇分類。ELTA 改用官網橫式 Logo，保留官方圖檔並縮小顯示。

## 復古視窗視覺（待審）

依使用者最新參考圖，採白底、淡灰紫標題列與細描邊的瀏覽器視窗版面，文字維持深灰。保留原有官方 Logo、排行榜、全站固定分類色彩與功能。視窗符號僅為裝飾並設 aria-hidden。CSS 輕量實作，未加入圖片服務、外部字體或額外訪客 API 查詢，待使用者確認後才部署。

封面右側文字替換為原創透明夜空視窗插圖（內建圖片生成工具製作），WebP 約 16 KB，使用本地網站素材，不新增外部圖片服務。參考圖僅作風格與主題參考；未重繪任何照片人物。同步加深灰紫標題列與描邊。
