/* Инструмент «Color Picker». Подключается после tool-gs.js; регистрирует window.TOOLS.
   Выбор цвета (квадрат насыщенности/яркости, оттенок, прозрачность), ввод HEX/RGB, пипетка (EyeDropper),
   коды во всех нужных форматах (HEX, RGB, HSL, HSV, float 0–1 для таймциклов, 0xAARRGGBB, decimal), гармонии,
   контраст и сохранённые цвета (localStorage mh_cp). Файлов не пишет, IPC не нужен. */
(function () {
"use strict";
var I = {
en: {
 name:"Color Picker", desc:"Pick a color and get its codes: HEX, RGB, HSL, float, ARGB and more", back:"Tools",
 sub:"Pick a color on the field, type a code or use the eyedropper. Click any code to copy it.",
 pick:"Picker", eye:"Eyedropper", hue:"Hue", alpha:"Opacity", prev:"Preview", was:"Was", now:"Now",
 hex:"HEX", paste:"Paste any color: #ff8800, rgb(255,136,0), hsl(32 100% 50%), 0xFFFF8800",
 codes:"Codes", copied:"Copied", copyFail:"Could not copy", copyHint:"Click a code to copy",
 contrast:"Contrast", onW:"On white", onB:"On black", aaa:"AAA", aa:"AA", aal:"AA large", fail:"Low",
 harmony:"Harmony", compl:"Complementary", analog:"Analogous", triad:"Triadic", split:"Split", tetra:"Tetradic", shades:"Shades",
 saved:"Saved colors", save:"Save color", empty:"No saved colors yet. Press «Save color».", del:"Remove", clear:"Clear all",
 fHex:"HEX", fHex8:"HEX + alpha", fRgb:"RGB", fRgba:"RGBA", fHsl:"HSL", fHsv:"HSV", fFloat:"Float 0–1 (R G B A)", fByte:"0–255 (R G B A)", fArgb:"ARGB hex", fDec:"Decimal (RGB)", fDecA:"Decimal (ARGB)",
 noEye:"Eyedropper is not available here"
},
ru: {
 name:"Color Picker", desc:"Выбор цвета и его коды: HEX, RGB, HSL, float, ARGB и другие", back:"Инструменты",
 sub:"Выбери цвет на поле, введи код или возьми пипеткой. Нажми на любой код, чтобы скопировать.",
 pick:"Выбор цвета", eye:"Пипетка", hue:"Оттенок", alpha:"Прозрачность", prev:"Предпросмотр", was:"Было", now:"Стало",
 hex:"HEX", paste:"Вставь любой цвет: #ff8800, rgb(255,136,0), hsl(32 100% 50%), 0xFFFF8800",
 codes:"Коды", copied:"Скопировано", copyFail:"Не удалось скопировать", copyHint:"Нажми на код, чтобы скопировать",
 contrast:"Контраст", onW:"На белом", onB:"На чёрном", aaa:"AAA", aa:"AA", aal:"AA крупный", fail:"Низкий",
 harmony:"Гармония", compl:"Комплементарные", analog:"Аналогичные", triad:"Триада", split:"Раздельно-комплементарные", tetra:"Тетрада", shades:"Оттенки",
 saved:"Сохранённые цвета", save:"Сохранить цвет", empty:"Сохранённых цветов пока нет. Нажми «Сохранить цвет».", del:"Убрать", clear:"Очистить всё",
 fHex:"HEX", fHex8:"HEX + альфа", fRgb:"RGB", fRgba:"RGBA", fHsl:"HSL", fHsv:"HSV", fFloat:"Float 0–1 (R G B A)", fByte:"0–255 (R G B A)", fArgb:"ARGB hex", fDec:"Decimal (RGB)", fDecA:"Decimal (ARGB)",
 noEye:"Пипетка тут недоступна"
},
uk: {
 name:"Color Picker", desc:"Вибір кольору та його коди: HEX, RGB, HSL, float, ARGB та інші", back:"Інструменти",
 sub:"Обери колір на полі, введи код або візьми піпеткою. Натисни на будь-який код, щоб скопіювати.",
 pick:"Вибір кольору", eye:"Піпетка", hue:"Відтінок", alpha:"Прозорість", prev:"Попередній перегляд", was:"Було", now:"Стало",
 hex:"HEX", paste:"Встав будь-який колір: #ff8800, rgb(255,136,0), hsl(32 100% 50%), 0xFFFF8800",
 codes:"Коди", copied:"Скопійовано", copyFail:"Не вдалося скопіювати", copyHint:"Натисни на код, щоб скопіювати",
 contrast:"Контраст", onW:"На білому", onB:"На чорному", aaa:"AAA", aa:"AA", aal:"AA великий", fail:"Низький",
 harmony:"Гармонія", compl:"Комплементарні", analog:"Аналогові", triad:"Тріада", split:"Роздільно-комплементарні", tetra:"Тетрада", shades:"Відтінки",
 saved:"Збережені кольори", save:"Зберегти колір", empty:"Збережених кольорів поки немає. Натисни «Зберегти колір».", del:"Прибрати", clear:"Очистити все",
 fHex:"HEX", fHex8:"HEX + альфа", fRgb:"RGB", fRgba:"RGBA", fHsl:"HSL", fHsv:"HSV", fFloat:"Float 0–1 (R G B A)", fByte:"0–255 (R G B A)", fArgb:"ARGB hex", fDec:"Decimal (RGB)", fDecA:"Decimal (ARGB)",
 noEye:"Піпетка тут недоступна"
}
};

/* ---------- цвет (чистые функции, без DOM) ---------- */
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function hsv2rgb(h, s, v) {
  var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
  if (d) {
    if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return { h: h, s: mx ? d / mx : 0, v: mx };
}
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2, h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return { h: h, s: s, l: l };
}
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function h2(n) { var s = Math.round(clamp(n, 0, 255)).toString(16).toUpperCase(); return s.length < 2 ? "0" + s : s; }
function hexOf(c) { return "#" + h2(c[0]) + h2(c[1]) + h2(c[2]); }
function lum(c) {
  var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}
function ratio(a, b) { var x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); }
function fl(n) { return (Math.round(n * 1000) / 1000).toFixed(3); }
/* Разбор строки: #rgb, #rgba, #rrggbb, #rrggbbaa, rrggbb, 0xAARRGGBB, rgb()/rgba(), hsl()/hsla(). Возвращает {r,g,b,a} (a 0..1) или null. */
function parse(str) {
  var s = String(str || "").trim(), m;
  if (!s) return null;
  if ((m = /^0x([0-9a-f]{8})$/i.exec(s))) { var v = m[1]; return { a: parseInt(v.slice(0, 2), 16) / 255, r: parseInt(v.slice(2, 4), 16), g: parseInt(v.slice(4, 6), 16), b: parseInt(v.slice(6, 8), 16) }; }
  if ((m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s))) {
    var x = m[1]; if (x.length <= 4) x = x.split("").map(function (c) { return c + c; }).join("");
    return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16), a: x.length === 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1 };
  }
  var num = "(-?\\d*\\.?\\d+)(%?)";
  if ((m = new RegExp("^rgba?\\(\\s*" + num + "[\\s,]+" + num + "[\\s,]+" + num + "(?:[\\s,/]+" + num + ")?\\s*\\)$", "i").exec(s))) {
    var ch = function (v, p) { v = parseFloat(v); return Math.round(clamp(p ? v * 2.55 : v, 0, 255)); };
    var al = m[7] !== undefined ? clamp(parseFloat(m[7]) / (m[8] ? 100 : 1), 0, 1) : 1;
    return { r: ch(m[1], m[2]), g: ch(m[3], m[4]), b: ch(m[5], m[6]), a: al };
  }
  if ((m = new RegExp("^hsla?\\(\\s*(-?\\d*\\.?\\d+)(?:deg)?[\\s,]+" + num + "[\\s,]+" + num + "(?:[\\s,/]+" + num + ")?\\s*\\)$", "i").exec(s))) {
    var c2 = hsl2rgb(parseFloat(m[1]), clamp(parseFloat(m[2]) / 100, 0, 1), clamp(parseFloat(m[4]) / 100, 0, 1));
    return { r: c2[0], g: c2[1], b: c2[2], a: m[6] !== undefined ? clamp(parseFloat(m[6]) / (m[7] ? 100 : 1), 0, 1) : 1 };
  }
  return null;
}

