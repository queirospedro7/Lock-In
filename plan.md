# LockIn — Optimização de Performance

Objetivo: tornar o app o mais fluido possível sem alterar funcionalidade nem visual.

---

## TIER 1: CRÍTICO — Maior impacto, menor risco

### C-1. Routed chamadas diretas de render via `scheduleRender`

12+ locais chamam `renderToday()` e/ou `renderWeekGrid()` diretamente, ignorando o batching por RAF. Cada chamada destrói e recria ~400-500 nós DOM.

**Ficheiros e alterações:**

| Ficheiro | Linha | De | Para |
|----------|-------|----|------|
| `src/js/tasks.js` | 10 | `setTimeout(() => renderToday(), 150)` | `setTimeout(() => scheduleRender(renderToday), 150)` |
| `src/js/tasks.js` | 568 | `renderToday();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/tasks.js` | 583 | `renderToday();` | `scheduleRender(renderToday);` |
| `src/js/tasks.js` | 593 | `renderToday();` | `scheduleRender(renderToday);` |
| `src/js/tasks.js` | 601 | `renderToday();` | `scheduleRender(renderToday);` |
| `src/js/focus.js` | 157 | `renderToday(); renderWeekGrid();` (na mesma linha) | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/focus.js` | 391-392 | `renderToday();\n    renderWeekGrid();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/goals.js` | 74-75 | `renderToday();\n      renderWeekGrid();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/goals.js` | 95-96 | `renderToday();\n  renderWeekGrid();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/routines.js` | 57-58 | `renderToday();\n  renderWeekGrid();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/routines.js` | 74-75 | `renderToday();\n      renderWeekGrid();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/routines.js` | 98-99 | `renderToday();\n  renderWeekGrid();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/routines.js` | 114-115 | `renderToday();\n  renderWeekGrid();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/routines.js` | 125-126 | `renderToday();\n  renderWeekGrid();` | `scheduleRender(renderToday, renderWeekGrid);` |
| `src/js/state.js` | 619 | `renderWeekGrid();` | `scheduleRender(renderWeekGrid);` |

---

### C-2. Focus timer: 200ms → 1000ms

O `focusTick` usa delta-time (`Date.now()`) — 200ms é desnecessário. Reduz 80% do CPU durante foco.

| Ficheiro | Linha | De | Para |
|----------|-------|----|------|
| `src/js/focus.js` | 127 | `setInterval(focusTick, 200)` | `setInterval(focusTick, 1000)` |
| `src/js/focus.js` | 210 | `setInterval(focusTick, 200)` | `setInterval(focusTick, 1000)` |

---

### C-3. Sound visualizer: `setInterval` → `requestAnimationFrame`

160 writes de `style.height`/s sem sincronizar com vsync.

**`src/js/focus.js`** — Substituir `startFakeSoundViz` (linhas 505-513):
```js
let _vizRAF = null;
function startFakeSoundViz(bars) {
  if (!bars) bars = document.querySelectorAll('#sound-viz .sv-bar');
  const anim = settings.vizAnimation || 'wave';
  if (anim === 'static') { bars.forEach(b => b.style.height = '4px'); return; }
  function tick() { tickVizBars(bars, anim); _vizRAF = requestAnimationFrame(tick); }
  _vizRAF = requestAnimationFrame(tick);
}
```

Adicionar cleanup no início de `stopSoundViz` (linha 583):
```js
if (_vizRAF) { cancelAnimationFrame(_vizRAF); _vizRAF = null; }
```

Substituir fallbacks nas linhas 571 e 577:
```js
// Em vez de: soundVizInterval = setInterval(() => tickVizBars(bars, 'calm'), 120);
soundVizInterval = null;
(function fallbackTick() { tickVizBars(bars, 'calm'); _vizRAF = requestAnimationFrame(fallbackTick); })();
```

---

### C-4. Main process: JSON pretty-print → compact

| Ficheiro | Linha | De | Para |
|----------|-------|----|------|
| `main.js` | 40 | `JSON.stringify(storeData, null, 2)` | `JSON.stringify(storeData)` |

---

### C-5. Toast exit: remover `max-height`/`margin-bottom` (layout-triggering)

**`src/css/components.css`** — Substituir linhas 353-356:
```css
@keyframes toast-out {
  from { opacity: 1; transform: translateX(0) scale(1); }
  to   { opacity: 0; transform: translateX(16px) scale(0.94); pointer-events: none; }
}
```

---

### C-6. Remover `contain` duplicado em `.task-row`

**`src/css/tasks.css`** — Remover linha 233 (`contain: layout paint;`) que sobrescreve a linha 231.

---

### C-7. Remover `preload.js` do `asarUnpack`

**`package.json`** — Remover `"preload.js",` da linha 35.

---

### C-8. Remover dead code do preload

**`preload.js`** — Remover linhas 12 e 15 (`set` e `getPath`).

---

## TIER 2: MÉDIO — Melhoria notável, risco baixo

### M-1. Narrow `transition: all` → propriedades específicas (54 ocorrências)

Processar por batches. Cada `transition: all` obriga o browser a rastrear TODAS as propriedades.

#### Batch 1: Task rows
- `tasks.css:228` `.task-row` → `transition: border-color 0.2s, background 0.2s;`
- `tasks.css:257` `.task-check` → `transition: border-color 0.2s, background 0.2s;`
- `tasks.css:348` `.task-del` → `transition: opacity 0.2s, color 0.2s;`

#### Batch 2: Week
- `week.css:28` `.week-nav button` → `transition: border-color 0.2s, color 0.2s;`
- `week.css:139` `.day-task-check` → `transition: border-color 0.2s, background 0.2s;`
- `week.css:191` `.day-task-del` → `transition: opacity 0.2s, color 0.2s;`
- `week.css:347` `.wv-card` → `transition: border-color 0.2s, background 0.2s;`

#### Batch 3: Layout/Header
- `layout.css:41` `#notes-btn, #tasks-btn...` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`
- `layout.css:110` `#notif-btn` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`

#### Batch 4: Components
- `components.css:15` `select:not(...)` → `transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;`
- `components.css:77` `.btn-primary` → `transition: opacity 0.2s, transform 0.2s;`
- `components.css:111` `.cd-trigger` → `transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;`
- `components.css:190` `.cd-option` → `transition: background 0.12s ease, color 0.12s ease;`
- `components.css:240` `.dur-arrow` → `transition: color 0.15s, background 0.15s;`
- `components.css:294` `.preset-btn` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`
- `components.css:667` `.template-btn` → `transition: border-color 0.15s, color 0.15s, background 0.15s;`
- `components.css:709` `.subtask-check` → `transition: border-color 0.15s, background 0.15s;`
- `components.css:901` `#month-view-btn` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`

#### Batch 5: Goals
- `goals.css:75` `.btn-goal-add` → `transition: background 0.18s, transform 0.18s, box-shadow 0.18s;`
- `goals.css:128` `.goal-action-btn` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`
- `goals.css:135` `.goal-del` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`
- `goals.css:194` `.subgoal-check` → `transition: border-color 0.2s, background 0.2s;`
- `goals.css:215` `.subgoal-del` → `transition: opacity 0.2s, color 0.2s;`

#### Batch 6: Routines
- `routines.css:52` `.day-pill` → `transition: background 0.18s, color 0.18s, border-color 0.18s;`
- `routines.css:95` `.btn-routine-add` → `transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;`
- `routines.css:184` `.routine-action-btn` → `transition: color 0.18s, background 0.18s;`
- `routines.css:236` `.routine-task-check-dummy` → `transition: background 0.2s, border-color 0.2s;`
- `routines.css:262` `.routine-task-del` → `transition: opacity 0.2s, color 0.2s;`
- `routines.css:301` `.routine-add-task-btn` → `transition: border-color 0.18s, color 0.18s, background 0.18s;`

#### Batch 7: Modals + Focus
- `modals.css:54` `.confirm-btn-cancel` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`
- `modals.css:69` `.confirm-btn-ok` → `transition: background 0.18s, transform 0.18s;`
- `modals.css:141` `.modal-close` → `transition: color 0.2s, background 0.2s;`
- `modals.css:187` `.mv-nav button` → `transition: border-color 0.2s, color 0.2s;`
- `modals.css:307` `.mv-cell` → `transition: border-color 0.15s, background 0.15s, transform 0.15s, box-shadow 0.15s;`
- `focus.css:44` `#focus-phase-pill` → `transition: background 0.3s, border-color 0.3s, color 0.3s;`
- `focus.css:250` `.focus-actions button` → `transition: border-color 0.2s, background 0.2s, transform 0.2s;`
- `focus.css:454` `.timesup-back-btn` → `transition: opacity 0.2s, transform 0.2s;`

