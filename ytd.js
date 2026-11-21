// Правка словарей текстур (.ytd, формат Gen8 / Legacy): разбор, добавление/замена/удаление/переименование текстур, импорт и экспорт DDS, сборка ресурса.
// Раскладка полей и алгоритм размещения по страницам повторяют CodeWalker.Core (Texture.cs, ResourceBuilder.AssignPositions2, ResourceFile.cs).
// Работает с памятью, ничего не пишет на диск: запись в архив делает cw.js.
'use strict';
const T = require('./tex');
const { sizeFromFlags } = require('./rpf');

const FMT = T.FMT, mipSize = T.mipSize;
const BLK = { 0x31545844: 8, 0x33545844: 16, 0x35545844: 16, 0x31495441: 8, 0x32495441: 16, 0x20374342: 16 };
const BPP = { 21: 4, 22: 4, 25: 2, 28: 1, 32: 4, 50: 1 };
const ALIGN = 16;
const TEX_SIZE = 0x90;
const PAGES_RESERVE = 16 + 8 * 128; // CodeWalker резервирует под ResourcePagesInfo место на 128 страниц

const err = (c) => new Error(c);

// Jenkins one-at-a-time по строке в нижнем регистре (JenkHash.GenHash)
function joaat(str) {
  const b = Buffer.from(String(str).toLowerCase(), 'utf8');
  let h = 0;
  for (const c of b) { h = (h + c) >>> 0; h = (h + (h << 10)) >>> 0; h = (h ^ (h >>> 6)) >>> 0; }
  h = (h + (h << 3)) >>> 0; h = (h ^ (h >>> 11)) >>> 0; h = (h + (h << 15)) >>> 0;
  return h >>> 0;
}

function chainSize(fmt, w, h, levels) {
  let n = 0;
  for (let l = 0; l < levels; l++) n += mipSize(fmt, Math.max(1, w >> l), Math.max(1, h >> l));
  return n;
}
// stride как у CodeWalker (DDSIO.GetTexture): slicePitch / height
function strideOf(fmt, w, h) {
  let row, slice;
  if (BLK[fmt]) { row = Math.max(1, (w + 3) >> 2) * BLK[fmt]; slice = row * Math.max(1, (h + 3) >> 2); }
  else { row = w * (BPP[fmt] || 4); slice = row * h; }
  return Math.floor(slice / h) & 0xFFFF;
}

// ---------------- разбор ресурса ----------------
// data: распакованное тело ресурса, sys/gfx: флаги страниц из таблицы архива
function parse(data, sys, gfx) {
  const sSize = sizeFromFlags(sys), gSize = sizeFromFlags(gfx);
  if (!sSize || data.length < sSize || sSize < 0x40) throw err('ytd-unsupported');
  const S = data.subarray(0, sSize), G = data.subarray(sSize, sSize + gSize);
  const sysAt = (p, len) => {
    if (Number(p >> 28n) !== 5) throw err('ytd-unsupported');
    const o = Number(p & 0x0FFFFFFFn);
    if (o + (len || 1) > S.length) throw err('ytd-unsupported');
    return o;
  };
  const hdr = { vft: S.readUInt32LE(0), unk: S.readUInt32LE(4), u10: S.readUInt32LE(0x10), u14: S.readUInt32LE(0x14), u18: S.readUInt32LE(0x18), u1c: S.readUInt32LE(0x1C) };
  const count = S.readUInt16LE(0x38);
  if (count > 4096) throw err('ytd-unsupported');
  const arr = count ? sysAt(S.readBigUInt64LE(0x30), count * 8) : 0;
  const textures = [];
  for (let i = 0; i < count; i++) {
    const t = sysAt(S.readBigUInt64LE(arr + i * 8), TEX_SIZE);
    const block = Buffer.from(S.subarray(t, t + TEX_SIZE));
    const np = sysAt(block.readBigUInt64LE(0x28));
    let e = np; while (e < S.length && S[e] !== 0 && e - np < 512) e++;
    const width = block.readUInt16LE(0x50), height = block.readUInt16LE(0x52), depth = block.readUInt16LE(0x54);
    const format = block.readUInt32LE(0x58), levels = block[0x5D] || 1;
    if (!FMT[format] || !width || !height || depth > 1) throw err('ytd-unsupported');
    const dp = block.readBigUInt64LE(0x70);
    if (Number(dp >> 28n) !== 6) throw err('ytd-unsupported');
    const off = Number(dp & 0x0FFFFFFFn), len = chainSize(format, width, height, levels);
    if (off + len > G.length) throw err('ytd-unsupported');
    textures.push({ name: S.toString('latin1', np, e), block, width, height, levels, format, data: Buffer.from(G.subarray(off, off + len)) });
  }
  return { hdr, sys: sys >>> 0, gfx: gfx >>> 0, textures };
}

