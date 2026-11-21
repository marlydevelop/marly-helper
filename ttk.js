// Texture Tool Kit: интеграция программы Texture Toolkit (автор Neodymium, лицензия MIT, файлы в bin/ttk).
// Окно программы не показывается: bin/ttk/ttk.ps1 грузит TextureTool.exe через 32-битный PowerShell и вызывает его классы
// (MainModel.Load/Save, TextureModel.Import/Export, TextureDictionaryModel.Import/Delete). Только Windows.
// Файл правится на РАБОЧЕЙ КОПИИ во временной папке; оригинал меняется только по «Сохранить» (IPC ttk:save).
// Картинки (PNG, JPG, BMP, TGA...) перед заменой превращаются в DDS через texconv под формат и размер заменяемой текстуры.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const WIN = process.platform === 'win32';
const EXTS = new Set(['.ytd', '.ydd', '.ydr', '.yft', '.ypt']);
const IMG = new Set(['.png', '.jpg', '.jpeg', '.bmp', '.tga', '.dds', '.tif', '.tiff']);
const MIME = 'data:image/png;base64,';
const MAX_FILE = 1.5e9;
// формат текстуры игры (TextureFormat в RageLib) -> формат texconv
const DXGI = { A8: 'A8_UNORM', L8: 'R8_UNORM', BC7: 'BC7_UNORM', DXT1: 'BC1_UNORM', DXT3: 'BC2_UNORM', DXT5: 'BC3_UNORM', ATI1: 'BC4_UNORM', ATI2: 'BC5_UNORM', A1R5G5B5: 'B5G5R5A1_UNORM', A8B8G8R8: 'R8G8B8A8_UNORM', A8R8G8B8: 'B8G8R8A8_UNORM' };
const isBC = (f) => /^(DXT|ATI|BC)/.test(f);
const needDx10 = (f) => /^(ATI|BC7)/.test(f); // эти форматы лучше писать с DX10-заголовком DDS
const clampN = (v, a, b, d) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
const safeName = (n) => String(n || 'texture').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 100) || 'texture';
const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } };
const rm = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) { /* временные файлы */ } };

