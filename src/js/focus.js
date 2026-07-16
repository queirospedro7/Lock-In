// LockIn — Modo foco e temporizador

let timer = null;
let totalSecs = 0;
let remainSecs = 0;
let remainMs = 0;
let isPaused = false;
let _currentFocusTask = null;
let _focusCachedTask = null;
let _notifiedMilestones = new Set();
let _pomodoroMode = false;
let _pomodoroCycle = 0;
let _pomodoroPhase = 'work';
const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;
const POMODORO_LONG_BREAK = 15 * 60;


let focusStartTime = 0;
let lastTickTime = 0;
let focusActionsHidden = false;

const PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="8,5 19,12 8,19"/></svg>';

function updatePauseUI() {
  const btn = document.getElementById('pause-btn');
  const icon = document.getElementById('pause-btn-icon');
  const label = document.getElementById('pause-label');
  const pill = document.getElementById('focus-phase-pill');
  const ringLabel = document.getElementById('ring-label');
  const wrap = document.querySelector('.focus-wrap');
  if (!btn) return;

  if (isPaused) {
    btn.classList.add('paused');
    if (icon) icon.innerHTML = PLAY_ICON;
    if (label) label.textContent = t('focus_resume');
    btn.title = t('focus_resume_title');
    if (pill) pill.textContent = t('focus_pomodoro_break');
    if (ringLabel) ringLabel.textContent = t('focus_paused');
    wrap?.classList.add('session-paused');
  } else {
    btn.classList.remove('paused');
    if (icon) icon.innerHTML = PAUSE_ICON;
    if (label) label.textContent = t('focus_pause');
    btn.title = t('focus_pause_title');
    if (pill && timer) {
      if (_pomodoroMode) {
        pill.textContent = _pomodoroPhase === 'work' ? t('focus_pomodoro_cycle', 'POMODORO {n}/4').replace('{n}', _pomodoroCycle) : t('focus_pomodoro_break');
      } else {
        pill.textContent = t('focus_phase');
      }
    }
    if (ringLabel) ringLabel.textContent = t('focus_remaining');
    wrap?.classList.remove('session-paused');
  }
}

function startFocus(taskId, hours, mins, secs) {
  let totalSecsVal;
  if (_pomodoroMode) {
    totalSecsVal = POMODORO_WORK;
  } else {
    totalSecsVal = hours * 3600 + mins * 60 + secs;
  }

  if (totalSecsVal <= 0) {
    showToast('warn', t('focus_invalid_dur'), t('focus_invalid_dur_msg'));
    return;
  }

  const task = taskId ? S.tasks.find(t => t.id === taskId) : null;

  closeModal();
  _currentFocusTask = taskId || null;
  _focusCachedTask = task;
  totalSecs = totalSecsVal;
  remainSecs = totalSecs;
  remainMs = totalSecs * 1000;
  focusStartTime = Date.now();
  lastTickTime = Date.now();
  isPaused = false;

  if (task) {
    const catLabel = task.category ? (getCategoryLabel(task.category) || task.category) + ' — ' : '';
    const taskNameEl = document.getElementById('focus-task-name');
    if (taskNameEl) taskNameEl.textContent = catLabel + task.name;
    const notesEl = document.getElementById('focus-task-notes');
    if (notesEl) {
      if (task.notes) {
        notesEl.textContent = task.notes;
        notesEl.classList.remove('hidden');
      } else {
        notesEl.classList.add('hidden');
      }
    }
  } else {
    const taskNameEl = document.getElementById('focus-task-name');
    if (taskNameEl) taskNameEl.textContent = t('focus_free_session');
    const notesEl = document.getElementById('focus-task-notes');
    if (notesEl) notesEl.classList.add('hidden');
  }

  updateSessionCount();
  updatePauseUI();
  updateRing('ring-fg', remainSecs, totalSecs);
  updateRing('ring-glow', remainSecs, totalSecs);
  updateFocusTime();
  setView('focus');
  applyFocusStyleToView(settings.focusStyle || 'minimal');
  const ringFg = document.getElementById('ring-fg');
  if (ringFg) {
    const palette = THEME_PALETTES[settings.theme] || THEME_PALETTES.dark;
    ringFg.style.stroke = palette.text;
  }

  clearInterval(timer);
  timer = setInterval(focusTick, 1000);
  startSoundViz();
  _notifiedMilestones = new Set();
  const taskName = task ? task.name : t('focus_free_task');
  notify('focus', t('focus_started'), `"${taskName}" — ${fmtMins(Math.ceil(totalSecsVal/60))}. ${t('focus_started_msg')}`);
  resetIdleTimer();
}

