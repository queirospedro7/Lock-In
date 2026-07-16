// LockIn — Gestão de tarefas, templates, subtasks e filtros

// ----- SEARCH / FILTER -----
let _taskSearchQuery = '';
let _filterDebounceTimer = null;

function filterTasks(query) {
  _taskSearchQuery = query.trim().toLowerCase();
  clearTimeout(_filterDebounceTimer);
  _filterDebounceTimer = setTimeout(() => scheduleRender(renderToday), 150);
}

// ----- DATE PICKER (Dia específico) -----
function toggleDatePicker() {
  const recur = document.getElementById('inp-recur')?.value;
  const dateInput = document.getElementById('inp-date');
  if (!dateInput) return;
  if (recur === 'specific') {
    dateInput.classList.remove('hidden');
    // Default para hoje se não tiver valor
    if (!dateInput.value) dateInput.value = today();
  } else {
    dateInput.classList.add('hidden');
    dateInput.value = '';
  }
}

// ----- COLLAPSE (usado por renderWeekGrid) -----
let collapsedDays = new Set();

function toggleDayCollapse(dateStr) {
  if (collapsedDays.has(dateStr)) collapsedDays.delete(dateStr);
  else collapsedDays.add(dateStr);
  const card = document.getElementById('dc-' + dateStr);
  if (card) card.classList.toggle('collapsed');
}

function goToToday() {
  S.selectedDay = null;
  save();
  scheduleRender(renderToday, renderWeekGrid);
}

function selectDayFromWeek(dateStr) {
  // Se clicar em hoje, tratar como "sem seleção"
  S.selectedDay = dateStr === today() ? null : dateStr;
  save();
  scheduleRender(renderToday, renderWeekGrid);
}

// ----- CRUD -----
function addTask() {
  const inp = document.getElementById('task-input');
  const name = inp.value.trim();
  if (!name) {
    inp.focus();
    inp.style.borderBottomColor = 'var(--danger)';
    inp.style.animation = 'none';
    setTimeout(() => { inp.style.borderBottomColor = ''; }, 900);
    return;
  }
  const recur    = document.getElementById('inp-recur')?.value || 'once';
  const mins     = parseInt(document.getElementById('inp-duration')?.value) || 0;
  const priority = document.getElementById('inp-priority')?.value || 'normal';
  const category = document.getElementById('inp-category')?.value || '';
  const goalId   = document.getElementById('inp-goal')?.value || '';
  const notes    = document.getElementById('task-notes')?.value.trim() || '';

  // Data: "specific" usa o date picker, "once" usa hoje ou o dia selecionado
  const baseDate = S.selectedDay || today();
  const chosenDate = recur === 'specific'
    ? (document.getElementById('inp-date')?.value || baseDate)
    : baseDate;
  // Normalizar: "specific" é tratado como "once" internamente
  const taskRecur = recur === 'specific' ? 'once' : recur;
  const customRecur = recur === 'custom' ? getCustomRecurFromForm() : null;
  if (customRecur) {
    if (customRecur.start && customRecur.end && customRecur.start > customRecur.end) {
      showToast('warn', t('task_invalid_dates'), t('task_invalid_dates_msg'));
      return;
    }
    if (!customRecur.start && !customRecur.end && !customRecur.days.length) {
      showToast('warn', t('task_empty_custom'), t('task_empty_custom_msg'));
      return;
    }
  }
  const scheduledTime = document.getElementById('inp-time')?.value || undefined;
  const task = {
    id: Date.now().toString(),
    name, recur: taskRecur, mins, priority, category, goalId,
    notes: notes || undefined,
    customRecur: customRecur || undefined,
    scheduledTime,
    completions: {},
    date: taskRecur === 'once' ? chosenDate : undefined,
    createdAt: today(),
  };
  S.tasks.unshift(task);
  save();
  inp.value = '';
  const taskNotesInput = document.getElementById('task-notes');
  if (taskNotesInput) { taskNotesInput.value = ''; taskNotesInput.classList.add('hidden'); }
  const toggleNotesEl = document.getElementById('toggle-notes-btn');
  if (toggleNotesEl) toggleNotesEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="10" height="10"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> ' + t('task_add_notes');
  const timeEl = document.getElementById('inp-time');
  if (timeEl) timeEl.value = '';
  resetCustomRecurForm();
  scheduleRender(renderToday, renderWeekGrid);
  renderTemplatePicker();
  const durText = mins === 0 ? t('task_indefinite') : fmtMins(mins);
  showToast('success', t('task_added'), `"${name}" — ${durText}`);
}

