// Чтение словаря текстур (.ytd, формат Gen8) и превью в PNG. Раскладка полей сверена с исходником CodeWalker (Texture.cs)
// и с тестовыми .ytd, собранными оригинальным CodeWalker. Только чтение, ничего не пишет в архив.
'use strict';
const zlib = require('zlib');
const { sizeFromFlags } = require('./rpf');

const FMT = { 21: 'A8R8G8B8', 22: 'X8R8G8B8', 25: 'A1R5G5B5', 28: 'A8', 32: 'A8B8G8R8', 50: 'L8', 0x31545844: 'DXT1', 0x33545844: 'DXT3', 0x35545844: 'DXT5', 0x31495441: 'ATI1 (BC4)', 0x32495441: 'ATI2 (BC5)', 0x20374342: 'BC7' };
const BLOCK = { 0x31545844: 8, 0x33545844: 16, 0x35545844: 16, 0x31495441: 8, 0x32495441: 16, 0x20374342: 16 };
const BPP = { 21: 4, 22: 4, 25: 2, 28: 1, 32: 4, 50: 1 };

function mipSize(fmt, w, h) {
  if (BLOCK[fmt]) return Math.max(1, (w + 3) >> 2) * Math.max(1, (h + 3) >> 2) * BLOCK[fmt];
  return w * h * (BPP[fmt] || 4);
}

// Словарь текстур по смещению base в системном сегменте (у встроенных в модель словарей base != 0)
function readDictAt(S, G, base) {
  const ptr = (b, o) => b.readBigUInt64LE(o);
  const sysAt = (p) => { const hi = Number(p >> 28n); if (hi !== 5) throw new Error('bad-rsc'); const o = Number(p & 0x0FFFFFFFn); if (o >= S.length) throw new Error('bad-rsc'); return o; };
  const arrP = ptr(S, base + 0x30), count = S.readUInt16LE(base + 0x38);
  if (count > 4096) throw new Error('bad-rsc');
  const arr = count ? sysAt(arrP) : 0, out = [];
  for (let i = 0; i < count; i++) {
    const t = sysAt(ptr(S, arr + i * 8));
    const np = Number(ptr(S, t + 0x28) & 0x0FFFFFFFn);
    let e = np; while (e < S.length && S[e] !== 0) e++;
    const dp = ptr(S, t + 0x70);
    out.push({
      name: S.toString('latin1', np, e), width: S.readUInt16LE(t + 0x50), height: S.readUInt16LE(t + 0x52), depth: S.readUInt16LE(t + 0x54),
      stride: S.readUInt16LE(t + 0x56), format: S.readUInt32LE(t + 0x58), levels: S[t + 0x5D],
      dataOff: Number(dp >> 28n) === 6 ? Number(dp & 0x0FFFFFFFn) : -1,
    });
  }
  return { textures: out, G };
}
// data: распакованное тело ресурса, sys/gfx: флаги страниц из таблицы архива
function readYtd(data, sys, gfx) {
  const sSize = sizeFromFlags(sys), gSize = sizeFromFlags(gfx);
  if (!sSize || data.length < sSize) throw new Error('bad-rsc');
  return readDictAt(data.subarray(0, sSize), data.subarray(sSize, sSize + gSize), 0);
}

