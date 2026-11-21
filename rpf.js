// Нативный движок RPF7 (GTA V) для Marly Helper: ключи из gta5.exe, чтение, извлечение, правка.
// Своя реализация формата (проверялась сверкой с оригинальным CodeWalker.Core на тестовых архивах).
// Шифрование: NONE/OPEN (без шифра), AES, NG. Правка: файл заменяется/добавляется/удаляется,
// архив с NG-шифром при правке сохраняется как OPEN (его принимает игра, NG-шифрование мы записать не умеем).
'use strict';
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const { Worker } = require('worker_threads');

const MAGIC = 0x52504637; // 'RPF7'
const ENC = { NONE: 0, OPEN: 0x4E45504F, AES: 0x0FFFFFF9, NG: 0x0FEFFFFF };
const DIRFLAG = 0x7FFFFF00;
const BLK = 512;

// ---------- хэш имён (joaat, нижний регистр) ----------
function joaat(s) {
  const b = Buffer.from(String(s).toLowerCase(), 'utf8');
  let h = 0;
  for (let i = 0; i < b.length; i++) { h = (h + b[i]) >>> 0; h = (h + (h << 10)) >>> 0; h = (h ^ (h >>> 6)) >>> 0; }
  h = (h + (h << 3)) >>> 0; h = (h ^ (h >>> 11)) >>> 0; h = (h + (h << 15)) >>> 0;
  return h >>> 0;
}
// Хэш имени для выбора NG-ключа: как GTA5Hash.CalculateHash (через таблицу LUT из exe).
function lutHash(lut, s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (c > 255) throw new Error('bad-name'); const t = Math.imul(1025, (lut[c] + h) >>> 0) >>> 0; h = ((t >>> 6) ^ t) >>> 0; }
  const a = Math.imul(9, h) >>> 0;
  return Math.imul(32769, ((a >>> 11) ^ a) >>> 0) >>> 0;
}

// ---------- ключи ----------
class Keys {
  constructor(aes, ng, tbl, lut) {
    this.aes = aes;              // Buffer(32)
    this.lut = lut;              // Buffer(256), таблица символов для хэша имён
    this.ng = ng;                // Buffer(272)[101]
    this.tbl = tbl;              // Uint32Array(17*16*256)
    this._kw = new Map();
  }
  kw(i) {
    let k = this._kw.get(i);
    if (!k) { const b = this.ng[i]; k = new Uint32Array(68); for (let j = 0; j < 68; j++) k[j] = b.readUInt32LE(j * 4); this._kw.set(i, k); }
    return k;
  }
  pack() {
    const tb = Buffer.alloc(this.tbl.length * 4); for (let i = 0; i < this.tbl.length; i++) tb.writeUInt32LE(this.tbl[i], i * 4);
    return Buffer.concat([Buffer.from('MHK2'), this.aes, this.lut, Buffer.concat(this.ng), tb]);
  }
  static unpack(buf) {
    if (!buf || buf.length !== 4 + 32 + 256 + 101 * 272 + 17 * 16 * 1024 || buf.toString('latin1', 0, 4) !== 'MHK2') throw new Error('keys-cache');
    let p = 4; const aes = Buffer.from(buf.subarray(p, p + 32)); p += 32;
    const lut = Buffer.from(buf.subarray(p, p + 256)); p += 256;
    const ng = []; for (let i = 0; i < 101; i++) { ng.push(Buffer.from(buf.subarray(p, p + 272))); p += 272; }
    const tbl = new Uint32Array(17 * 16 * 256); for (let i = 0; i < tbl.length; i++) tbl[i] = buf.readUInt32LE(p + i * 4);
    return new Keys(aes, ng, tbl, lut);
  }
}

// ---------- AES / NG ----------
let AES_ROUNDS = 1;
function aesDec(keys, data) {
  const n = data.length & ~15; if (!n) return Buffer.from(data);
  const d = crypto.createDecipheriv('aes-256-ecb', keys.aes, null); d.setAutoPadding(false);
  let cur = data.subarray(0, n);
  for (let r = 0; r < AES_ROUNDS; r++) cur = d.update(cur);
  return Buffer.concat([cur, data.subarray(n)]);
}
function aesEnc(keys, data) {
  const n = data.length & ~15; if (!n) return Buffer.from(data);
  const e = crypto.createCipheriv('aes-256-ecb', keys.aes, null); e.setAutoPadding(false);
  let cur = data.subarray(0, n);
  for (let r = 0; r < AES_ROUNDS; r++) cur = e.update(cur);
  return Buffer.concat([cur, data.subarray(n)]);
}
function ngIndex(keys, name, length) { return (((lutHash(keys.lut, name) + (length >>> 0) + 61) >>> 0) % 101); }
function ngDec(keys, data, name, length) {
  const T = keys.tbl, K = keys.kw(ngIndex(keys, name, length));
  const n = data.length >> 4, out = Buffer.from(data);
  for (let bi = 0; bi < n; bi++) {
    const o = bi * 16;
    let b0 = out[o], b1 = out[o + 1], b2 = out[o + 2], b3 = out[o + 3], b4 = out[o + 4], b5 = out[o + 5], b6 = out[o + 6], b7 = out[o + 7];
    let b8 = out[o + 8], b9 = out[o + 9], b10 = out[o + 10], b11 = out[o + 11], b12 = out[o + 12], b13 = out[o + 13], b14 = out[o + 14], b15 = out[o + 15];
    for (let r = 0; r < 17; r++) {
      const t = r * 4096, k = r * 4;
      let x0, x1, x2, x3;
      if (r === 0 || r === 1 || r === 16) {
        x0 = T[t + b0] ^ T[t + 256 + b1] ^ T[t + 512 + b2] ^ T[t + 768 + b3] ^ K[k];
        x1 = T[t + 1024 + b4] ^ T[t + 1280 + b5] ^ T[t + 1536 + b6] ^ T[t + 1792 + b7] ^ K[k + 1];
        x2 = T[t + 2048 + b8] ^ T[t + 2304 + b9] ^ T[t + 2560 + b10] ^ T[t + 2816 + b11] ^ K[k + 2];
        x3 = T[t + 3072 + b12] ^ T[t + 3328 + b13] ^ T[t + 3584 + b14] ^ T[t + 3840 + b15] ^ K[k + 3];
      } else {
        x0 = T[t + b0] ^ T[t + 1792 + b7] ^ T[t + 2560 + b10] ^ T[t + 3328 + b13] ^ K[k];
        x1 = T[t + 256 + b1] ^ T[t + 1024 + b4] ^ T[t + 2816 + b11] ^ T[t + 3584 + b14] ^ K[k + 1];
        x2 = T[t + 512 + b2] ^ T[t + 1280 + b5] ^ T[t + 2048 + b8] ^ T[t + 3840 + b15] ^ K[k + 2];
        x3 = T[t + 768 + b3] ^ T[t + 1536 + b6] ^ T[t + 2304 + b9] ^ T[t + 3072 + b12] ^ K[k + 3];
      }
      b0 = x0 & 255; b1 = (x0 >>> 8) & 255; b2 = (x0 >>> 16) & 255; b3 = x0 >>> 24;
      b4 = x1 & 255; b5 = (x1 >>> 8) & 255; b6 = (x1 >>> 16) & 255; b7 = x1 >>> 24;
      b8 = x2 & 255; b9 = (x2 >>> 8) & 255; b10 = (x2 >>> 16) & 255; b11 = x2 >>> 24;
      b12 = x3 & 255; b13 = (x3 >>> 8) & 255; b14 = (x3 >>> 16) & 255; b15 = x3 >>> 24;
    }
    out[o] = b0; out[o + 1] = b1; out[o + 2] = b2; out[o + 3] = b3; out[o + 4] = b4; out[o + 5] = b5; out[o + 6] = b6; out[o + 7] = b7;
    out[o + 8] = b8; out[o + 9] = b9; out[o + 10] = b10; out[o + 11] = b11; out[o + 12] = b12; out[o + 13] = b13; out[o + 14] = b14; out[o + 15] = b15;
  }
  return out;
}

