// LockIn — Internationalization

let _locale = 'pt';
let _strings = {};

function getLocale() { return _locale; }

function t(key, fallback) {
  return (_strings[key] || (fallback !== undefined ? fallback : key));
}

function loadLocale(lang, strings) {
  _strings = strings;
  _locale = lang;
}

function _refreshStaticTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.hasAttribute('data-i18n-attr')) {
      const attr = el.getAttribute('data-i18n-attr');
      el.setAttribute(attr, t(key, el.getAttribute(attr)));
    } else if (el.tagName === 'OPTION') {
      el.textContent = t(key, el.textContent);
    } else if (el.tagName === 'OPTGROUP') {
      el.setAttribute('label', t(key, el.getAttribute('label')));
    } else if (el.hasAttribute('placeholder')) {
      el.setAttribute('placeholder', t(key, el.getAttribute('placeholder')));
    } else {
      el.textContent = t(key, el.textContent);
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'), el.title);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = t(el.getAttribute('data-i18n-placeholder'), el.getAttribute('placeholder') || el.getAttribute('data-placeholder') || '');
    if (el.hasAttribute('placeholder')) el.placeholder = val;
    if (el.hasAttribute('data-placeholder')) el.setAttribute('data-placeholder', val);
  });
}
