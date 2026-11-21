// RPF Explorer внутри Marly Helper: свой движок (rpf.js), без внешних программ и окон.
// Что делает модуль: хранит папку GTA V, достаёт ключи из gta5.exe (один раз, кэш в userData),
// отдаёт интерфейсу дерево игры (папки, .rpf, вложенные .rpf), поиск по всем архивам, просмотр,
// извлечение, замену/добавление/удаление/переименование (правки идут в воркере, резервные копии не создаются).
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const R = require('./rpf');

const WIN = process.platform === 'win32';
let cfgFile = '', keysFile = '', keysMeta = '';
let st = { game: '', gen9: false };
let keys = null, keysState = 'none', keysErr = '', keysFound = null, keysP = 0, keysJob = null;
let busy = '';
let idx = { state: 'none', done: 0, total: 0, P: [], PL: [], S: [], F: [] };
let send = () => {};
let log = () => {};
let appRef = null;
const XML_EXT = /\.(ypt|ydr|ydd|yft|ytd|yld|ycd|ybn|ynd|ynv|ywr|yvr|yed|yfd|ymap|ytyp|ymt|meta|pso|rbf|awc|fxc|ypdb|cut)$/i;
// Тихий конвертер ресурсов в XML и обратно (bin/mhconv, без окон; движок CodeWalker.Core). Только Windows.
function convSrcDir() { return appRef.isPackaged ? path.join(process.resourcesPath, 'bin', 'mhconv') : path.join(__dirname, 'bin', 'mhconv'); }
// Расхеширование как в CodeWalker: имена всех файлов игры (из индекса поиска) кладутся в словарь хэшей (JenkIndex), поэтому в XML вместо hash_XXXXXXXX
// появляются настоящие имена (модели, текстурные словари, архетипы и т.д.). Конвертер читает strings.txt рядом с exe, поэтому запускается из копии
// в userData, где strings.txt = встроенный словарь + имена из индекса. Словарь пересобирается, когда индекс игры дособран (не во время сборки).
let convRun = '', namesBuilt = -1;
function buildNamesFile(dir, src) {
  const set = new Set();
  const P = idx.PL || [], F = idx.F || [];
  for (let i = 0; i < P.length; i++) {
    if (F[i] === 3) continue;
    const p = P[i], nm = p.slice(p.lastIndexOf('/') + 1), dot = nm.lastIndexOf('.'), stem = dot > 0 ? nm.slice(0, dot) : nm;
    if (stem.length > 1 && stem.length < 80 && /^[\x21-\x7e]+$/.test(stem)) set.add(stem);
  }
  let base = ''; try { base = fs.readFileSync(path.join(src, 'strings.txt'), 'utf8'); } catch (e) { /* без встроенного */ }
  const f = path.join(dir, 'strings.txt'), tmp = f + '.tmp';
  fs.writeFileSync(tmp, base.replace(/\s+$/, '') + '\n' + [...set].join('\n') + '\n', 'utf8');
  fs.renameSync(tmp, f);
  namesBuilt = P.length;
  log('mhconv names: ' + set.size);
}
function prepConv() {
  const src = convSrcDir(), exe0 = path.join(src, 'mhconv.exe');
  if (!isFile(exe0)) return '';
  const ready = idx && idx.state !== 'run';
  const nIdx = (idx.PL || []).length;
  if (convRun && (!ready || nIdx === 0 || namesBuilt === nIdx)) return convRun;
  try {
    const dir = path.join(appRef.getPath('userData'), 'mhconv'); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      if (f.toLowerCase() === 'strings.txt') continue;
      const a = path.join(src, f), b = path.join(dir, f); let same = false;
      try { const sa = fs.statSync(a), sb = fs.statSync(b); same = sa.size === sb.size && sb.mtimeMs >= sa.mtimeMs; } catch (e) { /* нет копии */ }
      if (!same) fs.copyFileSync(a, b);
    }
    if (ready && (idx.PL || []).length && namesBuilt !== idx.PL.length) buildNamesFile(dir, src);
    else if (!isFile(path.join(dir, 'strings.txt'))) fs.copyFileSync(path.join(src, 'strings.txt'), path.join(dir, 'strings.txt'));
    convRun = path.join(dir, 'mhconv.exe');
    return convRun;
  } catch (e) { log('mhconv prep: ' + (e && e.message)); return convRun || exe0; }
}
function convExe() {
  if (!WIN || !appRef) return '';
  return prepConv();
}
// при сбое конвертера: что именно отдали (тип записи, первые 16 байт файла), чтобы по log.txt было видно, ресурс это или бинарный файл
function convDbg(r, inF) {
  try {
    const fd = fs.openSync(inF, 'r'), b = Buffer.alloc(16), n = fs.readSync(fd, b, 0, 16, 0); fs.closeSync(fd);
    const e = r.entry;
    log('mhconv input ' + e.name + ': t=' + e.t + ' size=' + e.size + (e.sizeBig ? ' big' : '') + ' sys=' + (e.sys >>> 0).toString(16) + ' gfx=' + (e.gfx >>> 0).toString(16) + ' head=' + b.subarray(0, n).toString('hex'));
  } catch (x) { /* только диагностика */ }
}
function runConv(args, cwd) {
  const exe = convExe();
  return new Promise((resolve, reject) => {
    if (!exe) return reject(new Error('no-conv'));
    execFile(exe, args, { windowsHide: true, timeout: 300000, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8', cwd: cwd || path.dirname(exe) }, (err, so, se) => {
      if (!err) return resolve(String(so || '').trim());
      const m = String(se || err.message || '');
      log('mhconv ' + args[0] + ' ' + path.basename(String(args[2] || '')) + ': ' + m.slice(0, 600) + (err && err.killed ? ' [timeout]' : '') + (err && err.code != null ? ' [code ' + err.code + ']' : ''));
      const er = new Error(/unsupported/.test(m) ? 'xml-unsupported' : /Texture file not found/i.test(m) ? 'xml-no-tex' : 'xml-fail');
      // причина из конвертера (тип исключения + текст) уходит в UI, иначе видна только общая фраза
      er.why = (err && err.killed ? 'timeout' : (m.split(/\r?\n/).map((x) => x.trim()).find((x) => x) || (err && err.code != null ? 'exit ' + err.code : ''))).replace(/^error:\s*/i, '');
      reject(er);
    });
  });
}

// «Распечатать»: снятие защиты (LOCK BY MIRZ / LOCK BY NG) с RPF движком ONYX RPF UTILITY (bin/onyx), без его окна:
// unseal.ps1 грузит ONYX RPF UTILITY.exe и вызывает MainModel.AnalyzeProtection/UnlockArchive. ONYX - 32-битная программа на .NET Framework,
// поэтому запускается через 32-битный PowerShell (SysWOW64). Только Windows. Работает на копии файла, оригинал заменяется после успеха.
let onyxReady = '';
function onyxSrcDir() { return appRef.isPackaged ? path.join(process.resourcesPath, 'bin', 'onyx') : path.join(__dirname, 'bin', 'onyx'); }
function copyIfNew(a, b, link) {
  let same = false;
  try { const sa = fs.statSync(a), sb = fs.statSync(b); same = sa.size === sb.size && (link || sb.mtimeMs >= sa.mtimeMs); } catch (e) { /* копии нет */ }
  if (same) return;
  if (link) { try { fs.rmSync(b, { force: true }); fs.linkSync(a, b); return; } catch (e) { /* другой том: копируем */ } }
  fs.copyFileSync(a, b);
}
function copyTree(a, b) {
  fs.mkdirSync(b, { recursive: true });
  for (const e of fs.readdirSync(a, { withFileTypes: true })) {
    const x = path.join(a, e.name), y = path.join(b, e.name);
    if (e.isDirectory()) copyTree(x, y); else copyIfNew(x, y, false);
  }
}
// ONYX пишет рядом с собой лог и временные файлы, поэтому работает из копии в userData (не из ресурсов приложения)
function prepOnyx() {
  const src = onyxSrcDir(), dir = path.join(appRef.getPath('userData'), 'onyx');
  if (!isFile(path.join(src, 'ONYX RPF UTILITY.exe')) || !isFile(path.join(src, 'unseal.ps1'))) throw new Error('onyx-missing');
  if (onyxReady === dir && isFile(path.join(dir, 'unseal.ps1'))) return dir;
  copyTree(src, dir);
  // ключи хранятся один раз (keys), lock1337 получает такие же файлы (жёсткая ссылка или копия)
  const kd = path.join(dir, 'keys'), ld = path.join(dir, 'lock1337');
  fs.mkdirSync(ld, { recursive: true });
  for (const f of fs.readdirSync(kd)) copyIfNew(path.join(kd, f), path.join(ld, f), true);
  onyxReady = dir;
  return dir;
}
function runOnyx(file) {
  return new Promise((resolve, reject) => {
    let dir; try { dir = prepOnyx(); } catch (e) { return reject(e); }
    const root = process.env.SystemRoot || 'C:\\Windows';
    let ps = path.join(root, 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    if (!isFile(ps)) ps = path.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const logF = path.join(appRef.getPath('userData'), 'onyx-log.txt');
    const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(dir, 'unseal.ps1'), '-Rpf', file, '-Root', dir, '-Log', logF];
    execFile(ps, args, { windowsHide: true, timeout: 900000, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8', cwd: dir }, (err, so, se) => {
      const lines = String(so || '').split(/\r?\n/).map((x) => x.trim()).filter((x) => x[0] === '{');
      let j = null; if (lines.length) { try { j = JSON.parse(lines[lines.length - 1]); } catch (e) { /* не JSON */ } }
      if (j) return resolve(j);
      log('onyx: ' + String(se || (err && err.message) || so || '').slice(0, 600));
      reject(new Error('onyx-fail'));
    });
  });
}

