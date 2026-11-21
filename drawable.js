// Чтение моделей GTA V (.ydr, .ydd, .yft; формат Gen8) для 3D-просмотра: геометрия, UV, материалы (диффузные текстуры), скелет.
// Раскладка структур сверена с исходником CodeWalker (Drawable.cs, Frag.cs) и с тестовым .ydr, собранным оригинальным CodeWalker.
// Адреса: 0x5xxxxxxx = системный сегмент, 0x6xxxxxxx = графический (смещение = адрес & 0x0FFFFFFF).
'use strict';
const { sizeFromFlags, joaat } = require('./rpf');
const TX = require('./tex');

const COMP_SIZE = { 1: 4, 2: 4, 3: 8, 4: 4, 5: 8, 6: 12, 7: 16, 8: 4, 9: 4, 10: 4 };
const H_DIFFUSE = joaat('diffusesampler'), H_TEXSAMP = joaat('texturesampler');
function half(h) { const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 31, f = h & 1023; return e === 0 ? s * Math.pow(2, -14) * (f / 1024) : e === 31 ? (f ? NaN : s * Infinity) : s * Math.pow(2, e - 15) * (1 + f / 1024); }

class Rsc {
  constructor(data, sys, gfx, gen9) {
    this.gen9 = !!gen9;
    const sSize = sizeFromFlags(sys), gSize = sizeFromFlags(gfx);
    if (!sSize || data.length < sSize) throw new Error('bad-rsc');
    this.S = data.subarray(0, sSize); this.G = data.subarray(sSize, sSize + gSize);
  }
  sys(p) { if (Number(p >> 28n) !== 5) throw new Error('bad-rsc'); const o = Number(p & 0x0FFFFFFFn); if (o >= this.S.length) throw new Error('bad-rsc'); return o; }
  // данные по адресу в любом сегменте (в игровых файлах вершины и индексы в графическом, у собранных вручную могут быть в системном)
  gfxBuf(p, len) {
    const hi = Number(p >> 28n), seg = hi === 6 ? this.G : hi === 5 ? this.S : null, o = Number(p & 0x0FFFFFFFn);
    if (!seg || o + len > seg.length) throw new Error('bad-rsc');
    return seg.subarray(o, o + len);
  }
}

// Gen9: вершинный буфер описывается VertexDeclarationG9 (52 компоненты со смещениями и форматами), позиция = компонента 0, TEXCOORD0 = 28
function skip(r, why) { (r.notes || (r.notes = [])).push(why); return null; }
function readGeometryG9(r, gp) {
  const S = r.S, g = r.sys(gp);
  const vbP = S.readBigUInt64LE(g + 0x18), ibP = S.readBigUInt64LE(g + 0x38);
  if (!vbP || !ibP) return skip(r, 'no-buffers');
  const vb = r.sys(vbP), ib = r.sys(ibP);
  const vcount = S.readUInt32LE(vb + 8), stride = S.readUInt16LE(vb + 0xC), dataP = S.readBigUInt64LE(vb + 0x18), declP = S.readBigUInt64LE(vb + 0x38);
  if (!stride || !vcount || vcount > 4000000 || !declP) return skip(r, 'vertex-buffer');
  const d = r.sys(declP), posOff = S.readUInt32LE(d), posT = S[d + 0x104], uvOff = S.readUInt32LE(d + 28 * 4), uvT = S[d + 0x104 + 28];
  const buf = r.gfxBuf(dataP, vcount * stride);
  const pos = new Float32Array(vcount * 3), uv = new Float32Array(vcount * 2), hasUv = uvT === 16 || uvT === 34;
  for (let i = 0; i < vcount; i++) {
    const o = i * stride + posOff;
    if (posT === 6 || posT === 2) { pos[i * 3] = buf.readFloatLE(o); pos[i * 3 + 1] = buf.readFloatLE(o + 4); pos[i * 3 + 2] = buf.readFloatLE(o + 8); }
    else if (posT === 10) { pos[i * 3] = half(buf.readUInt16LE(o)); pos[i * 3 + 1] = half(buf.readUInt16LE(o + 2)); pos[i * 3 + 2] = half(buf.readUInt16LE(o + 4)); }
    else return skip(r, 'pos-type-' + posT);
    if (hasUv) { const u = i * stride + uvOff; if (uvT === 16) { uv[i * 2] = buf.readFloatLE(u); uv[i * 2 + 1] = buf.readFloatLE(u + 4); } else { uv[i * 2] = half(buf.readUInt16LE(u)); uv[i * 2 + 1] = half(buf.readUInt16LE(u + 2)); } }
  }
  const icount = S.readUInt32LE(ib + 8), ip = S.readBigUInt64LE(ib + 0x18);
  if (!icount || icount > 30000000) return skip(r, 'no-indices');
  const ibuf = r.gfxBuf(ip, icount * 2), idx = new Uint32Array(icount);
  for (let i = 0; i < icount; i++) { idx[i] = ibuf.readUInt16LE(i * 2); if (idx[i] >= vcount) throw new Error('bad-index'); }
  return { pos, uv, hasUv, idx, vcount, mat: 0 };
}

