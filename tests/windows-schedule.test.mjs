import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const installer=readFileSync(new URL('../scripts/windows/Install-OttRadar.ps1',import.meta.url),'utf8');
const scheduled=readFileSync(new URL('../netlify/functions/scheduled-refresh.mjs',import.meta.url),'utf8');
test('Windows iQIYI captures daily at 10 and catches up hourly and on sign in',()=>{
 assert.match(installer,/New-ScheduledTaskTrigger -Daily -At '10:00'/);
 assert.match(installer,/New-ScheduledTaskTrigger -AtLogOn/);
 assert.match(installer,/New-ScheduledTaskTrigger -Once -At \\(Get-Date\\).AddMinutes\\(2\\) -RepetitionInterval \(New-TimeSpan -Hours 1\)/);
 assert.match(installer,/-Trigger @\(\$daily,\$logon,\$hourly\)/);
 assert.match(installer,/if \(\$last.day -eq \$day\)/);
});
test('Netlify daily scan is scheduled for Taiwan 10am UTC+8',()=>{
 assert.match(scheduled,/schedule:"0 2 \* \* \*"/);
});
