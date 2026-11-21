/* Инструмент «Прицел». Подключается после tool-rm.js; регистрирует window.TOOLS.
   Открывает hud_reticle.gfx (GTA V), даёт выбрать форму, цвет и размер прицела, рисует его в окне (canvas)
   и через IPC ret:* (ret.js) записывает новую картинку и размер в копию файла. Рисование одно и то же для превью и для сохранения. */
(function () {
"use strict";
var I = {
en: {
 name:"Crosshair", desc:"Edit the GTA V crosshair from hud_reticle.gfx: shape, color and size", back:"Tools",
 sub:"Design your crosshair and download a ready hud_reticle.gfx to put into the game.",
 dropT:"Drop hud_reticle.gfx here", dropS:"or click “Open” on the right", open:"Open", file:"File", noFile:"No file opened",
 found:"Found: center ×{c}, dynamic ×{d}", vN:"New", vE:"On enemy", vO:"Original", bgC:"Checker", bgD:"Dark", bgL:"Light", bgG:"Gray", fit:"Fit", area:"Image area: {n}×{n} px (scene 1280×720)",
 sP:"Presets", pCl:"Classic", pGap:"With gap", pDot:"Dot", pCir:"Circle", pX:"Cross ×", pNeon:"Neon",
 sV:"Shape", shPlus:"Plus", shX:"Cross ×", shDot:"Dot", shRing:"Circle", shSquare:"Square", shDiamond:"Diamond", shTee:"T-shape", shChev:"Chevron", shCorn:"Corners", shDots:"Four dots", shStar:"Star",
 sC:"Color", col:"Color", colS:"Pick any or use a quick color", ecol:"On enemy", ecolS:"Color when you aim at an enemy", al:"Opacity", alS:"%", ol:"Outline", olS:"Dark edge around the shape for contrast", olc:"Outline color", olt:"Outline width", pxS:"px",
 sZ:"Size", size:"Size", sizeS:"Whole crosshair, in pixels of a 1280×720 screen (the game scales it)", th:"Line width", gap:"Center gap", gapS:"Empty space in the middle", cdot:"Center dot", cds:"Dot size",
 sO:"Saving", fmt:"Format", fmtS:"Vector writes real shapes (sharp at any screen size). Image is the old way: a picture inside the file", fVec:"Vector", fImg:"Image (PNG)",
 dyn:"Moving part", dynS:"Pistol crosshair has a second plus that grows while moving", dSame:"Same shape", dHide:"Hide", dKeep:"Leave as is", vis:"After releasing aim", visS:"Crosshair hides at once like in default GTA, or stays on screen", vInst:"Hides at once", vStay:"Stays",
 go:"Save .gfx", saving:"Saving…", saved:"Saved", fail:"Could not save", openFail:"Could not read this file", noReticle:"No crosshair found in this file", noapp:"Works in the desktop app only", reveal:"Show in folder", reset:"Reset settings",
 sG:"Guide",
 g1:"<b>What changes.</b> The central crosshair image of hud_reticle.gfx (the plus in the middle, two places) and the moving plus of pistols. Everything else in the file is copied untouched.",
 g2:"<b>What does not.</b> Dots and the ticks of SMG, shotgun and rifle crosshairs are separate textures inside hud_reticle.ytd, not in this file. Sniper scopes are left alone.",
 g3:"<b>Saving.</b> A save dialog opens, the original file inside the app is never changed. Put the new file back with your usual tool (OpenIV, CodeWalker) and check it in the game.",
 g4:"<b>Color.</b> The picture stays white, the colors are written into the script of the file (normal and on enemy). Not tested in the game yet: if the color looks wrong, tell me.",
 g5:"<b>Vector.</b> The crosshair is written as real shapes, not a picture, so it stays sharp at any screen size. With opacity below 100% overlapping parts (outline, crossing lines) can look darker: for a translucent crosshair pick Image. Not tested in the game yet: if it breaks, switch to Image and tell me."
},
ru: {
 name:"Прицел", desc:"Редактор прицела GTA V из hud_reticle.gfx: форма, цвет и размер", back:"Инструменты",
 sub:"Настрой прицел и скачай готовый hud_reticle.gfx, чтобы поставить его в игру.",
 dropT:"Перетащи сюда hud_reticle.gfx", dropS:"или нажми «Открыть» справа", open:"Открыть", file:"Файл", noFile:"Файл не открыт",
 found:"Найдено: центр ×{c}, динамический ×{d}", vN:"Новый", vE:"На враге", vO:"Оригинал", bgC:"Шахматка", bgD:"Тёмный", bgL:"Светлый", bgG:"Серый", fit:"По размеру", area:"Область картинки: {n}×{n} px (сцена 1280×720)",
 sP:"Пресеты", pCl:"Классика", pGap:"С просветом", pDot:"Точка", pCir:"Кружок", pX:"Крестик ×", pNeon:"Неон",
 sV:"Форма", shPlus:"Плюс", shX:"Крестик ×", shDot:"Точка", shRing:"Кружок", shSquare:"Квадрат", shDiamond:"Ромб", shTee:"Т-образный", shChev:"Уголок", shCorn:"Рамка", shDots:"Четыре точки", shStar:"Звезда",
 sC:"Цвет", col:"Цвет", colS:"Любой или быстрый выбор", ecol:"На враге", ecolS:"Цвет при наведении на противника", al:"Прозрачность", alS:"Непрозрачность, %", ol:"Обводка", olS:"Тёмный контур вокруг фигуры для контраста", olc:"Цвет обводки", olt:"Толщина обводки", pxS:"px",
 sZ:"Размер", size:"Размер", sizeS:"Весь прицел, в пикселях экрана 1280×720 (игра масштабирует сама)", th:"Толщина линий", gap:"Просвет в центре", gapS:"Пустое место посередине", cdot:"Точка в центре", cds:"Размер точки",
 sO:"Сохранение", fmt:"Формат", fmtS:"Вектор записывает настоящие фигуры (чётко на любом экране). Картинка: как раньше, растр внутри файла", fVec:"Вектор", fImg:"Картинка (PNG)",
 dyn:"Подвижная часть", dynS:"У пистолетов есть второй плюс, который растёт при движении", dSame:"Такая же форма", dHide:"Скрыть", dKeep:"Не трогать", vis:"После отпускания ПКМ", visS:"Прицел пропадает сразу, как в обычной GTA, или остаётся на экране", vInst:"Исчезает сразу", vStay:"Не исчезает",
 go:"Сохранить .gfx", saving:"Сохраняю…", saved:"Сохранено", fail:"Не удалось сохранить", openFail:"Не удалось прочитать файл", noReticle:"В этом файле не найден прицел", noapp:"Работает только в приложении", reveal:"Показать в папке", reset:"Сбросить настройки",
 sG:"Справка",
 g1:"<b>Что меняется.</b> Центральная картинка прицела в hud_reticle.gfx (плюс посередине, два места) и подвижный плюс у пистолетов. Всё остальное в файле копируется без изменений.",
 g2:"<b>Что не меняется.</b> Точки и «усики» прицелов SMG, дробовика и винтовки лежат отдельными текстурами в hud_reticle.ytd, в этом файле их нет. Снайперские прицелы не трогаются.",
 g3:"<b>Сохранение.</b> Откроется окно сохранения, оригинал внутри приложения не меняется. Верни новый файл в игру тем же способом, что и раньше (OpenIV, CodeWalker) и проверь в игре.",
 g4:"<b>Цвет.</b> Картинка остаётся белой, цвета записываются в скрипт файла (обычный и на враге). В игре пока не проверено: если цвет не тот, напиши.",
 g5:"<b>Вектор.</b> Прицел записывается настоящими фигурами, а не картинкой, поэтому чёткий на любом экране. При прозрачности меньше 100% наложения (обводка, пересечения линий) могут выглядеть темнее: для полупрозрачного прицела выбери «Картинку». В игре пока не проверено: если сломается, переключи на «Картинку» и напиши."
},
uk: {
 name:"Приціл", desc:"Редактор прицілу GTA V з hud_reticle.gfx: форма, колір і розмір", back:"Інструменти",
 sub:"Налаштуй приціл і завантаж готовий hud_reticle.gfx, щоб поставити його в гру.",
 dropT:"Перетягни сюди hud_reticle.gfx", dropS:"або натисни «Відкрити» праворуч", open:"Відкрити", file:"Файл", noFile:"Файл не відкрито",
 found:"Знайдено: центр ×{c}, динамічний ×{d}", vN:"Новий", vE:"На ворозі", vO:"Оригінал", bgC:"Шахівниця", bgD:"Темний", bgL:"Світлий", bgG:"Сірий", fit:"За розміром", area:"Область картинки: {n}×{n} px (сцена 1280×720)",
 sP:"Пресети", pCl:"Класика", pGap:"З просвітом", pDot:"Крапка", pCir:"Кружечок", pX:"Хрестик ×", pNeon:"Неон",
 sV:"Форма", shPlus:"Плюс", shX:"Хрестик ×", shDot:"Крапка", shRing:"Кружечок", shSquare:"Квадрат", shDiamond:"Ромб", shTee:"Т-подібний", shChev:"Куточок", shCorn:"Рамка", shDots:"Чотири крапки", shStar:"Зірка",
 sC:"Колір", col:"Колір", colS:"Будь-який або швидкий вибір", ecol:"На ворозі", ecolS:"Колір при наведенні на супротивника", al:"Прозорість", alS:"Непрозорість, %", ol:"Обводка", olS:"Темний контур навколо фігури для контрасту", olc:"Колір обводки", olt:"Товщина обводки", pxS:"px",
 sZ:"Розмір", size:"Розмір", sizeS:"Весь приціл, у пікселях екрана 1280×720 (гра масштабує сама)", th:"Товщина ліній", gap:"Просвіт у центрі", gapS:"Порожнє місце посередині", cdot:"Крапка в центрі", cds:"Розмір крапки",
 sO:"Збереження", fmt:"Формат", fmtS:"Вектор записує справжні фігури (чітко на будь-якому екрані). Картинка: як раніше, растр усередині файлу", fVec:"Вектор", fImg:"Картинка (PNG)",
 dyn:"Рухома частина", dynS:"У пістолетів є другий плюс, що росте під час руху", dSame:"Така сама форма", dHide:"Сховати", dKeep:"Не чіпати", vis:"Після відпускання ПКМ", visS:"Приціл зникає одразу, як у звичайній GTA, або лишається на екрані", vInst:"Зникає одразу", vStay:"Не зникає",
 go:"Зберегти .gfx", saving:"Зберігаю…", saved:"Збережено", fail:"Не вдалося зберегти", openFail:"Не вдалося прочитати файл", noReticle:"У цьому файлі не знайдено прицілу", noapp:"Працює лише в застосунку", reveal:"Показати в папці", reset:"Скинути налаштування",
 sG:"Довідка",
 g1:"<b>Що змінюється.</b> Центральна картинка прицілу в hud_reticle.gfx (плюс посередині, два місця) і рухомий плюс у пістолетів. Решта файлу копіюється без змін.",
 g2:"<b>Що не змінюється.</b> Крапки та «вусики» прицілів SMG, дробовика й гвинтівки лежать окремими текстурами в hud_reticle.ytd, у цьому файлі їх немає. Снайперські приціли не чіпаються.",
 g3:"<b>Збереження.</b> Відкриється вікно збереження, оригінал усередині застосунку не змінюється. Поверни новий файл у гру тим самим способом, що й раніше (OpenIV, CodeWalker), і перевір у грі.",
 g4:"<b>Колір.</b> Картинка лишається білою, кольори записуються в скрипт файлу (звичайний і на ворозі). У грі поки не перевірено: якщо колір не той, напиши.",
 g5:"<b>Вектор.</b> Приціл записується справжніми фігурами, а не картинкою, тому чіткий на будь-якому екрані. При прозорості менше 100% накладання (обводка, перетини ліній) можуть виглядати темнішими: для напівпрозорого прицілу обери «Картинку». У грі поки не перевірено: якщо зламається, перемкни на «Картинку» і напиши."
}
};
var SHAPES = [
 ["plus", "shPlus", '<path d="M12 3v7M12 14v7M3 12h7M14 12h7"/>'],
 ["x", "shX", '<path d="M5 5l5 5M14 14l5 5M19 5l-5 5M10 14l-5 5"/>'],
 ["dot", "shDot", '<circle cx="12" cy="12" r="3.5" fill="currentColor"/>'],
 ["ring", "shRing", '<circle cx="12" cy="12" r="8"/>'],
 ["square", "shSquare", '<rect x="5" y="5" width="14" height="14"/>'],
 ["diamond", "shDiamond", '<path d="M12 3l9 9-9 9-9-9z"/>'],
 ["tee", "shTee", '<path d="M3 12h7M14 12h7M12 14v7"/>'],
 ["chev", "shChev", '<path d="M4 17l8-9 8 9"/>'],
 ["corn", "shCorn", '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'],
 ["dots", "shDots", '<g fill="currentColor" stroke="none"><circle cx="12" cy="4.5" r="2"/><circle cx="12" cy="19.5" r="2"/><circle cx="4.5" cy="12" r="2"/><circle cx="19.5" cy="12" r="2"/></g>'],
 ["star", "shStar", '<path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/>']
];
var SWATCH = ["#ffffff", "#ff2d2d", "#00ff66", "#00e5ff", "#ffe600", "#ff3df0", "#ff8a00", "#000000"];
var DEF = { pre:"classic", shape:"plus", size:13, th:1.6, gap:0, col:"#ffffff", ecol:"#ff0000", alpha:100, ol:1, olc:"#000000", olt:0.8, cdot:0, cds:2, dyn:"same", vis:"instant", fmt:"vec" };
var PRESETS = [
 ["classic", "pCl", { shape:"plus", size:13, th:1.6, gap:0, col:"#ffffff", alpha:100, ol:1, olc:"#000000", olt:0.8, cdot:0 }],
 ["gap", "pGap", { shape:"plus", size:16, th:1.4, gap:3, col:"#ffffff", alpha:100, ol:1, olc:"#000000", olt:0.8, cdot:0 }],
 ["dot", "pDot", { shape:"dot", size:4, th:1.6, gap:0, col:"#ffffff", alpha:100, ol:1, olc:"#000000", olt:0.8, cdot:0 }],
 ["ring", "pCir", { shape:"ring", size:18, th:1.4, gap:0, col:"#ffffff", alpha:100, ol:1, olc:"#000000", olt:0.8, cdot:1, cds:2 }],
 ["x", "pX", { shape:"x", size:14, th:1.6, gap:0, col:"#ffffff", alpha:100, ol:1, olc:"#000000", olt:0.8, cdot:0 }],
 ["neon", "pNeon", { shape:"plus", size:16, th:1.6, gap:3, col:"#00ff66", alpha:100, ol:1, olc:"#000000", olt:0.8, cdot:0 }]
];
var st = { set:clone(DEF), view:"new", bg:"check", zoom:"fit", open:{ p:1, v:1, c:1, z:1, o:1, g:0 }, file:null, info:null, orig:null, busy:false, msg:"", err:false, lastOut:"" };
var root = null, lang = "en";
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function persist() { try { localStorage.setItem("mh_ret", JSON.stringify({ set: st.set })); } catch (e) {} }
try { var sv = JSON.parse(localStorage.getItem("mh_ret") || "null"); if (sv && sv.set) Object.keys(DEF).forEach(function (k) { if (sv.set[k] !== undefined && typeof sv.set[k] === typeof DEF[k]) st.set[k] = sv.set[k]; }); } catch (e) {}
function L(k, v) { var s = (I[lang] && I[lang][k]) || I.en[k] || k; if (v) Object.keys(v).forEach(function (n) { s = s.split("{" + n + "}").join(v[n]); }); return s; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function api() { return window.api && window.api.retOpen ? window.api : null; }
function $(s) { return root ? root.querySelector(s) : null; }

/* ---------- рисование (одно и то же для превью и для картинки в файл) ---------- */
function boxPx(s) { return Math.max(4, Math.ceil(s.size + 2 * (s.ol ? s.olt : 0) + 2)); }
function drawRet(c, s) { // единицы = пиксели сцены 1280×720, центр в нуле, рисует непрозрачно
  var R = s.size / 2, t = s.th, o = s.ol ? s.olt : 0, g = Math.max(0, Math.min(s.gap, R - 0.3)), k = 0.70711;
  function pass(grow, col) {
    var tw = t + 2 * grow;
    c.strokeStyle = col; c.fillStyle = col; c.lineJoin = "miter"; c.miterLimit = 4; c.lineCap = "butt";
    function ln(x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l; c.beginPath(); c.moveTo(x1 - ux * grow, y1 - uy * grow); c.lineTo(x2 + ux * grow, y2 + uy * grow); c.lineWidth = tw; c.stroke(); }
    function sp(pts, close) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); if (close) c.closePath(); c.lineWidth = tw; c.stroke(); }
    function disc(x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.01, r + grow), 0, 6.2832); c.fill(); }
    function plus(a) { // a = 0: ось, 1: диагональ
      var d = a ? k : 1, e = g * d, r = R * d;
      if (g < 0.05) { if (a) { ln(-r, -r, r, r); ln(r, -r, -r, r); } else { ln(-r, 0, r, 0); ln(0, -r, 0, r); } return; }
      if (a) { ln(-r, -r, -e, -e); ln(e, e, r, r); ln(r, -r, e, -e); ln(-e, e, -r, r); }
      else { ln(-r, 0, -e, 0); ln(e, 0, r, 0); ln(0, -r, 0, -e); ln(0, e, 0, r); }
    }
    switch (s.shape) {
      case "plus": plus(0); break;
      case "x": plus(1); break;
      case "star": plus(0); plus(1); break;
      case "dot": disc(0, 0, R); break;
      case "ring": c.beginPath(); c.arc(0, 0, Math.max(0.1, R - t / 2), 0, 6.2832); c.lineWidth = tw; c.stroke(); break;
      case "square": var h = Math.max(0.2, R - t / 2); sp([[-h, -h], [h, -h], [h, h], [-h, h]], 1); break;
      case "diamond": var q = Math.max(0.2, R - t * 0.7); sp([[0, -q], [q, 0], [0, q], [-q, 0]], 1); break;
      case "tee": if (g < 0.05) { ln(-R, 0, R, 0); ln(0, 0, 0, R); } else { ln(-R, 0, -g, 0); ln(g, 0, R, 0); ln(0, g, 0, R); } break;
      case "chev": sp([[-R * 0.8, R * 0.45], [0, -R * 0.45], [R * 0.8, R * 0.45]], 0); break;
      case "corn": var cx = Math.max(0.3, R - t / 2), a = R * 0.5; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (m) { sp([[m[0] * cx, m[1] * (cx - a)], [m[0] * cx, m[1] * cx], [m[0] * (cx - a), m[1] * cx]], 0); }); break;
      case "dots": var rd = Math.max(0.6, t * 0.9), pp = Math.max(0, R - rd); disc(0, -pp, rd); disc(0, pp, rd); disc(-pp, 0, rd); disc(pp, 0, rd); break;
    }
    if (s.cdot && s.shape !== "dot") disc(0, 0, s.cds / 2);
  }
  if (o > 0) pass(o, s.olc);
  pass(0, s.col);
}
/* ---------- вектор: те же фигуры в виде контуров (для файла и превью) ---------- */
// grow = на сколько растёт слой (обводка). Контур = [[x,y],..] или {x,y,r}; {o: внешний, h: [дырки]}; единицы = px сцены.
function vecPieces(s, grow) {
  var R = s.size / 2, t = s.th, g = Math.max(0, Math.min(s.gap, R - 0.3)), k = 0.70711, tw = t + 2 * grow, out = [];
  function ln(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy * tw / 2, ny = ux * tw / 2;
    var ax = x1 - ux * grow, ay = y1 - uy * grow, bx = x2 + ux * grow, by = y2 + uy * grow;
    out.push({ o: [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]] });
  }
  function disc(x, y, r) { out.push({ o: { x: x, y: y, r: Math.max(0.01, r + grow) } }); }
  function ring(rad) { var ro = rad + tw / 2, ri = rad - tw / 2; out.push(ri < 0.05 ? { o: { x: 0, y: 0, r: ro } } : { o: { x: 0, y: 0, r: ro }, h: [{ x: 0, y: 0, r: ri }] }); }
  function stroke(pts, close) { // контур линии шириной tw с острыми углами (miter, предел 4)
    var n = pts.length, h = tw / 2, L = [], Rr = [];
    function dir(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
    for (var i = 0; i < n; i++) {
      var P = pts[i], d1 = (i > 0 || close) ? dir(pts[(i + n - 1) % n], P) : null, d2 = (i < n - 1 || close) ? dir(P, pts[(i + 1) % n]) : null;
      if (!d1) d1 = d2; if (!d2) d2 = d1;
      var n1 = [-d1[1], d1[0]], n2 = [-d2[1], d2[0]], f = 1 + n1[0] * n2[0] + n1[1] * n2[1], cr = d1[0] * d2[1] - d1[1] * d2[0];
      var mx = f > 1e-6 ? (n1[0] + n2[0]) / f * h : 0, my = f > 1e-6 ? (n1[1] + n2[1]) / f * h : 0;
      if (Math.abs(cr) < 1e-6 || (f > 1e-6 && 1 / Math.sqrt(f / 2) <= 4)) { L.push([P[0] + mx, P[1] + my]); Rr.push([P[0] - mx, P[1] - my]); }
      else if (cr < 0) { L.push([P[0] + n1[0] * h, P[1] + n1[1] * h], [P[0] + n2[0] * h, P[1] + n2[1] * h]); Rr.push([P[0] - mx, P[1] - my]); }
      else { Rr.push([P[0] - n1[0] * h, P[1] - n1[1] * h], [P[0] - n2[0] * h, P[1] - n2[1] * h]); L.push([P[0] + mx, P[1] + my]); }
    }
    if (!close) { out.push({ o: L.concat(Rr.reverse()) }); return; }
    function ar(a) { var q = 0; a.forEach(function (p, i) { var b = a[(i + 1) % a.length]; q += p[0] * b[1] - b[0] * p[1]; }); return Math.abs(q); }
    out.push(ar(L) >= ar(Rr) ? { o: L, h: [Rr] } : { o: Rr, h: [L] });
  }
  function plus(a) {
    var d = a ? k : 1, e = g * d, r = R * d;
    if (g < 0.05) { if (a) { ln(-r, -r, r, r); ln(r, -r, -r, r); } else { ln(-r, 0, r, 0); ln(0, -r, 0, r); } return; }
    if (a) { ln(-r, -r, -e, -e); ln(e, e, r, r); ln(r, -r, e, -e); ln(-e, e, -r, r); }
    else { ln(-r, 0, -e, 0); ln(e, 0, r, 0); ln(0, -r, 0, -e); ln(0, e, 0, r); }
  }
  switch (s.shape) {
    case "plus": plus(0); break;
    case "x": plus(1); break;
    case "star": plus(0); plus(1); break;
    case "dot": disc(0, 0, R); break;
    case "ring": ring(Math.max(0.1, R - t / 2)); break;
    case "square": var h = Math.max(0.2, R - t / 2); stroke([[-h, -h], [h, -h], [h, h], [-h, h]], 1); break;
    case "diamond": var q = Math.max(0.2, R - t * 0.7); stroke([[0, -q], [q, 0], [0, q], [-q, 0]], 1); break;
    case "tee": if (g < 0.05) { ln(-R, 0, R, 0); ln(0, 0, 0, R); } else { ln(-R, 0, -g, 0); ln(g, 0, R, 0); ln(0, g, 0, R); } break;
    case "chev": stroke([[-R * 0.8, R * 0.45], [0, -R * 0.45], [R * 0.8, R * 0.45]], 0); break;
    case "corn": var cx = Math.max(0.3, R - t / 2), a = R * 0.5; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (m) { stroke([[m[0] * cx, m[1] * (cx - a)], [m[0] * cx, m[1] * cx], [m[0] * (cx - a), m[1] * cx]], 0); }); break;
    case "dots": var rd = Math.max(0.6, t * 0.9), pp = Math.max(0, R - rd); disc(0, -pp, rd); disc(0, pp, rd); disc(-pp, 0, rd); disc(pp, 0, rd); break;
  }
  if (s.cdot && s.shape !== "dot") disc(0, 0, s.cds / 2);
  return out;
}
function vecAll(s) { var o = s.ol ? s.olt : 0; return { body: vecPieces(s, 0), out: o > 0 ? vecPieces(s, o) : [], olc: hx(s.olc) }; }
function fillPcs(c, pcs, col, a) {
  c.fillStyle = col; c.globalAlpha = a;
  pcs.forEach(function (p) {
    c.beginPath();
    [p.o].concat(p.h || []).forEach(function (k) {
      if (Array.isArray(k)) { k.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); }
      else { c.moveTo(k.x + k.r, k.y); c.arc(k.x, k.y, k.r, 0, 6.2832); c.closePath(); }
    });
    c.fill("evenodd");
  });
}
function paintVec(target, w, scale, s) { // каждая фигура со своей прозрачностью, как в игре (без склейки в группу)
  var a = Math.max(0, Math.min(1, s.alpha / 100)), v = vecAll(s);
  target.save(); target.setTransform(scale, 0, 0, scale, w / 2, w / 2);
  fillPcs(target, v.out, s.olc, a); fillPcs(target, v.body, s.col, a);
  target.restore();
}
function hx(h) { var n = parseInt(String(h).replace("#", ""), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function px2(a) { return "#" + a.map(function (v) { return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(""); }
function look(s, key) { // как прицел выглядит в игре: белое тело -> цвет, обводка = её цвет + (цвет-255) с обрезкой
  var c = hx(s[key]), o = hx(s.olc), n = {}; Object.keys(s).forEach(function (k) { n[k] = s[k]; });
  n.col = px2(c); n.olc = px2(o.map(function (v, i) { return v + c[i] - 255; })); return n;
}
function paint(target, w, scale, s) { // квадрат w×w, фигура по центру; прозрачность накладывается на всё сразу
  var tmp = document.createElement("canvas"); tmp.width = tmp.height = w;
  var c = tmp.getContext("2d"); c.setTransform(scale, 0, 0, scale, w / 2, w / 2); drawRet(c, s);
  target.save(); target.globalAlpha = Math.max(0, Math.min(1, s.alpha / 100)); target.drawImage(tmp, 0, 0); target.restore();
}
function drawStage() {
  var cv = $("#retCv"); if (!cv) return;
  var s = look(st.set, st.view === "enemy" ? "ecol" : "col"), nb = boxPx(s), ob = st.info && st.info.orig ? st.info.orig.box : 13, view = st.view === "orig" && st.orig ? "orig" : "new";
  var big = view === "orig" ? ob : nb, z = st.zoom === "fit" ? Math.min(24, 240 / big) : Number(st.zoom);
  var dpr = window.devicePixelRatio || 1, W = Math.max(8, Math.ceil(Math.max(nb, ob) * z)), P = Math.round(W * dpr);
  cv.width = P; cv.height = P; cv.style.width = W + "px"; cv.style.height = W + "px";
  var c = cv.getContext("2d"); c.clearRect(0, 0, P, P);
  if (view === "orig") { var d = ob * z * dpr; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high"; c.drawImage(st.orig, 0, 0, st.orig.width, st.orig.height, (P - d) / 2, (P - d) / 2, d, d); }
  else (st.set.fmt === "vec" ? paintVec : paint)(c, P, z * dpr, s);
  var ar = $("#retAr"); if (ar) ar.textContent = L("area", { n: nb });
}

/* ---------- разметка ---------- */
function seg(k, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button data-k="' + k + '" data-v="' + o[0] + '" aria-pressed="false">' + o[1] + '</button>'; }).join("") + '</div>'; }
function chk(k) { return '<button class="chk" role="checkbox" data-k="' + k + '" aria-checked="false"></button>'; }
function row(label, hint, ctl, cond, cls) { return '<div class="row' + (cls ? ' ' + cls : '') + '"' + (cond ? ' data-if="' + cond + '"' : '') + '><span class="l">' + label + (hint ? '<small>' + hint + '</small>' : '') + '</span>' + ctl + '</div>'; }
function num(k, min, max, step) { return '<input class="inp" type="number" data-k="' + k + '" data-n="1" min="' + min + '" max="' + max + '" step="' + (step || 1) + '">'; }
function clr(k) { return '<input class="inp clrin" type="color" data-k="' + k + '">'; }
function sec(id, title, body) { return '<details class="dsec" data-sec="' + id + '"><summary>' + title + '</summary>' + body + '</details>'; }
function ico(n) { return n === "back" ? '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' : ""; }
function html(lg) {
  lang = lg || lang;
  var pre = '<div class="seg pre">' + PRESETS.map(function (p) { return '<button data-pre="' + p[0] + '" aria-pressed="false">' + L(p[1]) + '</button>'; }).join("") + '</div>';
  var shp = '<div class="rshg">' + SHAPES.map(function (x) { return '<button class="rsh" data-k="shape" data-v="' + x[0] + '" aria-pressed="false" aria-label="' + esc(L(x[1])) + '" title="' + esc(L(x[1])) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + x[2] + '</svg><span>' + L(x[1]) + '</span></button>'; }).join("") + '</div>';
  var sw = '<div class="rsws">' + SWATCH.map(function (c) { return '<button class="rsw" data-sw="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>'; }).join("") + '</div>';
  var settings =
   sec("p", L("sP"), '<div class="prow">' + pre + '</div>')
  + sec("v", L("sV"), shp)
  + sec("c", L("sC"), row(L("col"), L("colS"), clr("col")) + '<div class="row st">' + sw + '</div>' + row(L("ecol"), L("ecolS"), clr("ecol")) + row(L("al"), L("alS"), num("alpha", 10, 100, 5))
     + row(L("ol"), L("olS"), chk("ol")) + row(L("olc"), "", clr("olc"), "hasOl") + row(L("olt"), L("pxS"), num("olt", 0.25, 4, 0.25), "hasOl"))
  + sec("z", L("sZ"), row(L("size"), L("sizeS"), num("size", 1, 60, 0.5)) + row(L("th"), L("pxS"), num("th", 0.25, 12, 0.25), "hasTh") + row(L("gap"), L("gapS"), num("gap", 0, 30, 0.5), "hasGap")
     + row(L("cdot"), "", chk("cdot"), "notDot") + row(L("cds"), L("pxS"), num("cds", 0.25, 12, 0.25), "hasCd"))
  + sec("o", L("sO"), row(L("fmt"), L("fmtS"), seg("fmt", [["vec", L("fVec")], ["img", L("fImg")]]), "", "st") + row(L("dyn"), L("dynS"), seg("dyn", [["same", L("dSame")], ["hide", L("dHide")], ["keep", L("dKeep")]]), "", "st") + row(L("vis"), L("visS"), seg("vis", [["instant", L("vInst")], ["stay", L("vStay")]]), "", "st"))
  + sec("g", L("sG"), ["g1", "g2", "g3", "g4", "g5"].map(function (k) { return '<p class="note">' + L(k) + '</p>'; }).join(""));
  return '<div class="tvh"><button class="back" data-tool="">' + ico("back") + L("back") + '</button><h1>' + L("name") + '</h1><p class="sub">' + L("sub") + '</p></div>'
   + '<div class="ret-g"><div class="ddl"><div class="card ddp">'
   + '<div class="ddt"><div class="ddtr">' + seg("view", [["new", L("vN")], ["enemy", L("vE")], ["orig", L("vO")]]) + '</div>'
   + '<div class="ddtr">' + seg("bg", [["check", L("bgC")], ["dark", L("bgD")], ["light", L("bgL")], ["gray", L("bgG")]]) + seg("zoom", [["fit", L("fit")], ["1", "1×"], ["2", "2×"], ["4", "4×"], ["8", "8×"]]) + '</div></div>'
   + '<div class="stage" id="retStage"><div class="sc"><div class="cvb" id="retBox"><canvas id="retCv"></canvas></div></div></div>'
   + '<div class="ddi"><span id="retAr"></span></div></div></div>'
   + '<div class="ddr"><div class="card ddf"><div class="ddfh"><h3>' + L("file") + '</h3></div>'
   + '<div class="retf" id="retFile"></div>'
   + '<button class="go ddgo" id="retGo"></button><p class="dsum" id="retSum"></p></div>'
   + '<div class="card dds">' + settings + '<div class="dres"><button class="mini" id="retReset">' + L("reset") + '</button></div></div></div></div>'
   + (window.CWHINT ? window.CWHINT(lang, "raw") : "");
}

/* ---------- состояние -> DOM ---------- */
var COND = {
  hasOl: function (s) { return !!s.ol; }, hasTh: function (s) { return s.shape !== "dot"; },
  hasGap: function (s) { return ["plus", "x", "star", "tee"].indexOf(s.shape) >= 0; }, notDot: function (s) { return s.shape !== "dot"; }, hasCd: function (s) { return s.shape !== "dot" && !!s.cdot; }
};
function sync() {
  if (!root) return;
  var s = st.set, vals = { view: st.view, bg: st.bg, zoom: String(st.zoom) };
  root.querySelectorAll("[data-k]").forEach(function (el) {
    var k = el.dataset.k, v = k in vals ? vals[k] : s[k];
    if (el.tagName === "BUTTON" && el.classList.contains("chk")) el.setAttribute("aria-checked", v ? "true" : "false");
    else if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", String(el.dataset.v === String(v)));
    else if (document.activeElement !== el) el.value = v === undefined ? "" : v;
  });
  root.querySelectorAll("[data-pre]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.pre === s.pre)); });
  root.querySelectorAll("[data-sw]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.sw === s.col)); });
  root.querySelectorAll("[data-if]").forEach(function (el) { var f = COND[el.dataset.if]; el.hidden = !(f && f(s)); });
  root.querySelectorAll("details[data-sec]").forEach(function (d) { d.open = !!st.open[d.dataset.sec]; });
  var f = $("#retFile");
  if (f) {
    if (st.file && st.info) {
      var c = 0, d = 0; st.info.targets.forEach(function (t) { if (t.role === "dynamic") d++; else c++; });
      f.innerHTML = '<b title="' + esc(st.file.path) + '">' + esc(st.file.name) + '</b><span>' + (st.info.size / 1024).toFixed(1) + ' KB · ' + esc(L("found", { c: c, d: d })) + '</span>';
    } else f.innerHTML = '<span>' + esc(L("noFile")) + '</span>';
  }
  var go = $("#retGo"); if (go) { go.disabled = !st.file || st.busy; go.textContent = st.busy ? L("saving") : L("go"); }
  var sm = $("#retSum");
  if (sm) {
    sm.textContent = st.msg || ""; sm.style.color = st.err ? "#f87171" : "";
    if (st.lastOut && !st.err && st.msg) { var b = document.createElement("button"); b.className = "mini"; b.id = "retRev"; b.textContent = L("reveal"); sm.appendChild(document.createElement("br")); sm.appendChild(b); }
  }
  drawStage();
}

/* ---------- действия ---------- */
function setOrig(info) {
  st.orig = null;
  if (!info || !info.orig) return;
  try {
    var o = info.orig, u = new Uint8ClampedArray(o.rgba.buffer, o.rgba.byteOffset, o.rgba.byteLength), cv = document.createElement("canvas");
    cv.width = o.w; cv.height = o.h; cv.getContext("2d").putImageData(new ImageData(u, o.w, o.h), 0, 0); st.orig = cv;
  } catch (e) { st.orig = null; }
}
function openRes(r) {
  if (!r || r.error === "cancel") return;
  if (!r.ok) { st.msg = r.error === "no reticle" ? L("noReticle") : L("openFail"); st.err = true; sync(); return; }
  st.file = { path: r.path, name: r.name }; st.info = r.info; setOrig(r.info); st.msg = ""; st.err = false; st.lastOut = ""; sync();
}
function doOpen(p) { var A = api(); if (!A) { st.msg = L("noapp"); st.err = true; sync(); return; } A.retOpen(p || "").then(openRes); }
function save() {
  var A = api(); if (!A || !st.file || st.busy) return;
  var N = 1080, s0 = st.set, s = {}, req;
  Object.keys(s0).forEach(function (k) { s[k] = s0[k]; }); s.col = "#ffffff"; s.alpha = 100;
  if (s0.fmt === "vec") req = { fmt: "vec", vec: vecAll(s), dyn: s.dyn, vis: s0.vis, col: hx(s0.col), ecol: hx(s0.ecol), alpha: s0.alpha };
  else {
    var cv = document.createElement("canvas"); cv.width = cv.height = N;
    var c = cv.getContext("2d"); paint(c, N, N / boxPx(s), s);
    var img = c.getImageData(0, 0, N, N);
    req = { w: N, h: N, rgba: new Uint8Array(img.data.buffer), boxPx: boxPx(s), dyn: s.dyn, vis: s0.vis, col: hx(s0.col), ecol: hx(s0.ecol), alpha: s0.alpha };
  }
  st.busy = true; st.msg = ""; st.err = false; sync();
  A.retSave(req).then(function (r) {
    st.busy = false;
    if (r && r.ok) { st.msg = L("saved") + ": " + r.path.split(/[\\/]/).pop() + " (" + (r.size / 1024).toFixed(1) + " KB)"; st.err = false; st.lastOut = r.path; }
    else if (r && r.error === "cancel") st.msg = "";
    else { st.msg = L("fail") + (r && r.error ? ": " + r.error : ""); st.err = true; }
    sync();
  }, function () { st.busy = false; st.msg = L("fail"); st.err = true; sync(); });
}
function applyPreset(id) {
  var p = PRESETS.filter(function (x) { return x[0] === id; })[0]; if (!p) return;
  Object.keys(p[2]).forEach(function (k) { st.set[k] = p[2][k]; }); st.set.pre = id; persist(); sync();
}
function setVal(k, v) {
  if (k === "view") { st.view = v; sync(); return; }
  if (k === "bg") { st.bg = v; var stg = $("#retStage"); if (stg) stg.className = "stage bg-" + v; sync(); return; }
  if (k === "zoom") { st.zoom = v === "fit" ? "fit" : Number(v); sync(); return; }
  st.set[k] = v; if (k !== "dyn" && k !== "vis") st.set.pre = ""; persist(); sync();
}
function onClick(e) {
  if (!live()) return;
  var t = e.target;
  var pre = t.closest("[data-pre]"); if (pre) { applyPreset(pre.dataset.pre); return; }
  var sw = t.closest("[data-sw]"); if (sw) { setVal("col", sw.dataset.sw); return; }
  var b = t.closest("button[data-k]");
  if (b && !b.disabled) { var k = b.dataset.k; if (b.classList.contains("chk")) setVal(k, st.set[k] ? 0 : 1); else { var v = b.dataset.v; setVal(k, ["zoom", "view", "bg"].indexOf(k) >= 0 || typeof st.set[k] !== "number" ? v : Number(v)); } return; }
  var id = t.id || (t.closest("button") || {}).id;
    if (id === "retGo") { save(); return; }
  if (id === "retReset") { st.set = clone(DEF); persist(); sync(); return; }
  if (id === "retRev") { var A = api(); if (A && A.retReveal && st.lastOut) A.retReveal(st.lastOut); return; }
}
function onInput(e) {
  if (!live()) return;
  var el = e.target.closest("[data-k]"); if (!el || el.tagName === "BUTTON") return;
  var k = el.dataset.k, v = el.value;
  if (el.dataset.n) { v = parseFloat(v); if (!isFinite(v)) return; var mn = parseFloat(el.min), mx = parseFloat(el.max); if (v < mn) v = mn; if (v > mx) v = mx; }
  setVal(k, v);
}
function live() { return root && root.querySelector(".ret-g"); }
function onToggle(e) { var d = e.target; if (live() && d && d.dataset && d.dataset.sec) st.open[d.dataset.sec] = d.open ? 1 : 0; }
function onOver(e) { if (!live()) return; e.preventDefault(); var s = $("#retStage"); if (s) s.classList.add("over"); }
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var s = $("#retStage"); if (s) s.classList.remove("over"); } }
function onDrop(e) {
  if (!live()) return; e.preventDefault(); var s = $("#retStage"); if (s) s.classList.remove("over"); var A = window.api;
  var ps = Array.prototype.map.call(e.dataTransfer.files, function (f) { return A && A.pathForFile ? A.pathForFile(f) : f.path; }).filter(function (p) { return p && /\.(gfx|swf)$/i.test(p); });
  if (ps.length) doOpen(ps[0]);
}
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onInput);
  root.addEventListener("toggle", onToggle, true); 
  var stg = $("#retStage"); if (stg) stg.className = "stage bg-" + st.bg;
  sync();
  if (!st.file) doOpen("");
}
window.addEventListener("resize", function () { if (root && root.isConnected && st.zoom === "fit") drawStage(); });

window.RETT = { html: html, mount: mount, drawRet: drawRet, vecAll: vecAll };
window.TOOLS = (window.TOOLS || []).concat([{ id: "ret", ico: '<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
