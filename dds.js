// Конвертер изображений в DDS: обёртка над texconv.exe (Microsoft DirectXTex, MIT).
// Все параметры приходят из интерфейса и проверяются здесь по белым спискам. Запуск без shell.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const FORMATS = new Set(['BC1_UNORM','BC1_UNORM_SRGB','BC2_UNORM','BC2_UNORM_SRGB','BC3_UNORM','BC3_UNORM_SRGB','BC4_UNORM','BC4_SNORM','BC5_UNORM','BC5_SNORM','BC6H_UF16','BC6H_SF16','BC7_UNORM','BC7_UNORM_SRGB','R8G8B8A8_UNORM','R8G8B8A8_UNORM_SRGB','B8G8R8A8_UNORM','B8G8R8A8_UNORM_SRGB','B8G8R8X8_UNORM','B8G8R8X8_UNORM_SRGB','B5G6R5_UNORM','B5G5R5A1_UNORM','B4G4R4A4_UNORM','R8_UNORM','R8G8_UNORM','A8_UNORM','R16_UNORM','R16G16_UNORM','R16G16B16A16_UNORM','R16G16B16A16_FLOAT','R32G32B32A32_FLOAT','R10G10B10A2_UNORM']);
const DX9_OK = new Set(['BC1_UNORM','BC2_UNORM','BC3_UNORM','BC4_UNORM','BC5_UNORM','R8G8B8A8_UNORM','B8G8R8A8_UNORM','B8G8R8X8_UNORM','B5G6R5_UNORM','B5G5R5A1_UNORM','B4G4R4A4_UNORM','A8_UNORM']);
const FILTERS = new Set(['POINT','LINEAR','CUBIC','FANT','BOX','TRIANGLE']);
const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.bmp']);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.bmp': 'image/bmp' };

const num = (v, min, max, def) => { v = Number(v); return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def; };
const isBC = (f) => /^BC/.test(f);
const cleanName = (s) => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').slice(0, 60);

// Собирает аргументы texconv из настроек. o: { out, input, preview, extraSuffix }
function buildArgs(s, o) {
  s = s || {};
  const fmt = FORMATS.has(s.fmt) ? s.fmt : 'BC3_UNORM';
  const a = ['-nologo', '-ft', 'dds', '-f', fmt];
  if (s.ow !== false || o.preview) a.push('-y');
  // мипмапы (для предпросмотра всегда 1 уровень: нулевой уровень от них не зависит)
  if (o.preview || s.mip === 'none') a.push('-m', '1');
  else if (s.mip === 'custom') a.push('-m', String(Math.round(num(s.mipN, 1, 16, 8))));
  else a.push('-m', '0');
  // размер
  const w = Math.round(num(s.w, 0, 16384, 0)), h = Math.round(num(s.h, 0, 16384, 0));
  if (w) a.push('-w', String(w));
  if (h) a.push('-h', String(h));
  if (s.pow2) a.push('-pow2');
  // фильтр
  let f = FILTERS.has(s.filter) ? s.filter : 'CUBIC';
  if (s.dith === 'ordered') f += '_DITHER'; else if (s.dith === 'diffusion') f += '_DITHER_DIFFUSION';
  a.push('-if', f);
  if (s.addr === 'wrap') a.push('-wrap'); else if (s.addr === 'mirror') a.push('-mirror');
  if (s.hflip) a.push('-hflip');
  if (s.vflip) a.push('-vflip');
  // sRGB
  if (s.srgbi && s.srgbo) a.push('-srgb'); else if (s.srgbi) a.push('-srgbi'); else if (s.srgbo) a.push('-srgbo');
  // альфа и цвет
  if (s.alphaMode === 'pre') a.push('-pmalpha'); else if (s.alphaMode === 'straight') a.push('-alpha');
  if (s.sep) a.push('-sepalpha');
  if (s.atOn) a.push('-at', String(num(s.at, 0.01, 1, 0.5)));
  if (s.awOn && /^BC7/.test(fmt)) a.push('-aw', String(num(s.aw, 0.01, 10, 1)));
  if (s.kcOn) a.push('--keep-coverage', String(num(s.kc, 0, 1, 0.5)));
  if (/^[0-9a-fA-F]{6}$/.test(s.ck || '')) a.push('-c', s.ck);
  // нормали и каналы
  if (s.nmap) {
    let m = String(s.nmapCh || 'l').replace(/[^rgbal]/g, '').slice(0, 1) || 'l';
    if (s.nmapI) m += 'i';
    a.push('-nmap', m, '-nmapamp', String(num(s.nmapA, 0.01, 100, 1)));
  }
  if (s.invY) a.push('--invert-y');
  if (s.recZ) a.push('--reconstruct-z');
  if (/^[rgbaxywzRGBAXYWZ01]{1,4}$/.test(s.swz || '')) a.push('--swizzle', s.swz.toLowerCase());
  // сжатие
  if (isBC(fmt)) {
    let bc = '';
    if (s.bd) bc += 'd';
    if (s.bu) bc += 'u';
    if (s.bq === 'quick') bc += 'q'; else if (s.bq === 'max') bc += 'x';
    if (bc) a.push('-bc', bc);
  }
  if (s.nogpu) a.push('-nogpu');
  // заголовок
  if (s.hdr === 'dx10') a.push('-dx10');
  else if (s.hdr !== 'auto' && DX9_OK.has(fmt)) a.push('-dx9');
  // имя и папка
  if (s.lc) a.push('-l');
  const px = cleanName(s.px), sx = cleanName(s.sx) + (o.extraSuffix || '');
  if (px) a.push('-px', px);
  if (sx) a.push('-sx', sx);
  a.push('-o', o.out, '--', o.input);
  return a;
}