function deleteTask(id) {
  const t = S.tasks.find(t => t.id === id);
  if (!t) return;
  if (t.archived) {
    S.tasks = S.tasks.filter(x => x.id !== id);
    save();
    scheduleRender(renderToday, renderWeekGrid);
    showToast('info', window.t('task_removed'), `"${t.name}"`);
    return;
  }
  const hasHistory = t.completions && Object.keys(t.completions).length > 0;
  showConfirm({
    title: window.t('task_archive_title'),
    msg: hasHistory
      ? window.t('task_archive_msg_done').replace('{name}', t.name)
      : window.t('task_archive_msg').replace('{name}', t.name),
    okLabel: window.t('task_archive_btn'),
    type: 'danger',
    onOk: () => {
      t.archived = true;
      save();
      scheduleRender(renderToday, renderWeekGrid);
      showToast('info', window.t('task_archived'), `"${t.name}"`);
    }
  });
}

function toggleTaskDate(id, dateStr) {
  const t = S.tasks.find(t => t.id === id);
  if (!t) return;
  const was = isCompleted(t, dateStr);
  setCompleted(t, dateStr, !was);
  save();
  scheduleRender(renderToday, renderWeekGrid);
  if (!was) showToast('success', window.t('task_completed'), `"${t.name}"`);
}