function startPomodoro(taskId) {
  _pomodoroMode = true;
  _pomodoroCycle = 1;
  _pomodoroPhase = 'work';
  startFocus(taskId, 0, 25, 0);
}

function _logPomodoroWorkSession() {
  S.sessionCount++;
  S.sessions++;
  const focusDurationMins = Math.max(1, Math.round(POMODORO_WORK / 60));
  S.totalFocusTime += focusDurationMins;
  const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
  S.focusHistory.push({
    taskName: task?.name || 'Pomodoro',
    duration: focusDurationMins,
    durationSecs: POMODORO_WORK,
    date: new Date().toISOString(),
    category: task?.category || ''
  });
  save();
  if (task) { setCompleted(task, today(), true); save(); scheduleRender(renderToday, renderWeekGrid); }
}

function _nextPomodoroPhase() {
  if (_pomodoroPhase === 'work') {
    _logPomodoroWorkSession();
    _pomodoroCycle++;
    if (_pomodoroCycle > 4) _pomodoroCycle = 1;
    const isLongBreak = _pomodoroCycle === 1;
    _pomodoroPhase = 'break';
    const breakDuration = isLongBreak ? POMODORO_LONG_BREAK : POMODORO_BREAK;
    totalSecs = breakDuration;
    remainSecs = breakDuration;
    remainMs = breakDuration * 1000;
    updatePauseUI();
    const pill = document.getElementById('focus-phase-pill');
    if (pill) pill.textContent = isLongBreak ? t('focus_pomodoro_long_break') : t('focus_pomodoro_break');
    showToast('info', isLongBreak ? t('focus_pause_long') : t('focus_pause_short'), isLongBreak ? t('focus_pause_long_msg') : t('focus_pause_short_msg'));
    notify('pause', isLongBreak ? t('focus_pause_long_notif') : t('focus_pause_short_notif'), isLongBreak ? t('focus_pause_long_rest') : t('focus_pause_short_rest'));
  } else {
    _pomodoroPhase = 'work';
    totalSecs = POMODORO_WORK;
    remainSecs = POMODORO_WORK;
    remainMs = POMODORO_WORK * 1000;
    updatePauseUI();
    const pill = document.getElementById('focus-phase-pill');
    if (pill) pill.textContent = t('focus_pomodoro_cycle', 'POMODORO {n}/4').replace('{n}', _pomodoroCycle);
    showToast('success', t('focus_pomodoro_work'), t('focus_pomodoro_work_msg', {n: _pomodoroCycle}));
    notify('focus', t('focus_pomodoro_notif'), t('focus_pomodoro_cycle', 'POMODORO {n}/4').replace('{n}', _pomodoroCycle) + '.');
  }
  updateRing('ring-fg', remainSecs, totalSecs);
  updateRing('ring-glow', remainSecs, totalSecs);
}

function focusTick() {
  if (isPaused) return;

  const now = Date.now();
  const delta = now - lastTickTime;
  lastTickTime = now;

  remainMs -= delta;

  if (remainMs <= 0) {
    remainMs = 0;
    remainSecs = 0;
    clearInterval(timer);
    timer = null;
    updateFocusTime();
    updateRing('ring-fg', 0, totalSecs);
    updateRing('ring-glow', 0, totalSecs);
    if (_pomodoroMode) {
      _nextPomodoroPhase();
      timer = setInterval(focusTick, 1000);
    } else {
      sessionDone();
    }
    return;
  }

  const newRemainSecs = Math.ceil(remainMs / 1000);
  if (newRemainSecs !== remainSecs) {
    remainSecs = newRemainSecs;
    updateFocusTime();
    updateRing('ring-fg', remainSecs, totalSecs);
    updateRing('ring-glow', remainSecs, totalSecs);

    const taskName = _focusCachedTask ? _focusCachedTask.name : t('focus_free_task');

    if (remainSecs === 300 && totalSecs > 360 && !_notifiedMilestones.has('5min')) {
      _notifiedMilestones.add('5min');
      notify('focus', t('focus_milestone_5'), `"${taskName}" — ${t('focus_milestone_5_msg')}`);
    }
    if (remainSecs === 60 && totalSecs > 120 && !_notifiedMilestones.has('1min')) {
      _notifiedMilestones.add('1min');
      notify('focus', t('focus_milestone_1'), `"${taskName}" — ${t('focus_milestone_1_msg')}`);
    }
    const half = Math.floor(totalSecs / 2);
    if (remainSecs === half && totalSecs > 120 && !_notifiedMilestones.has('half')) {
      _notifiedMilestones.add('half');
      notify('focus', t('focus_milestone_half'), `"${taskName}" — ${t('focus_milestone_half_msg')}`);
    }
  }
}

