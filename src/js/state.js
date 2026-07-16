// LockIn — Estado, definições e temas

const THEME_PALETTES = {
  dark:    { bg:'#000', s1:'#0a0a0a', s2:'#111', s3:'#181818', border:'#1e1e1e', border2:'#2a2a2a', text:'#fff', muted:'#4a4a4a', muted2:'#2e2e2e', soft:'#888' },
  light:   { bg:'#fff', s1:'#f5f5f5', s2:'#e8e8e8', s3:'#d0d0d0', border:'#ddd', border2:'#bbb', text:'#111', muted:'#666', muted2:'#999', soft:'#444' },
  sepia:   { bg:'#f4ecd8', s1:'#e8dcc8', s2:'#ddd0b8', s3:'#d0c0a8', border:'#c8b898', border2:'#b8a888', text:'#3a3020', muted:'#8a7a60', muted2:'#9a8a70', soft:'#6a5a40' },
  midnight:{ bg:'#070b14', s1:'#0c1220', s2:'#111a2e', s3:'#162038', border:'#1e2d4a', border2:'#2a3f66', text:'#e8eef8', muted:'#5a6d8f', muted2:'#3d4f6e', soft:'#8fa3c4' },
  ocean:   { bg:'#04121a', s1:'#071c28', s2:'#0a2636', s3:'#0f3044', border:'#143d55', border2:'#1e5575', text:'#e0f4ff', muted:'#4a7a94', muted2:'#2e5a72', soft:'#7eb8d4' },
  forest:  { bg:'#060e08', s1:'#0a160c', s2:'#0f1f12', s3:'#142818', border:'#1a3520', border2:'#254a2e', text:'#e8f5ea', muted:'#4a7354', muted2:'#2e5238', soft:'#7db88a' },
  lavender:{ bg:'#100c18', s1:'#161022', s2:'#1e1630', s3:'#261c3c', border:'#322848', border2:'#453660', text:'#f0e8ff', muted:'#7a6494', muted2:'#524068', soft:'#b49ad4' },
  rose:    { bg:'#14080c', s1:'#1e0c12', s2:'#281018', s3:'#32141e', border:'#451c2a', border2:'#5c2838', text:'#ffe8ee', muted:'#946070', muted2:'#6a4450', soft:'#d498a8' },
  nord:    { bg:'#2e3440', s1:'#3b4252', s2:'#434c5e', s3:'#4c566a', border:'#616e88', border2:'#6e7f96', text:'#eceff4', muted:'#9aa3b8', muted2:'#7b849a', soft:'#d8dee9' },
  slate:   { bg:'#0f1419', s1:'#151b22', s2:'#1c242d', s3:'#232d38', border:'#2d3a47', border2:'#3d4d5c', text:'#f1f5f9', muted:'#64748b', muted2:'#475569', soft:'#94a3b8' },
};


const ALL_FOCUS_STYLES = [
  'minimal', 'ring', 'zen', 'mono',
];

const VIZ_ANIMATIONS = ['off', 'static', 'wave', 'breathe'];

const SETTINGS_DEFAULTS = {
  alarmSound: 'digital',
  volume: 70,
  showSeconds: true,
  theme: 'dark',
  notifsEnabled: true,
  focusStyle: 'minimal',
  vizAnimation: 'off',
  accentColor: '#6366f1',
  fontSize: 'normal',
  noteLayout: 'default',
  mainLayout: 'default',
  weekView: 'stats',
  customCategories: [],
  language: 'pt',
};

function load(k, def) {
  try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; }
}

let settings = { ...SETTINGS_DEFAULTS, ...load('li_settings', {}) };
if (!ALL_FOCUS_STYLES.includes(settings.focusStyle)) settings.focusStyle = SETTINGS_DEFAULTS.focusStyle;
if (!VIZ_ANIMATIONS.includes(settings.vizAnimation)) settings.vizAnimation = SETTINGS_DEFAULTS.vizAnimation;

const _locales = { pt: LOCALE_PT, en: LOCALE_EN, es: LOCALE_ES, fr: LOCALE_FR };
const _lang = settings.language || 'pt';
if (_locales[_lang]) loadLocale(_lang, _locales[_lang]);
document.documentElement.lang = _lang;