// ----- RENDER TODAY -----
function renderToday() {
  const activeDay = S.selectedDay || today();
  const todayStr = today();
  const dateObj = S.selectedDay ? new Date(S.selectedDay + 'T12:00:00') : new Date();
  const list = document.getElementById('today-list');

  // Day selector bar
  const daySelector = document.getElementById('day-selector');
  if (daySelector) {
    const isToday = !S.selectedDay;
    daySelector.innerHTML = isToday ? '' : `
      <div class="day-selector-bar">
        <button class="day-selector-back" onclick="goToToday()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="10" height="10"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${new Date(S.selectedDay + 'T12:00:00').toLocaleDateString(window.t('misc_locale'), { weekday: 'short', day: 'numeric', month: 'short' })} · voltar a hoje
        </button>
      </div>
    `;
  }

  let tasks = S.tasks.filter(t => !t.archived && taskActiveOnDate(t, dateObj));

  // Filter by search query
  if (_taskSearchQuery) {
    tasks = tasks.filter(t =>
      t.name.toLowerCase().includes(_taskSearchQuery) ||
      (t.notes || '').toLowerCase().includes(_taskSearchQuery)
    );
  }

  const routineTasks = getActiveRoutineTasksForDate(dateObj, activeDay);
  const allTasks = [...routineTasks, ...tasks];

  const pending = allTasks.filter(t => t._isRoutine ? !t._done : !isCompleted(t, activeDay));
  const done    = allTasks.filter(t => t._isRoutine ? t._done : isCompleted(t, activeDay));
  const countEl = document.getElementById('today-count');
  if (countEl) countEl.textContent = allTasks.length ? `${done.length}/${allTasks.length}` : '';

  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = allTasks.length ? `${(done.length / allTasks.length) * 100}%` : '0%';

  if (!allTasks.length) {
    list.innerHTML = `<div class="empty-state">${t('task_empty_today')}</div>`;
    return;
  }

  list.innerHTML = [...pending, ...done].map(t => {
    if (t._isRoutine) {
      const isDone = t._done;
      const timeBadge = t.scheduledTime ? `<span class="task-time-badge">${escHtml(t.scheduledTime)}</span>` : '';
      return `
        <div class="task-row ${isDone ? 'done' : ''}">
          <button class="task-check" onclick="toggleRoutineTask('${escAttr(t.routineId)}','${escAttr(t.routineTaskId)}','${escAttr(activeDay)}')"></button>
          <div class="task-content">
            <div class="task-name-row">
              <span class="task-routine-badge" style="background:${t.routineColor}">${escHtml(t.routineName)}</span>
              <span class="task-name">${escHtml(t.name)}</span>
            </div>
            ${t.notes ? `<div class="task-notes-preview">${escHtml(t.notes)}</div>` : ''}
          </div>
          <div class="task-badges">
            ${timeBadge}
            <span class="badge-recur">${window.t('task_routine_badge')}</span>
            <span class="task-mins">${fmtMins(t.mins)}</span>
          </div>
        </div>`;
    }

    const isDone = isCompleted(t, activeDay);
    const label  = t.recur === 'custom' ? getCustomRecurLabel(t.customRecur) : (getRecurLabel(t.recur) || '');
    const prio   = t.priority || 'normal';
    const catLabel = t.category ? getCategoryLabel(t.category) || '' : '';
    const catColor = t.category ? CATEGORY_COLORS[t.category] || '' : '';
    const prioHtml = prio === 'high'
      ? `<span class="badge-priority-high">${window.t('task_priority_urgente')}</span>`
      : prio === 'low'
      ? `<span class="badge-priority-low">${window.t('task_priority_baixa')}</span>`
      : '';
    const timeBadge = t.scheduledTime
      ? `<span class="task-time-badge">${escHtml(t.scheduledTime)}</span>`
      : '';
    const subtasksHtml = t.subtasks && t.subtasks.length
      ? `<div class="subtask-list">${t.subtasks.map(st =>
          `<div class="subtask-row">
            <button class="subtask-check ${st.done ? 'done' : ''}" onclick="toggleSubtask('${escAttr(t.id)}','${escAttr(st.id)}')"></button>
            <span class="subtask-name ${st.done ? 'done' : ''}">${escHtml(st.name)}</span>
            <button class="subtask-del" onclick="deleteSubtask('${escAttr(t.id)}','${escAttr(st.id)}')">×</button>
          </div>`
        ).join('')}</div>`
      : '';
    return `
      <div class="task-row ${isDone ? 'done' : ''} priority-${prio}" draggable="true" ondragstart="onDragStart(event,'${escAttr(t.id)}')" ondragover="onDragOver(event)" ondrop="onDrop(event,'${escAttr(t.id)}')" ondragleave="onDragLeave(event)" title="${t.notes ? escHtml(t.notes) : ''}">
        <span class="drag-handle">⠿</span>
        <button class="task-check" onclick="toggleTaskDate('${escAttr(t.id)}','${escAttr(activeDay)}')"></button>
        <div class="task-content">
          <div class="task-name-row">
            ${catLabel ? `<span class="task-cat-badge" style="background: ${catColor}">${catLabel}</span>` : ''}
            <span class="task-name">${escHtml(t.name)}</span>
          </div>
          ${t.notes ? `<div class="task-notes-preview">${escHtml(t.notes)}</div>` : ''}
          ${subtasksHtml}
          <div class="subtask-add-form">
            <input class="subtask-add-input" id="st-input-${escAttr(t.id)}" placeholder="${window.t('task_subtask_placeholder')}" autocomplete="off" onkeydown="if(event.key==='Enter')addSubtask('${escAttr(t.id)}',this.value)"/>
            <button class="subtask-add-btn" onclick="addSubtask('${escAttr(t.id)}',document.getElementById('st-input-${escAttr(t.id)}').value)">+</button>
          </div>
        </div>
        <div class="task-badges">
          ${timeBadge}
          ${prioHtml}
          ${label ? `<span class="badge-recur">${label}</span>` : ''}
          <span class="task-mins">${fmtMins(t.mins)}</span>
        </div>
        <div class="task-actions">
          <button class="task-action-btn" onclick="saveTaskAsTemplate('${escAttr(t.id)}')" title="${window.t('task_save_template')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="10" height="10"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </button>
          <button class="task-del" onclick="deleteTask('${escAttr(t.id)}')">×</button>
        </div>
      </div>`;
  }).join('');
  _initDragDrop();
}