// ---------------- DDS ----------------
const FOURCC = { 0x31545844: 0x31545844, 0x33545844: 0x33545844, 0x35545844: 0x35545844, 0x31495441: 0x31495441, 0x32495441: 0x32495441, 0x55344342: 0x31495441, 0x55354342: 0x32495441 };
const DXGI = { 71: 0x31545844, 72: 0x31545844, 74: 0x33545844, 75: 0x33545844, 77: 0x35545844, 78: 0x35545844, 80: 0x31495441, 83: 0x32495441, 98: 0x20374342, 99: 0x20374342, 28: 32, 29: 32, 87: 21, 91: 21, 88: 22, 86: 25, 65: 28, 61: 50 };
function parseDds(b) {
  if (b.length < 128 || b.readUInt32LE(0) !== 0x20534444 || b.readUInt32LE(4) !== 124) throw err('dds-bad');
  const flags = b.readUInt32LE(8), height = b.readUInt32LE(12), width = b.readUInt32LE(16), mips = b.readUInt32LE(28) || 1;
  const pf = b.readUInt32LE(80), fourcc = b.readUInt32LE(84), bits = b.readUInt32LE(88);
  const rm = b.readUInt32LE(92), gm = b.readUInt32LE(96), bm = b.readUInt32LE(100), am = b.readUInt32LE(104), caps2 = b.readUInt32LE(112);
  if ((caps2 & 0x200) || (caps2 & 0x200000) || (flags & 0x800000)) throw err('ytd-dds-kind');
  if (!width || !height || width > 16384 || height > 16384) throw err('dds-bad');
  let start = 128, fmt = 0;
  if (pf & 4) {
    if (fourcc === 0x30315844) {
      if (b.length < 148) throw err('dds-bad');
      const dxgi = b.readUInt32LE(128), dim = b.readUInt32LE(132), misc = b.readUInt32LE(136), arr = b.readUInt32LE(140);
      if (dim !== 3 || arr !== 1 || (misc & 4)) throw err('ytd-dds-kind');
      start = 148; fmt = DXGI[dxgi] || 0;
    } else fmt = FOURCC[fourcc] || 0;
  } else if ((pf & 0x40) && bits === 32) {
    if (rm === 0x00FF0000 && gm === 0xFF00 && bm === 0xFF) fmt = am ? 21 : 22;
    else if (rm === 0xFF && gm === 0xFF00 && bm === 0xFF0000 && am) fmt = 32;
  } else if ((pf & 0x40) && bits === 16 && rm === 0x7C00 && gm === 0x3E0 && bm === 0x1F && am === 0x8000) fmt = 25;
  else if ((pf & 0x20000) && bits === 8) fmt = 50;
  else if ((pf & 3) && !(pf & 0x40) && bits === 8) fmt = 28;
  if (!fmt) throw err('ytd-dds-format');
  const levels = Math.max(1, Math.min(mips, 16)), need = chainSize(fmt, width, height, levels);
  if (b.length - start < need) throw err('dds-bad');
  return { width, height, levels, format: fmt, stride: strideOf(fmt, width, height), data: Buffer.from(b.subarray(start, start + need)) };
}

