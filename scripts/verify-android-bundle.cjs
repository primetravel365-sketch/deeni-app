// Android bundle release-gate. No device required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base='android/app/src/main/assets/public';
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const scripts=['islamiyat-enhancements.js','islamiyat-ui-review.js','islamiyat-content-review.js'];
for(const name of scripts){
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
assert.ok(voices.length>=10,'Unexpected missing bundled muezzin files');
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
const contentReview=fs.readFileSync(path.join(base,'islamiyat-content-review.js'),'utf8');
assert.match(contentReview,/requestPermissions\(\)/,
 'User-initiated notification permission request is missing');
const radioReview=fs.readFileSync(path.join(base,'islamiyat-enhancements.js'),'utf8');
assert.match(radioReview,/player\.src=stations\[0\]\.url/,
 'Quran radio initial station must be assigned before playback');
console.log('Verified notification permissions and Quran radio first-station initialization.');
console.log('APK module and offline audio safety gates passed.');