// ----- RENDER WEEK GRID -----
function renderWeekGrid() {
  const days = getWeekDays(S.weekOffset);
  const todayStr = today();
  const grid = document.getElementById('week-grid');
  const mode = settings.weekView || 'stats';

  grid.className = 'week-grid week-mode-' + mode;

  grid.innerHTML = days.map(dateObj => {
    const dateStr = fmtDate(dateObj);
    const isToday = dateStr === todayStr;
    const dow = dateObj.getDay();
    const dayTasks = activeTasksForDate(dateObj);
    const doneCount = dayTasks.filter(t => isCompleted(t, dateStr)).length;
    const collapsed = collapsedDays.has(dateStr) && !isToday && dateStr !== (S.selectedDay || todayStr);

    const activeRoutines = (S.routines || []).filter(r => {
      if (!r.tasks || !r.tasks.length) return false;
      return !r.days || !r.days.length || r.days.includes(dow);
    });

    const totalCount = dayTasks.length + activeRoutines.length;
    const doneRoutines = activeRoutines.filter(r => {
      const comps = (r.completions && r.completions[dateStr]) || {};
      return r.tasks.length > 0 && r.tasks.every(t => comps[t.id]);
    }).length;
    const totalDone = doneCount + doneRoutines;

    const dayMins = dayTasks.reduce((a, t) => a + (t.mins || 0), 0);
    const avgMins = dayTasks.length > 0 ? Math.round(dayMins / dayTasks.length) : 0;
    const pct = totalCount > 0 ? Math.round((totalDone / totalCount) * 100) : 0;

    // --- Build inner content based on mode ---
    let innerHtml = '';

    if (mode === 'stats') {
      if (totalCount > 0) {
        const statsItems = [];
        statsItems.push(`<span class="day-stat-num">${totalDone}/${totalCount}</span>`);
        if (dayMins > 0) statsItems.push(`<span class="day-stat-sep">·</span><span class="day-stat-dur">${fmtMins(dayMins)}</span>`);
        if (dayTasks.length > 1 && avgMins > 0) statsItems.push(`<span class="day-stat-sep">·</span><span class="day-stat-avg">~${fmtMins(avgMins)}/t</span>`);
        const routinesPills = activeRoutines.map(r => {
          const tasks = r.tasks || [];
          const completions = (r.completions && r.completions[dateStr]) || {};
          const doneAll = tasks.length > 0 && tasks.every(t => completions[t.id]);
          return `<span class="day-routine-pill ${doneAll ? 'done' : ''}" style="--rc:${r.color || '#6366f1'}" title="${escHtml(r.name)}">${escHtml(r.name)}</span>`;
        }).join('');
        innerHtml = `<div class="day-stats-row">${statsItems.join('')}</div>${routinesPills ? `<div class="day-routines-row">${routinesPills}</div>` : ''}`;
      }
    } else if (mode === 'compact') {
      const routinesHtml = activeRoutines.map(r => {
        const tasks = r.tasks || [];
        const completions = (r.completions && r.completions[dateStr]) || {};
        const doneAll = tasks.length > 0 && tasks.every(t => completions[t.id]);
        return `<span class="day-routine-pill ${doneAll ? 'done' : ''}" style="--rc:${r.color || '#6366f1'}" title="${escHtml(r.name)}">${escHtml(r.name)}</span>`;
      }).join('');
      const tasksHtml = dayTasks.map(t => {
        const done = isCompleted(t, dateStr);
        const catColor = t.category ? CATEGORY_COLORS[t.category] || '' : '';
        return `<div class="day-task-compact ${done ? 'done' : ''}" onclick="toggleTaskDate('${escAttr(t.id)}','${escAttr(dateStr)}')">
          <span class="day-task-cdot" style="background:${done ? 'var(--success)' : catColor || 'var(--border2)'}"></span>
          <span class="day-task-cname">${escHtml(t.name)}</span>
          ${t.mins ? `<span class="day-task-cdur">${fmtMins(t.mins)}</span>` : ''}
        </div>`;
      }).join('');
      innerHtml = routinesHtml ? `<div class="day-routines-row">${routinesHtml}</div>` : '';
      innerHtml += tasksHtml;
    } else {
      // full
      const routinesHtml = activeRoutines.map(r => {
        const tasks = r.tasks || [];
        const completions = (r.completions && r.completions[dateStr]) || {};
        const doneAll = tasks.length > 0 && tasks.every(t => completions[t.id]);
        return `
          <div class="day-routine-row ${doneAll ? 'done' : ''}">
            <span class="day-routine-dot" style="background:${r.color || '#6366f1'}"></span>
            <span class="day-routine-name">${escHtml(r.name)}</span>
            ${doneAll ? '<span class="day-routine-badge">✓</span>' : `<span class="day-routine-count">${tasks.filter(t => completions[t.id]).length}/${tasks.length}</span>`}
          </div>`;
      }).join('');
      const tasksHtml = dayTasks.map(t => {
        const done = isCompleted(t, dateStr);
        const label = t.recur === 'custom' ? getCustomRecurLabel(t.customRecur) : (getRecurLabel(t.recur) || '');
        const catLabel = t.category ? getCategoryLabel(t.category) || '' : '';
        const catColor = t.category ? CATEGORY_COLORS[t.category] || '' : '';
        return `
          <div class="day-task-row ${done ? 'done' : ''}" title="${t.notes ? escHtml(t.notes) : ''}">
            <button class="day-task-check" onclick="toggleTaskDate('${escAttr(t.id)}','${escAttr(dateStr)}')"></button>
            ${catLabel ? `<span class="day-task-cat" style="color: ${catColor}">${catLabel}</span>` : ''}
            <span class="day-task-name">${escHtml(t.name)}</span>
            ${label ? `<span class="day-task-recur">${label}</span>` : ''}
            <button class="day-task-del" onclick="deleteTask('${escAttr(t.id)}')">×</button>
          </div>`;
      }).join('');
      innerHtml = routinesHtml + tasksHtml;
    }

    // --- Header dots (full mode only) ---
    const dotsHtml = mode === 'full'
      ? `<div class="day-dots">${dayTasks.slice(0, 6).map(t =>
          `<div class="day-dot ${isCompleted(t, dateStr) ? 'done' : 'pending'}"></div>`
        ).join('')}</div>`
      : (totalCount > 0 ? `<div class="day-mini-bar"><div class="day-mini-fill" style="width:${pct}%"></div></div>` : '');

    const countLabel = mode === 'stats'
      ? (totalCount > 0 ? '' : '<span class="day-stat-empty">—</span>')
      : `${totalDone}/${totalCount}`;

    return `
      <div class="day-card ${isToday ? 'today' : ''} ${collapsed ? 'collapsed' : ''}" id="dc-${dateStr}">
        <div class="day-head" onclick="selectDayFromWeek('${escAttr(dateStr)}')">
          <div class="day-head-left">
            <span class="day-name">${getDaysShort()[dow]}${isToday ? ' · ' + t('week_today') : ''}</span>
            <span class="day-date">${dateObj.getDate()} ${dateObj.toLocaleDateString(t('misc_locale'),{month:'short'})}</span>
          </div>
          <div class="day-progress">
            ${dotsHtml}
            <span class="day-count">${countLabel}</span>
          </div>
        </div>
        <div class="day-tasks">
          ${innerHtml || `<div class="day-empty">${t('task_empty_day')}</div>`}
        </div>
      </div>`;
  }).join('');
  renderWeekDatePicker();
}

