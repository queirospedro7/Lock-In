# LockIn

> **Task Manager and Focus** Desktop application for task management, monthly notes, and focus sessions (Pomodoro).
>
> **Gestor de Tarefas e Foco** Aplicação desktop para gestão de tarefas, notas mensais e sessões de foco (Pomodoro).

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform: Windows](https://img.shields.io/badge/Platform-Windows-blue.svg)
![Built with: Electron](https://img.shields.io/badge/Built%20with-Electron-46C0FF.svg)

---

## Quick Start | Início Rápido

### For End Users | Para Utilizadores Finais

| Download | Description |
|---|---|
| `LockIn Setup X.X.X.exe` | Installer (recommended) — creates desktop shortcut |
| `LockIn-Portable.exe` | Portable — run directly, no installation needed |

**Português:** Descarregue o instalador ou versão portátil a partir da secção [Releases](https://github.com/queirospedro/LockIn/releases) do GitHub.

### For Developers | Para Developers

```bash
git clone https://github.com/queirospedro/LockIn.git
cd LockIn
npm install
npm start
```

---

## Features | Características

- Task manager with priorities | Gestor de tarefas com prioridades
- Notes organized by month | Notas organizadas por mês
- Focus sessions (Pomodoro) with 16 visual styles | Sessões de foco com 16 estilos visuais
- Weekly planner view | Vista de planeamento semanal
- Goals and routines tracking | Acompanhamento de objetivos e rotinas
- Local data persistence (no account required) | Dados persistidos localmente (sem conta)
- Intuitive and responsive interface | Interface intuitiva e responsiva

---

## Project Structure | Estrutura do Projeto

```
LockIn/
├── main.js                  # Electron main process
├── preload.js               # Secure bridge (contextBridge)
├── package.json             # Dependencies and build scripts
├── assets/
│   ├── icon.ico             # Windows app icon
│   └── icon.svg             # Vector icon
├── src/
│   ├── index.html           # Entry point
│   ├── css/                 # Modular stylesheets (14 files)
│   │   ├── base.css         # Reset, variables, body
│   │   ├── splash.css       # Loading screen
│   │   ├── layout.css       # Header, grid, panels
│   │   ├── week.css         # Weekly grid, day cards
│   │   ├── tasks.css        # Task form, task rows
│   │   ├── components.css   # Dropdowns, toasts, inputs
│   │   ├── notes.css        # Notes page, editor
│   │   ├── focus.css        # Focus mode, ring, timer
│   │   ├── modals.css       # Overlays, month-view
│   │   ├── goals.css        # Goals section
│   │   ├── routines.css     # Routines section
│   │   ├── stats.css        # Statistics, heatmap
│   │   ├── settings.css     # Settings, toggles
│   │   └── responsive.css   # Media queries
│   └── js/                  # Application modules (13 files)
│       ├── app.js           # Main logic, intervals
│       ├── utils.js         # Helpers
│       ├── state.js         # Persistent state
│       ├── audio.js         # Sound & visualizer
│       ├── ui.js            # DOM cache, keyboard, toasts
│       ├── goals.js         # Goals CRUD
│       ├── tasks.js         # Tasks CRUD
│       ├── routines.js      # Routines CRUD
│       ├── notes.js         # Notes CRUD
│       ├── focus.js         # Focus/Pomodoro engine
│       ├── stats.js         # Statistics
│       ├── monthview.js     # Month calendar
│       └── customselect.js  # Custom <select> dropdowns
├── dist/                    # Build output (generated)
└── README.md                # This file
```

---

## Build | Compilação

```bash
# Install dependencies
npm install

# Run in development
npm start

# Optimized start (with V8 GC flags)
npm run start:opt

# Build for Windows
npm run build              # NSIS installer
npm run build:portable     # Portable .exe
```

### Build Output

| Command | Output |
|---|---|
| `npm run build` | `dist/LockIn Setup X.X.X.exe` |
| `npm run build:portable` | `dist/LockIn-Portable.exe` |

---

## Technologies | Tecnologias

- **Electron 27** — Cross-platform desktop framework
- **HTML5 + CSS3** — Modular styles (14 files)
- **Vanilla JavaScript** — No frameworks
- **Web Audio API** — Sound effects and visualizer
- **localStorage** — Data persistence

---

## Performance | Desempenho

- CSS split into 14 modular files (parallel loading)
- DOM caching (`$('id')` helper) to minimize `getElementById` calls
- `content-visibility` + `contain` on off-screen panels
- `requestAnimationFrame` for render batching
- `backgroundThrottling: true` in Electron
- Passive event listeners for scroll/touch
- Optional V8 flags via `npm run start:opt`

---

## License | Licença

This project is licensed under the [MIT License](LICENSE).

Este projeto está licenciado sob a [Licença MIT](LICENSE).

---

## Author | Autor

**queirospedro** — [github.com/queirospedro](https://github.com/queirospedro)

---

## Support | Suporte

Found a bug or have a suggestion? Open an [Issue](https://github.com/queirospedro/LockIn/issues).

Encontrou um bug ou tem uma sugestão? Abra uma [Issue](https://github.com/queirospedro/LockIn/issues).
