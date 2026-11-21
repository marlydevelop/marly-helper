'use strict';
// Автообновление через GitHub Releases.
// Поток: проверка при запуске -> состояние 'available' уходит в окно -> окно показывает уведомление и через 5 с зовёт upd:start ->
// скачивание zip (с прогрессом) -> проверка sha256 -> распаковка во временную папку -> PowerShell-скрипт ждёт выхода программы,
// копирует файлы поверх папки установки и запускает новую версию. Работает для установленной версии (папка приложения доступна на запись);
// portable и запуск из исходников только проверяют релиз и ничего не ставят.
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');

// ====== НАСТРОЙКА ======
const REPO = 'marlydevelop/marly-helper'; // репозиторий с релизами
const ASSET = 'Marly-Helper-update.zip';   // имя zip-файла в релизе (содержимое dist/win-unpacked в корне архива)
const API = 'https://api.github.com';
// ========================

const HOSTS = [/^api\.github\.com$/, /^github\.com$/, /(^|\.)githubusercontent\.com$/];
const MAX_ZIP = 1500 * 1024 * 1024;

let log = () => {};
let state = { phase: 'idle', version: '', pct: 0 }; // idle | available | downloading | installing | error
let found = null;   // { version, url, size, sha }
let getWin = () => null;
let appRef = null;
let busy = false;

function push() { try { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send('upd:state', state); } catch (e) { /* окно закрыто */ } }
function setState(s) { state = Object.assign({}, state, s); push(); }

// ---- версии ----
function parseVer(v) {
  const m = String(v || '').trim().replace(/^v/i, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+.]?(.*))?$/);
  if (!m) return null;
  return { n: [+m[1], +(m[2] || 0), +(m[3] || 0)], pre: (m[4] || '').replace(/^[-+.]/, '') };
}
// >0: a новее b
function cmpVer(a, b) {
  const x = parseVer(a), y = parseVer(b);
  if (!x || !y) return 0;
  for (let i = 0; i < 3; i++) if (x.n[i] !== y.n[i]) return x.n[i] > y.n[i] ? 1 : -1;
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1;           // 0.2.0 новее 0.2.0-beta
  if (!y.pre) return -1;
  const px = x.pre.split(/[.\-]/), py = y.pre.split(/[.\-]/);
  for (let i = 0; i < Math.max(px.length, py.length); i++) {
    const p = px[i], q = py[i];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    const pn = /^\d+$/.test(p), qn = /^\d+$/.test(q);
    if (pn && qn) { if (+p !== +q) return +p > +q ? 1 : -1; }
    else if (p !== q) return p > q ? 1 : -1;
  }
  return 0;
}

