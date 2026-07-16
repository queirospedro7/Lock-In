const { app, BrowserWindow, Menu, ipcMain, Notification, session } = require('electron');
const path = require('path');
const fs = require('fs');

// ── IDENTIDADE DA APP ─────────────────────────────────────────────────────────
app.setAppUserModelId('28488PedroQueiros.LockIn');
app.setName('LockIn');

// ── SINGLE INSTANCE ──────────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); process.exit(0); }
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

let mainWindow = null;
let storeData = {};
let storePath = '';
let saveTimer = null;

// ── PERSISTENT STORE ──────────────────────────────────────────────────────────
function getStorePath() {
  return path.join(app.getPath('userData'), 'lockin-data.json');
}

function loadStore() {
  try {
    storeData = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
  } catch {
    storeData = {};
  }
}

function saveStore() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const json = JSON.stringify(storeData);
    const tmp = storePath + '.tmp';
    fs.writeFile(tmp, json, 'utf-8', (err) => {
      if (err) return console.error('Store write error:', err);
      fs.rename(tmp, storePath, (e) => {
        if (e) console.error('Store rename error:', e);
      });
    });
  }, 400);
}

// ── IPC HANDLERS ──────────────────────────────────────────────────────────────
ipcMain.handle('store-set', (_e, key, value) => {
  if (typeof key !== 'string' || !key.startsWith('li_')) return false;
  try {
    if (JSON.stringify(value).length > 1048576) return false;
  } catch { return false; }
  storeData[key] = value;
  saveStore();
  return true;
});
ipcMain.handle('store-set-all', (_e, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const sanitized = {};
  let totalSize = 0;
  for (const [k, v] of Object.entries(data)) {
    if (typeof k === 'string' && k.startsWith('li_')) {
      try {
        totalSize += JSON.stringify(v).length;
        if (totalSize > 2097152) return false; // 2MB limit
      } catch { return false; }
      sanitized[k] = v;
    }
  }
  storeData = sanitized;
  saveStore();
  return true;
});
ipcMain.handle('store-clear', () => { storeData = {}; saveStore(); return true; });
ipcMain.handle('store-get-path', () => storePath);
ipcMain.on('store-get-all-sync', (event) => { event.returnValue = { ...storeData }; });

ipcMain.handle('send-notification', (_e, title, body) => {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.ico');
  const n = new Notification({ title, body, icon: iconPath });
  n.show();
});

// ── WINDOW ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'LockIn',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#000000',
    show: false,
    ...(process.platform === 'win32' && { appUserModelId: 'com.queirospedro.lockin' }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar.unpacked', 'preload.js')
        : path.join(__dirname, 'preload.js'),
      spellcheck: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: true,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'Accelerated2dCanvas',
    }
  });

  // Only suppress console messages in production
  if (app.isPackaged) {
    mainWindow.webContents.on('console-message', (e) => e.preventDefault());
  }

  const indexPath = path.join(__dirname, 'src', 'index.html');

  mainWindow.loadFile(indexPath);
  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();
  });

  // Deny all permission requests (camera, microphone, geolocation, etc.)
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(false);
  });

  // Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'self'",
    ].join('; ');
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });
}

app.whenReady().then(() => {
  app.setLoginItemSettings({ openAtLogin: false });

  storePath = getStorePath();
  loadStore();
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });

// Log errors to file in production
function logError(err) {
  try {
    const logPath = path.join(app.getPath('userData'), 'error.log');
    const msg = `[${new Date().toISOString()}] ${err?.stack || err?.message || String(err)}\n`;
    fs.appendFileSync(logPath, msg);
  } catch {}
}
process.on('uncaughtException', (err) => { logError(err); });
process.on('unhandledRejection', (err) => { logError(err); });