function readGeometry(r, gp) {
  if (r.gen9) return readGeometryG9(r, gp);
  const S = r.S, g = r.sys(gp);
  const vbP = S.readBigUInt64LE(g + 0x18), ibP = S.readBigUInt64LE(g + 0x38);
  if (!vbP || !ibP) return skip(r, 'no-buffers');
  const vb = r.sys(vbP), ib = r.sys(ibP);
  // данные вершин: основной указатель +0x10, запасной +0x20 (в файлах, пересохранённых сторонними тулами, +0x10 = 0, данные по +0x20)
  const stride = S.readUInt16LE(vb + 8), vcount = S.readUInt32LE(vb + 0x18), dataP = S.readBigUInt64LE(vb + 0x10) || S.readBigUInt64LE(vb + 0x20), declP = S.readBigUInt64LE(vb + 0x30);
  if (!stride || !vcount || vcount > 4000000 || !declP) return skip(r, 'vertex-buffer');
  if (!dataP) return skip(r, 'no-vertex-data');
  const decl = r.sys(declP), flags = S.readUInt32LE(decl), types = S.readBigUInt64LE(decl + 8);
  if (!(flags & 1)) return skip(r, 'no-position'); // позиции обязательны (слот 0)
  // смещения элементов вершины: слоты по порядку, только те, что включены флагами
  const offs = {}, tys = {}; let off = 0;
  for (let k = 0; k < 16; k++) if ((flags >> k) & 1) { const t = Number((types >> BigInt(4 * k)) & 0xFn); offs[k] = off; tys[k] = t; off += COMP_SIZE[t] || 0; }
  const posType = tys[0];
  const buf = r.gfxBuf(dataP, vcount * stride);
  const pos = new Float32Array(vcount * 3), uv = new Float32Array(vcount * 2);
  const hasUv = offs[6] !== undefined && (tys[6] === 5 || tys[6] === 1);
  // цвет вершины (Colour0, слот 4): 4 байта RGBA
  const hasCol = offs[4] !== undefined && (tys[4] === 8 || tys[4] === 9), col = hasCol ? new Uint8Array(vcount * 4) : null;
  // нормаль вершины (слот 3): Float3 / Float4, Half4, Dec3N (10:10:10:2 со знаком)
  const hasNrm = offs[3] !== undefined && (tys[3] === 6 || tys[3] === 7 || tys[3] === 3 || tys[3] === 10), nrm = hasNrm ? new Float32Array(vcount * 3) : null;
  const dec = (x) => { x &= 1023; return (x >= 512 ? x - 1024 : x) / 511; };
  for (let i = 0; i < vcount; i++) {
    const o = i * stride;
    if (posType === 6 || posType === 7) { pos[i * 3] = buf.readFloatLE(o); pos[i * 3 + 1] = buf.readFloatLE(o + 4); pos[i * 3 + 2] = buf.readFloatLE(o + 8); }
    else if (posType === 3) { pos[i * 3] = half(buf.readUInt16LE(o)); pos[i * 3 + 1] = half(buf.readUInt16LE(o + 2)); pos[i * 3 + 2] = half(buf.readUInt16LE(o + 4)); }
    else return skip(r, 'pos-type-' + posType);
    if (hasNrm) {
      const c = o + offs[3];
      if (tys[3] === 10) { const v = buf.readUInt32LE(c); nrm[i * 3] = dec(v); nrm[i * 3 + 1] = dec(v >>> 10); nrm[i * 3 + 2] = dec(v >>> 20); }
      else if (tys[3] === 3) { nrm[i * 3] = half(buf.readUInt16LE(c)); nrm[i * 3 + 1] = half(buf.readUInt16LE(c + 2)); nrm[i * 3 + 2] = half(buf.readUInt16LE(c + 4)); }
      else { nrm[i * 3] = buf.readFloatLE(c); nrm[i * 3 + 1] = buf.readFloatLE(c + 4); nrm[i * 3 + 2] = buf.readFloatLE(c + 8); }
    }
    if (hasCol) { const c = o + offs[4]; col[i * 4] = buf[c]; col[i * 4 + 1] = buf[c + 1]; col[i * 4 + 2] = buf[c + 2]; col[i * 4 + 3] = buf[c + 3]; }
    if (hasUv) {
      const u = o + offs[6];
      if (tys[6] === 5) { uv[i * 2] = buf.readFloatLE(u); uv[i * 2 + 1] = buf.readFloatLE(u + 4); } else { uv[i * 2] = half(buf.readUInt16LE(u)); uv[i * 2 + 1] = half(buf.readUInt16LE(u + 2)); }
    }
  }
  const icount = S.readUInt32LE(ib + 8), ip = S.readBigUInt64LE(ib + 0x10);
  if (!icount || icount > 30000000) return skip(r, 'no-indices');
  const ibuf = r.gfxBuf(ip, icount * 2), idx = new Uint32Array(icount);
  for (let i = 0; i < icount; i++) { idx[i] = ibuf.readUInt16LE(i * 2); if (idx[i] >= vcount) throw new Error('bad-index'); }
  return { pos, uv, hasUv, col, nrm, idx, vcount, mat: 0 };
}

