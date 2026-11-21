/* Islamic App: offline daily duas, Ramadan section and location setup.
 * Preserves existing app content; no sensitive address is stored. */
(()=>{
'use strict';if(window.__islamiyatContent26)return;window.__islamiyatContent26=true;
const duas=[
{txt:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',source:'سورة البقرة: 201'},
{txt:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',source:'سورة طه: 25–26'},
{txt:'رَبِّ زِدْنِي عِلْمًا',source:'سورة طه: 114'},
{txt:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً',source:'سورة آل عمران: 8'},
{txt:'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',source:'سورة الأعراف: 23'},
{txt:'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ',source:'سورة إبراهيم: 40'},
{txt:'رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً إِنَّكَ سَمِيعُ الدُّعَاءِ',source:'سورة آل عمران: 38'},
{txt:'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا',source:'سورة البقرة: 250'},
{txt:'رَبِّ اغْفِرْ وَارْحَمْ وَأَنتَ خَيْرُ الرَّاحِمِينَ',source:'سورة المؤمنون: 118'},
{txt:'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا',source:'سورة آل عمران: 147'}
];
const css=document.createElement('style');css.textContent=`
#isl-content26-nav{position:fixed;left:12px;bottom:205px;z-index:2147482997;display:none;flex-direction:column;gap:6px}
#isl-content26-nav button{border:1px solid #c2a45a;border-radius:12px;background:#183c2e;color:#f9eed6;padding:9px 13px;font:14px system-ui;cursor:pointer}
#isl-content26-dialog[hidden]{display:none!important}
#isl-content26-dialog{position:fixed;inset:0;z-index:2147483004;display:flex;justify-content:center;align-items:center;background:#000b;padding:18px;direction:rtl;box-sizing:border-box}
#isl-content26-dialog article{box-sizing:border-box;border-radius:18px;border:1px solid #b89d56;background:#10281f;color:#f8efd8;padding:20px;max-width:480px;width:100%;max-height:85vh;overflow:auto;font:17px/1.85 system-ui}
#isl-content26-dialog h2{color:#ead49e}
#isl-content26-dialog button{font:inherit;background:#bd9b52;color:#182319;border:0;border-radius:10px;padding:8px 16px;margin:4px;cursor:pointer}
#isl-content26-dialog a{color:#f9dd91}
`;document.head.append(css);
const create=(tag,t)=>{const e=document.createElement(tag);if(t!==undefined)e.textContent=t;return e};
const nav=create('div');nav.id='isl-content26-nav';document.body.append(nav);
const overlay=create('div');overlay.id='isl-content26-dialog';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');const article=create('article');overlay.append(article);document.body.append(overlay);
let previousFocus=null;
function close(){overlay.hidden=true;previousFocus?.focus?.()}
function open(title){previousFocus=document.activeElement;article.replaceChildren(create('h2',title));const x=button('إغلاق',close);article.append(x);overlay.hidden=false;x.focus()}
overlay.addEventListener('click',e=>{if(e.target===overlay)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close()});
function button(t,fn){const b=create('button',t);b.type='button';b.addEventListener('click',fn);return b}
function today(){const now=new Date(),start=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());const idx=Math.floor(start/86400000)%duas.length;return duas[idx]}
function dua(){open('دعاء اليوم');const d=today();article.append(create('p',d.txt),create('p','المصدر: '+d.source),create('p','يتغير الدعاء مرة واحدة يوميًا بحسب تاريخ الجهاز، ويعمل دون إنترنت.'))}
function ramadan(){open('رمضان يجمعنا');article.append(create('p','ركن رمضان: الصيام، الدعاء، القرآن والقيام.'));const list=create('ul');for(const t of ['الإمساك والإفطار: راجع مواقيت الفجر والمغرب المحلية في صفحة الصلاة.','دعاء اليوم: متاح دون إنترنت مع ذكر المصدر.','قراءة القرآن: استخدم قسم القرآن الموجود في التطبيق.'])list.append(create('li',t));article.append(list);article.append(button('دعاء اليوم',dua))}
function prime(){open('برايم | PRIME');article.append(create('p','هذا القسم مخصص للمزايا المستقبلية. لا توجد خدمة اشتراك أو دفع مفعّلة حاليًا، ولن يتم تحصيل أي مبلغ.'))}
function links(){open('روابط دينية');article.append(create('p','الروابط الخارجية تحتاج إنترنت، وقد يتغير محتواها لدى الجهة المالكة.'));const ul=create('ul');const items=[['المسجد الحرام والمسجد النبوي — الرئاسة العامة للشؤون الدينية','https://prh.gov.sa/'],['مجمع الملك فهد لطباعة المصحف الشريف','https://qurancomplex.gov.sa/']];for(const [name,url] of items){const li=create('li'),a=create('a',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);ul.append(li)}article.append(ul);article.append(create('p','رابط «حي على الصلاة» لم يُحدد رسميًا بعد، لذلك لم أضع رابطًا غير موثوق.'))}
function locationSetup(){open('إعداد الموقع والتنبيهات');article.append(create('p','لتحديد مواقيت الصلاة بدقة، امنح إذن الموقع من النظام. لن نعرض رقم منزل تقديريًا، ولن نطلب استثناء البطارية دون موافقتك.'));const status=create('p','حالة الصلاحيات لم تُفحص بعد.');article.append(status);
article.append(button('طلب تحديد الموقع الدقيق',()=>{if(!navigator.geolocation){status.textContent='خدمة الموقع غير متوفرة.';return}navigator.geolocation.getCurrentPosition(p=>{const a=p.coords;status.textContent='تم تحديد الموقع بدقة تقريبية '+Math.round(a.accuracy)+' متر. يمكن استخدام الإحداثيات في حساب مواقيت الصلاة، دون حفظها في هذه النافذة.';window.dispatchEvent(new CustomEvent('islamiyat:location-updated',{detail:{latitude:a.latitude,longitude:a.longitude,accuracy:a.accuracy}}))},e=>{status.textContent=e.code===1?'تم رفض إذن الموقع. يمكنك تفعيله من إعدادات التطبيق.':'تعذر الحصول على الموقع. تحقق من GPS.'},{enableHighAccuracy:true,timeout:15000,maximumAge:30000})}));
const plugin=()=>window.Capacitor?.Plugins?.BatteryOptim;
article.append(button('التحقق من صلاحيات التنبيهات الدقيقة',async()=>{try{const api=plugin();if(!api?.canScheduleExactAlarms)throw Error('not available');const x=await api.canScheduleExactAlarms();status.textContent=x.allowed?'التنبيهات الدقيقة مسموحة.':'التنبيهات الدقيقة تحتاج سماحًا من إعدادات أندرويد.'}catch(_){status.textContent='لا يمكن قراءة حالة الصلاحية على هذا الجهاز.'}}));
article.append(button('فتح إعدادات التنبيهات الدقيقة',async()=>{try{const api=plugin();if(!api?.requestExactAlarmPermission)throw Error('not available');await api.requestExactAlarmPermission()}catch(_){status.textContent='لا يمكن فتح إعدادات التنبيهات الدقيقة تلقائيًا.'}}));
article.append(button('فتح إعدادات توفير البطارية',async()=>{try{const api=plugin();if(!api?.requestIgnoreBatteryOptimizations)throw Error('not available');await api.requestIgnoreBatteryOptimizations()}catch(_){status.textContent='افتح إعدادات التطبيق للتحكم في توفير البطارية.'}}));
}
for(const [label,fn] of [['🤲 دعاء اليوم',dua],['🌙 رمضان يجمعنا',ramadan],['✨ برايم',prime],['🔗 روابط دينية',links],['📍 الموقع والصلاحيات',locationSetup]])nav.append(button(label,fn));
function visible(e){return e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'}
function home(){const hash=location.hash.toLowerCase();if(/qibla|radio|ramadan|dua|profile|settings|prayer/.test(hash))return false;if(/home|main|index/.test(hash))return true;const screens=[...document.querySelectorAll('.page,.screen,[data-page],[id$="-page"],[id$="Page"]')].filter(visible);const active=screens.filter(e=>!screens.some(x=>x!==e&&e.contains(x)));if(!active.length)return false;const ids=active.map(e=>[e.id,e.className,e.dataset.page].join(' ').toLowerCase());if(ids.some(s=>/qibla|settings|radio|ramadan|dua|profile|prayer/.test(s)))return false;return ids.some(s=>/home|main|dashboard|index/.test(s))}
let pending=false;function refresh(){nav.style.display=home()?'flex':'none'}
new MutationObserver(()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;refresh()},650)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-page','hidden']});window.addEventListener('hashchange',refresh);window.addEventListener('popstate',refresh);refresh();
})();