function changeLanguage(lang) {
  if (!_locales[lang]) return;
  loadLocale(lang, _locales[lang]);
  settings.language = lang;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  document.documentElement.lang = lang;
  refreshCategoryLookups();
  refreshCategorySelects();
  renderAll();
  _refreshStaticTexts();
  document.querySelectorAll('.month-note-editor[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('data-placeholder', t(el.getAttribute('data-i18n-placeholder'), ''));
  });
  updateGoalsSelect();
  renderAllSettingsGrids();
  updateNotifBtn();
  renderCustomCategories();
  ['inp-recur','inp-duration','inp-priority','setting-alarm-sound','setting-theme','setting-font-size','setting-language'].forEach(id => {
    const el = document.getElementById(id);
    if (el) rebuildCustomSelect(el);
  });
  if (document.getElementById('modal-routines') && !document.getElementById('modal-routines').classList.contains('hidden')) renderRoutines();
  if (document.getElementById('modal-goals') && !document.getElementById('modal-goals').classList.contains('hidden')) renderGoals();
  if (document.getElementById('modal-stats') && !document.getElementById('modal-stats').classList.contains('hidden')) renderStats();
  showToast('info', t('settings_language'), lang === 'pt' ? 'Português' : lang === 'en' ? 'English' : lang === 'es' ? 'Español' : 'Français');
}

const _loadedState = load('li_state', null);
const S = {
  tasks: _loadedState ? _loadedState.tasks || [] : load('li_tasks', []),
  goals: _loadedState ? _loadedState.goals || [] : load('li_goals', []),
  sessions: _loadedState ? _loadedState.sessions || 0 : load('li_sessions', 0),
  focusHistory: _loadedState ? _loadedState.focusHistory || [] : load('li_focus_history', []),
  totalFocusTime: _loadedState ? _loadedState.totalFocusTime || 0 : load('li_total_focus_time', 0),
  monthNotes: _loadedState ? _loadedState.monthNotes || {} : load('li_month_notes', {}),
  weekOffset: _loadedState ? _loadedState.weekOffset ?? 0 : load('li_week_offset', 0),
  monthOffset: _loadedState ? _loadedState.monthOffset ?? 0 : load('li_month_offset', 0),
  selectedNoteDate: _loadedState ? _loadedState.selectedNoteDate || (window.today ? window.today() : new Date().toISOString().slice(0,10)) : load('li_selected_note_date', window.today ? window.today() : new Date().toISOString().slice(0,10)),
  selectedDay: _loadedState ? _loadedState.selectedDay || null : load('li_selected_day', null),
  routines: _loadedState ? _loadedState.routines || [] : load('li_routines', []),
  templates: _loadedState ? _loadedState.templates || [] : load('li_templates', []),
  sessionCount: _loadedState ? _loadedState.sessionCount ?? 0 : load('li_session_count', 0),
};

function save() {
  localStorage.setItem('li_state', JSON.stringify({
    tasks: S.tasks,
    goals: S.goals,
    sessions: S.sessions,
    focusHistory: S.focusHistory,
    totalFocusTime: S.totalFocusTime,
    monthNotes: S.monthNotes,
    weekOffset: S.weekOffset,
    monthOffset: S.monthOffset,
    selectedNoteDate: S.selectedNoteDate || (window.today ? window.today() : new Date().toISOString().slice(0,10)),
    selectedDay: S.selectedDay,
    routines: S.routines,
    templates: S.templates,
    sessionCount: S.sessionCount,
  }));
}

function clearAllData() {
  showConfirm({
    title: t('clear_title'),
    msg: t('clear_msg'),
    okLabel: t('clear_btn'),
    type: 'danger',
    onOk: () => {
      localStorage.clear();
      S.tasks = [];
      S.goals = [];
      S.routines = [];
      S.templates = [];
      S.sessionCount = 0;
      S.sessions = 0;
      S.focusHistory = [];
      S.totalFocusTime = 0;
      S.monthNotes = {};
      S.weekOffset = 0;
      S.monthOffset = 0;
      S.selectedNoteDate = today();
      S.selectedDay = null;
      Object.assign(settings, SETTINGS_DEFAULTS);
      localStorage.setItem('li_settings', JSON.stringify(settings));
      save();
      refreshCategoryLookups();
      refreshCategorySelects();
      renderAll();
      renderAllSettingsGrids();
      showToast('info', t('clear_ok'), t('clear_ok_msg'));
    }
  });
}