// ---- сеть ----
function hostOk(u) { try { const x = new URL(u); return x.protocol === 'https:' && HOSTS.some((r) => r.test(x.hostname)); } catch (e) { return false; } }
function request(url, opts, onRes, depth) {
  return new Promise((resolve, reject) => {
    if ((depth || 0) > 6) return reject(new Error('redirects'));
    if (!hostOk(url)) return reject(new Error('host'));
    const req = https.get(url, { headers: Object.assign({ 'User-Agent': 'MarlyHelper-Updater', Accept: 'application/vnd.github+json' }, opts && opts.headers || {}), timeout: (opts && opts.timeout) || 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        let next; try { next = new URL(res.headers.location, url).toString(); } catch (e) { return reject(new Error('redirect')); }
        return request(next, Object.assign({}, opts, { headers: Object.assign({}, opts && opts.headers, { Accept: 'application/octet-stream' }) }), onRes, (depth || 0) + 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('http ' + res.statusCode)); }
      Promise.resolve(onRes(res)).then(resolve, reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}
function getText(url, max) {
  return request(url, {}, (res) => new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    res.on('data', (c) => { n += c.length; if (n > (max || 2e6)) { res.destroy(); reject(new Error('too-big')); } else chunks.push(c); });
    res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    res.on('error', reject);
  }));
}
function download(url, file, size, onPct) {
  return request(url, { headers: { Accept: 'application/octet-stream' }, timeout: 30000 }, (res) => new Promise((resolve, reject) => {
    const total = +res.headers['content-length'] || size || 0;
    if (total > MAX_ZIP) { res.destroy(); return reject(new Error('too-big')); }
    const out = fs.createWriteStream(file); const h = crypto.createHash('sha256');
    let got = 0, last = 0;
    res.on('data', (c) => {
      got += c.length; h.update(c);
      if (got > MAX_ZIP) { res.destroy(new Error('too-big')); return; }
      const now = Date.now();
      if (total && now - last > 150) { last = now; onPct(Math.min(99, Math.floor(got * 100 / total))); }
    });
    res.on('error', (e) => { out.destroy(); reject(e); });
    res.pipe(out);
    out.on('finish', () => { if (size && got !== size) return reject(new Error('size')); resolve({ sha: h.digest('hex'), bytes: got }); });
    out.on('error', reject);
  }));
}

// ---- проверка релиза ----
async function fetchLatest(current) {
  const list = JSON.parse(await getText(API + '/repos/' + REPO + '/releases?per_page=15'));
  if (!Array.isArray(list)) throw new Error('bad-json');
  let best = null;
  for (const r of list) {
    if (!r || r.draft || !parseVer(r.tag_name)) continue;
    const a = (r.assets || []).find((x) => x && x.name === ASSET && x.browser_download_url);
    if (!a) continue;
    if (!best || cmpVer(r.tag_name, best.tag) > 0) best = { tag: r.tag_name, asset: a, assets: r.assets };
  }
  if (!best || cmpVer(best.tag, current) <= 0) return null;
  let sha = '';
  const dg = String(best.asset.digest || '');
  if (/^sha256:[0-9a-f]{64}$/i.test(dg)) sha = dg.slice(7).toLowerCase();
  else {
    const s = best.assets.find((x) => x && x.name === ASSET + '.sha256' && x.browser_download_url);
    if (s) { const t = (await getText(s.browser_download_url, 4096)).trim().split(/\s+/)[0] || ''; if (/^[0-9a-f]{64}$/i.test(t)) sha = t.toLowerCase(); }
  }
  if (!sha) throw new Error('no-hash');
  return { version: best.tag.replace(/^v/i, ''), url: best.asset.browser_download_url, size: +best.asset.size || 0, sha };
}

// ---- установка ----
function appDir() { return path.dirname(process.execPath); }
function canInstall() {
  try {
    if (process.platform !== 'win32' || !appRef || !appRef.isPackaged || process.env.PORTABLE_EXECUTABLE_FILE) return false;
    const d = appDir();
    if (!fs.existsSync(path.join(d, 'resources', 'app.asar'))) return false;
    const t = path.join(d, '.mh-write-test-' + process.pid);
    fs.writeFileSync(t, '1'); fs.rmSync(t, { force: true });
    return true;
  } catch (e) { return false; }
}
function run(cmd, args) { return new Promise((resolve, reject) => execFile(cmd, args, { windowsHide: true, timeout: 600000, maxBuffer: 1 << 20 }, (e, so, se) => e ? reject(new Error(String(se || e.message).slice(0, 300))) : resolve(so))); }
async function extract(zip, dest) {
  fs.mkdirSync(dest, { recursive: true });
  try { await run('tar.exe', ['-xf', zip, '-C', dest]); }
  catch (e) {
    log('update: tar failed, fallback Expand-Archive: ' + e.message);
    await run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force', zip, dest]);
  }
}
// Скрипт только из ASCII, пути приходят параметрами (в имени пользователя может быть кириллица)
const PS1 = [
  'param([int]$ProcId,[string]$Src,[string]$Dst,[string]$Exe,[string]$Work,[string]$Ver)',
  '$ErrorActionPreference = "Continue"',
  '$logf = Join-Path $env:TEMP "mh-update.log"',
  'function L($m){ try { Add-Content -LiteralPath $logf -Value ((Get-Date -Format "s") + " " + $m) } catch {} }',
  'L "start pid=$ProcId ver=$Ver"',
  'try { Wait-Process -Id $ProcId -Timeout 60 -ErrorAction SilentlyContinue } catch {}',
  'Start-Sleep -Milliseconds 500',
  '# отдельное окно RPF Explorer живёт отдельным процессом из той же папки: закрываем, иначе файлы заняты',
  'try { Get-Process | Where-Object { $_.Path -and $_.Path.StartsWith($Dst, [System.StringComparison]::OrdinalIgnoreCase) } | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}',
  'Start-Sleep -Milliseconds 800',
  '$ok = $false',
  'for ($i = 0; $i -lt 3 -and -not $ok; $i++) {',
  '  & robocopy.exe $Src $Dst /E /R:10 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null',
  '  if ($LASTEXITCODE -lt 8) { $ok = $true } else { L ("robocopy exit " + $LASTEXITCODE); Start-Sleep -Seconds 2 }',
  '}',
  'if ($ok) {',
  '  L "copied"',
  '  try { & reg.exe query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MarlyHelper" 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { & reg.exe add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MarlyHelper" /v DisplayVersion /t REG_SZ /d $Ver /f | Out-Null } } catch {}',
  '  try { Remove-Item -LiteralPath $Work -Recurse -Force -ErrorAction SilentlyContinue } catch {}',
  '} else { L "FAILED, starting old version" }',
  'Start-Process -FilePath (Join-Path $Dst $Exe) -WorkingDirectory $Dst',
  ''
].join('\r\n');

async function install() {
  const f = found; const work = path.join(os.tmpdir(), 'mh-update-' + f.version.replace(/[^\w.\-]/g, '_'));
  fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(work, { recursive: true });
  const zip = path.join(work, 'update.zip'), stage = path.join(work, 'stage');
  setState({ phase: 'downloading', pct: 0 });
  const r = await download(f.url, zip, f.size, (p) => setState({ pct: p }));
  if (r.sha !== f.sha) throw new Error('sha mismatch');
  setState({ pct: 100 });
  await extract(zip, stage);
  const exe = path.basename(process.execPath);
  // защита от пустого или чужого архива: внутри обязаны быть exe и app.asar
  if (!fs.existsSync(path.join(stage, exe)) || !fs.existsSync(path.join(stage, 'resources', 'app.asar'))) throw new Error('bad-archive');
  fs.rmSync(zip, { force: true });
  const ps1 = path.join(work, 'apply.ps1');
  fs.writeFileSync(ps1, PS1, 'ascii');
  setState({ phase: 'installing' });
  const ch = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', ps1,
    '-ProcId', String(process.pid), '-Src', stage, '-Dst', appDir(), '-Exe', exe, '-Work', work, '-Ver', f.version], { detached: true, stdio: 'ignore', windowsHide: true });
  ch.on('error', (e) => log('update: spawn ' + e.message));
  ch.unref();
  setTimeout(() => { try { appRef.quit(); } catch (e) { /* */ } }, 1200);
}

