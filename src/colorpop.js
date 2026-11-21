/* Свой пикер цвета вместо системного окна Chromium. Подключается в index.html ПЕРВЫМ из скриптов инструментов.
   Перехватывает клик по любому input[type=color] (в том числе созданному позже), открывает окно в стиле приложения,
   пишет значение в сам input и шлёт ему обычные события input (пока тянешь) и change (когда отпустил),
   поэтому обработчики инструментов и Настроек менять не нужно. Цвета берёт из CSS-переменных темы. */
(function () {
"use strict";
var LNG = {
  en: { eye: "Eyedropper", hex: "HEX" },
  ru: { eye: "Пипетка", hex: "HEX" },
  uk: { eye: "Піпетка", hex: "HEX" }
};
function lang() { try { var s = JSON.parse(localStorage.getItem("mh1") || "{}"); return LNG[s.lang] ? s.lang : "en"; } catch (e) { return "en"; } }

var css = ""
+ ".mhp{position:fixed;z-index:400;width:248px;padding:12px;border-radius:var(--r,12px);border:1px solid var(--line);"
+ "background:linear-gradient(var(--panel),var(--panel)),var(--bg);color:var(--text);"
+ "box-shadow:0 18px 48px -12px rgba(0,0,0,.55),0 2px 0 rgba(255,255,255,.03) inset;-webkit-app-region:no-drag;"
+ "-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);animation:mhpIn .14s ease;user-select:none}"
+ "@keyframes mhpIn{from{opacity:0;transform:translateY(-4px) scale(.98)}to{opacity:1;transform:none}}"
+ "body.noanim .mhp{animation:none}"
+ ".mhp-sv{position:relative;height:150px;border-radius:calc(var(--r,12px) - 4px);cursor:crosshair;touch-action:none;"
+ "background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),var(--mhp-h,#f00);box-shadow:0 0 0 1px var(--line)}"
+ ".mhp-k{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2px solid #fff;pointer-events:none;"
+ "box-shadow:0 0 0 1px rgba(0,0,0,.55),0 2px 6px rgba(0,0,0,.45)}"
+ ".mhp-r{display:flex;align-items:center;gap:10px;margin-top:12px}"
+ ".mhp-pv{flex:none;width:30px;height:30px;border-radius:50%;box-shadow:0 0 0 1px var(--line)}"
+ ".mhp-eye{flex:none;width:30px;height:30px;border-radius:50%;border:1px solid var(--line);background:var(--panel2);color:var(--text);display:grid;place-items:center;padding:0;cursor:pointer}"
+ ".mhp-eye:hover{border-color:var(--muted)}.mhp-eye svg{width:16px;height:16px}"
+ ".mhp-hue{position:relative;flex:1;height:12px;border-radius:999px;cursor:pointer;touch-action:none;box-shadow:0 0 0 1px var(--line);"
+ "background:linear-gradient(to right,#f00,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00)}"
+ ".mhp-hue .mhp-k{top:50%;width:16px;height:16px}"
+ ".mhp-f{display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr;gap:8px;margin-top:12px}"
+ ".mhp-f label{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:.7em;font-weight:700;color:var(--muted);letter-spacing:.04em}"
+ ".mhp-f input{width:100%;min-width:0;box-sizing:border-box;height:30px;padding:0 4px;text-align:center;border-radius:calc(var(--r,12px) - 4px);"
+ "border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:.85em;font-family:inherit;outline:0;user-select:text}"
+ ".mhp-f input:focus{border-color:var(--accent,var(--text))}"
+ ".mhp-f input[type=number]{-moz-appearance:textfield}"
+ ".mhp-f input::-webkit-outer-spin-button,.mhp-f input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}";

function injectCss() {
  if (document.getElementById("mhpCss")) return;
  var st = document.createElement("style"); st.id = "mhpCss"; st.textContent = css; document.head.appendChild(st);
}

/* --- цветовая математика --- */
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function hex2(n) { n = Math.round(clamp(n, 0, 255)).toString(16); return n.length < 2 ? "0" + n : n; }
function hsv2rgb(h, s, v) {
  var f = function (n) { var k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}
function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, mx ? d / mx : 0, mx];
}
function parseHex(x) {
  x = String(x || "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(x)) x = x[0] + x[0] + x[1] + x[1] + x[2] + x[2];
  if (!/^[0-9a-f]{6}$/i.test(x)) return null;
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
}

var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></svg>';

var pop = null, cur = null, sig = null, H = 0, S = 0, V = 0, dirty = false;

/* сигнатура нужна, если инструмент перерисовал поле и старый узел пропал из DOM */
function sigOf(el) {
  var s = { cls: el.className || "", attrs: {} }, i, a;
  for (i = 0; i < el.attributes.length; i++) { a = el.attributes[i]; if (a.name.indexOf("data-") === 0) s.attrs[a.name] = a.value; }
  var row = el.closest && el.closest("[data-row]"); if (row) s.row = row.getAttribute("data-row");
  return s;
}
function find(s) {
  var q = 'input[type="color"]', k;
  for (k in s.attrs) if (s.attrs.hasOwnProperty(k)) q += "[" + k + "=\"" + String(s.attrs[k]).replace(/"/g, '\\"') + "\"]";
  var list = document.querySelectorAll(q), i;
  for (i = 0; i < list.length; i++) {
    if (s.row != null) { var r = list[i].closest("[data-row]"); if (!r || r.getAttribute("data-row") !== s.row) continue; }
    return list[i];
  }
  return null;
}
function target() {
  if (cur && cur.isConnected) return cur;
  if (sig) { var n = find(sig); if (n) { cur = n; return n; } }
  return null;
}

function emit(type) {
  var el = target(); if (!el) return;
  el.dispatchEvent(new Event(type, { bubbles: true }));
}
function curRgb() { return hsv2rgb(H, S, V); }
function curHex() { var c = curRgb(); return "#" + hex2(c[0]) + hex2(c[1]) + hex2(c[2]); }

function paint(skip) {
  if (!pop) return;
  var c = curRgb(), hx = curHex();
  pop.style.setProperty("--mhp-h", "hsl(" + Math.round(H) + ",100%,50%)");
  var k = pop.querySelector(".mhp-sv .mhp-k"); k.style.left = (S * 100) + "%"; k.style.top = ((1 - V) * 100) + "%"; k.style.background = hx;
  var hk = pop.querySelector(".mhp-hue .mhp-k"); hk.style.left = (H / 360 * 100) + "%"; hk.style.background = "hsl(" + Math.round(H) + ",100%,50%)";
  pop.querySelector(".mhp-pv").style.background = hx;
  var f = pop.querySelectorAll(".mhp-f input"), vals = [hx.toUpperCase(), Math.round(c[0]), Math.round(c[1]), Math.round(c[2])], i;
  for (i = 0; i < f.length; i++) if (f[i] !== skip) f[i].value = vals[i];
}
function apply(commit) {
  var el = target(); if (!el) return;
  var hx = curHex();
  if (el.value.toLowerCase() !== hx) { el.value = hx; dirty = true; emit("input"); }
  if (commit && dirty) { dirty = false; emit("change"); }
}
function setRgb(r, g, b, from) {
  var t = rgb2hsv(r, g, b);
  if (t[1] > 0 && t[2] > 0) H = t[0];   /* у серого оттенок не теряем */
  S = t[1]; V = t[2];
  paint(from); apply(false);
}

function drag(node, fn) {
  node.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    try { node.setPointerCapture(e.pointerId); } catch (x) {}
    var mv = function (ev) { fn(ev); };
    var up = function () { node.removeEventListener("pointermove", mv); node.removeEventListener("pointerup", up); node.removeEventListener("pointercancel", up); apply(true); };
    node.addEventListener("pointermove", mv); node.addEventListener("pointerup", up); node.addEventListener("pointercancel", up);
    fn(e);
  });
}

function place(el) {
  var r = el.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
  var x = clamp(r.left, 8, Math.max(8, vw - w - 8));
  var y = r.bottom + 8;
  if (y + h > vh - 8) y = r.top - h - 8;
  pop.style.left = x + "px"; pop.style.top = clamp(y, 8, Math.max(8, vh - h - 8)) + "px";
}

function close() {
  if (!pop) return;
  apply(true);
  document.removeEventListener("pointerdown", onDown, true);
  document.removeEventListener("keydown", onKey, true);
  window.removeEventListener("resize", close);
  window.removeEventListener("blur", close);
  if (pop.parentNode) pop.parentNode.removeChild(pop);
  pop = null; cur = null; sig = null; dirty = false;
}
function onDown(e) {
  if (!pop || pop.contains(e.target)) return;
  if (e.target === cur) return;  /* повторный клик по полю закроет click-обработчик (open → тот же input) */
  close();
}
function onKey(e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } }

