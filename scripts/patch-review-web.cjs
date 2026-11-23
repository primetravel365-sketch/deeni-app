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
// Install the Qibla layout when building an integrated review bundle.
if (html.startsWith('<!-- islamiyat-review-integrated-html -->') &&
    !html.includes('class="qibla-direction-marker"')) {
  const qiblaEdits = [
  [
    "<div class=\"qibla-ribbon\"><p class=\"qibla-verse\" dir=\"rtl\">قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ ۖ فَلَنُوَلِّيَنَّكَ <strong>قِبْلَةً</strong> تَرْضَاهَا ۚ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ۚ وَحَيْثُ مَا كُنتُمْ فَوَلُّوا وُجُوهَكُمْ شَطْرَهُ ۗ</p><svg class=\"qibla-center-icon\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\">\n                  <rect x=\"6\" y=\"12\" width=\"28\" height=\"24\" rx=\"2\" fill=\"#161616\" stroke=\"var(--gold)\" stroke-width=\"1.6\"/>\n                  <rect x=\"6\" y=\"12\" width=\"28\" height=\"7\" fill=\"var(--gold)\" opacity=\"0.92\"/>\n                  <path d=\"M6 19 L34 19\" stroke=\"#161616\" stroke-width=\"0.8\"/>\n                  <rect x=\"17\" y=\"24\" width=\"6\" height=\"12\" fill=\"var(--gold)\" opacity=\"0.8\"/>\n                  <path d=\"M6 12 L20 4 L34 12 Z\" fill=\"#161616\" stroke=\"var(--gold)\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>\n                </svg></div>",
    "<img class=\"qibla-direction-marker\" alt=\"علامة اتجاه القبلة\" width=\"62\" height=\"62\" src=\"data:image/jpeg;base64,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\">\n          <button type=\"button\" class=\"qibla-verse-ticker\" dir=\"rtl\" aria-pressed=\"false\"\n            aria-label=\"إيقاف حركة شريط الآية أو استئنافها\"\n            onclick=\"this.setAttribute('aria-pressed',this.getAttribute('aria-pressed')==='false')\">\n            <span>قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ ۖ فَلَنُوَلِّيَنَّكَ قِبْلَةً تَرْضَاهَا ۚ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ۚ وَحَيْثُ مَا كُنتُمْ فَوَلُّوا وُجُوهَكُمْ شَطْرَهُ ۗ</span>\n          </button>"
  ],
  [
    "#qibla .qibla-ribbon{height:auto;max-width:420px;overflow:visible;padding:8px 12px;display:grid;justify-items:center;gap:4px}\n",
    ""
  ],
  [
    "#qibla .qibla-verse{color:#fff5d6;font:400 19px/1.75 Amiri,serif;text-align:center;margin:0;letter-spacing:normal;unicode-bidi:isolate}\n",
    ""
  ],
  [
    "#qibla .qibla-center-icon{width:56px;height:56px}\n",
    ""
  ],
  [
    "#qibla .qibla-verse strong{color:#ffe29a}\n",
    ""
  ],
  [
    "<head>",
    "<head><style>\n#qibla .qibla-direction-marker{display:block;object-fit:contain;margin:4px auto 5px;border-radius:7px}\n#qibla .qibla-verse-ticker{display:block;width:100%;max-width:420px;margin:0 auto;color:var(--text);\n  padding:0;border:0;border-block:1px solid var(--gold);background:transparent;overflow:hidden;\n  font:400 19px/1.8 Amiri,serif;cursor:pointer;text-align:left;direction:ltr}\n#qibla .qibla-verse-ticker span{direction:rtl;display:block;width:max-content;white-space:nowrap;\n  animation:qibla-verse-scroll 26s linear infinite}\n#qibla .qibla-verse-ticker[aria-pressed=\"true\"] span{animation-play-state:paused}\n@keyframes qibla-verse-scroll{from{transform:translateX(-100%)}to{transform:translateX(var(--qibla-ticker-width,420px))}}\n@supports(width:1cqw){\n  #qibla .qibla-verse-ticker{container-type:inline-size}\n  #qibla .qibla-verse-ticker span{--qibla-ticker-width:100cqw}\n}\n@media(prefers-reduced-motion:reduce){\n  #qibla .qibla-verse-ticker{overflow-x:auto}\n  #qibla .qibla-verse-ticker span{animation:none}\n}\n</style>"
  ]
];
  for (const [previous, next] of qiblaEdits) {
    if (html.split(previous).length !== 2) {
      throw new Error('Expected exactly one Qibla layout insertion point');
    }
    html = html.replace(previous, () => next);
  }
}
fs.writeFileSync(file, html, 'utf8');