async function check() {
  if (/OWNER/.test(REPO)) { log('update: REPO not configured, skipped'); return; }
  const cur = appRef.getVersion();
  const r = await fetchLatest(cur);
  if (!r) { log('update: up to date (' + cur + ')'); return; }
  if (!canInstall()) { log('update: ' + r.version + ' available, but this build cannot self-update (portable/dev/no write access)'); return; }
  found = r;
  log('update: found ' + r.version + ' (current ' + cur + ')');
  setState({ phase: 'available', version: r.version, pct: 0 });
}

function cleanOld() {
  try {
    const t = os.tmpdir();
    for (const n of fs.readdirSync(t)) if (/^mh-update-/.test(n)) { try { fs.rmSync(path.join(t, n), { recursive: true, force: true }); } catch (e) { /* ещё занято */ } }
  } catch (e) { /* */ }
}

function init({ ipcMain, app, getWin: gw, log: lg, xmode }) {
  if (xmode) return;
  log = lg || log; getWin = gw; appRef = app;
  ipcMain.handle('upd:get', () => state);
  ipcMain.handle('upd:start', async () => {
    if (busy || state.phase !== 'available' || !found) return { ok: false };
    busy = true;
    try { await install(); return { ok: true }; }
    catch (e) {
      log('update: install failed: ' + (e && e.stack || e));
      setState({ phase: 'error' }); found = null; busy = false;
      return { ok: false };
    }
  });
  app.whenReady().then(() => {
    cleanOld();
    setTimeout(() => { check().catch((e) => log('update: check failed: ' + (e && e.message || e))); }, 2500);
  });
}

module.exports = { init, _t: { cmpVer, parseVer, fetchLatest, download, extract, hostOk, PS1 } };