function init({ ipcMain, dialog, shell, app, getWin, log }) {
  const binDir = () => (app.isPackaged ? path.join(process.resourcesPath, 'bin', 'ttk') : path.join(__dirname, 'bin', 'ttk'));
  const texconv = () => (app.isPackaged ? path.join(process.resourcesPath, 'bin', 'texconv.exe') : path.join(__dirname, 'bin', 'texconv.exe'));
  // движки: 'rage' = Texture Toolkit (RageLib 2015, bin/ttk/ttk.ps1), 'cw' = CodeWalker.Core из bin/mhconv (cwtex.ps1): для .ypt и для файлов, которые RageLib не читает
  const cwDir = () => path.join(binDir(), '..', 'mhconv');
  const cwReady = () => isFile(path.join(binDir(), 'cwtex.ps1')) && isFile(path.join(cwDir(), 'CodeWalker.Core.dll'));
  let sess = null, seq = 0;

  // очередь с приоритетом: действия пользователя (открыть, предпросмотр, замена, сохранение) идут раньше фоновых миниатюр
  const hiQ = [], loQ = []; let qRun = false;
  async function pump() {
    if (qRun) return; qRun = true;
    while (hiQ.length || loQ.length) { const j = hiQ.length ? hiQ.shift() : loQ.shift(); try { j.res(await j.fn()); } catch (e) { j.rej(e); } }
    qRun = false;
  }
  const enqueue = (fn, low) => new Promise((res, rej) => { (low ? loQ : hiQ).push({ fn, res, rej }); pump(); });
  const fail = (error, why) => { const r = { ok: false, error }; if (why) r.why = String(why).slice(0, 300); return r; };
  function closeSession() { if (sess) { rm(sess.dir); sess = null; } }
  const tmpSub = () => { const d = path.join(sess.dir, 't' + (++seq)); fs.mkdirSync(d, { recursive: true }); return d; };

  // ---- PowerShell (движок Texture Toolkit) ----
  function runPs(cmd, args, engine) {
    return new Promise((resolve, reject) => {
      if (!WIN) return reject(new Error('ttk-win'));
      const bd = binDir(), eng = engine || (sess && sess.engine) || 'rage';
      if (eng === 'cw' ? !cwReady() : (!isFile(path.join(bd, 'TextureTool.exe')) || !isFile(path.join(bd, 'ttk.ps1')))) return reject(new Error('ttk-missing'));
      if (!sess) return reject(new Error('ttk-nofile'));
      const id = String(++seq), af = path.join(sess.dir, 'a' + id + '.json'), of = path.join(sess.dir, 'r' + id + '.json');
      try { fs.writeFileSync(af, JSON.stringify(args || {}), 'utf8'); } catch (e) { return reject(e); }
      const root = process.env.SystemRoot || 'C:\\Windows';
      // Texture Toolkit 32-битный (SysWOW64); CodeWalker.Core работает в обычном 64-битном PowerShell
      const p32 = path.join(root, 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe'), p64 = path.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
      let ps = eng === 'cw' ? p64 : p32;
      if (!isFile(ps)) ps = isFile(p64) ? p64 : p32;
      const a = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(bd, eng === 'cw' ? 'cwtex.ps1' : 'ttk.ps1'), '-Cmd', cmd, '-Target', sess.work, '-ArgsFile', af, '-Out', of, '-Root', bd];
      if (eng === 'cw') a.push('-CwDir', cwDir());
      execFile(ps, a, { windowsHide: true, timeout: 900000, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8', cwd: bd }, (err, so, se) => {
        let j = null;
        try { j = JSON.parse(fs.readFileSync(of, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { /* результата нет */ }
        rm(af); rm(of);
        if (j) return resolve(j);
        const why = String(se || (err && err.message) || so || '').replace(/\s+/g, ' ').trim();
        log('ttk: ' + why.slice(0, 600));
        reject(Object.assign(new Error('ttk-fail'), { why: why.slice(0, 200) }));
      });
    });
  }
  // понятная причина вместо сырого сообщения .NET
  function engineErr(j, why) {
    const m = String((j && j.message) || '');
    if (why) { if (/DirectXTex|0x8007007E|Unable to load DLL|msvc[pr]120/i.test(why)) return fail('ttk-vcrt', why); return fail('ttk-fail', why); }
    if (j && j.error === 'not-found') return fail('not-found');
    if (sess && sess.engine === 'rage' && /DirectXTex|0x8007007E|Unable to load DLL|msvc[pr]120|module could not be found/i.test(m)) return fail('ttk-vcrt', m);
    if (/Unsupported file type/i.test(m)) return fail('ttk-bad-type', m);
    if (/no texture dictionary/i.test(m)) return fail('ttk-notex', m);
    log('ttk engine: ' + m);
    return fail('ttk-fail', m);
  }

  // ---- texconv ----
  function runTex(args) {
    return new Promise((resolve) => {
      try {
        execFile(texconv(), args, { windowsHide: true, timeout: 180000, maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' },
          (err, so, se) => resolve({ err, out: String(so || '') + String(se || '') }));
      } catch (e) { resolve({ err: e, out: String(e && e.message || e) }); }
    });
  }
  const texErr = (r) => {
    const t = (r.out || '').split(/\r?\n/).map((x) => x.trim()).filter((x) => /FAILED|ERROR|Invalid|Can't|requires/i.test(x));
    return (t.join(' | ') || (r.err && r.err.message) || 'conversion error').slice(0, 240);
  };
  const fit = (w, h, max) => { const s = Math.min(1, max / Math.max(1, w, h)); return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))]; };
  const hasTex = () => isFile(texconv());
  const rageReady = () => isFile(path.join(binDir(), 'TextureTool.exe')) && isFile(path.join(binDir(), 'ttk.ps1'));

  // DDS -> PNG (data URL) для списка файлов с известным размером; группируем по целевому размеру, чтобы texconv запускался редко
  async function ddsToPng(items, max) {
    const groups = {};
    for (const it of items) { const f = fit(it.w, it.h, max), same = f[0] === it.w && f[1] === it.h, k = f[0] + 'x' + f[1] + (same ? 's' : 'r'); (groups[k] = groups[k] || { w: f[0], h: f[1], same, files: [] }).files.push(it); }
    const res = {}, jobs = [];
    for (const k of Object.keys(groups)) { const g = groups[k]; for (let a = 0; a < g.files.length; a += 16) jobs.push({ g, files: g.files.slice(a, a + 16) }); }
    let next = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const { g, files } = jobs[next++];
        const out = path.join(path.dirname(files[0].dds), 'png_' + (++seq));
        fs.mkdirSync(out, { recursive: true });
        const args = ['-nologo', '-y', '-ft', 'png', '-m', '1'];
        if (!g.same) args.push('-w', String(g.w), '-h', String(g.h));
        args.push('-o', out);
        files.forEach((f) => args.push(f.dds));
        await runTex(args);
        for (const f of files) {
          const p = path.join(out, path.basename(f.dds, '.dds') + '.png');
          try { res[f.key] = MIME + fs.readFileSync(p).toString('base64'); } catch (e) { /* не получилось: превью не будет */ }
        }
      }
    };
    // несколько texconv одновременно (до 4): миниатюры разных размеров и большие пачки считаются параллельно
    await Promise.all(Array.from({ length: Math.min(4, jobs.length) }, worker));
    return res;
  }

  // картинка/DDS -> DDS под нужные параметры; возвращает путь к DDS
  async function toDds(src, o) {
    const ext = path.extname(src).toLowerCase();
    if (ext === '.dds') return { path: src };
    if (!hasTex()) return { err: 'ttk-nobin' };
    const out = tmpSub();
    const fmt = DXGI[o.fmt] ? o.fmt : 'DXT5';
    const args = ['-nologo', '-y', '-ft', 'dds', '-f', DXGI[fmt], '-m', String(clampN(o.levels, 0, 16, 0))];
    if (o.w && o.h) {
      let w = clampN(o.w, 1, 16384, 0), h = clampN(o.h, 1, 16384, 0);
      if (isBC(fmt)) { w = Math.ceil(w / 4) * 4; h = Math.ceil(h / 4) * 4; }
      args.push('-w', String(w), '-h', String(h));
    }
    if (needDx10(fmt)) args.push('-dx10');
    args.push('-o', out, src);
    const r = await runTex(args);
    const p = path.join(out, path.basename(src, path.extname(src)) + '.dds');
    if (!isFile(p)) return { err: 'convert', why: texErr(r) };
    return { path: p };
  }

  const wrap = (ch, fn) => ipcMain.handle(ch, async (_e, ...a) => {
    try { return await fn(...a); } catch (e) {
      const m = String((e && e.message) || e);
      if (/^(ttk-win|ttk-missing|ttk-nofile|ttk-fail|ttk-nobin)$/.test(m)) return fail(m, e && e.why);
      log(ch + ': ' + (e && e.stack || e));
      return fail('ttk-fail', m);
    }
  });

  // ---- диалоги ----
  ipcMain.handle('ttk:available', () => ({ win: WIN, engine: (isFile(path.join(binDir(), 'TextureTool.exe')) && isFile(path.join(binDir(), 'ttk.ps1'))) || cwReady(), cw: cwReady(), texconv: hasTex() }));
  ipcMain.handle('ttk:pick', async () => {
    const r = await dialog.showOpenDialog(getWin(), { properties: ['openFile'], filters: [{ name: 'GTA V', extensions: ['ytd', 'ydd', 'ydr', 'yft', 'ypt'] }, { name: 'All', extensions: ['*'] }] });
    return r.canceled ? '' : r.filePaths[0];
  });
  ipcMain.handle('ttk:pick-images', async (_e, multi) => {
    const r = await dialog.showOpenDialog(getWin(), { properties: multi ? ['openFile', 'multiSelections'] : ['openFile'], filters: [{ name: 'Images / DDS', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'tga', 'dds', 'tif', 'tiff'] }] });
    return r.canceled ? [] : r.filePaths;
  });
  ipcMain.handle('ttk:pick-dir', async () => {
    const r = await dialog.showOpenDialog(getWin(), { properties: ['openDirectory', 'createDirectory'] });
    return r.canceled ? '' : r.filePaths[0];
  });
  ipcMain.handle('ttk:reveal', (_e, p) => { try { if (typeof p === 'string' && fs.existsSync(p)) shell.showItemInFolder(p); } catch (e) { /* нет файла */ } });

  // ---- сессия ----
  wrap('ttk:open', (p) => enqueue(async () => {
    if (typeof p !== 'string' || !path.isAbsolute(p)) return fail('bad-path');
    const ext = path.extname(p).toLowerCase();
    if (!EXTS.has(ext)) return fail('ttk-bad-type');
    let stt; try { stt = fs.statSync(p); } catch (e) { return fail('not-found'); }
    if (!stt.isFile()) return fail('bad-path');
    if (stt.size > MAX_FILE) return fail('ttk-big');
    if (!WIN) return fail('ttk-win');
    closeSession();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'marly-ttk-'));
    const work = path.join(dir, path.basename(p));
    sess = { dir, orig: p, work, name: path.basename(p), ext, size: stt.size, dirty: false };
    try { fs.copyFileSync(p, work); } catch (e) { closeSession(); return fail('ttk-fail', e.message); }
    // порядок движков: .ypt сначала CodeWalker.Core, .ytd сначала Texture Toolkit; второй пробуем, если первый не прочитал файл
    const order = (ext === '.ypt' ? ['cw', 'rage'] : ext === '.ytd' ? ['rage', 'cw'] : ['rage']).filter((e) => (e === 'cw' ? cwReady() : rageReady()));
    if (!order.length) { closeSession(); return fail('ttk-missing'); }
    let j = null; const errs = [];
    for (const eng of order) {
      sess.engine = eng;
      try { j = await runPs('list', {}, eng); } catch (e) { j = { ok: false, message: String((e && e.why) || (e && e.message) || e), type: 'host' }; }
      if (j.ok) break;
      const line = eng + ': ' + (j.type ? j.type + ': ' : '') + String(j.message || j.error || '?');
      errs.push(line);
      log('ttk: ' + eng + ' could not open ' + sess.name + ' | ' + line + (j.stack ? ' | ' + j.stack : ''));
    }
    if (!j || !j.ok) { const why = errs.join(' || '); const er = engineErr(j, why); closeSession(); return er; }
    return { ok: true, name: sess.name, ext, size: stt.size, path: p, type: j.type || '', dicts: j.dicts || [] };
  }));
  wrap('ttk:close', () => enqueue(async () => { closeSession(); return { ok: true }; }));
  wrap('ttk:revert', () => enqueue(async () => {
    if (!sess) return fail('ttk-nofile');
    fs.copyFileSync(sess.orig, sess.work);
    const j = await runPs('list', {});
    if (!j.ok) return engineErr(j);
    sess.dirty = false;
    return { ok: true, dicts: j.dicts || [] };
  }));

  // ---- превью и экспорт: текстура -> DDS (движок программы) -> PNG (texconv) ----
  async function exportDds(items) {
    const dir = tmpSub();
    const list = items.map((it) => ({ d: it.d, i: it.i, name: it.name, path: path.join(dir, it.d + '_' + it.i + '.dds') }));
    const j = await runPs('export', { items: list });
    if (!j.ok) throw Object.assign(new Error('engine'), { j });
    return { list, j };
  }
  const cleanItems = (arr, max) => (Array.isArray(arr) ? arr : []).slice(0, max).map((x) => ({ d: clampN(x && x.d, 0, 9999, 0), i: clampN(x && x.i, 0, 99999, 0), name: String((x && x.name) || '').slice(0, 200), w: clampN(x && x.w, 1, 16384, 256), h: clampN(x && x.h, 1, 16384, 256) }));

  wrap('ttk:thumbs', (req) => { const s0 = sess; return enqueue(async () => {
    if (!sess) return fail('ttk-nofile');
    if (sess !== s0) return { ok: true, thumbs: {} }; // пока ждали очередь, открыли другой файл
    if (!hasTex()) return fail('ttk-nobin');
    const items = cleanItems(req && req.items, 128);
    if (!items.length) return { ok: true, thumbs: {} };
    let ex; try { ex = await exportDds(items); } catch (e) { if (e.j) return engineErr(e.j); throw e; }
    const okSet = new Set((ex.j.exported || []).map(Number));
    const todo = ex.list.filter((x) => okSet.has(x.i)).map((x, k) => ({ key: x.d + '|' + x.i, dds: x.path, w: items.find((y) => y.d === x.d && y.i === x.i).w, h: items.find((y) => y.d === x.d && y.i === x.i).h }));
    const png = await ddsToPng(todo, 96);
    rm(path.dirname(ex.list[0].path));
    const thumbs = {};
    for (const it of items) { const u = png[it.d + '|' + it.i]; if (u) thumbs[it.name] = u; }
    return { ok: true, thumbs };
  }, true); });
  let prevSeq = 0;
  wrap('ttk:preview', (req) => { const my = ++prevSeq; return enqueue(async () => {
    if (my !== prevSeq) return fail('ttk-stale'); // пока стояли в очереди, запросили другую текстуру
    if (!sess) return fail('ttk-nofile');
    if (!hasTex()) return fail('ttk-nobin');
    const items = cleanItems([req], 1);
    if (!items.length) return fail('ttk-fail');
    let ex; try { ex = await exportDds(items); } catch (e) { if (e.j) return engineErr(e.j); throw e; }
    if (!(ex.j.exported || []).length) return fail('ttk-fail', ((ex.j.failed || [])[0] || {}).message);
    const it = items[0], png = await ddsToPng([{ key: 'p', dds: ex.list[0].path, w: it.w, h: it.h }], 2048);
    rm(path.dirname(ex.list[0].path));
    return png.p ? { ok: true, url: png.p } : fail('ttk-fail');
  }); });

  wrap('ttk:export', (req) => enqueue(async () => {
    if (!sess) return fail('ttk-nofile');
    const items = cleanItems(req && req.items, 5000);
    const dir = req && req.dir;
    const png = req && req.fmt === 'png';
    if (!items.length) return fail('ttk-fail');
    if (typeof dir !== 'string' || !path.isAbsolute(dir)) return fail('bad-path');
    if (png && !hasTex()) return fail('ttk-nobin');
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { return fail('bad-path'); }
    const used = new Set();
    const uniq = (base) => { let n = safeName(base), k = 0, c = n; while (used.has(c.toLowerCase()) || fs.existsSync(path.join(dir, c + (png ? '.png' : '.dds')))) c = n + '_' + (++k); used.add(c.toLowerCase()); return c; };
    const names = items.map((it) => uniq(it.name));
    const tdir = png ? tmpSub() : dir;
    const list = items.map((it, k) => ({ d: it.d, i: it.i, name: it.name, path: path.join(tdir, names[k] + '.dds') }));
    const j = await runPs('export', { items: list });
    if (!j.ok) return engineErr(j);
    const okSet = new Set((j.exported || []).map(Number));
    let count = okSet.size;
    if (png) {
      count = 0;
      const files = list.filter((x) => okSet.has(x.i)).map((x) => x.path);
      for (let a = 0; a < files.length; a += 24) {
        const part = files.slice(a, a + 24);
        await runTex(['-nologo', '-y', '-ft', 'png', '-m', '1', '-o', dir, ...part]);
      }
      for (const x of list) if (okSet.has(x.i) && isFile(path.join(dir, path.basename(x.path, '.dds') + '.png'))) count++;
    }
    return { ok: true, count, dir, failed: Math.max(0, items.length - count) };
  }));

  // ---- правка: замена / добавление / удаление одним проходом (одна загрузка и одно сохранение файла) ----
  wrap('ttk:apply', (req) => enqueue(async () => {
    if (!sess) return fail('ttk-nofile');
    const o = (req && req.opts) || {};
    const ops = Array.isArray(req && req.ops) ? req.ops.slice(0, 2000) : [];
    const psOps = [], failed = [];
    for (const op of ops) {
      const kind = op && op.op;
      const d = clampN(op && op.d, 0, 9999, 0), i = clampN(op && op.i, 0, 99999, 0), name = String((op && op.name) || '').slice(0, 200);
      if (kind === 'delete') { psOps.push({ op: 'delete', d, i, name }); continue; }
      // «пустая текстура»: своя DDS 4x4 DXT5 из bin/ttk/empty.dds подставляется как обычная замена, поэтому имя, хэш и остальные поля записи не меняются
      if (kind === 'empty') {
        const ef = path.join(binDir(), 'empty.dds');
        if (!isFile(ef)) { failed.push({ op: 'empty', name, message: 'empty.dds missing' }); continue; }
        let cp = ''; try { cp = path.join(tmpSub(), 'empty.dds'); fs.copyFileSync(ef, cp); } catch (e) { failed.push({ op: 'empty', name, message: String(e && e.message || e).slice(0, 120) }); continue; }
        psOps.push({ op: 'replace', d, i, name, path: cp });
        continue;
      }
      if (kind !== 'replace' && kind !== 'add') continue;
      const src = op.src;
      if (typeof src !== 'string' || !path.isAbsolute(src) || !IMG.has(path.extname(src).toLowerCase()) || !isFile(src)) { failed.push({ op: kind, name: name || String(src || ''), message: 'bad file' }); continue; }
      let cv;
      if (kind === 'replace') {
        const t = op.tex || {};
        const keep = o.fmt !== 'keep' && DXGI[o.fmt] ? o.fmt : (DXGI[t.format] ? t.format : 'DXT5');
        const levels = o.mip === 'off' ? 1 : o.mip === 'auto' ? 0 : Math.max(1, clampN(t.levels, 0, 16, 1) || clampN(t.mips, 0, 16, 1) || 1);
        cv = await toDds(src, { fmt: keep, levels, w: o.fit === 0 ? 0 : t.w, h: o.fit === 0 ? 0 : t.h });
      } else {
        cv = await toDds(src, { fmt: o.addFmt, levels: o.mip === 'off' ? 1 : 0 });
      }
      if (cv.err) { failed.push({ op: kind, name: name || path.basename(src), message: cv.err === 'ttk-nobin' ? 'engine' : (cv.why || cv.err) }); continue; }
      psOps.push({ op: kind, d, i, name, path: cv.path });
    }
    if (!psOps.length) return { ok: true, done: 0, failed, dicts: null };
    const j = await runPs('apply', { ops: psOps });
    if (!j.ok) return engineErr(j);
    if (j.done > 0) sess.dirty = true;
    return { ok: true, done: j.done || 0, failed: failed.concat(j.failed || []), dicts: j.dicts || [] };
  }));

  // ---- сохранение ----
  wrap('ttk:save', (req) => enqueue(async () => {
    if (!sess) return fail('ttk-nofile');
    let target = sess.orig;
    if (req && req.as) {
      const r = await dialog.showSaveDialog(getWin(), { defaultPath: sess.orig, filters: [{ name: sess.ext.slice(1).toUpperCase(), extensions: [sess.ext.slice(1)] }] });
      if (r.canceled || !r.filePath) return fail('cancel');
      target = r.filePath;
      if (path.extname(target).toLowerCase() !== sess.ext) target += sess.ext;
    }
    const tmp = target + '.mh_tmp';
    try { fs.copyFileSync(sess.work, tmp); fs.renameSync(tmp, target); } catch (e) { rm(tmp); return fail('ttk-save', e.message); }
    sess.orig = target; sess.name = path.basename(target); sess.dirty = false;
    return { ok: true, path: target, name: sess.name };
  }));

  app.on('will-quit', closeSession);
}

module.exports = { init };
