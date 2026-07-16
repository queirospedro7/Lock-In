// LockIn — Utilitários

function getDaysShort() {
  return [t('day_dom_short'), t('day_seg_short'), t('day_ter_short'), t('day_qua_short'), t('day_qui_short'), t('day_sex_short'), t('day_sab_short')];
}
const CIRC = 678.58;
const COOKIE_DURATION_DAYS = 7;
const NOTIF_ICON = 'data:image/x-icon;base64,AAABAAEAAAAAAAEAIAC5FQAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAEAAAABAAgGAAAAXHKoZgAAAAFvck5UAc+id5oAABVzSURBVHja7Z15jBXVtsYLGoV7L6BNMzTzIImYCzJ0nBgUnBlinog3QoOAio8GTN4VngpEIbERiIqCyRU1QNSE5kUh+Id6L0RAZZBBiFyDhlmaFhGeAgq0Cr1ffdWFDxSk+1Sdc6pq/1bySzpN06fPt/f6TtWutdd2nGhGrksnl4Euk13mu6xw+dyl1OWoS7nLaRcDkEVO+3PxqD83NUc/8Oes5u7fXLq65LnUcIjzxp9dOrqMcJnr8rHLfpfjLhVMMogpmrsnXL52WevP7Qf8D7e/2J70tX1nfNTlny4H+EQHS64YvnFZ5vKYS4FLHZsSv7HLEJfFLgeZECD517oscSl0aZLkxG/lf9pvcPmZgQc4B+XEJpfxLq2TlPhN/cTfyv08QJXQQuIEP3divbCnS/1PSHyAlBYQN/i3BrFbMOziUuJykoEECIRy6H/8BfNYfOqPdtnDwAGEinKqyM+xSEYblwV+UQQDBhA+5X6OtYla8vfwCx0YJID0o3W1XlFIfJU23sslP0DG2etUlhlnrbw4x78nOcxgAGSF//VzMCfTyV/Lf7Z/jEEAyCo/+MVDl2Tyk//vTuVGHQYAIPsc900g7VcCNfxLDj75AaJ3JVCU7jWBe/37DgQHiOaawL3pSv6erPYDxOLpQM90FPnwnB8gHqwLs1joT371EcICxIcFYZUNj6a8FyCWZcNFQZO/K/f9ALHeQNQl1eTX5cMiRASINSWp3gqoEQH7+QHi30+gsLrJr1ZE6xEPIBGsd6rZXkxlhbTxAkgGFf7enSpFa5d/IxpAolBOt6rqpz+CAVh4FaCDCTYiFkAiUW43vtjKP4d2ACQT5faQCyW/zidbgkgAiUZH8tU+nwF0czirDyDpHHQucMbAfyMOgBVM+G3y6+ihZQgDYAX/+m15cCen8sxyxAFIPgdcOp5tACNdTiMMgBUo10ecSX41EZyLKABW8fIZA2jgsgZBAKxitUuuDKCzSxmCAFjFfperZQD3OBzykXguueQSU7duXZOXl2fy8/NNs2bNTIsWLTz0tb6nf9PP6GfRLPEo5wfKACaz9Tc5KIHbtGljevbsae6//34zadIk8/LLL5ulS5ealStXmk2bNplt27aZHTt2mD179njoa31P/6afeeedd8xrr71mnnrqKTNy5EjTu3dv07ZtW+93o3GiNgdNkgEsQIx4J3znzp3N8OHDzYsvvuglsJL66NGjpqKiwgQN/Y4ffvjB7N2716xatcq89NJLZsSIEd5r1qtXjzGIN/NkAB8gRLy4/PLLvU/l4uJiL+G/+eYbc/r0aZOp0Gt9++23niHob7j55ptNgwYNGJv4odx3PkeI6FO7dm1TUFBgpkyZYtauXet9wkcljh07ZtatW2emTp1qrrnmGlOnTh3GLB6oSYhTihDR/rS/++67zVtvvWUOHjxooh6HDh0yb7/9thk0aBBXBdFHue8cRYjooRX5Bx54wLvMPnnypIlblJeXm48++sg89NBDplGjRoxpNDkiA+DUnwhRv359b/X+448/Nr/88ouJe+g96JZFC4eXXXYZYxwt1DKcPQBRoFatWua2224z7777rvnpp59M0kLv6f333zd33HGH914Z80hwykGE7KNn7HPmzDHff/+9SXocOXLEe5R4xRVXMPbRABGyWZ133333mc8++8zYFlu3bjWDBw82l156KXMBA7CP5s2be4U7KrKxNX788UfvykdaMCcwAGu4/vrrzYcffmiIytDTgu7duzM3MIBkU7NmTVNYWOiV6hLnhkqNhw4danJycpgrGEDyUHXcY4895i2CEecPVTc+/vjjVBJiAMl7tv/88897xTHExR8Xzpo1y9OMuYMBxJ7c3Fwzd+7cjG7W+aPk0hWISorLyspMaWmph77W9/RvUahBkFavvvoqpcQYQPyTf/78+aFsy61ufPfdd97jRdXlT58+3YwaNcoMGDDAW2zr1KmTad++vdc3QOhrfU//pp/Rz+r/6P/qd+h3ZTqkmbSThswlDCCWl/2vvPJKxpL/1KlTZvfu3aakpMSMGzfOXHfddaZx48aBuvvo/+p36HeNHj3aLFy40OzcuTNjJcrSThpyO4ABxG7BT/exmbjs1778JUuWePsHVF2XzjJb/W5VLQ4bNsy7OtBrZ+J2QFqyMIgBxAI9xtJKdrrvpfVpr8S49tprvV4B2ehPoL3/zz77rPe3pHvtQpryiBADiDx6zp/OZh379u3z7s87dOgQmfesv2XatGne35bOR4TSljmGAUSWG264IW1FPioZXrBggenatWtk33+XLl3MvHnz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';

