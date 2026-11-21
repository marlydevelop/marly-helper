/* Инструмент «Texture Tool Kit». Подключается до основного скрипта; регистрирует window.TOOLS.
   Человек закидывает файл игры (.ytd .ydd .ydr .yft .ypt), видит текстуры с миниатюрами и может заменить, добавить, удалить и экспортировать их.
   Работа идёт движком программы Texture Toolkit (bin/ttk, ttk.js, IPC ttk:*) на рабочей копии: оригинал меняется только по «Сохранить».
   Интерфейс: window.TTK.html(lang), window.TTK.mount(rootEl, lang). Состояние живёт в модуле и переживает перерисовку. */
(function () {
"use strict";
var I = {
en: {
 name:"Texture Tool Kit", desc:"Replace, add, export and delete textures inside YTD, YDD, YDR, YFT and YPT files", back:"Tools",
 sub:"Drop a game file, pick a texture and replace it with your image. Changes go to a working copy; the original changes only when you press Save.",
 dropT:"Drop a file here", dropS:"YTD, YDD, YDR, YFT, YPT · or click to browse", noapp:"Texture Tool Kit works in the desktop app only", nowin:"Texture Tool Kit works on Windows only", noeng:"The engine files (bin/ttk) are missing from the app",
 file:"File", open:"Open another", close:"Close", modified:"Modified", textures:"Textures", dict:"Dictionary", search:"Search by name", none:"No textures here", nomatch:"Nothing found",
 prev:"Preview", pick1:"Select a texture to see it", loading:"Loading…", noPrev:"Preview is not available", bgC:"Checker", bgD:"Dark", bgL:"Light",
 acts:"Actions", sel:"Selected", of:"of", replace:"Replace with image…", add:"Add textures…", emptyTex:"Replace with empty texture", expSel:"Export selected", expAll:"Export all", del:"Delete", delAsk:"Delete {n}? Click again", expFmt:"Export as",
 hint:"Drop an image onto a texture to replace it. Drop several files on the list: textures with the same name are replaced, the rest are added.",
 opts:"Image settings", oFmt:"Format when replacing", keep:"Same as the texture", oMip:"Mipmaps", mKeep:"As in the texture", mAuto:"Full chain", mOff:"Off", oFit:"Resize to the texture size", oFitS:"Keeps the in-game size and UVs", oAdd:"Format of new textures",
 save:"Save", saveAsk:"Overwrite the original? Click again", saveAs:"Save as…", revert:"Revert changes", revAsk:"Discard all changes? Click again", discard:"Discard the changes of the open file?",
 working:"Working…", reading:"Reading the file…", okRep:"Replaced: {n}", okAdd:"added: {n}", okDel:"deleted: {n}", errs:"errors: {n}", exported:"Exported: {n}", saved:"Saved", openFolder:"Open folder", nothing:"Nothing was changed",
 nomod:"The Texture Tool Kit module did not load. Check log.txt and restart the app",
 e_ttk_notex:"This file has no textures to edit.",
 e_ttk_win:"Texture Tool Kit works on Windows only.", e_ttk_missing:"The Texture Toolkit files (bin/ttk) are missing from the app.", e_ttk_fail:"The engine could not process the file. Details are in the app log (ttk).",
 e_ttk_bad_type:"Unsupported file. Use .ytd, .ydd, .ydr, .yft or .ypt (legacy GTA V resources).", e_ttk_big:"The file is too big.", e_ttk_vcrt:"The engine could not start. Install Visual C++ 2013 Runtime (x86) and try again.",
 e_ttk_nobin:"The conversion engine is missing (bin folder).", e_ttk_save:"Could not save the file.", e_not_found:"File not found.", e_bad_path:"Bad path.", e_ttk_nofile:"Open a file first."
},
ru: {
 name:"Texture Tool Kit", desc:"Замена, добавление, экспорт и удаление текстур в файлах YTD, YDD, YDR, YFT и YPT", back:"Инструменты",
 sub:"Закинь файл игры, выбери текстуру и замени её своей картинкой. Правки идут в рабочую копию, оригинал меняется только по кнопке «Сохранить».",
 dropT:"Перетащи файл сюда", dropS:"YTD, YDD, YDR, YFT, YPT · или нажми, чтобы выбрать", noapp:"Texture Tool Kit работает только в приложении", nowin:"Texture Tool Kit работает только в Windows", noeng:"В приложении нет файлов движка (bin/ttk)",
 file:"Файл", open:"Открыть другой", close:"Закрыть", modified:"Изменён", textures:"Текстуры", dict:"Словарь", search:"Поиск по имени", none:"Текстур нет", nomatch:"Ничего не найдено",
 prev:"Предпросмотр", pick1:"Выбери текстуру, чтобы увидеть её", loading:"Загрузка…", noPrev:"Предпросмотр недоступен", bgC:"Шахматка", bgD:"Тёмный", bgL:"Светлый",
 acts:"Действия", sel:"Выбрано", of:"из", replace:"Заменить картинкой…", add:"Добавить текстуры…", emptyTex:"Заменить пустой текстурой", expSel:"Экспорт выбранных", expAll:"Экспорт всех", del:"Удалить", delAsk:"Удалить {n}? Нажми ещё раз", expFmt:"Экспортировать как",
 hint:"Перетащи картинку на текстуру, чтобы заменить её. Перетащи несколько файлов в список: текстуры с тем же именем заменятся, остальные добавятся.",
 opts:"Настройки картинки", oFmt:"Формат при замене", keep:"Как у текстуры", oMip:"Мипмапы", mKeep:"Как у текстуры", mAuto:"Полная цепочка", mOff:"Выкл", oFit:"Подогнать под размер текстуры", oFitS:"Размер в игре и UV не поменяются", oAdd:"Формат новых текстур",
 save:"Сохранить", saveAsk:"Перезаписать оригинал? Нажми ещё раз", saveAs:"Сохранить как…", revert:"Отменить правки", revAsk:"Отменить все правки? Нажми ещё раз", discard:"Отбросить изменения открытого файла?",
 working:"Работаю…", reading:"Читаю файл…", okRep:"Заменено: {n}", okAdd:"добавлено: {n}", okDel:"удалено: {n}", errs:"ошибок: {n}", exported:"Экспортировано: {n}", saved:"Сохранено", openFolder:"Открыть папку", nothing:"Ничего не изменилось",
 nomod:"Модуль Texture Tool Kit не загрузился. Проверь log.txt и перезапусти приложение",
 e_ttk_notex:"В этом файле нет текстур для правки.",
 e_ttk_win:"Texture Tool Kit работает только в Windows.", e_ttk_missing:"В приложении нет файлов Texture Toolkit (bin/ttk).", e_ttk_fail:"Движок не смог обработать файл. Подробности в логе приложения (ttk).",
 e_ttk_bad_type:"Файл не поддерживается. Нужен .ytd, .ydd, .ydr, .yft или .ypt (ресурсы GTA V старого формата).", e_ttk_big:"Файл слишком большой.", e_ttk_vcrt:"Движок не запустился. Установи Visual C++ 2013 Runtime (x86) и попробуй снова.",
 e_ttk_nobin:"Нет движка конвертации (папка bin).", e_ttk_save:"Не удалось сохранить файл.", e_not_found:"Файл не найден.", e_bad_path:"Неверный путь.", e_ttk_nofile:"Сначала открой файл."
},
uk: {
 name:"Texture Tool Kit", desc:"Заміна, додавання, експорт і видалення текстур у файлах YTD, YDD, YDR, YFT та YPT", back:"Інструменти",
 sub:"Закинь файл гри, обери текстуру й заміни її своєю картинкою. Правки йдуть у робочу копію, оригінал змінюється лише кнопкою «Зберегти».",
 dropT:"Перетягни файл сюди", dropS:"YTD, YDD, YDR, YFT, YPT · або натисни, щоб обрати", noapp:"Texture Tool Kit працює лише в застосунку", nowin:"Texture Tool Kit працює лише у Windows", noeng:"У застосунку немає файлів рушія (bin/ttk)",
 file:"Файл", open:"Відкрити інший", close:"Закрити", modified:"Змінено", textures:"Текстури", dict:"Словник", search:"Пошук за іменем", none:"Текстур немає", nomatch:"Нічого не знайдено",
 prev:"Попередній перегляд", pick1:"Обери текстуру, щоб побачити її", loading:"Завантаження…", noPrev:"Перегляд недоступний", bgC:"Шахівниця", bgD:"Темний", bgL:"Світлий",
 acts:"Дії", sel:"Обрано", of:"з", replace:"Замінити картинкою…", add:"Додати текстури…", emptyTex:"Замінити порожньою текстурою", expSel:"Експорт обраних", expAll:"Експорт усіх", del:"Видалити", delAsk:"Видалити {n}? Натисни ще раз", expFmt:"Експортувати як",
 hint:"Перетягни картинку на текстуру, щоб замінити її. Перетягни кілька файлів у список: текстури з тим самим іменем замініться, решта додасться.",
 opts:"Налаштування картинки", oFmt:"Формат під час заміни", keep:"Як у текстури", oMip:"Міпмапи", mKeep:"Як у текстури", mAuto:"Повний ланцюжок", mOff:"Вимк", oFit:"Підігнати під розмір текстури", oFitS:"Розмір у грі та UV не зміняться", oAdd:"Формат нових текстур",
 save:"Зберегти", saveAsk:"Перезаписати оригінал? Натисни ще раз", saveAs:"Зберегти як…", revert:"Скасувати правки", revAsk:"Скасувати всі правки? Натисни ще раз", discard:"Відкинути зміни відкритого файлу?",
 working:"Працюю…", reading:"Читаю файл…", okRep:"Замінено: {n}", okAdd:"додано: {n}", okDel:"видалено: {n}", errs:"помилок: {n}", exported:"Експортовано: {n}", saved:"Збережено", openFolder:"Відкрити теку", nothing:"Нічого не змінилося",
 nomod:"Модуль Texture Tool Kit не завантажився. Перевір log.txt і перезапусти застосунок",
 e_ttk_notex:"У цьому файлі немає текстур для правки.",
 e_ttk_win:"Texture Tool Kit працює лише у Windows.", e_ttk_missing:"У застосунку немає файлів Texture Toolkit (bin/ttk).", e_ttk_fail:"Рушій не зміг обробити файл. Подробиці в журналі застосунку (ttk).",
 e_ttk_bad_type:"Файл не підтримується. Потрібен .ytd, .ydd, .ydr, .yft або .ypt (ресурси GTA V старого формату).", e_ttk_big:"Файл завеликий.", e_ttk_vcrt:"Рушій не запустився. Встанови Visual C++ 2013 Runtime (x86) і спробуй знову.",
 e_ttk_nobin:"Немає рушія конвертації (тека bin).", e_ttk_save:"Не вдалося зберегти файл.", e_not_found:"Файл не знайдено.", e_bad_path:"Хибний шлях.", e_ttk_nofile:"Спочатку відкрий файл."
}};

var RES = /\.(ytd|ydd|ydr|yft|ypt)$/i, IMGX = /\.(png|jpe?g|bmp|tga|dds|tiff?)$/i;
var FORMATS = ["DXT1", "DXT3", "DXT5", "ATI1", "ATI2", "A8R8G8B8"];
var lang = "en", root = null, armT = 0;
function blank() { return { open: false, name: "", ext: "", size: 0, path: "", type: "", dirty: false, dicts: [], dsel: 0, sel: [], anchor: -1, q: "", thumbs: {}, prev: {}, prevKey: "", busy: "", msg: null, epoch: 0, thumbBusy: false, arm: "", lastDir: "" }; }
var st = blank(), avail = null, UI = { bg: "check", expFmt: "dds", opts: { fmt: "keep", mip: "keep", fit: 1, addFmt: "DXT5" } };
try { var sv = JSON.parse(localStorage.getItem("mh_ttk") || "null"); if (sv) { if (sv.bg) UI.bg = sv.bg; if (sv.expFmt) UI.expFmt = sv.expFmt; if (sv.opts) Object.keys(UI.opts).forEach(function (k) { if (sv.opts[k] !== undefined) UI.opts[k] = sv.opts[k]; }); } } catch (e) {}
function persist() { try { localStorage.setItem("mh_ttk", JSON.stringify(UI)); } catch (e) {} }
function L(k, v) { var s = (I[lang] && I[lang][k]) || I.en[k] || k; if (v) Object.keys(v).forEach(function (n) { s = s.replace("{" + n + "}", v[n]); }); return s; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function $(s) { return root ? root.querySelector(s) : null; }
function live() { return root && root.querySelector(".tk-g"); }
function api() { return window.api && window.api.ttkOpen ? window.api : null; }
function ico(n) { return n === "back" ? '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' : ""; }
function bytes(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
function errText(r) { var k = "e_" + String((r && r.error) || "ttk_fail").replace(/-/g, "_"); var t = I[lang][k] || I.en[k] || L("e_ttk_fail"); if (r && r.why && /fail|vcrt/.test(String(r.error))) t += " (" + String(r.why).slice(0, 320) + ")"; return t; }

/* ---------- данные ---------- */
function dict() { return st.dicts[st.dsel] || null; }
function texs() { var d = dict(); return d ? d.textures : []; }
function visible() { var q = st.q.trim().toLowerCase(), t = texs(); return q ? t.filter(function (x) { return x.name.toLowerCase().indexOf(q) >= 0; }) : t; }
function tkey(t) { return st.dsel + "|" + t.name; }
function byI(i) { var t = texs(); for (var k = 0; k < t.length; k++) if (t[k].i === i) return t[k]; return null; }
function selTex() { return st.sel.map(byI).filter(Boolean); }
function isSel(i) { return st.sel.indexOf(i) >= 0; }

/* ---------- разметка ---------- */
function seg(k, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button data-k="' + k + '" data-v="' + o[0] + '" aria-pressed="false">' + o[1] + '</button>'; }).join("") + '</div>'; }
function row(label, hint, ctl) { return '<div class="row"><span class="l">' + label + (hint ? '<small>' + hint + '</small>' : "") + '</span>' + ctl + '</div>'; }
function fmtSel(k, withKeep) { return '<select class="inp sel" data-k="' + k + '">' + (withKeep ? '<option value="keep">' + L("keep") + '</option>' : "") + FORMATS.map(function (f) { return '<option value="' + f + '">' + f + '</option>'; }).join("") + '</select>'; }
function html(lg) {
  lang = lg || lang;
  var opts = '<details class="dsec" open><summary>' + L("opts") + '</summary>'
    + row(L("oFmt"), "", fmtSel("fmt", true))
    + row(L("oMip"), "", seg("mip", [["keep", L("mKeep")], ["auto", L("mAuto")], ["off", L("mOff")]]))
    + row(L("oFit"), L("oFitS"), '<button class="chk" role="checkbox" data-k="fit" aria-checked="false"></button>')
    + row(L("oAdd"), "", fmtSel("addFmt", false)) + '</details>';
  return '<button class="back" data-tool="">' + ico("back") + L("back") + '</button><h1>' + esc(L("name")) + '</h1><p class="sub">' + esc(L("sub")) + '</p>'
    + '<div class="tk-g"><div class="card tk-l" id="tkLeft"><div id="tkHead"></div><p class="dsum tk-note" id="tkNote"></p><div id="tkBody"></div></div>'
    + '<div class="tk-r"><div class="card tk-pv"><div class="ddfh"><h3>' + L("prev") + '</h3>' + seg("bg", [["check", L("bgC")], ["dark", L("bgD")], ["light", L("bgL")]]) + '</div>'
    + '<div class="stage tk-stage" id="tkStage"></div><p class="tk-pi" id="tkPi"></p></div>'
    + '<div class="card tk-ac"><div class="ddfh"><h3>' + L("acts") + '</h3><span class="tk-sl" id="tkSl"></span></div><div id="tkAct"></div>' + opts
    + '<div class="tk-sv" id="tkSv"></div><p class="dsum" id="tkSum"></p></div></div></div>';
}

/* ---------- отрисовка ---------- */
function drawHead() {
  var h = $("#tkHead"); if (!h) return;
  if (!st.open) { h.innerHTML = '<div class="ddfh"><h3>' + L("file") + '</h3></div>'; return; }
  var d = st.dicts, opts = d.length > 1 ? '<select class="inp sel tk-dsel" id="tkDict" title="' + esc(L("dict")) + '">' + d.map(function (x, k) { return '<option value="' + k + '"' + (k === st.dsel ? " selected" : "") + '>' + esc(x.name || ("#" + (k + 1))) + " (" + x.textures.length + ")</option>"; }).join("") + "</select>" : "";
  var total = d.reduce(function (a, x) { return a + x.textures.length; }, 0);
  h.innerHTML = '<div class="ddfh"><h3>' + L("file") + '</h3><span><button class="mini" data-act="open">' + L("open") + '</button><button class="mini" data-act="close">' + L("close") + '</button></span></div>'
    + '<div class="tk-fi"><b title="' + esc(st.path) + '">' + esc(st.name) + '</b><span>' + esc(st.ext.slice(1).toUpperCase()) + " · " + bytes(st.size) + " · " + L("textures") + ": " + total + '</span>' + (st.dirty ? '<em>' + L("modified") + '</em>' : "") + '</div>'
    + '<div class="tk-sr">' + opts + '<input class="inp tk-q" id="tkQ" type="text" placeholder="' + esc(L("search")) + '" value="' + esc(st.q) + '" spellcheck="false"></div>';
}
function thumbOf(t) { var u = st.thumbs[tkey(t)]; return u ? '<img src="' + u + '" alt="">' : '<i></i>'; }
function drawList() {
  var b = $("#tkBody"); if (!b) return;
  var keepTop = 0, old = b.querySelector(".tk-list"); if (old) keepTop = old.scrollTop;
  if (!st.open) {
    var msg = avail && avail.mod === false ? L("nomod") : avail && !avail.win ? L("nowin") : avail && !avail.engine ? L("noeng") : !api() ? L("noapp") : "";
    b.innerHTML = '<div class="drop" id="tkDrop"><b>' + L("dropT") + '</b><span>' + (msg ? esc(msg) : L("dropS")) + '</span></div>'; return;
  }
  var v = visible();
  if (!v.length) { b.innerHTML = '<p class="tk-em">' + L(texs().length ? "nomatch" : "none") + '</p>'; return; }
  b.innerHTML = '<div class="tk-list" id="tkList">' + v.map(function (t) {
    return '<div class="tk-it" role="button" tabindex="0" data-i="' + t.i + '" aria-pressed="' + isSel(t.i) + '"><span class="tk-th">' + thumbOf(t) + '</span><span class="tk-tx"><b title="' + esc(t.name) + '">' + esc(t.name) + '</b><small>' + t.w + "×" + t.h + " · " + esc(t.format) + " · " + (t.levels || t.mips || 1) + ' mip</small></span></div>';
  }).join("") + '</div>';
  var l = b.querySelector(".tk-list"); if (l) l.scrollTop = keepTop;
}
/* высота площадки предпросмотра под пропорции текстуры: ширина всегда на всю карточку, высота = ширина / соотношение, в пределах 180 px ... min(70vh, 640 px) */
function fitStage(one) {
  var s = $("#tkStage"); if (!s) return;
  if (!one || !(one.w > 0 && one.h > 0)) { s.style.height = ""; return; }
  var w = s.clientWidth || 360, mx = Math.max(240, Math.min(window.innerHeight * 0.7, 640));
  s.style.height = Math.round(Math.min(mx, Math.max(180, w * one.h / one.w))) + "px";
}
function drawPrev() {
  var s = $("#tkStage"), p = $("#tkPi"); if (!s) return;
  s.className = "stage tk-stage bg-" + UI.bg;
  var sel = selTex(), one = sel.length === 1 ? sel[0] : null;
  fitStage(one);
  if (!one) { s.innerHTML = '<span class="tk-ph">' + L(sel.length > 1 ? "sel" : "pick1") + (sel.length > 1 ? ": " + sel.length : "") + '</span>'; if (p) p.textContent = ""; return; }
  var u = st.prev[tkey(one)];
  s.innerHTML = u === "err" ? '<span class="tk-ph">' + L("noPrev") + '</span>' : u ? '<img' + (one.w < 256 && one.h < 256 ? ' class="px"' : "") + ' src="' + u + '" alt="">' : st.thumbs[tkey(one)] ? '<img class="lq" src="' + st.thumbs[tkey(one)] + '" alt=""><i class="tk-ld"></i>' : '<span class="tk-ph">' + L("loading") + '</span>';
  if (p) p.textContent = one.name + " · " + one.w + "×" + one.h + " · " + one.format + " · " + (one.levels || one.mips || 1) + " mip";
}
function drawAct() {
  var a = $("#tkAct"), sv = $("#tkSv"), sl = $("#tkSl"), go = st.open && !st.busy, n = st.sel.length;
  if (a) {
    var arm = st.arm;
    a.innerHTML = '<div class="tk-b"><button class="mini" data-act="replace"' + (go && n === 1 ? "" : " disabled") + '>' + L("replace") + '</button><button class="mini" data-act="add"' + (go ? "" : " disabled") + '>' + L("add") + '</button><button class="mini" data-act="empty"' + (go && n ? "" : " disabled") + '>' + L("emptyTex") + '</button></div>'
      + '<div class="tk-b"><button class="mini" data-act="expSel"' + (go && n ? "" : " disabled") + '>' + L("expSel") + '</button><button class="mini" data-act="expAll"' + (go ? "" : " disabled") + '>' + L("expAll") + '</button>'
      + '<span class="tk-ef">' + L("expFmt") + ' <span class="seg"><button data-k="expFmt" data-v="dds" aria-pressed="' + (UI.expFmt === "dds") + '">DDS</button><button data-k="expFmt" data-v="png" aria-pressed="' + (UI.expFmt === "png") + '">PNG</button></span></span></div>'
      + '<div class="tk-b"><button class="mini tk-del' + (arm === "del" ? " arm" : "") + '" data-act="del"' + (go && n ? "" : " disabled") + '>' + (arm === "del" ? L("delAsk", { n: n }) : L("del")) + '</button></div>'
      + '<p class="tk-hint">' + L("hint") + '</p>';
  }
  if (sv) sv.innerHTML = '<button class="go' + (st.arm === "save" ? " arm" : "") + '" data-act="save"' + (go && st.dirty ? "" : " disabled") + '>' + (st.arm === "save" ? L("saveAsk") : L("save")) + '</button>'
    + '<div class="tk-b"><button class="mini" data-act="saveAs"' + (go ? "" : " disabled") + '>' + L("saveAs") + '</button><button class="mini" data-act="revert"' + (go && st.dirty ? "" : " disabled") + '>' + (st.arm === "revert" ? L("revAsk") : L("revert")) + '</button></div>';
  if (sl) sl.textContent = st.open && n ? L("sel") + ": " + n + " " + L("of") + " " + texs().length : "";
}
function drawSum() {
  var s = $("#tkSum"), n = $("#tkNote"); if (!s) return;
  var cls = "dsum", h = "";
  if (st.busy) h = esc(st.busy);
  else if (st.msg) { cls += " " + (st.msg.ok ? "okc" : "erc"); h = esc(st.msg.t) + (st.msg.dir ? ' <button class="mini" data-act="reveal" data-dir="' + esc(st.msg.dir) + '">' + L("openFolder") + '</button>' : ""); }
  s.className = cls; s.innerHTML = h;
  if (n) { n.className = cls + " tk-note"; n.innerHTML = h; n.style.display = h ? "" : "none"; }
}
function drawOpts() {
  if (!root) return;
  var o = UI.opts;
  Array.prototype.forEach.call(root.querySelectorAll("[data-k]"), function (el) {
    var k = el.dataset.k, v = el.dataset.v;
    if (el.tagName === "SELECT") el.value = o[k]; else if (k === "fit") el.setAttribute("aria-checked", o.fit ? "true" : "false"); else if (k === "bg") el.setAttribute("aria-pressed", String(UI.bg === v)); else if (k === "mip") el.setAttribute("aria-pressed", String(o.mip === v));
  });
}
window.addEventListener("resize", function () { if (live()) { var sel = selTex(); fitStage(sel.length === 1 ? sel[0] : null); } });
function sync() { if (!live()) return; drawHead(); drawList(); drawPrev(); drawAct(); drawSum(); drawOpts(); }

/* ---------- загрузка превью ---------- */
function loadThumbs() {
  var A = api(); if (!A || !st.open || st.thumbBusy || st.prevBusy) return;
  var l = $("#tkList"), v = visible(), need = [], ep = st.epoch, d = st.dsel;
  var top = l ? l.getBoundingClientRect() : null;
  v.forEach(function (t, k) { if (st.thumbs[tkey(t)] === undefined) need.push({ t: t, vis: l && l.children[k] ? (function (r) { return r.bottom > top.top - 40 && r.top < top.bottom + 40; })(l.children[k].getBoundingClientRect()) : false }); });
  if (!need.length) return;
  need.sort(function (a, b) { return (b.vis ? 1 : 0) - (a.vis ? 1 : 0); });
  var vis = need.filter(function (x) { return x.vis; });
  /* сначала только видимые (быстрый первый показ), остальное большими пачками: меньше запусков движка */
  var part = (vis.length ? vis.slice(0, 16) : need.slice(0, 32)).map(function (x) { return x.t; });
  st.thumbBusy = true;
  A.ttkThumbs({ items: part.map(function (t) { return { d: d, i: t.i, name: t.name, w: t.w, h: t.h }; }) }).then(function (r) {
    st.thumbBusy = false; if (ep !== st.epoch) return;
    part.forEach(function (t) { var u = r && r.ok && r.thumbs ? r.thumbs[t.name] : null; st.thumbs[d + "|" + t.name] = u || ""; });
    if (live()) { drawList(); }
    if (r && r.ok) loadThumbs();
  }, function () { st.thumbBusy = false; });
}
function loadPreview() {
  var A = api(), sel = selTex(); drawPrev();
  if (!A || sel.length !== 1) return;
  var t = sel[0], key = tkey(t), ep = st.epoch, d = st.dsel;
  if (st.prev[key] !== undefined) return;
  var tok = (st.pTok = (st.pTok || 0) + 1);
  st.prevBusy = true;
  var fin = function () { if (tok === st.pTok) { st.prevBusy = false; if (live()) loadThumbs(); } };
  A.ttkPreview({ d: d, i: t.i, name: t.name, w: t.w, h: t.h, seq: tok }).then(function (r) {
    fin(); if (ep !== st.epoch) return;
    if (r && r.error === "ttk-stale") return; /* пока ждали, выбрали другую текстуру: не считаем ошибкой */
    st.prev[d + "|" + t.name] = r && r.ok ? r.url : "err";
    var cur = selTex(); if (cur.length === 1 && cur[0].name === t.name) drawPrev();
  }, function () { fin(); if (ep === st.epoch) { st.prev[d + "|" + t.name] = "err"; drawPrev(); } });
}

/* ---------- действия ---------- */
function setMsg(ok, t, dir) { st.msg = { ok: ok, t: t, dir: dir || "" }; }
function applyDicts(dicts, names) {
  st.dicts = dicts; if (st.dsel >= dicts.length) st.dsel = 0;
  var all = texs(); st.sel = all.filter(function (t) { return names.indexOf(t.name) >= 0; }).map(function (t) { return t.i; });
}
function runOps(ops) {
  var A = api(); if (!A || !ops.length || st.busy) return;
  st.busy = L("working"); st.msg = null; st.arm = ""; sync();
  var ep = st.epoch, names = selTex().map(function (t) { return t.name; });
  A.ttkApply({ ops: ops, opts: UI.opts }).then(function (r) {
    if (ep !== st.epoch) return;
    st.busy = "";
    if (!r || !r.ok) { setMsg(false, errText(r)); sync(); return; }
    ops.forEach(function (o) { if (o.op !== "add") { delete st.thumbs[o.d + "|" + o.name]; delete st.prev[o.d + "|" + o.name]; } });
    if (r.dicts) applyDicts(r.dicts, names);
    if (r.done > 0) st.dirty = true;
    var c = { replace: 0, add: 0, delete: 0 }; ops.forEach(function (o) { c[o.op === "empty" ? "replace" : o.op]++; });
    var parts = [];
    if (c.replace) parts.push(L("okRep", { n: c.replace })); if (c.add) parts.push(L("okAdd", { n: c.add })); if (c.delete) parts.push(L("okDel", { n: c.delete }));
    var sum = parts.join(", "); sum = sum.charAt(0).toUpperCase() + sum.slice(1);
    var bad = (r.failed || []).length;
    if (!r.done && !bad) setMsg(true, L("nothing")); else setMsg(!bad, (r.done ? sum : L("nothing")) + (bad ? " · " + L("errs", { n: bad }) + ((r.failed[0] && r.failed[0].message) ? " (" + String(r.failed[0].message).slice(0, 80) + ")" : "") : ""));
    sync(); loadThumbs(); loadPreview();
  }, function () { if (ep === st.epoch) { st.busy = ""; setMsg(false, L("nomod")); sync(); } });
}
function replaceOp(t, src) { return { op: "replace", d: st.dsel, i: t.i, name: t.name, src: src, tex: { w: t.w, h: t.h, levels: t.levels, mips: t.mips, format: t.format } }; }
function baseName(p) { var n = String(p).split(/[\\/]/).pop(); return n.replace(/\.[^.]*$/, ""); }
function importFiles(paths, target) {
  var imgs = paths.filter(function (p) { return IMGX.test(p); }); if (!imgs.length || !st.open) return;
  if (target) { runOps([replaceOp(target, imgs[0])]); return; }
  var all = texs(), ops = imgs.map(function (p) {
    var b = baseName(p).toLowerCase(), m = null; all.forEach(function (t) { if (t.name.toLowerCase() === b) m = t; });
    return m ? replaceOp(m, p) : { op: "add", d: st.dsel, name: baseName(p), src: p };
  });
  runOps(ops);
}
function openPath(p) {
  var A = api(); if (!A || !p) return;
  if (!RES.test(p)) { setMsg(false, L("e_ttk_bad_type")); sync(); return; }
  if (st.open && st.dirty && !window.confirm(L("discard"))) return;
  var ep = st.epoch + 1; st = Object.assign(blank(), { epoch: ep, busy: L("reading") }); sync();
  A.ttkOpen(p).then(function (r) {
    if (ep !== st.epoch) return;
    if (!r || !r.ok) { st.busy = ""; setMsg(false, errText(r)); sync(); return; }
    st = Object.assign(blank(), { epoch: ep, open: true, name: r.name, ext: r.ext, size: r.size, path: r.path, type: r.type, dicts: r.dicts });
    sync(); loadThumbs();
  }, function () { if (ep === st.epoch) { st.busy = ""; setMsg(false, L("nomod")); sync(); } });
}
function closeFile() {
  if (st.open && st.dirty && !window.confirm(L("discard"))) return;
  var A = api(); if (A) A.ttkClose();
  st = Object.assign(blank(), { epoch: st.epoch + 1 }); sync();
}
function pickOpen() { var A = api(); if (!A) return; A.ttkPick().then(function (p) { if (p) openPath(p); }); }
function exportTex(all) {
  var A = api(); if (!A || st.busy) return;
  var list = all ? texs() : selTex(); if (!list.length) return;
  A.ttkPickDir().then(function (dir) {
    if (!dir) return;
    st.busy = L("working"); st.msg = null; sync(); var ep = st.epoch;
    A.ttkExport({ dir: dir, fmt: UI.expFmt, items: list.map(function (t) { return { d: st.dsel, i: t.i, name: t.name }; }) }).then(function (r) {
      if (ep !== st.epoch) return; st.busy = "";
      if (!r || !r.ok) setMsg(false, errText(r)); else setMsg(!r.failed, L("exported", { n: r.count }) + (r.failed ? " · " + L("errs", { n: r.failed }) : ""), r.dir);
      sync();
    }, function () { if (ep === st.epoch) { st.busy = ""; setMsg(false, L("nomod")); sync(); } });
  });
}
function saveFile(as) {
  var A = api(); if (!A || st.busy) return;
  st.busy = L("working"); st.msg = null; st.arm = ""; sync(); var ep = st.epoch;
  A.ttkSave({ as: !!as }).then(function (r) {
    if (ep !== st.epoch) return; st.busy = "";
    if (r && r.ok) { st.dirty = false; st.name = r.name; st.path = r.path; setMsg(true, L("saved") + ": " + r.path); }
    else if (r && r.error !== "cancel") setMsg(false, errText(r));
    sync();
  }, function () { if (ep === st.epoch) { st.busy = ""; setMsg(false, L("nomod")); sync(); } });
}
function revert() {
  var A = api(); if (!A || st.busy) return;
  st.busy = L("working"); st.msg = null; st.arm = ""; sync(); var ep = st.epoch;
  A.ttkRevert().then(function (r) {
    if (ep !== st.epoch) return; st.busy = "";
    if (r && r.ok) { st.thumbs = {}; st.prev = {}; st.dirty = false; applyDicts(r.dicts, selTex().map(function (t) { return t.name; })); }
    else setMsg(false, errText(r));
    sync(); loadThumbs(); loadPreview();
  }, function () { if (ep === st.epoch) { st.busy = ""; sync(); } });
}
function arm(k) { st.arm = k; clearTimeout(armT); armT = setTimeout(function () { st.arm = ""; if (live()) drawAct(); }, 3500); drawAct(); }
function pickImages(multi, cb) { var A = api(); if (!A) return; A.ttkPickImages(!!multi).then(function (ps) { if (ps && ps.length) cb(ps); }); }

/* ---------- события ---------- */
function onClick(e) {
  if (!live()) return; var t = e.target;
  var b = t.closest("[data-act]");
  if (b && !b.disabled) {
    var a = b.dataset.act;
    if (a === "open") { pickOpen(); return; }
    if (a === "close") { closeFile(); return; }
    if (a === "reveal") { var A = api(); if (A) A.ttkReveal(b.dataset.dir); return; }
    if (a === "replace") { var one = selTex()[0]; if (one) pickImages(false, function (ps) { importFiles(ps, one); }); return; }
    if (a === "empty") { runOps(selTex().map(function (x) { return { op: "empty", d: st.dsel, i: x.i, name: x.name }; })); return; }
    if (a === "add") { pickImages(true, function (ps) { runOps(ps.filter(function (p) { return IMGX.test(p); }).map(function (p) { return { op: "add", d: st.dsel, name: baseName(p), src: p }; })); }); return; }
    if (a === "expSel") { exportTex(false); return; }
    if (a === "expAll") { exportTex(true); return; }
    if (a === "del") { if (st.arm !== "del") { arm("del"); return; } runOps(selTex().map(function (x) { return { op: "delete", d: st.dsel, i: x.i, name: x.name }; })); return; }
    if (a === "save") { if (st.arm !== "save") { arm("save"); return; } saveFile(false); return; }
    if (a === "saveAs") { saveFile(true); return; }
    if (a === "revert") { if (st.arm !== "revert") { arm("revert"); return; } revert(); return; }
  }
  if (t.closest("#tkDrop")) { pickOpen(); return; }
  var k = t.closest("[data-k]");
  if (k && !k.disabled && k.tagName !== "SELECT") {
    var key = k.dataset.k;
    if (key === "fit") UI.opts.fit = UI.opts.fit ? 0 : 1; else if (key === "mip") UI.opts.mip = k.dataset.v; else if (key === "bg") UI.bg = k.dataset.v; else if (key === "expFmt") UI.expFmt = k.dataset.v;
    persist(); drawOpts(); drawPrev(); drawAct(); return;
  }
  var it = t.closest(".tk-it");
  if (it) {
    var i = +it.dataset.i, vis = visible().map(function (x) { return x.i; });
    if (e.shiftKey && st.anchor >= 0) { var a1 = vis.indexOf(st.anchor), a2 = vis.indexOf(i); if (a1 >= 0 && a2 >= 0) st.sel = vis.slice(Math.min(a1, a2), Math.max(a1, a2) + 1); }
    else if (e.ctrlKey || e.metaKey) { st.sel = isSel(i) ? st.sel.filter(function (x) { return x !== i; }) : st.sel.concat(i); st.anchor = i; }
    else { st.sel = [i]; st.anchor = i; }
    st.arm = ""; drawList(); drawPrev(); drawAct(); loadPreview(); return;
  }
}
function onChange(e) {
  if (!live()) return; var el = e.target;
  if (el.id === "tkDict") { st.dsel = +el.value || 0; st.sel = []; st.anchor = -1; st.q = ""; st.arm = ""; drawHead(); drawList(); drawPrev(); drawAct(); loadThumbs(); return; }
  if (el.tagName === "SELECT" && el.dataset.k) { UI.opts[el.dataset.k] = el.value; persist(); }
}
function onInput(e) { if (!live()) return; if (e.target.id === "tkQ") { st.q = e.target.value; drawList(); loadThumbs(); } }
function onKey(e) {
  if (!live() || !e.target.classList || !e.target.classList.contains("tk-it")) return;
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.target.click(); }
}
var scT = 0;
function onScroll(e) { if (e.target && e.target.id === "tkList") { clearTimeout(scT); scT = setTimeout(loadThumbs, 120); } }
function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0; }
function onOver(e) {
  if (!live() || !hasFiles(e)) return; e.preventDefault();
  var l = $("#tkLeft"); if (l) l.classList.add("over");
  Array.prototype.forEach.call(root.querySelectorAll(".tk-it.dz"), function (x) { x.classList.remove("dz"); });
  var it = e.target.closest && e.target.closest(".tk-it"); if (it && st.open) it.classList.add("dz");
}
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var l = $("#tkLeft"); if (l) l.classList.remove("over"); Array.prototype.forEach.call(root.querySelectorAll(".tk-it.dz"), function (x) { x.classList.remove("dz"); }); } }
function onDrop(e) {
  if (!live() || !hasFiles(e)) return; e.preventDefault();
  var l = $("#tkLeft"); if (l) l.classList.remove("over");
  var it = e.target.closest && e.target.closest(".tk-it");
  Array.prototype.forEach.call(root.querySelectorAll(".tk-it.dz"), function (x) { x.classList.remove("dz"); });
  var A = window.api, ps = Array.prototype.map.call(e.dataTransfer.files, function (f) { return A && A.pathForFile ? A.pathForFile(f) : f.path; }).filter(Boolean);
  if (!ps.length || !api()) return;
  var res = ps.filter(function (p) { return RES.test(p); });
  if (res.length && (!st.open || !ps.some(function (p) { return IMGX.test(p); }))) { openPath(res[0]); return; }
  if (!st.open) { setMsg(false, L("e_ttk_bad_type")); sync(); return; }
  importFiles(ps, it ? byI(+it.dataset.i) : null);
}
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("click", onClick); root.addEventListener("change", onChange); root.addEventListener("input", onInput); root.addEventListener("keydown", onKey);
  root.addEventListener("scroll", onScroll, true); root.addEventListener("dragenter", onOver); root.addEventListener("dragover", onOver); root.addEventListener("dragleave", onLeave); root.addEventListener("drop", onDrop);
  if (avail === null && api() && window.api.ttkAvailable) window.api.ttkAvailable().then(function (v) { avail = v || { win: false, engine: false }; if (live() && !st.open) drawList(); }, function () { avail = { win: true, engine: false, mod: false }; if (live() && !st.open) drawList(); });
  sync(); loadThumbs(); loadPreview();
}

window.TTK = { html: html, mount: mount };
window.TOOLS = (window.TOOLS || []).concat([{ id: "ttk", ico: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 12h18M12 3v18"/><circle cx="7.5" cy="7.5" r="1.2"/><path d="M14 17l2-2 3 3"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; }, view: html, mount: mount }]);
})();
