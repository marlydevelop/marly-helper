// Инструмент «Прицел»: разбор и правка hud_reticle.gfx (GTA V, Scaleform GFx = SWF v8).
// Центральный прицел там = прямоугольные шейпы с растровой заливкой (DefineBitsLossless2, ARGB premultiplied).
// Мы перерисовываем эти картинки (рисует окно, canvas) и пересобираем файл; остальные теги копируются как есть.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MAX_FILE = 40 * 1024 * 1024;
const SHAPE_TAGS = new Set([2, 22, 32, 83]);
const BMP_TAGS = new Set([20, 36]);

/* ---------- битовые читалка/писалка ---------- */
class BR {
  constructor(b, p) { this.b = b; this.p = p; this.k = 0; }
  ub(n) { let v = 0; for (let i = 0; i < n; i++) { v = v * 2 + ((this.b[this.p] >> (7 - this.k)) & 1); if (++this.k === 8) { this.k = 0; this.p++; } } return v; }
  sb(n) { let v = this.ub(n); if (n && v >= Math.pow(2, n - 1)) v -= Math.pow(2, n); return v; }
  al() { if (this.k) { this.k = 0; this.p++; } }
}
class BW {
  constructor() { this.a = []; this.cur = 0; this.k = 0; }
  ub(v, n) { for (let i = n - 1; i >= 0; i--) { this.cur = (this.cur << 1) | (Math.floor(v / Math.pow(2, i)) & 1); if (++this.k === 8) { this.a.push(this.cur); this.cur = 0; this.k = 0; } } }
  sb(v, n) { this.ub(v < 0 ? v + Math.pow(2, n) : v, n); }
  al() { if (this.k) { this.a.push(this.cur << (8 - this.k)); this.cur = 0; this.k = 0; } }
  bytes() { this.al(); return Buffer.from(this.a); }
}
const bitlen = (m) => { let n = 0; while (m > 0) { n++; m = Math.floor(m / 2); } return n; };
const nbS = (...v) => { let n = 1; v.forEach((x) => { n = Math.max(n, bitlen(x < 0 ? -x - 1 : x) + 1); }); return n; };

/* ---------- файл и теги ---------- */
function open(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 24) throw new Error('not a gfx');
  const sig = buf.toString('latin1', 0, 3);
  let full = buf, comp = false;
  if (sig === 'CFX' || sig === 'CWS') { comp = true; full = Buffer.concat([buf.subarray(0, 8), zlib.inflateSync(buf.subarray(8))]); }
  else if (sig !== 'GFX' && sig !== 'FWS') throw new Error('not a gfx');
  const n = full[8] >> 3, rl = Math.ceil((5 + 4 * n) / 8), p0 = 8 + rl + 4;
  const tags = [];
  let p = p0;
  while (p < full.length) {
    const h = full.readUInt16LE(p); const t = h >> 6; let l = h & 63, q = p + 2;
    if (l === 63) { l = full.readUInt32LE(q); q += 4; }
    tags.push({ t, off: p, pay: q, len: l, end: q + l });
    p = q + l;
    if (t === 0) break;
  }
  const r = new BR(full, 8); const rn = r.ub(5); const rect = [r.sb(rn), r.sb(rn), r.sb(rn), r.sb(rn)];
  return { sig, ver: full[3], full, comp, p0, tags, rect };
}

function readMatrix(b) {
  let sx = 1, sy = 1;
  if (b.ub(1)) { const n = b.ub(5); sx = b.sb(n) / 65536; sy = b.sb(n) / 65536; }
  if (b.ub(1)) { const n = b.ub(5); b.sb(n); b.sb(n); }
  const n = b.ub(5); b.sb(n); b.sb(n); b.al();
  return { sx, sy };
}
function cstr(f, p) { const e = f.indexOf(0, p); return [f.toString('latin1', p, e), e + 1]; }

