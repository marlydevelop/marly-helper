'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const core = require('./core');

const EXE = 'Marly Helper.exe';
const PAYLOAD = app.isPackaged ? path.join(process.resourcesPath, 'payload') : path.join(__dirname, 'payload');
let win = null, busy = false;

app.disableHardwareAcceleration();
if (!app.requestSingleInstanceLock()) app.quit();

function info() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'info.json'), 'utf8')); } catch (e) { return { version: '0.1.1-beta' }; }
}
function defDir() { return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Programs', core.APP_DIR_NAME); }
function run(cmd, args) { return new Promise(function (res) { execFile(cmd, args, { windowsHide: true }, function (err) { res(!err); }); }); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function create() {
  let dark = true;
  try { dark = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'theme.json'), 'utf8')).dark !== false; } catch (e) {}
  win = new BrowserWindow({
    width: 760, height: 500, resizable: false, maximizable: false, frame: false, show: false,
    backgroundColor: dark ? '#07080a' : '#f3f3f1', icon: path.join(__dirname, 'src', 'icon.ico'), title: 'Marly Helper Setup',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', function () { win.show(); });
  win.on('close', function (e) { if (busy) e.preventDefault(); });
}

app.whenReady().then(create);
app.on('window-all-closed', function () { app.quit(); });
app.on('second-instance', function () { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

ipcMain.handle('init', function () {
  let size = 0;
  try { size = core.walk(PAYLOAD).total; } catch (e) {}
  return {
    locale: app.getLocale(), dir: defDir(), version: info().version,
    ok: fs.existsSync(path.join(PAYLOAD, EXE)), mb: Math.max(1, Math.round(size / 1048576))
  };
});
ipcMain.handle('fix-dir', function (_e, p) { return core.fixDir(p); });
ipcMain.handle('pick-dir', async function (_e, cur) {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'], defaultPath: cur || undefined });
  if (r.canceled || !r.filePaths[0]) return '';
  return core.fixDir(r.filePaths[0]);
});
ipcMain.handle('theme', function (_e, dark) {
  if (win) win.setBackgroundColor(dark ? '#07080a' : '#f3f3f1');
  try { fs.mkdirSync(app.getPath('userData'), { recursive: true }); fs.writeFileSync(path.join(app.getPath('userData'), 'theme.json'), JSON.stringify({ dark: !!dark })); } catch (e) {}
});
ipcMain.handle('win-min', function () { if (win) win.minimize(); });
ipcMain.handle('win-close', function () { if (win && !busy) win.close(); });
ipcMain.handle('launch', function (_e, dir) {
  const d = core.fixDir(dir);
  if (d) shell.openPath(path.join(d, EXE));
  setTimeout(function () { app.quit(); }, 300);
});

ipcMain.handle('install', async function (_e, o) {
  if (busy) return { ok: false, error: 'busy' };
  const dir = core.fixDir(o && o.dir);
  if (!dir) return { ok: false, error: 'Bad path' };
  busy = true;
  const send = function (p, f) { if (win && !win.isDestroyed()) win.webContents.send('progress', p, f || ''); };
  try {
    if (!fs.existsSync(path.join(PAYLOAD, EXE))) throw new Error('Payload not found: ' + PAYLOAD);
    await run('taskkill', ['/F', '/IM', EXE]);
    await sleep(400);
    if (fs.existsSync(dir)) { try { require('original-fs').rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
    await core.copyAll(PAYLOAD, dir, function (p, f) { send(Math.min(0.97, p * 0.97), f); });
    fs.writeFileSync(path.join(dir, 'uninstall.cmd'), core.uninstallCmd(EXE), 'ascii');
    const exe = path.join(dir, EXE);
    const lnk = function (file) { shell.writeShortcutLink(file, 'create', { target: exe, cwd: dir, icon: exe, iconIndex: 0, description: 'Marly Helper' }); };
    if (o.desktop) lnk(path.join(app.getPath('desktop'), core.APP_DIR_NAME + '.lnk'));
    if (o.startmenu) {
      const sm = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
      fs.mkdirSync(sm, { recursive: true });
      lnk(path.join(sm, core.APP_DIR_NAME + '.lnk'));
    }
    const kb = Math.round(core.walk(dir).total / 1024);
    const add = function (name, type, val) { return run('reg', ['add', core.REG_KEY, '/v', name, '/t', type, '/d', String(val), '/f']); };
    await add('DisplayName', 'REG_SZ', 'Marly Helper');
    await add('DisplayVersion', 'REG_SZ', info().version);
    await add('Publisher', 'REG_SZ', 'Marly');
    await add('InstallLocation', 'REG_SZ', dir);
    await add('DisplayIcon', 'REG_SZ', exe);
    await add('UninstallString', 'REG_SZ', 'cmd.exe /c ""' + path.join(dir, 'uninstall.cmd') + '""');
    await add('URLInfoAbout', 'REG_SZ', 'https://t.me/marlyhelper');
    await add('NoModify', 'REG_DWORD', 1);
    await add('NoRepair', 'REG_DWORD', 1);
    await add('EstimatedSize', 'REG_DWORD', kb);
    send(1, '');
    busy = false;
    return { ok: true, dir: dir };
  } catch (e) {
    busy = false;
    return { ok: false, error: String(e && e.message || e) };
  }
});
