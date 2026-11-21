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
console.log('APK module and offline audio safety gates passed.');