// <= { bbox:[x0,x1,y0,y1], bmp:{type,id} | null }
function readShape(f, tg) {
  let p = tg.pay + 2;
  let b = new BR(f, p); let n = b.ub(5); const bb = [b.sb(n), b.sb(n), b.sb(n), b.sb(n)]; b.al(); p = b.p;
  if (tg.t === 83) { b = new BR(f, p); n = b.ub(5); for (let i = 0; i < 4; i++) b.sb(n); b.al(); p = b.p + 1; }
  let cnt = f[p++]; if (cnt === 255) { cnt = f.readUInt16LE(p); p += 2; }
  const rgba = tg.t !== 2 && tg.t !== 22 ? 4 : 3;
  let bmp = null;
  for (let i = 0; i < cnt; i++) {
    const ty = f[p++];
    if (ty === 0) p += rgba;
    else if (ty === 0x10 || ty === 0x12 || ty === 0x13) {
      b = new BR(f, p); readMatrix(b); p = b.p;
      const ng = f[p++] & 15; p += ng * (1 + rgba); if (ty === 0x13) p += 2;
    } else if (ty >= 0x40 && ty <= 0x43) {
      const id = f.readUInt16LE(p); p += 2; b = new BR(f, p); readMatrix(b); p = b.p;
      if (!bmp) bmp = { type: ty, id };
    } else throw new Error('fill ' + ty);
  }
  return { bbox: bb, bmp };
}

// instance names + parents inside sprites
function readPlace(f, tg) {
  let p = tg.pay; const fl = f[p++]; let f2 = 0;
  if (tg.t === 70) f2 = f[p++];
  p += 2; // depth
  if (tg.t === 70 && ((f2 & 8) || ((f2 & 0x10) && (fl & 2)))) p = cstr(f, p)[1];
  const o = { cid: -1, name: '' };
  if (fl & 2) { o.cid = f.readUInt16LE(p); p += 2; }
  if (fl & 4) { const b = new BR(f, p); readMatrix(b); p = b.p; }
  if (fl & 8) { const b = new BR(f, p); const ha = b.ub(1), hm = b.ub(1), nb = b.ub(4); if (hm) for (let i = 0; i < 4; i++) b.sb(nb); if (ha) for (let i = 0; i < 4; i++) b.sb(nb); b.al(); p = b.p; }
  if (fl & 16) p += 2;
  if (fl & 32) o.name = cstr(f, p)[0];
  return o;
}

function analyze(buf) {
  const g = open(buf), f = g.full;
  const bitmaps = {}, shapes = {}, sprites = {};
  g.tags.forEach((tg) => {
    if (BMP_TAGS.has(tg.t)) {
      const id = f.readUInt16LE(tg.pay);
      bitmaps[id] = { tag: tg, fmt: f[tg.pay + 2], w: f.readUInt16LE(tg.pay + 3), h: f.readUInt16LE(tg.pay + 5) };
    } else if (SHAPE_TAGS.has(tg.t)) {
      try { const s = readShape(f, tg); s.tag = tg; shapes[f.readUInt16LE(tg.pay)] = s; } catch (e) { /* чужой формат шейпа: пропускаем */ }
    } else if (tg.t === 39) sprites[f.readUInt16LE(tg.pay)] = tg;
  });
  const inst = {}, parents = {};
  Object.keys(sprites).forEach((sid) => {
    const tg = sprites[sid]; let p = tg.pay + 4;
    while (p < tg.end) {
      const h = f.readUInt16LE(p); const t = h >> 6; let l = h & 63, q = p + 2;
      if (l === 63) { l = f.readUInt32LE(q); q += 4; }
      if (t === 26 || t === 70) {
        try {
          const o = readPlace(f, { t, pay: q, len: l });
          if (o.cid >= 0) { (parents[o.cid] = parents[o.cid] || new Set()).add(+sid); if (o.name) (inst[o.cid] = inst[o.cid] || new Set()).add(o.name); }
        } catch (e) { /* ignore */ }
      }
      p = q + l; if (t === 0) break;
    }
  });
  const targets = [];
  Object.keys(shapes).forEach((k) => {
    const s = shapes[k]; if (!s.bmp || !bitmaps[s.bmp.id] || bitmaps[s.bmp.id].fmt !== 5 || bitmaps[s.bmp.id].tag.t !== 36) return;
    const w = s.bbox[1] - s.bbox[0], h = s.bbox[3] - s.bbox[2];
    if (w > 1600 || h > 1600 || w < 20 || h < 20) return; // фоны прицела снайперки и т.п. не трогаем
    let dyn = false;
    (parents[k] ? Array.from(parents[k]) : []).forEach((sid) => { if (inst[sid] && Array.from(inst[sid]).some((n) => /scale/i.test(n))) dyn = true; });
    targets.push({ shape: +k, bitmap: s.bmp.id, ftype: s.bmp.type, role: dyn ? 'dynamic' : 'center', w, h, tag: s.tag });
  });
  targets.sort((a, b) => a.shape - b.shape);
  return { g, bitmaps, targets };
}