function toDds(t) {
  const fmt = t.format, dx10 = fmt === 0x20374342, h = Buffer.alloc(dx10 ? 148 : 128);
  h.writeUInt32LE(0x20534444, 0); h.writeUInt32LE(124, 4);
  const comp = !!BLK[fmt];
  h.writeUInt32LE(0x1 | 0x2 | 0x4 | 0x1000 | (t.levels > 1 ? 0x20000 : 0) | (comp ? 0x80000 : 0x8), 8);
  h.writeUInt32LE(t.height, 12); h.writeUInt32LE(t.width, 16);
  h.writeUInt32LE(comp ? mipSize(fmt, t.width, t.height) : t.width * (BPP[fmt] || 4), 20);
  h.writeUInt32LE(t.levels, 28); h.writeUInt32LE(32, 76);
  const pf = (flags, four, bits, r, g, bl, a) => { h.writeUInt32LE(flags, 80); h.writeUInt32LE(four, 84); h.writeUInt32LE(bits, 88); h.writeUInt32LE(r, 92); h.writeUInt32LE(g, 96); h.writeUInt32LE(bl, 100); h.writeUInt32LE(a, 104); };
  if (dx10) { pf(4, 0x30315844, 0, 0, 0, 0, 0); h.writeUInt32LE(98, 128); h.writeUInt32LE(3, 132); h.writeUInt32LE(0, 136); h.writeUInt32LE(1, 140); }
  else if (comp) pf(4, fmt, 0, 0, 0, 0, 0);
  else if (fmt === 21) pf(0x41, 0, 32, 0x00FF0000, 0xFF00, 0xFF, 0xFF000000);
  else if (fmt === 22) pf(0x40, 0, 32, 0x00FF0000, 0xFF00, 0xFF, 0);
  else if (fmt === 32) pf(0x41, 0, 32, 0xFF, 0xFF00, 0xFF0000, 0xFF000000);
  else if (fmt === 25) pf(0x41, 0, 16, 0x7C00, 0x3E0, 0x1F, 0x8000);
  else if (fmt === 28) pf(2, 0, 8, 0, 0, 0, 0xFF);
  else pf(0x20000, 0, 8, 0xFF, 0, 0, 0);
  h.writeUInt32LE(0x1000 | (t.levels > 1 ? 0x400008 : 0), 108);
  return Buffer.concat([h, t.data]);
}

// ---------------- правки ----------------
const cleanName = (n) => String(n == null ? '' : n).replace(/[^\x20-\x7E]/g, '_').replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 120);
function applyTex(t, img) {
  t.width = img.width; t.height = img.height; t.levels = img.levels; t.format = img.format; t.data = img.data;
  t.block.writeUInt16LE(img.width, 0x50); t.block.writeUInt16LE(img.height, 0x52); t.block.writeUInt16LE(1, 0x54);
  t.block.writeUInt16LE(img.stride, 0x56); t.block.writeUInt32LE(img.format, 0x58); t.block[0x5D] = img.levels;
}
function hasName(s, name, skip) { const l = name.toLowerCase(); return s.textures.some((t, i) => i !== skip && t.name.toLowerCase() === l); }
function addTex(s, name, img) {
  name = cleanName(name);
  if (!name) throw err('ytd-name');
  if (hasName(s, name, -1)) throw err('ytd-dup');
  // заготовка как у DDS-импорта CodeWalker: VFT берём у соседней текстуры, остальное по умолчанию
  const block = Buffer.alloc(TEX_SIZE);
  if (s.textures.length) block.writeUInt32LE(s.textures[0].block.readUInt32LE(0), 0);
  block.writeUInt32LE(1, 4); block.writeUInt16LE(1, 0x30);
  block[0x43] = 32; // как DDSIO.GetTexture в CodeWalker (размер DDS_PIXELFORMAT): даёт UsageFlags UNK24, как у обычных текстур игры
  const t = { name, block, width: 0, height: 0, levels: 0, format: 0, data: null };
  applyTex(t, img);
  s.textures.push(t);
  return t;
}
function renameTex(s, i, name) {
  name = cleanName(name);
  if (!name) throw err('ytd-name');
  if (hasName(s, name, i)) throw err('ytd-dup');
  s.textures[i].name = name;
}

