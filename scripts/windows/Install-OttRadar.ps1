$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$folder = Join-Path $env:LOCALAPPDATA 'OttRadar'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$acl = New-Object Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true,$false)
$owner = [Security.Principal.WindowsIdentity]::GetCurrent().User
$system = New-Object Security.Principal.SecurityIdentifier 'S-1-5-18'
foreach ($id in @($owner,$system)) {
  $rule = New-Object Security.AccessControl.FileSystemAccessRule($id,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
  $acl.AddAccessRule($rule)
}
# Persist only the modified access rules; do not request audit/SACL privileges.
[IO.Directory]::SetAccessControl($folder,$acl)
$access = [IO.Directory]::GetAccessControl($folder,[Security.AccessControl.AccessControlSections]::Access)
if (!$access.AreAccessRulesProtected) { throw 'Folder permissions could not be secured. Nothing scheduled.' }
$worker = @'
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

'@
$workerPath = Join-Path $folder 'Update-OttRadar.ps1'
$worker | Set-Content $workerPath -Encoding UTF8
$powerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
& $powerShell -NoProfile -ExecutionPolicy RemoteSigned -File $workerPath -Preview
if ($LASTEXITCODE -ne 0) { throw 'Taiwan ranking check failed. Nothing scheduled.' }
$keyPath = Join-Path $folder 'private-key.dpapi'
$rsa = New-Object Security.Cryptography.RSACryptoServiceProvider -ArgumentList 2048
$rsa.PersistKeyInCsp = $false
try {
  if (Test-Path $keyPath) {
    $secure = (Get-Content $keyPath -Raw).Trim() | ConvertTo-SecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $rsa.FromXmlString([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  } else {
    $rsa.ToXmlString($true) | ConvertTo-SecureString -AsPlainText -Force | ConvertFrom-SecureString | Set-Content $keyPath -Encoding UTF8
  }
  $public = $rsa.ExportParameters($false)
  function B64Url([byte[]]$v) { return [Convert]::ToBase64String($v).TrimEnd('=').Replace('+','-').Replace('/','_') }
  $jwk = @{kty='RSA'; n=(B64Url $public.Modulus); e=(B64Url $public.Exponent)} | ConvertTo-Json -Compress
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $kid = ([BitConverter]::ToString($sha.ComputeHash($public.Modulus))).Replace('-','').ToLowerInvariant() } finally { $sha.Dispose() }
} finally { $rsa.Dispose() }
Write-Host ''
Write-Host 'COPY THE PUBLIC KEY BELOW AND SEND IT IN CHAT. KEEP THIS WINDOW OPEN.'
Write-Host $jwk
Write-Host ''
Write-Host 'Waiting up to 20 minutes for website pairing. The private key stays encrypted on this PC.'
$paired = $false
for ($i=0; $i -lt 80; $i++) {
  try {
    $server = Invoke-RestMethod 'https://taiwan-ott-radar.netlify.app/.netlify/functions/iq-upload' -MaximumRedirection 0 -TimeoutSec 10
    if ($server.kid -eq $kid) { $paired=$true; break }
  } catch {}
  Start-Sleep -Seconds 15
}
if (!$paired) { Write-Host 'Pairing not finished. Run this installer again later; your key is retained.'; return }
& $powerShell -NoProfile -ExecutionPolicy RemoteSigned -File $workerPath -Force
if ($LASTEXITCODE -ne 0) { throw 'First upload failed. Nothing scheduled.' }
$action = New-ScheduledTaskAction -Execute $powerShell -Argument ('-NoProfile -NonInteractive -ExecutionPolicy RemoteSigned -File "'+$workerPath+'"')
$user = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$daily = New-ScheduledTaskTrigger -Daily -At '10:00'
# Hourly checks make up for missed runs during shutdown, sign-in, or temporary network loss.
$hourly = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 3650)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $user
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 15) -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName 'OTT Radar Taiwan iQIYI' -Action $action -Trigger @($daily,$logon,$hourly) -Settings $settings -Principal $principal -Force | Out-Null
Write-Host 'DONE: Daily 10:00 local time, plus sign-in and hourly catch-up; only one successful upload per day.'
Write-Host ('Logs: '+(Join-Path $folder 'update.log'))
Write-Host 'The PC must be signed in and online. No admin rights or Facebook login needed.'