// ----- FOCUS PICKER -----
function openFocusPicker() {
  const todayStr  = today();
  const todayDate = new Date();
  const pending   = S.tasks.filter(t => !t.archived && taskActiveOnDate(t, todayDate) && !isCompleted(t, todayStr));
  const sel = document.getElementById('fp-task');
  sel.innerHTML = `<option value="">${t('task_focus_free')}</option>` +
    (pending.length
      ? pending.map(t => {
          const catLabel = t.category ? (getCategoryLabel(t.category) || t.category) + ' — ' : '';
          const durText = t.mins === 0 ? window.t('task_dur_indef') : fmtMins(t.mins);
          return `<option value="${t.id}">${catLabel}${escHtml(t.name)} (${durText})</option>`;
        }).join('')
      : '');

  const task = pending[0];
  if (task && task.mins > 0) {
    const hours = Math.floor(task.mins / 60);
    const mins = task.mins % 60;
    document.getElementById('fp-hours').value = hours;
    document.getElementById('fp-minutes').value = mins;
    document.getElementById('fp-seconds').value = 0;
  }

  sel.removeEventListener('change', updateDurationFromTask);
  sel.addEventListener('change', updateDurationFromTask);
  rebuildCustomSelect(sel);
  document.getElementById('modal-focus').classList.remove('hidden');
}