function decodeBitmap(an, id) { // -> { w, h, rgba (не premultiplied) }
  const bm = an.bitmaps[id], f = an.g.full;
  const raw = zlib.inflateSync(f.subarray(bm.tag.pay + 7, bm.tag.end));
  const n = bm.w * bm.h, out = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const a = raw[i * 4], k = i * 4;
    out[k + 3] = a;
    for (let c = 0; c < 3; c++) out[k + c] = a ? Math.min(255, Math.round(raw[k + 1 + c] * 255 / a)) : 0;
  }
  return { w: bm.w, h: bm.h, rgba: out };
}

/* ---------- сборка ---------- */
function tagBytes(t, payload) {
  const h = Buffer.alloc(payload.length < 63 ? 2 : 6);
  if (payload.length < 63) h.writeUInt16LE((t << 6) | payload.length, 0);
  else { h.writeUInt16LE((t << 6) | 63, 0); h.writeUInt32LE(payload.length, 2); }
  return Buffer.concat([h, payload]);
}
function bitmapTag(id, w, h, rgba) { // rgba (straight) -> DefineBitsLossless2, ARGB premultiplied
  const n = w * h, raw = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const k = i * 4, a = rgba[k + 3];
    raw[k] = a; raw[k + 1] = Math.round(rgba[k] * a / 255); raw[k + 2] = Math.round(rgba[k + 1] * a / 255); raw[k + 3] = Math.round(rgba[k + 2] * a / 255);
  }
  const hd = Buffer.alloc(7); hd.writeUInt16LE(id, 0); hd[2] = 5; hd.writeUInt16LE(w, 3); hd.writeUInt16LE(h, 5);
  return tagBytes(36, Buffer.concat([hd, zlib.deflateSync(raw, { level: 9 })]));
}
function shapeTag(id, ftype, bid, bw, bh, boxW, boxH) { // прямоугольник boxW x boxH twips с центром в нуле, заливка картинкой bw x bh
  const hw = boxW / 2, hh = boxH / 2, w = new BW();
  const bnb = nbS(-hw, hw, -hh, hh);
  w.ub(bnb, 5); w.sb(-hw, bnb); w.sb(hw, bnb); w.sb(-hh, bnb); w.sb(hh, bnb); w.al();
  const head = Buffer.alloc(2); head.writeUInt16LE(id, 0);
  const rect = w.bytes();
  const fs1 = Buffer.alloc(2); fs1[0] = 1; fs1[1] = ftype; // 1 заливка
  const bid2 = Buffer.alloc(2); bid2.writeUInt16LE(bid, 0);
  const m = new BW(); const sx = Math.round(boxW / bw * 65536), sy = Math.round(boxH / bh * 65536);
  const snb = nbS(sx, sy), tnb = nbS(-hw, -hh);
  m.ub(1, 1); m.ub(snb, 5); m.sb(sx, snb); m.sb(sy, snb); m.ub(0, 1); m.ub(tnb, 5); m.sb(-hw, tnb); m.sb(-hh, tnb);
  const mat = m.bytes();
  const r = new BW(); // записи контура: moveTo, fill0 = 1, 4 прямые, конец
  const mvn = nbS(-hw, -hh);
  r.ub(0, 1); r.ub(3, 5); r.ub(mvn, 5); r.sb(-hw, mvn); r.sb(-hh, mvn); r.ub(1, 1);
  const en = Math.max(2, nbS(boxW, boxH));
  [[boxW, 0], [0, boxH], [-boxW, 0], [0, -boxH]].forEach((d) => { r.ub(1, 1); r.ub(1, 1); r.ub(en - 2, 4); r.ub(1, 1); r.sb(d[0], en); r.sb(d[1], en); });
  r.ub(0, 1); r.ub(0, 5);
  return tagBytes(32, Buffer.concat([head, rect, fs1, bid2, mat, Buffer.from([0, 0x10]), r.bytes()]));
}

