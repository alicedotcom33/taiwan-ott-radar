param([switch]$Preview,[switch]$Force)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$folder = Join-Path $env:LOCALAPPDATA 'OttRadar'
$statePath = Join-Path $folder 'last-success.json'
$day = Get-Date -Format 'yyyy-MM-dd'
if (!$Preview -and !$Force -and (Test-Path $statePath)) {
  $last = Get-Content $statePath -Raw | ConvertFrom-Json
  if ($last.day -eq $day) { Write-Host 'Already updated today.'; exit 0 }
}
try {
  $p = @{ app_k='appk_pcw'; app_lm='ntw'; app_t='i18nvideo'; app_v='3.1.5'; card_v='v1'; att_id='null'; dev_os='android'; dev_ua='Mozilla/5.0'; lang='zh_tw'; mod='ntw'; net_sts='1'; page_st='home_web'; platform_id='48'; psp_cki=''; psp_status='-1'; psp_uid=''; qyid=[guid]::NewGuid().ToString('N'); req_sn=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); sid=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); req_times='1'; secure_p='pcw'; secure_v='1'; timezone='GMT+8:00'; pg_size='4'; channel_id='0'; customized='1'; pg_num='1' }
  $q = ($p.GetEnumerator() | ForEach-Object { [uri]::EscapeDataString([string]$_.Key)+'='+[uri]::EscapeDataString([string]$_.Value) }) -join '&'
  $r = Invoke-RestMethod -Uri ('https://api.iq.com/page/pcw_common?'+$q) -MaximumRedirection 0 -TimeoutSec 30
  $board = $r.cards | Where-Object { $_.card_type -eq 'pcw_rank_list' -and $_.kv_pair.content_id -eq '3780306828140202' } | Select-Object -First 1
  if ($r.code -ne 0 -or !$board) { throw 'Official hot ranking not found.' }
  $rows = @($board.blocks | Where-Object { $_.statistics.rank -match '^\d+$' -and [int]$_.statistics.rank -lt 10 } | Sort-Object { [int]$_.statistics.rank })
  if ($rows.Count -ne 10) { throw 'Expected ten ranked works; upload cancelled.' }
  $rows | ForEach-Object { Write-Host ('{0}. {1}' -f (1+[int]$_.statistics.rank),$_.title) }
  if ($Preview) { return }
  $blocks = @($rows | ForEach-Object { @{title=$_.title; statistics=@{rank=[string]$_.statistics.rank}; kv_pair=@{loc_suffix_album=$_.kv_pair.loc_suffix_album; tags=$_.kv_pair.tags; channel_id=$_.kv_pair.channel_id}; image=@{url=$_.image.url}} })
  $payload = @{captured_at=[DateTime]::UtcNow.ToString('o'); response=@{code=0; base=@{key=$r.base.key; name=$r.base.name; statistics=@{pb_str=$r.base.statistics.pb_str}}; cards=@(@{card_type=$board.card_type; name=$board.name; blocks=$blocks})}}
  $bytes = [Text.Encoding]::UTF8.GetBytes(($payload | ConvertTo-Json -Depth 12 -Compress))
  $secure = (Get-Content (Join-Path $folder 'private-key.dpapi') -Raw).Trim() | ConvertTo-SecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $rsa = New-Object Security.Cryptography.RSACryptoServiceProvider -ArgumentList 2048
  $rsa.PersistKeyInCsp = $false
  try {
    $rsa.FromXmlString([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr))
    $signature = [Convert]::ToBase64String($rsa.SignData($bytes,'SHA256'))
  } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr); $rsa.Dispose() }
  $result = Invoke-RestMethod -Uri 'https://taiwan-ott-radar.netlify.app/.netlify/functions/iq-upload' -Method Post -Headers @{'X-OTT-Signature'=$signature} -ContentType 'application/json; charset=utf-8' -Body $bytes -MaximumRedirection 0 -TimeoutSec 30
  if (!$result.ok -or $result.count -ne 10) { throw 'Server did not confirm ten works.' }
  @{day=$day; checked_at=$result.checked_at} | ConvertTo-Json | Set-Content $statePath -Encoding UTF8
  ('{0} OK {1}' -f [DateTime]::UtcNow.ToString('o'),$result.checked_at) | Add-Content (Join-Path $folder 'update.log')
  Write-Host ('Website updated: '+$result.checked_at)
} catch {
  if (Test-Path $folder) { ('{0} FAILED {1}' -f [DateTime]::UtcNow.ToString('o'),$_.Exception.Message) | Add-Content (Join-Path $folder 'update.log') }
  Write-Error $_.Exception.Message
  exit 1
}