// ---- декодеры (результат RGBA) ----
const c565 = (c) => [((c >> 11) & 31) * 255 / 31 | 0, ((c >> 5) & 63) * 255 / 63 | 0, (c & 31) * 255 / 31 | 0];
function bc1Block(b, o, px, x0, y0, w, h, opaque) {
  const c0 = b.readUInt16LE(o), c1 = b.readUInt16LE(o + 2), a = c565(c0), c = c565(c1);
  const pal = [[a[0], a[1], a[2], 255], [c[0], c[1], c[2], 255]];
  if (c0 > c1 || !opaque) { pal.push([(2 * a[0] + c[0]) / 3 | 0, (2 * a[1] + c[1]) / 3 | 0, (2 * a[2] + c[2]) / 3 | 0, 255], [(a[0] + 2 * c[0]) / 3 | 0, (a[1] + 2 * c[1]) / 3 | 0, (a[2] + 2 * c[2]) / 3 | 0, 255]); }
  else pal.push([(a[0] + c[0]) >> 1, (a[1] + c[1]) >> 1, (a[2] + c[2]) >> 1, 255], [0, 0, 0, 0]);
  const bits = b.readUInt32LE(o + 4);
  for (let i = 0; i < 16; i++) { const x = x0 + (i & 3), y = y0 + (i >> 2); if (x >= w || y >= h) continue; const p = pal[(bits >> (2 * i)) & 3], k = (y * w + x) * 4; px[k] = p[0]; px[k + 1] = p[1]; px[k + 2] = p[2]; px[k + 3] = opaque === 2 ? 255 : p[3]; }
}
function alphaBlock8(b, o, tab) {
  const a0 = b[o], a1 = b[o + 1], pal = [a0, a1];
  if (a0 > a1) for (let i = 1; i < 7; i++) pal.push(((7 - i) * a0 + i * a1) / 7 | 0);
  else { for (let i = 1; i < 5; i++) pal.push(((5 - i) * a0 + i * a1) / 5 | 0); pal.push(0, 255); }
  let bits = 0n; for (let i = 0; i < 6; i++) bits |= BigInt(b[o + 2 + i]) << BigInt(8 * i);
  for (let i = 0; i < 16; i++) tab[i] = pal[Number((bits >> BigInt(3 * i)) & 7n)];
}
function decode(fmt, w, h, buf, o) {
  const px = Buffer.alloc(w * h * 4);
  if (BLOCK[fmt] && fmt !== 0x20374342) {
    const bw = Math.max(1, (w + 3) >> 2), bh = Math.max(1, (h + 3) >> 2), bs = BLOCK[fmt], al = new Array(16), al2 = new Array(16);
    for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
      const p = o + (by * bw + bx) * bs, x0 = bx * 4, y0 = by * 4;
      if (fmt === 0x31545844) bc1Block(buf, p, px, x0, y0, w, h, 1);
      else if (fmt === 0x33545844) { bc1Block(buf, p + 8, px, x0, y0, w, h, 2); for (let i = 0; i < 16; i++) { const x = x0 + (i & 3), y = y0 + (i >> 2); if (x < w && y < h) px[(y * w + x) * 4 + 3] = ((buf[p + (i >> 1)] >> ((i & 1) * 4)) & 15) * 17; } }
      else if (fmt === 0x35545844) { bc1Block(buf, p + 8, px, x0, y0, w, h, 2); alphaBlock8(buf, p, al); for (let i = 0; i < 16; i++) { const x = x0 + (i & 3), y = y0 + (i >> 2); if (x < w && y < h) px[(y * w + x) * 4 + 3] = al[i]; } }
      else if (fmt === 0x31495441) { alphaBlock8(buf, p, al); for (let i = 0; i < 16; i++) { const x = x0 + (i & 3), y = y0 + (i >> 2); if (x < w && y < h) { const k = (y * w + x) * 4; px[k] = px[k + 1] = px[k + 2] = al[i]; px[k + 3] = 255; } } }
      else { alphaBlock8(buf, p, al); alphaBlock8(buf, p + 8, al2); for (let i = 0; i < 16; i++) { const x = x0 + (i & 3), y = y0 + (i >> 2); if (x < w && y < h) { const k = (y * w + x) * 4; px[k] = al[i]; px[k + 1] = al2[i]; px[k + 2] = 255; px[k + 3] = 255; } } }
    }
    return px;
  }
  if (fmt === 0x20374342) return null;
  for (let i = 0; i < w * h; i++) {
    const k = i * 4;
    if (fmt === 21 || fmt === 22) { px[k] = buf[o + i * 4 + 2]; px[k + 1] = buf[o + i * 4 + 1]; px[k + 2] = buf[o + i * 4]; px[k + 3] = fmt === 22 ? 255 : buf[o + i * 4 + 3]; }
    else if (fmt === 32) { px[k] = buf[o + i * 4]; px[k + 1] = buf[o + i * 4 + 1]; px[k + 2] = buf[o + i * 4 + 2]; px[k + 3] = buf[o + i * 4 + 3]; }
    else if (fmt === 28) { px[k] = px[k + 1] = px[k + 2] = 255; px[k + 3] = buf[o + i]; }
    else if (fmt === 50) { px[k] = px[k + 1] = px[k + 2] = buf[o + i]; px[k + 3] = 255; }
    else if (fmt === 25) { const v = buf.readUInt16LE(o + i * 2); px[k] = ((v >> 10) & 31) * 255 / 31 | 0; px[k + 1] = ((v >> 5) & 31) * 255 / 31 | 0; px[k + 2] = (v & 31) * 255 / 31 | 0; px[k + 3] = v & 0x8000 ? 255 : 0; }
    else return null;
  }
  return px;
}

// ---- PNG ----
let CRC = null;
function crc32(b) { if (!CRC) { CRC = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c; } } let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t, 'latin1'), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); }
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Текстура для 3D-вида: мип не крупнее maxDim. BC7 отдаётся «сырым» (его разожмёт видеокарта), остальное как PNG.
function payload(t, G, maxDim) {
  if (t.dataOff < 0 || !t.width || !t.height) return null;
  let m = 0, off = t.dataOff, w = t.width, h = t.height;
  while (m < t.levels - 1 && Math.max(w, h) > (maxDim || 1024)) { off += mipSize(t.format, w, h); w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); m++; }
  const len = mipSize(t.format, w, h);
  if (off + len > G.length) return null;
  const o = { name: t.name, w, h, fmt: FMT[t.format] || '' };
  if (t.format === 0x20374342) { o.bc7 = G.subarray(off, off + len).toString('base64'); return o; }
  const rgba = decode(t.format, w, h, G, off);
  if (!rgba) return null;
  o.png = 'data:image/png;base64,' + png(w, h, rgba).toString('base64');
  return o;
}

// Список текстур с превью (не крупнее maxDim по стороне: выбирается подходящий мип)
function listTextures(data, sys, gfx, maxDim, maxCount) {
  const { textures, G } = readYtd(data, sys, gfx), out = [];
  for (const t of textures.slice(0, maxCount || 64)) {
    const info = { name: t.name, width: t.width, height: t.height, levels: t.levels, format: FMT[t.format] || ('0x' + t.format.toString(16)), url: '' };
    try {
      if (t.dataOff >= 0 && t.width && t.height) {
        let m = 0, off = t.dataOff, w = t.width, h = t.height;
        while (m < t.levels - 1 && Math.max(w, h) > (maxDim || 256)) { off += mipSize(t.format, w, h); w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); m++; }
        const rgba = off + mipSize(t.format, w, h) <= G.length ? decode(t.format, w, h, G, off) : null;
        if (!rgba && t.format === 0x20374342 && off + mipSize(t.format, w, h) <= G.length) { info.bc7 = G.subarray(off, off + mipSize(t.format, w, h)).toString('base64'); info.pw = w; info.ph = h; }
        if (rgba) { info.url = 'data:image/png;base64,' + png(w, h, rgba).toString('base64'); info.pw = w; info.ph = h; }
      }
    } catch (e) { /* без превью */ }
    out.push(info);
  }
  return { total: textures.length, list: out };
}

module.exports = { readYtd, readDictAt, payload, decode, png, listTextures, mipSize, FMT };