/* ---------- вектор: настоящие фигуры вместо картинки ---------- */
// Каждая фигура (линия, диск, кольцо, контур) = отдельный DefineShape3 с одной сплошной заливкой, всё лежит в DefineSprite с id старого шейпа:
// сначала обводка (слой снизу), потом тело (белое). Так нет швов между кусками, а цвета из скрипта (Colourise) работают как с картинкой.
const VEC_LIM = { prims: 120, pts: 200, abs: 900 };
function vecCheck(v) {
  const num = (x) => typeof x === 'number' && isFinite(x) && Math.abs(x) <= VEC_LIM.abs;
  const ctr = (c) => Array.isArray(c) ? c.length >= 3 && c.length <= VEC_LIM.pts && c.every((q) => Array.isArray(q) && q.length === 2 && num(q[0]) && num(q[1]))
    : !!c && num(c.x) && num(c.y) && num(c.r) && c.r > 0;
  const lay = (a) => Array.isArray(a) && a.length <= VEC_LIM.prims && a.every((p) => p && ctr(p.o) && (!p.h || (Array.isArray(p.h) && p.h.length <= 4 && p.h.every(ctr))));
  if (!v || !lay(v.body) || !lay(v.out) || !v.body.length) throw new Error('bad shape');
}
function contourPath(c, k, cw) { // -> [{x,y}] опорные точки и признак кривой; цельные числа в twips, cw = по часовой на экране (y вниз)
  if (Array.isArray(c)) {
    let pts = c.map((q) => [Math.round(q[0] * k * 20), Math.round(q[1] * k * 20)]).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
    while (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    let ar = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; ar += a[0] * b[1] - b[0] * a[1]; }
    if ((ar > 0) !== cw) pts.reverse();
    return { pts, curve: false, area: Math.abs(ar) };
  }
  const R = c.r * k * 20, cx = c.x * k * 20, cy = c.y * k * 20, N = 8, th = Math.PI / N, rc = R * (2 - Math.cos(th)), pts = [];
  for (let i = 0; i < N; i++) { // от опорной точки к опорной: контрольная посередине (радиус подобран, чтобы середина кривой лежала на окружности)
    const a0 = i * 2 * th, am = a0 + th;
    pts.push([Math.round(cx + R * Math.cos(a0)), Math.round(cy + R * Math.sin(a0))], [Math.round(cx + rc * Math.cos(am)), Math.round(cy + rc * Math.sin(am))]);
  }
  if (!cw) { // обратный обход: опорные точки в обратном порядке, контрольные между ними
    const an = pts.filter((_, i) => i % 2 === 0), cp = pts.filter((_, i) => i % 2 === 1), r = [];
    for (let i = 0; i < N; i++) { const j = (N - i) % N; r.push(an[j], cp[(j + N - 1) % N]); }
    return { pts: r, curve: true, area: R * R };
  }
  return { pts, curve: true, area: R * R };
}
function vecShapeTag(id, prims, rgb, k) { // prims: [{o, h}] без наложений внутри одного шейпа (дырки обходятся в обратную сторону)
  const paths = []; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const grow = (px, py) => { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); };
  prims.forEach((p) => {
    [[p.o, true]].concat((p.h || []).map((h) => [h, false])).forEach((e) => {
      const r = contourPath(e[0], k, e[1]); if (r.pts.length < (r.curve ? 16 : 3) || r.area < 4) return; paths.push(r);
      r.pts.forEach((q) => grow(q[0], q[1]));
    });
  });
  if (!paths.length) return emptyShapeTag(id);
  const w = new BW(), bnb = nbS(x0, x1, y0, y1);
  w.ub(bnb, 5); w.sb(x0, bnb); w.sb(x1, bnb); w.sb(y0, bnb); w.sb(y1, bnb); w.al();
  const head = Buffer.alloc(2); head.writeUInt16LE(id, 0);
  const styles = Buffer.from([1, 0x00, rgb[0], rgb[1], rgb[2], 255, 0, 0x10]); // 1 сплошная заливка RGBA, 0 линий, 1 бит на заливку
  const r = new BW();
  paths.forEach((pa) => {
    const P = pa.pts, mvn = nbS(P[0][0], P[0][1]);
    r.ub(0, 1); r.ub(5, 5); r.ub(mvn, 5); r.sb(P[0][0], mvn); r.sb(P[0][1], mvn); r.ub(1, 1); // StyleChange: заливка справа = 1, MoveTo
    const edge = (curved, d) => { const n = Math.max(2, nbS.apply(null, d)); r.ub(1, 1); r.ub(curved ? 0 : 1, 1); r.ub(n - 2, 4); if (!curved) r.ub(1, 1); d.forEach((v) => r.sb(v, n)); };
    if (pa.curve) {
      for (let i = 0; i < P.length; i += 2) { const a = P[i], c = P[i + 1], b = P[(i + 2) % P.length]; edge(true, [c[0] - a[0], c[1] - a[1], b[0] - c[0], b[1] - c[1]]); }
    } else {
      for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (a[0] !== b[0] || a[1] !== b[1]) edge(false, [b[0] - a[0], b[1] - a[1]]); }
    }
  });
  r.ub(0, 1); r.ub(0, 5);
  return tagBytes(32, Buffer.concat([head, w.bytes(), styles, r.bytes()]));
}
function emptyShapeTag(id) { // пустой шейп (ничего не рисует)
  const head = Buffer.alloc(2); head.writeUInt16LE(id, 0);
  const w = new BW(); w.ub(1, 5); w.sb(0, 1); w.sb(0, 1); w.sb(0, 1); w.sb(0, 1); w.al();
  return tagBytes(32, Buffer.concat([head, w.bytes(), Buffer.from([0, 0, 0x00, 0x00])]));
}
function vecTags(id, vec, k, nextId) { // -> { buf, used }: шейпы слоёв + DefineSprite c id старого шейпа
  const parts = [], place = []; let n = nextId, depth = 1;
  const add = (prims, rgb) => prims.forEach((p) => {
    if (n > 65535) throw new Error('too many ids');
    parts.push(vecShapeTag(n, [p], rgb, k));
    const pl = Buffer.alloc(5); pl[0] = 2; pl.writeUInt16LE(depth++, 1); pl.writeUInt16LE(n, 3); place.push(tagBytes(26, pl)); n++;
  });
  add(vec.out, vec.olc); add(vec.body, [255, 255, 255]);
  const hd = Buffer.alloc(4); hd.writeUInt16LE(id, 0); hd.writeUInt16LE(1, 2);
  parts.push(tagBytes(39, Buffer.concat([hd].concat(place, [tagBytes(1, Buffer.alloc(0)), tagBytes(0, Buffer.alloc(0))]))));
  return { buf: Buffer.concat(parts), used: n };
}
const DEF_TAGS = new Set([2, 6, 7, 10, 11, 13, 14, 20, 21, 22, 32, 33, 34, 35, 36, 37, 39, 46, 48, 62, 75, 83, 84, 87, 91]);
function freeId(g) { let m = 0; g.tags.forEach((t) => { if (DEF_TAGS.has(t.t) && t.len >= 2) m = Math.max(m, g.full.readUInt16LE(t.pay)); }); return Math.max(40000, m + 1); }