function open(el) {
  injectCss();
  if (pop) { var same = (el === cur); close(); if (same) return; }
  var L = LNG[lang()], c = parseHex(el.value) || [0, 0, 0], t = rgb2hsv(c[0], c[1], c[2]);
  H = t[0]; S = t[1]; V = t[2]; cur = el; sig = sigOf(el); dirty = false;
  pop = document.createElement("div"); pop.className = "mhp"; pop.setAttribute("role", "dialog");
  pop.innerHTML = '<div class="mhp-sv"><i class="mhp-k"></i></div>'
    + '<div class="mhp-r"><span class="mhp-pv"></span><button type="button" class="mhp-eye" title="' + L.eye + '" aria-label="' + L.eye + '">' + EYE + '</button>'
    + '<div class="mhp-hue"><i class="mhp-k"></i></div></div>'
    + '<div class="mhp-f"><label>' + L.hex + '<input type="text" maxlength="7" spellcheck="false" data-m="hex"></label>'
    + '<label>R<input type="number" min="0" max="255" data-m="0"></label><label>G<input type="number" min="0" max="255" data-m="1"></label><label>B<input type="number" min="0" max="255" data-m="2"></label></div>';
  document.body.appendChild(pop);

  var sv = pop.querySelector(".mhp-sv"), hue = pop.querySelector(".mhp-hue"), eye = pop.querySelector(".mhp-eye");
  drag(sv, function (e) { var b = sv.getBoundingClientRect(); S = clamp((e.clientX - b.left) / b.width, 0, 1); V = 1 - clamp((e.clientY - b.top) / b.height, 0, 1); paint(); apply(false); });
  drag(hue, function (e) { var b = hue.getBoundingClientRect(); H = clamp((e.clientX - b.left) / b.width, 0, 1) * 359.999; paint(); apply(false); });

  var inp = pop.querySelectorAll(".mhp-f input");
  inp[0].addEventListener("input", function () { var p = parseHex(inp[0].value); if (p) setRgb(p[0], p[1], p[2], inp[0]); });
  [1, 2, 3].forEach(function (i) {
    inp[i].addEventListener("input", function () {
      if (inp[i].value === "") return;
      var v = [inp[1].value, inp[2].value, inp[3].value].map(function (x) { return clamp(Math.round(+x) || 0, 0, 255); });
      setRgb(v[0], v[1], v[2], inp[i]);
    });
  });
  pop.querySelectorAll(".mhp-f input").forEach(function (x) {
    x.addEventListener("change", function () { paint(); apply(true); });
    x.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); x.blur(); } });
  });

  if (!window.EyeDropper) eye.style.display = "none";
  else eye.addEventListener("click", function () {
    try { new window.EyeDropper().open().then(function (r) { var p = parseHex(r.sRGBHex); if (p) { setRgb(p[0], p[1], p[2]); apply(true); } }, function () {}); } catch (x) {}
  });

  paint(); place(el);
  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", close);
  window.addEventListener("blur", close);
}

/* перехват системного окна: capture-фаза на document, ловит и созданные позже поля */
document.addEventListener("click", function (e) {
  var el = e.target && e.target.closest ? e.target.closest('input[type="color"]') : null;
  if (!el || el.disabled) return;
  e.preventDefault(); e.stopPropagation();
  open(el);
}, true);

window.MHPicker = { open: open, close: close };
})();
