/* Marly Helper: ядро инструмента «Улучшение фото». Чистый JS без зависимостей.
   Классические алгоритмы (не нейросеть): шумоподавление, Lanczos/Bicubic, обратная проекция, резкость по яркости.
   UPFactory целиком превращается в текст (toString) и запускается в Worker, поэтому внутри нельзя ссылаться на внешние переменные. */
(function (g) {
"use strict";
function UPFactory() {
  var MAXPX = 64e6, MAXSIDE = 16384;

  /* ---------- ядра интерполяции ---------- */
  function sinc(x) { if (x === 0) return 1; x *= Math.PI; return Math.sin(x) / x; }
  var KERN = {
    lanczos:  { s: 3, f: function (x) { x = Math.abs(x); return x < 3 ? sinc(x) * sinc(x / 3) : 0; } },
    bicubic:  { s: 2, f: function (x) { x = Math.abs(x); return x < 1 ? 1.5 * x * x * x - 2.5 * x * x + 1 : x < 2 ? -0.5 * x * x * x + 2.5 * x * x - 4 * x + 2 : 0; } },
    bilinear: { s: 1, f: function (x) { x = Math.abs(x); return x < 1 ? 1 - x : 0; } },
    nearest:  { s: 0.5, f: function () { return 1; } }
  };

  function weights(sn, dn, kn) {
    var k = KERN[kn] || KERN.lanczos, sc = dn / sn, fs = sc < 1 ? sc : 1, sup = k.s / fs;
    var maxT = kn === "nearest" ? 1 : Math.ceil(sup * 2) + 2;
    var start = new Int32Array(dn), cnt = new Int32Array(dn), w = new Float32Array(dn * maxT);
    for (var i = 0; i < dn; i++) {
      if (kn === "nearest") { start[i] = Math.min(sn - 1, Math.max(0, Math.floor((i + 0.5) / sc))); cnt[i] = 1; w[i] = 1; continue; }
      var c = (i + 0.5) / sc - 0.5, lo = Math.max(0, Math.ceil(c - sup)), hi = Math.min(sn - 1, Math.floor(c + sup)), sum = 0, o = i * maxT, n = 0;
      for (var j = lo; j <= hi && n < maxT; j++, n++) { var v = k.f((j - c) * fs); w[o + n] = v; sum += v; }
      if (!n || !sum) { start[i] = Math.min(sn - 1, Math.max(0, Math.round(c))); cnt[i] = 1; w[o] = 1; continue; }
      for (var q = 0; q < n; q++) w[o + q] /= sum;
      start[i] = lo; cnt[i] = n;
    }
    return { start: start, cnt: cnt, w: w, maxT: maxT };
  }

  /* потоковое изменение размера: строки по горизонтали считаются по мере надобности, память ~ несколько строк.
     emit(y, acc) получает готовую строку (Float32Array dw*ch) */
  function resample(src, sw, sh, ch, dw, dh, kn, emit, prog) {
    var kx = weights(sw, dw, kn), ky = weights(sh, dh, kn), rows = {}, pool = [], rl = dw * ch, acc = new Float32Array(rl);
    function hrow(y) {
      var r = rows[y]; if (r) return r;
      r = pool.pop() || new Float32Array(rl);
      var base = y * sw * ch;
      for (var x = 0; x < dw; x++) {
        var s = kx.start[x], n = kx.cnt[x], o = x * kx.maxT, p = base + s * ch;
        if (ch === 4) {
          var a0 = 0, a1 = 0, a2 = 0, a3 = 0;
          for (var k = 0; k < n; k++) { var wv = kx.w[o + k], q = p + k * 4; a0 += wv * src[q]; a1 += wv * src[q + 1]; a2 += wv * src[q + 2]; a3 += wv * src[q + 3]; }
          r[x * 4] = a0; r[x * 4 + 1] = a1; r[x * 4 + 2] = a2; r[x * 4 + 3] = a3;
        } else {
          for (var c = 0; c < ch; c++) { var a = 0; for (var k2 = 0; k2 < n; k2++) a += kx.w[o + k2] * src[p + k2 * ch + c]; r[x * ch + c] = a; }
        }
      }
      rows[y] = r; return r;
    }
    var lastEv = 0;
    for (var y = 0; y < dh; y++) {
      var s0 = ky.start[y], n0 = ky.cnt[y], o0 = y * ky.maxT;
      for (var e = lastEv; e < s0; e++) if (rows[e]) { pool.push(rows[e]); delete rows[e]; }
      lastEv = s0;
      if (n0 === 1) { var r1 = hrow(s0); for (var i1 = 0; i1 < rl; i1++) acc[i1] = r1[i1]; }
      else {
        var ra = hrow(s0), w0 = ky.w[o0];
        for (var i2 = 0; i2 < rl; i2++) acc[i2] = w0 * ra[i2];
        for (var k3 = 1; k3 < n0; k3++) { var rr = hrow(s0 + k3), wk = ky.w[o0 + k3]; for (var i3 = 0; i3 < rl; i3++) acc[i3] += wk * rr[i3]; }
      }
      emit(y, acc);
      if (prog && (y & 63) === 0) prog(y / dh);
    }
  }
  function resizeU8(src, sw, sh, ch, dw, dh, kn, prog) {
    var out = new Uint8ClampedArray(dw * dh * ch), rl = dw * ch;
    resample(src, sw, sh, ch, dw, dh, kn, function (y, acc) { var o = y * rl; for (var i = 0; i < rl; i++) out[o + i] = acc[i]; }, prog);
    return out;
  }

  /* ---------- шумоподавление: билатеральный фильтр (с учётом альфы) ---------- */
  function denoise(px, w, h, hasA, level, prog) {
    var r = level > 45 ? 2 : 1, sig = 7 + level * 0.42, lut = new Float32Array(766), i;
    for (i = 0; i < 766; i++) { var d = i / 3 / sig; lut[i] = Math.exp(-0.5 * d * d); }
    var sp = [], x, y, dy, dx;
    for (dy = -r; dy <= r; dy++) for (dx = -r; dx <= r; dx++) sp.push([dx, dy, Math.exp(-(dx * dx + dy * dy) / (2 * (r * 0.75 + 0.25) * (r * 0.75 + 0.25)))]);
    var out = new Uint8ClampedArray(px.length), nt = sp.length;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var p = (y * w + x) * 4, cr = px[p], cg = px[p + 1], cb = px[p + 2], ca = px[p + 3];
        if (hasA && ca === 0) { out[p] = cr; out[p + 1] = cg; out[p + 2] = cb; out[p + 3] = 0; continue; }
        var sr = 0, sg = 0, sb = 0, sw = 0;
        for (var t = 0; t < nt; t++) {
          var s = sp[t], xx = x + s[0], yy = y + s[1];
          if (xx < 0) xx = 0; else if (xx >= w) xx = w - 1;
          if (yy < 0) yy = 0; else if (yy >= h) yy = h - 1;
          var q = (yy * w + xx) * 4, r2 = px[q], g2 = px[q + 1], b2 = px[q + 2];
          var dd = (r2 > cr ? r2 - cr : cr - r2) + (g2 > cg ? g2 - cg : cg - g2) + (b2 > cb ? b2 - cb : cb - b2);
          var wt = s[2] * lut[dd]; if (hasA) wt *= px[q + 3] / 255;
          sr += wt * r2; sg += wt * g2; sb += wt * b2; sw += wt;
        }
        if (sw > 0) { out[p] = sr / sw; out[p + 1] = sg / sw; out[p + 2] = sb / sw; } else { out[p] = cr; out[p + 1] = cg; out[p + 2] = cb; }
        out[p + 3] = ca;
      }
      if (prog && (y & 31) === 0) prog(y / h);
    }
    return out;
  }

  /* ---------- JPEG: сглаживание цветовых блоков вне краёв ---------- */
  function boxBlurF(a, w, h, rad, tmp) {
    var x, y, i, n = rad * 2 + 1, acc;
    for (y = 0; y < h; y++) {
      var o = y * w; acc = 0;
      for (i = -rad; i <= rad; i++) acc += a[o + Math.min(w - 1, Math.max(0, i))];
      for (x = 0; x < w; x++) {
        tmp[o + x] = acc / n;
        acc += a[o + Math.min(w - 1, x + rad + 1)] - a[o + Math.max(0, x - rad)];
      }
    }
    for (x = 0; x < w; x++) {
      acc = 0;
      for (i = -rad; i <= rad; i++) acc += tmp[Math.min(h - 1, Math.max(0, i)) * w + x];
      for (y = 0; y < h; y++) {
        a[y * w + x] = acc / n;
        acc += tmp[Math.min(h - 1, y + rad + 1) * w + x] - tmp[Math.max(0, y - rad) * w + x];
      }
    }
  }
  function chromaClean(px, w, h, hasA, prog) {
    var out = new Uint8ClampedArray(px), BH = 256, M = 6, rad = 3, y0, x, y;
    for (y0 = 0; y0 < h; y0 += BH) {
      var a = Math.max(0, y0 - M), b = Math.min(h, y0 + BH + M), bh = b - a, n = w * bh;
      var Y = new Float32Array(n), Cb = new Float32Array(n), Cr = new Float32Array(n), tmp = new Float32Array(n), A = hasA ? new Float32Array(n) : null;
      for (y = 0; y < bh; y++) for (x = 0; x < w; x++) {
        var p = ((a + y) * w + x) * 4, r = px[p], g = px[p + 1], bl = px[p + 2], i = y * w + x;
        Y[i] = 0.299 * r + 0.587 * g + 0.114 * bl; Cb[i] = bl - Y[i]; Cr[i] = r - Y[i];
        if (A) { var al = px[p + 3] / 255; A[i] = al; Cb[i] *= al; Cr[i] *= al; }
      }
      var Cb0 = new Float32Array(Cb), Cr0 = new Float32Array(Cr);
      if (A) { for (var z = 0; z < n; z++) if (A[z] > 0) { Cb0[z] /= A[z]; Cr0[z] /= A[z]; } var A2 = new Float32Array(A); boxBlurF(A2, w, bh, rad, tmp); }
      boxBlurF(Cb, w, bh, rad, tmp); boxBlurF(Cr, w, bh, rad, tmp);
      if (A) for (var z2 = 0; z2 < n; z2++) { if (A2[z2] > 0.001) { Cb[z2] /= A2[z2]; Cr[z2] /= A2[z2]; } else { Cb[z2] = Cb0[z2]; Cr[z2] = Cr0[z2]; } }
      for (y = 0; y < bh; y++) {
        var gy = a + y; if (gy < y0 || gy >= y0 + BH) continue;
        for (x = 0; x < w; x++) {
          var i2 = y * w + x, xl = x > 0 ? x - 1 : x, xr = x < w - 1 ? x + 1 : x, yu = y > 0 ? y - 1 : y, yd = y < bh - 1 ? y + 1 : y;
          var gr = Math.abs(Y[y * w + xr] - Y[y * w + xl]) + Math.abs(Y[yd * w + x] - Y[yu * w + x]), k = Math.exp(-(gr * gr) / (2 * 14 * 14));
          var cb = Cb0[i2] + (Cb[i2] - Cb0[i2]) * k, cr = Cr0[i2] + (Cr[i2] - Cr0[i2]) * k, yy = Y[i2], q = (gy * w + x) * 4;
          if (A && A[i2] === 0) continue; out[q] = yy + cr; out[q + 2] = yy + cb; out[q + 1] = (yy - 0.299 * (yy + cr) - 0.114 * (yy + cb)) / 0.587;
        }
      }
      if (prog) prog(Math.min(1, (y0 + BH) / h));
    }
    return out;
  }

  /* ---------- авто-уровни по яркости ---------- */
  function autoLevels(px, w, h, hasA) {
    var hist = new Float64Array(256), n = 0, i, N = w * h;
    for (i = 0; i < N; i++) { var p = i * 4; if (hasA && px[p + 3] < 128) continue; hist[(0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2]) | 0]++; n++; }
    if (n < 100) return;
    var lo = 0, hi = 255, c = 0, t = n * 0.004;
    for (i = 0; i < 256; i++) { c += hist[i]; if (c > t) { lo = i; break; } }
    c = 0; for (i = 255; i >= 0; i--) { c += hist[i]; if (c > t) { hi = i; break; } }
    if (hi - lo < 40) return;
    var gain = Math.min(1.5, 255 / (hi - lo)); if (gain < 1.03) return;
    var mid = (lo + hi) / 2, lut = new Uint8ClampedArray(256);
    for (i = 0; i < 256; i++) lut[i] = 127.5 + (i - mid) * gain;
    for (i = 0; i < N; i++) { var q = i * 4; px[q] = lut[px[q]]; px[q + 1] = lut[px[q + 1]]; px[q + 2] = lut[px[q + 2]]; }
  }

  function premul(px, up) {
    for (var i = 0; i < px.length; i += 4) {
      var a = px[i + 3];
      if (up) { if (a > 0 && a < 255) { var k = 255 / a; px[i] = px[i] * k; px[i + 1] = px[i + 1] * k; px[i + 2] = px[i + 2] * k; } }
      else if (a < 255) { var m = a / 255; px[i] = px[i] * m; px[i + 1] = px[i + 1] * m; px[i + 2] = px[i + 2] * m; }
    }
  }

  /* ---------- резкость и детали (по яркости, плитками) ---------- */
  function boxesForGauss(sigma, n) {
    var wi = Math.sqrt(12 * sigma * sigma / n + 1), wl = Math.floor(wi); if (wl % 2 === 0) wl--;
    var wu = wl + 2, m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4)), r = [];
    for (var i = 0; i < n; i++) r.push((i < m ? wl : wu));
    return r;
  }
  function gaussF(a, w, h, sigma, tmp) {
    var bx = boxesForGauss(sigma, 3);
    for (var i = 0; i < 3; i++) boxBlurF(a, w, h, Math.max(1, (bx[i] - 1) >> 1), tmp);
  }
  function enhance(px, w, h, o, prog) {
    var T = 512, m = Math.ceil(3 * Math.max(o.sigC, o.sigS)) + 3, delta = new Int16Array(w * h), ty, tx, x, y;
    var useS = o.sh > 0, useC = o.dt > 0;
    for (ty = 0; ty < h; ty += T) {
      for (tx = 0; tx < w; tx += T) {
        var x0 = Math.max(0, tx - m), y0 = Math.max(0, ty - m), x1 = Math.min(w, tx + T + m), y1 = Math.min(h, ty + T + m), bw = x1 - x0, bh = y1 - y0, n = bw * bh;
        var L = new Float32Array(n), B1 = null, B2 = null, tmp = new Float32Array(n);
        for (y = 0; y < bh; y++) for (x = 0; x < bw; x++) { var p = ((y0 + y) * w + x0 + x) * 4; L[y * bw + x] = 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2]; }
        if (useS) { B1 = new Float32Array(L); gaussF(B1, bw, bh, o.sigS, tmp); }
        if (useC) { B2 = new Float32Array(L); gaussF(B2, bw, bh, o.sigC, tmp); }
        var cx1 = Math.min(w, tx + T), cy1 = Math.min(h, ty + T);
        for (y = ty; y < cy1; y++) for (x = tx; x < cx1; x++) {
          var i = (y - y0) * bw + (x - x0), l = L[i], d = 0;
          if (useS) d += o.sh * (l - B1[i]);
          if (useC) d += o.dt * (l - B2[i]);
          if (d !== 0) {
            var mn = l, mx = l;
            for (var dy = -1; dy <= 1; dy++) { var yy = Math.min(bh - 1, Math.max(0, y - y0 + dy)); for (var dx = -1; dx <= 1; dx++) { var v = L[yy * bw + Math.min(bw - 1, Math.max(0, x - x0 + dx))]; if (v < mn) mn = v; if (v > mx) mx = v; } }
            var t = l + d, hl = 3 + (mx - mn) * 0.04; if (t > mx + hl) t = mx + hl; else if (t < mn - hl) t = mn - hl;
            d = t - l;
          }
          delta[y * w + x] = Math.max(-32000, Math.min(32000, Math.round(d * 16)));
        }
      }
      if (prog) prog(Math.min(1, (ty + T) / h));
    }
    return delta;
  }
  function applyFinal(px, w, h, delta, o) {
    var cell = Math.max(1, Math.round(o.scale / 2)), sat = 1 + o.sat / 100, gr = o.grain, x, y;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var i = y * w + x, p = i * 4, r = px[p], g = px[p + 1], b = px[p + 2], d = delta ? delta[i] / 16 : 0;
        if (sat !== 1) { var l = 0.299 * r + 0.587 * g + 0.114 * b; r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
        if (gr > 0) {
          var cxx = (x / cell) | 0, cyy = (y / cell) | 0, hs = Math.imul(cxx, 374761393) ^ Math.imul(cyy, 668265263) ^ o.seed; hs = Math.imul(hs ^ (hs >>> 13), 1274126177); hs ^= hs >>> 16;
          var nz = ((hs & 1023) / 1023 + ((hs >>> 10) & 1023) / 1023 - 1), lm = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          d += nz * gr * 1.6 * (1 - Math.pow(Math.abs(lm * 2 - 1), 3) * 0.6);
        }
        px[p] = r + d; px[p + 1] = g + d; px[p + 2] = b + d;
      }
    }
  }

  /* размер результата для заданных настроек (используется и окном) */
  function outSize(w, h, s) {
    var f = 1;
    if (s.mode === "scale") f = s.scale;
    else { var tgt = s.mode === "res" ? s.res : s.custom, lg = Math.max(w, h); f = tgt / lg; if (s.noDown && f < 1) f = 1; }
    f = Math.max(0.05, f);
    var tw = Math.max(1, Math.round(w * f)), th = Math.max(1, Math.round(h * f)), lim = false;
    if (tw > MAXSIDE || th > MAXSIDE || tw * th > MAXPX) {
      var k = Math.min(MAXSIDE / tw, MAXSIDE / th, Math.sqrt(MAXPX / (tw * th)));
      tw = Math.max(1, Math.floor(tw * k)); th = Math.max(1, Math.floor(th * k)); lim = true;
    }
    return { w: tw, h: th, f: tw / w, limited: lim };
  }

  /* ---------- главный конвейер ---------- */
  /* job: { data: Uint8ClampedArray RGBA, w, h, tw, th, s: настройки, cut?: {x,y,w,h} вырезать из результата }; prog(0..1) */
  function run(job, progress) {
    var s = job.s, w = job.w, h = job.h, tw = job.tw, th = job.th, px = job.data, i, hasA = false, N = w * h;
    for (i = 3; i < px.length; i += 4) if (px[i] !== 255) { hasA = true; break; }
    var stages = [];
    if (s.nr > 0) stages.push(["nr", 3]); if (s.jp) stages.push(["jp", 1]); stages.push(["rs", 3]);
    if (s.ibp > 0 && (tw > w || th > h) && s.kern !== "nearest") stages.push(["ibp", 2 * s.ibp]);
    if (s.sh > 0 || s.dt > 0) stages.push(["en", 2]); stages.push(["fin", 1]);
    var tot = 0; stages.forEach(function (x) { tot += x[1]; });
    var done = 0, cur = 0;
    function begin(name) { cur = 0; for (var q = 0; q < stages.length; q++) { if (stages[q][0] === name) { cur = stages[q][1]; return; } done += stages[q][1]; } }
    function pr(name) { var base = 0; for (var q = 0; q < stages.length; q++) { if (stages[q][0] === name) break; base += stages[q][1]; } var wgt = stages[q] ? stages[q][1] : 0; return function (f) { if (progress) progress((base + wgt * Math.min(1, f)) / tot); }; }

    if (s.nr > 0) px = denoise(px, w, h, hasA, s.nr, pr("nr"));
    if (s.jp) px = chromaClean(px, w, h, hasA, pr("jp"));
    if (s.al) autoLevels(px, w, h, hasA);
    if (hasA) { if (px === job.data) px = new Uint8ClampedArray(px); premul(px, false); }

    var R, same = tw === w && th === h;
    if (same) R = px === job.data ? new Uint8ClampedArray(px) : px;
    else R = resizeU8(px, w, h, 4, tw, th, s.kern, pr("rs"));

    if (!same && s.ibp > 0 && (tw > w || th > h) && s.kern !== "nearest") {
      var rl = tw * 4, p2 = pr("ibp"), it;
      for (it = 0; it < s.ibp; it++) {
        var D = resizeU8(R, tw, th, 4, w, h, "lanczos", function (f) { p2((it + f * 0.5) / s.ibp); });
        var E = new Int16Array(N * 4); for (i = 0; i < E.length; i++) E[i] = px[i] - D[i];
        D = null;
        resample(E, w, h, 4, tw, th, "bicubic", function (y, acc) { var o = y * rl; for (var q = 0; q < rl; q++) R[o + q] = R[o + q] + acc[q] * 0.9; }, function (f) { p2((it + 0.5 + f * 0.5) / s.ibp); });
        E = null;
      }
    }
    if (hasA) premul(R, true);

    var delta = null, sc = Math.max(1, tw / w);
    if (s.sh > 0 || s.dt > 0) delta = enhance(R, tw, th, { sh: s.sh / 100, dt: s.dt / 100 * 0.5, sigS: Math.min(3, 0.5 + 0.45 * sc), sigC: Math.min(40, 6 + 3 * sc) }, pr("en"));
    if (delta || s.sat || s.grain) applyFinal(R, tw, th, delta, { scale: sc, sat: s.sat, grain: s.grain, seed: job.seed || 7 });
    if (progress) progress(1);

    if (job.cut) {
      var c = job.cut, cx = Math.max(0, Math.min(tw - 1, c.x | 0)), cy = Math.max(0, Math.min(th - 1, c.y | 0)), cw = Math.min(tw - cx, c.w | 0), ch = Math.min(th - cy, c.h | 0);
      var O = new Uint8ClampedArray(cw * ch * 4);
      for (var yy = 0; yy < ch; yy++) O.set(R.subarray(((cy + yy) * tw + cx) * 4, ((cy + yy) * tw + cx + cw) * 4), yy * cw * 4);
      return { data: O, w: cw, h: ch, hasA: hasA };
    }
    return { data: R, w: tw, h: th, hasA: hasA };
  }
  return { run: run, outSize: outSize, MAXPX: MAXPX, MAXSIDE: MAXSIDE, resizeU8: resizeU8 };
}
g.UPFactory = UPFactory;
if (typeof module !== "undefined" && module.exports) module.exports = { UPFactory: UPFactory };
})(typeof window !== "undefined" ? window : globalThis);