#### Batch 8: Settings + Notes
- `settings.css:46` `.preview-btn` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`
- `settings.css:121` `.toggle-switch::after` → `transition: left 0.3s, background 0.3s;`
- `settings.css:178` `.hide-actions-btn` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`
- `settings.css:209` `.settings-drawer-title` → `transition: background 0.2s;`
- `settings.css:268` `.color-swatch` → `transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;`
- `settings.css:294` `.color-swatch-custom` → `transition: border-color 0.2s, color 0.2s;`
- `settings.css:315` `.style-card` → `transition: border-color 0.2s, background 0.2s;`
- `settings.css:405` `.apply-style-btn` → `transition: background 0.2s, transform 0.2s;`
- `settings.css:527` `.notif-settings-btn` → `transition: border-color 0.2s, color 0.2s, background 0.2s;`
- `settings.css:608` `.viz-card` → `transition: border-color 0.2s, background 0.2s;`
- `notes.css:127` `.note-layout-card` → `transition: border-color 0.2s, background 0.2s;`
- `notes.css:277` `.notes-task-check` → `transition: border-color 0.2s, background 0.2s;`
- `notes.css:325` `.notes-task-del` → `transition: opacity 0.2s, color 0.2s;`
- `notes.css:398` `.month-notes-nav button, .month-note-tools button` → `transition: background 0.2s, border-color 0.2s, color 0.2s;`
- `notes.css:450` `.month-note-cell` → `transition: border-color 0.18s, background 0.18s, color 0.18s;`