// ---------------- раскладка по страницам (AssignPositions2) ----------------
function assign(sizes, sys, maxPages) {
  const n = sizes.length;
  if (!n) return { pos: [], v: 0, pages: 0, size: 0 };
  let maxBlock = 0, minBlock = Infinity;
  for (const s of sizes) { if (s > maxBlock) maxBlock = s; if (s < minBlock) minBlock = s; }
  let baseShift = 0, baseSize = 0x2000;
  while (((baseSize < minBlock) || (baseSize * 16 < maxBlock)) && baseShift < 0xF) { baseShift++; baseSize = 0x2000 * (2 ** baseShift); }
  if (baseSize * 16 < maxBlock) throw err('ytd-too-big');
  const order = [];
  for (let i = sys ? 1 : 0; i < n; i++) order.push(i);
  order.sort((a, b) => (sizes[b] - sizes[a]) || (a - b));
  if (sys) order.unshift(0);
  let counts, bp;
  for (;;) {
    const pageSizes = [null, null, null, null, null];
    bp = new Array(n);
    let li = 0, lp = baseSize;
    while (lp < maxBlock) { li++; lp *= 2; }
    for (let k = 0; k < order.length; k++) {
      const idx = order[k], size = sizes[idx];
      if (k === 0) { pageSizes[li] = [size]; bp[idx] = [li, 0, 0]; continue; }
      let pi = 0, ps = baseSize;
      while (size > ps && pi < li) { pi++; ps *= 2; }
      let found = false, ti = pi, tps = ps;
      while (!found && ti <= li) {
        const list = pageSizes[ti];
        if (list) {
          for (let p = 0; p < list.length; p++) {
            let s = list[p]; s += (ALIGN - (s % ALIGN)) % ALIGN;
            const o = s; s += size;
            if (s <= tps) { list[p] = s; found = true; bp[idx] = [ti, p, o]; break; }
          }
        }
        ti++; tps *= 2;
      }
      if (!found) {
        if (!pageSizes[pi]) pageSizes[pi] = [];
        bp[idx] = [pi, pageSizes[pi].length, 0];
        pageSizes[pi].push(size);
      }
    }
    counts = pageSizes.map((l) => (l ? l.length : 0));
    const total = counts.reduce((a, b) => a + b, 0);
    if (total <= maxPages && counts[0] <= 0x7F && counts[1] <= 0x3F && counts[2] <= 0xF && counts[3] <= 3 && counts[4] <= 1) break;
    if (baseShift >= 0xF) throw err('ytd-too-big');
    baseShift++; baseSize = 0x2000 * (2 ** baseShift);
  }
  const offs = [0, 0, 0, 0, 0];
  let acc = 0;
  for (let i = 4; i >= 0; i--) { offs[i] = acc; acc += baseSize * (2 ** i) * counts[i]; }
  const pos = bp.map(([pi, pg, o]) => offs[pi] + baseSize * (2 ** pi) * pg + o);
  const v = ((baseShift & 0xF) + ((counts[4] & 1) << 4) + ((counts[3] & 3) << 5) + ((counts[2] & 0xF) << 7) + ((counts[1] & 0x3F) << 11) + ((counts[0] & 0x7F) << 17)) >>> 0;
  return { pos, v, pages: counts.reduce((a, b) => a + b, 0), size: sizeFromFlags(v) };
}

