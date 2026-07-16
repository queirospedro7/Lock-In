// LockIn — Ponto de entrada
// ---------------------------------------

// ── RENDER BATCHING ───────────────────────────────────────────────────────────
// Agrupa renders pedidos no mesmo frame para evitar re-renders duplicados.
const _pendingRenders = new Set();
let _renderRAF = null;

function scheduleRender(...fns) {
  fns.forEach(f => _pendingRenders.add(f));
  if (_renderRAF) return;
  _renderRAF = requestAnimationFrame(() => {
    _renderRAF = null;
    const toRun = [..._pendingRenders];
    _pendingRenders.clear();
    toRun.forEach(f => f());
  });
}

function renderAll() {
  scheduleRender(renderWeekGrid, renderToday);
  const notesGrid = document.getElementById('month-notes-grid');
  if (notesGrid && !notesGrid.closest('.hidden')) {
    scheduleRender(renderMonthNotes, renderMonthGridMain);
  }
}

function shiftWeek(dir) { S.weekOffset += dir; scheduleRender(renderWeekGrid); save(); }
function goToCurrentWeek() { S.weekOffset = 0; S.selectedDay = null; scheduleRender(renderWeekGrid); renderToday(); save(); }

(function init() {
  loadSettings();
  applyTheme();
  if (settings.accentColor) {
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.style.setProperty('--ring-color', settings.accentColor);
    document.documentElement.style.setProperty('--accent-text', getContrastColor(settings.accentColor));
  }
  if (settings.fontSize) applyFontSize();
  if (settings.mainLayout && settings.mainLayout !== 'default') applyMainLayout(settings.mainLayout);
  updateNotifBtn();
  updateGoalsSelect();
  refreshCategorySelects();
  renderCustomCategories();

  renderAll();
  renderTemplatePicker();
  setView('main');
  document.getElementById('inp-recur')?.addEventListener('change', () => {
    toggleCustomRecurPanel();
    toggleDatePicker();
  });
  toggleCustomRecurPanel();
  toggleDatePicker();

  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('splash-out');
      setTimeout(() => splash.remove(), 520);
    }
  }, 1400);

  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(() => updateNotifBtn());
    }
  }, 3000);

  tickClock();
  updateDateLabel();
  setInterval(tickClock, 1000);
  initCustomSelects();
  _refreshStaticTexts();
  checkScheduledNotifications();
  setInterval(checkScheduledNotifications, 30000);

  function updateTimeProgress() {
    const now = new Date();
    const secsPassed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const dayBar = document.getElementById('day-bar');
    const dayPct = document.getElementById('day-percent');
    const monthBar = document.getElementById('month-bar');
    const monthPct = document.getElementById('month-percent');
    const yearBar = document.getElementById('year-bar');
    const yearPct = document.getElementById('year-percent');
    if (dayBar) dayBar.style.width = (secsPassed / 86400) * 100 + '%';
    if (dayPct) dayPct.textContent = Math.round((secsPassed / 86400) * 100) + '%';
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (monthBar) monthBar.style.width = (now.getDate() / daysInMonth) * 100 + '%';
    if (monthPct) monthPct.textContent = Math.round((now.getDate() / daysInMonth) * 100) + '%';
    const year = now.getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDays = isLeap ? 366 : 365;
    const start = new Date(year, 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    if (yearBar) yearBar.style.width = (dayOfYear / totalDays) * 100 + '%';
    if (yearPct) yearPct.textContent = Math.round((dayOfYear / totalDays) * 100) + '%';
  }
  setInterval(updateTimeProgress, 60000);
  updateTimeProgress();

  // Clean up all timers on unload
  window.addEventListener('beforeunload', () => {
    if (timer) { clearInterval(timer); timer = null; }
    if (soundVizInterval) { clearInterval(soundVizInterval); soundVizInterval = null; }
    if (typeof _vizRAF !== 'undefined' && _vizRAF) { cancelAnimationFrame(_vizRAF); _vizRAF = null; }
    clearNudges();
    stopIdleTimer();
    flushNoteSave();
  });
})();