// ---------- NG-шифрование (обратное к ngDec; алгоритм GTA5Crypto.Encrypt из RageLib, как в GTA5 Archive Fix) ----------
// Данные лежат в rpfenc.bin: 'MHE1' + deflateRaw( таблицы шифрования 17*16*256 uint32 | LUT раундов 2..15 ).
// LUT каждого (раунд, k): LUT0[256][256], LUT1[256][256], Indices[65536]; поиск: LUT0[LUT1[Indices[a]][b]][c], где a = старшие 16 бит, b и c = следующие байты слова.
let ENC_CACHE = null;
function loadEnc(raw) {
  if (ENC_CACHE) return ENC_CACHE;
  if (!raw) throw new Error('enc-data');
  const b = Buffer.from(raw.buffer ? Buffer.from(raw.buffer, raw.byteOffset, raw.length) : raw);
  if (b.length < 8 || b.toString('latin1', 0, 4) !== 'MHE1') throw new Error('enc-data');
  let body; try { body = zlib.inflateRawSync(b.subarray(4)); } catch (e) { throw new Error('enc-data'); }
  const TB = 17 * 16 * 1024;
  if (body.length !== TB + 14 * 16 * 196608) throw new Error('enc-data');
  const tbl = new Uint32Array(17 * 16 * 256);
  for (let i = 0; i < tbl.length; i++) tbl[i] = body.readUInt32LE(i * 4);
  ENC_CACHE = { tbl, lut: body.subarray(TB) };
  return ENC_CACHE;
}
const NG_B_SRC = [0, 4, 8, 12, 4, 8, 12, 0, 8, 12, 0, 4, 12, 0, 4, 8];
function ngEnc(keys, E, data, name, length) {
  const T = E.tbl, L = E.lut, K = keys.kw(ngIndex(keys, name, length));
  const n = data.length >> 4, out = Buffer.from(data);
  const d = new Uint8Array(16), v = new Uint8Array(16), x = new Uint32Array(4);
  const roundA = (t, ki) => {
    for (let w = 0; w < 4; w++) {
      const kw = K[ki + w], o = w * 4, to = t + o * 256;
      x[w] = T[to + (d[o] ^ (kw & 255))] ^ T[to + 256 + (d[o + 1] ^ ((kw >>> 8) & 255))] ^ T[to + 512 + (d[o + 2] ^ ((kw >>> 16) & 255))] ^ T[to + 768 + (d[o + 3] ^ (kw >>> 24))];
    }
    for (let w = 0; w < 4; w++) { const o = w * 4, y = x[w]; d[o] = y & 255; d[o + 1] = (y >>> 8) & 255; d[o + 2] = (y >>> 16) & 255; d[o + 3] = y >>> 24; }
  };
  const roundB = (r, ki) => {
    for (let w = 0; w < 4; w++) { const kw = K[ki + w], o = w * 4; v[o] = d[o] ^ (kw & 255); v[o + 1] = d[o + 1] ^ ((kw >>> 8) & 255); v[o + 2] = d[o + 2] ^ ((kw >>> 16) & 255); v[o + 3] = d[o + 3] ^ (kw >>> 24); }
    for (let k = 0; k < 16; k++) {
      const s = NG_B_SRC[k], base = ((r - 2) * 16 + k) * 196608;
      const idx = L[base + 131072 + ((v[s + 3] << 8) | v[s + 2])];
      d[k] = L[base + L[base + 65536 + idx * 256 + v[s + 1]] * 256 + v[s]];
    }
  };
  for (let bi = 0; bi < n; bi++) {
    const o = bi * 16;
    for (let i = 0; i < 16; i++) d[i] = out[o + i];
    roundA(16 * 4096, 64);
    for (let r = 15; r >= 2; r--) roundB(r, r * 4);
    roundA(4096, 4);
    roundA(0, 0);
    for (let i = 0; i < 16; i++) out[o + i] = d[i];
  }
  return out;
}
// Шифрует TOC (записи и имена по отдельности, как RageLib) у архива в состоянии OPEN. head = заголовок + TOC, totalLen = полный размер файла архива (от него зависит ключ).
function fixNgHead(keys, encRaw, head, name, totalLen) {
  if (!keys) throw new Error('no-keys');
  if (head.length < 16 || head.readUInt32LE(0) !== MAGIC) throw new Error('not-rpf');
  const enc = head.readUInt32LE(12);
  if (enc !== ENC.OPEN && enc !== ENC.NONE) throw new Error('already-enc');
  const count = head.readUInt32LE(4), nl = head.readUInt32LE(8), eEnd = 16 + count * 16;
  if (count < 1 || count > 2000000 || nl > 64 * 1024 * 1024 || eEnd + nl > head.length) throw new Error('bad-rpf');
  const E = loadEnc(encRaw);
  const ent = head.subarray(16, eEnd), nam = head.subarray(eEnd, eEnd + nl);
  const eE = ngEnc(keys, E, ent, name, totalLen), nE = ngEnc(keys, E, nam, name, totalLen);
  // самопроверка: расшифровка обязана вернуть исходное (иначе не пишем ничего)
  if (!ngDec(keys, eE, name, totalLen).equals(ent) || !ngDec(keys, nE, name, totalLen).equals(nam)) throw new Error('enc-verify');
  const out = Buffer.from(head);
  eE.copy(out, 16); nE.copy(out, eEnd); out.writeUInt32LE(ENC.NG, 12);
  return out;
}
function fixNgBuffer(keys, encRaw, buf, name) {
  const h = fixNgHead(keys, encRaw, buf, name, buf.length);
  const out = Buffer.from(buf); h.copy(out, 0); return out;
}
// Настоящий файл .rpf на диске: шифруется на месте (меняются только TOC и поле шифрования).
function fixTopFile(top, keys, encRaw) {
  const fd = fs.openSync(top, 'r+');
  try {
    const size = fs.fstatSync(fd).size, h = Buffer.alloc(16);
    if (fs.readSync(fd, h, 0, 16, 0) !== 16 || h.readUInt32LE(0) !== MAGIC) throw new Error('not-rpf');
    if (h.readUInt32LE(12) !== ENC.OPEN && h.readUInt32LE(12) !== ENC.NONE) throw new Error('already-enc');
    const count = h.readUInt32LE(4), nl = h.readUInt32LE(8), hl = 16 + count * 16 + nl;
    if (count < 1 || count > 2000000 || nl > 64 * 1024 * 1024 || hl > size) throw new Error('bad-rpf');
    const head = Buffer.alloc(hl); let got = 0;
    while (got < hl) { const k = fs.readSync(fd, head, got, hl - got, got); if (!k) break; got += k; }
    if (got !== hl) throw new Error('bad-rpf');
    const out = fixNgHead(keys, encRaw, head, require('path').basename(top), size);
    fs.writeSync(fd, out, 16, hl - 16, 16);
    fs.writeSync(fd, out, 12, 4, 12);
    try { fs.fsyncSync(fd); } catch (e) { /* не критично */ }
  } finally { fs.closeSync(fd); }
}

