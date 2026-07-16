// LockIn — Estatísticas

function renderStats() {
  const content = document.getElementById('stats-content');
  if (!content) return;
  const now = new Date();
  const todayStr = today();

  // ── Hoje ─────────────────────────────────────────────────────────────────
  const todayTasks = activeTasksForDate(now);
  const todayDone  = todayTasks.filter(t => isCompleted(t, todayStr)).length;
  const todayTotal = todayTasks.length;
  const todayPct   = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  // Rotinas de hoje
  const todayDow = now.getDay();
  const todayRoutines = (S.routines || []).filter(r =>
    r.tasks && r.tasks.length && (!r.days || !r.days.length || r.days.includes(todayDow))
  );
  const todayRoutinesDone = todayRoutines.filter(r => {
    const comps = (r.completions && r.completions[todayStr]) || {};
    return r.tasks.every(t => comps[t.id]);
  }).length;

  // ── Esta semana ───────────────────────────────────────────────────────────
  let weekDone = 0, weekTotal = 0, weekRoutineDone = 0, weekRoutineTotal = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const ds = fmtDate(d);
    const dt = activeTasksForDate(d);
    weekTotal += dt.length;
    weekDone  += dt.filter(t => isCompleted(t, ds)).length;
    const dow = d.getDay();
    const rs = (S.routines || []).filter(r =>
      r.tasks && r.tasks.length && (!r.days || !r.days.length || r.days.includes(dow))
    );
    weekRoutineTotal += rs.length;
    weekRoutineDone  += rs.filter(r => {
      const comps = (r.completions && r.completions[ds]) || {};
      return r.tasks.every(t => comps[t.id]);
    }).length;
  }
  const weekPct = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

  // ── Semana anterior (tendência) ───────────────────────────────────────────
  let prevWeekDone = 0, prevWeekTotal = 0;
  for (let i = 7; i < 14; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const ds = fmtDate(d);
    const dt = activeTasksForDate(d);
    prevWeekTotal += dt.length;
    prevWeekDone  += dt.filter(t => isCompleted(t, ds)).length;
  }
  const thisWeekRate = weekTotal > 0 ? weekDone / weekTotal : 0;
  const prevWeekRate = prevWeekTotal > 0 ? prevWeekDone / prevWeekTotal : 0;
  const weekTrend = prevWeekTotal > 0 ? Math.round((thisWeekRate - prevWeekRate) * 100) : 0;

  // ── Este mês ──────────────────────────────────────────────────────────────
  let monthDone = 0, monthTotal = 0, monthRoutineDone = 0, monthRoutineTotal = 0;
  for (let d = 1; d <= now.getDate(); d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d);
    const ds = fmtDate(date);
    const dt = activeTasksForDate(date);
    monthTotal += dt.length;
    monthDone  += dt.filter(t => isCompleted(t, ds)).length;
    const dow = date.getDay();
    const rs = (S.routines || []).filter(r =>
      r.tasks && r.tasks.length && (!r.days || !r.days.length || r.days.includes(dow))
    );
    monthRoutineTotal += rs.length;
    monthRoutineDone  += rs.filter(r => {
      const comps = (r.completions && r.completions[ds]) || {};
      return r.tasks.every(t => comps[t.id]);
    }).length;
  }
  const monthPct = monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 0;

  // ── Foco este mês ─────────────────────────────────────────────────────────
  let monthFocusMins = 0;
  for (let d = 1; d <= now.getDate(); d++) {
    const ds = fmtDate(new Date(now.getFullYear(), now.getMonth(), d));
    monthFocusMins += (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(ds))
      .reduce((a, s) => a + (s.duration || 0), 0);
  }

  // ── Streak ────────────────────────────────────────────────────────────────
  const completedDates = new Set();
  S.tasks.forEach(task => {
    if (task.completions) Object.keys(task.completions).forEach(d => {
      if (task.completions[d]) completedDates.add(d);
    });
  });
  let streak = 0;
  const checkDate = new Date(now);
  for (let i = 0; i < 365; i++) {
    const ds = fmtDate(checkDate);
    if (completedDates.has(ds)) {
      streak++;
    } else if (activeTasksForDate(checkDate).length === 0) {
      // sem tarefas — não quebra streak
    } else if (i === 0) {
      // hoje sem completar — começa a contar de ontem
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // ── Foco total ────────────────────────────────────────────────────────────
  const totalSessions = S.sessions || 0;
  const totalFocusMins = S.totalFocusTime || 0;
  const avgSession = totalSessions > 0 ? Math.round(totalFocusMins / totalSessions) : 0;

  let weekFocusMins = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const ds = fmtDate(d);
    weekFocusMins += (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(ds))
      .reduce((a, s) => a + (s.duration || 0), 0);
  }

  // ── Melhor dia (últimos 30 dias) ──────────────────────────────────────────
  let bestDayCount = 0, bestDayLabel = '—';
  for (let i = 0; i < 30; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const ds = fmtDate(d);
    const done = activeTasksForDate(d).filter(t => isCompleted(t, ds)).length;
    if (done > bestDayCount) {
      bestDayCount = done;
      bestDayLabel = d.toLocaleDateString(t('misc_locale'), { weekday: 'short', day: 'numeric' });
    }
  }

  // ── Últimos 7 dias ────────────────────────────────────────────────────────
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const ds = fmtDate(d);
    const dt = activeTasksForDate(d);
    const done = dt.filter(t => isCompleted(t, ds)).length;
    const focusMins = (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(ds))
      .reduce((a, s) => a + (s.duration || 0), 0);
    // rotinas
    const dow = d.getDay();
    const rs = (S.routines || []).filter(r =>
      r.tasks && r.tasks.length && (!r.days || !r.days.length || r.days.includes(dow))
    );
    const rsDone = rs.filter(r => {
      const comps = (r.completions && r.completions[ds]) || {};
      return r.tasks.every(tk => comps[tk.id]);
    }).length;
    last7.push({ label: getDaysShort()[d.getDay()], date: ds, done, total: dt.length, focusMins, rsDone, rsTotal: rs.length });
  }
  const maxBar = Math.max(...last7.map(d => d.total + d.rsTotal), 1);

  // ── Categorias (últimos 7 dias) ───────────────────────────────────────────
  const catStats = {};
  S.tasks.filter(task => !task.archived && task.category).forEach(task => {
    if (!catStats[task.category]) catStats[task.category] = { done: 0, total: 0 };
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      if (taskActiveOnDate(task, d)) {
        catStats[task.category].total++;
        if (isCompleted(task, fmtDate(d))) catStats[task.category].done++;
      }
    }
  });

  // ── Sessões recentes ──────────────────────────────────────────────────────
  const recentSessions = (S.focusHistory || []).slice(-4).reverse();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const trendBadge = (val) => {
    if (val === 0) return '';
    const color = val > 0 ? 'var(--success)' : 'var(--danger)';
    const arrow = val > 0 ? '↑' : '↓';
    return `<span class="s-trend" style="color:${color}">${arrow}${Math.abs(val)}%</span>`;
  };
  const fmtF = (mins) => {
    if (!mins) return '0m';
    return mins >= 60 ? Math.floor(mins/60)+'h'+(mins%60>0?' '+mins%60+'m':'') : mins+'m';
  };
  const monthName = now.toLocaleDateString(t('misc_locale'), { month: 'long' });

  content.innerHTML = `
    <!-- KPIs principais -->
    <div class="s-kpis">
      <div class="s-kpi">
        <div class="s-kpi-top">
          <span class="s-kpi-val">${todayDone}<span class="s-kpi-total">/${todayTotal}</span></span>
          ${todayRoutines.length > 0 ? `<span class="s-kpi-sub">${todayRoutinesDone}/${todayRoutines.length} rot.</span>` : ''}
        </div>
        <span class="s-kpi-label">${t('stats_today')}</span>
        <div class="s-kpi-bar"><div style="width:${todayPct}%"></div></div>
      </div>
      <div class="s-kpi">
        <div class="s-kpi-top">
          <span class="s-kpi-val">${weekDone}<span class="s-kpi-total">/${weekTotal}</span></span>
          ${trendBadge(weekTrend)}
        </div>
        <span class="s-kpi-label">${t('stats_week')}</span>
        <div class="s-kpi-bar"><div style="width:${weekPct}%"></div></div>
      </div>
      <div class="s-kpi">
        <div class="s-kpi-top">
          <span class="s-kpi-val">${streak}</span>
          <span class="s-kpi-sub" style="color:var(--warn)">🔥</span>
        </div>
        <span class="s-kpi-label">${t('stats_streak')}</span>
      </div>
      <div class="s-kpi">
        <div class="s-kpi-top">
          <span class="s-kpi-val" style="font-size:1.2rem">${fmtF(totalFocusMins)}</span>
        </div>
        <span class="s-kpi-label">${t('stats_total_focus')}</span>
      </div>
    </div>

    <!-- Últimos 7 dias -->
    <div class="s-section">
      <div class="s-section-title">${t('stats_7days')}</div>
      <div class="s-week-bars">
        ${last7.map(d => {
          const taskH = d.total > 0 ? Math.round((d.done / maxBar) * 100) : 0;
          const rsH   = d.rsTotal > 0 ? Math.round((d.rsDone / maxBar) * 100) : 0;
          const focusH = d.focusMins > 0 ? Math.min(40, Math.round(d.focusMins / 60 * 40)) : 0;
          const isToday = d.date === todayStr;
          return `
          <div class="s-wday-col">
            <div class="s-wday-bar-wrap">
              <div class="s-wday-stacked ${isToday ? 'today' : ''}">
                ${d.rsTotal > 0 ? `<div class="s-wday-seg s-wday-routine" style="height:${rsH}%"></div>` : ''}
                ${d.total > 0 ? `<div class="s-wday-seg s-wday-task" style="height:${taskH}%"></div>` : ''}
                ${focusH > 0 ? `<div class="s-wday-seg s-wday-focus" style="height:${focusH}%"></div>` : ''}
              </div>
            </div>
            <span class="s-wday-label ${isToday ? 'today' : ''}">${d.label}</span>
            <span class="s-wday-val">${d.total + d.rsTotal > 0 ? (d.done + d.rsDone) + '/' + (d.total + d.rsTotal) : '—'}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="s-week-legend">
        <span class="s-legend-dot" style="background:var(--accent)"></span><span>${t('stats_tasks')}</span>
        <span class="s-legend-dot" style="background:var(--warn);opacity:0.7"></span><span>${t('month_routines')}</span>
        <span class="s-legend-dot" style="background:#06b6d4;opacity:0.6"></span><span>${t('stats_focus')}</span>
      </div>
    </div>

    <!-- Mês + Foco lado a lado -->
    <div class="s-two-cols">
      <div class="s-section">
        <div class="s-section-title">${monthName}</div>
        <div class="s-month-grid">
          <div class="s-month-stat">
            <span class="s-month-val">${monthDone}/${monthTotal}</span>
            <span class="s-month-lbl">${t('stats_tasks_done')}</span>
            <div class="s-kpi-bar" style="margin-top:5px"><div style="width:${monthPct}%"></div></div>
          </div>
          ${monthRoutineTotal > 0 ? `
          <div class="s-month-stat">
            <span class="s-month-val">${monthRoutineDone}/${monthRoutineTotal}</span>
            <span class="s-month-lbl">${t('month_routines')}</span>
            <div class="s-kpi-bar" style="margin-top:5px"><div style="width:${monthRoutineTotal > 0 ? Math.round(monthRoutineDone/monthRoutineTotal*100) : 0}%;background:var(--warn)"></div></div>
          </div>` : ''}
          <div class="s-month-stat">
            <span class="s-month-val">${fmtF(monthFocusMins)}</span>
            <span class="s-month-lbl">${t('stats_focus_time')}</span>
          </div>
          <div class="s-month-stat">
            <span class="s-month-val">${bestDayCount > 0 ? bestDayCount : '—'}</span>
            <span class="s-month-lbl">${t('stats_best_day')}${bestDayCount > 0 ? ' · '+bestDayLabel : ''}</span>
          </div>
        </div>
      </div>

      <div class="s-section">
        <div class="s-section-title">${t('stats_sessions')}</div>
        <div class="s-focus-row">
          <div class="s-focus-stat">
            <span class="s-focus-val">${totalSessions}</span>
            <span class="s-focus-lbl">${t('stats_total_sessions')}</span>
          </div>
          <div class="s-focus-stat">
            <span class="s-focus-val">${fmtF(weekFocusMins)}</span>
            <span class="s-focus-lbl">${t('stats_this_week')}</span>
          </div>
          <div class="s-focus-stat">
            <span class="s-focus-val">${avgSession > 0 ? fmtMins(avgSession) : '—'}</span>
            <span class="s-focus-lbl">${t('stats_avg_session')}</span>
          </div>
        </div>
        ${recentSessions.length ? `
        <div class="s-recent-sessions">
          ${recentSessions.map(s => `
            <div class="s-session-pill">
              <span class="s-session-pill-dot"></span>
              <span class="s-session-pill-name">${escHtml(s.taskName || t('stats_free'))}</span>
              <span class="s-session-pill-dur">${fmtMins(s.duration||0)}</span>
            </div>`).join('')}
        </div>` : ''}
      </div>
    </div>

    <!-- Categorias -->
    ${Object.keys(catStats).length > 0 ? `
    <div class="s-section">
      <div class="s-section-title">${t('stats_by_category')}</div>
      <div class="s-cats-list">
        ${Object.entries(catStats).sort((a,b) => b[1].total - a[1].total).slice(0,6).map(([cat, data]) => {
          const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
          const color = CATEGORY_COLORS[cat] || '#888';
          return `<div class="s-cat-item">
            <span class="s-cat-dot-new" style="background:${color}"></span>
            <span class="s-cat-name-new">${getCategoryLabel(cat) || cat}</span>
            <div class="s-cat-bar-new"><div style="width:${pct}%;background:${color}"></div></div>
            <span class="s-cat-pct">${pct}%</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    ${!totalSessions && !weekTotal ? `
    <div class="s-empty-msg">${t('stats_empty')}</div>` : ''}
  `;
}