// ---------------- сборка ----------------
// Возвращает RSC7-файл (заголовок 16 байт + несжатое тело), который архив сам сожмёт при записи.
function build(s) {
  const tex = s.textures.map((t, i) => ({ t, h: joaat(t.name), i })).sort((a, b) => (a.h - b.h) || (a.i - b.i));
  const n = tex.length;
  if (n > 4096) throw err('ytd-too-big');
  // системные блоки: 0 корень, 1 ResourcePagesInfo, затем массивы, текстуры, имена
  const sysSizes = [0x40, PAGES_RESERVE];
  let hashI = -1, ptrI = -1;
  if (n) { hashI = sysSizes.push(4 * n) - 1; ptrI = sysSizes.push(8 * n) - 1; }
  const texI = [], nameI = [];
  for (let k = 0; k < n; k++) texI.push(sysSizes.push(TEX_SIZE) - 1);
  for (let k = 0; k < n; k++) nameI.push(sysSizes.push(Buffer.byteLength(tex[k].t.name, 'latin1') + 1) - 1);
  const gfxSizes = tex.map((x) => x.t.data.length);
  const sa = assign(sysSizes, true, 128);
  const ga = assign(gfxSizes, false, 128 - sa.pages);
  const S = Buffer.alloc(sa.size), G = Buffer.alloc(ga.size);
  const sp = (i) => 0x50000000 + sa.pos[i];
  // корневой блок
  S.writeUInt32LE(s.hdr.vft >>> 0, 0); S.writeUInt32LE(s.hdr.unk >>> 0, 4); S.writeBigUInt64LE(BigInt(sp(1)), 8);
  S.writeUInt32LE(s.hdr.u10 >>> 0, 0x10); S.writeUInt32LE(s.hdr.u14 >>> 0, 0x14); S.writeUInt32LE(s.hdr.u18 >>> 0, 0x18); S.writeUInt32LE(s.hdr.u1c >>> 0, 0x1C);
  if (n) {
    S.writeBigUInt64LE(BigInt(sp(hashI)), 0x20); S.writeUInt16LE(n, 0x28); S.writeUInt16LE(n, 0x2A);
    S.writeBigUInt64LE(BigInt(sp(ptrI)), 0x30); S.writeUInt16LE(n, 0x38); S.writeUInt16LE(n, 0x3A);
  }
  // ResourcePagesInfo
  const pg = sa.pos[1];
  S[pg + 8] = sa.pages; S[pg + 9] = ga.pages;
  for (let k = 0; k < n; k++) {
    const t = tex[k].t;
    S.writeUInt32LE(tex[k].h, sa.pos[hashI] + 4 * k);
    S.writeBigUInt64LE(BigInt(sp(texI[k])), sa.pos[ptrI] + 8 * k);
    const blk = Buffer.from(t.block);
    blk.writeBigUInt64LE(BigInt(sp(nameI[k])), 0x28);
    blk.writeBigUInt64LE(BigInt(0x60000000 + ga.pos[k]), 0x70);
    blk.copy(S, sa.pos[texI[k]]);
    S.write(t.name, sa.pos[nameI[k]], 'latin1');
    t.data.copy(G, ga.pos[k]);
  }
  const sysFlags = ((s.sys & 0xF0000000) + sa.v) >>> 0, gfxFlags = ((s.gfx & 0xF0000000) + ga.v) >>> 0;
  const head = Buffer.alloc(16);
  head.writeUInt32LE(0x37435352, 0); head.writeInt32LE(((s.sys >>> 28) << 4) | (s.gfx >>> 28), 4); head.writeUInt32LE(sysFlags, 8); head.writeUInt32LE(gfxFlags, 12);
  return { file: Buffer.concat([head, S, G]), sys: sysFlags, gfx: gfxFlags };
}

// ---------------- превью ----------------
function thumbs(s, maxDim) {
  maxDim = maxDim || 160;
  return s.textures.map((t, i) => {
    const info = { i, name: t.name, width: t.width, height: t.height, levels: t.levels, format: FMT[t.format] || ('0x' + t.format.toString(16)), size: t.data.length, url: '' };
    try {
      let m = 0, off = 0, w = t.width, h = t.height;
      while (m < t.levels - 1 && Math.max(w, h) > maxDim) { off += mipSize(t.format, w, h); w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); m++; }
      const len = mipSize(t.format, w, h);
      if (off + len <= t.data.length) {
        const rgba = T.decode(t.format, w, h, t.data, off);
        if (rgba) { info.url = 'data:image/png;base64,' + T.png(w, h, rgba).toString('base64'); info.pw = w; info.ph = h; }
        else if (t.format === 0x20374342) { info.bc7 = t.data.subarray(off, off + len).toString('base64'); info.pw = w; info.ph = h; }
      }
    } catch (e) { /* без превью */ }
    return info;
  });
}

module.exports = { joaat, parse, parseDds, toDds, build, addTex, renameTex, applyTex, thumbs, cleanName, strideOf, chainSize, assign, TEX_SIZE };
