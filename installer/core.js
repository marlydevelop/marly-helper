'use strict';
// Чистая логика установщика (без Electron), чтобы её можно было тестировать отдельно.
// В Electron обычный fs считает файлы *.asar архивами (отсюда «ENOENT, not found in ...app.asar»), поэтому берём original-fs:
// он копирует app.asar как обычный файл. В чистом Node (тесты) original-fs нет, берём fs.
const fs = (() => { try { return require('original-fs'); } catch (e) { return require('fs'); } })();
const path = require('path');
const W = path.win32;
const APP_DIR_NAME = 'Marly Helper';

// Папка установки ВСЕГДА называется "Marly Helper": деинсталлятор удаляет её целиком,
// поэтому нельзя дать поставить приложение прямо в Рабочий стол/Документы и т.п.
function fixDir(p) {
  p = String(p || '').trim();
  if (!p || !W.isAbsolute(p)) return '';
  p = W.resolve(p);
  if (W.basename(p).toLowerCase() !== APP_DIR_NAME.toLowerCase()) p = W.join(p, APP_DIR_NAME);
  return p;
}

function walk(root) {
  const files = [];
  let total = 0;
  (function rec(rel) {
    const abs = path.join(root, rel);
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) rec(r);
      else if (e.isFile()) {
        const size = fs.statSync(path.join(root, r)).size;
        files.push({ rel: r, size });
        total += size;
      }
    }
  })('');
  return { files, total };
}

async function copyAll(src, dst, onProgress) {
  const { files, total } = walk(src);
  const made = new Set();
  let done = 0, last = 0;
  fs.mkdirSync(dst, { recursive: true });
  for (const f of files) {
    const to = path.join(dst, f.rel);
    const d = path.dirname(to);
    if (!made.has(d)) { fs.mkdirSync(d, { recursive: true }); made.add(d); }
    await fs.promises.copyFile(path.join(src, f.rel), to);
    done += f.size;
    const now = Date.now();
    if (onProgress && (now - last > 40 || done >= total)) {
      last = now;
      onProgress(total ? done / total : 1, f.rel);
    }
  }
  return { count: files.length, total };
}

const REG_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MarlyHelper';

// Только ASCII: пути берутся во время выполнения (%~dp0, GetFolderPath), так кириллица в имени пользователя не ломает.
function uninstallCmd(exeName) {
  return [
    '@echo off',
    'if not "%MH_UN%"=="1" (',
    '  copy /y "%~f0" "%TEMP%\\mh-uninstall.cmd" >nul',
    '  set "MH_UN=1"',
    '  set "MH_DIR=%~dp0"',
    '  start "" /min cmd /c "%TEMP%\\mh-uninstall.cmd"',
    '  exit /b',
    ')',
    'set "D=%MH_DIR:~0,-1%"',
    'taskkill /F /IM "' + exeName + '" >nul 2>nul',
    'powershell -NoProfile -Command "Remove-Item -LiteralPath ([Environment]::GetFolderPath(\'Desktop\')+\'\\' + APP_DIR_NAME + '.lnk\'),([Environment]::GetFolderPath(\'Programs\')+\'\\' + APP_DIR_NAME + '.lnk\') -Force -ErrorAction SilentlyContinue"',
    'reg delete "' + REG_KEY + '" /f >nul 2>nul',
    'ping -n 3 127.0.0.1 >nul',
    'rmdir /s /q "%D%"',
    ''
  ].join('\r\n');
}

module.exports = { APP_DIR_NAME, REG_KEY, fixDir, walk, copyAll, uninstallCmd };