// ---------- поиск ключей в gta5.exe (по SHA1-хэшам, как делает CodeWalker; окна по 8 байт) ----------
const WORKER_SRC = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs'), crypto = require('crypto');
const { exe, start, step, flags, ngH, tbH, aesH, lutH, aesOnly } = workerData;
const F = new Int32Array(flags.ctl), NGF = new Uint8Array(flags.ng), TBF = new Uint8Array(flags.tb);
const mk = (a) => { const m = new Map(); a.forEach((h, i) => m.set(Buffer.from(h, 'hex').toString('latin1'), i)); return m; };
const aesM = mk([aesH]), ngM = mk(ngH), tbM = mk(tbH), lutM = mk([lutH]);
const fd = fs.openSync(exe, 'r'), size = fs.fstatSync(fd).size, BL = 1048576, EXTRA = 1024;
const buf = Buffer.alloc(BL + EXTRA);
const sha = (b, o, l) => crypto.createHash('sha1').update(b.subarray(o, o + l)).digest('latin1');
const nBlocks = Math.ceil(size / BL);
for (let k = start; k < nBlocks; k += step) {
  if (Atomics.load(F, 3)) break;
  const needA = !Atomics.load(F, 0), needN = !aesOnly && Atomics.load(F, 1) < ngH.length, needT = !aesOnly && Atomics.load(F, 2) < tbH.length, needL = !aesOnly && !Atomics.load(F, 4);
  if (!needA && !needN && !needT && !needL) break;
  const got = fs.readSync(fd, buf, 0, BL + EXTRA, k * BL);
  for (let j = 0; j < BL && k * BL + j < size; j += 8) {
    if (needA && j + 32 <= got) { const i = aesM.get(sha(buf, j, 32)); if (i !== undefined && !Atomics.load(F, 0)) { Atomics.store(F, 0, 1); parentPort.postMessage({ t: 'aes', d: Buffer.from(buf.subarray(j, j + 32)) }); } }
    if (needN && j + 272 <= got) { const i = ngM.get(sha(buf, j, 272)); if (i !== undefined && !NGF[i]) { NGF[i] = 1; Atomics.add(F, 1, 1); parentPort.postMessage({ t: 'ng', i, d: Buffer.from(buf.subarray(j, j + 272)) }); } }
    if (needL && j + 256 <= got) { const i = lutM.get(sha(buf, j, 256)); if (i !== undefined && !Atomics.load(F, 4)) { Atomics.store(F, 4, 1); parentPort.postMessage({ t: 'lut', d: Buffer.from(buf.subarray(j, j + 256)) }); } }
    if (needT && j + 1024 <= got) { const i = tbM.get(sha(buf, j, 1024)); if (i !== undefined && !TBF[i]) { TBF[i] = 1; Atomics.add(F, 2, 1); parentPort.postMessage({ t: 'tb', i, d: Buffer.from(buf.subarray(j, j + 1024)) }); } }
  }
  parentPort.postMessage({ t: 'p', n: 1 });
}
parentPort.postMessage({ t: 'done' });
`;

function scanKeys(exe, onProgress, hashes, aesOnly) {
  return new Promise((resolve, reject) => {
    let size; try { size = fs.statSync(exe).size; } catch (e) { return reject(new Error('no-exe')); }
    const H = hashes || require('./rpfhashes.json');
    const total = Math.ceil(size / 1048576);
    const ctl = new SharedArrayBuffer(32), ngb = new SharedArrayBuffer(H.ng.length), tbb = new SharedArrayBuffer(H.tables.length);
    const ctlv = new Int32Array(ctl);
    const nw = Math.max(1, Math.min(8, (require('os').cpus().length || 2) - 1));
    const res = { aes: null, lut: null, ng: new Array(H.ng.length).fill(null), tb: new Array(H.tables.length).fill(null) };
    let doneN = 0, blocks = 0, finished = false;
    const workers = [];
    const finish = (err) => {
      if (finished) return; finished = true;
      Atomics.store(ctlv, 3, 1);
      workers.forEach((w) => { try { w.terminate(); } catch (e) { /* ok */ } });
      if (err) return reject(err);
      if (aesOnly) return res.aes ? resolve(res.aes) : reject(Object.assign(new Error('keys-missing'), { found: { aes: false, ng: 0, tb: 0 } }));
      const nNg = res.ng.filter(Boolean).length, nTb = res.tb.filter(Boolean).length;
      if (!res.aes || !res.lut || nNg < H.ng.length || nTb < H.tables.length) return reject(Object.assign(new Error('keys-missing'), { found: { aes: !!res.aes, lut: !!res.lut, ng: nNg, tb: nTb } }));
      const tbl = new Uint32Array(17 * 16 * 256);
      for (let i = 0; i < res.tb.length; i++) for (let j = 0; j < 256; j++) tbl[i * 256 + j] = res.tb[i].readUInt32LE(j * 4);
      resolve(new Keys(res.aes, res.ng, tbl, res.lut));
    };
    for (let w = 0; w < nw; w++) {
      const wk = new Worker(WORKER_SRC, { eval: true, workerData: { exe, start: w, step: nw, flags: { ctl, ng: ngb, tb: tbb }, ngH: H.ng, tbH: H.tables, aesH: H.aes, lutH: H.lut, aesOnly: !!aesOnly } });
      workers.push(wk);
      wk.on('message', (m) => {
        if (m.t === 'aes') res.aes = Buffer.from(m.d);
        else if (m.t === 'lut') res.lut = Buffer.from(m.d);
        else if (m.t === 'ng') res.ng[m.i] = Buffer.from(m.d);
        else if (m.t === 'tb') res.tb[m.i] = Buffer.from(m.d);
        else if (m.t === 'p') { blocks += m.n; if (onProgress) onProgress(Math.min(1, blocks / total)); }
        else if (m.t === 'done') { doneN++; if (doneN === nw) finish(); }
        if (aesOnly ? res.aes : (res.aes && res.lut && res.ng.every(Boolean) && res.tb.every(Boolean))) finish();
      });
      wk.on('error', (e) => finish(e));
    }
  });
}


// ---------- ключи как у CodeWalker: в exe ищется только AES-ключ, остальное (NG-ключи, таблицы, LUT) лежит в блоке magic.dat ----------
// Блок зашифрован AES-ключом из exe и «посыпан» псевдослучайными байтами .NET Random (зерно = joaat от AES-ключа).
function jenkBytes(b) { let h = 0; for (let i = 0; i < b.length; i++) { h = (h + b[i]) >>> 0; h = (h + (h << 10)) >>> 0; h = (h ^ (h >>> 6)) >>> 0; } h = (h + (h << 3)) >>> 0; h = (h ^ (h >>> 11)) >>> 0; h = (h + (h << 15)) >>> 0; return h >>> 0; }
// System.Random(seed) из .NET Framework (вычитающий генератор Кнута): нужны только последовательные NextBytes
function dotnetRandom(seed) {
  // все вычитания как в C# int: с «заворачиванием» через |0 (без этого на больших зёрнах байты расходятся)
  const MBIG = 2147483647, MSEED = 161803398, sa = new Array(56).fill(0);
  seed |= 0;
  const sub = seed === -2147483648 ? MBIG : Math.abs(seed);
  let mj = (MSEED - sub) | 0, mk = 1;
  sa[55] = mj;
  for (let i = 1; i < 55; i++) { const ii = (21 * i) % 55; sa[ii] = mk; mk = (mj - mk) | 0; if (mk < 0) mk = (mk + MBIG) | 0; mj = sa[ii]; }
  for (let k = 1; k < 5; k++) for (let i = 1; i < 56; i++) { sa[i] = (sa[i] - sa[1 + (i + 30) % 55]) | 0; if (sa[i] < 0) sa[i] = (sa[i] + MBIG) | 0; }
  let inext = 0, inextp = 21;
  const sample = () => {
    if (++inext >= 56) inext = 1; if (++inextp >= 56) inextp = 1;
    let v = (sa[inext] - sa[inextp]) | 0; if (v === MBIG) v--; if (v < 0) v = (v + MBIG) | 0; sa[inext] = v; return v;
  };
  return { nextBytes: (n) => { const b = Buffer.alloc(n); for (let i = 0; i < n; i++) b[i] = sample() & 255; return b; } };
}
function sha1hex(b) { return crypto.createHash('sha1').update(b).digest('hex'); }
// magic: содержимое rpfmagic.dat; hashes: rpfhashes.json (проверка результата по хэшам из CodeWalker)
function keysFromMagic(aesKey, magic, hashes) {
  const H = hashes || require('./rpfhashes.json');
  const rnd = dotnetRandom(jenkBytes(aesKey) | 0), n = magic.length;
  const rb = [rnd.nextBytes(n), rnd.nextBytes(n), rnd.nextBytes(n), rnd.nextBytes(n)];
  const db = Buffer.alloc(n);
  for (let i = 0; i < n; i++) db[i] = (magic[i] - rb[0][i] - rb[1][i] - rb[2][i] - rb[3][i]) & 255;
  const dec = aesDec({ aes: aesKey }, db);
  let b; try { b = zlib.inflateRawSync(dec); } catch (e) { throw Object.assign(new Error('keys-magic'), { found: { aes: true, ng: 0, tb: 0, stage: 'inflate' } }); }
  if (b.length < 27472 + 278528 + 256) throw Object.assign(new Error('keys-magic'), { found: { aes: true, ng: 0, tb: 0, stage: 'size ' + b.length } });
  const ng = []; for (let i = 0; i < 101; i++) ng.push(Buffer.from(b.subarray(i * 272, i * 272 + 272)));
  const tOff = 27472, tbl = new Uint32Array(17 * 16 * 256);
  for (let i = 0; i < tbl.length; i++) tbl[i] = b.readUInt32LE(tOff + i * 4);
  const lut = Buffer.from(b.subarray(27472 + 278528, 27472 + 278528 + 256));
  // проверка по хэшам CodeWalker: если ключ из exe не тот, всё развалится и мы это увидим
  let okNg = 0, okTb = 0;
  for (let i = 0; i < 101; i++) if (sha1hex(ng[i]) === H.ng[i]) okNg++;
  for (let i = 0; i < 272; i++) if (sha1hex(b.subarray(tOff + i * 1024, tOff + (i + 1) * 1024)) === H.tables[i]) okTb++;
  const okLut = sha1hex(lut) === H.lut;
  if (okNg !== 101 || okTb !== 272 || !okLut) throw Object.assign(new Error('keys-magic'), { found: { aes: true, ng: okNg, tb: okTb, lut: okLut, stage: 'hash' } });
  return new Keys(Buffer.from(aesKey), ng, tbl, lut);
}
// Полный путь: AES-ключ из exe (быстрый поиск) -> расшифровка magic -> проверка по хэшам
async function loadKeysFromExe(exe, onProgress, magicPath, hashes) {
  const aes = await scanKeys(exe, onProgress, hashes, true);
  let magic; try { magic = fs.readFileSync(magicPath || require('path').join(__dirname, 'rpfmagic.dat')); } catch (e) { throw new Error('no-magic'); }
  return keysFromMagic(aes, magic, hashes);
}

// ---------- источники данных ----------
class FileSrc {
  constructor(p) { this.p = p; this.fd = fs.openSync(p, 'r'); this.size = fs.fstatSync(this.fd).size; }
  read(pos, len) {
    const b = Buffer.alloc(len); let got = 0;
    while (got < len) { const n = fs.readSync(this.fd, b, got, len - got, pos + got); if (!n) break; got += n; }
    return got === len ? b : b.subarray(0, got);
  }
  close() { try { fs.closeSync(this.fd); } catch (e) { /* ok */ } }
}
class SubSrc {
  constructor(parent, off, size) { this.parent = parent; this.off = off; this.size = size; }
  read(pos, len) { if (pos >= this.size) return Buffer.alloc(0); return this.parent.read(this.off + pos, Math.min(len, this.size - pos)); }
  close() { /* родитель закроет сам */ }
}
class BufSrc {
  constructor(b) { this.b = b; this.size = b.length; }
  read(pos, len) { return this.b.subarray(pos, pos + len); }
  close() { /* нечего */ }
}

// ---------- архив ----------
const ci = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function inflateSafe(buf) { try { return zlib.inflateRawSync(buf); } catch (e) { return buf; } }

class Archive {
  constructor(src, name, keys) { this.src = src; this.name = name; this.keys = keys; this.root = null; this.enc = 0; this.count = 0; this.namesLen = 0; }
  load() {
    const h = this.src.read(0, 16);
    if (h.length < 16 || h.readUInt32LE(0) !== MAGIC) throw new Error('not-rpf');
    this.count = h.readUInt32LE(4); this.namesLen = h.readUInt32LE(8); this.enc = h.readUInt32LE(12);
    if (this.count > 2000000 || this.namesLen > 64 * 1024 * 1024) throw new Error('bad-rpf');
    let ent = this.src.read(16, this.count * 16), nam = this.src.read(16 + this.count * 16, this.namesLen);
    if (ent.length !== this.count * 16 || nam.length !== this.namesLen) throw new Error('bad-rpf');
    if (this.enc !== ENC.NONE && this.enc !== ENC.OPEN) {
      if (!this.keys) throw new Error('no-keys');
      if (this.enc === ENC.AES) { ent = aesDec(this.keys, ent); nam = aesDec(this.keys, nam); }
      else { ent = ngDec(this.keys, ent, this.name, this.src.size); nam = ngDec(this.keys, nam, this.name, this.src.size); }
    }
    const all = [];
    for (let i = 0; i < this.count; i++) {
      const o = i * 16, x = ent.readUInt32LE(o + 4);
      let e;
      if (x === DIRFLAG) {
        e = { t: 'd', nameOff: ent.readUInt32LE(o), idx: ent.readUInt32LE(o + 8), cnt: ent.readUInt32LE(o + 12), children: [] };
      } else if ((x & 0x80000000) === 0) {
        const lo = ent.readUInt32LE(o), hi = ent.readUInt32LE(o + 4);
        e = { t: 'b', nameOff: lo & 0xFFFF, size: (lo >>> 16) | ((hi & 0xFF) << 16), off: hi >>> 8 & 0xFFFFFF, usize: ent.readUInt32LE(o + 8), enc: ent.readUInt32LE(o + 12) === 1 ? 1 : 0 };
        if (ent.readUInt32LE(o + 12) > 1) throw new Error('bad-rpf');
      } else {
        e = { t: 'r', nameOff: ent.readUInt16LE(o), size: ent.readUIntLE(o + 2, 3), off: ent.readUIntLE(o + 5, 3) & 0x7FFFFF, sys: ent.readUInt32LE(o + 8), gfx: ent.readUInt32LE(o + 12) };
        if (e.size === 0xFFFFFF) {
          const hd = this.src.read(e.off * BLK, 16);
          e.sizeBig = true; e.size = (hd[7] | (hd[14] << 8) | (hd[5] << 16) | (hd[2] << 24)) >>> 0;
        }
      }
      let end = nam.indexOf(0, e.nameOff); if (end < 0) end = nam.length;
      e.name = nam.toString('utf8', e.nameOff, end).slice(0, 256);
      all.push(e);
    }
    if (!all.length || all[0].t !== 'd') throw new Error('bad-rpf');
    all[0].name = '';
    for (const e of all) {
      if (e.t !== 'd') continue;
      for (let j = 0; j < e.cnt; j++) { const c = all[e.idx + j]; if (!c) throw new Error('bad-rpf'); c.parent = e; e.children.push(c); }
    }
    this.root = all[0];
    return this;
  }
  get aes() { return this.enc === ENC.AES; }
  stored(e) { return e.t === 'b' ? (e.size > 0 ? e.size : e.usize) : e.size; }
  raw(e) { return this.src.read(e.off * BLK, this.stored(e)); }
  isYsc(e) { return e.t === 'r' && /\.ysc$/i.test(e.name); }
  // Содержимое файла как в CodeWalker: бинарный = данные, ресурс = данные без 16-байтного заголовка.
  extract(e) {
    if (e.t === 'd') throw new Error('is-dir');
    const raw = this.raw(e);
    if (e.t === 'b') {
      let d = raw;
      if (e.enc) { if (!this.keys) throw new Error('no-keys'); d = this.aes ? aesDec(this.keys, d) : ngDec(this.keys, d, e.name, e.usize); }
      if (e.size > 0) d = inflateSafe(d);
      return d;
    }
    let d = raw.subarray(16);
    if (this.isYsc(e)) { if (!this.keys) throw new Error('no-keys'); d = this.aes ? aesDec(this.keys, d) : ngDec(this.keys, d, e.name, e.size); }
    return inflateSafe(d);
  }
  header(e) {
    const h = this.src.read(e.off * BLK, 16);
    if (!e.sizeBig) return h;
    // у больших ресурсов часть заголовка занята размером: восстанавливаем из таблицы
    const o = Buffer.alloc(16); o.writeUInt32LE(0x37435352, 0); o.writeUInt32LE(h[4], 4); o.writeUInt32LE(e.sys >>> 0, 8); o.writeUInt32LE(e.gfx >>> 0, 12);
    return o;
  }
  // Заголовок RSC7 строго из таблицы архива (магия, версия, флаги страниц): для конвертера XML, который по магии решает «ресурс или бинарный файл».
  stdHeader(e) {
    const h = this.src.read(e.off * BLK, 16), o = Buffer.alloc(16);
    o.writeUInt32LE(0x37435352, 0); o.writeUInt32LE(e.sizeBig ? h[4] : (h.length >= 8 ? h.readUInt32LE(4) : 0), 4); o.writeUInt32LE(e.sys >>> 0, 8); o.writeUInt32LE(e.gfx >>> 0, 12);
    return o;
  }
  exportForConv(e) { const d = this.extract(e); return e.t === 'r' ? Buffer.concat([this.stdHeader(e), d]) : d; }
  // Файл целиком, как его сохраняют проводники: у ресурса впереди RSC7-заголовок.
  exportBytes(e) { const d = this.extract(e); return e.t === 'r' ? Buffer.concat([this.header(e), d]) : d; }
  // Файл «как у всех» (OpenIV, Texture Toolkit): у ресурса RSC7-заголовок + СЖАТЫЕ данные, как лежат в RPF. Для отдачи на диск / рабочий стол.
  exportStd(e) {
    if (e.t !== 'r') return this.extract(e);
    let d = this.raw(e).subarray(16);
    if (this.isYsc(e)) { if (!this.keys) throw new Error('no-keys'); d = this.aes ? aesDec(this.keys, d) : ngDec(this.keys, d, e.name, e.size); }
    return Buffer.concat([this.header(e), d]);
  }
  // Вложенный RPF: без копирования, если лежит как есть.
  child(e) {
    if (e.t !== 'b') throw new Error('not-rpf');
    let a;
    if (e.size === 0 && !e.enc) a = new Archive(new SubSrc(this.src, e.off * BLK, e.usize), e.name, this.keys);
    else a = new Archive(new BufSrc(this.extract(e)), e.name, this.keys);
    return a.load();
  }
  find(parts) {
    let cur = this.root;
    for (const p of parts) {
      if (!cur || cur.t !== 'd') return null;
      const l = p.toLowerCase();
      cur = cur.children.find((c) => c.name.toLowerCase() === l) || null;
    }
    return cur;
  }
  pathOf(e) { const a = []; for (let c = e; c && c.parent; c = c.parent) a.unshift(c.name); return a.join('/'); }
}

function sizeFromFlags(f) {
  f >>>= 0;
  const s = ((f >>> 27) & 1) + (((f >>> 26) & 1) << 1) + (((f >>> 25) & 1) << 2) + (((f >>> 24) & 1) << 3) + (((f >>> 17) & 0x7F) << 4) + (((f >>> 11) & 0x3F) << 5) + (((f >>> 7) & 0xF) << 6) + (((f >>> 5) & 3) << 7) + (((f >>> 4) & 1) << 8);
  return (0x200 << (f & 0xF)) * s;
}

// ---------- запись ----------
// Подготовка данных нового файла к хранению (как CreateFile у CodeWalker: RSC7 → ресурс, иначе бинарный со сжатием).
// Уровень сжатия по размеру: level 9 на десятках МБ считает минутами и «вешает» импорт.
const zlvl = (n) => (n > 16 * 1048576 ? 4 : n > 4 * 1048576 ? 6 : 9);
function prepare(name, data) {
  if (data.length >= 16 && data.readUInt32LE(0) === 0x37435352 && !/\.rpf$/i.test(name)) {
    const hd = data.subarray(0, 16), body = data.subarray(16);
    let packed = false; try { zlib.inflateRawSync(body); packed = true; } catch (e) { /* данные не сжаты */ }
    let st;
    if (packed) st = Buffer.from(data);
    else { const comp = zlib.deflateRawSync(body, { level: zlvl(body.length) }); st = Buffer.concat([hd, comp.length < body.length ? comp : body]); }
    const big = st.length >= 0xFFFFFF;
    // Ресурс от 16 МБ: в таблице 0xFFFFFF, а настоящий размер прячется в байтах 2, 5, 7, 14 заголовка (как у CodeWalker).
    if (big) { const n = st.length; st[2] = (n >>> 24) & 255; st[5] = (n >>> 16) & 255; st[7] = n & 255; st[14] = (n >>> 8) & 255; }
    return { t: 'r', stored: st, size: st.length, sizeBig: big, sys: hd.readUInt32LE(8), gfx: hd.readUInt32LE(12) };
  }
  if (/\.rpf$/i.test(name) || data.length === 0) return { t: 'b', stored: data, size: 0, usize: data.length, enc: 0 };
  const comp = zlib.deflateRawSync(data, { level: zlvl(data.length) });
  if (comp.length < data.length * 0.97 && comp.length < 0xFFFFFF) return { t: 'b', stored: comp, size: comp.length, usize: data.length, enc: 0 };
  return { t: 'b', stored: data, size: 0, usize: data.length, enc: 0 };
}

// Порядок записей и таблица: как EnsureAllEntries (корень, затем стек каталогов, имена по ordinal).
function layout(root) {
  const all = [root], stack = [root];
  while (stack.length) {
    const d = stack.pop();
    const kids = d.children.slice().sort((a, b) => ci(a.name, b.name));
    d.idx = all.length; d.cnt = kids.length; d.sorted = kids;
    for (const k of kids) { all.push(k); if (k.t === 'd') stack.push(k); }
  }
  return all;
}
function encodeTOC(all, enc, keys) {
  const names = []; let nlen = 0; const map = new Map();
  const nameOf = (s) => { if (map.has(s)) return map.get(s); const b = Buffer.from(s, 'utf8'); const o = nlen; names.push(b, Buffer.from([0])); nlen += b.length + 1; map.set(s, o); return o; };
  nameOf('');
  const ent = Buffer.alloc(all.length * 16);
  all.forEach((e, i) => {
    const o = i * 16, no = nameOf(e.name);
    if (e.t === 'd') { ent.writeUInt32LE(no, o); ent.writeUInt32LE(DIRFLAG, o + 4); ent.writeUInt32LE(e.idx, o + 8); ent.writeUInt32LE(e.cnt, o + 12); return; }
    if (no > 0xFFFF) throw new Error('names-overflow');
    if (e.t === 'b') {
      ent.writeUInt16LE(no, o); ent.writeUIntLE(e.size, o + 2, 3); ent.writeUIntLE(e.off, o + 5, 3);
      ent.writeUInt32LE(e.usize >>> 0, o + 8); ent.writeUInt32LE(e.enc ? 1 : 0, o + 12);
    } else {
      ent.writeUInt16LE(no, o); ent.writeUIntLE(e.sizeBig || e.size >= 0xFFFFFF ? 0xFFFFFF : e.size, o + 2, 3); ent.writeUIntLE((e.off | 0x800000) >>> 0, o + 5, 3);
      ent.writeUInt32LE(e.sys >>> 0, o + 8); ent.writeUInt32LE(e.gfx >>> 0, o + 12);
    }
  });
  let nb = Buffer.concat(names); const pad = (16 - (nb.length % 16)) % 16; if (pad) nb = Buffer.concat([nb, Buffer.alloc(pad)]);
  let eb = ent;
  if (enc === ENC.AES) { eb = aesEnc(keys, eb); nb = aesEnc(keys, nb); }
  const hd = Buffer.alloc(16); hd.writeUInt32LE(MAGIC, 0); hd.writeUInt32LE(all.length, 4); hd.writeUInt32LE(nb.length, 8); hd.writeUInt32LE(enc >>> 0, 12);
  return Buffer.concat([hd, eb, nb]);
}
const blocks = (n) => Math.ceil(n / BLK);

// Правки дерева. Данные нового файла лежат в e.pending (результат prepare), пока архив не записан.
function setPending(arch, e, data) {
  if (e.t !== 'd' && e.off !== undefined && !e.isNew) e.oldBlocks = blocks(arch.stored(e));
  e.pending = prepare(e.name, data);
}
function addFile(arch, dir, name, data) {
  checkName(name);
  if (dir.children.some((c) => c.name.toLowerCase() === name.toLowerCase())) throw new Error('exists');
  const e = { t: 'b', name, parent: dir, isNew: true, size: 0, usize: 0, enc: 0, off: 0 };
  setPending(arch, e, data); dir.children.push(e); return e;
}
function addDir(dir, name) {
  checkName(name);
  if (dir.children.some((c) => c.name.toLowerCase() === name.toLowerCase())) throw new Error('exists');
  const e = { t: 'd', name, parent: dir, children: [] }; dir.children.push(e); return e;
}
function removeEntry(e) { if (!e.parent) throw new Error('root'); e.parent.children.splice(e.parent.children.indexOf(e), 1); }
function renameEntry(arch, e, name) {
  checkName(name);
  if (e.t === 'b' && /\.rpf$/i.test(e.name) && !e.enc && !e.size) { // NG-ключ зависит от имени архива: после переименования он перестанет открываться
    try { const h = arch.src.read(e.off * BLK, 16); if (h.length >= 16 && h.readUInt32LE(0) === MAGIC && h.readUInt32LE(12) === ENC.NG) throw new Error('ng-rename'); }
    catch (x) { if (x.message === 'ng-rename') throw x; }
  }
  if (!e.parent) throw new Error('root');
  if (e.parent.children.some((c) => c !== e && c.name.toLowerCase() === name.toLowerCase())) throw new Error('exists');
  if (e.t === 'd') { e.name = name; return; }
  // у файла с шифрованием ключ зависит от имени: переписываем данные открытыми
  if ((e.t === 'b' && e.enc) || arch.isYsc(e)) { if (arch.isYsc(e) || /\.ysc$/i.test(name)) throw new Error('ysc'); const d = arch.extract(e); e.name = name; setPending(arch, e, d); return; }
  e.name = name;
}
function checkName(n) { if (!n || n.length > 200 || /[\\/:*?"<>|\x00-\x1f]/.test(n) || n === '.' || n === '..') throw new Error('bad-name'); }

function copyRange(src, pos, len, fd, outPos) {
  const CH = 1 << 20; let done = 0;
  while (done < len) {
    const n = Math.min(CH, len - done), b = src.read(pos + done, n);
    if (b.length !== n) throw new Error('short-read');
    fs.writeSync(fd, b, 0, n, outPos + done); done += n;
  }
}
function zeros(fd, pos, len) { if (len > 0) fs.writeSync(fd, Buffer.alloc(len), 0, len, pos); }
function encOut(arch) { return arch.enc === ENC.AES ? ENC.AES : arch.enc === ENC.NONE ? ENC.NONE : ENC.OPEN; }
function applyPending(e, p, off) {
  e.t = p.t; e.off = off; e.size = p.size; delete e.sizeBig; if (p.sizeBig) e.sizeBig = true;
  if (p.t === 'b') { e.usize = p.usize; e.enc = 0; delete e.sys; delete e.gfx; } else { e.sys = p.sys; e.gfx = p.gfx; delete e.usize; delete e.enc; }
}
function finishPending(e) { delete e.pending; delete e.oldBlocks; delete e.isNew; }

// Запись «на месте»: таблица перезаписывается, новые данные дописываются в конец (или ложатся на место старых, если влезают).
// Возвращает {needRebuild:true}, если таблица выросла и не помещается перед первыми данными.
function commitInPlace(arch, filePath) {
  const all = layout(arch.root), files = all.filter((e) => e.t !== 'd');
  const fd = fs.openSync(filePath, 'r+');
  try {
    let end = blocks(fs.fstatSync(fd).size), minOff = end;
    const plan = [];
    for (const e of files) {
      if (!e.pending) { if (e.off < minOff) minOff = e.off; continue; }
      const nb = Math.max(1, blocks(e.pending.stored.length));
      let off;
      if (e.oldBlocks !== undefined && e.oldBlocks >= nb) off = e.off; else { off = end; end += nb; }
      if (off < minOff) minOff = off;
      plan.push([e, off, nb]);
    }
    const saved = plan.map(([e]) => ({ e, v: Object.assign({}, e) }));
    plan.forEach(([e, off]) => applyPending(e, e.pending, off));
    const toc = encodeTOC(all, encOut(arch), arch.keys);
    if (blocks(toc.length) > minOff) { saved.forEach(({ e, v }) => { for (const k of Object.keys(e)) delete e[k]; Object.assign(e, v); }); return { needRebuild: true }; }
    for (const [e, off, nb] of plan) {
      const st = e.pending.stored; fs.writeSync(fd, st, 0, st.length, off * BLK);
      zeros(fd, off * BLK + st.length, nb * BLK - st.length);
    }
    fs.writeSync(fd, toc, 0, toc.length, 0);
    plan.forEach(([e]) => finishPending(e));
    return { ok: true };
  } finally { fs.closeSync(fd); }
}

// Полная пересборка в новый файл outPath (данные неизменённых файлов копируются как есть).
function commitRebuild(arch, outPath, onProgress) {
  const all = layout(arch.root), files = all.filter((e) => e.t !== 'd');
  const old = files.filter((e) => !e.pending).sort((a, b) => a.off - b.off), nw = files.filter((e) => e.pending);
  const enc = encOut(arch);
  const hdBlocks = blocks(encodeTOC(all, enc, arch.keys).length);
  const fd = fs.openSync(outPath, 'w');
  try {
    let cur = hdBlocks; zeros(fd, 0, hdBlocks * BLK);
    const srcOf = new Map();
    let done = 0;
    for (const e of old) {
      const len = arch.stored(e), nb = Math.max(1, blocks(len));
      copyRange(arch.src, e.off * BLK, len, fd, cur * BLK); zeros(fd, cur * BLK + len, nb * BLK - len);
      srcOf.set(e, cur); cur += nb; done++; if (onProgress && !(done & 63)) onProgress(done / files.length);
    }
    for (const e of nw) {
      const st = e.pending.stored, nb = Math.max(1, blocks(st.length));
      fs.writeSync(fd, st, 0, st.length, cur * BLK); zeros(fd, cur * BLK + st.length, nb * BLK - st.length);
      srcOf.set(e, cur); cur += nb;
    }
    for (const e of old) e.off = srcOf.get(e);
    for (const e of nw) { applyPending(e, e.pending, srcOf.get(e)); }
    const toc = encodeTOC(all, enc, arch.keys);
    if (blocks(toc.length) > hdBlocks) throw new Error('toc-size');
    fs.writeSync(fd, toc, 0, toc.length, 0);
    for (const e of nw) finishPending(e);
    return { ok: true, size: cur * BLK };
  } finally { fs.closeSync(fd); }
}

// Главная точка входа правки: top = путь к настоящему .rpf, chain = [[части пути к вложенному .rpf], ...].
// mutate(arch) меняет дерево самого глубокого архива. Результат записывается снизу вверх.
function modify(top, chain, keys, mutate, opts) {
  opts = opts || {};
  const src = new FileSrc(top);
  let result;
  try {
    const arches = [new Archive(src, require('path').basename(top), keys).load()], ents = [];
    for (const parts of chain) {
      const cur = arches[arches.length - 1], e = cur.find(parts);
      if (!e || e.t !== 'b') throw new Error('not-found');
      ents.push(e); arches.push(cur.child(e));
    }
    result = mutate(arches[arches.length - 1]);
    for (let i = arches.length - 1; i >= 1; i--) {
      const tmp = top + '.mh' + i + '.tmp';
      try {
        commitRebuild(arches[i], tmp);
        let buf = fs.readFileSync(tmp); const parent = arches[i - 1], e = ents[i - 1];
        // режим «пофиксить»: целевой вложенный архив шифруется в NG, а родители, которые были NG, остаются NG (иначе правка превратила бы их в OPEN)
        if (opts.ng && ((i === arches.length - 1 && opts.fixLast) || arches[i].enc === ENC.NG)) buf = fixNgBuffer(keys, opts.ng, buf, e.name);
        e.oldBlocks = blocks(parent.stored(e)); e.pending = { t: 'b', stored: buf, size: 0, usize: buf.length, enc: 0 };
      } finally { try { fs.unlinkSync(tmp); } catch (x) { /* нет файла */ } }
    }
    const root = arches[0];
    const r = opts.compact ? { needRebuild: true } : commitInPlace(root, top);
    if (r.needRebuild) {
      const tmp = top + '.mh.tmp';
      try { commitRebuild(root, tmp, opts.onProgress); src.close(); fs.renameSync(tmp, top); }
      catch (x) { try { fs.unlinkSync(tmp); } catch (y) { /* нет файла */ } throw x; }
    }
    if (opts.ng && arches[0].enc === ENC.NG) { src.close(); fixTopFile(top, keys, opts.ng); }
  } finally { src.close(); }
  return result;
}

// ---------- операции (то, что выполняется в воркере, чтобы окно не зависало) ----------
function indexAll(op, keys, emit) {
  const path = require('path');
  let batch = [], total = 0;
  const push = (vp, size, flag) => { batch.push([vp, size, flag]); total++; if (batch.length >= 4000) { emit({ t: 'items', list: batch }); batch = []; } };
  const walk = (arch, prefix) => {
    const rec = (d, pre) => {
      for (const c of d.children) {
        const vp = pre + '/' + c.name;
        if (c.t === 'd') { push(vp, 0, 1); rec(c, vp); continue; }
        const isRpf = c.t === 'b' && /\.rpf$/i.test(c.name);
        push(vp, c.t === 'b' ? c.usize : sizeFromFlags(c.sys) + sizeFromFlags(c.gfx), isRpf ? 2 : 0);
        if (isRpf) { try { walk(arch.child(c), vp); } catch (e) { push(vp + '/<' + (e && e.message || 'error') + '>', 0, 3); } }
      }
    };
    rec(arch.root, prefix);
  };
  op.tops.forEach((t, i) => {
    let src;
    try { src = new FileSrc(path.join(op.root, t)); const a = new Archive(src, path.basename(t), keys).load(); push(t, src.size, 2); walk(a, t); }
    catch (e) { push(t, 0, 3); }
    finally { if (src) src.close(); }
    if (!(i & 7)) emit({ t: 'p', done: i + 1, total: op.tops.length });
  });
  if (batch.length) emit({ t: 'items', list: batch });
  return { total };
}

// Новый архив RPF7 (OPEN, без шифрования): пустой или собранный из папки на диске (op.dir). Пишется во временный файл и переименовывается.
function createRpf(op, emit) {
  const path = require('path');
  if (!op.out || fs.existsSync(op.out)) throw new Error('exists');
  const a = new Archive(null, path.basename(op.out), null);
  a.root = { t: 'd', name: '', children: [] }; a.enc = ENC.OPEN;
  const skipped = []; let nFiles = 0, total = 0;
  if (op.dir) {
    const walk = (dir, node) => {
      for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, d.name);
        if (d.isDirectory()) { walk(p, addDir(node, d.name)); continue; }
        if (!d.isFile() || /^(desktop\.ini|thumbs\.db)$/i.test(d.name)) continue;
        if (/\.ysc$/i.test(d.name)) { skipped.push(d.name); continue; }
        total += fs.statSync(p).size;
        nFiles++;
        addFile(a, node, d.name, fs.readFileSync(p));
        if (emit && !(nFiles & 31)) emit({ t: 'p', p: Math.min(0.9, nFiles / 20000) });
      }
    };
    walk(op.dir, a.root);
  }
  const tmp = op.out + '.mh.tmp';
  try { commitRebuild(a, tmp); fs.renameSync(tmp, op.out); }
  catch (x) { try { fs.unlinkSync(tmp); } catch (y) { /* нет файла */ } throw x; }
  return { files: nFiles, skipped };
}

function runOp(op, keysPack, emit) {
  const keys = keysPack ? Keys.unpack(Buffer.from(keysPack)) : null;
  if (op.kind === 'index') return indexAll(op, keys, emit || (() => {}));
  if (op.kind === 'create') return createRpf(op, emit || (() => {}));
  if (op.kind === 'fix') {
    const chain = (op.chain || []).concat(op.seg && op.seg.length ? [op.seg] : []);
    if (!keys) throw new Error('no-keys');
    if (!chain.length) { fixTopFile(op.top, keys, op.encData); return null; }
    return modify(op.top, chain, keys, (a) => { if (a.enc !== ENC.OPEN && a.enc !== ENC.NONE) throw new Error('already-enc'); }, { ng: op.encData, fixLast: true });
  }
  const nf = () => new Error('not-found');
  const dirOf = (a, seg) => { const d = seg.length ? a.find(seg) : a.root; if (!d || d.t !== 'd') throw nf(); return d; };
  const mut = {
    replace: (a) => { const e = a.find(op.seg); if (!e) throw nf(); if (e.t === 'd') throw new Error('is-dir'); if (a.isYsc(e)) throw new Error('ysc'); { const dt = fs.readFileSync(op.file); if (emit) emit({ t: 'p', p: 0.1 }); setPending(a, e, dt); if (emit) emit({ t: 'p', p: 0.6 }); } },
    add: (a) => {
      const d = dirOf(a, op.seg); let nd = 0;
      for (const f of op.files) {
        const name = require('path').basename(f.name || f.path);
        if (/\.ysc$/i.test(name)) throw new Error('ysc');
        const data = fs.readFileSync(f.path), ex = d.children.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (ex) { if (ex.t === 'd') throw new Error('exists'); setPending(a, ex, data); } else addFile(a, d, name, data);
        if (emit) emit({ t: 'p', p: Math.min(0.6, 0.1 + 0.5 * (++nd / op.files.length)) });
      }
    },
    delete: (a) => { const e = a.find(op.seg); if (!e) throw nf(); removeEntry(e); },
    rename: (a) => { const e = a.find(op.seg); if (!e) throw nf(); renameEntry(a, e, op.name); },
    mkdir: (a) => { addDir(dirOf(a, op.seg), op.name); },
    compact: () => {},
  };
  if (!mut[op.kind]) throw new Error('bad-op');
  return modify(op.top, op.chain || [], keys, mut[op.kind], { compact: op.kind === 'compact', onProgress: emit ? (p) => emit({ t: 'p', p: 0.6 + 0.4 * p }) : undefined });
}

// Запуск runOp в воркере: исходник модуля подаётся строкой (в сборке он лежит внутри asar).
function runOpWorker(op, keys, onMsg) {
  return new Promise((resolve, reject) => {
    const src = fs.readFileSync(__filename, 'utf8');
    const code = "const { parentPort, workerData } = require('worker_threads'); const m = { exports: {} };" +
      "new Function('module', 'exports', 'require', '__filename', workerData.src)(m, m.exports, require, 'rpf.js');" +
      "try { const r = m.exports.runOp(workerData.op, workerData.keys, (x) => parentPort.postMessage(x)); parentPort.postMessage({ t: 'ok', r: r === undefined ? null : r }); } catch (e) { parentPort.postMessage({ t: 'err', m: String(e && e.message || e) }); }";
    const w = new Worker(code, { eval: true, workerData: { src, op, keys: keys ? keys.pack() : null } });
    let fin = false;
    w.on('message', (m) => { if (m.t === 'ok') { fin = true; resolve(m.r); } else if (m.t === 'err') { fin = true; reject(new Error(m.m)); } else if (onMsg) onMsg(m); });
    w.on('error', (e) => { if (!fin) { fin = true; reject(e); } });
    w.on('exit', () => { if (!fin) { fin = true; reject(new Error('worker-exit')); } });
  });
}

module.exports = { Keys, Archive, FileSrc, SubSrc, BufSrc, scanKeys, loadKeysFromExe, keysFromMagic, dotnetRandom, jenkBytes, joaat, lutHash, ngIndex, ngDec, ngEnc, loadEnc, fixNgHead, fixNgBuffer, fixTopFile, aesDec, aesEnc, sizeFromFlags, prepare, layout, encodeTOC, setPending, addFile, addDir, createRpf, removeEntry, renameEntry, commitInPlace, commitRebuild, modify, runOp, runOpWorker, ENC, BLK, MAGIC, setAesRounds: (n) => { AES_ROUNDS = n; } };