const RECUR_DAY_MAP = { mon:1, tue:2, wed:3, thu:4, fri:5, sat:6, sun:0 };

function getRecurLabel(key) {
  const map = { once: '', daily: 'recur_daily', weekdays: 'recur_weekdays', weekend: 'recur_weekend', custom: 'recur_custom', mon: 'recur_mon', tue: 'recur_tue', wed: 'recur_wed', thu: 'recur_thu', fri: 'recur_fri', sat: 'recur_sat', sun: 'recur_sun' };
  const k = map[key];
  return k ? t(k) : '';
}

const _customCategoryLabels = {};

function getCategoryLabel(key) {
  const map = { work: 'task_cat_work', study: 'task_cat_study', personal: 'task_cat_personal' };
  if (_customCategoryLabels[key]) return _customCategoryLabels[key];
  const k = map[key];
  return k ? t(k) : '';
}

const CATEGORY_COLORS = {
  work: '#3b82f6', study: '#8b5cf6', personal: '#f59e0b'
};

function today() { return fmtDate(new Date()); }

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function escHtml(s) {
  const str = String(s || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return escHtml(s).replace(/'/g, '&#39;');
}

const _SAFE_TAGS = /^(b|i|u|em|strong|br|p|ul|ol|li|h[1-6]|blockquote|code|pre|span|a|img|sup|sub|mark|s|del)$/i;
const _SAFE_ATTRS = /^(href|src|alt|title|style|class|target)$/i;
const _DANGEROUS_STYLE = /(position\s*:|expression\s*\(|javascript\s*:|data\s*:|@import)/i;

function sanitizeNoteHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  function clean(el) {
    for (let i = el.childNodes.length - 1; i >= 0; i--) {
      const node = el.childNodes[i];
      if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        if (!_SAFE_TAGS.test(tag)) { node.remove(); continue; }
        for (let j = node.attributes.length - 1; j >= 0; j--) {
          const attr = node.attributes[j];
          if (!_SAFE_ATTRS.test(attr.name)) { node.removeAttribute(attr.name); }
          else if (attr.name === 'style' && _DANGEROUS_STYLE.test(attr.value)) { node.removeAttribute('style'); }
          else if (attr.name === 'href' && /^\s*javascript\s*:/i.test(attr.value)) { node.removeAttribute('href'); }
          else if (attr.name === 'src' && /^\s*(javascript|data)\s*:/i.test(attr.value)) { node.removeAttribute('src'); }
        }
        clean(node);
      }
    }
  }
  clean(tmp);
  return tmp.innerHTML;
}

function getWeekDays(offset = 0) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dow + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getCustomRecurLabel(rule) {
  if (!rule) return getRecurLabel('custom');
  const days = Array.isArray(rule.days) ? rule.days : [];
  const dayNames = [t('recur_sun'), t('recur_mon'), t('recur_tue'), t('recur_wed'), t('recur_thu'), t('recur_fri'), t('recur_sat')];
  const dayText = days.length ? days.map(d => dayNames[Number(d)]).filter(Boolean).join('/') : t('recur_all');
  const start = rule.start ? rule.start.slice(5).replace('-', '/') : '';
  const end = rule.end ? rule.end.slice(5).replace('-', '/') : '';
  if (start && end) return `${dayText} ${start}-${end}`;
  if (start) return `${dayText} ${t('recur_from')} ${start}`;
  if (end) return `${dayText} ${t('recur_until')} ${end}`;
  return dayText;
}

function getCustomRecurFromForm() {
  const start = document.getElementById('custom-recur-start')?.value || '';
  const end = document.getElementById('custom-recur-end')?.value || '';
  const days = Array.from(document.querySelectorAll('#custom-recur-panel input[type="checkbox"]:checked'))
    .map(input => Number(input.value));
  return { start, end, days };
}

function resetCustomRecurForm() {
  const start = document.getElementById('custom-recur-start');
  const end = document.getElementById('custom-recur-end');
  if (start) start.value = '';
  if (end) end.value = '';
  document.querySelectorAll('#custom-recur-panel input[type="checkbox"]').forEach(input => {
    input.checked = false;
  });
  toggleCustomRecurPanel();
}

function dateInCustomRecur(rule, dateObj) {
  if (!rule) return false;
  const date = fmtDate(dateObj);
  if (rule.start && rule.end && rule.start > rule.end) return false;
  if (rule.start && date < rule.start) return false;
  if (rule.end && date > rule.end) return false;
  const days = Array.isArray(rule.days) ? rule.days.map(Number) : [];
  if (!days.length) return true;
  return days.includes(dateObj.getDay());
}

function taskActiveOnDate(task, dateObj) {
  const r = task.recur;
  if (r === 'once') return task.date === fmtDate(dateObj);
  if (r === 'custom') return task.customRecur ? dateInCustomRecur(task.customRecur, dateObj) : false;
  if (task.createdAt && fmtDate(dateObj) < task.createdAt) return false;
  if (r === 'daily') return true;
  if (r === 'weekdays') { const d = dateObj.getDay(); return d >= 1 && d <= 5; }
  if (r === 'weekend')  { const d = dateObj.getDay(); return d === 0 || d === 6; }
  if (RECUR_DAY_MAP[r] !== undefined) return dateObj.getDay() === RECUR_DAY_MAP[r];
  return false;
}

function activeTasksForDate(dateObj) {
  const dateStr = fmtDate(dateObj);
  return S.tasks.filter(t => {
    if (t.archived) return false;
    return taskActiveOnDate(t, dateObj);
  });
}

function isCompleted(task, dateStr) { return !!(task.completions && task.completions[dateStr]); }

function setCompleted(task, dateStr, val) {
  if (!task.completions) task.completions = {};
  if (val) task.completions[dateStr] = true;
  else delete task.completions[dateStr];
}

function fmtMins(mins) {
  if (mins === 0) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtDurationFromSecs(secs) {
  const total = Math.max(0, Math.round(secs));
  if (total < 60) return `${total} ${t('time_secs')}`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    const parts = [`${h} ${h === 1 ? t('time_hour') : t('time_hours')}`];
    if (m) parts.push(`${m} ${t('time_mins')}`);
    else if (s) parts.push(`${s} ${t('time_secs')}`);
    return parts.join(' ');
  }
  if (m > 0 && s > 0) return `${m} ${t('time_mins')} ${s} ${t('time_secs')}`;
  if (m > 0) return `${m} ${t('time_mins')}`;
  return `${s} ${t('time_secs')}`;
}

function getLuminance(hex) {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function getContrastColor(hex) {
  return getLuminance(hex) > 128 ? '#000' : '#fff';
}

function toggleCustomRecurPanel() {
  const recur = document.getElementById('inp-recur')?.value;
  document.getElementById('custom-recur-panel')?.classList.toggle('hidden', recur !== 'custom');
}

function nativeNotify(title, body) {
  if (window.electronNotify) {
    window.electronNotify.send(title, body);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: NOTIF_ICON });
  }
}