/* ---------- цвета в скрипте (AVM1, DoInitAction класса HUD_RETICLE) ---------- */
// Colourise(mc,r,g,b,a) = ColorTransform(1,1,1,1,r-255,g-255,b-255,0) + _alpha=a (смещение считается внутри).
// ВАЖНО: сама Colourise внутри делает c-255 (проверено по байткоду: 255-c, умножить на -1), поэтому массивы DEFAULT_COLOUR/STYLES хранят
// обычные цвета (по умолчанию белый [255,255,255,100]); писать туда уже вычтенное нельзя (будет c-510 = чёрный). Картинка белая, обводка чёрная.
function scriptActions(f, tg) {
  const acts = []; let p = tg.pay + 2, pool = [];
  while (p < tg.end) {
    const op = f[p]; const addr = p; p++; let len = 0;
    if (op >= 0x80) { len = f.readUInt16LE(p); p += 2; }
    const a = { op, addr, pay: p, len };
    if (op === 0x88) { const c = f.readUInt16LE(p); let q = p + 2; pool = []; for (let i = 0; i < c; i++) { const e = f.indexOf(0, q); pool.push(f.toString('latin1', q, e)); q = e + 1; } }
    if (op === 0x96 && len >= 2 && f[p] === 8) a.cname = pool[f[p + 1]];
    if (op === 0x96 && len === 2 && (f[p] === 8 || f[p] === 4 || f[p] === 5)) a.one = { ty: f[p], v: f[p + 1], at: p };
    if (op === 0x96) { a.names = []; let q = p; while (q < p + len) { const ty = f[q++]; if (ty === 8) { a.names.push(pool[f[q]]); q += 1; } else if (ty === 9) { a.names.push(pool[f.readUInt16LE(q)]); q += 2; } else if (ty === 0) { q = f.indexOf(0, q) + 1; } else if (ty === 4 || ty === 5) q += 1; else if (ty === 1 || ty === 7) q += 4; else if (ty === 6) q += 8; else if (ty !== 2 && ty !== 3) break; } }
    a.int = op === 0x96 && len === 5 && f[p] === 7 ? f.readInt32LE(p + 1) : null;
    acts.push(a); p += len;
  }
  return acts;
}
function patchColours(f, g, cols) { // cols: { def:[r,g,b,a], enemy:[r,g,b,a] }, правка на месте (длины не меняются)
  const tg = g.tags.find((t) => t.t === 59 && f.subarray(t.pay, t.end).includes('DEFAULT_COLOUR') && f.subarray(t.pay, t.end).includes('STYLES'));
  if (!tg) throw new Error('no colour script');
  const A = scriptActions(f, tg);
  const arr4 = (i) => i + 5 < A.length && [0, 1, 2, 3].every((k) => A[i + k].int !== null) && A[i + 4].int === 4 && A[i + 5].op === 0x42;
  const set = (i, c) => { // порядок пушей: a, b, g, r (элемент 0 = последний)
    const v = [c[3], c[2], c[1], c[0]];
    v.forEach((x, k) => f.writeInt32LE(Math.round(x), A[i + k].pay + 1));
  };
  // Colourise сама считает смещение (c-255), поэтому в массивы пишем ОБЫЧНЫЕ r,g,b (0..255) и a (0..100), без вычитания.
  const d = cols.def, e = cols.enemy;
  const di = A.findIndex((a) => a.cname === 'DEFAULT_COLOUR');
  if (di < 0 || !arr4(di + 1)) throw new Error('colour layout');
  const si = A.findIndex((a, i) => i > di && a.cname === 'STYLES');
  const list = []; for (let i = di + 1; i < si; i++) if (arr4(i)) { list.push(i); i += 5; }
  if (list.length !== 5) throw new Error('colour layout');
  set(list[0], d); set(list[1], e); // [0] обычный, [1] наведение на противника
  let n = 0; // сброс DEFAULT_COLOUR в других местах скрипта (SET_RETICLE_LOCKON_TYPE) тоже на наш цвет
  for (let i = si + 1; i < A.length; i++) if (A[i].cname === 'DEFAULT_COLOUR' && arr4(i + 1)) { set(i + 1, d); n++; }
  return { styles: list.length, resets: n };
}