// Имя папки с текстурами для XML: как в CodeWalker (ExploreForm.ImportXml): убрать ".xml" (и ".pso"/".rbf"), затем расширение модели.
// foo.ydr.xml -> foo, foo.ytd.xml -> foo, my.xml -> my
function xmlStem(base) {
  let b = String(base || '').replace(/\.xml$/i, '').replace(/\.(pso|rbf)$/i, '');
  b = path.parse(b).name;
  return safeName(b);
}
function countFilesDeep(d) { let n = 0; try { for (const e of fs.readdirSync(d, { withFileTypes: true })) n += e.isDirectory() ? countFilesDeep(path.join(d, e.name)) : 1; } catch (e) { /* нет папки */ } return n; }
// Импорт XML -> ресурс. Конвертер ищет DDS в папке, имя которой равно переданному ему имени и лежит в его рабочем каталоге,
// поэтому папку с текстурами рядом с XML (<имя XML без расширений>) копируем во временный каталог под этим именем.
async function runImport(xmlFile, argName, outF) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mhi-'));
  try {
    const tf = path.join(path.dirname(xmlFile), xmlStem(path.basename(xmlFile)));
    if (isDir(tf)) await fs.promises.cp(tf, path.join(work, argName), { recursive: true });
    await runConv(['import', xmlFile, argName, outF], work);
  } finally { try { fs.rmSync(work, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
}

function str(x) { return typeof x === 'string' ? x : ''; }
function load() { try { const j = JSON.parse(fs.readFileSync(cfgFile, 'utf8')); st = { game: str(j.game), gen9: !!j.gen9 }; } catch (e) { /* первый запуск */ } }
function save() { try { fs.writeFileSync(cfgFile, JSON.stringify(st)); } catch (e) { /* не критично */ } }
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch (e) { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile(); } catch (e) { return false; } }

// Папка игры: gta5.exe (Legacy) или gta5_enhanced.exe (Enhanced).
function gameKind(d) {
  if (!d || !isDir(d)) return '';
  if (isFile(path.join(d, 'GTA5_Enhanced.exe')) || isFile(path.join(d, 'gta5_enhanced.exe'))) return 'enhanced';
  if (isFile(path.join(d, 'GTA5.exe')) || isFile(path.join(d, 'gta5.exe'))) return 'legacy';
  return '';
}
function exeOf(d) {
  const k = gameKind(d);
  const names = k === 'enhanced' ? ['GTA5_Enhanced.exe', 'gta5_enhanced.exe'] : ['GTA5.exe', 'gta5.exe'];
  return names.map((n) => path.join(d, n)).find(isFile) || '';
}
function regQuery(key, value, args) {
  return new Promise((resolve) => {
    if (!WIN) return resolve('');
    execFile('reg', ['query', key, '/v', value].concat(args || []), { windowsHide: true, timeout: 5000 }, (err, out) => {
      if (err || !out) return resolve('');
      const m = String(out).split(/\r?\n/).map((l) => l.match(/^\s+\S+\s+REG_\w+\s+(.+?)\s*$/)).find(Boolean);
      resolve(m ? m[1] : '');
    });
  });
}
async function detectGame() {
  const found = [];
  const add = (src, p) => { if (p && gameKind(p) && !found.some((f) => f.path.toLowerCase() === p.toLowerCase())) found.push({ source: src, path: p, kind: gameKind(p) }); };
  let steam = await regQuery('HKLM\\SOFTWARE\\Rockstar Games\\GTAV', 'InstallFolderSteam', ['/reg:32']);
  if (/\\GTAV$/i.test(steam)) steam = steam.slice(0, -5);
  add('Steam', steam);
  add('Rockstar', await regQuery('HKLM\\SOFTWARE\\Rockstar Games\\Grand Theft Auto V', 'InstallFolder', ['/reg:32']));
  add('OpenIV', await regQuery('HKCU\\Software\\NewTechnologyStudio\\OpenIV.exe\\BrowseForFolder', 'game_path_Five_pc'));
  const pf = [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, 'C:\\Program Files (x86)', 'C:\\Program Files'].filter(Boolean);
  for (const b of pf) {
    add('Steam', path.join(b, 'Steam', 'steamapps', 'common', 'Grand Theft Auto V'));
    add('Rockstar', path.join(b, 'Rockstar Games', 'Grand Theft Auto V'));
    add('Epic', path.join(b, 'Epic Games', 'GTAV'));
  }
  return found;
}

function statusObj() {
  const kind = gameKind(st.game);
  return {
    win: WIN, game: st.game, gameOk: !!kind, gameKind: kind, gen9: kind === 'enhanced',
    keys: keysState, keysP, keysErr, keysFound, busy, xml: !!convExe(),
    idx: { state: idx.state, done: idx.done, total: idx.total, count: idx.P.length },
  };
}
function push() { try { send('cw:state', statusObj()); } catch (e) { /* окно закрыто */ } }

// ---------- ключи ----------
function exeSig(exe) { try { const s = fs.statSync(exe); return s.size + ':' + Math.floor(s.mtimeMs); } catch (e) { return ''; } }
function loadCachedKeys(exe) {
  try {
    const m = JSON.parse(fs.readFileSync(keysMeta, 'utf8'));
    if (m.exe !== exe.toLowerCase() || m.sig !== exeSig(exe)) return null;
    return R.Keys.unpack(fs.readFileSync(keysFile));
  } catch (e) { return null; }
}
async function ensureKeys() {
  if (keysState === 'ready' && keys) return keys;
  if (keysJob) return keysJob;
  const exe = exeOf(st.game);
  if (!exe) { keysState = 'error'; keysErr = 'no-game'; push(); throw new Error('no-game'); }
  const cached = loadCachedKeys(exe);
  if (cached) { keys = cached; keysState = 'ready'; keysErr = ''; keysFound = null; push(); return keys; }
  keysState = 'scanning'; keysErr = ''; keysP = 0; keysFound = null; push();
  let lastSent = 0;
  keysJob = R.loadKeysFromExe(exe, (p) => { keysP = p; const n = Date.now(); if (n - lastSent > 300) { lastSent = n; push(); } })
    .then((k) => {
      keys = k; keysState = 'ready'; keysErr = ''; keysJob = null;
      try { fs.writeFileSync(keysFile, k.pack()); fs.writeFileSync(keysMeta, JSON.stringify({ exe: exe.toLowerCase(), sig: exeSig(exe) })); } catch (e) { log('rpf keys cache ' + (e && e.message)); }
      push(); return k;
    })
    .catch((e) => {
      keysJob = null; keys = null; keysState = 'error'; keysErr = e && /^(keys-missing|keys-magic|no-magic)$/.test(e.message) ? e.message : 'keys-fail'; keysFound = e && e.found || null;
      if (!(e && /^(keys-missing|keys-magic)$/.test(e.message))) log('rpf keys ' + (e && e.stack || e)); push(); throw e;
    });
  return keysJob;
}
function resetKeys() { keys = null; keysState = 'none'; keysErr = ''; keysFound = null; keysJob = null; }

// ---------- кэш открытых архивов ----------
const cache = new Map(); // top -> { sig, src, arches: Map(chainKey -> Archive) }
function dropTop(top) { const c = cache.get(top); if (c) { try { c.src.close(); } catch (e) { /* ok */ } cache.delete(top); } }
function dropAll() { for (const k of Array.from(cache.keys())) dropTop(k); }
function getArch(top, chain) {
  let c = cache.get(top);
  const sig = exeSig(top);
  if (c && c.sig !== sig) { dropTop(top); c = null; }
  if (!c) {
    if (cache.size >= 6) dropTop(cache.keys().next().value);
    const src = new R.FileSrc(top);
    c = { sig, src, arches: new Map() };
    c.arches.set('', new R.Archive(src, path.basename(top), keys).load());
    cache.set(top, c);
  }
  let key = '', arch = c.arches.get('');
  for (const seg of chain) {
    key += '|' + seg.join('/');
    let a = c.arches.get(key);
    if (!a) { const e = arch.find(seg); if (!e || e.t !== 'b') throw new Error('not-found'); a = arch.child(e); c.arches.set(key, a); }
    arch = a;
  }
  return arch;
}

// ---------- пути ----------
function cleanParts(vp) {
  const parts = String(vp || '').split('/').filter(Boolean);
  if (parts.length > 64) throw new Error('bad-path');
  for (const p of parts) if (p === '..' || p === '.' || /[\\:*?"<>|\x00-\x1f]/.test(p)) throw new Error('bad-path');
  return parts;
}
// Результат: fsdir | file(на диске) | arch (корень архива) | dir | entry. asEntry: последний сегмент не раскрывать как архив.
function resolve(vp, asEntry) {
  if (!gameKind(st.game)) throw new Error('no-game');
  const parts = cleanParts(vp);
  let fsp = st.game;
  for (let i = 0; i < parts.length; i++) {
    const next = path.join(fsp, parts[i]);
    let s; try { s = fs.statSync(next); } catch (e) { throw new Error('not-found'); }
    if (s.isDirectory()) { fsp = next; continue; }
    if (/\.rpf$/i.test(parts[i])) return resolveIn(next, parts.slice(i + 1), !!asEntry, parts.slice(0, i + 1));
    return { kind: 'file', fs: next, parts };
  }
  return { kind: 'fsdir', fs: fsp, parts };
}
function resolveIn(top, rest, asEntry, head) {
  const chain = []; let seg = [];
  let arch = getArch(top, chain), cur = arch.root;
  if (!rest.length && asEntry) return { kind: 'rpffile', top, fs: top, parts: head };
  for (let i = 0; i < rest.length; i++) {
    if (!cur || cur.t !== 'd') throw new Error('not-found');
    const low = rest[i].toLowerCase(), c = cur.children.find((x) => x.name.toLowerCase() === low);
    if (!c) throw new Error('not-found');
    seg.push(c.name);
    const last = i === rest.length - 1;
    if (c.t === 'b' && /\.rpf$/i.test(c.name) && !(last && asEntry)) { chain.push(seg); seg = []; arch = getArch(top, chain); cur = arch.root; continue; }
    cur = c;
  }
  const isRoot = cur === arch.root;
  return { kind: isRoot ? 'arch' : cur.t === 'd' ? 'dir' : 'entry', top, chain, arch, entry: cur, seg, parts: head.concat(rest) };
}

function itemOf(arch, c) {
  if (c.t === 'd') return { name: c.name, type: 'dir', n: c.children.length };
  const isRpf = c.t === 'b' && /\.rpf$/i.test(c.name);
  return {
    name: c.name, type: isRpf ? 'rpf' : 'file', kind: c.t === 'b' ? 'bin' : 'res',
    size: c.t === 'b' ? c.usize : R.sizeFromFlags(c.sys) + R.sizeFromFlags(c.gfx),
    csize: arch.stored(c), enc: c.t === 'b' ? c.enc : (arch.isYsc(c) ? 1 : 0),
  };
}
// порядок: папки, затем RPF, затем остальные файлы сгруппированы по расширению (.meta к .meta, .ydr к .ydr ...), внутри группы по имени; без расширения в конце
const NCMP = (x, y) => x.localeCompare(y, undefined, { sensitivity: 'base', numeric: true });
function extOf(n) { const m = /\.([^.\\/]+)$/.exec(n); return m ? m[1].toLowerCase() : ''; }
function sortItems(a) {
  const rank = (t) => (t === 'dir' || t === 'fsdir' ? 0 : t === 'rpf' ? 1 : 2);
  return a.sort((x, y) => {
    const rx = rank(x.type), ry = rank(y.type); if (rx !== ry) return rx - ry;
    if (rx === 2) { const ex = extOf(x.name), ey = extOf(y.name); if (ex !== ey) return !ex ? 1 : !ey ? -1 : NCMP(ex, ey); }
    return NCMP(x.name, y.name);
  });
}

function listDir(vp) {
  const r = resolve(vp);
  if (r.kind === 'fsdir') {
    const out = [];
    for (const e of fs.readdirSync(r.fs, { withFileTypes: true })) {
      if (e.isDirectory()) out.push({ name: e.name, type: 'fsdir' });
      else if (/\.rpf$/i.test(e.name)) { let sz = 0; try { sz = fs.statSync(path.join(r.fs, e.name)).size; } catch (x) { /* ok */ } out.push({ name: e.name, type: 'rpf', size: sz, fs: 1 }); }
    }
    return { items: sortItems(out), enc: '' };
  }
  if (r.kind === 'arch' || r.kind === 'dir') {
    const items = sortItems(r.entry.children.map((c) => itemOf(r.arch, c)));
    return { items, enc: r.kind === 'arch' ? encName(r.arch.enc) : '' };
  }
  throw new Error('not-dir');
}
function encName(e) { return e === R.ENC.AES ? 'AES' : e === R.ENC.OPEN ? 'OPEN' : e === 0 ? 'NONE' : 'NG'; }

// ---------- индекс для поиска ----------
function walkRpf(root, maxN) {
  const out = [];
  const rec = (d, rel) => {
    if (out.length >= maxN) return;
    let list; try { list = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of list) {
      const p = path.join(d, e.name), r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) rec(p, r); else if (/\.rpf$/i.test(e.name)) out.push(r);
    }
  };
  rec(root, '');
  return out;
}
let idxQ = Promise.resolve();
function buildIndex(only) { idxQ = idxQ.then(() => buildIndexNow(only)).catch(() => {}); return idxQ; }
function dropTopIndex(only) {
  const drop = idx.P.map((p, i) => (p === only || p.startsWith(only + '/') ? i : -1)).filter((i) => i >= 0);
  if (drop.length) { const keep = (a) => a.filter((_, i) => !drop.includes(i)); idx.P = keep(idx.P); idx.PL = keep(idx.PL); idx.S = keep(idx.S); idx.F = keep(idx.F); }
  push();
}
async function buildIndexNow(only) {
  if (!gameKind(st.game)) return;
  if (idx.state === 'run' && !only) return;
  const k = await ensureKeys().catch(() => null);
  if (only) {
    // точечное обновление одного верхнего архива после правки
    const drop = idx.P.map((p, i) => (p === only || p.startsWith(only + '/') ? i : -1)).filter((i) => i >= 0);
    if (drop.length) { const keep = (a) => a.filter((_, i) => !drop.includes(i)); idx.P = keep(idx.P); idx.PL = keep(idx.PL); idx.S = keep(idx.S); idx.F = keep(idx.F); }
    const items = [];
    try { await R.runOpWorker({ kind: 'index', root: st.game, tops: [only] }, k, (m) => { if (m.t === 'items') items.push(...m.list); }); } catch (e) { log('rpf reindex ' + (e && e.message)); }
    addItems(items); push(); return;
  }
  idx = { state: 'run', done: 0, total: 0, P: [], PL: [], S: [], F: [] };
  const tops = walkRpf(st.game, 20000);
  idx.total = tops.length; push();
  let lastSent = 0;
  try {
    await R.runOpWorker({ kind: 'index', root: st.game, tops }, k, (m) => {
      if (m.t === 'items') addItems(m.list);
      else if (m.t === 'p') { idx.done = m.done; const n = Date.now(); if (n - lastSent > 400) { lastSent = n; push(); } }
    });
    idx.state = 'done'; idx.done = idx.total;
  } catch (e) { idx.state = 'error'; log('rpf index ' + (e && e.stack || e)); }
  push();
}
function addItems(list) { for (const [p, s, f] of list) { idx.P.push(p); idx.PL.push(p.toLowerCase()); idx.S.push(s); idx.F.push(f); } }
function search(q, limit) {
  const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!words.length) return { items: [], total: 0 };
  const out = []; let total = 0;
  for (let i = 0; i < idx.PL.length; i++) {
    const p = idx.PL[i];
    if (idx.F[i] === 3) continue;
    // совпадение ищем по имени и пути
    let ok = true; for (const w of words) if (p.indexOf(w) < 0) { ok = false; break; }
    if (!ok) continue;
    total++;
    if (out.length < limit) out.push({ path: idx.P[i], size: idx.S[i], f: idx.F[i] });
  }
  return { items: out, total };
}

// ---------- просмотр ----------
const IMG = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' };
function looksText(b) {
  const n = Math.min(b.length, 8192); if (!n) return true;
  let bad = 0;
  for (let i = 0; i < n; i++) { const c = b[i]; if (c === 0) return false; if (c < 9 || (c > 13 && c < 32)) bad++; }
  return bad / n < 0.02;
}
// ---------- текстовый редактор ----------
const TEXT_EXT = /\.(meta|xml|dat|txt|cfg|ini|json|csv|lst|ide|ipl)$/i;
function decodeText(b) {
  let enc = 'utf8', body = b;
  if (b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) { enc = 'utf8bom'; body = b.subarray(3); }
  else if (b.length >= 2 && b[0] === 0xFF && b[1] === 0xFE) { enc = 'utf16le'; body = b.subarray(2); }
  let text;
  if (enc === 'utf16le') text = body.toString('utf16le');
  else {
    text = body.toString('utf8');
    if (Buffer.compare(Buffer.from(text, 'utf8'), body) !== 0) { enc = 'latin1'; text = b.toString('latin1'); }
  }
  const crlf = (text.match(/\r\n/g) || []).length, lf = (text.match(/\n/g) || []).length - crlf;
  if (crlf) text = text.replace(/\r\n/g, '\n');
  return { text, enc, eol: crlf > 0 && crlf >= lf ? 'crlf' : 'lf', mixed: crlf > 0 && lf > 0 };
}
function encodeText(text, meta) {
  let enc = meta && ['utf8', 'utf8bom', 'utf16le', 'latin1'].includes(meta.enc) ? meta.enc : 'utf8';
  let s = String(text).replace(/\r\n/g, '\n');
  if (meta && meta.eol === 'crlf') s = s.replace(/\n/g, '\r\n');
  if (enc === 'latin1' && /[^\x00-\xff]/.test(s)) enc = 'utf8';
  if (enc === 'utf16le') return Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(s, 'utf16le')]);
  if (enc === 'utf8bom') return Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(s, 'utf8')]);
  return Buffer.from(s, enc);
}
function readEntry(r) {
  if (r.kind !== 'entry') throw new Error('not-file');
  if (r.entry.t === 'd') throw new Error('is-dir');
  return r.arch.extract(r.entry);
}
function preview(vp, lim) {
  const r = resolve(vp, true), e = r.entry;
  if (r.kind !== 'entry' || e.t === 'd') throw new Error('not-file');
  if (r.arch.stored(e) > 96 * 1024 * 1024) return { kind: 'big', size: e.t === 'b' ? e.usize : r.arch.stored(e) };
  const data = readEntry(r);
  const ext = (e.name.split('.').pop() || '').toLowerCase();
  const info = { size: data.length, ext };
  if (IMG[ext] && data.length < 12 * 1024 * 1024) return Object.assign(info, { kind: 'image', url: 'data:' + IMG[ext] + ';base64,' + data.toString('base64') });
  if (ext === 'ytd' && r.entry.t === 'r') {
    try { const L = require('./tex').listTextures(data, r.entry.sys, r.entry.gfx, 160, 48); return Object.assign(info, { kind: 'ytd', total: L.total, list: L.list }); } catch (e) { /* не словарь текстур Gen8: покажем как hex */ }
  }
  if (looksText(data)) { const cap = Math.min(lim || 262144, 1048576); return Object.assign(info, { kind: 'text', text: data.subarray(0, cap).toString('utf8'), cut: data.length > cap }); }
  return Object.assign(info, { kind: 'hex', hex: data.subarray(0, 8192).toString('base64'), cut: data.length > 8192 });
}

