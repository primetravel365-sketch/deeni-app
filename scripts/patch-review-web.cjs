// Applied to the checked-out web bundle before Capacitor copies it.
// The upstream HTML is larger than the GitHub Contents API editing limit.
// Keep patch assertions strict to avoid silent changes to unrelated code.
const fs = require('node:fs');
const file = 'www/index.html';
const { execFileSync } = require('node:child_process');
const { join } = require('node:path');
// Apply the reviewed HTML against the exact checked-in bundle before adding CI modules.
const reviewPatch = join(__dirname, 'islamiyat-review-24nov.patch');
try {
  execFileSync('git', ['apply', '--reverse', '--check', reviewPatch], { stdio: 'pipe' });
} catch {
  execFileSync('git', ['apply', reviewPatch], { stdio: 'inherit' });
}
let html = fs.readFileSync(file, 'utf8');
const patches = [
  {
    reason: 'Avoid scheduling iqama twice when notification preferences are saved',
    oldText: 'adhanNotificationsEnabled&&(scheduleAdhanNotifications(),scheduleIqamaNotifications()),closePrayerNotifSettings()',
    newText: 'adhanNotificationsEnabled&&scheduleAdhanNotifications(),closePrayerNotifSettings()'
  },
  {
    reason: 'Pass actual Fajr iqama interval into native full-adhan alarm, never other prayers',
    oldText: 'soundType:"bundled",source:o.rawKey,latitude:',
    newText: 'soundType:"bundled",source:o.rawKey,iqamaMinutes:"fajr"===t.key?(t.iqamah||0):0,latitude:'
  },
  {
    reason: 'Remove call to native short-notification API which the Android plugin does not implement',
    oldText: 'try{const azn=getNativeAzanSound();azn&&azn.scheduleShortNotifications&&await azn.scheduleShortNotifications({configs:prayerSchedule.filter(p=>"shuroq"!==p.key).map(p=>({key:p.key,name:p.name,adhanNowEnabled:!1!==p.adhanNowEnabled,iqamaEnabled:!0===p.iqamaEnabled,beforeIqamaEnabled:!0===p.beforeIqamaEnabled,iqamahMinutes:p.iqamah||0,beforeIqamaMins:p.beforeIqamaMins||0}))})}catch(t){}',
    newText: ''
  }
];
if (html.startsWith('<!-- islamiyat-review-integrated-html -->')) {
  const integratedChecks = [
    patches[0].newText,
    'iqamaMinutes:p.key==="fajr"&&p.iqamaEnabled!==false?Number(p.iqamah)||0:0,latitude:'
  ];
  if (patches.some(p => html.includes(p.oldText)) ||
      integratedChecks.some(text => html.split(text).length !== 2)) {
    throw new Error('Integrated HTML does not contain the expected prayer notification fixes');
  }
  console.log('Verified integrated prayer notification fixes');
} else {
  for (const p of patches) {
    const occurrences = html.split(p.oldText).length - 1;
    if (occurrences !== 1) throw new Error('Patch assertion failed (' + p.reason + '): found ' + occurrences);
    html = html.replace(p.oldText, p.newText);
    console.log('Applied:', p.reason);
  }
}
// Attach optional radio/mosque features without rewriting the 6-MB minified bundle.
const enhancementTag = '<script defer src="islamiyat-enhancements.js"></script>';
if (!fs.existsSync('www/islamiyat-enhancements.js')) {
  throw new Error('Missing Quran radio / Qibla enhancements module');
}
if (html.includes(enhancementTag)) {
  console.log('Review enhancements already attached');
} else {
  const closingBody = html.toLowerCase().lastIndexOf('</body>');
  if (closingBody < 0) throw new Error('Missing </body> insertion point');
  html = html.slice(0, closingBody) + enhancementTag + html.slice(closingBody);
  console.log('Attached Quran radio and Qibla enhancements');
}
// The visual fixes are loaded after the existing app and review enhancements.
const uiModule = 'www/islamiyat-ui-review.js';
const uiTag = '<script defer src="islamiyat-ui-review.js"></script>';
if (!fs.existsSync(uiModule)) throw new Error('Missing visual review module');
if (!html.includes(uiTag)) {
  const at = html.toLowerCase().lastIndexOf('</body>');
  if (at < 0) throw new Error('Missing closing body for UI module');
  html = html.slice(0, at) + uiTag + html.slice(at);
  console.log('Attached approved onboarding and UI review fixes');
}
// Additional content layer; preserve upstream bundle and navigation.
const contentModule = 'www/islamiyat-content-review.js';
const contentTag = '<script defer src="islamiyat-content-review.js"></script>';
if (!fs.existsSync(contentModule)) throw new Error('Missing content review module');
if (!html.includes(contentTag)) {
  const at = html.toLowerCase().lastIndexOf('</body>');
  if (at < 0) throw new Error('Missing closing body for content module');
  html = html.slice(0, at) + contentTag + html.slice(at);
  console.log('Attached sourced daily duas, Ramadan and location setup');
}
// The native player owns the spoken announcement and the adhan.
const separateReminder = /  if\(sound\?\.schedulePrayerReminder\)\{[\s\S]*?(?=  if\(sound&&p\.iqamaEnabled)/;
if (!separateReminder.test(html)) throw new Error('Expected the old standalone prayer reminder');
html = html.replace(separateReminder, '');
html = html.replace('  const reminder=new Date(at.getTime()-300000);\n', '');
const voiceFallback = 'if(!uri)throw Error();await sound.scheduleFullAzan({...alarm,soundType:"real",source:uri})';
if (!html.includes(voiceFallback)) throw new Error('Expected the offline voice fallback');
html = html.replace(voiceFallback,
  'if(uri)await sound.scheduleFullAzan({...alarm,soundType:"real",source:uri});else await sound.scheduleFullAzan({...alarm,soundType:"bundled",source:"ali_ahmad_mulla_hq"})');
html = html.replace('if(!sound||!voice)throw Error();',
  'if(!sound)throw Error();if(!voice){await sound.scheduleFullAzan({...alarm,soundType:"bundled",source:"ali_ahmad_mulla_hq"});continue}');
html = html.replace('await syncRealAzanSounds(),await scheduleAdhanNotifications(),showToast("مفعّلة")',
  'await syncRealAzanSounds(),showToast("مفعّلة")');
html = html.replace('adhanNotificationsEnabled&&(async()=>{try{await syncRealAzanSounds()}catch(t){}await scheduleAdhanNotifications()})();',
  'adhanNotificationsEnabled&&syncRealAzanSounds();');
const syncStart = html.indexOf('async function syncRealAzanSounds(){');
const syncEnd = html.indexOf('async function ensureAdhanSoundChannels()', syncStart);
if (syncStart < 0 || syncEnd < 0) throw new Error('Expected the previous audio synchronization');
html = html.slice(0, syncStart)
  + 'function syncRealAzanSounds(){if(adhanNotificationsEnabled)return scheduleAdhanNotifications().catch(()=>{});}'
  + html.slice(syncEnd);
const duaMenu = /<details class="dua-library-menu">\s*<summary([^>]*)>([^<]*)<\/summary>([\s\S]*?)<\/details>/;
if (!duaMenu.test(html)) throw new Error('Expected the dua library menu');
html = html.replace(duaMenu, (_, attributes, label, sections) =>
  '<button type="button" class="dua-library-launch" aria-haspopup="dialog" onclick="document.getElementById(\'dua-library-dialog\').showModal()"><span'+attributes+'>'+label+'</span></button>'
  + '<dialog id="dua-library-dialog" class="dua-library-menu" aria-labelledby="dua-library-heading" onclick="if(event.target.closest(\'.dua-cat-row\'))this.close()">'
  + '<header><h2 id="dua-library-heading">مكتبة الأدعية والأذكار</h2><form method="dialog"><button type="submit" aria-label="إغلاق">✕</button></form></header>'
  + sections + '</dialog>');
html = html.replace('<head>', `<head><style>
.dua-library-launch{display:block;width:100%;padding:12px;border:2px solid #674323;border-radius:12px;background:var(--card,#f7eedc);color:var(--text);font:inherit;font-weight:800;cursor:pointer}
#dua-library-dialog{box-sizing:border-box;width:min(90vw,440px);max-height:75vh;overflow:auto;padding:16px;direction:rtl;color:var(--text,#332014);background:var(--card,#fbf4e6);border:5px solid #59361f;border-radius:18px;animation:dua-frame-glow 2.6s ease-in-out infinite}
#dua-library-dialog::backdrop{background:#160b06a6}
#dua-library-dialog header{display:flex;align-items:center;justify-content:space-between;gap:12px}
#dua-library-dialog header h2{margin:0}
#dua-library-dialog header button{border:0;padding:8px 12px;border-radius:8px;background:#59361f;color:white;cursor:pointer}
@keyframes dua-frame-glow{0%,100%{box-shadow:0 0 6px 1px #9c5d2e,inset 0 0 5px #c48b49}50%{box-shadow:0 0 19px 5px #f0b864,inset 0 0 10px #f0b864}}
@media(prefers-reduced-motion:reduce){#dua-library-dialog{animation:none;box-shadow:0 0 10px #c48b49}}
</style>`);
fs.writeFileSync(file, html, 'utf8');