// ShaderGroup: встроенные текстуры и материалы (диффузная текстура по хэшу diffusesampler)
function readShaders(r, sgPtr) {
  const S = r.S, out = { dict: null, mats: [] };
  const sg = r.sys(sgPtr), dp = S.readBigUInt64LE(sg + 8), shp = S.readBigUInt64LE(sg + 0x10), cnt = S.readUInt16LE(sg + 0x18);
  if (dp) { try { out.dict = TX.readDictAt(S, r.G, r.sys(dp)); } catch (e) { out.dict = null; } }
  if (!shp || cnt > 512) return out;
  const arr = r.sys(shp);
  for (let i = 0; i < cnt; i++) {
    const m = { tex: '', shader: 0 };
    try {
      const sp = S.readBigUInt64LE(arr + i * 8); if (!sp) { out.mats.push(m); continue; }
      const sh = r.sys(sp), pp = S.readBigUInt64LE(sh), n = S[sh + 0x10];
      m.shader = S.readUInt32LE(sh + 8);
      if (pp && n && n < 64) {
        const p = r.sys(pp); let extra = 0; const recs = [];
        for (let k = 0; k < n; k++) { const t = S[p + k * 16]; recs.push([t, S.readBigUInt64LE(p + k * 16 + 8)]); extra += t === 0 ? 0 : 16 * t; }
        const hOff = p + n * 16 + extra;
        let first = '';
        for (let k = 0; k < n; k++) {
          if (recs[k][0] !== 0 || !recs[k][1]) continue;
          const hash = S.readUInt32LE(hOff + k * 4), tb = r.sys(recs[k][1]), np = Number(S.readBigUInt64LE(tb + 0x28) & 0x0FFFFFFFn);
          let e = np; while (e < S.length && S[e] !== 0) e++;
          const nm = S.toString('latin1', np, e);
          if (hash === H_DIFFUSE) { m.tex = nm; break; }
          if (hash === H_TEXSAMP && !first) first = nm;
        }
        if (!m.tex) m.tex = first;
      }
    } catch (e) { /* материал без текстуры */ }
    out.mats.push(m);
  }
  return out;
}

function qmul(a, b) { return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]]; }
function qrot(q, v) { const t = [2 * (q[1] * v[2] - q[2] * v[1]), 2 * (q[2] * v[0] - q[0] * v[2]), 2 * (q[0] * v[1] - q[1] * v[0])]; return [v[0] + q[3] * t[0] + (q[1] * t[2] - q[2] * t[1]), v[1] + q[3] * t[1] + (q[2] * t[0] - q[0] * t[2]), v[2] + q[3] * t[2] + (q[0] * t[1] - q[1] * t[0])]; }
// Кости: локальные поворот и сдвиг в структуре кости, мировые положения считаем по иерархии родителей (поза покоя)
function readSkeleton(r, skp) {
  const S = r.S, sk = r.sys(skp), n = S.readUInt16LE(sk + 0x5E), bp = S.readBigUInt64LE(sk + 0x20);
  if (!n || n > 1024 || !bp) return null;
  const b = r.sys(bp), bones = [];
  for (let i = 0; i < n; i++) {
    const o = b + i * 0x50, np = Number(S.readBigUInt64LE(o + 0x38) & 0x0FFFFFFFn);
    let e = np; while (e < S.length && S[e] !== 0) e++;
    bones.push({ name: S.toString('latin1', np, e), parent: S.readInt16LE(o + 0x32), q: [S.readFloatLE(o), S.readFloatLE(o + 4), S.readFloatLE(o + 8), S.readFloatLE(o + 12)], t: [S.readFloatLE(o + 0x10), S.readFloatLE(o + 0x14), S.readFloatLE(o + 0x18)], pos: null, wq: null });
  }
  const solve = (i, depth) => {
    const bn = bones[i]; if (bn.pos || depth > 1024) return;
    const par = bn.parent >= 0 && bn.parent < n && bn.parent !== i ? bones[bn.parent] : null;
    if (par) { solve(bn.parent, depth + 1); const rt = qrot(par.wq, bn.t); bn.pos = [par.pos[0] + rt[0], par.pos[1] + rt[1], par.pos[2] + rt[2]]; bn.wq = qmul(par.wq, bn.q); }
    else { bn.pos = bn.t.slice(); bn.wq = bn.q.slice(); }
  };
  for (let i = 0; i < n; i++) solve(i, 0);
  return bones.map((x) => ({ name: x.name, parent: x.parent, pos: x.pos }));
}