(function _restoreFromFile() {
  if (!window.store || !window.store.initialData) return;
  const data = window.store.initialData;
  if (!data || Object.keys(data).length === 0) return;
  const _originalSetItem = localStorage.setItem.bind(localStorage);
  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith('li_')) {
      _originalSetItem(key, JSON.stringify(value));
    }
  });
})();

const _originalSetItem = localStorage.setItem.bind(localStorage);
const _originalClear = localStorage.clear.bind(localStorage);

localStorage.setItem = function(key, value) {
  _originalSetItem(key, value);
  if (key.startsWith('li_') && window.store) {
    if (_fileSyncTimer) clearTimeout(_fileSyncTimer);
    _fileSyncTimer = setTimeout(_syncAllToFile, 800);
  }
};

localStorage.clear = function() {
  _originalClear();
  if (window.store) window.store.clear();
};

let _fileSyncTimer = null;

function _syncAllToFile() {
  if (!window.store) return;
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('li_')) {
      try { data[key] = JSON.parse(localStorage.getItem(key)); }
      catch { data[key] = localStorage.getItem(key); }
    }
  }
  window.store.setAll(data);
}

function cleanupOldData() {
  const lastCleanupDate = load('li_last_cleanup', null);
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - COOKIE_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const shouldCleanup = !lastCleanupDate ||
    new Date(lastCleanupDate).toDateString() !== now.toDateString();

  if (shouldCleanup) {
    const initialCount = S.focusHistory.length;
    S.focusHistory = S.focusHistory.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate.getTime() > cutoffDate.getTime();
    });

    S.tasks.forEach(task => {
      const comp = task.completions;
      if (!comp || typeof comp !== 'object') return;
      Object.keys(comp).forEach(dateKey => {
        const doneDate = new Date(dateKey);
        if (!Number.isNaN(doneDate.getTime()) && doneDate.getTime() < cutoffDate.getTime()) {
          delete comp[dateKey];
        }
      });
    });

    localStorage.setItem('li_last_cleanup', now.toISOString());
    save();

    const removedCount = initialCount - S.focusHistory.length;
    if (removedCount > 0) {
      console.log(`Limpeza automática: ${removedCount} sessão(ões) antiga(s) removida(s).`);
    }
  }
}

setTimeout(() => cleanupOldData(), 100);

function applyTheme(themeOverride) {
  const sel = document.getElementById('setting-theme');
  if (sel && !themeOverride) settings.theme = sel.value;
  if (themeOverride) settings.theme = themeOverride;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  const palette = THEME_PALETTES[settings.theme] || THEME_PALETTES.dark;
  const root = document.documentElement;
  Object.entries(palette).forEach(([key, val]) => {
    root.style.setProperty('--' + key, val);
  });

  // Adaptar color-scheme para temas claros (melhora date/time pickers)
  const lightThemes = ['light', 'sepia'];
  root.style.colorScheme = lightThemes.includes(settings.theme) ? 'light' : 'dark';

  root.style.setProperty('--accent-text', window.getContrastColor ? window.getContrastColor(settings.accentColor || '#6366f1') : '#fff');

  const ringFg = document.getElementById('ring-fg');
  if (ringFg && !ringFg.classList.contains('ring-break')) {
    ringFg.style.stroke = palette.text;
  }
  document.documentElement.style.setProperty('--ring-color', palette.text);
}

function setView(name) {
  document.getElementById('view-main')?.classList.toggle('hidden', name !== 'main');
  document.getElementById('view-focus')?.classList.toggle('hidden', name !== 'focus');
  document.getElementById('view-notes')?.classList.toggle('hidden', name !== 'notes');
  document.getElementById('view-month')?.classList.toggle('hidden', name !== 'month');
  document.getElementById('notes-btn')?.classList.toggle('active', name === 'notes');
  document.getElementById('tasks-btn')?.classList.toggle('active', name === 'main');
  document.getElementById('month-view-btn')?.classList.toggle('active', name === 'month');
  if (name !== 'main') document.getElementById('routines-btn')?.classList.remove('active');
}