// Видимость прицела после отпускания ПКМ. В оригинале GTA CONTENT._visible = аргумент SET_RETICLE_VISIBLE и false при старте
// (исчезает сразу). Во «втором» варианте во всех трёх местах стоит true (не исчезает). Правка на месте, длины те же (по 2 байта).
function patchVisibility(f, g, mode) { // mode: 'instant' | 'stay'
  const tg = g.tags.find((t) => t.t === 59 && f.subarray(t.pay, t.end).includes('SET_RETICLE_VISIBLE') && f.subarray(t.pay, t.end).includes('DEFAULT_COLOUR'));
  if (!tg) throw new Error('no visibility script');
  const A = scriptActions(f, tg), put = (at, ty, v) => { f[at] = ty; f[at + 1] = v; };
  const one = (fn, last) => {
    const i = A.findIndex((a, k) => a.names && a.names.includes(fn) && A[k + 1] && A[k + 1].op === 0x8e);
    if (i < 0) throw new Error('visibility layout');
    let reg = -1, hit = null;
    for (let k = i + 2; k < A.length && A[k].op !== 0x8e && k < i + 40; k++) {
      if (A[k].op === 0x87 && reg < 0) reg = f[A[k].pay];
      if (A[k].one && A[k].one.ty === 8 && pool(A, f, A[k]) === '_visible' && A[k + 1] && A[k + 1].one && (A[k + 1].one.ty === 5 || A[k + 1].one.ty === 4)) { hit = A[k + 1].one; break; }
    }
    if (!hit) throw new Error('visibility layout');
    if (last) { if (mode === 'stay') put(hit.at, 5, 1); else { if (reg < 0) throw new Error('visibility layout'); put(hit.at, 4, reg); } }
    else put(hit.at, 5, mode === 'stay' ? 1 : 0);
  };
  one('READY', false); one('LOAD_RETICLE', false); one('SET_RETICLE_VISIBLE', true);
}
function pool(A, f, a) { return a.cname; }