function readDrawableAt(r, base) {
  const S = r.S, out = { lods: {}, mats: [], dict: null, bones: null, bbMin: [S.readFloatLE(base + 0x30), S.readFloatLE(base + 0x34), S.readFloatLE(base + 0x38)], bbMax: [S.readFloatLE(base + 0x40), S.readFloatLE(base + 0x44), S.readFloatLE(base + 0x48)] };
  const sgp = S.readBigUInt64LE(base + 0x10);
  if (sgp && !r.gen9) { try { const sh = readShaders(r, sgp); out.mats = sh.mats; out.dict = sh.dict; } catch (e) { /* без материалов */ } }
  const skp = S.readBigUInt64LE(base + 0x18);
  if (skp) { try { out.bones = readSkeleton(r, skp); } catch (e) { out.bones = null; } }
  r.notes = [];
  [['high', 0x50], ['med', 0x58], ['low', 0x60], ['vlow', 0x68]].forEach(([name, off]) => {
    const lp = S.readBigUInt64LE(base + off); if (!lp) return;
    const geoms = [];
    try {
      const h = r.sys(lp), arrP = S.readBigUInt64LE(h), cap = S.readUInt16LE(h + 10);
      if (!arrP || cap > 256) { skip(r, name + ':models'); return; }
      const arr = r.sys(arrP);
      for (let i = 0; i < cap; i++) {
        try {
          const mp = S.readBigUInt64LE(arr + i * 8); if (!mp) continue;
          const m = r.sys(mp), gArr = S.readBigUInt64LE(m + 8), n = S.readUInt16LE(m + 0x10), smp = S.readBigUInt64LE(m + 0x20);
          if (!gArr || n > 256) continue;
          const ga = r.sys(gArr), sm = smp ? r.sys(smp) : -1;
          for (let k = 0; k < n; k++) {
            try {
              const gp = S.readBigUInt64LE(ga + k * 8); if (!gp) continue;
              const g = readGeometry(r, gp);
              if (g) { g.mat = sm >= 0 ? S.readUInt16LE(sm + k * 2) : 0; geoms.push(g); }
            } catch (e) { skip(r, name + ':' + (e && e.message || 'geometry')); }
          }
        } catch (e) { skip(r, name + ':' + (e && e.message || 'model')); }
      }
    } catch (e) { skip(r, name + ':' + (e && e.message || 'lod')); }
    if (geoms.length) out.lods[name] = geoms;
  });
  out.notes = r.notes.slice(0, 6); r.notes = [];
  return out;
}

// kind: 'ydr' | 'ydd' | 'yft'. Возвращает список отрисовываемых объектов
function readModel(kind, data, sys, gfx, ver) {
  const r = new Rsc(data, sys, gfx, (ver & 0xFF) === 159), S = r.S, items = [];
  if (kind === 'ydr') items.push({ name: '', d: readDrawableAt(r, 0) });
  else if (kind === 'yft') { const p = S.readBigUInt64LE(0x30); if (!p) throw new Error('bad-rsc'); items.push({ name: '', d: readDrawableAt(r, r.sys(p)) }); }
  else if (kind === 'ydd') {
    const hp = S.readBigUInt64LE(0x20), hc = S.readUInt16LE(0x28), dp = S.readBigUInt64LE(0x30), dc = S.readUInt16LE(0x38);
    if (!dp || dc > 4096) throw new Error('bad-rsc');
    const hs = hp ? r.sys(hp) : -1, da = r.sys(dp);
    for (let i = 0; i < dc; i++) {
      const p = S.readBigUInt64LE(da + i * 8); if (!p) continue;
      const name = hs >= 0 && i < hc ? '0x' + S.readUInt32LE(hs + i * 4).toString(16).padStart(8, '0') : '';
      try { items.push({ name, d: readDrawableAt(r, r.sys(p)) }); } catch (e) { items.push({ name, d: null, err: String(e && e.message || 'object') }); }
    }
  } else throw new Error('bad-rsc');
  return items;
}