function updateDurationFromTask() {
  const taskId = document.getElementById('fp-task').value;
  const task = S.tasks.find(t => t.id === taskId);
  if (task && task.mins > 0) {
    const hours = Math.floor(task.mins / 60);
    const mins = task.mins % 60;
    document.getElementById('fp-hours').value = hours;
    document.getElementById('fp-minutes').value = mins;
    document.getElementById('fp-seconds').value = 0;
  }
}

function adjustDuration(fieldId, delta) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  const max = fieldId === 'fp-hours' ? 23 : 59;
  let val = (parseInt(el.value) || 0) + delta;
  if (val < 0) val = max;
  if (val > max) val = 0;
  el.value = val;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
}

function setDuration(hours, mins, btn) {
  document.getElementById('fp-hours').value = hours;
  document.getElementById('fp-minutes').value = mins;
  document.getElementById('fp-seconds').value = 0;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ----- GOALS SELECT -----
function updateGoalsSelect() {
  const sel = document.getElementById('inp-goal');
  if (!sel) return;
  sel.innerHTML = `<option value="">${t('task_no_goal')}</option>` +
    S.goals.map(g => `<option value="${g.id}">${escHtml(g.name)}</option>`).join('');
  rebuildCustomSelect(sel);
}

// ----- WEEK DATE PICKER -----
function renderWeekDatePicker() {
  const monthEl = document.getElementById('week-month-select');
  const yearEl = document.getElementById('week-year-select');
  if (!monthEl || !yearEl) return;
  
  const currentWeek = getWeekDays(S.weekOffset);
  const weekStart = currentWeek[0];
  
  const monthNames = Array.from({length: 12}, (_, i) => new Date(2024, i, 1).toLocaleDateString(t('misc_locale'), { month: 'short' }));
  
  monthEl.innerHTML = monthNames.map((name, i) => 
    `<option value="${i}" ${i === weekStart.getMonth() ? 'selected' : ''}>${name}</option>`
  ).join('');
  
  const year = weekStart.getFullYear();
  const years = [];
  for (let y = year - 5; y <= year + 5; y++) years.push(y);
  yearEl.innerHTML = years.map(y => 
    `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`
  ).join('');

  rebuildCustomSelect(monthEl);
  rebuildCustomSelect(yearEl);
}

function jumpToWeekFromPicker() {
  const month = parseInt(document.getElementById('week-month-select')?.value);
  const year = parseInt(document.getElementById('week-year-select')?.value);
  if (isNaN(month) || isNaN(year)) return;
  
  const target = new Date(year, month, 1);
  const todayDate = new Date();
  const todayMonday = new Date(todayDate);
  todayMonday.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
  
  const targetMonday = new Date(target);
  targetMonday.setDate(target.getDate() - ((target.getDay() + 6) % 7));
  
  const diffWeeks = Math.round((targetMonday - todayMonday) / (7 * 86400000));
  S.weekOffset = diffWeeks;
  save();
  scheduleRender(renderWeekGrid, renderWeekDatePicker);
}

// ----- DRAG & DROP -----
let _dragSrcId = null;
function onDragStart(e, id) {
  _dragSrcId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', id);
  setTimeout(() => e.target.classList.add('dragging'), 0);
}
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const row = e.currentTarget;
  if (!row._cachedRect || row._cachedRectY !== e.clientY) {
    row._cachedRect = row.getBoundingClientRect();
    row._cachedRectY = e.clientY;
  }
  const rect = row._cachedRect;
  const midY = rect.top + rect.height / 2;
  row.classList.remove('drag-over', 'drag-over-bottom');
  if (e.clientY < midY) row.classList.add('drag-over');
  else row.classList.add('drag-over-bottom');
}
function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over', 'drag-over-bottom');
}
function onDrop(e, targetId) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over', 'drag-over-bottom');
  document.querySelectorAll('.task-row.dragging').forEach(el => el.classList.remove('dragging'));
  if (!_dragSrcId || _dragSrcId === targetId) { _dragSrcId = null; return; }
  const srcIdx = S.tasks.findIndex(t => t.id === _dragSrcId);
  const tgtIdx = S.tasks.findIndex(t => t.id === targetId);
  _dragSrcId = null;
  if (srcIdx === -1 || tgtIdx === -1) return;
  const [moved] = S.tasks.splice(srcIdx, 1);
  const newTgtIdx = S.tasks.findIndex(t => t.id === targetId);
  if (newTgtIdx === -1) { S.tasks.push(moved); }
  else { S.tasks.splice(newTgtIdx, 0, moved); }
  save();
  scheduleRender(renderToday, renderWeekGrid);
}
function _initDragDrop() {
  document.querySelectorAll('.task-row.drag-over, .task-row.drag-over-bottom').forEach(el => {
    el.classList.remove('drag-over', 'drag-over-bottom');
  });
}