/* ---------- состояние (живёт, пока открыто приложение) ---------- */
var lang = "en", root = null, KEY = "mh_cp";
var cur = { h: 28, s: 0.85, v: 1, a: 1 }, was = { h: 28, s: 0.85, v: 1, a: 1 }, saved = [], drag = "", msgT = 0;
try { var sv = JSON.parse(localStorage.getItem(KEY) || "{}"); if (sv && sv.list instanceof Array) saved = sv.list.filter(function (x) { return typeof x === "string" && parse(x); }).slice(0, 24); if (sv && sv.cur && typeof sv.cur.h === "number") { cur = { h: clamp(sv.cur.h, 0, 360), s: clamp(sv.cur.s, 0, 1), v: clamp(sv.cur.v, 0, 1), a: clamp(sv.cur.a, 0, 1) }; was = { h: cur.h, s: cur.s, v: cur.v, a: cur.a }; } } catch (e) {}
function persist() { try { localStorage.setItem(KEY, JSON.stringify({ list: saved, cur: cur })); } catch (e) {} }

function L(k) { return (I[lang] && I[lang][k]) || I.en[k] || k; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function $(s) { return root ? root.querySelector(s) : null; }
function live() { return root && root.querySelector(".cp-w"); }
function rgbOf(c) { return hsv2rgb(c.h, c.s, c.v); }
function hex8Of(c) { var r = rgbOf(c); return hexOf(r) + h2(c.a * 255); }
function fromRgb(r, g, b, a) {
  var o = rgb2hsv(r, g, b);
  cur = { h: (o.s === 0 || o.v === 0) ? cur.h : o.h, s: o.s, v: o.v, a: a === undefined ? cur.a : clamp(a, 0, 1) };
}
var ICO = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M14 4l6 6M4 20l1-4 9-9 3 3-9 9-4 1zM15 5l4-1 1 4"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

function formats() {
  var c = rgbOf(cur), a = cur.a, al = Math.round(a * 100) / 100, hl = rgb2hsl(c[0], c[1], c[2]), a8 = Math.round(a * 255);
  var dec = (c[0] << 16) | (c[1] << 8) | c[2], decA = (((a8 << 24) >>> 0) + dec) >>> 0;
  return [
    ["fHex", hexOf(c)],
    ["fHex8", hex8Of(cur)],
    ["fRgb", "rgb(" + c[0] + ", " + c[1] + ", " + c[2] + ")"],
    ["fRgba", "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + al + ")"],
    ["fHsl", "hsl(" + Math.round(hl.h) + ", " + Math.round(hl.s * 100) + "%, " + Math.round(hl.l * 100) + "%)"],
    ["fHsv", "hsv(" + Math.round(cur.h) + ", " + Math.round(cur.s * 100) + "%, " + Math.round(cur.v * 100) + "%)"],
    ["fFloat", fl(c[0] / 255) + ", " + fl(c[1] / 255) + ", " + fl(c[2] / 255) + ", " + fl(a)],
    ["fByte", c[0] + ", " + c[1] + ", " + c[2] + ", " + a8],
    ["fArgb", "0x" + h2(a8) + h2(c[0]) + h2(c[1]) + h2(c[2])],
    ["fDec", String(dec)],
    ["fDecA", String(decA)]
  ];
}

/* ---------- разметка ---------- */
function html(lg) {
  lang = lg || lang;
  return '<button class="back" data-tool="">' + ICO.back + esc(L("back")) + '</button><h1>' + esc(L("name")) + '</h1><p class="sub">' + esc(L("sub")) + '</p>'
   + '<div class="cp-w">'
   + '<div class="card ddf cp-l"><div class="ddfh"><h3>' + esc(L("pick")) + '</h3><span><button class="mini cp-eye" id="cpEye">' + ICO.eye + esc(L("eye")) + '</button></span></div>'
   + '<div class="cp-sv" id="cpSv"><i class="cp-hd" id="cpSvH"></i></div>'
   + '<div class="cp-lb">' + esc(L("hue")) + '</div><div class="cp-sl cp-hue" id="cpHue"><i class="cp-hd"></i></div>'
   + '<div class="cp-lb">' + esc(L("alpha")) + '</div><div class="cp-sl cp-al" id="cpAl"><b id="cpAlB"></b><i class="cp-hd"></i></div>'
   + '<div class="cp-pv"><button class="cp-was" id="cpWas" title="' + esc(L("was")) + '"><u></u><span>' + esc(L("was")) + '</span></button><div class="cp-now"><u id="cpNow"></u><span>' + esc(L("now")) + '</span></div></div>'
   + '<div class="cp-ins"><label>' + esc(L("hex")) + '<input id="cpHex" spellcheck="false" autocomplete="off" maxlength="40"></label>'
   + '<label>R<input id="cpR" type="number" min="0" max="255"></label><label>G<input id="cpG" type="number" min="0" max="255"></label><label>B<input id="cpB" type="number" min="0" max="255"></label><label>A %<input id="cpA" type="number" min="0" max="100"></label></div>'
   + '<p class="cp-hint">' + esc(L("paste")) + '</p></div>'
   + '<div class="cp-r"><div class="card ddf"><div class="ddfh"><h3>' + esc(L("codes")) + '</h3><span class="cp-msg" id="cpMsg">' + esc(L("copyHint")) + '</span></div><div id="cpCodes" class="cp-codes"></div></div>'
   + '<div class="card ddf"><div class="ddfh"><h3>' + esc(L("contrast")) + '</h3></div><div id="cpCon" class="cp-con"></div></div></div>'
   + '<div class="card ddf cp-f"><div class="ddfh"><h3>' + esc(L("harmony")) + '</h3></div><div id="cpHar" class="cp-har"></div></div>'
   + '<div class="card ddf cp-f"><div class="ddfh"><h3>' + esc(L("saved")) + '</h3><span><button class="mini" id="cpSave">' + esc(L("save")) + '</button><button class="mini" id="cpClr">' + esc(L("clear")) + '</button></span></div><div id="cpSaved" class="cp-sw"></div></div>'
   + '</div>';
}

/* ---------- отрисовка ---------- */
function sw(hex8, extra) {
  var c = parse(hex8), hx = hex8.slice(0, 7).toUpperCase();
  return '<button class="cp-s" data-c="' + hex8 + '" title="' + hx + '" ' + (extra || "") + '><u style="background:' + hx + '"></u><span>' + hx + '</span></button>';
}
function harmony() {
  var c = rgbOf(cur), hl = rgb2hsl(c[0], c[1], c[2]);
  var rot = function (d) { var r = hsl2rgb(hl.h + d, hl.s, hl.l); return hexOf(r) + h2(cur.a * 255); };
  var row = function (k, arr) { return '<div class="cp-hr"><b>' + esc(L(k)) + '</b><div class="cp-sw">' + arr.map(function (x) { return sw(x); }).join("") + '</div></div>'; };
  var shades = [0.12, 0.25, 0.4, 0.55, 0.7, 0.85].map(function (l) { return hexOf(hsl2rgb(hl.h, hl.s, l)) + h2(cur.a * 255); });
  return row("compl", [rot(0), rot(180)]) + row("analog", [rot(-30), rot(0), rot(30)]) + row("triad", [rot(0), rot(120), rot(240)])
    + row("split", [rot(0), rot(150), rot(210)]) + row("tetra", [rot(0), rot(90), rot(180), rot(270)]) + row("shades", shades);
}
function badge(r) { return r >= 7 ? L("aaa") : r >= 4.5 ? L("aa") : r >= 3 ? L("aal") : L("fail"); }
function contrast() {
  var c = rgbOf(cur), hx = hexOf(c), rw = ratio(c, [255, 255, 255]), rb = ratio(c, [0, 0, 0]);
  var tile = function (bg, k, r) { return '<div class="cp-ct" style="background:' + bg + '"><b style="color:' + hx + '">Aa</b><span style="color:' + (bg === "#FFFFFF" ? "#1b1d21" : "#eceef1") + '">' + esc(L(k)) + '<br>' + r.toFixed(2) + ' · ' + esc(badge(r)) + '</span></div>'; };
  return tile("#FFFFFF", "onW", rw) + tile("#000000", "onB", rb);
}
function drawSaved() {
  var b = $("#cpSaved"); if (!b) return;
  b.innerHTML = saved.length ? saved.map(function (x, i) { return '<div class="cp-sx">' + sw(x) + '<button class="cp-rm" data-del="' + i + '" title="' + esc(L("del")) + '">' + ICO.x + '</button></div>'; }).join("") : '<p class="cp-hint">' + esc(L("empty")) + '</p>';
}
function drawCodes() {
  var b = $("#cpCodes"); if (!b) return;
  b.innerHTML = formats().map(function (f) { return '<button class="cp-code" data-copy="' + esc(f[1]) + '"><span>' + esc(L(f[0])) + '</span><code>' + esc(f[1]) + '</code>' + ICO.copy + '</button>'; }).join("");
}
function paint(skip) {
  if (!live()) return;
  var c = rgbOf(cur), hx = hexOf(c), pure = hexOf(hsv2rgb(cur.h, 1, 1));
  var sv = $("#cpSv"), hu = $("#cpHue"), al = $("#cpAl");
  sv.style.background = "linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff," + pure + ")";
  var h = $("#cpSvH"); h.style.left = cur.s * 100 + "%"; h.style.top = (1 - cur.v) * 100 + "%"; h.style.background = hx;
  hu.firstChild.style.left = cur.h / 360 * 100 + "%"; hu.firstChild.style.background = pure;
  $("#cpAlB").style.background = "linear-gradient(to right,transparent," + hx + ")";
  al.lastChild.style.left = cur.a * 100 + "%"; al.lastChild.style.background = hx;
  var wc = rgbOf(was); root.querySelector("#cpWas u").style.background = "rgba(" + wc[0] + "," + wc[1] + "," + wc[2] + "," + was.a + ")";
  $("#cpNow").style.background = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + cur.a + ")";
  var set = function (id, v) { var e = $(id); if (e && e !== document.activeElement) e.value = v; };
  set("#cpHex", cur.a < 1 ? hex8Of(cur) : hx); set("#cpR", c[0]); set("#cpG", c[1]); set("#cpB", c[2]); set("#cpA", Math.round(cur.a * 100));
  var hi = $("#cpHex"); if (hi) hi.classList.remove("bad");
  drawCodes(); $("#cpCon").innerHTML = contrast(); $("#cpHar").innerHTML = harmony();
  persist();
}
function say(t) { var m = $("#cpMsg"); if (!m) return; m.textContent = t; m.classList.add("on"); clearTimeout(msgT); msgT = setTimeout(function () { var m2 = $("#cpMsg"); if (m2) { m2.textContent = L("copyHint"); m2.classList.remove("on"); } }, 1600); }
function copy(t) {
  var ok = function () { say(L("copied") + ": " + t); };
  var fb = function () {
    try { var ta = document.createElement("textarea"); ta.value = t; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select(); var r = document.execCommand("copy"); ta.remove(); r ? ok() : say(L("copyFail")); } catch (e) { say(L("copyFail")); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
}

/* ---------- события ---------- */
function slide(e, el) { var r = el.getBoundingClientRect(); return { x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1) }; }
function drag1(e) {
  if (!drag || !live()) return;
  if (drag === "sv") { var p = slide(e, $("#cpSv")); cur.s = p.x; cur.v = 1 - p.y; }
  else if (drag === "hue") { cur.h = Math.min(359.99, slide(e, $("#cpHue")).x * 360); }
  else if (drag === "al") { cur.a = Math.round(slide(e, $("#cpAl")).x * 100) / 100; }
  paint();
}
function end() { drag = ""; document.removeEventListener("pointermove", drag1); document.removeEventListener("pointerup", end); document.removeEventListener("pointercancel", end); }
function onDown(e) {
  if (!live() || e.button) return;
  var t = e.target, k = t.closest("#cpSv") ? "sv" : t.closest("#cpHue") ? "hue" : t.closest("#cpAl") ? "al" : "";
  if (!k) return;
  e.preventDefault(); drag = k; drag1(e);
  document.addEventListener("pointermove", drag1); document.addEventListener("pointerup", end); document.addEventListener("pointercancel", end);
}
function onInput(e) {
  if (!live()) return;
  var id = e.target && e.target.id;
  if (id === "cpHex") { var p = parse(e.target.value); e.target.classList.toggle("bad", !p); if (p) { fromRgb(p.r, p.g, p.b, /^#?([0-9a-f]{4}|[0-9a-f]{8})$/i.test(e.target.value.trim()) || /^0x/i.test(e.target.value.trim()) || /^(rgba|hsla)/i.test(e.target.value.trim()) ? p.a : 1); paint(); } return; }
  if (id === "cpR" || id === "cpG" || id === "cpB") {
    var v = function (i) { var n = parseInt($(i).value, 10); return isNaN(n) ? 0 : clamp(n, 0, 255); };
    fromRgb(v("#cpR"), v("#cpG"), v("#cpB")); paint(); return;
  }
  if (id === "cpA") { var n = parseInt(e.target.value, 10); if (!isNaN(n)) { cur.a = clamp(n, 0, 100) / 100; paint(); } }
}
function applyHex(h8) { var p = parse(h8); if (p) { fromRgb(p.r, p.g, p.b, p.a); paint(); } }
function onClick(e) {
  if (!live()) return;
  var t = e.target, b;
  if ((b = t.closest("[data-copy]"))) { copy(b.dataset.copy); return; }
  if ((b = t.closest("[data-del]"))) { saved.splice(parseInt(b.dataset.del, 10), 1); drawSaved(); persist(); return; }
  if ((b = t.closest(".cp-s"))) { applyHex(b.dataset.c); return; }
  if (t.closest("#cpWas")) { cur = { h: was.h, s: was.s, v: was.v, a: was.a }; paint(); return; }
  if (t.closest("#cpSave")) { var x = hex8Of(cur); if (saved.indexOf(x) < 0) { saved.unshift(x); saved = saved.slice(0, 24); } was = { h: cur.h, s: cur.s, v: cur.v, a: cur.a }; paint(); drawSaved(); return; }
  if (t.closest("#cpClr")) { saved = []; drawSaved(); persist(); return; }
  if (t.closest("#cpEye")) {
    if (!window.EyeDropper) { say(L("noEye")); return; }
    try { new window.EyeDropper().open().then(function (r) { applyHex(r.sRGBHex); }, function () {}); } catch (er) { say(L("noEye")); }
  }
}
function onPaste(e) {
  if (!live() || !e.target || e.target.id === "cpHex") return;
}
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("pointerdown", onDown); root.addEventListener("input", onInput); root.addEventListener("click", onClick); root.addEventListener("paste", onPaste);
  if (!live()) return;
  var eb = $("#cpEye"); if (eb && !window.EyeDropper) eb.style.display = "none";
  paint(); drawSaved();
}

/* стили инструмента (свои, с префиксом cp-; цвета только из переменных темы) */
(function () {
  if (document.getElementById("cpStyle")) return;
  var s = document.createElement("style"); s.id = "cpStyle";
  s.textContent =
".cp-w{display:grid;grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:14px;align-items:start;margin-top:18px}"
+ ".cp-w .cp-f{grid-column:1/-1}"
+ ".cp-r{display:grid;gap:14px;min-width:0}"
+ ".cp-sv{position:relative;height:210px;border-radius:calc(var(--r) - 2px);border:1px solid var(--line);cursor:crosshair;touch-action:none;margin-bottom:14px;user-select:none}"
+ ".cp-hd{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.4);pointer-events:none}"
+ ".cp-lb{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}"
+ ".cp-sl{position:relative;height:14px;border-radius:999px;border:1px solid var(--line);margin-bottom:14px;cursor:pointer;touch-action:none;user-select:none}"
+ ".cp-hue{background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}"
+ ".cp-al{background:repeating-conic-gradient(var(--panel2) 0 25%,var(--panel) 0 50%) 0 0/10px 10px}"
+ ".cp-al b{position:absolute;inset:0;border-radius:inherit}"
+ ".cp-sl .cp-hd{top:50%;margin-top:-9px}"
+ ".cp-pv{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:4px 0 14px}"
+ ".cp-pv u,.cp-was u{display:block;height:54px;border-radius:calc(var(--r) - 4px);border:1px solid var(--line);background-clip:padding-box;text-decoration:none}"
+ ".cp-pv>div,.cp-was{background:none;border:0;padding:0;text-align:left;color:var(--muted);font-size:11px;font-weight:600;cursor:pointer;position:relative}"
+ ".cp-pv>div{cursor:default}"
+ ".cp-pv u{background-image:repeating-conic-gradient(var(--panel2) 0 25%,var(--panel) 0 50%);background-size:10px 10px}"
+ ".cp-pv span{display:block;margin-top:5px}"
+ ".cp-was:hover{color:var(--text)}"
+ ".cp-ins{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(4,minmax(0,1fr));gap:8px}"
+ ".cp-ins label{display:grid;gap:5px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}"
+ ".cp-ins input{width:100%;min-width:0;font:inherit;font-size:13px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--text);background:var(--panel2);border:1px solid var(--line);border-radius:calc(var(--r) - 4px);padding:8px 9px;outline:0;transition:border-color .15s}"
+ ".cp-ins input:focus{border-color:var(--accent)}.cp-ins input.bad{border-color:#e5484d}"
+ ".cp-ins input[type=number]{-moz-appearance:textfield}.cp-ins input::-webkit-outer-spin-button,.cp-ins input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}"
+ ".cp-hint{margin:10px 0 0;color:var(--muted);font-size:12px}"
+ ".cp-eye svg,.cp-code svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}"
+ ".cp-eye{display:inline-flex;align-items:center;gap:6px}"
+ ".cp-msg{font-size:12px;color:var(--muted);max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle;transition:color .2s}.cp-msg.on{color:var(--text)}"
+ ".cp-codes{display:grid;gap:6px}"
+ ".cp-code{display:flex;align-items:center;gap:12px;width:100%;text-align:left;color:var(--text);background:none;border:1px solid var(--line);border-radius:calc(var(--r) - 4px);padding:9px 12px;transition:border-color .15s,background .15s}"
+ ".cp-code:hover{border-color:var(--muted);background:var(--panel2)}.cp-code:active{border-color:var(--accent)}"
+ ".cp-code span{flex:0 0 150px;font-size:12px;font-weight:600;color:var(--muted)}"
+ ".cp-code code{flex:1;min-width:0;font-family:ui-monospace,Consolas,monospace;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
+ ".cp-code svg{color:var(--muted)}"
+ ".cp-con{display:grid;grid-template-columns:1fr 1fr;gap:10px}"
+ ".cp-ct{display:flex;align-items:center;gap:12px;padding:14px;border-radius:calc(var(--r) - 4px);border:1px solid var(--line)}"
+ ".cp-ct b{font-size:30px;line-height:1}.cp-ct span{font-size:12px;font-weight:600;line-height:1.5}"
+ ".cp-har{display:grid;gap:12px}.cp-hr{display:grid;grid-template-columns:170px minmax(0,1fr);gap:12px;align-items:center}.cp-hr>b{font-size:12px;color:var(--muted);font-weight:600}"
+ ".cp-sw{display:flex;flex-wrap:wrap;gap:8px}"
+ ".cp-s{display:flex;flex-direction:column;align-items:center;gap:5px;background:none;border:0;padding:0;color:var(--muted);font-size:10.5px;font-weight:600;font-family:ui-monospace,Consolas,monospace}"
+ ".cp-s u{display:block;width:58px;height:38px;border-radius:calc(var(--r) - 5px);border:1px solid var(--line);transition:transform .15s,border-color .15s;text-decoration:none}"
+ ".cp-s:hover{color:var(--text)}.cp-s:hover u{transform:translateY(-2px);border-color:var(--muted)}"
+ ".cp-sx{position:relative}.cp-rm{position:absolute;top:-6px;right:-6px;width:18px;height:18px;padding:0;display:none;place-items:center;border-radius:50%;border:1px solid var(--line);background:var(--panel);color:var(--muted)}"
+ ".cp-sx:hover .cp-rm{display:grid}.cp-rm:hover{color:var(--text);border-color:var(--muted)}.cp-rm svg{width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round}"
+ "@media(max-width:900px){.cp-w{grid-template-columns:minmax(0,1fr)}.cp-hr{grid-template-columns:1fr}.cp-code span{flex-basis:110px}}";
  document.head.appendChild(s);
})();

window.CPT = { html: html, mount: mount, state: function () { return cur; }, lib: { parse: parse, hsv2rgb: hsv2rgb, rgb2hsv: rgb2hsv, rgb2hsl: rgb2hsl, hsl2rgb: hsl2rgb, ratio: ratio } };
window.TOOLS = (window.TOOLS || []).concat([{ id: "cp", ico: '<path d="M12 3a9 9 0 100 18c1.2 0 2-.8 2-1.8 0-.6-.3-1-.6-1.4-.3-.4-.4-.7-.4-1.1 0-.9.7-1.7 1.7-1.7H17a4 4 0 004-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