function openTasks() { setView('main'); }
function openNotes() { setView('notes'); if (window.renderMonthGridMain) renderMonthGridMain(); if (window.renderNotesDayTasks) renderNotesDayTasks(); }

function selectFocusStyle(btn, style) {
  if (!ALL_FOCUS_STYLES.includes(style)) return;
  document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function applyFocusStyle() {
  const activeCard = document.querySelector('.style-card.active');
  const style = activeCard?.dataset.style || settings.focusStyle || 'minimal';
  settings.focusStyle = style;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  if (window.applyFocusStyleToView) window.applyFocusStyleToView(style);
  const styleLabels = { minimal: t('style_minimal'), ring: t('style_ring'), zen: t('style_zen'), mono: t('style_mono') };
  window.showToast('success', t('style_applied'), t('style_applied_msg').replace('{name}', styleLabels[style] || style));
}

function selectVizAnimation(btn) {
  if (!VIZ_ANIMATIONS.includes(btn?.dataset.viz)) return;
  document.querySelectorAll('.viz-card').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function applyVizAnimation() {
  const active = document.querySelector('.viz-card.active');
  settings.vizAnimation = active?.dataset.viz || settings.vizAnimation || 'wave';
  localStorage.setItem('li_settings', JSON.stringify(settings));
  if (timer) window.startSoundViz();
  else document.getElementById('sound-viz')?.classList.toggle('hidden', settings.vizAnimation === 'off');
  const label = active?.querySelector('.viz-card-label')?.textContent || settings.vizAnimation;
  window.showToast('success', t('viz_applied'), t('viz_applied_msg'));
}

function setAccentColor(color) {
  settings.accentColor = color;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--ring-color', color);
  document.documentElement.style.setProperty('--accent-text', window.getContrastColor ? window.getContrastColor(color) : '#fff');
  updateAccentSwatches();
  const ringFg = document.getElementById('ring-fg');
  if (ringFg && !ringFg.classList.contains('ring-break')) {
    ringFg.style.stroke = color;
  }
}

function openColorPicker() {
  const input = document.getElementById('custom-color-input');
  if (input) input.click();
}

function onCustomColorSelected() {
  const input = document.getElementById('custom-color-input');
  if (input && input.value) {
    setAccentColor(input.value);
  }
}

function updateAccentSwatches() {
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === (settings.accentColor || '#6366f1'));
  });

  const customInput = document.getElementById('custom-color-input');
  if (customInput) customInput.value = settings.accentColor || '#6366f1';

  const customTrigger = document.getElementById('custom-color-trigger');
  if (customTrigger) {
    const color = settings.accentColor || '#6366f1';
    customTrigger.style.background = color;
    customTrigger.style.color = window.getContrastColor ? window.getContrastColor(color) : '#fff';
    customTrigger.style.borderColor = 'rgba(255,255,255,0.35)';
  }
}

function getAllCategories() {
  const base = [
    { id: 'work',     name: t('task_cat_work'), color: '#6366f1' },
    { id: 'study',    name: t('task_cat_study'),   color: '#8b5cf6' },
    { id: 'personal', name: t('task_cat_personal'),  color: '#f59e0b' },
  ];
  return [...base, ...(settings.customCategories || [])];
}

function refreshCategorySelects() {
  const cats = getAllCategories();
  ['inp-category', 'goal-category'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">${t('task_cat_none')}</option>` +
      cats.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
    rebuildCustomSelect(sel);
  });
}

function refreshCategoryLookups() {
  getAllCategories().forEach(c => {
    _customCategoryLabels[c.id] = c.name;
    CATEGORY_COLORS[c.id] = c.color;
  });
}

