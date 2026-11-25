// Apply the V1 review changes after the existing web bundle integration.
module.exports = function applyV1Review(html) {
  const replacements = [
  [
    "  font-family:'Cairo',sans-serif;font-weight:800;font-size:20px;letter-spacing:.3px;",
    "  font-family:'Cairo',sans-serif;font-weight:800;font-size:clamp(28px,9vw,44px);line-height:1.5;letter-spacing:.3px;"
  ],
  [
    ".splash-sub{font-family:'Amiri',serif;font-size:14px;font-weight:400;color:#d9bd77;margin-top:2px}",
    ".splash-sub{font-family:'Amiri',serif;font-size:clamp(22px,6vw,30px);line-height:1.55;font-weight:400;color:#d9bd77;margin-top:2px}"
  ],
  [
    "@keyframes splashTextIn{",
    "@media (max-height:480px) {\n  .splash-core{width:min(72vw,42vh,330px);margin-top:-64px}\n  .splash-label{top:calc(50% + min(36vw,21vh,165px) - 22px)}\n}\n@keyframes splashTextIn{"
  ],
  [
    "const APP_VERSION=\"v52\"",
    "const APP_VERSION=\"V1 إصدار تجريبي\""
  ],
  [
    "<div class=\"setting-row\" style=\"border-bottom:none;\"><div><div class=\"setting-label\">إصدار التطبيق</div><div class=\"setting-sub\">الرقم ده بيتغيّر مع كل تحديث — قارنه بالرقم المكتوب في رسالتي</div></div>",
    "<div class=\"setting-row\" style=\"border-bottom:none;\"><div><div class=\"setting-label\">إصدار التطبيق</div></div>"
  ],
  [
    "        <div id=\"onboarding-link\" style=\"display:none;\">\n          <div class=\"section-label\" style=\"margin-top:0;\">كود المزامنة</div>\n          <div class=\"surah-search\"><input type=\"text\" id=\"onb-code\" placeholder=\"اكتب الكود اللي ظهرلك في الجهاز التاني...\" style=\"letter-spacing:1px;\"></div>\n          <div class=\"tasbih-btn\" style=\"margin-top:10px;\" tabindex=\"0\" role=\"button\" onclick=\"submitOnbLinkCode()\">ربط الحساب</div>\n          <div style=\"text-align:center; margin-top:12px;\"><span style=\"font-size:12px; color:var(--green); cursor:pointer;\" tabindex=\"0\" role=\"button\" onclick=\"hideOnbLinkCode()\">رجوع لتسجيل اسم جديد</span></div>\n        </div>\n\n        <div id=\"onboarding-result\" style=\"display:none;\">\n          <div class=\"card\" style=\"text-align:center; margin-top:10px;\">\n            <div style=\"font-size:12.5px; color:var(--text-dim); margin-bottom:10px;\">كود المزامنة الخاص بك — احفظه لتتمكن من فتح نفس حسابك من أي جهاز آخر</div>\n            <div class=\"onb-code-box\" id=\"onb-result-code\">—</div>\n            <div class=\"tasbih-btn\" style=\"margin-bottom:0;\" tabindex=\"0\" role=\"button\" onclick=\"copyOnbCode()\">نسخ الكود</div>\n          </div>\n          <div class=\"tasbih-btn\" style=\"margin-top:14px; background:var(--gold);\" tabindex=\"0\" role=\"button\" onclick=\"finishOnboarding()\">تم، متابعة للتطبيق ›</div>\n        </div>\n",
    ""
  ],
  [
    "async function supabaseRpc(t,e){const a=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${t}`,{method:\"POST\",headers:{\"Content-Type\":\"application/json\",apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},body:JSON.stringify(e)});if(!a.ok)throw new Error(\"supabase-error-\"+a.status);return a.json()}function saveLocalProfile(t){try{localStorage.setItem(\"deeni_profile\",JSON.stringify(t))}catch(t){}}function loadLocalProfile(){try{const t=localStorage.getItem(\"deeni_profile\");return t?JSON.parse(t):null}catch(t){return null}}function resetLocalProfile(){try{localStorage.removeItem(\"deeni_profile\")}catch(t){}showToast(\"تم مسح البيانات — سيُعيد التطبيق تحميل نفسه الآن…\"),setTimeout(()=>{location.reload()},900)}function selectOnbGender(t){onbSelectedGender=t,document.getElementById(\"onb-gender-male\").classList.toggle(\"sel\",\"male\"===t),document.getElementById(\"onb-gender-female\").classList.toggle(\"sel\",\"female\"===t)}function showOnbLinkCode(){document.getElementById(\"onboarding-new\").style.display=\"none\",document.getElementById(\"onboarding-link\").style.display=\"block\"}function hideOnbLinkCode(){document.getElementById(\"onboarding-link\").style.display=\"none\",document.getElementById(\"onboarding-new\").style.display=\"block\"}function setOnbBackVisible(t){const e=document.getElementById(\"onb-back-btn\");e&&(e.style.visibility=t?\"visible\":\"hidden\")}function cancelProfileEdit(){onbEditMode=!1,setOnbBackVisible(!1),activate(\"settings\")}async function submitOnboarding(){const t=document.getElementById(\"onb-name\").value.trim();if(t)if(onbSelectedGender){showToast(\"بنحفظ بياناتك…\");try{if(onbEditMode&&userProfile&&userProfile.syncCode){await supabaseRpc(\"update_profile\",{p_code:userProfile.syncCode,p_name:t,p_gender:onbSelectedGender});userProfile={name:t,gender:onbSelectedGender,syncCode:userProfile.syncCode};saveLocalProfile(userProfile);try{localStorage.setItem(\"deeni_onboarding_completed_v2\",\"1\")}catch(t){}applyGreeting();updateProfileSettingsUI();showToast(\"تم تحديث بياناتك ✓\");onbEditMode=!1;setOnbBackVisible(!1);return void activate(\"settings\")}try{localStorage.setItem(\"deeni_onboarding_completed_v2\",\"1\")}catch(t){}applyGreeting();updateProfileSettingsUI();const e=await supabaseRpc(\"create_profile\",{p_name:t,p_gender:onbSelectedGender}),a=\"string\"==typeof e?e:String(e);userProfile={name:t,gender:onbSelectedGender,syncCode:a},saveLocalProfile(userProfile);try{localStorage.setItem(\"deeni_onboarding_completed_v2\",\"1\")}catch(t){}document.getElementById(\"onb-result-code\").textContent=a,document.getElementById(\"onboarding-new\").style.display=\"none\",document.getElementById(\"onboarding-result\").style.display=\"block\"}catch(t){showToast(\"لا يمكننا حفظ بياناتك الآن — يلزم اتصال إنترنت فعّال (افتح الملف في متصفح متصل بالإنترنت) 📡\")}}else showToast('اختار \"أخ\" أو \"أخت\" الأول 🙏');else showToast(\"من فضلك اكتب اسمك الأول 🙏\")}async function submitOnbLinkCode(){const t=document.getElementById(\"onb-code\").value.trim().toUpperCase();if(t){showToast(\"بندور على بياناتك…\");try{const e=await supabaseRpc(\"get_profile_by_code\",{p_code:t});if(!Array.isArray(e)||!e.length)return void showToast(\"الكود ده مش موجود — تأكد إنك كاتبه صح 📡\");userProfile={name:e[0].name,gender:e[0].gender,syncCode:t},saveLocalProfile(userProfile),applyGreeting(),updateProfileSettingsUI(),showToast(`أهلًا بيك تاني، ${e[0].name} ✓`),hideOnbLinkCode(),goHome()}catch(t){showToast(\"لا يمكننا التحقق من الكود الآن — يلزم اتصال إنترنت فعّال 📡\")}}else showToast(\"اكتب الكود الأول 🙏\")}function copyOnbCode(){const t=document.getElementById(\"onb-result-code\").textContent;navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t).then(()=>showToast(\"تم نسخ الكود ✓\")).catch(()=>showToast(\"انسخ الكود يدويًا\")):showToast(\"انسخ الكود يدويًا: \"+t)}function finishOnboarding(){document.getElementById(\"onboarding-result\").style.display=\"none\",document.getElementById(\"onboarding-new\").style.display=\"block\",applyGreeting(),updateProfileSettingsUI(),showOnbWelcomeSplash()}",
    "function saveLocalProfile(t){try{localStorage.setItem(\"deeni_profile\",JSON.stringify(t))}catch(t){}}function loadLocalProfile(){try{const raw=localStorage.getItem(\"deeni_profile\");if(!raw)return null;const old=JSON.parse(raw);const profile={name:old.name,gender:old.gender};if(\"syncCode\" in old)saveLocalProfile(profile);return profile}catch(t){return null}}function resetLocalProfile(){try{localStorage.removeItem(\"deeni_profile\")}catch(t){}showToast(\"تم مسح البيانات — سيُعيد التطبيق تحميل نفسه الآن…\"),setTimeout(()=>{location.reload()},900)}function selectOnbGender(t){onbSelectedGender=t,document.getElementById(\"onb-gender-male\").classList.toggle(\"sel\",\"male\"===t),document.getElementById(\"onb-gender-female\").classList.toggle(\"sel\",\"female\"===t)}function setOnbBackVisible(t){const e=document.getElementById(\"onb-back-btn\");e&&(e.style.visibility=t?\"visible\":\"hidden\")}function cancelProfileEdit(){onbEditMode=!1,setOnbBackVisible(!1),activate(\"settings\")}function submitOnboarding(){\n const name=document.getElementById(\"onb-name\").value.trim();\n if(!name)return showToast(\"اكتب اسمك\");\n if(!onbSelectedGender)return showToast(\"اختر النوع\");\n userProfile={name,gender:onbSelectedGender};\n saveLocalProfile(userProfile);\n try{localStorage.setItem(\"deeni_onboarding_completed_v2\",\"1\")}catch{}\n applyGreeting();updateProfileSettingsUI();\n if(onbEditMode){cancelProfileEdit();return;}\n showOnbWelcomeSplash();\n}\n"
  ],
  [
    "function updateProfileSettingsUI(){const t=document.getElementById(\"settings-profile-sub\");t&&(t.textContent=userProfile&&userProfile.name?`${userProfile.name} — كود المزامنة: ${userProfile.syncCode}`:\"لم تُسجِّل اسمك بعد\")}function openProfileSettings(){onbEditMode=!0,setOnbBackVisible(!0),document.getElementById(\"onboarding-result\").style.display=\"none\",document.getElementById(\"onboarding-link\").style.display=\"none\",document.getElementById(\"onboarding-new\").style.display=\"block\",document.getElementById(\"onb-name\").value=userProfile?userProfile.name:\"\",userProfile?selectOnbGender(userProfile.gender):(onbSelectedGender=null,document.getElementById(\"onb-gender-male\").classList.remove(\"sel\"),document.getElementById(\"onb-gender-female\").classList.remove(\"sel\")),activate(\"onboarding\")}function enterIslamiyat(){activate(\"home\")}\n",
    "function updateProfileSettingsUI(){const t=document.getElementById(\"settings-profile-sub\");t&&(t.textContent=userProfile&&userProfile.name?`${userProfile.name}`:\"لم تُسجِّل اسمك بعد\")}function openProfileSettings(){onbEditMode=!0,setOnbBackVisible(!0),document.getElementById(\"onboarding-new\").style.display=\"block\",document.getElementById(\"onb-name\").value=userProfile?userProfile.name:\"\",userProfile?selectOnbGender(userProfile.gender):(onbSelectedGender=null,document.getElementById(\"onb-gender-male\").classList.remove(\"sel\"),document.getElementById(\"onb-gender-female\").classList.remove(\"sel\")),activate(\"onboarding\")}function enterIslamiyat(){activate(\"home\")}\n"
  ],
  [
    "        <div class=\"privacy-point\"><div class=\"ticon\">🗄️</div><div class=\"ttext\"><b>تخزين آمن.</b> بيانات حسابك (الاسم والنوع) مخزَّنة في قاعدة بيانات محمية، والوصول إليها يتم فقط بكود المزامنة الخاص بك الذي تحتفظ به — لا يوجد نظام دخول عام يمكنه رؤية بيانات أي شخص آخر.</div></div>",
    "        <div class=\"privacy-point\"><div class=\"ticon\">🗄️</div><div class=\"ttext\"><b>بيانات الملف الشخصي.</b> يُحفظ الاسم والنوع على هذا الجهاز.</div></div>"
  ],
  [
    "        <div class=\"privacy-point\" style=\"margin-bottom:6px;\"><div class=\"ticon\">🕊️</div><div class=\"ttext\"><b>بياناتك بين يديك.</b> يمكنك تغيير اسمك أو إيقاف كود المزامنة في أي وقت من الإعدادات ← الحساب.</div></div>",
    "        <div class=\"privacy-point\" style=\"margin-bottom:6px;\"><div class=\"ticon\">🕊️</div><div class=\"ttext\"><b>بياناتك بين يديك.</b> يمكنك تعديل بيانات ملفك الشخصي في أي وقت من الإعدادات ← الحساب.</div></div>"
  ],
  [
    "async function fetchRealPrayerTimes(){if(!userCoords)return;const t=new Date,e=`${pad2(t.getDate())}-${pad2(t.getMonth()+1)}-${t.getFullYear()}`,a=aladhanMethodIds[selectedMethod]??4;try{const t=await fetch(`https://api.aladhan.com/v1/timings/${e}?latitude=${userCoords.lat}&longitude=${userCoords.lon}&method=${a}`);if(!t.ok)throw new Error(\"http-error\");const i=await t.json(),n=i?.data?.timings;if(!n)throw new Error(\"empty\");applyRealTimings(n),realTimesLoaded=!0,showToast(\"تم تحديث مواقيت الصلاة بموقعك الفعلي ✓\"),adhanNotificationsEnabled&&scheduleAdhanNotifications()}catch(t){showToast(\"لا يمكننا جلب مواقيت الصلاة الآن — يلزم اتصال إنترنت فعّال (افتح الملف في متصفح متصل بالإنترنت) 📡\")}}",
    "let prayerTimingRequest=0;\nasync function fetchRealPrayerTimes(){\n if(!userCoords)return;\n const {lat,lon}=userCoords;\n const method=aladhanMethodIds[selectedMethod]??4;\n const request=++prayerTimingRequest;\n const date=new Date();\n const day=[pad2(date.getDate()),pad2(date.getMonth()+1),date.getFullYear()].join(\"-\");\n const cacheKey=\"isl-prayer-day-v1\";\n const key=[lat,lon,method,day,Intl.DateTimeFormat().resolvedOptions().timeZone].join(\"/\");\n const current=()=>request===prayerTimingRequest&&userCoords?.lat===lat&&userCoords?.lon===lon&&(aladhanMethodIds[selectedMethod]??4)===method;\n const apply=(timings)=>{\n  if(!current())return false;\n  if(![\"Fajr\",\"Sunrise\",\"Dhuhr\",\"Asr\",\"Maghrib\",\"Isha\"].every(name=>/^(?:[01]\\d|2[0-3]):[0-5]\\d(?:\\s|$)/.test(timings?.[name]||\"\")))return false;\n  applyRealTimings(timings);realTimesLoaded=true;\n  if(adhanNotificationsEnabled)scheduleAdhanNotifications();\n  return true;\n };\n realTimesLoaded=false;\n try{\n  const response=await fetch(`https://api.aladhan.com/v1/timings/${day}?latitude=${lat}&longitude=${lon}&method=${method}`);\n  if(!response.ok)throw Error(\"Prayer timing service unavailable\");\n  const timings=(await response.json())?.data?.timings;\n  if(!current())return;\n  if(!apply(timings))throw Error(\"Invalid prayer timings\");\n  try{localStorage.setItem(cacheKey,JSON.stringify({key,timings}))}catch{}\n }catch{\n  if(!current())return;\n  try{const saved=JSON.parse(localStorage.getItem(cacheKey));if(saved?.key===key&&apply(saved.timings))return;}catch{}\n  showToast(\"تعذّر تحديث مواقيت الصلاة\");\n }\n}\n"
  ],
  [
    "if(sound&&adhanNotificationsEnabled&&userCoords&&!realTimesLoaded)return;",
    "if(adhanNotificationsEnabled&&(!userCoords||!realTimesLoaded))return;"
  ],
  [
    "?lat=${t}&lon=${e}&format=jsonv2&addressdetails=1&accept-language=ar",
    "?lat=${t}&lon=${e}&format=jsonv2&addressdetails=1&accept-language=${encodeURIComponent(appLanguage)}"
  ],
  [
    ")}&lat=${t}&lon=${e}&format=json&addressdetails=1&accept-language=ar",
    ")}&lat=${t}&lon=${e}&format=json&addressdetails=1&accept-language=${encodeURIComponent(appLanguage)}"
  ],
  [
    "aria-label=\"${t.name}\" onclick=\"openDuaCategory",
    "data-dua-category=\"${t.slug}\" aria-label=\"${t.name}\" onclick=\"openDuaCategory"
  ],
  [
    "document.getElementById(\"dua-category-title\").textContent=e.name",
    "document.getElementById(\"dua-category-title\").dataset.duaCategory=e.slug,document.getElementById(\"dua-category-title\").textContent=e.name"
  ],
  [
    "المحتوى الموثّق لتصنيف \"${t.name}\" قيد الإضافة 🕊️<br>هنكمله بمصادر موثوقة زي حصن المسلم قريبًا.",
    "المحتوى الموثّق للمكتبة قيد الإضافة."
  ]
];
  for (const [before, after] of replacements) {
    if (html.split(before).length !== 2) {
      throw new Error('V1 review input changed near: ' + before.slice(0, 120));
    }
    html = html.replace(before, () => after);
  }
  return html;
};