// ----- SUBTASKS -----
function addSubtask(taskId, name) {
  const t = S.tasks.find(x => x.id === taskId);
  if (!t || !name) return;
  if (!t.subtasks) t.subtasks = [];
  t.subtasks.push({ id: 'st_' + Date.now(), name: name.trim(), done: false });
  save();
  scheduleRender(renderToday);
}

function toggleSubtask(taskId, subtaskId) {
  const t = S.tasks.find(x => x.id === taskId);
  if (!t || !t.subtasks) return;
  const st = t.subtasks.find(x => x.id === subtaskId);
  if (!st) return;
  st.done = !st.done;
  save();
  scheduleRender(renderToday);
}

function deleteSubtask(taskId, subtaskId) {
  const t = S.tasks.find(x => x.id === taskId);
  if (!t || !t.subtasks) return;
  t.subtasks = t.subtasks.filter(x => x.id !== subtaskId);
  save();
  scheduleRender(renderToday);
}

// ----- TASK TEMPLATES -----
function saveTaskAsTemplate(taskId) {
  const t = S.tasks.find(x => x.id === taskId);
  if (!t) return;
  const tpl = {
    id: 'tpl_' + Date.now(),
    name: t.name,
    mins: t.mins,
    category: t.category,
    priority: t.priority,
    recur: t.recur,
    goalId: t.goalId,
    notes: t.notes,
    createdAt: Date.now(),
  };
  S.templates.push(tpl);
  save();
  renderTemplatePicker();
  showToast('success', window.t('task_template_saved'), window.t('task_template_saved_msg').replace('{name}', t.name));
}

function setSelectValue(selectEl, val) {
  if (!selectEl) return;
  selectEl.value = val;
  const wrapper = selectEl.closest('.custom-dropdown');
  if (!wrapper) return;
  const trigger = wrapper.querySelector('.cd-trigger');
  const menu = wrapper.querySelector('.cd-menu');
  if (trigger) {
    const opt = selectEl.options[selectEl.selectedIndex];
    trigger.textContent = opt ? opt.textContent : val;
  }
  if (menu) {
    menu.querySelectorAll('.cd-option').forEach(o => {
      o.classList.toggle('cd-selected', o.dataset.value === val);
    });
  }
}

function loadTaskTemplate(tplId) {
  const tpl = S.templates.find(x => x.id === tplId);
  if (!tpl) return;
  const inp = document.getElementById('task-input');
  if (inp) inp.value = tpl.name;
  setSelectValue(document.getElementById('inp-duration'), tpl.mins || 25);
  if (tpl.category) setSelectValue(document.getElementById('inp-category'), tpl.category);
  if (tpl.priority) setSelectValue(document.getElementById('inp-priority'), tpl.priority);
  if (tpl.recur) setSelectValue(document.getElementById('inp-recur'), tpl.recur);
  if (tpl.goalId) setSelectValue(document.getElementById('inp-goal'), tpl.goalId);
  const notesEl = document.getElementById('task-notes');
  if (notesEl && tpl.notes) { notesEl.value = tpl.notes; notesEl.classList.remove('hidden'); }
  inp?.focus();
  showToast('info', t('task_template_loaded'), t('task_template_loaded_msg'));
}

function deleteTaskTemplate(tplId) {
  S.templates = S.templates.filter(x => x.id !== tplId);
  save();
  renderTemplatePicker();
}

function renderTemplatePicker() {
  const el = document.getElementById('template-picker');
  if (!el) return;
  const templates = S.templates;
  if (!templates.length) { el.innerHTML = ''; el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.innerHTML = `<span class="template-label">${t('task_templates_label')}</span>` +
    templates.map(t =>
      `<button class="template-btn" onclick="loadTaskTemplate('${t.id}')" title="${window.t('task_template_load')}">${escHtml(t.name)}</button>
      <button class="template-del-btn" onclick="deleteTaskTemplate('${t.id}')">×</button>`
    ).join('');
}
