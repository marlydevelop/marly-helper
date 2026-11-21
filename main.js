const { app, BrowserWindow, Menu, shell, nativeTheme, ipcMain, dialog, clipboard, session } = require('electron');
const path = require('path');
const fs = require('fs');
// Модули инструментов подключаем с защитой: если один из них не загрузится, приложение всё равно запустится (ошибка пишется в log.txt),
// а не упадёт целиком окном «A JavaScript error occurred in the main process».
function loadTool(name) {
  try { return require(name); } catch (e) { try { log('require ' + name + ': ' + (e && e.stack || e)); } catch (x) { /* */ } return null; }
}
const ddsTool = loadTool('./dds');
const svgTool = loadTool('./svg');
const upTool = loadTool('./up');
const rmTool = loadTool('./rm');
const retTool = loadTool('./ret');
const coreTool = loadTool('./core');
const tcTool = loadTool('./tc');
const gsTool = loadTool('./gs');
const cwTool = loadTool('./cw');
const cwxTool = loadTool('./cwx');
const ttkTool = loadTool('./ttk');
const updTool = loadTool('./update');
// --explorer: этот процесс - отдельное окно RPF Explorer (запускается из главной программы и живёт независимо от неё)
const XMODE = process.argv.includes('--explorer');
const argVal = (k) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : ''; };

// Аппаратное ускорение выключено: на Windows оно даёт белую вспышку при сворачивании/разворачивании
app.disableHardwareAcceleration();
// у окна проводника свой профиль Chromium (иначе два процесса дерутся за одни и те же файлы кэша), а настройки и кэш ключей общие (userData)
if (XMODE) { try { app.setPath('sessionData', path.join(app.getPath('userData'), 'explorer-session')); } catch (e) { /* не критично */ } }

// Лог ошибок: %APPDATA%\marly-helper\log.txt
function log(msg) {
  try { fs.appendFileSync(path.join(app.getPath('userData'), 'log.txt'), `[${new Date().toISOString()}] ${msg}\n`); } catch (e) {}
}
process.on('uncaughtException', (e) => log('uncaughtException: ' + (e && e.stack || e)));
process.on('unhandledRejection', (e) => log('unhandledRejection: ' + (e && e.stack || e)));

const BG = { dark: '#07080a', light: '#f3f3f1' };
const BAR = { dark: '#0d0f12', light: '#ffffff' };
let win;
let current = 'dark';
let cover = true; // true, пока поверх окна заставка или экран первого запуска (там фон без верхней панели)
const themeFile = () => path.join(app.getPath('userData'), 'theme.json');
// Оформление (тема, стекло, акцент, шрифт, цвета, язык) для окна RPF Explorer: у него свой профиль Chromium, поэтому localStorage главного окна ему не виден.
// Главное окно кладёт настройки сюда (ui:save), окно проводника читает при старте (ui:load) и следит за файлом (ui:changed).
const uiFile = () => path.join(app.getPath('userData'), 'ui-settings.json');

// тема берётся из нашей настройки, а не из nativeTheme: тот обновляется с задержкой
function isDark() { return current !== 'light'; }
function bg() { return isDark() ? BG.dark : BG.light; }
let dim = 0; // 0..1: степень затемнения (окно соглашения затемняет страницу на 60%); кнопки окна затемняем так же и плавно, в такт CSS
let dimTimer = null;
function shade(hex) {
  if (dim <= 0) return hex;
  const n = parseInt(hex.slice(1), 16);
  const k = 1 - 0.6 * dim;
  const f = (v) => Math.round(v * k).toString(16).padStart(2, '0');
  return '#' + f(n >> 16 & 255) + f(n >> 8 & 255) + f(n & 255);
}
// кнопки окна теперь рисуем сами в index.html (#wc), нативного overlay нет; overlay() оставлена пустой, чтобы не трогать вызовы
function overlay() {}

function applyTheme(theme) {
  current = theme === 'light' ? 'light' : 'dark';
  nativeTheme.themeSource = current;
  if (win && !win.isDestroyed()) win.setBackgroundColor(bg());
  overlay();
}

function loadSavedTheme() {
  try { return JSON.parse(fs.readFileSync(themeFile(), 'utf8')).theme; } catch (e) { return 'dark'; }
}

