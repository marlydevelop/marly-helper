/* Инструмент «Переименование таймциклов». Подключается после tool-core.js; регистрирует window.TOOLS.
   Человек загружает файл погоды (например w_extrasunny.xml), инструмент находит в нём имя цикла
   (<cycle name="EXTRASUNNY" regions="2">), и для каждого выбранного типа погоды делает копию файла
   с подставленным именем цикла и правильным названием (w_rain.xml, w_rainhalloween.xml и т.д.).
   Правка идёт ПО ТЕКСТУ: меняется только атрибут name у тега <cycle>, остальной файл байт в байт как был.
   Запись на диск делает tc.js (IPC tc:save); без Electron файлы скачиваются по одному. */
(function () {
"use strict";
var I = {
en: {
 name:"Timecycle renamer", desc:"Makes copies of a weather timecycle for every weather type with the right cycle name", back:"Tools",
 sub:"Upload one weather timecycle as an XML file, pick the weather types and get a ready file for each one, with the cycle name and file name set correctly.",
 dropT:"Drop your timecycle .xml here", dropS:"or click to choose a file", file:"File", reading:"Reading the file…",
 fName:"Name", fSize:"Size", fCycle:"Cycle name", fRegions:"Regions", replace:"Replace file", clear:"Remove",
 b:"B", kb:"KB", mb:"MB", types:"Weather types", all:"Select all", none:"Clear", src:"source file",
 notXml:"This is not an .xml file.", noCycle:"No <cycle name=…> tag found. Is this a weather timecycle?", readFail:"Could not read the file.", tooBig:"The file is too large for a timecycle.",
 go:"Create files", goHint:"Load a timecycle first", goNone:"Pick at least one weather type", sel:"Selected", saved:"Saved files", saveFail:"Could not save",
 pick:"Choose a folder for the files", exists:"Files with these names already exist in the folder: {n}", rep:"Replace", cancel:"Cancel"
},
ru: {
 name:"Переименование таймциклов", desc:"Делает копии файла погоды для всех типов погоды с правильным именем цикла", back:"Инструменты",
 sub:"Загрузи один таймцикл погоды в формате XML, выбери типы погоды, и получишь готовый файл для каждой с правильным именем цикла и названием файла.",
 dropT:"Перетащи сюда свой таймцикл (.xml)", dropS:"или нажми, чтобы выбрать файл", file:"Файл", reading:"Читаю файл…",
 fName:"Имя", fSize:"Размер", fCycle:"Имя цикла", fRegions:"Регионов", replace:"Заменить файл", clear:"Убрать",
 b:"Б", kb:"КБ", mb:"МБ", types:"Типы погоды", all:"Выбрать все", none:"Снять все", src:"исходный файл",
 notXml:"Это не .xml файл.", noCycle:"Не найден тег <cycle name=…>. Это точно таймцикл погоды?", readFail:"Не удалось прочитать файл.", tooBig:"Файл слишком большой для таймцикла.",
 go:"Создать файлы", goHint:"Сначала загрузи таймцикл", goNone:"Выбери хотя бы один тип погоды", sel:"Выбрано", saved:"Сохранено файлов", saveFail:"Не удалось сохранить",
 pick:"Выбери папку для файлов", exists:"В папке уже есть файлы с такими именами: {n}", rep:"Заменить", cancel:"Отмена"
},
uk: {
 name:"Перейменування таймциклів", desc:"Робить копії файлу погоди для всіх типів погоди з правильним іменем циклу", back:"Інструменти",
 sub:"Завантаж один таймцикл погоди у форматі XML, обери типи погоди, і отримаєш готовий файл для кожної з правильним іменем циклу та назвою файлу.",
 dropT:"Перетягни сюди свій таймцикл (.xml)", dropS:"або натисни, щоб обрати файл", file:"Файл", reading:"Читаю файл…",
 fName:"Ім’я", fSize:"Розмір", fCycle:"Ім’я циклу", fRegions:"Регіонів", replace:"Замінити файл", clear:"Прибрати",
 b:"Б", kb:"КБ", mb:"МБ", types:"Типи погоди", all:"Обрати всі", none:"Зняти всі", src:"вихідний файл",
 notXml:"Це не .xml файл.", noCycle:"Не знайдено тег <cycle name=…>. Це точно таймцикл погоди?", readFail:"Не вдалося прочитати файл.", tooBig:"Файл завеликий для таймциклу.",
 go:"Створити файли", goHint:"Спершу завантаж таймцикл", goNone:"Обери хоча б один тип погоди", sel:"Обрано", saved:"Збережено файлів", saveFail:"Не вдалося зберегти",
 pick:"Обери теку для файлів", exists:"У теці вже є файли з такими іменами: {n}", rep:"Замінити", cancel:"Скасувати"
}
};

/* Типы погоды GTA V. Имя цикла = значение из списка, имя файла = w_ + нижний регистр без «_» (RAIN_HALLOWEEN -> w_rainhalloween.xml). */
var TYPES = ["EXTRASUNNY", "CLEAR", "CLEARING", "CLOUDS", "FOGGY", "HALLOWEEN", "NEUTRAL", "OVERCAST", "RAIN", "SMOG", "SNOW", "SNOWLIGHT", "THUNDER", "XMAS", "BLIZZARD", "RAIN_HALLOWEEN", "SNOW_HALLOWEEN"];
var MAX_SRC = 20 * 1024 * 1024;

/* ---------- работа с текстом (чистые функции, без DOM) ---------- */
function fileOf(type) { return "w_" + type.toLowerCase().replace(/_/g, "") + ".xml"; }
function attr(tag, key) { var m = new RegExp("\\b" + key + "\\s*=\\s*([\"'])(.*?)\\1").exec(tag); return m ? m[2] : null; }
function detect(text) {
  var re = /<cycle\b[^>]*>/g, m, first = null, n = 0;
  while ((m = re.exec(text))) { var nm = attr(m[0], "name"); if (nm === null) continue; if (first === null) first = { name: nm, regions: attr(m[0], "regions") }; n++; }
  return first ? { name: first.name, regions: first.regions, count: n } : null;
}
/* Меняет name только у тегов <cycle> с прежним именем oldName; всё остальное остаётся как было. */
function rename(text, oldName, newName) {
  return text.replace(/<cycle\b[^>]*>/g, function (tag) {
    if (attr(tag, "name") !== oldName) return tag;
    return tag.replace(/(\bname\s*=\s*)(["'])(.*?)\2/, function (_s, a, q) { return a + q + newName + q; });
  });
}

/* ---------- состояние (живёт, пока открыто приложение) ---------- */
var lang = "en", root = null;
function blank() { return { name: "", size: 0, text: "", ok: false, err: "", cycle: "", regions: "", srcType: "" }; }
var st = blank(), picked = {}, busy = "", saveMsg = null;

function L(k) { return (I[lang] && I[lang][k]) || I.en[k] || k; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function $(s) { return root ? root.querySelector(s) : null; }
function live() { return root && root.querySelector(".tc-w"); }
function ico(n) { return n === "back" ? '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' : ""; }
function fmt(n) { return n < 1024 ? n + " " + L("b") : n < 1048576 ? (n / 1024).toFixed(1) + " " + L("kb") : (n / 1048576).toFixed(2) + " " + L("mb"); }
function chosen() { return TYPES.filter(function (t) { return picked[t] && t !== st.srcType; }); }

function html(lg) {
  lang = lg || lang;
  return '<button class="back" data-tool="">' + ico("back") + L("back") + '</button><h1>' + esc(L("name")) + '</h1><p class="sub">' + L("sub") + '</p>'
   + '<div class="tc-w tc-g"><div class="card ddf tc-l"><div class="ddfh"><h3>' + L("file") + '</h3><span id="tcBtns"></span></div><div id="tcBody"></div>'
   + '<input type="file" id="tcPick" accept=".xml,text/xml,application/xml" hidden></div>'
   + '<div class="card ddf tc-r"><div class="ddfh"><h3>' + L("types") + '</h3><span id="tcSelBtns"></span></div><div id="tcTypes" class="tc-types"></div>'
   + '<div class="tc-bar"><p class="dsum" id="tcSum"></p><button class="go ddgo" id="tcGo" disabled>' + L("go") + '</button></div></div></div>'
   + (window.CWHINT ? window.CWHINT(lang, "raw") : "");
}

/* ---------- отрисовка ---------- */
function drawTypes() {
  var box = $("#tcTypes"), sb = $("#tcSelBtns"); if (!box) return;
  box.innerHTML = TYPES.map(function (t) {
    var isSrc = t === st.srcType, on = !!picked[t] && !isSrc;
    return '<button class="tc-it" data-type="' + t + '" aria-pressed="' + on + '"' + (isSrc ? " disabled" : "") + '><span class="bx"></span><span class="tx"><b>' + t + '</b><small>' + (isSrc ? L("src") : fileOf(t)) + '</small></span></button>';
  }).join("");
  if (sb) sb.innerHTML = '<button class="mini" id="tcAll">' + L("all") + '</button><button class="mini" id="tcNone">' + L("none") + '</button>';
}
function stat() {
  var go = $("#tcGo"), sum = $("#tcSum"); if (!go || !sum) return;
  var n = chosen().length;
  go.disabled = !(st.ok && n) || !!busy;
  if (!st.name) { sum.className = "dsum"; sum.textContent = L("goHint"); return; }
  if (busy) { sum.className = "dsum"; sum.textContent = busy; return; }
  if (saveMsg) { sum.className = "dsum " + (saveMsg.ok ? "okc" : "erc"); sum.textContent = saveMsg.t; return; }
  if (!st.ok) { sum.className = "dsum erc"; sum.textContent = st.err; return; }
  sum.className = "dsum"; sum.textContent = n ? L("sel") + ": " + n : L("goNone");
}
function sync() {
  if (!live()) return;
  var body = $("#tcBody"), btns = $("#tcBtns");
  if (!st.name) {
    body.innerHTML = '<div class="drop" id="tcDrop"><b>' + L("dropT") + '</b><span>' + L("dropS") + '</span></div>'; btns.innerHTML = "";
  } else {
    body.innerHTML = '<div class="retf"><span>' + L("fName") + ': <b>' + esc(st.name) + '</b></span><span>' + L("fSize") + ': <b>' + fmt(st.size) + '</b></span>'
      + (st.ok ? '<span>' + L("fCycle") + ': <b>' + esc(st.cycle) + '</b></span>' + (st.regions ? '<span>' + L("fRegions") + ': <b>' + esc(st.regions) + '</b></span>' : "") : "") + '</div>';
    btns.innerHTML = '<button class="mini" id="tcRep">' + L("replace") + '</button><button class="mini" id="tcClr">' + L("clear") + '</button>';
  }
  drawTypes(); stat();
}

/* ---------- загрузка ---------- */
function fail(f, msgKey) { busy = ""; st = blank(); st.name = f.name; st.size = f.size; st.err = L(msgKey); sync(); }
function loadFile(f) {
  if (!f) return;
  saveMsg = null;
  if (!/\.xml$/i.test(f.name || "")) { st = blank(); sync(); var s = $("#tcSum"); if (s) { s.className = "dsum erc"; s.textContent = L("notXml"); } return; }
  if (f.size > MAX_SRC) { fail(f, "tooBig"); return; }
  busy = L("reading"); stat();
  f.arrayBuffer().then(function (buf) {
    /* ignoreBOM: BOM остаётся символом в тексте и при записи вернётся на место, файл не меняется */
    var t = new TextDecoder("utf-8", { ignoreBOM: true }).decode(buf);
    var d = detect(t);
    if (!d) { fail(f, "noCycle"); return; }
    var n = blank(); n.name = f.name; n.size = f.size; n.text = t; n.ok = true; n.cycle = d.name; n.regions = d.regions || "";
    n.srcType = TYPES.indexOf(d.name.toUpperCase()) >= 0 ? d.name.toUpperCase() : "";
    picked = {}; TYPES.forEach(function (x) { if (x !== n.srcType) picked[x] = true; });
    busy = ""; st = n; sync();
  }).catch(function () { fail(f, "readFail"); });
}

/* ---------- сохранение ---------- */
function save() {
  if (!st.ok) return;
  var list = chosen(); if (!list.length) return;
  var files = list.map(function (t) { return { name: fileOf(t), text: rename(st.text, st.cycle, t) }; });
  busy = L("reading"); saveMsg = null; stat();
  var done = function (r) {
    busy = "";
    saveMsg = r && r.ok ? { ok: true, t: L("saved") + ": " + r.count + (r.dir ? " → " + r.dir : "") } : (r && r.error === "cancel" ? null : { ok: false, t: L("saveFail") + (r && r.error ? " (" + r.error + ")" : "") });
    stat();
  };
  if (window.api && window.api.tcSave) {
    window.api.tcSave({ files: files, labels: { pick: L("pick"), exists: L("exists"), replace: L("rep"), cancel: L("cancel") } }).then(done, function () { done({ ok: false, error: "ipc" }); });
  } else {
    try {
      files.forEach(function (f, i) {
        setTimeout(function () { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([f.text], { type: "application/xml" })); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); }, i * 250);
      });
      done({ ok: true, count: files.length });
    } catch (e) { done({ ok: false, error: "dl" }); }
  }
}

/* ---------- события ---------- */
function onClick(e) {
  if (!live()) return;
  var t = e.target;
  if (t.closest("#tcDrop") || t.closest("#tcRep")) { var p = $("#tcPick"); if (p) { p.value = ""; p.click(); } return; }
  if (t.closest("#tcClr")) { st = blank(); picked = {}; saveMsg = null; sync(); return; }
  if (t.closest("#tcAll")) { TYPES.forEach(function (x) { picked[x] = true; }); saveMsg = null; drawTypes(); stat(); return; }
  if (t.closest("#tcNone")) { picked = {}; saveMsg = null; drawTypes(); stat(); return; }
  var it = t.closest("[data-type]");
  if (it && !it.disabled) { var k = it.dataset.type; picked[k] = !picked[k]; saveMsg = null; drawTypes(); stat(); return; }
  if (t.closest("#tcGo")) { save(); return; }
}
function onChange(e) { if (live() && e.target && e.target.id === "tcPick") loadFile(e.target.files && e.target.files[0]); }
function onOver(e) { if (!live()) return; e.preventDefault(); var d = $("#tcDrop"); if (d) d.style.borderColor = "var(--accent)"; }
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var d = $("#tcDrop"); if (d) d.style.borderColor = ""; } }
function onDrop(e) { if (!live()) return; e.preventDefault(); var d = $("#tcDrop"); if (d) d.style.borderColor = ""; var fs = e.dataTransfer && e.dataTransfer.files; if (fs && fs.length) loadFile(fs[0]); }
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("click", onClick); root.addEventListener("change", onChange);
  root.addEventListener("dragover", onOver); root.addEventListener("dragleave", onLeave); root.addEventListener("drop", onDrop);
  sync();
}

window.TCT = { html: html, mount: mount, state: function () { return st; }, lib: { detect: detect, rename: rename, fileOf: fileOf, TYPES: TYPES } };
window.TOOLS = (window.TOOLS || []).concat([{ id: "tc", ico: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
