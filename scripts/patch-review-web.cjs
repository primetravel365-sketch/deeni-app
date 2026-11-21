// Applied to the checked-out web bundle before Capacitor copies it.
// The upstream HTML is larger than the GitHub Contents API editing limit.
// Keep patch assertions strict to avoid silent changes to unrelated code.
const fs = require('node:fs');
const file = 'www/index.html';
let html = fs.readFileSync(file, 'utf8');
const patches = [
  {
    reason: 'Avoid scheduling iqama twice when notification preferences are saved',
    oldText: 'adhanNotificationsEnabled&&(scheduleAdhanNotifications(),scheduleIqamaNotifications()),closePrayerNotifSettings()',
    newText: 'adhanNotificationsEnabled&&scheduleAdhanNotifications(),closePrayerNotifSettings()'
  },
  {
    reason: 'Remove call to native short-notification API which the Android plugin does not implement',
    oldText: 'try{const azn=getNativeAzanSound();azn&&azn.scheduleShortNotifications&&await azn.scheduleShortNotifications({configs:prayerSchedule.filter(p=>"shuroq"!==p.key).map(p=>({key:p.key,name:p.name,adhanNowEnabled:!1!==p.adhanNowEnabled,iqamaEnabled:!0===p.iqamaEnabled,beforeIqamaEnabled:!0===p.beforeIqamaEnabled,iqamahMinutes:p.iqamah||0,beforeIqamaMins:p.beforeIqamaMins||0}))})}catch(t){}',
    newText: ''
  }
];
for (const p of patches) {
  const occurrences = html.split(p.oldText).length - 1;
  if (occurrences !== 1) throw new Error('Patch assertion failed (' + p.reason + '): found ' + occurrences);
  html = html.replace(p.oldText, p.newText);
  console.log('Applied:', p.reason);
}
// Attach optional radio/mosque features without rewriting the 6-MB minified bundle.
const enhancementTag = '<script defer src="islamiyat-enhancements.js"></script>';
if (!fs.existsSync('www/islamiyat-enhancements.js')) {
  throw new Error('Missing Quran radio / Qibla enhancements module');
}
if (html.includes(enhancementTag)) {
  console.log('Review enhancements already attached');
} else {
  const closingBody = /<\\/body>/i;
  if (!closingBody.test(html)) throw new Error('Missing </body> insertion point');
  html = html.replace(closingBody, enhancementTag + '\\n</body>');
  console.log('Attached Quran radio and Qibla enhancements');
}
fs.writeFileSync(file, html, 'utf8');
