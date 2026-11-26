// Apply the account, navigation and review UI changes to the integrated bundle.
const {createHash} = require('node:crypto');
module.exports = function primeReview(html) {
  const hash = createHash('sha256').update(html,'utf8').digest('hex');
  if (hash !== '9e797fcb397fb997cf62e40f8e3ffccce49ccac26261413a175238bbdbb37a5c') throw new Error('Islamiyat review bundle changed. Rebase the Prime UI patch.');
  const edits = [
  [
    97,
    97,
    ":is(#quick-menu-open,#prayer-quick-menu-open,.dua-library-launch,#dua-library-dialog){\n  border:2px solid #a67c35;\n  animation:islamiyat-frame-glow 2.8s ease-in-out infinite;\n}\n@keyframes islamiyat-frame-glow{\n  0%,100%{box-shadow:0 0 3px #9a6b29, inset 0 0 1px #d2a44a}\n  50%{box-shadow:0 0 14px #edc36c, inset 0 0 6px #d2a44a}\n}\n@media(prefers-reduced-motion:reduce){\n  :is(#quick-menu-open,#prayer-quick-menu-open,.dua-library-launch,#dua-library-dialog){animation:none!important;box-shadow:0 0 6px #d2a44a}\n}\n#account-prime-status:empty{display:none}\n</style><style>\n#account-panel{margin:0 0 1rem}\n#account-form label,#prayer-notif-rows>label{display:block;margin:.45rem 0;font-weight:700}\n#account-form input,#prayer-notif-selected{box-sizing:border-box;width:100%;padding:.65rem;border:1px solid var(--line);border-radius:10px;color:var(--text);background:var(--card);font:inherit}\n#account-form button{padding:.55rem .75rem;margin:.35rem 0;border:1px solid var(--line);border-radius:10px;color:var(--text);background:var(--card);font:inherit;cursor:pointer}\n#account-form [hidden],#prayer-notif-rows [hidden]{display:none!important}\n.account-actions{display:flex;flex-wrap:wrap;gap:.5rem}\n#account-status:empty{display:none}\n#prayer-notif-selected{margin-bottom:.75rem}\n</style><style>\n"
  ],
  [
    26291548,
    26291584,
    ""
  ],
  [
    26291803,
    26292533,
    ""
  ],
  [
    29677053,
    29677424,
    ""
  ],
  [
    29677716,
    29677716,
    "        <section class=\"card\" id=\"account-panel\">\n          <form id=\"account-form\">\n            <div id=\"account-fields\">\n              <label for=\"account-email\">البريد الإلكتروني</label>\n              <input id=\"account-email\" type=\"email\" autocomplete=\"username\" inputmode=\"email\" dir=\"ltr\">\n              <label for=\"account-password\">كلمة المرور</label>\n              <input id=\"account-password\" type=\"password\" autocomplete=\"current-password\">\n              <div class=\"account-actions\">\n                <button type=\"submit\" name=\"action\" value=\"login\">تسجيل الدخول</button>\n                <button type=\"submit\" name=\"action\" value=\"signup\">إنشاء حساب</button>\n              </div>\n              <label for=\"account-prime-code\">كود برايم أو هدية (اختياري)</label>\n              <input id=\"account-prime-code\" type=\"text\" autocomplete=\"off\" autocapitalize=\"characters\" spellcheck=\"false\" maxlength=\"32\" dir=\"ltr\">\n              <button type=\"submit\" name=\"action\" value=\"redeem\">تفعيل الكود</button>\n              <p id=\"account-prime-status\" role=\"status\"></p>\n              <details>\n                <summary>نسيت اسم المستخدم أو كلمة المرور؟</summary>\n                <p>بريدك الإلكتروني هو اسم المستخدم.</p>\n                <button type=\"submit\" name=\"action\" value=\"recover\">إرسال رابط إعادة تعيين كلمة المرور</button>\n              </details>\n            </div>\n            <div id=\"account-recovery\" hidden>\n              <label for=\"account-new-password\">كلمة المرور الجديدة</label>\n              <input id=\"account-new-password\" type=\"password\" autocomplete=\"new-password\" minlength=\"6\">\n              <button type=\"submit\" name=\"action\" value=\"reset\">حفظ كلمة المرور الجديدة</button>\n            </div>\n            <p id=\"account-status\" role=\"status\" aria-live=\"polite\"></p>\n          </form>\n        </section>\n"
  ],
  [
    33754141,
    33754231,
    " hero-night-times\"><span><span>منتصف الليل</span> <b id=\"ticker-midnight\">—</b></span><span><span>بداية الثلث الأخير</span> <b id=\"ticker-third\">—</b></span"
  ],
  [
    33770478,
    33771071,
    ""
  ],
  [
    34254160,
    34254588,
    ""
  ],
  [
    34264199,
    34264285,
    "يساعد هذا الإعداد على وصول تنبيهات الأذان وإن كان التطبيق مغلقًا، ولا سيما على أجهزة شاومي وأوبو وهواوي."
  ],
  [
    34266134,
    34266153,
    "closeCalcMethod("
  ],
  [
    34267158,
    34268511,
    ""
  ],
  [
    34269023,
    34269027,
    "لا يوجد"
  ],
  [
    34275198,
    34275210,
    "— نسخة تجريبية"
  ],
  [
    34281007,
    34281053,
    "let calculationReturnScreen=\"settings\";\nfunction goCalcMethod(){\n calculationReturnScreen=document.querySelector(\".screen.active\")?.id===\"prayers\"?\"prayers\":\"settings\";\n activate(\"calc-method\");\n}\nfunction closeCalcMethod(){activate(calculationReturnScreen"
  ],
  [
    34954541,
    34959547,
    "\nif(!t||null===qiblaBearingDeg||!qiblaCompassActive||null===smoothedHeadingDeg)return;\nconst e=(qiblaBearingDeg-smoothedHeadingDeg+360)%360;const previous=Number(t.dataset.rotation);const rotation=Number.isFinite(previous)?previous+((e-previous+180)%360+360)%360-180:e;t.dataset.rotation=String(rotation);t.style.transform=`rotate(${rotation}deg)`;const a=e>180?e-360:e,i=document.getElementById(\"qibla-ribbon-kaaba\");if(i){const t=Math.max(-180,Math.min(180,a));i.style.left=50+t/180*50+\"%\"}const n=document.getElementById(\"qibla-turn-arrow\"),o=document.getElementById(\"qibla-note\"),s=Math.min(e,360-e)<3;if(qiblaCompassActive&&o&&n)if(s)n.textContent=\"✓\",o.textContent=\"أنت متجه الآن نحو القبلة تمامًا\";else{const t=e<=180,a=Math.round(t?e:360-e);n.textContent=t?\"↻\":\"↺\",o.textContent=`استدر ${t?\"يمينًا\":\"يسارًا\"} بمقدار ${useWesternNumerals?a:toArabicDigits(a)}° حتى تستقر السجادة على القبلة`}if(s!==qiblaAligned){qiblaAligned=s;const t=document.querySelector(\".qibla-ribbon\"),e=document.querySelector(\".qibla-rug\"),a=document.getElementById(\"qibla-rug-wrap\");t&&t.classList.toggle(\"aligned\",s),e&&e.classList.toggle(\"aligned\",s),a&&a.classList.toggle(\"aligned\",s);const i=document.getElementById(\"qibla-align-banner\");i&&i.classList.toggle(\"show\",s&&qiblaCompassActive),s?(vibrateShort(),e&&e.classList.remove(\"misaligned\",\"flash\")):qiblaCompassActive&&e&&(e.classList.add(\"misaligned\"),e.classList.remove(\"flash\"),e.offsetWidth,e.classList.add(\"flash\"),setTimeout(()=>{e.classList.remove(\"flash\")},950))}}function vibrateShort(){try{navigator.vibrate&&navigator.vibrate(40)}catch(t){}}function maybeShowQiblaCompassButton(){const t=document.getElementById(\"qibla-compass-btn\");t&&!qiblaCompassActive&&(t.style.display=\"inline-block\")}async function enableQiblaCompass(){const t=document.getElementById(\"qibla-compass-btn\");try{if(\"undefined\"!=typeof DeviceOrientationEvent&&\"function\"==typeof DeviceOrientationEvent.requestPermission){if(\"granted\"!==await DeviceOrientationEvent.requestPermission())return void showToast(\"نحتاج إذن الحساسات لتفعيل البوصلة الحية — يمكنك تفعيله من إعدادات الهاتف ⚙️\")}window.addEventListener(\"deviceorientationabsolute\",handleQiblaOrientation,!0),window.addEventListener(\"deviceorientation\",handleQiblaOrientation,!0),qiblaCompassActive=!0,t&&(t.style.display=\"none\");const e=document.getElementById(\"qibla-note\");e&&(e.textContent=\"البوصلة الحية شغالة — لف بموبايلك حتى تستدير السجادة نحو القبلة تمامًا 🧭\"),applyQiblaPointerRotation(),showToast(\"تم تفعيل البوصلة الحية ✓\")}catch(t){showToast(\"تعذّر تفعيل حساس البوصلة على هذا الجهاز 🙏\")}}function handleQiblaOrientation(t){let e=null;if(\"number\"==typeof t.webkitCompassHeading?e=t.webkitCompassHeading:!0===t.absolute&&\"number\"==typeof t.alpha&&(e=(360-t.alpha)%360),null===e||isNaN(e))return;const now=performance.now();if(lastQiblaSample!==null&&now-lastQiblaSample<70)return;const elapsed=lastQiblaSample===null?0:Math.min(now-lastQiblaSample,200);lastQiblaSample=now;deviceHeadingDeg=e;if(smoothedHeadingDeg===null)smoothedHeadingDeg=e;else{const delta=((e-smoothedHeadingDeg+180)%360+360)%360-180;if(Math.abs(delta)<1)return;const change=delta*(1-Math.exp(-elapsed/420));const maxStep=45*elapsed/1000;smoothedHeadingDeg=(smoothedHeadingDeg+Math.max(-maxStep,Math.min(maxStep,change))+360)%360}const a=document.getElementById(\"qibla-heading-val\");if(a){const t=Math.round(null===smoothedHeadingDeg?deviceHeadingDeg:smoothedHeadingDeg);a.textContent=`${useWesternNumerals?t:toArabicDigits(t)}°`}applyQiblaPointerRotation()}function updateLocationUI(t,e){const a=t||\"—\",i=document.getElementById(\"pill-date-city\");i&&(i.textContent=`📍 ${a}`);const n=document.getElementById(\"ring-sub-city\");n&&(n.textContent=`📍 ${a}`);const o=document.getElementById(\"ring-sub-country\");o&&e&&(o.textContent=e);const s=document.getElementById(\"country-filter-chip\");s&&(s.textContent=t?e?`📍 ${a} — ${e}`:`📍 ${a}`:e?`📍 ${e}`:`📍 ${a}`);const r=document.getElementById(\"settings-location-sub\");r&&(r.textContent=e?`${a} — ${e} (موقع حقيقي)`:`${a} (موقع حقيقي)`),e&&applyIqamaGapsForCountry(e)}const LOCATIONIQ_KEY_STORAGE=\"deeni_locationiq_api_key\";function getLocationIqApiKey(){try{return(localStorage.getItem(LOCATIONIQ_KEY_STORAGE)||\"\").trim()}catch(t){return\"\"}"
  ],
  [
    34962703,
    34962731,
    ""
  ],
  [
    34970174,
    34970260,
    "يساعد هذا الإعداد على وصول تنبيهات الأذان وإن كان التطبيق مغلقًا، ولا سيما على أجهزة شاومي وأوبو وهواوي."
  ],
  [
    34974157,
    34974205,
    ""
  ],
  [
    34974526,
    34974526,
    "??4"
  ],
  [
    34974873,
    34974873,
    "  }\n  const iqamaMinutes=Number(p.iqamah);\n  const reminderMinutes=Number(p.beforeIqamaMins);\n  if(p.beforeIqamaEnabled!==false&&reminderMinutes>0&&reminderMinutes<iqamaMinutes){\n   const reminderAt=new Date(at.getTime()+(iqamaMinutes-reminderMinutes)*60000);\n   if(reminderAt.getTime()>Date.now())pending.push({\n    id:350+index,title:\"تنبيه قبل الإقامة\",body:p.name,\n    schedule:{at:reminderAt,allowWhileIdle:true}\n   });\n"
  ],
  [
    34975592,
    34975592,
    "if(at.getTime()>Date.now())"
  ],
  [
    34975796,
    34975881,
    ""
  ],
  [
    36229893,
    36232331,
    "`<label for=\"prayer-notif-selected\">اختر الصلاة</label>\n  <select id=\"prayer-notif-selected\">${e.map(p=>`<option value=\"${p.key}\">${p.name}</option>`).join(\"\")}</select>`+e.map(t=>`\\n      <div class=\"card\" data-prayer-notif=\"${t.key}\" hidden>\\n        <div class=\"setting-row\" style=\"border-bottom:none; padding:8px 0;\">\\n          <div><div class=\"setting-label\" style=\"font-size:13px;\">🌙 الأذان</div></div>\\n          <div style=\"display:flex; align-items:center; gap:8px;\"><div class=\"muezzin-preview-btn\" id=\"pn-adhannow-preview-${t.key}\" tabindex=\"0\" role=\"button\" aria-label=\"تجربة صوت أذان ${t.name}\" onclick=\"previewAdhanNowRow('${t.key}', event)\">▶</div><div class=\"perm-toggle ${!1!==t.adhanNowEnabled?\"on\":\"\"}\" id=\"pn-adhannow-toggle-${t.key}\" tabindex=\"0\" role=\"switch\" aria-checked=\"${!1!==t.adhanNowEnabled}\" onclick=\"togglePrayerNotifSwitch('${t.key}', 'pn-adhannow-toggle-')\"><div class=\"perm-toggle-knob\"></div></div></div>\\n        </div>\\n        <div class=\"setting-row\" style=\"border-bottom:none; padding:8px 0;\">\\n          <div><div class=\"setting-label\" aria-hidden=\"true\">🕌</div></div>\\n          <div style=\"display:flex; align-items:center; gap:8px;\"><div class=\"muezzin-preview-btn\" id=\"pn-toggle-preview-${t.key}\" tabindex=\"0\" role=\"button\" aria-label=\"تجربة صوت الإقامة\" onclick=\"previewIqamaRow('${t.key}', event)\">▶</div><div class=\"perm-toggle ${!1!==t.iqamaEnabled?\"on\":\"\"}\" id=\"pn-toggle-${t.key}\" tabindex=\"0\" role=\"switch\" aria-label=\"الإقامة\" aria-checked=\"${!1!==t.iqamaEnabled}\" onclick=\"togglePrayerNotifSwitch('${t.key}', 'pn-toggle-')\"><div class=\"perm-toggle-knob\"></div></div></div>\\n        </div>\\n        <div class=\"setting-row\" style=\"border-bottom:none; padding:8px 0 4px;\">\\n          <div><div class=\"setting-label\" style=\"font-size:13px;\">⏰ تنبيه قبل الإقامة</div></div>\\n          <div style=\"display:flex; align-items:center; gap:8px;\"><div class=\"muezzin-preview-btn\" id=\"pn-before-iqama-preview-${t.key}\" tabindex=\"0\" role=\"button\" aria-label=\"تجربة تنبيه ما قبل الإقامة\" onclick=\"previewBeforeIqamaRow('${t.key}', event)\">▶</div><div class=\"perm-toggle ${!1!==t.beforeIqamaEnabled?\"on\":\"\"}\" id=\"pn-before-iqama-toggle-${t.key}\" tabindex=\"0\" role=\"switch\" aria-checked=\"${!1!==t.beforeIqamaEnabled}\" onclick=\"togglePrayerNotifSwitch('${t.key}', 'pn-before-iqama-toggle-')\"><div class=\"perm-toggle-knob\"></div></div></div>\\n        </div>\\n      </div>`).join(\"\");\n  const select=t.querySelector('#prayer-notif-selected');\n  const update=()=>t.querySelectorAll('[data-prayer-notif]').forEach(row=>{row.hidden=row.dataset.prayerNotif!==select.value});\n  select.addEventListener('change',update);update();\n"
  ],
  [
    36456712,
    36456727,
    "realTimesLoaded&&!window.Capacitor?.isNativePlatform"
  ],
  [
    45493757,
    45494131,
    ""
  ],
  [
    45534486,
    45534486,
    ">\n(() => {\n  const email = document.getElementById('account-email');\n  const password = document.getElementById('account-password');\n  const status = document.getElementById('account-status');\n  const primeCode = document.getElementById('account-prime-code');\n  const primeStatus = document.getElementById('account-prime-status');\n  const fields = document.getElementById('account-fields');\n  const recovery = document.getElementById('account-recovery');\n  const form = document.getElementById('account-form');\n  const params = new URLSearchParams(location.hash.slice(1));\n  let session = null;\n  let recoveryToken = params.get('type') === 'recovery' ? params.get('access_token') : null;\n  if (recoveryToken) {\n    history.replaceState(history.state, '', location.pathname + location.search);\n    fields.hidden = true;\n    recovery.hidden = false;\n    window.showIslamiyatSplashThen('onboarding');\n  }\n\n  async function request(path, method, body, token) {\n    const headers = {apikey: SUPABASE_KEY, 'Content-Type': 'application/json'};\n    if (token) headers.Authorization = 'Bearer ' + token;\n    const reply = await fetch(SUPABASE_URL + '/auth/v1/' + path, {\n      method, headers, body: JSON.stringify(body), signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(12000) : undefined\n    });\n    if (!reply.ok) throw new Error('Account request failed');\n    const content = await reply.text();\n    return content ? JSON.parse(content) : {};\n  }\n\n  async function redeemPrimeCode() {\n    if (!session?.access_token) {\n      primeStatus.textContent = 'سجّل الدخول لتفعيل الكود.';\n      return;\n    }\n    try {\n      const code = primeCode.value.trim();\n      if (!/^[0-9a-f]{32}$/i.test(code)) throw new Error('Invalid code');\n      const response = await fetch(SUPABASE_URL + '/rest/v1/rpc/islamiyat_redeem_prime', {\n        method:'POST',\n        headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},\n        body:JSON.stringify({p_code:code})\n      });\n      if (!response.ok) throw new Error('Redemption unavailable');\n      const {expires_at} = await response.json();\n      primeStatus.replaceChildren();\n      if (expires_at) primeStatus.append('برايم مفعّل حتى', ' ', new Intl.DateTimeFormat(document.documentElement.lang).format(new Date(expires_at)));\n      else primeStatus.textContent = 'برايم مفعّل دون تاريخ انتهاء.';\n      primeCode.value = '';\n    } catch {\n      primeStatus.textContent = 'الكود غير متاح أو تعذّر التحقق منه.';\n    }\n  }\n\n  form.addEventListener('submit', async event => {\n    event.preventDefault();\n    if (form.dataset.busy) return;\n    const action = event.submitter?.value || 'login';\n    const requiresPassword = action === 'login' || action === 'signup';\n    if (action !== 'reset' && action !== 'redeem' && (!email.value.trim() || !email.reportValidity())) {\n      email.focus(); return;\n    }\n    if (requiresPassword && (!password.value || !password.reportValidity())) {\n      password.focus(); return;\n    }\n    form.dataset.busy = 'true';\n    status.textContent = '';\n    try {\n      if (action === 'redeem') await redeemPrimeCode();\n      else if (action === 'reset') {\n        if (!recoveryToken) throw new Error('Recovery session missing');\n        const next = document.getElementById('account-new-password');\n        if (next.value.length < 6 || !next.reportValidity()) { next.focus(); return; }\n        await request('user', 'PUT', {password: next.value}, recoveryToken);\n        next.value = '';\n        recoveryToken = null;\n        recovery.hidden = true;\n        fields.hidden = false;\n        status.textContent = 'تم تحديث كلمة المرور.';\n      } else if (action === 'recover') {\n        const target = location.protocol === 'https:' && !window.Capacitor?.isNativePlatform()\n          ? '?redirect_to=' + encodeURIComponent(location.origin + location.pathname) : '';\n        await request('recover' + target, 'POST', {email: email.value.trim()});\n        status.textContent = 'تحقّق من بريدك الإلكتروني للمتابعة.';\n      } else {\n        const credentials = {email: email.value.trim(), password: password.value};\n        const response = await request(action === 'signup' ? 'signup' : 'token?grant_type=password', 'POST', credentials);\n        session = response.access_token ? response : null;\n        if (session && primeCode.value.trim()) await redeemPrimeCode();\n        status.textContent = session?.access_token ? 'تم تسجيل الدخول.' : 'تحقّق من بريدك الإلكتروني للمتابعة.';\n      }\n    } catch {\n      status.textContent = 'تعذّر إكمال الطلب. تحقّق من بياناتك واتصالك بالإنترنت.';\n    } finally {\n      password.value = '';\n      delete form.dataset.busy;\n    }\n  });\n})();\n</script>\n<script"
  ]
];
  for (let index = edits.length - 1; index >= 0; index--) {
    const [start, end, content] = edits[index];
    html = html.slice(0,start) + content + html.slice(end);
  }
  return html;
};
