/* Раздел «Hate Mods Site»: большая кнопка в Инструментах + страница-пульт.
   Сам сайт открывается в отдельном большом окне поверх приложения (main.js: site:open),
   пока оно открыто, приложением можно пользоваться как обычно.
   Настройки (ссылка, описание кнопки) лежат в site.js. Регистрируется в window.TOOLS как скрытый
   инструмент (hidden:true), в сетку карточек не попадает, кнопку рисует index.html (SITEBTN). */
(function () {
"use strict";
var I = {
 ru: { name: "Hate Mods Site", sub: "Самый большой склад модов", title: "Самый большой склад модов «Hate Mods Site»",
  back: "Инструменты", def: "Самый большой склад модов, открывается прямо в приложении.", open: "Открыть сайт",
  openB: "Открыть склад", opened: "Склад открыт в большом окне", mini: "Склад свёрнут", miniS: "Разверни его кнопкой внизу справа.", rest: "Развернуть сайт", load: "Загрузка сайта…", extQ: "Развернуть сайт" },
 uk: { name: "Hate Mods Site", sub: "Найбільший склад модів", title: "Найбільший склад модів «Hate Mods Site»",
  back: "Інструменти", def: "Найбільший склад модів, відкривається прямо в застосунку.", open: "Відкрити сайт",
  openB: "Відкрити склад", opened: "Склад відкрито у великому вікні", mini: "Склад згорнуто", miniS: "Розгорни його кнопкою внизу праворуч.", rest: "Розгорнути сайт", load: "Завантаження сайту…", extQ: "Розгорнути сайт" },
 en: { name: "Hate Mods Site", sub: "The biggest mod warehouse", title: "The biggest mod warehouse “Hate Mods Site”",
  back: "Tools", def: "The biggest mod warehouse, opens right inside the app.", open: "Open site",
  openB: "Open warehouse", opened: "The warehouse is open in a large window", mini: "The warehouse is minimized", miniS: "Restore it with the button at the bottom right.", rest: "Restore site", load: "Loading the site…", extQ: "Restore site" }
};
function T(lg) { return I[lg] || I.ru; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function cfg() { return (window.SITE && typeof window.SITE === "object") ? window.SITE : {}; }
function url() { var u = String(cfg().url || "").trim(); return /^https:\/\//i.test(u) ? u : ""; }
function desc(lg) { var d = cfg().desc, x = ""; if (typeof d === "string") x = d; else if (d) x = d[lg] || d.ru || ""; return String(x || "").trim() || T(lg).def; }

function button(lg) {
  var t = T(lg);
  return '<button class="sitebtn" data-tool="site"><img class="sbl" src="hatemods.png" alt="" draggable="false">'
   + '<span class="sbt"><span class="sbk">' + esc(t.sub) + '</span><span class="sbn">' + esc(t.name) + '</span>'
   + '<span class="sbd">' + esc(desc(lg)) + '</span>'
   + '<span class="sbo">' + esc(t.open) + '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></span></button>';
}
var curLang = "ru", st = 0; // st: 0 склад закрыт (сайт на странице), 1 открыт в большом окне, 2 свёрнут
function view(lg) {
  var t = T(lg), u = url();
  var frame = u ? '<div class="sfr"><iframe id="siteFrame" src="' + esc(u) + '" title="Hate Mods" allow="fullscreen; clipboard-write" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-popups-to-escape-sandbox" referrerpolicy="strict-origin-when-cross-origin"></iframe><span class="sld" id="siteLd">' + esc(t.load) + '</span></div>' : '';
  return '<div class="tvh"><button class="back" data-tool=""><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' + esc(t.back) + '</button>'
   + '<div class="sth"><img src="hatemods.png" alt="" draggable="false"><div class="sthx"><h1>' + esc(t.title) + '</h1></div>'
   + (u ? '<button class="sopen" data-site-open>' + esc(t.openB) + '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/></svg></button>' : '') + '</div></div>'
   + '<div class="sbox" id="sbox" data-s="' + st + '">' + frame
   + '<div class="sph" id="sph"><img class="sbl" src="hatemods.png" alt="" draggable="false"><span class="sphk" id="sphK"></span><span class="sphs" id="sphS"></span></div></div>';
}
function paint() {
  var b = document.getElementById("sbox"); if (!b) return;
  var t = T(curLang);
  b.setAttribute("data-s", st);
  document.getElementById("sph").setAttribute("data-s", st);
  document.getElementById("sphK").textContent = st === 2 ? t.mini : t.opened;
  document.getElementById("sphS").textContent = st === 2 ? t.miniS : "";
}
function footHtml(lg) {
  if (st !== 2) return "";
  return '<button type="button" class="sfoot" id="siteRest" data-site-restore><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6h-2V7.4l-4.3 4.3-1.4-1.4L16.6 6H14zM4 14h2v2.6l4.3-4.3 1.4 1.4L7.4 18H10v2H4z"/></svg>' + esc(T(lg).rest) + '</button>';
}
function paintFoot() {
  var f = document.getElementById("foot"); if (!f) return;
  var o = document.getElementById("siteRest"); if (o) o.remove();
  var h = footHtml(curLang); if (h) f.insertAdjacentHTML("beforeend", h);
}
function setState(n) { st = Number(n) || 0; paint(); paintFoot(); }
function mount(el) {
  var f = el.querySelector("#siteFrame"), l = el.querySelector("#siteLd");
  if (f && l) { f.addEventListener("load", function () { l.style.display = "none"; }); setTimeout(function () { l.style.display = "none"; }, 15000); }
  paint();
}
document.addEventListener("click", function (e) {
  var tg = e.target; if (!tg || !tg.closest) return;
  if (tg.closest("[data-site-restore]")) { if (window.api && window.api.siteRestore) window.api.siteRestore(); return; }
  if (tg.closest("[data-site-open]")) { var u = url(); if (u && window.api && window.api.siteOpen) window.api.siteOpen(u, T(curLang).name); }
});
if (window.api && window.api.onSiteState) window.api.onSiteState(setState);
if (window.api && window.api.siteIsOpen) window.api.siteIsOpen().then(setState).catch(function () {});

window.SITEFOOT = function (lg) { curLang = lg; return footHtml(lg); };
window.SITEBTN = function (lg) { curLang = lg; return button(lg); };
window.TOOLS = (window.TOOLS || []).concat([{ id: "site", hidden: true, ico: "", name: function (lg) { return T(lg).name; }, desc: function (lg) { return desc(lg); },
  view: function (lg) { curLang = lg; return view(lg); }, mount: function (el, lg) { curLang = lg; mount(el); } }]);
})();
