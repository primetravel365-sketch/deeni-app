/* Visual review layer: onboarding, dark-mode visibility and home-only quick access.
   Additive and reversible: leaves original identity forms and settings intact. */
(() => {
  'use strict';
  if (window.__islUiReview26) return;
  window.__islUiReview26 = true;
  const style = document.createElement('style');
  style.textContent = `
    #isl-greeting26 { position:fixed;inset:0;z-index:2147483002;direction:rtl;
      background:radial-gradient(ellipse at 50% 8%,#234d37 0%,#08140f 48%,#030806 100%);
      color:#f8efd5;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;
      font-family:system-ui,serif;text-align:center; }
    #isl-greeting26[hidden]{display:none!important}
    #isl-greeting26 .isl-arch {max-width:430px;width:100%;border:2px solid #a88b43;
      border-radius:190px 190px 22px 22px / 150px 150px 22px 22px;
      box-shadow:inset 0 0 0 5px #142f24,0 0 35px #b79b3433;padding:60px 25px 28px;
      background:repeating-linear-gradient(45deg,#122b2225 0 12px,#304d2c18 12px 13px); }
    #isl-greeting26 .isl-lantern {font-size:48px;filter:drop-shadow(0 0 15px #cfa846a8)}
    #isl-greeting26 h1{color:#ead29a;font-size:clamp(29px,8vw,43px);line-height:1.7;margin:10px 0}
    #isl-greeting26 p{color:#f3eee2;font-size:18px;line-height:1.9}
    #isl-greeting26 button{cursor:pointer;background:#bb9e5a;color:#111c14;
      border:0;border-radius:14px;padding:12px 32px;margin:12px 5px;font-size:18px;font-weight:700}
    #isl-greeting26 .isl-skip{display:block;margin:10px auto;color:#e5d5a4;background:transparent;
      padding:8px;border:0;text-decoration:underline;font-size:14px}
    .isl-ui-dark-fix [class*="home-video" i] :is(h1,h2,h3,p,span),
    .isl-ui-dark-fix [class*="quick-access" i] :is(h2,h3,p,span),
    .isl-ui-dark-fix [class*="need-today" i] :is(h2,h3,p,span),
    .isl-ui-dark-fix [class*="today-needs" i] :is(h2,h3,p,span) {color:#faf4e7!important}
    .isl-ui-dark-fix [class*="quick-access" i] button,
    .isl-ui-dark-fix [class*="need-today" i] button {color:#faf4e7!important;border-color:#9b9b88!important}
    .isl-ui-dark-fix [class*="need-today" i] > *,
    .isl-ui-dark-fix [class*="quick-access" i] > * {opacity:1!important;visibility:visible!important}
    @media(prefers-reduced-motion:reduce){#isl-greeting26 *{animation:none!important;transition:none!important}}
  `;
  document.head.append(style);
  const ready = () => {
    const firstRunKey = 'islamiyat-greeting-review-2026-v1';
    let greeted = false;
    try { greeted = localStorage.getItem(firstRunKey) === 'done'; } catch (_) {}
    // The original welcome/name/gender screens are never removed. The approved
    // greeting is a one-time layer above them; Continue reveals existing onboarding.
    const alreadyGreeting = Array.from(document.querySelectorAll('h1,h2'))
      .some(e => e.offsetParent && /السلام عليكم ورحمة الله وبركاته/.test(e.textContent||''));
    if (!greeted && !alreadyGreeting) {
      const splashTimer = window.setTimeout(() => {
        const welcome = document.createElement('div');
        welcome.id = 'isl-greeting26';
        welcome.setAttribute('role','dialog');
        welcome.setAttribute('aria-modal','true');
        welcome.setAttribute('aria-label','السلام عليكم');
        welcome.innerHTML = '<div class="isl-arch"><div class="isl-lantern" aria-hidden="true">🏮</div><h1>السلام عليكم ورحمة الله وبركاته</h1><p>مرحبًا بكم في تطبيق إسلاميات</p><button type="button" data-isl-start>ابدأ</button><button type="button" class="isl-skip" data-isl-skip>تخطي إلى إسلاميات</button></div>';
        const finish = (skip) => {
          try { localStorage.setItem(firstRunKey, 'done'); } catch (_) {}
          welcome.remove();
          // Do not bypass or remove the existing identity form. Skip only closes greeting.
          if (!skip) {
            const nameInput = document.querySelector('input[name*="name" i],input[placeholder*="اسم" i]');
            if (nameInput && nameInput.getClientRects().length) nameInput.focus();
          }
        };
        welcome.querySelector('[data-isl-start]').addEventListener('click', () => finish(false));
        welcome.querySelector('[data-isl-skip]').addEventListener('click', () => finish(true));
        document.body.append(welcome);
        welcome.querySelector('[data-isl-start]').focus();
      }, 5000);
      window.addEventListener('pagehide',()=>clearTimeout(splashTimer),{once:true});
    }
    function activeScreen() {
      const screens = [...document.querySelectorAll('[data-page],.page,.screen,[id$="-page"],[id$="Page"]')]
        .filter(el=>el.getClientRects().length && getComputedStyle(el).display!=='none' &&
          getComputedStyle(el).visibility!=='hidden' && !el.closest('#isl-greeting26,#isl-dialog'));
      // Prefer small visible leaf screens, not the app root container.
      return screens.filter(el=>!screens.some(other=>other!==el&&el.contains(other))).slice(0,8);
    }
    function homeIsActive() {
      const path=(location.hash+' '+location.pathname).toLowerCase();
      if (/#\/?(qibla|radio|settings|ramadan|dua|prayer|profile)/.test(path)) return false;
      if (/#\/?(home|main|index)/.test(path)) return true;
      const screens=activeScreen();
      const ids=screens.map(s=>((s.id||'')+' '+(s.dataset.page||'')+' '+s.className).toLowerCase());
      if(ids.some(s=>/\b(home|main|index|dashboard)\b/.test(s)))return true;
      if(ids.some(s=>/qibla|radio|ramadan|settings|profile|prayer|dua/.test(s)))return false;
      // Keep the original quick-access visibility unchanged if routing is unknown.
      return null;
    }
    let lastHome=null;
    function refresh() {
      const dark=document.documentElement.classList.contains('dark')||
       document.body.classList.contains('dark')||document.documentElement.dataset.theme==='dark'||
       document.body.dataset.theme==='dark'||getComputedStyle(document.body).backgroundColor==='rgb(0, 0, 0)';
      document.body.classList.toggle('isl-ui-dark-fix',dark);
      const isHome=homeIsActive();
      if(isHome===null) return;
      lastHome=isHome;
      const labels=[...document.querySelectorAll('h2,h3,h4,button,span,div')]
        .filter(el=>el.children.length===0 && (el.textContent||'').trim()==='وصول سريع').slice(0,8);
      labels.forEach(el=>{
        const section=el.closest('section,[class*="quick-access" i],[id*="quick-access" i]')||el.parentElement;
        if(section && section!==document.body && section.getBoundingClientRect().height<1400){
          section.style.setProperty('display',isHome?'':'none',isHome?'':'important');
          if(isHome)section.style.removeProperty('display');
        }
      });
    }
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;setTimeout(()=>{queued=false;refresh()},350);
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','data-page','data-theme']});
    window.addEventListener('hashchange',refresh);
    window.addEventListener('popstate',refresh);
    refresh();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();