function selectMainLayout(btn, layout) {
  document.querySelectorAll('.main-layout-card').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function applyMainLayout(layout) {
  if (layout) {
    settings.mainLayout = layout;
  } else {
    const active = document.querySelector('.main-layout-card.active');
    settings.mainLayout = active?.dataset.layout || 'default';
  }
  localStorage.setItem('li_settings', JSON.stringify(settings));
  const container = document.querySelector('.main-layout');
  if (container) {
    container.classList.remove('mlayout-default', 'mlayout-reversed', 'mlayout-wide-week', 'mlayout-tasks-only');
    if (settings.mainLayout !== 'default') {
      container.classList.add('mlayout-' + settings.mainLayout);
    }
  }
  if (!layout) {
    window.showToast('success', t('layout_applied'), t('layout_home_msg'));
  }
}

function selectNoteLayout(btn, layout) {
  document.querySelectorAll('.note-layout-card').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function applyNoteLayout(layout) {
  if (layout) {
    settings.noteLayout = layout;
  } else {
    const active = document.querySelector('.note-layout-card.active');
    settings.noteLayout = active?.dataset.layout || 'default';
  }
  localStorage.setItem('li_settings', JSON.stringify(settings));
  const container = document.querySelector('.notes-3col');
  if (container) {
    container.classList.remove('layout-default', 'layout-sidebar', 'layout-focus', 'layout-compact');
    container.classList.add('layout-' + settings.noteLayout);
  }
  if (!layout) {
    window.showToast('success', t('layout_applied'), t('layout_notes_msg'));
  }
}

function openCategoryManager() {
  document.getElementById('modal-settings')?.classList.remove('hidden');
  if (window.loadSettings) window.loadSettings();
  setTimeout(() => {
    const el = document.getElementById('custom-categories-list');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 150);
  setTimeout(() => {
    document.getElementById('new-cat-name')?.focus();
  }, 250);
}

function addCustomCategory() {
  const nameEl = document.getElementById('new-cat-name');
  const colorEl = document.getElementById('new-cat-color');
  const name = nameEl?.value.trim();
  if (!name) return;
  const id = 'cat_' + Date.now();
  const color = colorEl?.value || '#6366f1';
  if (!settings.customCategories) settings.customCategories = [];
  settings.customCategories.push({ id, name, color });
  localStorage.setItem('li_settings', JSON.stringify(settings));
  if (nameEl) nameEl.value = '';
  refreshCategoryLookups();
  if (window.renderCustomCategories) window.renderCustomCategories();
  if (window.refreshCategorySelects) window.refreshCategorySelects();
  window.showToast('success', t('cat_created'), t('routine_created_msg', {name: name}));
}

function removeCustomCategory(id) {
  settings.customCategories = (settings.customCategories || []).filter(c => c.id !== id);
  localStorage.setItem('li_settings', JSON.stringify(settings));
  refreshCategoryLookups();
  if (window.renderCustomCategories) window.renderCustomCategories();
  if (window.refreshCategorySelects) window.refreshCategorySelects();
}

function renderCustomCategories() {
  const list = document.getElementById('custom-categories-list');
  if (!list) return;
  const cats = settings.customCategories || [];
  if (!cats.length) {
    list.innerHTML = `<div class="custom-cat-empty">${t('settings_cats_empty')}</div>`;
    return;
  }
  list.innerHTML = cats.map(c => `
    <div class="custom-cat-row">
      <span class="custom-cat-dot" style="background:${c.color}"></span>
      <span class="custom-cat-name">${escHtml(c.name)}</span>
      <button class="custom-cat-del" onclick="removeCustomCategory('${c.id}')" title="${t('settings_cats_remove')}">×</button>
    </div>
  `).join('');
}

function applyFontSize() {
  const size = document.getElementById('setting-font-size')?.value || settings.fontSize || 'normal';
  settings.fontSize = size;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  const root = document.documentElement;
  if (size === 'small')  root.style.fontSize = '11.5px';
  else if (size === 'normal') root.style.fontSize = '13.5px';
  else if (size === 'large')  root.style.fontSize = '15px';
  else if (size === 'xlarge') root.style.fontSize = '17px';
}

// ── SETTINGS GRID RENDERERS ─────────────────────────────────────────────────

function _getFocusStyleConfig() {
  return [
    { id:'minimal', label:t('style_minimal'), preview:'<div class="sc-wrap sc-v-minimal"><span class="sc-time sc-t-minimal">25:00</span></div>' },
    { id:'ring',    label:t('style_ring'),       preview:'<div class="sc-wrap sc-v-ring"><svg class="sc-ring-svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--border2)" stroke-width="3"/><circle cx="22" cy="22" r="18" fill="none" stroke="var(--text)" stroke-width="3" stroke-dasharray="80 113" stroke-linecap="round" transform="rotate(-90 22 22)"/></svg><span class="sc-time sc-t-ring">25:00</span></div>' },
    { id:'zen',     label:t('style_zen'),        preview:'<div class="sc-wrap sc-v-zen"><div class="sc-zen-line"></div><span class="sc-time sc-t-zen">25:00</span><div class="sc-zen-line"></div></div>' },
    { id:'mono',    label:t('style_mono'),       preview:'<div class="sc-wrap sc-v-mono"><span class="sc-time sc-t-mono">25:00</span></div>' },
  ];
}

function renderFocusStyleGrid() {
  const grid = document.getElementById('focus-style-grid');
  if (!grid) return;
  grid.innerHTML = _getFocusStyleConfig().map(s => `
    <button class="style-card ${settings.focusStyle === s.id ? 'active' : ''}" data-style="${s.id}" onclick="selectFocusStyle(this,'${s.id}')">
      <div class="style-card-preview">${s.preview}</div>
      <span class="style-card-label">${s.label}</span>
    </button>
  `).join('');
}

const COLOR_SWATCHES = [
  '#6366f1','#3b82f6','#22c55e','#10b981','#f59e0b','#ff9500',
  '#ec4899','#d946ef','#ef4444','#14b8a6','#06b6d4','#8b5cf6',
  '#0ea5e9','#65a30d','#ffffff'
];

function _getColorNames() {
  return [
    t('color_indigo'),t('color_blue'),t('color_green'),t('color_emerald'),t('color_amber'),t('color_orange'),
    t('color_pink'),t('color_magenta'),t('color_red'),t('color_teal'),t('color_cyan'),t('color_purple'),
    t('color_sky'),t('color_lime'),t('color_white')
  ];
}

function renderColorSwatches() {
  const container = document.getElementById('settings-color-swatches');
  if (!container) return;
  const current = settings.accentColor || '#6366f1';
  const colorNames = _getColorNames();
  container.innerHTML = `
    ${COLOR_SWATCHES.map((c, i) => `
      <button class="color-swatch ${current === c ? 'active' : ''}" data-color="${c}" style="background:${c}" onclick="setAccentColor('${c}')" title="${colorNames[i]}"></button>
    `).join('')}
    <button class="color-swatch-custom" id="custom-color-trigger" title="${t('color_custom')}" onclick="openColorPicker()">
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.1c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
    </button>
  `;
}

function _getVizConfig() {
  return [
    { id:'off',     label:t('settings_viz_off'),     cls:'viz-prev-off',     custom:'—' },
    { id:'static',  label:t('settings_viz_static'),  cls:'viz-prev-static',  bars:5 },
    { id:'wave',    label:t('settings_viz_wave'),     cls:'viz-prev-wave',    bars:5 },
    { id:'breathe', label:t('settings_viz_breathe'),  cls:'viz-prev-breathe', bars:5 },
  ];
}

function renderVizStyleGrid() {
  const grid = document.getElementById('viz-style-grid');
  if (!grid) return;
  grid.innerHTML = _getVizConfig().map(v => {
    let preview;
    if (v.custom) preview = `<div class="viz-card-preview ${v.cls}" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:1.2rem;">${v.custom}</div>`;
    else if (v.icon) preview = `<div class="viz-card-preview ${v.cls}" style="display:flex;align-items:center;justify-content:center;color:var(--muted);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>`;
    else preview = `<div class="viz-card-preview ${v.cls}">${'<span></span>'.repeat(v.bars)}</div>`;
    return `
      <button type="button" class="viz-card ${settings.vizAnimation === v.id ? 'active' : ''}" data-viz="${v.id}" onclick="selectVizAnimation(this)">
        ${preview}
        <span class="viz-card-label">${v.label}</span>
      </button>
    `;
  }).join('');
}

function _getMainLayoutConfig() {
  return [
    { id:'default',    label:t('settings_layout_default'),       preview:'<div class="nlp-col nlp-sm"></div><div class="nlp-col nlp-lg"></div>' },
    { id:'reversed',   label:t('settings_layout_reversed'),    preview:'<div class="nlp-col nlp-lg"></div><div class="nlp-col nlp-sm"></div>' },
    { id:'wide-week',  label:t('settings_layout_wide_week'), preview:'<div class="nlp-col" style="width:28px"></div><div class="nlp-col nlp-lg"></div>' },
    { id:'tasks-only', label:t('settings_layout_tasks_only'),   preview:'<div class="nlp-col nlp-full"></div>' },
  ];
}

function renderMainLayoutGrid() {
  const grid = document.getElementById('main-layout-grid');
  if (!grid) return;
  grid.innerHTML = _getMainLayoutConfig().map(l => `
    <button class="main-layout-card note-layout-card ${settings.mainLayout === l.id ? 'active' : ''}" data-layout="${l.id}" onclick="selectMainLayout(this,'${l.id}')">
      <div class="note-layout-preview">${l.preview}</div>
      <span class="note-layout-label">${l.label}</span>
    </button>
  `).join('');
}

function _getNoteLayoutConfig() {
  return [
    { id:'default', label:t('settings_notes_default'),    preview:'<div class="nlp-col nlp-sm"></div><div class="nlp-col nlp-lg"></div><div class="nlp-col nlp-sm"></div>' },
    { id:'sidebar', label:t('settings_notes_sidebar'),   preview:'<div class="nlp-left-stack"><div class="nlp-col nlp-half"></div><div class="nlp-col nlp-half"></div></div><div class="nlp-col nlp-xl"></div>' },
    { id:'focus',   label:t('settings_notes_focus'),      preview:'<div class="nlp-col nlp-sm"></div><div class="nlp-col nlp-full"></div>' },
    { id:'compact', label:t('settings_notes_compact'),  preview:'<div class="nlp-left-stack"><div class="nlp-col nlp-half"></div><div class="nlp-col nlp-half"></div></div><div class="nlp-col nlp-xl"></div>' },
  ];
}

function renderNoteLayoutGrid() {
  const grid = document.getElementById('note-layout-grid');
  if (!grid) return;
  grid.innerHTML = _getNoteLayoutConfig().map(l => `
    <button class="note-layout-card ${settings.noteLayout === l.id ? 'active' : ''}" data-layout="${l.id}" onclick="selectNoteLayout(this,'${l.id}')">
      <div class="note-layout-preview">${l.preview}</div>
      <span class="note-layout-label">${l.label}</span>
    </button>
  `).join('');
}

function _getWeekViewConfig() {
  return [
    { id:'stats',   label:t('settings_week_stats'), desc:t('settings_week_stats_desc'), preview:'<div class="wvp-stats"><span class="wvp-num">3/5</span><span class="wvp-dur">· 2h</span></div>' },
    { id:'compact', label:t('settings_week_compact'),     desc:t('settings_week_compact_desc'), preview:'<div class="wvp-compact"><div class="wvp-line"></div><div class="wvp-line"></div><div class="wvp-line short"></div></div>' },
    { id:'full',    label:t('settings_week_full'),     desc:t('settings_week_full_desc'), preview:'<div class="wvp-full"><div class="wvp-task"><div class="wvp-check"></div><div class="wvp-text"></div></div><div class="wvp-task"><div class="wvp-check"></div><div class="wvp-text"></div></div></div>' },
  ];
}

function selectWeekView(btn, id) {
  document.querySelectorAll('#week-view-grid .wv-card').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function applyWeekView() {
  const active = document.querySelector('#week-view-grid .wv-card.active');
  settings.weekView = active?.dataset.view || 'stats';
  localStorage.setItem('li_settings', JSON.stringify(settings));
  scheduleRender(renderWeekGrid);
  showToast('success', t('week_view_applied'), t('week_view_msg'));
}

function renderWeekViewGrid() {
  const grid = document.getElementById('week-view-grid');
  if (!grid) return;
  grid.innerHTML = _getWeekViewConfig().map(v => `
    <button type="button" class="wv-card ${settings.weekView === v.id ? 'active' : ''}" data-view="${v.id}" onclick="selectWeekView(this,'${v.id}')">
      <div class="wv-preview">${v.preview}</div>
      <div class="wv-info">
        <span class="wv-label">${v.label}</span>
        <span class="wv-desc">${v.desc}</span>
      </div>
    </button>
  `).join('');
}

function renderAllSettingsGrids() {
  renderFocusStyleGrid();
  renderColorSwatches();
  renderVizStyleGrid();
  renderMainLayoutGrid();
  renderWeekViewGrid();
  renderNoteLayoutGrid();
}
