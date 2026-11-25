(() => {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
    .isl-mat-prayer {position:absolute;inset-inline:7%;top:42%;z-index:8;margin:0;padding:.35em .55em;
      text-align:center;color:#fff8df;background:#182318de;border:2px solid #e1b459;border-radius:14px;
      font:700 clamp(16px,4.6vw,25px)/1.7 Amiri,Cairo,serif;pointer-events:none;
      animation:isl-mat-light 3.6s ease-in-out infinite;}
    .isl-mat-prayer[hidden]{display:none}
    @keyframes isl-mat-light{0%,100%{opacity:.08;box-shadow:0 0 0 #ffc76800}48%,65%{opacity:1;box-shadow:0 0 18px 4px #ffc768b0}}
    @media(prefers-reduced-motion:reduce){.isl-mat-prayer{animation:none;box-shadow:0 0 10px #ffc768}}
    #isl-language-options{width:min(88vw,400px);max-height:80vh;border:2px solid #ad8146;border-radius:16px;
      background:#172a21;color:#fff4d8;padding:16px;font:inherit}
    #isl-language-options::backdrop{background:#0009}
    #isl-language-options button{display:block;width:100%;padding:9px;margin:3px 0;
      font:inherit;color:inherit;background:#263b30;border:1px solid #ad8146;border-radius:8px}
    .hero-ticker .isl-ticker-time{display:inline-block;direction:ltr;unicode-bidi:isolate;white-space:nowrap}
  `;
  document.head.append(style);

  const locationToggle = document.getElementById('perm-toggle-location');
  const native = () => window.Capacitor?.isNativePlatform();
  const locationPlugin = () => window.Capacitor?.Plugins?.Geolocation;
  async function refreshLocationPermission() {
    if (!native() || !locationToggle || !locationPlugin()) return;
    try {
      const permissions = await locationPlugin().checkPermissions();
      const service = await window.Capacitor.Plugins.BatteryOptim?.getLocationServiceStatus?.();
      const active = (permissions.location === 'granted' || permissions.coarseLocation === 'granted')
        && service?.enabled !== false;
      locationToggle.classList.toggle('on', active);
      locationToggle.setAttribute('aria-checked', String(active));
    } catch {
      locationToggle.classList.remove('on');
      locationToggle.setAttribute('aria-checked', 'false');
    }
  }
  if (typeof window.useMyLocation === 'function') {
    const locate = window.useMyLocation;
    window.useMyLocation = async function (...args) {
      if (native()) {
        const settings = window.Capacitor.Plugins.BatteryOptim;
        // Get the permission even when Android's location service is off.
        try {
          const geo = locationPlugin();
          const settingsBefore = await settings?.getLocationServiceStatus?.();
          if (geo && settingsBefore?.enabled === false) {
            const current = await geo.checkPermissions().catch(() => null);
            if (current && current.location !== 'granted' && current.coarseLocation !== 'granted') {
              await geo.requestPermissions().catch(() => {});
            }
            showToast('فعّل خدمة الموقع من إعدادات الهاتف ثم ارجع إلى إسلاميات');
            await settings.openLocationServiceSettings();
          }
        } catch {}
      }
      try { return await locate.apply(this, args); }
      finally { await refreshLocationPermission(); }
    };
  }

  if (locationToggle && native()) {
    locationToggle.onclick = () => window.useMyLocation();
  }

  const languageMenu = document.createElement('dialog');
  languageMenu.id = 'isl-language-options';
  languageMenu.setAttribute('aria-label', 'اختر لغة التطبيق');
  document.body.append(languageMenu);
  const storedArabic = new WeakMap();
  const rtl = new Set(['ar','ur','fa','ps','prs','ku']);
  function applyScreenLabels(language) {
    if (typeof I18N === 'undefined') return;
    const translations = I18N[language] || I18N.ar;
    const labels = new Map(Object.entries(I18N.ar)
      .filter(([key]) => typeof translations[key] === 'string')
      .map(([key, ar]) => [String(ar).trim(), translations[key]]));
    document.documentElement.lang = language;
    for (const node of document.querySelectorAll('.screen :is(h1,h2,h3,button,label,summary,.title,.section-label,.setting-label),.tabs span')) {
      if (node.children.length || node.hasAttribute('data-i18n')) continue;
      const current = node.textContent.trim();
      if (labels.has(current)) storedArabic.set(node, current);
      const original = storedArabic.get(node);
      if (!original) continue;
      const translated = language === 'ar' ? original : labels.get(original) || original;
      if (current !== translated) node.textContent = translated;
      node.dir = rtl.has(language) ? 'rtl' : 'ltr';
    }
  }
  if (typeof window.applyAppLanguage === 'function') {
    const apply = window.applyAppLanguage;
    window.applyAppLanguage = function (language) {
      apply(language);
      applyScreenLabels(language);
    };
  }
  function openLanguageMenu() {
    if (typeof appLanguages === 'undefined') return;
    if (languageMenu.open) return;
    languageMenu.replaceChildren();
    for (const language of appLanguages) {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = language.label;
      item.dir = 'auto';
      item.setAttribute('aria-pressed', String(language.code === appLanguage));
      item.onclick = () => { pickAppLanguage(language.code); languageMenu.close(); };
      languageMenu.append(item);
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '✕';
    close.setAttribute('aria-label', 'إغلاق');
    close.onclick = () => languageMenu.close();
    languageMenu.append(close);
    languageMenu.showModal();
  }
  window.openAppLangSheet = openLanguageMenu;
  window.openPermLangSheet = openLanguageMenu;

  const alignment = document.getElementById('qibla-align-banner');
  const rug = document.querySelector('#qibla #qibla-rug-wrap, #qibla .qibla-rug-wrap, #qibla .qibla-rug');
  if (alignment && rug) {
    if (getComputedStyle(rug).position === 'static') rug.style.position = 'relative';
    const message = document.createElement('p');
    message.className = 'isl-mat-prayer';
    message.hidden = true;
    rug.append(message);
    const updateMat = () => {
      const aligned = !!alignment.getClientRects().length
        && getComputedStyle(alignment).visibility !== 'hidden'
        && !alignment.hidden && alignment.getAttribute('aria-hidden') !== 'true';
      message.hidden = !aligned;
      if (!aligned) return;
      const nameField = document.querySelector('input[name="name"], #user-name, #onboarding-name, input[placeholder*="اسمك"]');
      const name = (typeof userName !== 'undefined' && typeof userName === 'string' ? userName : nameField?.value || localStorage.getItem('deeni_user_name') || '').trim();
      message.textContent = name ? 'حيّ على الصلاة يا ' + name : 'حيّ على الصلاة';
    };
    const observer = new MutationObserver(updateMat);
    observer.observe(alignment, {attributes:true});
    for (const screen of document.querySelectorAll('#qibla.screen')) observer.observe(screen, {attributes:true,attributeFilter:['class']});
    updateMat();
  }

  for (const ticker of document.querySelectorAll('.hero-ticker')) {
    const updateTimes = () => {
      const walker = document.createTreeWalker(ticker, NodeFilter.SHOW_TEXT);
      const time = /(?:\b(AM|PM)\s+([0-9٠-٩]{1,2}[:٫][0-9٠-٩]{2})|([0-9٠-٩]{1,2}[:٫][0-9٠-٩]{2})\s+(AM|PM)\b)/gi;
      const edits = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement.closest('.isl-ticker-time')) continue;
        const matches = [...node.data.matchAll(time)];
        if (matches.length) edits.push([node, matches]);
      }
      for (const [node, matches] of edits) {
        const parts = document.createDocumentFragment();
        let end = 0;
        for (const match of matches) {
          parts.append(node.data.slice(end, match.index));
          const fixed = document.createElement('bdi');
          fixed.className = 'isl-ticker-time';
          fixed.textContent = (match[2] || match[3]) + ' ' + (match[1] || match[4]).toUpperCase();
          parts.append(fixed);
          end = match.index + match[0].length;
        }
        parts.append(node.data.slice(end));
        node.replaceWith(parts);
      }
    };
    new MutationObserver(updateTimes).observe(ticker, {subtree:true,childList:true,characterData:true});
    updateTimes();
  }

  refreshLocationPermission();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshLocationPermission();
  });
  if (typeof appLanguage !== 'undefined') applyScreenLabels(appLanguage);
})();