function ddsInfo(file) {
  try {
    const fd = fs.openSync(file, 'r'); const b = Buffer.alloc(148);
    fs.readSync(fd, b, 0, 148, 0); fs.closeSync(fd);
    if (b.toString('latin1', 0, 4) !== 'DDS ') return null;
    return { h: b.readUInt32LE(12), w: b.readUInt32LE(16), mips: Math.max(1, b.readUInt32LE(28)),
      fourcc: b.toString('latin1', 84, 88).replace(/\0/g, ''), size: fs.statSync(file).size };
  } catch (e) { return null; }
}

function init({ ipcMain, dialog, shell, app, getWin, log }) {
  const texconv = () => app.isPackaged ? path.join(process.resourcesPath, 'bin', 'texconv.exe') : path.join(__dirname, 'bin', 'texconv.exe');
  let prevChild = null, tmpRoot = null;
  const tmp = () => { if (!tmpRoot) tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'marly-dds-')); return tmpRoot; };

  function run(args, timeout) {
    return new Promise((resolve) => {
      let child;
      try {
        child = execFile(texconv(), args, { windowsHide: true, timeout: timeout || 180000, maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' },
          (err, stdout, stderr) => resolve({ err, out: String(stdout || '') + String(stderr || ''), child }));
      } catch (e) { resolve({ err: e, out: String(e && e.message || e) }); }
      run.last = child;
    });
  }
  const errText = (r) => {
    const t = (r.out || '').split(/\r?\n/).map((x) => x.trim()).filter((x) => /FAILED|ERROR|WARNING|Invalid|Can't|requires/i.test(x));
    return (t.join(' | ') || (r.err && r.err.message) || 'conversion error').slice(0, 300);
  };
  const okPath = (p) => typeof p === 'string' && path.isAbsolute(p) && IMG_EXT.has(path.extname(p).toLowerCase());

  ipcMain.handle('dds:available', () => fs.existsSync(texconv()));
  ipcMain.handle('dds:pick-files', async () => {
    const r = await dialog.showOpenDialog(getWin(), { properties: ['openFile', 'multiSelections'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }] });
    return r.canceled ? [] : r.filePaths;
  });
  ipcMain.handle('dds:pick-dir', async () => {
    const r = await dialog.showOpenDialog(getWin(), { properties: ['openDirectory', 'createDirectory'] });
    return r.canceled ? '' : r.filePaths[0];
  });
  ipcMain.handle('dds:read', async (_e, p) => {
    if (!okPath(p)) return { ok: false, error: 'bad path' };
    try {
      const st = fs.statSync(p);
      if (st.size > 96 * 1024 * 1024) return { ok: false, error: 'too big' };
      const buf = fs.readFileSync(p);
      return { ok: true, size: st.size, url: 'data:' + MIME[path.extname(p).toLowerCase()] + ';base64,' + buf.toString('base64') };
    } catch (e) { return { ok: false, error: String(e.message || e) }; }
  });
  ipcMain.handle('dds:reveal', (_e, p) => { try { if (typeof p === 'string' && fs.existsSync(p)) shell.showItemInFolder(p); } catch (e) {} });

  // предпросмотр: сжимаем в DDS (1 уровень), затем разжимаем обратно в PNG, чтобы показать реальный результат
  ipcMain.handle('dds:preview', async (_e, req) => {
    if (!req || !okPath(req.path)) return { ok: false, error: 'bad path' };
    if (!fs.existsSync(texconv())) return { ok: false, error: 'nobin' };
    if (prevChild) { try { prevChild.kill(); } catch (e) {} prevChild = null; }
    const t0 = Date.now();
    const base = path.join(tmp(), 'p' + (Number(req.id) || 0));
    try {
      fs.mkdirSync(path.join(base, 'a'), { recursive: true }); fs.mkdirSync(path.join(base, 'b'), { recursive: true });
      const r1 = await new Promise((resolve) => {
        const c = execFile(texconv(), buildArgs(Object.assign({}, req.s, { px: '', sx: '', lc: false, ow: true }), { out: path.join(base, 'a'), input: req.path, preview: true }),
          { windowsHide: true, timeout: 120000, encoding: 'utf8' }, (err, so, se) => resolve({ err, out: so + se, killed: c.killed }));
        prevChild = c;
      });
      if (r1.killed) return { ok: false, cancelled: true };
      const dds = fs.readdirSync(path.join(base, 'a')).find((n) => /\.dds$/i.test(n));
      if (!dds) return { ok: false, error: errText(r1) };
      const r2 = await run(['-nologo', '-y', '-ft', 'png', '-m', '1', '-o', path.join(base, 'b'), '--', path.join(base, 'a', dds)], 60000);
      const png = fs.readdirSync(path.join(base, 'b')).find((n) => /\.png$/i.test(n));
      if (!png) return { ok: false, error: errText(r2) };
      const url = 'data:image/png;base64,' + fs.readFileSync(path.join(base, 'b', png)).toString('base64');
      try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
      return { ok: true, url, ms: Date.now() - t0 };
    } catch (e) { log('dds:preview ' + (e && e.stack || e)); return { ok: false, error: String(e.message || e).slice(0, 200) }; }
  });

  ipcMain.handle('dds:convert', async (e, req) => {
    const res = [];
    if (!req || !Array.isArray(req.files)) return res;
    if (!fs.existsSync(texconv())) return req.files.map((f) => ({ input: f, success: false, error: 'nobin' }));
    const used = new Map();
    for (let i = 0; i < req.files.length && i < 200; i++) {
      const f = req.files[i];
      let r = { input: f, success: false, error: '' };
      try {
        if (!okPath(f)) throw new Error('bad path');
        const out = req.outDir && path.isAbsolute(req.outDir) ? req.outDir : path.dirname(f);
        fs.mkdirSync(out, { recursive: true });
        const key = (out + '|' + cleanName(req.s && req.s.px) + path.basename(f, path.extname(f)) + cleanName(req.s && req.s.sx)).toLowerCase();
        const n = used.get(key) || 0; used.set(key, n + 1);
        const rr = await run(buildArgs(req.s, { out, input: f, extraSuffix: n ? '_' + n : '' }));
        const name = (cleanName(req.s && req.s.px) + path.basename(f, path.extname(f)) + cleanName(req.s && req.s.sx) + (n ? '_' + n : '') + '.dds');
        const want = req.s && req.s.lc ? name.toLowerCase() : name;
        const outFile = path.join(out, want);
        if (/SKIPPING|already exists/i.test(rr.out)) r.error = 'exists';
        else if (fs.existsSync(outFile)) r = { input: f, success: true, output: outFile, info: ddsInfo(outFile) };
        else r.error = errText(rr);
      } catch (ex) { r.error = String(ex.message || ex).slice(0, 200); }
      res.push(r);
      try { e.sender.send('dds:progress', { i, n: req.files.length, input: f, success: r.success, error: r.error, output: r.output, info: r.info }); } catch (x) {}
    }
    return res;
  });

  app.on('quit', () => { try { if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (e) {} });
}

module.exports = { init, buildArgs, ddsInfo };
