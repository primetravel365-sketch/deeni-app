// Android bundle release-gate. No device required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base='android/app/src/main/assets/public';
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const scripts=['islamiyat-enhancements.js','islamiyat-ui-review.js','islamiyat-content-review.js'];
const integrated=html.includes('<!-- islamiyat-review-integrated-html -->');
if(integrated){
  assert.ok(!html.includes('id="home-daily-dua"'), 'Removed daily dua control must stay absent');
  for(const id of ['ramadan-countdown','mushaf-reader']){
    assert.equal(html.split('id="'+id+'"').length-1,1,'Missing or duplicated screen control '+id);
  }
  assert.match(html,/scheduleFullAzan/,'Native adhan scheduling is missing');
}
if(!integrated) for(const name of scripts){
  assert.equal(html.split('<script defer src="'+name+'"></script>').length-1,1,
    'Missing or duplicated APK script: '+name);
  const source=fs.readFileSync(path.join(base,name),'utf8');
  assert.ok(source.length>500,'Unexpected empty script '+name);
  console.log('Verified copied Android module:',name);
}
const source=fs.readFileSync('android/app/src/main/java/com/deeni/app/AzanPlaybackService.java','utf8');
assert.match(source,/"content"\.equalsIgnoreCase\(local\.getScheme\(\)\)/,
  'Audio player must reject remote streaming URIs');
assert.match(source,/getIdentifier\(source, "raw", getPackageName\(\)\)/,
  'Offline audio must check for missing raw resource');
const audioDir='android/app/src/main/res/raw';
const files=fs.readdirSync(audioDir);
const voices=files.filter(x=>/^(azan_|sheikh_|yusuf_).*\.mp3$/i.test(x));
assert.ok(voices.length>=7,'Unexpected missing bundled muezzin files');
const removedVoices = ['sheikh_ahmed_nafees', 'sheikh_hafiz_ozcan', 'sheikh_abdulghaffar', 'yusuf_islam', 'sheikh_saber'];
for (const key of removedVoices) {
  assert.ok(!html.includes(key), 'Removed voice is still linked: '+key);
  for (const directory of [audioDir, path.join(base,'sounds/muezzins')]) {
    assert.ok(!fs.existsSync(path.join(directory,key+'.mp3')), 'Removed voice is still bundled: '+key);
  }
}
assert.ok(!fs.existsSync(path.join(base,'index.before_offline_muezzins.html')), 'Old preview is still bundled');
for(const file of voices){
  const stat=fs.statSync(path.join(audioDir,file));
  assert.ok(stat.size>10000,'Empty or invalid voice resource: '+file);
}
console.log('Verified',voices.length,'offline muezzin files (content and licensing still require review).');
const manifest=fs.readFileSync('android/app/src/main/AndroidManifest.xml','utf8');
assert.match(manifest,/android\.permission\.POST_NOTIFICATIONS/,
 'Android 13 notification permission missing from manifest');
assert.match(manifest,/android\.permission\.ACCESS_FINE_LOCATION/,
 'Precise-location permission missing from manifest');
const contentReview=integrated?html:fs.readFileSync(path.join(base,'islamiyat-content-review.js'),'utf8');
assert.match(contentReview,/requestPermissions\(\)/,
 'User-initiated notification permission request is missing');
const radioReview=integrated?html:fs.readFileSync(path.join(base,'islamiyat-enhancements.js'),'utf8');
assert.match(radioReview,/player\.src=stations\[0\]\.url/,
 'Quran radio initial station must be assigned before playback');
console.log('Verified notification permissions and Quran radio first-station initialization.');
const soundPlugin=fs.readFileSync('android/app/src/main/java/com/deeni/app/AzanSoundPlugin.java','utf8');
assert.match(soundPlugin,/call\.reject\("bundled adhan resource is missing:/,
 'The native scheduler must reject missing bundled voices before replacing alarms');
assert.match(soundPlugin,/call\.reject\("adhan voice must be an offline content URI"\)/,
 'The native scheduler must reject internet voices before replacing alarms');
assert.match(soundPlugin,/getCanonicalFile\(\)/,
 'Cached audio paths must be canonicalized to avoid traversal');
assert.match(soundPlugin,/getPath\(\)\.startsWith\(cache\.getPath\(\) \+ File\.separator\)/,
 'Cached audio must remain inside the app cache directory');
console.log('Verified native schedule rejection of invalid voices and path safety.');
const followupService=fs.readFileSync(
 'android/app/src/main/java/com/deeni/app/AzanPlaybackService.java','utf8');
const followupScheduler=fs.readFileSync(
 'android/app/src/main/java/com/deeni/app/AzanScheduler.java','utf8');
const followupPlugin=fs.readFileSync(
 'android/app/src/main/java/com/deeni/app/AzanSoundPlugin.java','utf8');
assert.match(followupService,/!"fajr"\.equals\(activePrayerKey\)/,
 'Fajr follow-up must never play with other prayers');
assert.match(followupService,/fajr_khayr_min_al_nawm/,
 'Fajr-only phrase needs its own dedicated raw resource');
assert.match(followupService,/lastPlayedDay/,
 'Fajr-only phrase must be guarded against duplicate playback');
assert.match(followupService,/now \+ 95000L >= deadline/,
 'Phrase must stop short of the actual iqama time');
assert.match(followupScheduler,/intent\.putExtra\("scheduledAtMillis", triggerAtMillis\)/,
 'Fajr follow-up must know the actual alarm occurrence');
assert.match(followupPlugin,/call\.getInt\("iqamaMinutes"\)/,
 'Fajr follow-up must use a real configured iqama interval');
console.log('Verified once-per-Fajr special phrase is gated after adhan and before iqama.');
console.log('APK module and offline audio safety gates passed.');