/* spec: { center: { w, h, rgba, boxPx }, dyn: 'same' | 'hide' | 'keep', colours: { def, enemy }, vis: 'instant' | 'stay' } */
function patch(buf, spec) {
  const an = analyze(buf), f = an.g.full;
  const cen = an.targets.filter((t) => t.role === 'center'), dyn = an.targets.filter((t) => t.role === 'dynamic');
  if (!cen.length) throw new Error('no reticle shapes');
  const c = spec.center;
  if (spec.vec) vecCheck(spec.vec); else if (!c || !(c.w > 0 && c.w <= 2048 && c.h > 0 && c.h <= 2048) || !c.rgba || c.rgba.length !== c.w * c.h * 4) throw new Error('bad image');
  const boxTw = c ? Math.max(20, Math.min(1600, Math.round(c.boxPx * 20 / 2) * 2)) : 0;
  const ratio = dyn.length ? dyn[0].w / cen[0].w : 1;
  const dynTw = Math.max(20, Math.min(1600, Math.round(boxTw * ratio / 2) * 2));
  const newBmp = {}, newShape = {};
  if (spec.vec) { // вектор: шейпы заменяются спрайтами, картинки не трогаем (лишние остаются в файле, на них никто не ссылается)
    let nid = freeId(an.g); const ra = dyn.length ? dyn[0].w / cen[0].w : 1;
    const put = (t, fn) => { const r = fn(nid); nid = r.used; newShape[t.shape] = r.buf; };
    cen.forEach((t) => put(t, (id) => vecTags(t.shape, spec.vec, 1, id)));
    if (spec.dyn !== 'keep') dyn.forEach((t) => { if (spec.dyn === 'hide') newShape[t.shape] = emptyShapeTag(t.shape); else put(t, (id) => vecTags(t.shape, spec.vec, ra, id)); });
  } else
  cen.forEach((t) => { newBmp[t.bitmap] = bitmapTag(t.bitmap, c.w, c.h, c.rgba); newShape[t.shape] = shapeTag(t.shape, t.ftype, t.bitmap, c.w, c.h, boxTw, boxTw); });
  if (!spec.vec && spec.dyn !== 'keep') {
    dyn.forEach((t) => {
      if (newBmp[t.bitmap]) return; // та же картинка уже занята центром
      if (spec.dyn === 'hide') { newBmp[t.bitmap] = bitmapTag(t.bitmap, 4, 4, Buffer.alloc(64)); newShape[t.shape] = shapeTag(t.shape, t.ftype, t.bitmap, 4, 4, dynTw, dynTw); }
      else { newBmp[t.bitmap] = bitmapTag(t.bitmap, c.w, c.h, c.rgba); newShape[t.shape] = shapeTag(t.shape, t.ftype, t.bitmap, c.w, c.h, dynTw, dynTw); }
    });
  }
  const parts = [f.subarray(0, an.g.p0)];
  an.g.tags.forEach((tg) => {
    let r = null;
    if (BMP_TAGS.has(tg.t)) r = newBmp[f.readUInt16LE(tg.pay)];
    else if (SHAPE_TAGS.has(tg.t)) r = newShape[f.readUInt16LE(tg.pay)];
    parts.push(r || f.subarray(tg.off, tg.end));
  });
  let out = Buffer.concat(parts);
  out.writeUInt32LE(out.length, 4);
  if (spec.colours || spec.vis) { const g2 = open(out); if (spec.colours) patchColours(out, g2, spec.colours); if (spec.vis) patchVisibility(out, g2, spec.vis); }
  if (an.g.comp) out = Buffer.concat([out.subarray(0, 8), zlib.deflateSync(out.subarray(8), { level: 9 })]);
  return out;
}