function updateFocusTime() {
  const totalMins = Math.floor(remainSecs / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const secs = remainSecs % 60;

  if (hours > 0) {
    document.getElementById('focus-time').textContent =
      `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else if (settings.showSeconds === false) {
    document.getElementById('focus-time').textContent =
      `${String(mins).padStart(2, '0')}`;
  } else {
    document.getElementById('focus-time').textContent =
      `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (totalSecs > 0) {
    const pct = ((totalSecs - remainSecs) / totalSecs * 100).toFixed(2);
    document.querySelector('.focus-wrap')?.style.setProperty('--zen-progress', pct + '%');
  }
}

function updateRing(elId, remain, total) {
  const el = document.getElementById(elId);
  if (el) el.style.strokeDashoffset = CIRC * (1 - remain / total);
}

function endFocus() {
  _pomodoroMode = false;
  _pomodoroCycle = 0;
  _pomodoroPhase = 'work';
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  clearNudges();
  stopSoundViz();
  const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
  const elapsed = totalSecs - remainSecs;
  if (elapsed > 30) {
    const elapsedLabel = fmtDurationFromSecs(elapsed);
    showToast('focus', t('focus_interrupted'), `${task?.name ?? t('focus_free_task')} — ${t('focus_interrupted_msg', {mins: elapsedLabel})}`);
  }
  isPaused = false;
  remainSecs = 0;
  remainMs = 0;
  totalSecs = 0;
  focusActionsHidden = false;
  updatePauseUI();
  const actions2 = document.getElementById('focus-actions');
  if (actions2) { actions2.style.opacity = ''; actions2.style.pointerEvents = ''; actions2.style.transform = ''; }
  document.getElementById('ring-fg')?.classList.remove('ring-break');
  document.getElementById('timesup-overlay')?.classList.add('hidden');
  setView('main');
}

function abortFocus() {
  _pomodoroMode = false;
  _pomodoroCycle = 0;
  _pomodoroPhase = 'work';
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  clearNudges();
  stopSoundViz();
  isPaused = false;
  _currentFocusTask = null;
  remainSecs = 0;
  remainMs = 0;
  totalSecs = 0;
  focusActionsHidden = false;
  updatePauseUI();
  const actions = document.getElementById('focus-actions');
  if (actions) { actions.style.opacity = ''; actions.style.pointerEvents = ''; actions.style.transform = ''; }
  document.getElementById('ring-fg')?.classList.remove('ring-break');
  document.getElementById('timesup-overlay')?.classList.add('hidden');
  setView('main');
}

function togglePause() {
  if (!timer) return;

  isPaused = !isPaused;
  if (isPaused) {
    stopSoundViz();
    const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
    const taskName = task ? task.name : t('focus_free_task');
    notify('focus', t('focus_paused_notif_title'), `"${taskName}" — ${t('focus_paused_notif_msg')}`);
  } else {
    lastTickTime = Date.now();
    startSoundViz();
    const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
    const taskName = task ? task.name : t('focus_free_task');
    const remaining = fmtMins(Math.ceil(remainSecs / 60));
    notify('focus', t('focus_resumed'), `"${taskName}" — ${t('focus_resumed_msg', {mins: remaining})}`);
  }
  updatePauseUI();
}

function toggleFocusActions() {
  focusActionsHidden = !focusActionsHidden;
  const actions = document.getElementById('focus-actions');
  const btn = document.getElementById('hide-actions-btn');
  if (focusActionsHidden) {
    actions.style.opacity = '0';
    actions.style.pointerEvents = 'none';
    actions.style.transform = 'translateY(10px)';
    btn.querySelector('svg').style.transform = 'rotate(180deg)';
    btn.title = t('focus_show_controls');
  } else {
    actions.style.opacity = '1';
    actions.style.pointerEvents = '';
    actions.style.transform = '';
    btn.querySelector('svg').style.transform = '';
    btn.title = t('focus_hide_controls');
  }
}

function updateSessionCount() {
  const countEl = document.getElementById('focus-session-count');
  if (!countEl) return;
  const parts = [];
  if (S.sessionCount > 0) parts.push(t('focus_session_n', {n: S.sessionCount + 1}));
  countEl.textContent = parts.join(' · ');
}

function sessionDone() {
  clearNudges();
  stopSoundViz();
  S.sessionCount++;
  S.sessions++;
  const focusDurationMins = Math.max(1, Math.round(totalSecs / 60));
  S.totalFocusTime += focusDurationMins;
  const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
  S.focusHistory.push({
    taskName: task?.name || t('focus_free_task'),
    duration: focusDurationMins,
    durationSecs: totalSecs,
    date: new Date().toISOString(),
    category: task?.category || ''
  });
  save();
  const durationLabel = fmtDurationFromSecs(totalSecs);
  notify('success', t('focus_completed'), `${task?.name ?? t('focus_free_task')} — ${durationLabel}`);

  if (task) {
    setCompleted(task, today(), true);
    scheduleRender(renderToday, renderWeekGrid);
    if (task.goalId) {
      const g = S.goals.find(g => g.id === task.goalId);
      if (g) {
        const st = calcGoalProgress(g);
        if (st.prog >= 100) {
          setTimeout(() => notify('goal', t('focus_goal_done'), `"${g.name}" — ${t('focus_goal_done_msg')}`), 1500);
        } else if (st.prog >= 75 && st.prog < 100) {
          setTimeout(() => showToast('goal', t('focus_goal_almost'), `"${g.name}" — ${t('focus_goal_almost_msg', {pct: st.prog})}`), 1500);
        }
      }
    }
  }

  playAlarmSound(settings.alarmSound || 'digital');
  renderTimesUpSummary(task);
  document.getElementById('timesup-overlay')?.classList.remove('hidden');
}

function dismissTimesUp() {
  document.getElementById('timesup-overlay')?.classList.add('hidden');
  remainSecs = 0;
  remainMs = 0;
  totalSecs = 0;
  isPaused = false;
  focusActionsHidden = false;
  const actions = document.getElementById('focus-actions');
  if (actions) { actions.style.opacity = ''; actions.style.pointerEvents = ''; actions.style.transform = ''; }
  document.getElementById('ring-fg')?.classList.remove('ring-break');
  updatePauseUI();
  setView('main');
}

function getActiveTaskName() {
  if (!_currentFocusTask) return t('focus_free_task');
  const task = S.tasks.find(t => t.id === _currentFocusTask);
  return task ? task.name : t('focus_free_task');
}

// ---- TimesUp Summary ----

function renderTimesUpSummary(task) {
  const activityEl = document.getElementById('timesup-activity');
  const durationEl = document.getElementById('timesup-duration');
  const taskEl = document.getElementById('timesup-task');
  const notesEl = document.getElementById('timesup-notes');
  if (!activityEl || !durationEl || !taskEl) return;

  const durationText = fmtDurationFromSecs(totalSecs);

  if (task) {
    activityEl.textContent = task.name;
    durationEl.textContent = durationText;
    if (task.category) {
      const cat = getCategoryLabel(task.category) || task.category;
      const color = CATEGORY_COLORS[task.category] || 'var(--soft)';
      taskEl.innerHTML = `<span class="timesup-cat" style="color:${color}">${escHtml(cat)}</span><span class="timesup-task-name">${escHtml(task.name)}</span>`;
    } else {
      taskEl.textContent = task.name;
    }
    if (notesEl) {
      if (task.notes) {
        notesEl.textContent = task.notes;
        notesEl.classList.remove('hidden');
      } else {
        notesEl.textContent = '';
        notesEl.classList.add('hidden');
      }
    }
  } else {
    activityEl.textContent = t('focus_free_session');
    durationEl.textContent = durationText;
    taskEl.textContent = t('focus_no_task');
    if (notesEl) {
      notesEl.textContent = '';
      notesEl.classList.add('hidden');
    }
  }
}

const _origRenderTimesUp = renderTimesUpSummary;
renderTimesUpSummary = function(task) {
  _origRenderTimesUp(task);
  const durationEl = document.getElementById('timesup-duration');
  if (task && task.mins > 0 && durationEl) {
    const estimated = task.mins * 60;
    const diff = totalSecs - estimated;
    const sign = diff >= 0 ? '+' : '';
    const diffText = fmtDurationFromSecs(Math.abs(diff));
    durationEl.textContent += ` (${t('focus_estimated')}: ${fmtDurationFromSecs(estimated)}, ${sign}${diffText})`;
  }
};

// ---- Sound Visualization ----

function startSoundViz() {
  const viz = document.getElementById('sound-viz');
  const bars = document.querySelectorAll('#sound-viz .sv-bar');
  if (!bars.length) return;
  stopSoundViz();
  const anim = settings.vizAnimation || 'wave';
  if (anim === 'off') {
    viz?.classList.add('hidden');
    return;
  }
  viz?.classList.remove('hidden');
  startFakeSoundViz(bars);
}

let _vizRAF = null;

function startFakeSoundViz(bars) {
  if (!bars) bars = document.querySelectorAll('#sound-viz .sv-bar');
  const anim = settings.vizAnimation || 'wave';
  if (anim === 'static') {
    bars.forEach(b => b.style.height = '4px');
    return;
  }
  function tick() {
    tickVizBars(bars, anim);
    _vizRAF = requestAnimationFrame(tick);
  }
  _vizRAF = requestAnimationFrame(tick);
}

function stopSoundViz() {
  if (_vizRAF) { cancelAnimationFrame(_vizRAF); _vizRAF = null; }
  if (soundVizInterval) { clearInterval(soundVizInterval); soundVizInterval = null; }
  const viz = document.getElementById('sound-viz');
  if ((settings.vizAnimation || 'wave') === 'off') viz?.classList.add('hidden');
  else viz?.classList.remove('hidden');
  document.querySelectorAll('#sound-viz .sv-bar').forEach(b => b.style.height = '4px');
}

// ---- Nudge System (disabled) ----
function clearNudges() { /* nudges removed */ }
function onNudgeSettingChanged() { /* nudges removed */ }

// ---- Idle Timer ----

let idleTimer = null;
let _idleListenerAttached = false;
function _onUserActivity() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() =>
    showToast('warn', t('misc_idle_title'), t('misc_idle_msg'), 8000),
    30 * 60 * 1000
  );
}
function resetIdleTimer() {
  clearTimeout(idleTimer);
  _onUserActivity();
  if (!_idleListenerAttached) {
    document.addEventListener('click', _onUserActivity, { passive: true });
    _idleListenerAttached = true;
  }
}
function stopIdleTimer() {
  clearTimeout(idleTimer);
  if (_idleListenerAttached) {
    document.removeEventListener('click', _onUserActivity);
    _idleListenerAttached = false;
  }
}

