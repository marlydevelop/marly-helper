'use strict';
// Отдельное окно RPF Explorer: второй процесс приложения (запуск с --explorer), живёт независимо от главного окна.
// Связь между процессами: именованный канал (pipe). Если канал отвечает, значит окно проводника открыто (работает и после перезапуска главной программы).
const net = require('net');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function pipePath(kind) {
  let u = 'u';
  try { u = os.userInfo().username; } catch (e) { /* имя пользователя недоступно */ }
  u = String(u).replace(/[^\w.-]/g, '_');
  return process.platform === 'win32' ? '\\\\.\\pipe\\marly-helper-' + kind + '-' + u : path.join(os.tmpdir(), 'marly-helper-' + kind + '-' + u + '.sock');
}

// отправить команду окну kind ('explorer' | 'main'); вернёт строку ответа или null, если никто не слушает
function request(kind, msg, ms) {
  return new Promise((resolve) => {
    let done = false, buf = '', t = null, s = null;
    const fin = (v) => { if (done) return; done = true; clearTimeout(t); try { s.destroy(); } catch (e) { /* закрыт */ } resolve(v); };
    try { s = net.connect(pipePath(kind)); } catch (e) { resolve(null); return; }
    t = setTimeout(() => fin(null), ms || 800);
    s.on('connect', () => s.write(msg + '\n'));
    s.on('data', (d) => { buf += d; if (buf.indexOf('\n') >= 0) fin(buf.split('\n')[0].trim()); });
    s.on('error', () => fin(null));
    s.on('close', () => fin(null));
  });
}

async function listen(kind, onMsg, log) {
  if ((await request(kind, 'ping', 400)) === 'ok') return null; // такое окно уже есть, второй сервер не нужен
  const p = pipePath(kind);
  if (process.platform !== 'win32') { try { fs.unlinkSync(p); } catch (e) { /* старого сокета нет */ } }
  const srv = net.createServer((c) => {
    let buf = '';
    c.on('data', (d) => {
      buf += d; const i = buf.indexOf('\n'); if (i < 0) return;
      const line = buf.slice(0, i).trim(); buf = '';
      let r = 'ok'; try { r = onMsg(line) || 'ok'; } catch (e) { r = 'err'; }
      c.end(String(r) + '\n');
    });
    c.on('error', () => { /* клиент отвалился */ });
  });
  srv.on('error', (e) => { try { if (log) log('pipe ' + kind + ': ' + (e && e.message)); } catch (x) { /* лог недоступен */ } });
  srv.listen(p);
  return srv;
}

// вывести окно на передний план (Windows не даёт чужому процессу забрать фокус, поэтому кратко делаем окно «поверх всех»)
function bringToFront(w) {
  if (!w || w.isDestroyed()) return;
  try {
    if (w.isMinimized()) w.restore();
    w.show();
    w.setAlwaysOnTop(true); w.focus(); w.moveTop();
    setTimeout(() => { try { if (!w.isDestroyed()) w.setAlwaysOnTop(false); } catch (e) { /* окно закрыто */ } }, 200);
  } catch (e) { try { w.focus(); } catch (x) { /* окно закрыто */ } }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function init(d) {
  const { app, ipcMain, getWin, log, xmode } = d;
  const toRenderer = (ch, v) => { try { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send(ch, v); } catch (e) { /* окна нет */ } };
  const launch = (extra) => {
    const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE;
    const args = (app.isPackaged ? [] : [app.getAppPath()]).concat(extra || []);
    const ch = spawn(process.execPath, args, { detached: true, stdio: 'ignore', env });
    ch.on('error', (e) => log('cwx spawn: ' + (e && e.message)));
    ch.unref();
  };
  if (xmode) {
    // процесс проводника: отвечает на ping/focus; кнопка «Marly Helper» выводит главное окно вперёд или запускает программу, если её нет
    listen('explorer', (m) => { if (m === 'focus') bringToFront(getWin()); return 'ok'; }, log).catch((e) => log('cwx listen: ' + (e && e.message)));
    ipcMain.handle('cwx:helper', async () => { const r = await request('main', 'focus', 800); if (r !== 'ok') launch([]); return { ok: true }; });
    return;
  }
  // главный процесс: слушает команду «показать окно» и следит, открыт ли проводник
  listen('main', (m) => { if (m === 'focus') bringToFront(getWin()); return 'ok'; }, log).catch((e) => log('cwx listen: ' + (e && e.message)));
  let open = false, launching = false;
  const set = (o) => { if (o !== open) { open = o; toRenderer('cwx:state', open); } };
  const poll = async () => { set((await request('explorer', 'ping', 600)) === 'ok'); };
  setInterval(poll, 1500); poll();
  ipcMain.handle('cwx:status', async () => { await poll(); return open; });
  ipcMain.handle('cwx:focus', async () => ({ ok: (await request('explorer', 'focus', 800)) === 'ok' }));
  ipcMain.handle('cwx:open', async (_e, o) => {
    if ((await request('explorer', 'focus', 800)) === 'ok') { set(true); return { ok: true }; }
    if (!launching) {
      launching = true; setTimeout(() => { launching = false; }, 20000);
      const lang = o && /^(ru|uk|en)$/.test(o.lang) ? o.lang : 'en', theme = o && o.theme === 'light' ? 'light' : 'dark';
      try { launch(['--explorer', '--lang=' + lang, '--theme=' + theme]); } catch (e) { launching = false; log('cwx launch: ' + (e && e.message)); return { ok: false, error: 'cwx-launch' }; }
    }
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      if ((await request('explorer', 'ping', 500)) === 'ok') { launching = false; set(true); return { ok: true }; }
    }
    launching = false;
    return { ok: false, error: 'cwx-timeout' };
  });
}

module.exports = { init, request, listen, bringToFront, pipePath };