function info(buf) {
  const an = analyze(buf), cen = an.targets.filter((t) => t.role === 'center');
  const orig = cen.length ? decodeBitmap(an, cen[0].bitmap) : null;
  return {
    sig: an.g.sig, size: buf.length, stage: [Math.round(an.g.rect[1] / 20), Math.round(an.g.rect[3] / 20)],
    targets: an.targets.map((t) => ({ shape: t.shape, bitmap: t.bitmap, role: t.role, w: t.w / 20, h: t.h / 20 })),
    orig: orig ? { w: orig.w, h: orig.h, box: cen[0].w / 20, rgba: orig.rgba } : null
  };
}

/* ---------- IPC ---------- */
function init({ ipcMain, dialog, getWin, log }) {
  let cur = null;
  const okPath = (p) => typeof p === 'string' && path.isAbsolute(p) && /\.(gfx|swf)$/i.test(p);
  const load = (p) => {
    try {
      if (!okPath(p)) return { ok: false, error: 'bad path' };
      const st = fs.statSync(p); if (st.size > MAX_FILE) return { ok: false, error: 'too big' };
      const buf = fs.readFileSync(p), inf = info(buf);
      if (!inf.targets.some((t) => t.role === 'center')) return { ok: false, error: 'no reticle' };
      cur = { path: p, buf };
      return { ok: true, path: p, name: path.basename(p), info: inf };
    } catch (e) { try { log && log('ret:load ' + (e.stack || e)); } catch (x) { /* */ } return { ok: false, error: 'bad file' }; }
  };
  const BASE = path.join(__dirname, 'src', 'hud_reticle.gfx'); // встроенный оригинал, человек свой файл не присылает
  ipcMain.handle('ret:open', async () => load(BASE));
  // req: { w, h, rgba, boxPx, dyn, col:[r,g,b], ecol:[r,g,b], alpha }
  ipcMain.handle('ret:save', async (_e, req) => {
    try {
      if (!cur) return { ok: false, error: 'no file' };
      const vecMode = req.fmt === 'vec';
      const rgba = vecMode ? null : Buffer.from(req.rgba.buffer ? req.rgba.buffer : req.rgba, req.rgba.byteOffset || 0, req.rgba.byteLength);
      const ch = (v) => Math.max(0, Math.min(255, Math.round(+v)));
      const rgb = (a) => { if (!Array.isArray(a) || a.length < 3) throw new Error('bad colour'); return [ch(a[0]), ch(a[1]), ch(a[2])]; };
      const al = Math.max(0, Math.min(100, Math.round(+req.alpha || 100)));
      const vec = vecMode ? { body: req.vec && req.vec.body, out: (req.vec && req.vec.out) || [], olc: req.vec && req.vec.olc ? rgb(req.vec.olc) : [0, 0, 0] } : null;
      const out = patch(cur.buf, { vec, center: vecMode ? null : { w: req.w | 0, h: req.h | 0, rgba, boxPx: +req.boxPx }, dyn: ['same', 'hide', 'keep'].includes(req.dyn) ? req.dyn : 'same', colours: { def: rgb(req.col).concat(al), enemy: rgb(req.ecol).concat(al) }, vis: req.vis === 'stay' ? 'stay' : 'instant' });
      analyze(out); // проверка: результат должен разбираться
      const r = await dialog.showSaveDialog(getWin(), { defaultPath: path.join(require('electron').app.getPath('downloads'), 'hud_reticle.gfx'), filters: [{ name: 'GFX', extensions: ['gfx'] }] });
      if (r.canceled || !r.filePath) return { ok: false, error: 'cancel' };
      const dst = /\.gfx$/i.test(r.filePath) ? r.filePath : r.filePath + '.gfx';
      if (path.resolve(dst) === path.resolve(cur.path)) return { ok: false, error: 'bad path' };
      fs.writeFileSync(dst, out);
      return { ok: true, path: dst, size: out.length };
    } catch (e) { try { log && log('ret:save ' + (e.stack || e)); } catch (x) { /* */ } return { ok: false, error: String(e.message || e) }; }
  });
  ipcMain.handle('ret:reveal', (_e, p) => { try { if (okPath(p)) require('electron').shell.showItemInFolder(p); } catch (e) { /* */ } return true; });
}

module.exports = { init, analyze, patch, info, decodeBitmap, patchColours, patchVisibility };