function safeName(n) { return String(n || 'file').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_'); }
function extractTo(r, dir, onFile) {
  const walk = (arch, d, outDir) => {
    fs.mkdirSync(outDir, { recursive: true });
    for (const c of d.children) {
      const p = path.join(outDir, safeName(c.name));
      if (c.t === 'd') walk(arch, c, p);
      else { fs.writeFileSync(p, arch.exportStd(c)); onFile(); }
    }
  };
  if (r.kind === 'arch' || r.kind === 'dir') walk(r.arch, r.entry, path.join(dir, safeName(r.entry.name || r.arch.name.replace(/\.rpf$/i, ''))));
  else throw new Error('not-dir');
}

// ----- перетаскивание файлов из окна на рабочий стол / в Проводник (webContents.startDrag, нужен настоящий файл) -----
const dragRoot = () => path.join(os.tmpdir(), 'marly-helper-drag');
const gameDragRoot = () => (st.game ? path.join(st.game, '.marly-helper-drag') : '');
function cleanDrag(maxAge) {
  for (const root of [dragRoot(), gameDragRoot()]) {
    if (!root) continue;
    try {
      for (const d of fs.readdirSync(root)) { const p = path.join(root, d); try { if (maxAge <= 0 || Date.now() - fs.statSync(p).mtimeMs > maxAge) fs.rmSync(p, { recursive: true, force: true }); } catch (e) { /* занято */ } }
      if (maxAge <= 0) fs.rmdirSync(root);
    } catch (e) { /* папки нет или не пуста */ }
  }
}
// Гарантия «копия, а не перемещение»: Проводнику отдаётся не сам файл игры, а его жёсткая ссылка (мгновенно, без места на диске),
// и даже если он выберет «Переместить», уедет только ссылка. Если ссылка невозможна (FAT/exFAT), делается полная копия.
function dragCopyOf(src) {
  const name = path.basename(src);
  for (const root of [dragRoot(), gameDragRoot()]) {
    if (!root) continue;
    let d = '';
    try {
      fs.mkdirSync(root, { recursive: true });
      d = fs.mkdtempSync(path.join(root, 'd-'));
      const t = path.join(d, name);
      fs.linkSync(src, t);
      return t;
    } catch (e) { if (d) try { fs.rmSync(d, { recursive: true, force: true }); } catch (x) { /* нет */ } }
  }
  fs.mkdirSync(dragRoot(), { recursive: true });
  const d = fs.mkdtempSync(path.join(dragRoot(), 'd-')), t = path.join(d, name);
  fs.copyFileSync(src, t, fs.constants.COPYFILE_FICLONE);
  return t;
}
function countFiles(d) { let n = 0; for (const c of d.children) n += c.t === 'd' ? countFiles(c) : 1; return n; }

function init({ ipcMain, dialog, shell, app, getWin, log: lg }) {
  cfgFile = path.join(app.getPath('userData'), 'cw.json');
  keysFile = path.join(app.getPath('userData'), 'rpfkeys.bin');
  keysMeta = path.join(app.getPath('userData'), 'rpfkeys.json');
  log = lg || (() => {});
  appRef = app;
  send = (ch, m) => { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send(ch, m); };
  load();
  app.on('before-quit', () => { dropAll(); cleanDrag(0); });
  cleanDrag(0);

  const fail = (ch, e) => { const m = String(e && e.message || e); if (!/^(not-found|bad-path|no-game|not-dir|not-file|exists|bad-name|ysc|is-dir|no-keys|not-rpf|too-big|root|busy|cancel|keys-missing|keys-magic|no-magic|no-conv|xml-unsupported|xml-fail|model-fail|model-empty|not-text|text-big|pack-big|names-overflow|ytd-unsupported|ytd-dup|ytd-gone|ytd-name|ytd-conv|ytd-too-big|ytd-dds-format|ytd-dds-kind|dds-bad|xml-no-tex|already-enc|enc-data|enc-verify|ng-rename|bad-rpf|onyx-win|onyx-missing|onyx-keys|onyx-fail|onyx-still)$/.test(m)) log(ch + ' ' + (e && e.stack || e)); const out = { ok: false, error: /^[a-z-]+$/.test(m) ? m : 'fail' }; if (e && e.why) out.why = String(e.why).slice(0, 200); return out; };
  const wrap = (ch, fn) => ipcMain.handle(ch, async (_e, ...a) => { try { return await fn(...a); } catch (e) { return fail(ch, e); } });
  const lock = async (name, fn) => {
    if (busy) throw new Error('busy');
    busy = name; push();
    try { return await fn(); } finally { busy = ''; push(); }
  };

  // Перетаскивание наружу: файл (или папка) извлекается во временную папку и отдаётся системе как копия.
  ipcMain.on('cw:drag-out', (ev, vp) => {
    try {
      if (busy) return;
      if (!gameKind(st.game)) return;
      const { nativeImage } = require('electron');
      let icon = nativeImage.createFromPath(path.join(__dirname, 'src', 'icon.png'));
      if (!icon.isEmpty()) icon = icon.resize({ width: 32, height: 32 });
      // настоящий .rpf из папки игры: отдаём сам файл (копия делается Проводником, ничего не извлекаем и не лимитируем)
      const parts = cleanParts(str(vp));
      let fsp = st.game;
      for (let i = 0; i < parts.length; i++) {
        const next = path.join(fsp, parts[i]);
        let s2; try { s2 = fs.statSync(next); } catch (e) { return; }
        if (s2.isDirectory()) { fsp = next; continue; }
        if (i === parts.length - 1 && /\.rpf$/i.test(parts[i])) { cleanDrag(60 * 60 * 1000); ev.sender.startDrag({ file: dragCopyOf(next), icon }); return; }
        break;
      }
      const r = resolve(str(vp), true);
      if (r.kind !== 'entry' && r.kind !== 'dir') return;
      if (r.kind === 'entry' && r.entry.t === 'd') return;
      cleanDrag(60 * 60 * 1000);
      fs.mkdirSync(dragRoot(), { recursive: true });
      const dir = fs.mkdtempSync(path.join(dragRoot(), 'd-'));
      let target;
      if (r.kind === 'entry') { target = path.join(dir, safeName(r.entry.name)); fs.writeFileSync(target, r.arch.exportStd(r.entry)); }
      else { extractTo(r, dir, () => {}); target = path.join(dir, safeName(r.entry.name)); }
      ev.sender.startDrag({ file: target, icon });
    } catch (e) { log('cw:drag-out ' + (e && e.stack || e)); }
  });

  ipcMain.on('cw:focus', (ev) => { try { ev.sender.focus(); } catch (e) { /* окно закрыто */ } });

  wrap('cw:status', () => statusObj());

  wrap('cw:detect-game', async () => {
    const list = await detectGame();
    if (list.length && !gameKind(st.game)) { st.game = list[0].path; st.gen9 = list[0].kind === 'enhanced'; save(); }
    return { ok: true, list, status: statusObj() };
  });
  wrap('cw:pick-game', async (lb) => {
    const r = await dialog.showOpenDialog(getWin(), { title: str(lb && lb.title).slice(0, 120) || undefined, properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false, error: 'cancel' };
    if (!gameKind(r.filePaths[0])) return { ok: false, error: 'not-game' };
    dropAll(); resetKeys(); idx = { state: 'none', done: 0, total: 0, P: [], PL: [], S: [], F: [] };
    st.game = r.filePaths[0]; st.gen9 = gameKind(st.game) === 'enhanced'; save();
    return { ok: true, status: statusObj() };
  });
  wrap('cw:set-game', (p) => {
    p = str(p);
    if (!gameKind(p)) return { ok: false, error: 'not-game' };
    if (p !== st.game) { dropAll(); resetKeys(); idx = { state: 'none', done: 0, total: 0, P: [], PL: [], S: [], F: [] }; st.game = p; st.gen9 = gameKind(p) === 'enhanced'; save(); }
    return { ok: true, status: statusObj() };
  });
  wrap('cw:keys', async () => { await ensureKeys(); return { ok: true, status: statusObj() }; });
  wrap('cw:index', async (force) => { if (force) idx.state = 'none'; buildIndex(); return { ok: true, status: statusObj() }; });
  wrap('cw:ls', (vp) => Object.assign({ ok: true }, listDir(vp)));
  wrap('cw:search', (q) => Object.assign({ ok: true }, search(q, 400)));
  wrap('cw:preview', (vp, lim) => Object.assign({ ok: true }, preview(vp, Number(lim) || 0)));
  wrap('cw:model', (vp, which, lod) => {
    const r = resolve(vp, true), e = r.entry;
    if (r.kind !== 'entry' || e.t !== 'r') throw new Error('not-file');
    const ext = (e.name.split('.').pop() || '').toLowerCase();
    if (!/^(ydr|ydd|yft)$/.test(ext)) throw new Error('not-file');
    const M = require('./drawable'), TXM = require('./tex');
    let items; try { items = M.readModel(ext, r.arch.extract(e), e.sys, e.gfx, r.arch.header(e).readUInt32LE(4)); } catch (x) { log('model ' + e.name + ' ' + (x && x.stack || x)); const er = new Error('model-fail'); er.why = String(x && x.message || x); throw er; }
    if (!items.length) { const er = new Error('model-fail'); er.why = 'empty-list'; throw er; }
    const why = (x) => x.err || (x.d && x.d.notes && x.d.notes.length ? x.d.notes.join(', ') : '');
    const isEmpty = (x) => !x.d || !Object.keys(x.d.lods).length;
    const w = Number(which), multi = items.length > 1;
    const all = w === -1 && multi;
    let k = 0;
    if (!all) {
      if (w === -2 || !multi) { k = items.findIndex((x) => !isEmpty(x)); if (k < 0) k = 0; }
      else k = Math.max(0, Math.min(items.length - 1, w || 0));
    }
    const pick = all ? items.map((x, i) => i).filter((i) => !isEmpty(items[i])) : [k];
    if (!pick.length || (!all && isEmpty(items[k]))) {
      const er = new Error(all || !multi ? 'model-fail' : 'model-empty'); er.why = pick.length ? why(items[k]) : (items.map(why).find(Boolean) || 'no-geometry');
      log('model ' + e.name + ' ' + er.message + ' ' + er.why); throw er;
    }
    const order = ['high', 'med', 'low', 'vlow'], lodSet = new Set(); pick.forEach((i) => Object.keys(items[i].d.lods).forEach((l) => lodSet.add(l)));
    const lods = order.filter((l) => lodSet.has(l)), use = lods.includes(lod) ? lod : lods[0];
    // внешние словари текстур рядом с моделью (имя.ytd, имя без _hi, имя_hi)
    const ext2 = [];
    try {
      const baseName = e.name.replace(/\.[^.]+$/, '').toLowerCase(), cand = new Set([baseName, baseName.replace(/_hi$/, ''), baseName.replace(/_hi$/, '') + '_hi']);
      for (const c of e.parent ? e.parent.children : []) {
        if (c.t !== 'r' || !/\.ytd$/i.test(c.name) || !cand.has(c.name.toLowerCase().replace(/\.ytd$/, '')) || r.arch.stored(c) > 96 * 1024 * 1024) continue;
        try { ext2.push(TXM.readYtd(r.arch.extract(c), c.sys, c.gfx)); } catch (x) { /* не Gen8 */ }
        if (ext2.length >= 3) break;
      }
    } catch (x) { /* без внешних текстур */ }
    // меши выбранных объектов и материалы, которые они реально используют
    const meshes = {}, usedOf = {};
    for (const i of pick) {
      const d = items[i].d, m = M.mesh(d, lods.includes(use) && d.lods[use] ? use : null);
      if (!m) continue; meshes[i] = m; usedOf[i] = new Set(m.groups.map((g) => g.m));
    }
    const cache = new Map();
    const texOf = () => { const o = {}; for (const i of pick) if (meshes[i]) o[i] = M.materialTextures(items[i].d, ext2, 1024, usedOf[i], cache); return o; };
    const missingOf = (t) => { const out = []; for (const i of pick) if (t[i]) t[i].forEach((x, j) => { if (usedOf[i].has(j) && x.name && !x.png && !x.bc7) out.push(x.name); }); return out; };
    let tx = texOf(), miss = missingOf(tx);
    // не нашли по имени файла: перебираем соседние .ytd (до 40 штук, не крупнее 16 МБ) и берём те, где есть нужные имена текстур
    if (miss.length && e.parent) {
      try {
        const need = new Set(miss.map((n) => n.toLowerCase())); let tried = 0;
        for (const c of e.parent.children) {
          if (tried >= 40 || !need.size) break;
          if (c.t !== 'r' || !/\.ytd$/i.test(c.name) || r.arch.stored(c) > 16 * 1024 * 1024 || ext2.some((x) => x.srcName === c.name)) continue;
          tried++;
          try { const dd = TXM.readYtd(r.arch.extract(c), c.sys, c.gfx); if (dd.textures.some((t) => need.has(t.name.toLowerCase()))) { dd.srcName = c.name; ext2.push(dd); dd.textures.forEach((t) => need.delete(t.name.toLowerCase())); } } catch (x) { /* не Gen8 */ }
        }
        tx = texOf(); miss = missingOf(tx);
      } catch (x) { /* без внешних текстур */ }
    }
    // общий список материалов (одинаковые текстуры из внешних словарей не дублируются)
    const mats = [], keyIdx = new Map(), remaps = {};
    for (const i of pick) {
      if (!meshes[i]) continue;
      const hasOwn = !!items[i].d.dict; remaps[i] = tx[i].map((t, j) => {
        if (!usedOf[i].has(j) || !t.name) { const kk = 'blank'; if (!keyIdx.has(kk)) { keyIdx.set(kk, mats.length); mats.push({ name: '' }); } return keyIdx.get(kk); }
        const kk = (hasOwn ? 'o' + i : 'x') + ':' + t.name.toLowerCase();
        if (!keyIdx.has(kk)) { keyIdx.set(kk, mats.length); mats.push(t); }
        return keyIdx.get(kk);
      });
    }
    let m, tris;
    if (all) { m = M.meshAll(items.map((x, i) => (meshes[i] ? x : { d: null })), lods.includes(use) ? use : null, remaps); }
    else { const g = meshes[k]; m = g ? { pos: g.pos, uv: g.uv, col: g.col, nrm: g.nrm, idx: g.idx, groups: g.groups.map((x) => ({ s: x.s, c: x.c, m: remaps[k][x.m] !== undefined ? remaps[k][x.m] : -1 })) } : null; }
    if (!m) throw new Error('model-fail');
    tris = m.idx.length / 3;
    if (tris > 5000000) throw new Error('too-big');
    // вложенные в модель текстуры (ShaderGroup.TextureDictionary): миниатюры и пометка «используется материалом»
    const usedNames = new Set(); pick.forEach((i) => { if (tx[i]) tx[i].forEach((t, j) => { if (usedOf[i] && usedOf[i].has(j) && t.name) usedNames.add(t.name.toLowerCase()); }); });
    const embedded = [], seenE = new Set();
    for (const i of pick) {
      const dd = items[i].d.dict; if (!dd) continue;
      for (const t of dd.textures) {
        const kk = t.name.toLowerCase(); if (seenE.has(kk)) continue; seenE.add(kk);
        const info = { name: t.name, width: t.width, height: t.height, levels: t.levels, format: TXM.FMT[t.format] || ('0x' + t.format.toString(16)), used: usedNames.has(kk) };
        try { const p = TXM.payload(t, dd.G, 160); if (p) { if (p.png) info.png = p.png; if (p.bc7) info.bc7 = p.bc7; info.pw = p.w; info.ph = p.h; } } catch (x) { /* без миниатюры */ }
        embedded.push(info);
      }
    }
    const missing = [...new Set(miss)];
    const small = m.pos.length / 3 < 65536;
    const ib = small ? Buffer.from(Uint16Array.from(m.idx).buffer) : Buffer.from(m.idx.buffer, m.idx.byteOffset, m.idx.byteLength);
    const bc = (f) => Buffer.from(f.buffer, f.byteOffset, f.byteLength).toString('base64');
    const bi = pick.find((i) => items[i].d.bones), first = items[bi !== undefined ? bi : pick[0]].d, d0 = items[pick[0]].d;
    const objInfo = items.map((x, i) => ({ name: x.name, empty: isEmpty(x), why: why(x), tris: all ? (m.objs[i] ? m.objs[i].tris : 0) : (i === k ? tris : 0) }));
    return { ok: true, objects: items.map((x) => x.name), objInfo, index: all ? -1 : k, lods, lod: use, tris, verts: m.pos.length / 3, bbMin: d0.bbMin, bbMax: d0.bbMax,
      pos: bc(m.pos), uv: bc(m.uv), col: m.col ? bc(m.col) : null, nrm: m.nrm ? bc(m.nrm) : null, idx: ib.toString('base64'), idx16: small, groups: m.groups, mats, bones: first.bones, embedded, missing };
  });
  wrap('cw:model-tex', async (vp, which, name, dim, exportDds) => {
    const r = resolve(vp, true), e = r.entry;
    if (r.kind !== 'entry' || e.t !== 'r') throw new Error('not-file');
    const ext = (e.name.split('.').pop() || '').toLowerCase();
    if (!/^(ydr|ydd|yft)$/.test(ext)) throw new Error('not-file');
    const M = require('./drawable'), TXM = require('./tex');
    let items; try { items = M.readModel(ext, r.arch.extract(e), e.sys, e.gfx, r.arch.header(e).readUInt32LE(4)); } catch (x) { throw new Error('model-fail'); }
    const w = Number(which), low = str(name).toLowerCase(), pool = w === -1 ? items : [items[Math.max(0, Math.min(items.length - 1, w || 0))]];
    let d = null, t = null;
    for (const it of pool) { if (!it || !it.d || !it.d.dict) continue; const f = it.d.dict.textures.find((x) => x.name.toLowerCase() === low); if (f) { d = it.d; t = f; break; } }
    if (!d || !t || !TXM.FMT[t.format] || t.dataOff < 0) throw new Error('not-found');
    if (exportDds) {
      const Y = require('./ytd'), levels = t.levels || 1, len = Y.chainSize(t.format, t.width, t.height, levels);
      if (t.dataOff + len > d.dict.G.length) throw new Error('not-found');
      const o = await dialog.showSaveDialog(getWin(), { defaultPath: safeName(t.name) + '.dds', filters: [{ name: 'DDS', extensions: ['dds'] }] });
      if (o.canceled || !o.filePath) return { ok: false, error: 'cancel' };
      fs.writeFileSync(o.filePath, Y.toDds({ width: t.width, height: t.height, levels, format: t.format, data: Buffer.from(d.dict.G.subarray(t.dataOff, t.dataOff + len)) }));
      return { ok: true };
    }
    const p = TXM.payload(t, d.dict.G, Number(dim) || 1024);
    if (!p) throw new Error('not-found');
    return Object.assign({ ok: true, width: t.width, height: t.height, levels: t.levels }, p);
  });
  wrap('cw:reveal', () => { if (gameKind(st.game)) shell.openPath(st.game); return { ok: true }; });

  wrap('cw:extract', async (vp) => {
    const r = resolve(vp, true);
    if (r.kind === 'rpffile') {
      const d = await dialog.showSaveDialog(getWin(), { defaultPath: path.basename(r.fs) });
      if (d.canceled || !d.filePath) return { ok: false, error: 'cancel' };
      fs.copyFileSync(r.fs, d.filePath); return { ok: true };
    }
    if (r.kind !== 'entry' || r.entry.t === 'd') throw new Error('not-file');
    const d = await dialog.showSaveDialog(getWin(), { defaultPath: safeName(r.entry.name) });
    if (d.canceled || !d.filePath) return { ok: false, error: 'cancel' };
    fs.writeFileSync(d.filePath, r.arch.exportStd(r.entry));
    return { ok: true };
  });
  wrap('cw:extract-dir', async (vp) => {
    const r = resolve(vp);
    if (r.kind !== 'arch' && r.kind !== 'dir') throw new Error('not-dir');
    const d = await dialog.showOpenDialog(getWin(), { properties: ['openDirectory', 'createDirectory'] });
    if (d.canceled || !d.filePaths || !d.filePaths[0]) return { ok: false, error: 'cancel' };
    return lock('extract', async () => {
      const total = countFiles(r.entry); let n = 0, last = 0;
      extractTo(r, d.filePaths[0], () => { n++; const t = Date.now(); if (t - last > 300) { last = t; send('cw:progress', { k: 'extract', p: total ? n / total : 1, n, total }); } });
      send('cw:progress', { k: 'extract', p: 1, n, total });
      return { ok: true, count: n, dir: d.filePaths[0] };
    });
  });

  // ----- правки -----
  const doOp = (name, vp, asEntry, build) => lock(name, async () => {
    const r = resolve(vp, asEntry);
    if (!r.top) throw new Error('not-found');
    const k = await ensureKeys().catch(() => null);
    const op = build(r);
    op.top = r.top; op.chain = r.chain || [];
    dropTop(r.top);
    try { await R.runOpWorker(op, k, (m) => { if (m.t === 'p') send('cw:progress', { k: 'op', p: m.p }); }); }
    finally { dropTop(r.top); }
    const rel = path.relative(st.game, r.top).split(path.sep).join('/');
    buildIndex(rel);
    return { ok: true };
  });
  const pickFiles = async (multi) => {
    const d = await dialog.showOpenDialog(getWin(), { properties: multi ? ['openFile', 'multiSelections'] : ['openFile'] });
    return d.canceled ? [] : (d.filePaths || []);
  };
  const okFile = (p) => typeof p === 'string' && path.isAbsolute(p) && isFile(p);

  wrap('cw:replace', async (vp, file) => {
    const f = file ? str(file) : (await pickFiles(false))[0];
    if (!f) return { ok: false, error: 'cancel' };
    if (!okFile(f)) throw new Error('not-found');
    return doOp('replace', vp, true, (r) => { if (r.kind !== 'entry') throw new Error('not-file'); return { kind: 'replace', seg: r.seg, file: f }; });
  });
  wrap('cw:add', async (vp, files) => {
    let list = Array.isArray(files) ? files.map(str).filter(Boolean) : [];
    if (!list.length) list = await pickFiles(true);
    if (!list.length) return { ok: false, error: 'cancel' };
    if (list.length > 500 || !list.every(okFile)) throw new Error('not-found');
    return doOp('add', vp, false, (r) => { if (r.kind !== 'arch' && r.kind !== 'dir') throw new Error('not-dir'); return { kind: 'add', seg: r.kind === 'arch' ? [] : r.seg, files: list.map((p) => ({ path: p, name: path.basename(p) })) }; });
  });
  wrap('cw:mkdir', (vp, name) => doOp('mkdir', vp, false, (r) => { if (r.kind !== 'arch' && r.kind !== 'dir') throw new Error('not-dir'); return { kind: 'mkdir', seg: r.kind === 'arch' ? [] : r.seg, name: str(name) }; }));
  wrap('cw:delete', (vp) => doOp('delete', vp, true, (r) => { if (r.kind !== 'entry' && r.kind !== 'dir') throw new Error('not-found'); return { kind: 'delete', seg: r.seg }; }));
  wrap('cw:export-xml', async (vp) => {
    const r = resolve(vp, true);
    if (r.kind !== 'entry' || r.entry.t === 'd') throw new Error('not-file');
    if (!convExe()) throw new Error('no-conv');
    if (!XML_EXT.test(r.entry.name)) throw new Error('xml-unsupported');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
    try {
      const inD = path.join(dir, 'in'), outD = path.join(dir, 'out');
      fs.mkdirSync(inD); fs.mkdirSync(outD);
      const inF = path.join(inD, safeName(r.entry.name)), outF = path.join(outD, 'out.xml');
      fs.writeFileSync(inF, r.arch.exportForConv(r.entry));
      const nn = await runConv(['export', inF, safeName(r.entry.name), outF]).catch((x) => { convDbg(r, inF); throw x; });
      let dn = safeName(path.basename(String(nn || '').split(/\r?\n/)[0] || ''));
      if (!/\.xml$/i.test(dn)) dn = safeName(r.entry.name) + '.xml';
      const d = await dialog.showSaveDialog(getWin(), { defaultPath: dn, filters: [{ name: 'XML', extensions: ['xml'] }] });
      if (d.canceled || !d.filePath) return { ok: false, error: 'cancel' };
      fs.copyFileSync(outF, d.filePath);
      // конвертер кладёт DDS-текстуры в подпапку рядом с XML; переносим её к выбранному XML под именем XML (так её найдёт импорт)
      let textures = 0, folder = '';
      const subs = fs.readdirSync(outD, { withFileTypes: true }).filter((e) => e.isDirectory());
      if (subs.length) {
        folder = xmlStem(path.basename(d.filePath)) || xmlStem(r.entry.name);
        const dest = path.join(path.dirname(d.filePath), folder);
        fs.mkdirSync(dest, { recursive: true });
        for (const sd of subs) await fs.promises.cp(path.join(outD, sd.name), dest, { recursive: true, force: true });
        textures = countFilesDeep(dest);
      }
      return { ok: true, textures, folder };
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
  });
  // пакетный экспорт в XML: одна папка назначения на все файлы; каждый XML + папка с его текстурами (имя папки = имя XML без расширений)
  wrap('cw:export-xml-batch', async (list) => {
    const paths = Array.isArray(list) ? list.map(str).filter(Boolean) : [];
    if (!paths.length) throw new Error('not-found');
    if (!convExe()) throw new Error('no-conv');
    const d = await dialog.showOpenDialog(getWin(), { properties: ['openDirectory', 'createDirectory'] });
    const dest = d.canceled ? '' : (d.filePaths || [])[0];
    if (!dest) return { ok: false, error: 'cancel' };
    const used = new Set(), failed = [], skipped = [];
    let done = 0, textures = 0;
    busy = 'xml'; push();
    try {
      for (let i = 0; i < paths.length; i++) {
        const label = path.basename(paths[i]);
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
        try {
          const r = resolve(paths[i], true);
          if (r.kind !== 'entry' || r.entry.t === 'd' || !XML_EXT.test(r.entry.name)) { skipped.push(label); continue; }
          if (r.entry.t !== 'r' && looksText(r.arch.extract(r.entry))) { skipped.push(label); continue; }
          const inD = path.join(tmp, 'in'), outD = path.join(tmp, 'out');
          fs.mkdirSync(inD); fs.mkdirSync(outD);
          const inF = path.join(inD, safeName(r.entry.name)), outF = path.join(outD, 'out.xml');
          fs.writeFileSync(inF, r.arch.exportForConv(r.entry));
          const nn = await runConv(['export', inF, safeName(r.entry.name), outF]).catch((x) => { convDbg(r, inF); throw x; });
          let dn = safeName(path.basename(String(nn || '').split(/\r?\n/)[0] || ''));
          if (!/\.xml$/i.test(dn)) dn = safeName(r.entry.name) + '.xml';
          let fn = dn, k = 1;
          while (used.has(fn.toLowerCase())) fn = dn.replace(/\.xml$/i, '') + '_' + (k++) + '.xml';
          used.add(fn.toLowerCase());
          fs.copyFileSync(outF, path.join(dest, fn));
          const subs = fs.readdirSync(outD, { withFileTypes: true }).filter((e) => e.isDirectory());
          if (subs.length) {
            const tf = path.join(dest, xmlStem(fn) || xmlStem(r.entry.name));
            fs.mkdirSync(tf, { recursive: true });
            for (const sd of subs) await fs.promises.cp(path.join(outD, sd.name), tf, { recursive: true, force: true });
            textures += countFilesDeep(tf);
          }
          done++;
        } catch (e) { failed.push(label); log('cw:export-xml-batch ' + label + ': ' + (e && e.message)); }
        finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* временная папка */ } send('cw:progress', { k: 'xml', p: (i + 1) / paths.length }); }
      }
    } finally { busy = ''; push(); }
    return { ok: true, done, textures, failed, skipped, dest };
  });
  wrap('cw:import-xml', async (vp, file) => {
    const r = resolve(vp, true);
    if (r.kind !== 'entry' || r.entry.t === 'd') throw new Error('not-file');
    if (!convExe()) throw new Error('no-conv');
    if (!XML_EXT.test(r.entry.name)) throw new Error('xml-unsupported');
    const name = safeName(r.entry.name);
    let f = file ? str(file) : '';
    if (!f) { const d = await dialog.showOpenDialog(getWin(), { properties: ['openFile'], filters: [{ name: 'XML', extensions: ['xml'] }] }); f = d.canceled ? '' : (d.filePaths || [])[0]; }
    if (!f) return { ok: false, error: 'cancel' };
    if (!okFile(f)) throw new Error('not-found');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
    try {
      const outF = path.join(dir, name);
      busy = 'xml'; push();
      let cname = name;
      const xb = path.basename(f);
      if (/\.(pso|rbf)\.xml$/i.test(xb)) cname = xb.slice(0, -4);
      else if (r.entry.t === 'b') {
        try { const hd = r.arch.extract(r.entry).subarray(0, 4).toString('latin1'); if (hd === 'PSIN') cname = name + '.pso'; else if (hd === 'RBF0') cname = name + '.rbf'; } catch (x) { /* имя по умолчанию */ }
      }
      try { await runImport(f, cname, outF); } finally { busy = ''; push(); }
      return await doOp('replace', vp, true, (rr) => { if (rr.kind !== 'entry') throw new Error('not-file'); return { kind: 'replace', seg: rr.seg, file: outF }; });
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
  });
  // можно ли экспортировать файл в XML (ресурс из списка либо двоичный meta/pso/rbf/awc/..., не обычный текст)
  wrap('cw:xml-can', (vp) => {
    const r = resolve(vp, true), e = r.entry;
    if (r.kind !== 'entry' || e.t === 'd' || !XML_EXT.test(e.name)) return { ok: true, can: false };
    if (e.t === 'r') return { ok: true, can: true };
    return { ok: true, can: !looksText(r.arch.extract(e)) };
  });
  // импорт XML-файлов в папку (как «Import XML» в CodeWalker): x.ydr.xml -> x.ydr, x.meta.pso.xml -> x.meta; существующие файлы заменяются
  wrap('cw:import-xml-files', async (vp, files) => {
    const r0 = resolve(vp, false);
    if (r0.kind !== 'arch' && r0.kind !== 'dir') throw new Error('not-dir');
    if (!convExe()) throw new Error('no-conv');
    let list = Array.isArray(files) ? files.map(str).filter(Boolean) : [];
    if (!list.length) {
      const d = await dialog.showOpenDialog(getWin(), { properties: ['openFile', 'multiSelections'], filters: [{ name: 'XML', extensions: ['xml'] }] });
      list = d.canceled ? [] : (d.filePaths || []);
    }
    if (!list.length) return { ok: false, error: 'cancel' };
    if (!list.every(okFile)) throw new Error('not-found');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
    const out = [], failed = [];
    try {
      busy = 'xml'; push();
      try {
        let n = 0;
        for (const f of list) {
          const xb = path.basename(f);
          if (!/\.xml$/i.test(xb)) { failed.push(xb); continue; }
          const stem = xb.slice(0, -4);
          const target = safeName(stem.replace(/\.(pso|rbf)$/i, ''));
          if (!target || /\.ysc$/i.test(target)) { failed.push(xb); continue; }
          const outF = path.join(dir, (n++) + '_' + target);
          try { await runImport(f, stem, outF); out.push({ path: outF, name: target }); } catch (e) { failed.push(xb); }
        }
      } finally { busy = ''; push(); }
      if (!out.length) throw new Error('xml-unsupported');
      const res = await doOp('add', vp, false, (rr) => { if (rr.kind !== 'arch' && rr.kind !== 'dir') throw new Error('not-dir'); return { kind: 'add', seg: rr.kind === 'arch' ? [] : rr.seg, files: out }; });
      return Object.assign({}, res, { done: out.length, failed });
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
  });
  // новый RPF: пустой или собранный из папки; в папке игры лежит файлом, внутри архива добавляется вложенным
  wrap('cw:rpf-new', async (vp, name, pack) => {
    const r = resolve(vp, false);
    if (r.kind !== 'fsdir' && r.kind !== 'arch' && r.kind !== 'dir') throw new Error('not-dir');
    let srcDir = '';
    if (pack) {
      const d = await dialog.showOpenDialog(getWin(), { properties: ['openDirectory'] });
      srcDir = d.canceled ? '' : (d.filePaths || [])[0] || '';
      if (!srcDir) return { ok: false, error: 'cancel' };
      if (!isDir(srcDir)) throw new Error('not-found');
    }
    let nm = safeName(str(name).trim() || (srcDir ? path.basename(srcDir) : ''));
    if (!nm || nm === '.' || nm === '..') throw new Error('bad-name');
    if (!/\.rpf$/i.test(nm)) nm += '.rpf';
    if (nm.length > 200) throw new Error('bad-name');
    const prog = (m) => { if (m.t === 'p') send('cw:progress', { k: 'op', p: m.p }); };
    if (r.kind === 'fsdir') {
      const dest = path.join(r.fs, nm);
      if (fs.existsSync(dest)) throw new Error('exists');
      return lock('rpf-new', async () => {
        const res = await R.runOpWorker({ kind: 'create', out: dest, dir: srcDir }, null, prog);
        buildIndex(path.relative(st.game, dest).split(path.sep).join('/'));
        return { ok: true, name: nm, files: res.files, skipped: res.skipped };
      });
    }
    if (r.entry.children.some((c) => c.name.toLowerCase() === nm.toLowerCase())) throw new Error('exists');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
    try {
      const tmpF = path.join(dir, nm);
      busy = 'rpf'; push();
      let res;
      try { res = await R.runOpWorker({ kind: 'create', out: tmpF, dir: srcDir }, null, prog); } finally { busy = ''; push(); }
      await doOp('add', vp, false, (rr) => { if (rr.kind !== 'arch' && rr.kind !== 'dir') throw new Error('not-dir'); return { kind: 'add', seg: rr.kind === 'arch' ? [] : rr.seg, files: [{ path: tmpF, name: nm }] }; });
      return { ok: true, name: nm, files: res.files, skipped: res.skipped };
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
  });
  // перетаскивание с рабочего стола в обычную папку игры (не в архив): файлы и папки копируются как есть
  wrap('cw:fs-copy', async (vp, files, overwrite) => {
    const r = resolve(vp, false);
    if (r.kind !== 'fsdir') throw new Error('not-dir');
    let list = (Array.isArray(files) ? files : []).map(str).filter(Boolean);
    if (!list.length) list = await pickFiles(true);
    if (!list.length) return { ok: false, error: 'cancel' };
    if (!list.every((f) => okFile(f) || isDir(f))) throw new Error('not-found');
    const same = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
    const jobs = list.map((f) => ({ src: f, dest: path.join(r.fs, path.basename(f)) })).filter((j) => !same(j.src, j.dest));
    for (const j of jobs) if (isDir(j.src) && (path.resolve(j.dest) + path.sep).toLowerCase().startsWith((path.resolve(j.src) + path.sep).toLowerCase())) throw new Error('bad-path');
    const ex = jobs.filter((j) => fs.existsSync(j.dest)).map((j) => path.basename(j.dest));
    if (ex.length && !overwrite) return { ok: false, error: 'exists', names: ex, paths: list };
    return lock('fs-copy', async () => {
      if (ex.length) dropAll();
      let n = 0;
      for (const j of jobs) {
        const dir = isDir(j.src);
        if (dir) await fs.promises.cp(j.src, j.dest, { recursive: true, force: true });
        else await fs.promises.copyFile(j.src, j.dest);
        n++;
        if (!dir && /\.rpf$/i.test(j.dest)) { try { buildIndex(path.relative(st.game, j.dest).split(path.sep).join('/')); } catch (e) { /* индекс обновится при переиндексации */ } }
      }
      return { ok: true, done: n };
    });
  });
  // ----- настоящие файлы в папке игры: показать в Проводнике, переименовать, удалить (в Корзину) -----
  const fsPath = (vp) => {
    if (!gameKind(st.game)) throw new Error('no-game');
    const parts = cleanParts(str(vp));
    if (!parts.length) throw new Error('bad-path');
    const abs = path.join(st.game, ...parts), rel = path.relative(st.game, abs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('bad-path');
    if (!fs.existsSync(abs)) throw new Error('not-found');
    for (let i = 1; i < parts.length; i++) if (!isDir(path.join(st.game, ...parts.slice(0, i)))) throw new Error('not-file');
    return { abs, rel: rel.split(path.sep).join('/'), dir: isDir(abs) };
  };
  wrap('cw:fs-op', async (op, vp, name) => {
    const f = fsPath(vp);
    if (op === 'reveal') { if (f.dir) shell.openPath(f.abs); else shell.showItemInFolder(f.abs); return { ok: true }; }
    if (f.dir || !/\.rpf$/i.test(f.abs)) throw new Error('not-file');
    return lock('fs-op', async () => {
      dropAll();
      if (op === 'delete') { await shell.trashItem(f.abs); dropTopIndex(f.rel); return { ok: true }; }
      if (op === 'rename') {
        const raw = str(name).trim();
        if (!raw || raw === '.' || raw === '..') throw new Error('bad-name');
        let nm = safeName(raw);
        if (!/\.rpf$/i.test(nm)) nm += '.rpf';
        if (nm.length > 200) throw new Error('bad-name');
        const dest = path.join(path.dirname(f.abs), nm);
        if (dest !== f.abs) { // NG-шифрование привязано к имени файла: после переименования архив перестанет открываться
          let h = Buffer.alloc(16); try { const fd = fs.openSync(f.abs, 'r'); try { fs.readSync(fd, h, 0, 16, 0); } finally { fs.closeSync(fd); } } catch (e) { /* нет доступа */ }
          if (h.readUInt32LE(0) === 0x52504637 && h.readUInt32LE(12) === 0x0FEFFFFF) throw new Error('ng-rename');
        }
        if (fs.existsSync(dest) && dest.toLowerCase() !== f.abs.toLowerCase()) throw new Error('exists');
        fs.renameSync(f.abs, dest);
        dropTopIndex(f.rel);
        buildIndex(path.relative(st.game, dest).split(path.sep).join('/'));
        return { ok: true, name: nm };
      }
      throw new Error('not-found');
    });
  });

  // ----- редактор текстур .ytd (Gen8): сессия в памяти, запись одним replace -----
  const ytdSess = new Map(); let ytdSeq = 0;
  const TCF = { DXT1: 'BC1_UNORM', DXT3: 'BC2_UNORM', DXT5: 'BC3_UNORM', BC7: 'BC7_UNORM', A8R8G8B8: 'B8G8R8A8_UNORM' };
  const IMG_EXT = /\.(dds|png|jpe?g|bmp|tga|tiff?)$/i;
  const texconvExe = () => {
    if (!WIN || !appRef) return '';
    const p = appRef.isPackaged ? path.join(process.resourcesPath, 'bin', 'texconv.exe') : path.join(__dirname, 'bin', 'texconv.exe');
    return isFile(p) ? p : '';
  };
  async function ytdImage(file, fmt) {
    const Y = require('./ytd');
    if (/\.dds$/i.test(file)) return Y.parseDds(fs.readFileSync(file));
    const exe = texconvExe();
    if (!exe) throw new Error('no-conv');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
    try {
      await new Promise((res, rej) => execFile(exe, ['-nologo', '-y', '-m', '0', '-f', TCF[fmt] || 'BC3_UNORM', '-ft', 'dds', '-o', dir, file],
        { windowsHide: true, timeout: 30 * 60 * 1000, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' },
        (e, so, se) => { if (e) { log('texconv: ' + String(se || so || e.message).slice(0, 400)); rej(new Error('ytd-conv')); } else res(); }));
      const out = path.join(dir, path.basename(file, path.extname(file)) + '.dds');
      if (!isFile(out)) throw new Error('ytd-conv');
      return Y.parseDds(fs.readFileSync(out));
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
  }
  async function pickImages(files) {
    let list = Array.isArray(files) ? files.map(str).filter(Boolean) : [];
    if (!list.length) {
      const d = await dialog.showOpenDialog(getWin(), { properties: ['openFile', 'multiSelections'], filters: [{ name: 'DDS / PNG / JPG / BMP / TGA / TIFF', extensions: ['dds', 'png', 'jpg', 'jpeg', 'bmp', 'tga', 'tif', 'tiff'] }] });
      list = d.canceled ? [] : (d.filePaths || []);
    }
    return list.filter((f) => IMG_EXT.test(f) && okFile(f));
  }
  wrap('cw:ytd', async (op, a, b, c, d) => {
    const Y = require('./ytd');
    if (op === 'open') {
      const r = resolve(str(a), true), e = r.entry;
      if (r.kind !== 'entry' || e.t !== 'r' || !/\.ytd$/i.test(e.name)) throw new Error('not-file');
      let s; try { s = Y.parse(r.arch.extract(e), e.sys, e.gfx); } catch (x) { throw new Error('ytd-unsupported'); }
      s.vp = str(a); s.name = e.name;
      for (const k of [...ytdSess.keys()].slice(0, Math.max(0, ytdSess.size - 3))) ytdSess.delete(k);
      const sid = ++ytdSeq; ytdSess.set(sid, s);
      return { ok: true, sid, list: Y.thumbs(s) };
    }
    const s = ytdSess.get(Number(a));
    if (!s) throw new Error('ytd-gone');
    const idx = Number(b), tex = s.textures[idx];
    if (op === 'close') { ytdSess.delete(Number(a)); return { ok: true }; }
    if (op === 'add') {
      const files = await pickImages(b);
      if (!files.length) return { ok: false, error: 'cancel' };
      const added = [], skipped = [], failed = [];
      for (const f of files) {
        const nm = path.basename(f, path.extname(f));
        try { Y.addTex(s, nm, await ytdImage(f, str(c))); added.push(nm); }
        catch (e) { const m = String(e && e.message); if (m === 'ytd-dup') skipped.push(nm); else failed.push({ name: nm, error: /^[a-z-]+$/.test(m) ? m : 'fail' }); if (!/^(ytd-|dds-|no-conv)/.test(m)) log('ytd add ' + (e && e.stack || e)); }
      }
      return { ok: true, list: Y.thumbs(s), added, skipped, failed };
    }
    if (op === 'save') {
      const out = Y.build(s);
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
      try {
        const f = path.join(dir, safeName(s.name));
        fs.writeFileSync(f, out.file);
        const res = await doOp('replace', s.vp, true, (rr) => { if (rr.kind !== 'entry') throw new Error('not-file'); return { kind: 'replace', seg: rr.seg, file: f }; });
        if (res && res.ok) { s.sys = out.sys; s.gfx = out.gfx; }
        return res;
      } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
    }
    if (!tex) throw new Error('not-found');
    if (op === 'replace') {
      const files = await pickImages(c ? [c] : null);
      if (!files.length) return { ok: false, error: 'cancel' };
      Y.applyTex(tex, await ytdImage(files[0], str(d)));
      return { ok: true, list: Y.thumbs(s) };
    }
    if (op === 'remove') { s.textures.splice(idx, 1); return { ok: true, list: Y.thumbs(s) }; }
    if (op === 'rename') { Y.renameTex(s, idx, str(c)); return { ok: true, list: Y.thumbs(s) }; }
    if (op === 'export') {
      const o = await dialog.showSaveDialog(getWin(), { defaultPath: safeName(tex.name) + '.dds', filters: [{ name: 'DDS', extensions: ['dds'] }] });
      if (o.canceled || !o.filePath) return { ok: false, error: 'cancel' };
      fs.writeFileSync(o.filePath, Y.toDds(tex));
      return { ok: true };
    }
    throw new Error('not-found');
  });
  const textEntry = (vp) => {
    const r = resolve(vp, true);
    if (r.kind !== 'entry' || r.entry.t !== 'b' || !TEXT_EXT.test(r.entry.name)) throw new Error('not-file');
    return r;
  };
  wrap('cw:text-read', (vp) => {
    const r = textEntry(vp);
    const b = r.arch.extract(r.entry);
    const u16 = b.length >= 2 && b[0] === 0xFF && b[1] === 0xFE;
    if (!u16 && !looksText(b)) throw new Error('not-text');
    const d = decodeText(b);
    return { ok: true, text: d.text, enc: d.enc, eol: d.eol, mixed: d.mixed, size: b.length };
  });
  wrap('cw:text-save', async (vp, text, meta) => {
    if (typeof text !== 'string') throw new Error('bad-text');
    const r = textEntry(vp);
    const buf = encodeText(text, meta);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
    try {
      const f = path.join(dir, safeName(r.entry.name));
      fs.writeFileSync(f, buf);
      return await doOp('replace', vp, true, (rr) => { if (rr.kind !== 'entry') throw new Error('not-file'); return { kind: 'replace', seg: rr.seg, file: f }; });
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
  });
  // ymt/ytyp/ymap в текстовом редакторе: файл показывается как XML (mhconv export), при сохранении XML собирается обратно (mhconv import) и заменяет файл
  const CONV_TEXT = /\.(ymt|ytyp|ymap)$/i;
  const convEntry = (vp) => {
    const r = resolve(vp, true);
    if (r.kind !== 'entry' || r.entry.t === 'd' || !CONV_TEXT.test(r.entry.name)) throw new Error('not-file');
    return r;
  };
  wrap('cw:conv-read', async (vp) => {
    const r = convEntry(vp);
    const raw = r.entry.t === 'b' ? r.arch.extract(r.entry) : null;
    if (raw && looksText(raw)) { const d0 = decodeText(raw); return { ok: true, text: d0.text, enc: d0.enc, eol: d0.eol, mixed: d0.mixed, size: raw.length, xname: '' }; }
    if (!convExe()) throw new Error('no-conv');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
    try {
      const inD = path.join(dir, 'in'), outD = path.join(dir, 'out');
      fs.mkdirSync(inD); fs.mkdirSync(outD);
      const inF = path.join(inD, safeName(r.entry.name)), outF = path.join(outD, 'out.xml');
      fs.writeFileSync(inF, r.arch.exportForConv(r.entry));
      busy = 'xml'; push();
      let nn;
      try { nn = await runConv(['export', inF, safeName(r.entry.name), outF]); } catch (x) { convDbg(r, inF); throw x; } finally { busy = ''; push(); }
      let dn = safeName(path.basename(String(nn || '').split(/\r?\n/)[0] || ''));
      if (!/\.xml$/i.test(dn)) dn = safeName(r.entry.name) + '.xml';
      const b = fs.readFileSync(outF), d = decodeText(b);
      return { ok: true, text: d.text, enc: d.enc, eol: d.eol, mixed: d.mixed, size: b.length, xname: dn };
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
  });
  wrap('cw:conv-save', async (vp, text, meta, xname) => {
    if (typeof text !== 'string') throw new Error('bad-text');
    const r = convEntry(vp);
    const name = safeName(r.entry.name);
    const raw = r.entry.t === 'b' ? r.arch.extract(r.entry) : null;
    const plain = !!(raw && looksText(raw));
    if (!plain && !convExe()) throw new Error('no-conv');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-'));
    try {
      const outF = path.join(dir, name);
      if (plain) fs.writeFileSync(outF, encodeText(text, meta));
      else {
        const xb = safeName(path.basename(str(xname)));
        const xmlF = path.join(dir, /\.xml$/i.test(xb) ? xb : name + '.xml');
        fs.writeFileSync(xmlF, encodeText(text, meta));
        let cname = name;
        if (/\.(pso|rbf)\.xml$/i.test(xmlF)) cname = path.basename(xmlF).slice(0, -4);
        else if (r.entry.t === 'b') { const hd = raw.subarray(0, 4).toString('latin1'); if (hd === 'PSIN') cname = name + '.pso'; else if (hd === 'RBF0') cname = name + '.rbf'; }
        busy = 'xml'; push();
        try { await runImport(xmlF, cname, outF); } finally { busy = ''; push(); }
      }
      return await doOp('replace', vp, true, (rr) => { if (rr.kind !== 'entry') throw new Error('not-file'); return { kind: 'replace', seg: rr.seg, file: outF }; });
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* временная папка */ } }
  });
  wrap('cw:rename', (vp, name) => doOp('rename', vp, true, (r) => { if (r.kind !== 'entry' && r.kind !== 'dir') throw new Error('not-found'); return { kind: 'rename', seg: r.seg, name: str(name) }; }));
  wrap('cw:fix', (vp) => doOp('fix', vp, true, (r) => {
    // вложенный .rpf при asEntry приходит как entry (не arch): фиксим его по seg, настоящий .rpf/корень архива по []
    const nested = r.kind === 'entry' && r.entry && r.entry.t === 'b' && /\.rpf$/i.test(r.entry.name);
    if (r.kind !== 'rpffile' && r.kind !== 'arch' && !nested) throw new Error('not-found');
    let encData; try { encData = fs.readFileSync(path.join(__dirname, 'rpfenc.bin')); } catch (e) { throw new Error('enc-data'); }
    return { kind: 'fix', seg: nested ? r.seg : [], encData };
  }));
  // «Распечатать»: снять защиту ONYX с .rpf. Настоящий файл на диске: работаем на копии и подменяем оригинал; вложенный .rpf: достаём, снимаем, заменяем запись.
  wrap('cw:unseal', async (vp) => {
    if (!WIN) throw new Error('onyx-win');
    if (busy) throw new Error('busy');
    const r = resolve(vp, true);
    const nested = r.kind === 'entry' && r.entry && r.entry.t === 'b' && /\.rpf$/i.test(r.entry.name);
    if (r.kind !== 'rpffile' && !nested) throw new Error('not-rpf');
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mh_onyx_'));
    const wf = path.join(work, nested ? safeName(r.entry.name) : path.basename(r.top));
    const clean = () => { try { fs.rmSync(work, { recursive: true, force: true }); } catch (e) { /* временная папка */ } };
    let res;
    busy = 'onyx'; push();
    try {
      if (nested) fs.writeFileSync(wf, readEntry(r)); else fs.copyFileSync(r.top, wf);
      res = await runOnyx(wf);
      if (!res || !res.ok) { const er = new Error(res && res.error === 'keys' ? 'onyx-keys' : res && res.error === 'not-found' ? 'not-found' : 'onyx-fail'); if (res && res.message) er.why = res.message; throw er; }
      if (res.changed && res.stillProtected) throw new Error('onyx-still');
      if (res.changed && !nested) {
        dropTop(r.top);
        const tmp = r.top + '.mh_tmp';
        try { fs.copyFileSync(wf, tmp); fs.renameSync(tmp, r.top); } catch (e) { try { fs.rmSync(tmp, { force: true }); } catch (x) { /* нет файла */ } throw e; }
      }
    } catch (e) { clean(); throw e; } finally { busy = ''; push(); }
    try {
      if (res.changed && nested) await doOp('replace', vp, true, (rr) => { if (rr.kind !== 'entry') throw new Error('not-file'); return { kind: 'replace', seg: rr.seg, file: wf }; });
      else if (res.changed) buildIndex(path.relative(st.game, r.top).split(path.sep).join('/'));
    } finally { clean(); }
    return { ok: true, changed: !!res.changed, type: res.type || '' };
  });
  wrap('cw:compact', (vp) => doOp('compact', vp, true, (r) => { if (r.kind === 'rpffile' || r.kind === 'arch') return { kind: 'compact', seg: [] }; throw new Error('not-found'); }));
}

module.exports = { init, _t: { prepOnyx, runOnyx, setApp: (a) => { appRef = a; }, decodeText, encodeText, gameKind, exeOf, resolve, listDir, search, preview, getArch, cleanParts, setState: (o) => { st = Object.assign(st, o); }, setKeys: (k) => { keys = k; keysState = 'ready'; }, idx: () => idx, buildIndex, dropAll } };