function createWindow() {
  applyTheme(XMODE && argVal('theme') ? argVal('theme') : loadSavedTheme());
  win = new BrowserWindow({
    width: XMODE ? 1120 : 1180,
    height: XMODE ? 740 : 760,
    minWidth: XMODE ? 760 : 900,
    minHeight: XMODE ? 500 : 600,
    show: false,
    backgroundColor: bg(),
    title: XMODE ? 'RPF Explorer' : 'Marly Helper',
    icon: path.join(__dirname, 'src', 'icon.png'),
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });
  Menu.setApplicationMenu(null);
  // YouTube-плеер в окне гайда: из file:// он не получает Referer и отвечает ошибкой 153, подставляем свой
  try {
    session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['https://www.youtube-nocookie.com/*', 'https://www.youtube.com/*'] }, (d, cb) => {
      d.requestHeaders['Referer'] = 'https://marlyhelper.app/';
      cb({ requestHeaders: d.requestHeaders });
    });
  } catch (e) { log('referer hook: ' + (e && e.stack || e)); }

  // Hate Mods Site во фрейме на странице: разрешаем показ сайта (только для hatemods.com)
  try {
    session.defaultSession.webRequest.onHeadersReceived({ urls: ['https://hatemods.com/*', 'https://*.hatemods.com/*'] }, (d, cb) => {
      const h = d.responseHeaders || {};
      Object.keys(h).forEach((k) => {
        const lk = k.toLowerCase();
        if (lk === 'x-frame-options') delete h[k];
        else if (lk === 'content-security-policy') h[k] = h[k].map((v) => String(v).replace(/frame-ancestors[^;]*;?/gi, ''));
      });
      cb({ responseHeaders: h });
    });
  } catch (e) { log('hatemods frame hook: ' + (e && e.stack || e)); }

  // показываем окно, как только оно готово; страховка, если ready-to-show не придёт
  let shown = false;
  const showOnce = () => { if (!shown && win && !win.isDestroyed()) { shown = true; win.show(); } };
  win.once('ready-to-show', showOnce);
  win.webContents.once('did-finish-load', () => setTimeout(showOnce, 150));
  setTimeout(showOnce, 4000);

  win.webContents.on('did-fail-load', (_e, code, desc) => log(`did-fail-load ${code} ${desc}`));
  win.webContents.on('render-process-gone', (_e, d) => log('render-process-gone ' + JSON.stringify(d)));
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2) log('renderer: ' + message); });

  ['restore', 'show', 'focus'].forEach((ev) => win.on(ev, () => { win.setBackgroundColor(bg()); overlay(); }));
  const sendMax = () => { if (win && !win.isDestroyed()) win.webContents.send('win:state', win.isMaximized()); };
  win.on('maximize', sendMax);
  win.on('unmaximize', sendMax);
  win.loadFile(path.join(__dirname, 'src', 'index.html'), XMODE ? { query: { x: '1', lang: argVal('lang'), theme: argVal('theme') } } : undefined);
  if (XMODE) {
    // живая синхронизация оформления с главным окном: файл ui-settings.json меняется, окно проводника получает ui:changed
    try {
      let t = null, last = ''; try { last = fs.readFileSync(uiFile(), 'utf8'); } catch (x) { /* файла ещё нет */ }
      const w = fs.watch(app.getPath('userData'), (_ev, name) => {
        if (name && name !== 'ui-settings.json') return;
        clearTimeout(t);
        t = setTimeout(() => { try { const j = fs.readFileSync(uiFile(), 'utf8'); if (j !== last) { last = j; if (win && !win.isDestroyed()) win.webContents.send('ui:changed', j); } } catch (x) { /* файл занят */ } }, 200);
      });
      win.on('closed', () => { clearTimeout(t); try { w.close(); } catch (x) { /* уже закрыт */ } });
    } catch (e) { log('ui watch: ' + (e && e.message)); }
  }
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); shell.openExternal(url); } });
}