// Сводная сетка одного LOD: positions, uv, indices и группы по материалам [{s, c, m}]
function mesh(d, lod) {
  const order = lod ? [lod] : ['high', 'med', 'low', 'vlow'];
  let geoms = null; for (const l of order) if (d.lods[l]) { geoms = d.lods[l]; break; }
  if (!geoms) return null;
  const used = order.find((l) => d.lods[l]);
  let nv = 0, ni = 0; geoms.forEach((g) => { nv += g.vcount; ni += g.idx.length - (g.idx.length % 3); });
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni), groups = [];
  const col = geoms.some((g) => g.col) ? new Uint8Array(nv * 4).fill(255) : null, nrm = geoms.some((g) => g.nrm) ? new Float32Array(nv * 3) : null;
  let vo = 0, io = 0;
  for (const g of geoms) {
    pos.set(g.pos, vo * 3); uv.set(g.uv, vo * 2); if (col && g.col) col.set(g.col, vo * 4); if (nrm && g.nrm) nrm.set(g.nrm, vo * 3);
    const n = g.idx.length - (g.idx.length % 3);
    for (let i = 0; i < n; i++) idx[io + i] = g.idx[i] + vo;
    const last = groups[groups.length - 1];
    if (last && last.m === g.mat) last.c += n; else groups.push({ s: io, c: n, m: g.mat });
    vo += g.vcount; io += n;
  }
  return { pos, uv, col, nrm, idx, groups, lod: used };
}

// Все объекты сразу: items = [{d}], remaps[i][материал объекта] = общий индекс материала. Группы получают o = номер объекта.
function meshAll(items, lod, remaps) {
  const parts = [];
  items.forEach((it, i) => { if (!it.d) return; const m = mesh(it.d, lod && it.d.lods[lod] ? lod : null); if (m) parts.push({ i, m }); });
  if (!parts.length) return null;
  let nv = 0, ni = 0; parts.forEach((p) => { nv += p.m.pos.length / 3; ni += p.m.idx.length; });
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni), groups = [], objs = {};
  const col = parts.some((p) => p.m.col) ? new Uint8Array(nv * 4).fill(255) : null, nrm = parts.some((p) => p.m.nrm) ? new Float32Array(nv * 3) : null;
  let vo = 0, io = 0;
  for (const { i, m } of parts) {
    pos.set(m.pos, vo * 3); uv.set(m.uv, vo * 2); if (col && m.col) col.set(m.col, vo * 4); if (nrm && m.nrm) nrm.set(m.nrm, vo * 3);
    for (let k = 0; k < m.idx.length; k++) idx[io + k] = m.idx[k] + vo;
    for (const g of m.groups) {
      const mm = remaps && remaps[i] && remaps[i][g.m] !== undefined ? remaps[i][g.m] : -1, last = groups[groups.length - 1];
      if (last && last.o === i && last.m === mm && last.s + last.c === io + g.s) last.c += g.c; else groups.push({ s: io + g.s, c: g.c, m: mm, o: i });
    }
    objs[i] = { tris: m.idx.length / 3, lod: m.lod };
    vo += m.pos.length / 3; io += m.idx.length;
  }
  return { pos, uv, col, nrm, idx, groups, objs };
}

// Текстуры материалов: сначала встроенный словарь, потом внешний (extDict = {textures, G}); результат по индексу материала
let dictIds = 0;
function materialTextures(d, extDicts, maxDim, only, cache) {
  const dicts = []; if (d.dict) dicts.push(d.dict); (extDicts || []).forEach((x) => dicts.push(x));
  return d.mats.map((m, i) => {
    const o = { name: m.tex || '' };
    if (!m.tex || (only && !only.has(i))) return o;
    const low = m.tex.toLowerCase();
    for (const dc of dicts) {
      const t = dc.textures.find((x) => x.name.toLowerCase() === low);
      if (!t) continue;
      const key = (dc.__id || (dc.__id = ++dictIds)) + ':' + low;
      let p = cache && cache.has(key) ? cache.get(key) : undefined;
      if (p === undefined) { p = TX.payload(t, dc.G, maxDim) || null; if (cache) cache.set(key, p); }
      if (p) return Object.assign(o, p);
    }
    return o;
  });
}

module.exports = { readModel, mesh, meshAll, readDrawableAt, materialTextures, Rsc };