// ---- Notification Scheduler ----

let _notifiedToday = new Set();
let _notifiedTodayDate = '';
function checkScheduledNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (settings.notifsEnabled === false) return;
  const now = new Date();
  const todayStr = today();
  if (_notifiedTodayDate !== todayStr) {
    _notifiedTodayDate = todayStr;
    _notifiedToday = new Set();
  }
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  S.tasks.filter(task => !task.archived && taskActiveOnDate(task, now) && !isCompleted(task, todayStr) && task.scheduledTime === timeStr).forEach(task => {
    const key = task.id + '_' + timeStr;
    if (_notifiedToday.has(key)) return;
    _notifiedToday.add(key);
    nativeNotify(t('misc_scheduled_task'), `"${task.name}" às ${timeStr}`);
  });

  S.routines.forEach(r => {
    const todayDow = now.getDay();
    if (r.days && r.days.length && !r.days.includes(todayDow)) return;
    (r.tasks || []).forEach(rt => {
      if (rt.scheduledTime && rt.scheduledTime === timeStr) {
        if (r.completions && r.completions[todayStr] && r.completions[todayStr][rt.id]) return;
        const key = r.id + '_' + rt.id + '_' + timeStr;
        if (_notifiedToday.has(key)) return;
        _notifiedToday.add(key);
        nativeNotify(t('misc_routine_notif'), `"${escHtml(rt.name)}" (${escHtml(r.name)}) às ${timeStr}`);
      }
    });
  });
}

// ---- Focus Style ----

function applyFocusStyleToView(style) {
  const focusWrap = document.querySelector('.focus-wrap');
  if (!focusWrap) return;
  focusWrap.classList.remove(...ALL_FOCUS_STYLES.map(s => 'style-' + s));
  focusWrap.classList.add('style-' + style);
  const ringFg = document.getElementById('ring-fg');
  if (ringFg) {
    ringFg.style.stroke = settings.accentColor || '#fff';
  }
}

// ---- Clock & Date ----

function tickClock() {
  const el = document.getElementById('clock');
  if (el) el.textContent =
    new Date().toLocaleTimeString(t('misc_locale'), { hour: '2-digit', minute: '2-digit' });
}

function updateDateLabel() {
  const el = document.getElementById('date-label');
  if (el) el.textContent =
    new Date().toLocaleDateString(t('misc_locale'), { weekday: 'long', day: 'numeric', month: 'long' });
}