---

### M-2. Visualizer `.sv-bar`: remover CSS transition de height

**`settings.css:164`** — `transition: height 0.1s ease, background 0.2s ease;` → `transition: background 0.2s ease;`

---

### M-3. Settings drawer: `max-height` → `grid-template-rows`

**`settings.css:245-255`** — Substituir:
```css
.settings-drawer-content {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s ease;
  padding: 0 14px;
}
.settings-drawer-content > :first-child { overflow: hidden; }
.settings-drawer.open .settings-drawer-content {
  grid-template-rows: 1fr;
  padding: 14px;
}
```

---

### M-4. Cache `getBoundingClientRect` no `onDragOver`

**`src/js/tasks.js:540-549`** — Substituir:
```js
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
```

---

### M-5. Simplificar modal `box-shadow`

**`modals.css:100`** — `box-shadow: 0 32px 80px color-mix(...), 0 0 0 1px rgba(255,255,255,0.04) inset;` → `box-shadow: 0 16px 48px color-mix(in srgb, var(--bg) 80%, transparent);`

---

### M-6. Remover `backdrop-filter: blur()` do header e notes header

- **`layout.css:10`** — Remover `backdrop-filter: blur(12px);`
- **`notes.css:25`** — Remover `backdrop-filter: blur(12px);`

---

## TIER 3: BAIXO

### L-1. Remover `icon.svg` do build

**`package.json:48`** — Remover `"assets/icon.svg",`

### L-2. Remover `setFrameRate(60)` redundante

**`main.js:129`** — Remover `mainWindow.webContents.setFrameRate(60);`

---

## Verificação

1. Build: `.\build.ps1` — deve compilar sem erros
2. Abrir o app, verificar:
   - Tarefas: toggle, subtasks, drag-drop, filtros
   - Rotinas: criar, toggle, eliminar
   - Metas: criar, completar, eliminar
   - Foco: sessão de 1 min, visualizador de áudio, pomodoro
   - Semana: navegar, colapsar dias
   - Notas: criar, editar, mês
   - Settings: abrir/fechar drawers
   - Light mode: todos os temas funcionam
   - Toasts: aparecem e desaparecem suavemente