// Hate Mods Site: большое окно поверх приложения (шапка в стиле приложения + WebContentsView с сайтом)
let siteWin = null;
const siteOpenNow = () => !!(siteWin && !siteWin.isDestroyed());
let siteHidden = false; // окно склада свёрнуто (скрыто), но не закрыто
const siteState = () => (!siteOpenNow() ? 0 : (siteHidden ? 2 : 1)); // 0 закрыт, 1 открыт, 2 свёрнут
const sendSiteState = () => { try { if (win && !win.isDestroyed()) win.webContents.send('site:state', siteState()); } catch (e) {} };
ipcMain.handle('site:isopen', () => siteState());
ipcMain.on('site:min', () => { if (siteOpenNow() && !siteHidden) { siteHidden = true; siteWin.hide(); sendSiteState(); if (win && !win.isDestroyed()) win.focus(); } });
ipcMain.on('site:restore', () => { if (siteOpenNow()) { siteHidden = false; siteWin.show(); siteWin.focus(); sendSiteState(); } });
ipcMain.on('site:close', () => { if (siteOpenNow()) siteWin.close(); });
ipcMain.on('site:open', (_e, u, title) => {
  try {
    if (siteOpenNow()) { siteHidden = false; siteWin.show(); siteWin.focus(); sendSiteState(); return; }
    if (!/^https:\/\//i.test(String(u || ''))) return;
    const { screen, WebContentsView } = require('electron');
    const pb = win && !win.isDestroyed() ? win.getBounds() : null;
    const disp = pb ? screen.getDisplayMatching(pb) : screen.getPrimaryDisplay();
    const wa = disp.workArea, HD = 52;
    const W = Math.min(1500, wa.width - 40), H = wa.height - 24;
    siteWin = new BrowserWindow({
      x: wa.x + Math.round((wa.width - W) / 2), y: wa.y + Math.round((wa.height - H) / 2), width: W, height: H, useContentSize: true,
      minWidth: 640, minHeight: 420, frame: false, maximizable: false, skipTaskbar: true,
      parent: win && !win.isDestroyed() ? win : undefined, title: 'Hate Mods', backgroundColor: bg(),
      icon: path.join(__dirname, 'src', 'icon.png'),
      webPreferences: { preload: path.join(__dirname, 'preload-bigwin.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
    });
    siteHidden = false;
    const sw = siteWin;
    sw.setMenu(null);
    sw.loadFile(path.join(__dirname, 'src', 'bigwin.html'), { query: { t: isDark() ? 'dark' : 'light', title: String(title || '') } });
    const view = new WebContentsView({ webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
    sw.contentView.addChildView(view);
    const fit = () => { if (sw.isDestroyed()) return; const b = sw.getContentBounds(); view.setBounds({ x: 0, y: HD, width: b.width, height: Math.max(0, b.height - HD) }); };
    fit(); sw.on('resize', fit);
    view.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
    view.webContents.loadURL(String(u)).catch((e) => log('site load: ' + (e && e.message || e)));
    sw.on('closed', () => { siteWin = null; siteHidden = false; sendSiteState(); });
    sendSiteState();
  } catch (e) { log('site:open: ' + (e && e.stack || e)); }
});

// скрин «права на интеграцию» Hate Mods: отдельное окно в стиле приложения, скрин виден целиком
let proofWin = null;
ipcMain.on('site:proof', (_e, title) => {
  try {
    if (proofWin && !proofWin.isDestroyed()) { proofWin.focus(); return; }
    const pb = win && !win.isDestroyed() ? win.getBounds() : null;
    const disp = pb ? require('electron').screen.getDisplayMatching(pb) : require('electron').screen.getPrimaryDisplay();
    const wa = disp.workArea, IW = 1179, IH = 1242, HD = 52, PAD = 12;
    const H = Math.min(860, Math.round(wa.height * 0.8));
    const imgH = H - HD - PAD * 2;
    const W = Math.min(Math.round(imgH * IW / IH) + PAD * 2, wa.width - 40);
    let x = pb ? Math.round(pb.x + (pb.width - W) / 2) : wa.x + Math.round((wa.width - W) / 2);
    let y = pb ? Math.round(pb.y + (pb.height - H) / 2) : wa.y + Math.round((wa.height - H) / 2);
    x = Math.max(wa.x + 8, Math.min(x, wa.x + wa.width - W - 8));
    y = Math.max(wa.y + 8, Math.min(y, wa.y + wa.height - H - 8));
    proofWin = new BrowserWindow({
      x, y, width: W, height: H, useContentSize: true, frame: false, transparent: true, resizable: false,
      parent: win && !win.isDestroyed() ? win : undefined, skipTaskbar: true, minimizable: false, maximizable: false,
      title: 'Hate Mods', icon: path.join(__dirname, 'src', 'icon.png'),
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
    });
    proofWin.setMenu(null);
    proofWin.loadFile(path.join(__dirname, 'src', 'proof.html'), { query: { t: isDark() ? 'dark' : 'light', title: String(title || '') } });
    proofWin.webContents.on('before-input-event', (e, input) => { if (input.type === 'keyDown' && input.key === 'Escape') { e.preventDefault(); proofWin.close(); } });
    proofWin.on('closed', () => { proofWin = null; });
  } catch (e) { log('site:proof: ' + (e && e.stack || e)); }
});

let uiTimer = null;
ipcMain.on('ui:load', (e) => { try { e.returnValue = fs.readFileSync(uiFile(), 'utf8'); } catch (x) { e.returnValue = ''; } });
ipcMain.on('ui:save', (_e, json) => {
  if (XMODE || typeof json !== 'string' || json.length > 20000) return;
  clearTimeout(uiTimer);
  uiTimer = setTimeout(() => { try { const f = uiFile(); fs.writeFileSync(f + '.tmp', json, 'utf8'); fs.renameSync(f + '.tmp', f); } catch (x) { log('ui:save ' + (x && x.message)); } }, 250);
});
ipcMain.on('theme:set', (_e, theme) => {
  applyTheme(theme);
  try { fs.writeFileSync(themeFile(), JSON.stringify({ theme })); } catch (e) {}
});
ipcMain.on('win:min', () => { if (win && !win.isDestroyed()) win.minimize(); });
ipcMain.on('win:max', () => { if (win && !win.isDestroyed()) { if (win.isMaximized()) win.unmaximize(); else win.maximize(); } });
ipcMain.on('win:close', () => { if (win && !win.isDestroyed()) win.close(); });
ipcMain.handle('win:ismax', () => !!(win && !win.isDestroyed() && win.isMaximized()));
ipcMain.on('overlay:cover', (_e, on) => { cover = !!on; overlay(); });
ipcMain.on('overlay:dim', (_e, on, ms) => {
  const to = on ? 1 : 0, from = dim, dur = Math.max(0, Math.min(1000, Number(ms) || 0));
  if (dimTimer) { clearInterval(dimTimer); dimTimer = null; }
  if (!dur || from === to) { dim = to; overlay(); return; }
  const t0 = Date.now();
  dimTimer = setInterval(() => {
    const p = Math.min(1, (Date.now() - t0) / dur);
    dim = from + (to - from) * (p * p * (3 - 2 * p)); // smoothstep, близко к CSS ease
    overlay();
    if (p >= 1) { clearInterval(dimTimer); dimTimer = null; dim = to; overlay(); }
  }, 20);
});
// фон «Жидкого стекла»: свой файл с ПК (хранится в userData)
const bgFile = () => path.join(app.getPath('userData'), 'glass-bg.dat');
ipcMain.handle('bg:pick', async () => {
  try {
    const r = await dialog.showOpenDialog(win && !win.isDestroyed() ? win : undefined, { properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] }] });
    if (r.canceled || !r.filePaths[0]) return null;
    const f = r.filePaths[0];
    if (fs.statSync(f).size > 40 * 1024 * 1024) return null;
    const ext = path.extname(f).slice(1).toLowerCase().replace('jpg', 'jpeg');
    return { data: 'data:image/' + ext + ';base64,' + fs.readFileSync(f).toString('base64') };
  } catch (e) { log('bg:pick ' + (e && e.stack || e)); return null; }
});
ipcMain.handle('bg:save', (_e, d) => { try { if (typeof d === 'string' && d.startsWith('data:image/') && d.length < 60e6) { fs.writeFileSync(bgFile(), d, 'utf8'); return true; } } catch (e) { log('bg:save ' + (e && e.stack || e)); } return false; });
ipcMain.handle('bg:load', () => { try { const d = fs.readFileSync(bgFile(), 'utf8'); return d.startsWith('data:image/') ? d : null; } catch (e) { return null; } });
ipcMain.handle('bg:clear', () => { try { fs.rmSync(bgFile(), { force: true }); } catch (e) {} return true; });
// TEMP: очистка кэша и настроек (кнопка в Настройках), затем выход
ipcMain.on('app:wipe', async () => {
  try { fs.rmSync(themeFile(), { force: true }); } catch (e) {}
  try {
    const ses = win.webContents.session;
    await ses.clearStorageData();
    await ses.clearCache();
  } catch (e) { log('wipe: ' + (e && e.stack || e)); }
  app.quit();
});
nativeTheme.on('updated', () => { if (win && !win.isDestroyed()) { win.setBackgroundColor(bg()); overlay(); } });

const initTool = (name, mod, deps) => { try { if (mod) mod.init(deps); } catch (e) { log('init ' + name + ': ' + (e && e.stack || e)); } };
initTool('dds', ddsTool, { ipcMain, dialog, shell, app, getWin: () => win, log });
initTool('svg', svgTool, { ipcMain, clipboard, log });
initTool('up', upTool, { ipcMain, dialog, getWin: () => win, log });
initTool('rm', rmTool, { ipcMain, app, getWin: () => win, log });
initTool('ret', retTool, { ipcMain, dialog, getWin: () => win, log });
initTool('core', coreTool, { ipcMain, dialog, getWin: () => win, log });
initTool('tc', tcTool, { ipcMain, dialog, getWin: () => win, log });
initTool('gs', gsTool, { ipcMain, dialog, getWin: () => win, log });
initTool('cw', cwTool, { ipcMain, dialog, shell, app, getWin: () => win, log });
initTool('upd', updTool, { ipcMain, app, getWin: () => win, log, xmode: XMODE });
if (!XMODE) initTool('ttk', ttkTool, { ipcMain, dialog, shell, app, getWin: () => win, log });
app.whenReady().then(async () => {
  // второй проводник не нужен: если окно уже открыто, выводим его вперёд и выходим
  if (XMODE && cwxTool) { try { if ((await cwxTool.request('explorer', 'focus', 800)) === 'ok') { app.quit(); return; } } catch (e) { /* канал недоступен: продолжаем */ } }
  createWindow();
  initTool('cwx', cwxTool, { app, ipcMain, getWin: () => win, log, xmode: XMODE });
}).catch((e) => log('whenReady: ' + (e && e.stack || e)));
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
