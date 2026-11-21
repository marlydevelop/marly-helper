/* Инструмент «Удаление фона». Подключается после tool-up.js; регистрирует window.TOOLS.
   Нейросеть U2-Net (ONNX) крутится в главном процессе (rm.js, IPC rm:*), всё остальное считается в окне:
   подготовка картинки, улучшение краёв по самой картинке (guided filter), сборка результата.
   На диск пишет главный процесс через up:save. Идея и набор моделей: backgroundremover (MIT), модели U2-Net (Apache-2.0). */
(function () {
"use strict";

/* ---------- расчётное ядро (чистые функции, без DOM) ---------- */
var RMC = (function () {
  var N = 320, MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];
  function tensor(rgba) {
    var nn = N * N, out = new Float32Array(3 * nn), mx = 1e-6, i, c;
    for (i = 0; i < nn; i++) for (c = 0; c < 3; c++) { var v = rgba[i * 4 + c]; if (v > mx) mx = v; }
    for (i = 0; i < nn; i++) for (c = 0; c < 3; c++) out[c * nn + i] = (rgba[i * 4 + c] / mx - MEAN[c]) / STD[c];
    return out;
  }
  function boxBlur(a, w, h, r) {
    r = Math.round(r); if (r < 1) return Float32Array.from(a);
    var t = new Float32Array(w * h), o = new Float32Array(w * h), x, y, s, x0, x1, b;
    for (y = 0; y < h; y++) {
      b = y * w; s = 0; for (x = 0; x <= Math.min(r, w - 1); x++) s += a[b + x];
      for (x = 0; x < w; x++) {
        x0 = Math.max(0, x - r); x1 = Math.min(w - 1, x + r); t[b + x] = s / (x1 - x0 + 1);
        if (x + r + 1 < w) s += a[b + x + r + 1]; if (x - r >= 0) s -= a[b + x - r];
      }
    }
    for (x = 0; x < w; x++) {
      s = 0; for (y = 0; y <= Math.min(r, h - 1); y++) s += t[y * w + x];
      for (y = 0; y < h; y++) {
        x0 = Math.max(0, y - r); x1 = Math.min(h - 1, y + r); o[y * w + x] = s / (x1 - x0 + 1);
        if (y + r + 1 < h) s += t[(y + r + 1) * w + x]; if (y - r >= 0) s -= t[(y - r) * w + x];
      }
    }
    return o;
  }
  /* направленный фильтр: подтягивает границы маски p к контурам картинки I (He et al.) */
  function guided(I, p, w, h, r, eps) {
    var n = w * h, i, Ip = new Float32Array(n), II = new Float32Array(n);
    for (i = 0; i < n; i++) { Ip[i] = I[i] * p[i]; II[i] = I[i] * I[i]; }
    var mI = boxBlur(I, w, h, r), mp = boxBlur(p, w, h, r), mIp = boxBlur(Ip, w, h, r), mII = boxBlur(II, w, h, r);
    var a = new Float32Array(n), b = new Float32Array(n);
    for (i = 0; i < n; i++) { var cov = mIp[i] - mI[i] * mp[i], vr = mII[i] - mI[i] * mI[i]; a[i] = cov / (vr + eps); b[i] = mp[i] - a[i] * mI[i]; }
    var ma = boxBlur(a, w, h, r), mb = boxBlur(b, w, h, r), q = new Float32Array(n);
    for (i = 0; i < n; i++) { var v = ma[i] * I[i] + mb[i]; q[i] = v < 0 ? 0 : v > 1 ? 1 : v; }
    return q;
  }
  function levels(m, t, s) {
    var n = m.length, i, lo = t - s, k = s > 0.005 ? 1 / (2 * s) : 1e6;
    for (i = 0; i < n; i++) { var v = (m[i] - lo) * k; v = v < 0 ? 0 : v > 1 ? 1 : v; m[i] = v * v * (3 - 2 * v); }
  }
  /* оставляет крупные объекты: всё, что меньше frac от самого большого, стирается */
  function keepMain(m, w, h, frac) {
    var n = w * h, lab = new Int32Array(n), st = new Int32Array(n), areas = [0], cnt = 0, i, mx = 0;
    for (i = 0; i < n; i++) {
      if (lab[i] || m[i] <= 0.2) continue;
      cnt++; var sp = 0, area = 0; st[sp++] = i; lab[i] = cnt;
      while (sp) {
        var p = st[--sp], x = p % w, y = (p - x) / w; area++;
        if (x > 0 && !lab[p - 1] && m[p - 1] > 0.2) { lab[p - 1] = cnt; st[sp++] = p - 1; }
        if (x < w - 1 && !lab[p + 1] && m[p + 1] > 0.2) { lab[p + 1] = cnt; st[sp++] = p + 1; }
        if (y > 0 && !lab[p - w] && m[p - w] > 0.2) { lab[p - w] = cnt; st[sp++] = p - w; }
        if (y < h - 1 && !lab[p + w] && m[p + w] > 0.2) { lab[p + w] = cnt; st[sp++] = p + w; }
      }
      areas.push(area); if (area > mx) mx = area;
    }
    for (i = 0; i < n; i++) if (lab[i] && areas[lab[i]] < mx * frac) m[i] = 0;
  }
  /* m: маска 0..1 (изменяется), gray: яркость 0..1; o: { r, eps, t, s, keep, f } */
  function refine(m, gray, w, h, o) {
    var q = m;
    if (o.r >= 1) q = guided(gray, m, w, h, o.r, o.eps);
    levels(q, o.t, o.s);
    if (o.keep) keepMain(q, w, h, 0.15);
    if (o.f >= 1) { q = boxBlur(q, w, h, o.f); q = boxBlur(q, w, h, Math.max(1, Math.round(o.f * 0.7))); }
    return q;
  }
  function hex(c) { var m = /^#?([0-9a-f]{6})$/i.exec(String(c || "")); var v = parseInt(m ? m[1] : "ffffff", 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  /* rgba — исходные пиксели, alpha — маска 0..1; out: cut | color | mask */
  function compose(rgba, alpha, mode, color) {
    var n = alpha.length, out = new Uint8ClampedArray(n * 4), i, bg = hex(color);
    for (i = 0; i < n; i++) {
      var a = alpha[i] * rgba[i * 4 + 3] / 255, j = i * 4;
      if (mode === "mask") { var v = Math.round(alpha[i] * 255); out[j] = v; out[j + 1] = v; out[j + 2] = v; out[j + 3] = 255; }
      else if (mode === "color") { out[j] = rgba[j] * a + bg[0] * (1 - a); out[j + 1] = rgba[j + 1] * a + bg[1] * (1 - a); out[j + 2] = rgba[j + 2] * a + bg[2] * (1 - a); out[j + 3] = 255; }
      else { out[j] = rgba[j]; out[j + 1] = rgba[j + 1]; out[j + 2] = rgba[j + 2]; out[j + 3] = Math.round(a * 255); }
    }
    return out;
  }
  function bbox(alpha, w, h) {
    var x0 = w, y0 = h, x1 = -1, y1 = -1, x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (alpha[y * w + x] > 0.03) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  function gray(rgba) {
    var n = rgba.length >> 2, g = new Float32Array(n), i;
    for (i = 0; i < n; i++) { var a = rgba[i * 4 + 3] / 255, l = (0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]) * a + 255 * (1 - a); g[i] = l / 255; }
    return g;
  }
  /* параметры постобработки из настроек для картинки с длинной стороной long при масштабе sc относительно оригинала */
  function opts(s, long, sc) {
    var rf = [0, 0.004, 0.008, 0.016][s.ref] || 0, t = s.thr / 100, sf = s.soft / 100 * 0.5;
    return { r: rf ? Math.max(2, Math.round(long * rf)) : 0, eps: 0.002, t: t, s: sf, keep: s.kp === "main", f: s.fea > 0 ? Math.max(1, Math.round(s.fea * sc)) : 0 };
  }
  return { N: N, tensor: tensor, boxBlur: boxBlur, guided: guided, levels: levels, keepMain: keepMain, refine: refine, compose: compose, bbox: bbox, gray: gray, opts: opts, hex: hex };
})();
if (typeof module !== "undefined" && module.exports) module.exports = RMC;
if (typeof window === "undefined") return;
window.RMC = RMC;

/* ---------- тексты ---------- */
var I = {
en: {
 name:"Background Remover", desc:"Cut out the subject of a photo with AI: transparent PNG, solid color or a mask, for one picture or a whole folder", back:"Tools",
 sub:"Add pictures, check the cutout on the preview. Everything runs on your computer.",
 dropT:"Drop pictures here", dropS:"PNG, JPG, WEBP, BMP, GIF, AVIF · or click to browse", add:"Add", clear:"Clear", files:"Files", nofiles:"No files yet",
 vO:"Original", vS:"Compare", vA:"Result", bgC:"Checker", bgD:"Dark", bgL:"Light", fit:"Fit", tB:"Before", tA:"After",
 busy:"Processing…", perr:"Processing error", noapp:"Processing works in the desktop app only", noeng:"AI engine is not installed. Run start.bat again to install it",  iO:"Original", iA:"Subject", px:"px", cov:"of the frame",
 sP:"Preset", pObj:"Object", pPpl:"People", pPrd:"Sharp edge", hObj:"All-round: things, animals, products.", hPpl:"For portraits and full-length people, soft edges for hair.", hPrd:"Crisp edge for products, logos and graphics.",   dling:"Downloading the AI model {p}%…", dlErr:"Download failed: {e}",
 sE:"Edges", thr:"Threshold", thrS:"Higher cuts more, lower keeps more of the subject", soft:"Softness", softS:"Low = hard edge, high = smooth transition", ref:"Edge refine", refS:"Snaps the edge to the real contours of the picture (hair, fur). Stronger = slower", off:"Off", kp:"Objects", kpA:"All", kpM:"Main only", kpS:"“Main only” erases small separate specks", fea:"Feather", feaS:"Blurs the edge, px (0 = off)",
 sR:"Result", out:"Result", oC:"Cutout", oB:"On color", oM:"Mask only", clr:"Background color", crop:"Trim to subject", cropS:"Cuts the empty margins", pad:"Margin", padS:"Pixels around the subject",
 sO:"Saving", fmt:"Format", fmtS:"JPG has no transparency: a cutout is saved as PNG", fPng:"PNG", fWebp:"WEBP", fJpg:"JPG", q:"Quality", pfx:"Prefix", sfx:"Suffix", lc:"Lowercase names", ow:"Overwrite existing", outF:"Output folder", outAuto:"Next to the original", pickD:"Choose",
 go:"Remove background", stop:"Stop", ok:"{n} saved", errs:"{n} failed", stopped:"Stopped", reveal:"Show in folder", reset:"Reset settings", exists:"File exists",
 sG:"Guide",
 g1:"<b>What it does.</b> A neural network (U2-Net) finds the main subject, then the edge is snapped to the real contours of the picture. Works best when the subject stands out from the background.",
 g2:"<b>Model.</b> The AI model (176 MB) downloads automatically the first time you add a picture, then works offline.",
 g3:"<b>Edges.</b> If parts of the subject disappear, lower the threshold. If a halo is left, raise it. “Edge refine” helps with hair and fur. Try “Preset” first.",
 g4:"<b>Result.</b> A cutout is transparent (PNG, WEBP). “On color” fills the background, “Mask only” gives a black and white mask for editors. Large pictures are refined at up to 2560 px and then scaled back.",
 g5:"<b>Limits.</b> Glass, smoke and very thin details may come out rough. Input: PNG, JPG, WEBP, BMP, GIF, AVIF. Originals are never changed unless you turn on “Overwrite” and leave the suffix empty."
},
ru: {
 name:"Удаление фона", desc:"Вырезает главный объект с фото нейросетью: прозрачный PNG, заливка цветом или маска, для одной картинки или целой папки", back:"Инструменты",
 sub:"Добавь картинки, проверь вырез на предпросмотре. Всё считается на твоём компьютере.",
 dropT:"Перетащи картинки сюда", dropS:"PNG, JPG, WEBP, BMP, GIF, AVIF · или нажми, чтобы выбрать", add:"Добавить", clear:"Очистить", files:"Файлы", nofiles:"Файлов пока нет",
 vO:"Оригинал", vS:"Сравнение", vA:"Результат", bgC:"Шахматка", bgD:"Тёмный", bgL:"Светлый", fit:"По размеру", tB:"До", tA:"После",
 busy:"Обработка…", perr:"Ошибка обработки", noapp:"Обработка работает только в приложении", noeng:"Движок нейросети не установлен. Запусти start.bat ещё раз, он его поставит",  iO:"Оригинал", iA:"Объект", px:"px", cov:"кадра",
 sP:"Пресет", pObj:"Предмет", pPpl:"Люди", pPrd:"Чёткий край", hObj:"Универсальный: вещи, животные, товары.", hPpl:"Для портретов и людей в полный рост, мягкий край для волос.", hPrd:"Чёткий край для товаров, логотипов и графики.",   dling:"Скачиваю модель нейросети {p}%…", dlErr:"Не удалось скачать: {e}",
 sE:"Края", thr:"Порог", thrS:"Выше: режет больше, ниже: оставляет больше объекта", soft:"Мягкость", softS:"Мало: жёсткий край, много: плавный переход", ref:"Уточнение края", refS:"Подтягивает край к настоящим контурам картинки (волосы, шерсть). Сильнее: медленнее", off:"Выкл", kp:"Объекты", kpA:"Все", kpM:"Только главный", kpS:"«Только главный» стирает мелкие отдельные пятна", fea:"Растушёвка", feaS:"Размывает край, px (0 = выкл)",
 sR:"Результат", out:"Результат", oC:"Вырез", oB:"На цвете", oM:"Только маска", clr:"Цвет фона", crop:"Обрезать по объекту", cropS:"Убирает пустые поля", pad:"Отступ", padS:"Пикселей вокруг объекта",
 sO:"Сохранение", fmt:"Формат", fmtS:"В JPG нет прозрачности: вырез сохранится как PNG", fPng:"PNG", fWebp:"WEBP", fJpg:"JPG", q:"Качество", pfx:"Префикс", sfx:"Суффикс", lc:"Имена строчными", ow:"Перезаписывать файлы", outF:"Папка сохранения", outAuto:"Рядом с оригиналом", pickD:"Выбрать",
 go:"Убрать фон", stop:"Стоп", ok:"Сохранено: {n}", errs:"Ошибок: {n}", stopped:"Остановлено", reveal:"Показать в папке", reset:"Сбросить настройки", exists:"Файл уже есть",
 sG:"Справка",
 g1:"<b>Что делает.</b> Нейросеть (U2-Net) находит главный объект, затем край подтягивается к настоящим контурам картинки. Лучше всего работает, когда объект заметно отличается от фона.",
 g2:"<b>Модель.</b> Модель нейросети (176 МБ) скачивается сама, когда ты первый раз добавляешь картинку, потом работает без интернета.",
 g3:"<b>Края.</b> Если пропадают части объекта, уменьши порог. Если остался ореол, увеличь. «Уточнение края» помогает с волосами и шерстью. Сначала попробуй «Пресет».",
 g4:"<b>Результат.</b> Вырез прозрачный (PNG, WEBP). «На цвете» заливает фон, «Только маска» даёт чёрно-белую маску для редакторов. Большие картинки уточняются в размере до 2560 px и потом возвращаются к своему размеру.",
 g5:"<b>Ограничения.</b> Стекло, дым и очень тонкие детали могут выйти грубо. Вход: PNG, JPG, WEBP, BMP, GIF, AVIF. Оригиналы не меняются, пока ты не включишь «Перезаписывать» и не очистишь суффикс."
},
uk: {
 name:"Видалення тла", desc:"Вирізає головний об’єкт із фото нейромережею: прозорий PNG, заливка кольором або маска, для одного зображення чи цілої теки", back:"Інструменти",
 sub:"Додай зображення, перевір виріз на попередньому перегляді. Усе рахується на твоєму комп’ютері.",
 dropT:"Перетягни зображення сюди", dropS:"PNG, JPG, WEBP, BMP, GIF, AVIF · або натисни, щоб обрати", add:"Додати", clear:"Очистити", files:"Файли", nofiles:"Файлів поки немає",
 vO:"Оригінал", vS:"Порівняння", vA:"Результат", bgC:"Шахівниця", bgD:"Темний", bgL:"Світлий", fit:"За розміром", tB:"До", tA:"Після",
 busy:"Обробка…", perr:"Помилка обробки", noapp:"Обробка працює лише в застосунку", noeng:"Рушій нейромережі не встановлено. Запусти start.bat ще раз, він його поставить",  iO:"Оригінал", iA:"Об’єкт", px:"px", cov:"кадру",
 sP:"Пресет", pObj:"Предмет", pPpl:"Люди", pPrd:"Чіткий край", hObj:"Універсальний: речі, тварини, товари.", hPpl:"Для портретів і людей на повний зріст, м’який край для волосся.", hPrd:"Чіткий край для товарів, логотипів і графіки.",   dling:"Завантажую модель нейромережі {p}%…", dlErr:"Не вдалося завантажити: {e}",
 sE:"Краї", thr:"Поріг", thrS:"Вище: ріже більше, нижче: залишає більше об’єкта", soft:"М’якість", softS:"Мало: жорсткий край, багато: плавний перехід", ref:"Уточнення краю", refS:"Підтягує край до справжніх контурів зображення (волосся, шерсть). Сильніше: повільніше", off:"Вимк", kp:"Об’єкти", kpA:"Усі", kpM:"Лише головний", kpS:"«Лише головний» стирає дрібні окремі плями", fea:"Розтушовка", feaS:"Розмиває край, px (0 = вимк)",
 sR:"Результат", out:"Результат", oC:"Виріз", oB:"На кольорі", oM:"Лише маска", clr:"Колір тла", crop:"Обрізати по об’єкту", cropS:"Прибирає порожні поля", pad:"Відступ", padS:"Пікселів навколо об’єкта",
 sO:"Збереження", fmt:"Формат", fmtS:"У JPG немає прозорості: виріз збережеться як PNG", fPng:"PNG", fWebp:"WEBP", fJpg:"JPG", q:"Якість", pfx:"Префікс", sfx:"Суфікс", lc:"Імена малими літерами", ow:"Перезаписувати файли", outF:"Тека збереження", outAuto:"Поруч з оригіналом", pickD:"Обрати",
 go:"Прибрати тло", stop:"Стоп", ok:"Збережено: {n}", errs:"Помилок: {n}", stopped:"Зупинено", reveal:"Показати в теці", reset:"Скинути налаштування", exists:"Файл уже є",
 sG:"Довідка",
 g1:"<b>Що робить.</b> Нейромережа (U2-Net) знаходить головний об’єкт, потім край підтягується до справжніх контурів зображення. Найкраще працює, коли об’єкт помітно відрізняється від тла.",
 g2:"<b>Модель.</b> Модель нейромережі (176 МБ) завантажується сама, коли ти вперше додаєш зображення, потім працює без інтернету.",
 g3:"<b>Краї.</b> Якщо зникають частини об’єкта, зменш поріг. Якщо лишився німб, збільш. «Уточнення краю» допомагає з волоссям і шерстю. Спершу спробуй «Пресет».",
 g4:"<b>Результат.</b> Виріз прозорий (PNG, WEBP). «На кольорі» заливає тло, «Лише маска» дає чорно-білу маску для редакторів. Великі зображення уточнюються в розмірі до 2560 px і потім повертаються до свого розміру.",
 g5:"<b>Обмеження.</b> Скло, дим і дуже тонкі деталі можуть вийти грубо. Вхід: PNG, JPG, WEBP, BMP, GIF, AVIF. Оригінали не змінюються, доки ти не ввімкнеш «Перезаписувати» і не очистиш суфікс."
}
};
var MODEL = "u2net";
var PRESETS = [
 ["obj",  "pObj",  "hObj",  { thr:50, soft:40, ref:2, kp:"all",  fea:0 }],
 ["ppl",  "pPpl",  "hPpl",  { thr:45, soft:50, ref:3, kp:"main", fea:0 }],
 ["prd",  "pPrd",  "hPrd",  { thr:55, soft:15, ref:2, kp:"main", fea:0 }]
];
var DEF = { pre:"obj", thr:50, soft:40, ref:2, kp:"all", fea:0, out:"cut", clr:"#ffffff", crop:0, pad:0, fmt:"png", q:95, px:"", sx:"_nobg", lc:0, ow:0 };
var PV = 1024, EX = 2560;
var st = { files:[], sel:-1, outDir:"", set:clone(DEF), view:"split", bg:"check", zoom:"fit", pos:50, open:{p:1,e:1,r:0,o:0,g:0},
 cur:null, prev:null, busy:false, prog:null, summary:null, lastOut:"", stopFlag:false, ms:null, dl:null, dlErr:"", working:false };
var root = null, lang = "en", tmr = 0, loadId = 0, jobId = 0;
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function persist() { try { localStorage.setItem("mh_rm", JSON.stringify({ set: st.set, outDir: st.outDir })); } catch (e) {} }
try { var sv = JSON.parse(localStorage.getItem("mh_rm") || "null"); if (sv) { Object.keys(DEF).forEach(function (k) { if (sv.set && sv.set[k] !== undefined && typeof sv.set[k] === typeof DEF[k]) st.set[k] = sv.set[k]; }); if (typeof sv.outDir === "string") st.outDir = sv.outDir; } } catch (e) {}
function L(k, v) { var s = (I[lang] && I[lang][k]) || I.en[k] || k; if (v) Object.keys(v).forEach(function (n) { s = s.replace("{" + n + "}", v[n]); }); return s; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function api() { return window.api && window.api.rmInfer && window.api.upSave ? window.api : null; }
function $(s) { return root ? root.querySelector(s) : null; }
function bytesFmt(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
function ready(m) { return !!(st.ms && st.ms.engine && st.ms.models && st.ms.models[m]); }
function refreshStatus() {
  var A = api(); if (!A || !A.rmStatus) return Promise.resolve();
  return A.rmStatus().then(function (r) { st.ms = r; }, function () {});
}

/* ---------- конвейер: маска от нейросети -> уточнение -> результат ---------- */
function getMask(c, model) {
  c.m = c.m || {};
  if (c.m[model]) return Promise.resolve(c.m[model]);
  var A = api(); if (!A) return Promise.reject(new Error("noapp"));
  var N = RMC.N, cv = document.createElement("canvas"); cv.width = N; cv.height = N;
  var g = cv.getContext("2d", { willReadFrequently: true }); g.fillStyle = "#fff"; g.fillRect(0, 0, N, N);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(c.img, 0, 0, N, N);
  var t = RMC.tensor(g.getImageData(0, 0, N, N).data); cv.width = 1; cv.height = 1;
  return A.rmInfer({ model: model, data: t }).then(function (r) {
    if (!r || !r.ok) throw new Error(String(r && r.error || "error"));
    var m = new Uint8Array(r.mask); c.m[model] = m; return m;
  });
}
/* маска 320x320 -> Float32 нужного размера (масштабирование средствами canvas) */
function upMask(m320, w, h) {
  var N = RMC.N, a = document.createElement("canvas"); a.width = N; a.height = N;
  var id = new ImageData(N, N), i; for (i = 0; i < N * N; i++) { id.data[i * 4] = m320[i]; id.data[i * 4 + 1] = m320[i]; id.data[i * 4 + 2] = m320[i]; id.data[i * 4 + 3] = 255; }
  a.getContext("2d").putImageData(id, 0, 0);
  var b = document.createElement("canvas"); b.width = w; b.height = h; var g = b.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(a, 0, 0, w, h);
  var d = g.getImageData(0, 0, w, h).data, o = new Float32Array(w * h); for (i = 0; i < w * h; i++) o[i] = d[i * 4] / 255;
  a.width = 1; a.height = 1; b.width = 1; b.height = 1; return o;
}
function pixels(img, w, h) {
  var cv = document.createElement("canvas"); cv.width = w; cv.height = h; var g = cv.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, w, h);
  var d = g.getImageData(0, 0, w, h).data; cv.width = 1; cv.height = 1; return d;
}
function cropOut(data, w, h, alpha, pad) {
  var bb = RMC.bbox(alpha, w, h); if (!bb) return { w: w, h: h, data: data };
  var x0 = Math.max(0, bb.x - pad), y0 = Math.max(0, bb.y - pad), x1 = Math.min(w, bb.x + bb.w + pad), y1 = Math.min(h, bb.y + bb.h + pad);
  var nw = x1 - x0, nh = y1 - y0, out = new Uint8ClampedArray(nw * nh * 4), y;
  for (y = 0; y < nh; y++) out.set(data.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x1) * 4), y * nw * 4);
  return { w: nw, h: nh, data: out };
}
/* предпросмотр: вся картинка в уменьшенном виде */
function renderPreview(c, set) {
  return getMask(c, MODEL).then(function (m320) {
    var w0 = c.img.naturalWidth, h0 = c.img.naturalHeight, k = Math.min(1, PV / Math.max(w0, h0)), w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
    if (!c.pk || c.pk.w !== w) c.pk = { w: w, h: h, rgba: pixels(c.img, w, h) }, c.pk.gray = RMC.gray(c.pk.rgba), c.pmk = null;
    if (!c.pmk || c.pmk.model !== MODEL) c.pmk = { model: MODEL, m: upMask(m320, w, h) };
    var al = RMC.refine(Float32Array.from(c.pmk.m), c.pk.gray, w, h, RMC.opts(set, Math.max(w, h), w / w0));
    var cov = 0, i; for (i = 0; i < al.length; i++) cov += al[i];
    return { w: w, h: h, data: RMC.compose(c.pk.rgba, al, set.out, set.clr), cov: cov / al.length };
  });
}
/* полный размер (уточнение считается в размере до EX, дальше маска растягивается) */
function renderFull(c, set) {
  return getMask(c, MODEL).then(function (m320) {
    var w0 = c.img.naturalWidth, h0 = c.img.naturalHeight, long = Math.max(w0, h0), k = Math.min(1, EX / long);
    var ww = Math.max(1, Math.round(w0 * k)), hh = Math.max(1, Math.round(h0 * k));
    var small = pixels(c.img, ww, hh), gray = RMC.gray(small);
    var al = RMC.refine(upMask(m320, ww, hh), gray, ww, hh, RMC.opts(set, Math.max(ww, hh), ww / w0));
    var rgba = small;
    if (ww !== w0 || hh !== h0) {
      var a = document.createElement("canvas"); a.width = ww; a.height = hh; var id = new ImageData(ww, hh), i;
      for (i = 0; i < ww * hh; i++) { var v = Math.round(al[i] * 255); id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
      a.getContext("2d").putImageData(id, 0, 0);
      var b = document.createElement("canvas"); b.width = w0; b.height = h0; var g = b.getContext("2d", { willReadFrequently: true });
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(a, 0, 0, w0, h0);
      var d = g.getImageData(0, 0, w0, h0).data; al = new Float32Array(w0 * h0); for (i = 0; i < w0 * h0; i++) al[i] = d[i * 4] / 255;
      a.width = 1; a.height = 1; b.width = 1; b.height = 1;
      rgba = pixels(c.img, w0, h0);
    }
    var out = RMC.compose(rgba, al, set.out, set.clr), w = w0, h = h0;
    if (set.crop) { var cr = cropOut(out, w, h, al, Math.max(0, Math.round(set.pad))); out = cr.data; w = cr.w; h = cr.h; }
    return { w: w, h: h, data: out };
  });
}

/* ---------- разметка ---------- */
function seg(k, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button data-k="' + k + '" data-v="' + o[0] + '" aria-pressed="false">' + o[1] + '</button>'; }).join("") + '</div>'; }
function chk(k) { return '<button class="chk" role="checkbox" data-k="' + k + '" aria-checked="false"></button>'; }
function row(label, hint, ctl, cond, cls) { return '<div class="row' + (cls ? ' ' + cls : '') + '"' + (cond ? ' data-if="' + cond + '"' : '') + '><span class="l">' + label + (hint ? '<small>' + hint + '</small>' : '') + '</span>' + ctl + '</div>'; }
function num(k, min, max, step) { return '<input class="inp" type="number" data-k="' + k + '" data-n="1" min="' + min + '" max="' + max + '" step="' + (step || 1) + '">'; }
function sec(id, title, body) { return '<details class="dsec" data-sec="' + id + '"><summary>' + title + '</summary>' + body + '</details>'; }
function ico(n) { return n === "back" ? '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' : ""; }
function html(lg) {
  lang = lg || lang;
  var pre = '<div class="seg pre">' + PRESETS.map(function (p) { return '<button data-pre="' + p[0] + '" aria-pressed="false" title="' + esc(L(p[2])) + '">' + L(p[1]) + '</button>'; }).join("") + '</div>';
  var settings =
   sec("p", L("sP"), '<div class="prow">' + pre + '<p class="phint" id="rmPh"></p></div>')
  + sec("e", L("sE"), row(L("thr"), L("thrS"), num("thr", 5, 95, 5)) + row(L("soft"), L("softS"), num("soft", 0, 100, 5))
     + row(L("ref"), L("refS"), seg("ref", [["0", L("off")], ["1", "1"], ["2", "2"], ["3", "3"]]), "", "st")
     + row(L("kp"), L("kpS"), seg("kp", [["all", L("kpA")], ["main", L("kpM")]]), "", "st") + row(L("fea"), L("feaS"), num("fea", 0, 20, 1)))
  + sec("r", L("sR"), row(L("out"), "", seg("out", [["cut", L("oC")], ["color", L("oB")], ["mask", L("oM")]]), "", "st")
     + row(L("clr"), "", '<input class="inp clrin" type="color" data-k="clr">', "isColor")
     + row(L("crop"), L("cropS"), chk("crop")) + row(L("pad"), L("padS"), num("pad", 0, 2000, 1), "isCrop"))
  + sec("o", L("sO"), row(L("fmt"), L("fmtS"), seg("fmt", [["png", L("fPng")], ["webp", L("fWebp")], ["jpg", L("fJpg")]]), "", "st")
     + row(L("q"), "", num("q", 50, 100, 1), "hasQ")
     + row(L("pfx"), "", '<input class="inp" type="text" data-k="px" maxlength="40" spellcheck="false">') + row(L("sfx"), "", '<input class="inp" type="text" data-k="sx" maxlength="40" spellcheck="false">') + row(L("lc"), "", chk("lc")) + row(L("ow"), "", chk("ow")))
  + sec("g", L("sG"), ["g1", "g2", "g3", "g4", "g5"].map(function (k) { return '<p class="note">' + L(k) + '</p>'; }).join(""));
  return '<div class="tvh"><button class="back" data-tool="">' + ico("back") + L("back") + '</button><h1>' + L("name") + '</h1><p class="sub">' + L("sub") + '</p></div>'
   + '<div class="rm-g"><div class="ddl"><div class="card ddp">'
   + '<div class="ddt"><div class="ddtr">' + seg("view", [["orig", L("vO")], ["split", L("vS")], ["after", L("vA")]]) + '</div>'
   + '<div class="ddtr">' + seg("bg", [["check", L("bgC")], ["dark", L("bgD")], ["light", L("bgL")]]) + seg("zoom", [["fit", L("fit")], ["1", "100%"], ["2", "200%"], ["4", "400%"]]) + '</div></div>'
   + '<div class="stage" id="rmStage"><div class="sc"><div class="drop" id="rmDrop"><b>' + L("dropT") + '</b><span>' + L("dropS") + '</span></div><div class="cvb" id="rmBox" hidden></div></div><div class="stb" id="rmBadge" hidden></div></div>'
   + '<div class="ddi"><span id="rmiO"></span><span id="rmiV"></span></div></div></div>'
   + '<div class="ddr"><div class="card ddf"><div class="ddfh"><h3>' + L("files") + '</h3><span><button class="mini" id="rmAdd">' + L("add") + '</button><button class="mini" id="rmClr">' + L("clear") + '</button></span></div>'
   + '<div class="flist" id="rmList"></div>'
   + '<div class="fout"><span class="l">' + L("outF") + '<small id="rmOut"></small></span><span class="fob"><button class="mini" id="rmDir">' + L("pickD") + '</button><button class="mini" id="rmOutX" title="×">×</button></span></div>'
   + '<button class="go ddgo" id="rmGo"></button><div class="pbar" id="rmPb" hidden><i></i></div><p class="dsum" id="rmSum"></p></div>'
   + '<div class="card dds">' + settings + '<div class="dres"><button class="mini" id="rmReset">' + L("reset") + '</button></div></div></div></div>';
}

/* ---------- состояние -> DOM ---------- */
var COND = { isColor: function (s) { return s.out === "color"; }, isCrop: function (s) { return !!s.crop; }, hasQ: function (s) { return s.fmt !== "png"; } };
function updDl() {
  var d = st.dl; if (!d) return;
  var p = d.total ? Math.min(99, Math.round(d.got / d.total * 100)) : 0; badge(L("dling", { p: p }));
}
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
  var ph = $("#rmPh"), pr = PRESETS.filter(function (p) { return p[0] === s.pre; })[0]; if (ph) ph.textContent = pr ? L(pr[2]) : "";
  root.querySelectorAll("[data-if]").forEach(function (el) { var f = COND[el.dataset.if]; el.hidden = !(f && f(s)); });
  root.querySelectorAll("details[data-sec]").forEach(function (d) { d.open = !!st.open[d.dataset.sec]; });
  renderFiles(); renderInfo();
}
function renderFiles() {
  var list = $("#rmList"); if (!list) return;
  var has = st.files.length > 0;
  $("#rmDrop").hidden = has && st.cur && st.cur.img ? true : false;
  list.innerHTML = has ? st.files.map(function (f, i) {
    var ic = f.status === "done" ? "✓" : f.status === "err" ? "!" : f.status === "busy" ? "…" : "";
    return '<div class="fi' + (i === st.sel ? " on" : "") + (f.status ? " " + f.status : "") + '" data-i="' + i + '"><span class="fs">' + ic + '</span><span class="fn" title="' + esc(f.path) + '">' + esc(f.name) + '</span>' + (f.err ? '<span class="fe" title="' + esc(f.err) + '">' + esc(f.err === "exists" ? L("exists") : f.err) + '</span>' : "") + '<button class="fx" data-rm="' + i + '" title="×">×</button></div>';
  }).join("") : '<p class="fnone">' + L("nofiles") + '</p>';
  var o = $("#rmOut"); if (o) o.textContent = st.outDir || L("outAuto");
  var x = $("#rmOutX"); if (x) x.hidden = !st.outDir;
  var go = $("#rmGo");
  if (go) { go.disabled = st.busy ? false : (!has || !api() || !!(st.ms && !st.ms.engine)); go.textContent = st.busy ? L("stop") + (st.prog ? " (" + Math.min(st.prog.i + 1, st.prog.n) + " / " + st.prog.n + ")" : "") : L("go") + (has ? " (" + st.files.length + ")" : ""); }
  var sm = $("#rmSum");
  if (sm) {
    if (!api()) sm.textContent = L("noapp");
    else if (st.summary) { sm.innerHTML = (st.summary.ok ? '<b class="okc">' + L("ok", { n: st.summary.ok }) + '</b> ' : "") + (st.summary.err ? '<b class="erc">' + L("errs", { n: st.summary.err }) + '</b> ' : "") + (st.summary.stopped ? '<b>' + L("stopped") + '</b> ' : "") + (st.lastOut ? '<button class="lnk" id="rmRev">' + L("reveal") + '</button>' : ""); }
    else sm.textContent = "";
  }
}
function renderInfo() {
  var a = $("#rmiO"), b = $("#rmiV"); if (!a) return;
  var c = st.cur;
  if (!c || !c.img) { a.textContent = ""; b.textContent = ""; return; }
  a.textContent = L("iO") + ": " + c.img.naturalWidth + "×" + c.img.naturalHeight + " " + L("px") + " · " + bytesFmt(c.size || 0);
  b.textContent = st.prev && st.prev.cov !== undefined ? L("iA") + ": " + Math.round(st.prev.cov * 100) + "% " + L("cov") : "";
}
function badge(t, err) { var b = $("#rmBadge"); if (!b) return; b.hidden = !t; b.textContent = t || ""; b.classList.toggle("er", !!err); }

/* ---------- сцена ---------- */
function drawStage() {
  var box = $("#rmBox"), stg = $("#rmStage"); if (!box) return;
  var c = st.cur;
  if (!c || !c.img) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  var pv = st.prev, eff = st.view === "orig" || !pv ? "orig" : st.view;
  var iw = c.img.naturalWidth, ih = c.img.naturalHeight; st.base = { w: iw, h: ih };
  var sw = stg.clientWidth - 24, sh = stg.clientHeight - 24;
  var sc = st.zoom === "fit" ? Math.min(4, Math.max(0.02, Math.min(sw / iw, sh / ih))) : Number(st.zoom);
  box.style.width = Math.round(iw * sc) + "px"; box.style.height = Math.round(ih * sc) + "px";
  box.classList.toggle("px", sc >= 2);
  stg.className = "stage bg-" + st.bg;
  box.innerHTML = "";
  function im(src) { var e = document.createElement("img"); e.className = "cv"; e.src = src; e.draggable = false; return e; }
  if (eff === "orig") box.appendChild(im(c.img.src));
  else if (eff === "after") box.appendChild(im(pv.url));
  else {
    var b1 = im(c.img.src); b1.style.clipPath = "inset(0 " + (100 - st.pos) + "% 0 0)"; box.appendChild(b1);
    var a2 = im(pv.url); a2.style.clipPath = "inset(0 0 0 " + st.pos + "%)"; box.appendChild(a2);
    var hd = document.createElement("div"); hd.className = "split"; hd.style.left = st.pos + "%"; hd.innerHTML = "<i></i>"; box.appendChild(hd);
    var t1 = document.createElement("span"); t1.className = "tag l"; t1.textContent = L("tB"); var t2 = document.createElement("span"); t2.className = "tag r"; t2.textContent = L("tA"); box.appendChild(t1); box.appendChild(t2);
  }
}

/* ---------- предпросмотр ---------- */
function queuePreview(delay) {
  if (!st.cur || !st.cur.img) return;
  clearTimeout(tmr); badge(L("busy"));
  tmr = setTimeout(runPreview, delay === undefined ? 200 : delay);
}
function revoke(p) { if (p && p.url) { try { URL.revokeObjectURL(p.url); } catch (e) {} } }
function runPreview() {
  var c = st.cur; if (!c || !c.img) return;
  if (!api()) { badge(L("noapp"), 1); return; }
  if (!st.ms) { refreshStatus().then(function () { if (st.cur === c) { sync(); runPreview(); } }); return; }
  if (!ready(MODEL)) {
    st.working = false;
    if (!st.ms.engine) { badge(L("noeng"), 1); sync(); return; }
    if (st.dlErr) { badge(L("dlErr", { e: st.dlErr }), 1); sync(); return; }
    dlStart(); sync(); return;
  }
  var id = ++jobId, set = clone(st.set); st.working = true;
  renderPreview(c, set).then(function (r) {
    if (id !== jobId || st.cur !== c) return;
    var cv = document.createElement("canvas"); cv.width = r.w; cv.height = r.h; cv.getContext("2d").putImageData(new ImageData(r.data, r.w, r.h), 0, 0);
    cv.toBlob(function (b) {
      cv.width = 1; cv.height = 1;
      if (id !== jobId || st.cur !== c) return;
      revoke(st.prev); st.working = false;
      st.prev = { url: b ? URL.createObjectURL(b) : "", cov: r.cov };
      badge(""); drawStage(); sync();
    }, "image/png");
  }, function (e) {
    if (id !== jobId) return;
    st.working = false; badge(L("perr") + ": " + String(e && e.message || e).slice(0, 120), 1);
  });
}

/* ---------- файлы ---------- */
function addPaths(paths) {
  var seen = {}; st.files.forEach(function (f) { seen[f.path.toLowerCase()] = 1; });
  var add = paths.filter(function (p) { return /\.(png|jpe?g|jfif|webp|bmp|gif|avif)$/i.test(p) && !seen[p.toLowerCase()] && (seen[p.toLowerCase()] = 1); });
  add.slice(0, 200 - st.files.length).forEach(function (p) { st.files.push({ path: p, name: p.split(/[\\/]/).pop() }); });
  st.summary = null;
  if (st.sel < 0 && st.files.length) select(0); else sync();
}
function loadImage(path) {
  return new Promise(function (res, rej) {
    var A = window.api; if (!A || !A.upRead) { rej(new Error("noapp")); return; }
    A.upRead(path).then(function (r) {
      if (!r || !r.ok) { rej(new Error(String(r && r.error || "error"))); return; }
      var im = new Image(); im.onload = function () { res({ img: im, size: r.size }); }; im.onerror = function () { rej(new Error("decode error")); }; im.src = r.url;
    }, rej);
  });
}
function select(i) {
  jobId++; clearTimeout(tmr); revoke(st.prev); st.prev = null; st.working = false;
  if (i < 0 || i >= st.files.length) { st.sel = -1; st.cur = null; loadId++; drawStage(); sync(); badge(""); return; }
  st.sel = i; var f = st.files[i], id = ++loadId;
  st.cur = { path: f.path, img: null, size: 0 }; sync(); drawStage(); badge(L("busy"));
  if (!window.api) { badge(L("noapp"), 1); return; }
  loadImage(f.path).then(function (r) {
    if (id !== loadId) return;
    st.cur = { path: f.path, img: r.img, size: r.size }; sync(); drawStage(); queuePreview(0);
  }, function (e) { if (id === loadId) badge(String(e.message || e), 1); });
}

/* ---------- сохранение ---------- */
function outExt(set) { return set.fmt === "webp" ? ".webp" : set.fmt === "jpg" && set.out !== "cut" ? ".jpg" : ".png"; }
function encode(res, ext, q) {
  return new Promise(function (resolve, reject) {
    var cv = document.createElement("canvas"); cv.width = res.w; cv.height = res.h;
    cv.getContext("2d").putImageData(new ImageData(res.data, res.w, res.h), 0, 0);
    cv.toBlob(function (b) {
      cv.width = 1; cv.height = 1;
      if (!b) { reject(new Error("encode error")); return; }
      b.arrayBuffer().then(resolve, reject);
    }, ext === ".jpg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png", Math.max(0.5, Math.min(1, q / 100)));
  });
}
function convert() {
  var A = api(); if (!A || st.busy || !st.files.length || !ready(MODEL)) return;
  st.busy = true; st.stopFlag = false; st.summary = null; st.lastOut = ""; st.prog = { i: 0, n: st.files.length };
  jobId++; clearTimeout(tmr);
  st.files.forEach(function (f) { f.status = "busy"; f.err = ""; });
  var pb = $("#rmPb"); if (pb) { pb.hidden = false; pb.firstChild.style.width = "0%"; }
  sync();
  var ok = 0, er = 0, n = st.files.length, set = clone(st.set), list = st.files.slice(), dir = st.outDir, idx = 0;
  function done() {
    st.busy = false; st.summary = { ok: ok, err: er, stopped: st.stopFlag }; st.prog = null;
    if (st.stopFlag) list.forEach(function (f) { if (f.status === "busy") f.status = ""; });
    sync(); setTimeout(function () { var p = $("#rmPb"); if (p) p.hidden = true; }, 800);
    if (st.cur && st.cur.img && !st.prev) queuePreview(200);
  }
  function step() {
    if (idx >= n || st.stopFlag) { done(); return; }
    var f = list[idx], i = idx++;
    function setBar(p) { var pbb = $("#rmPb"); if (pbb) pbb.firstChild.style.width = Math.round((i + p) / n * 100) + "%"; }
    function fin(success, err, out) {
      if (st.stopFlag && !success) { f.status = ""; done(); return; }
      f.status = success ? "done" : "err"; f.err = err || ""; if (success) { ok++; if (out) st.lastOut = out; } else er++;
      st.prog = { i: i + 1, n: n }; setBar(1); renderFiles(); setTimeout(step, 0);
    }
    st.prog = { i: i, n: n }; renderFiles();
    var cached = st.cur && st.cur.path === f.path && st.cur.img ? Promise.resolve(st.cur) : loadImage(f.path);
    cached.then(function (r) {
      setBar(0.1);
      return renderFull(r, set).then(function (res) {
        setBar(0.8); var ext = outExt(set);
        return encode(res, ext, set.q).then(function (buf) {
          setBar(0.95);
          return A.upSave({ item: { input: f.path, ext: ext, data: buf }, outDir: dir, px: set.px, sx: set.sx, lc: set.lc, ow: set.ow, reset: i === 0 });
        });
      });
    }).then(function (q) { fin(!!(q && q.success), q && q.error, q && q.output); },
      function (e) { fin(false, String(e && e.message || e).slice(0, 120)); });
  }
  step();
}

/* ---------- события ---------- */
function dlStart() {
  var A = api(); if (!A || st.dl) return;
  st.dl = { name: MODEL, got: 0, total: 0 }; st.dlErr = ""; updDl();
  A.rmDownload(MODEL).then(function (r) {
    st.dl = null; if (r && !r.ok) st.dlErr = String(r.error || "error");
    return refreshStatus();
  }).then(function () { sync(); if (ready(MODEL)) queuePreview(0); else if (st.dlErr) badge(L("dlErr", { e: st.dlErr }), 1); }, function () { st.dl = null; sync(); });
}
function applyPreset(id) {
  var p = PRESETS.filter(function (x) { return x[0] === id; })[0]; if (!p) return;
  Object.keys(p[3]).forEach(function (k) { st.set[k] = p[3][k]; }); st.set.pre = id; persist(); sync(); queuePreview();
}
function setVal(k, v) {
  if (k === "view") { st.view = v; drawStage(); sync(); return; }
  if (k === "bg") { st.bg = v; drawStage(); sync(); return; }
  if (k === "zoom") { st.zoom = v === "fit" ? "fit" : Number(v); drawStage(); sync(); return; }
  st.set[k] = v; persist(); sync();
  if (["fmt", "q", "px", "sx", "lc", "ow", "pad", "crop"].indexOf(k) < 0) queuePreview();
}
function onClick(e) {
  if (!live()) return;
  var t = e.target;
  var rm = t.closest("[data-rm]"); if (rm) { if (st.busy) return; var i = Number(rm.dataset.rm); st.files.splice(i, 1); st.summary = null; if (!st.files.length) select(-1); else if (i === st.sel) select(Math.min(i, st.files.length - 1)); else { if (i < st.sel) st.sel--; sync(); } return; }
  var fi = t.closest(".fi"); if (fi) { var j = Number(fi.dataset.i); if (j !== st.sel && !st.busy) select(j); return; }
  var pre = t.closest("[data-pre]"); if (pre) { applyPreset(pre.dataset.pre); return; }
  var b = t.closest("button[data-k]");
  if (b && !b.disabled) { var k = b.dataset.k; if (b.classList.contains("chk")) setVal(k, st.set[k] ? 0 : 1); else { var v = b.dataset.v; setVal(k, k === "zoom" || k === "view" || k === "bg" || typeof st.set[k] !== "number" ? v : Number(v)); } return; }
  var id = t.id || (t.closest("button") || {}).id;
  if (id === "rmAdd" || t.closest("#rmDrop")) { var A = window.api; if (A && A.upPickFiles) A.upPickFiles().then(addPaths); return; }
  if (id === "rmClr") { if (st.busy) return; st.files = []; st.summary = null; select(-1); return; }
  if (id === "rmDir") { var A2 = window.api; if (A2 && A2.ddsPickDir) A2.ddsPickDir().then(function (d) { if (d) { st.outDir = d; persist(); sync(); } }); return; }
  if (id === "rmOutX") { st.outDir = ""; persist(); sync(); return; }
  if (id === "rmGo") { if (st.busy) st.stopFlag = true; else if (!ready(MODEL)) { st.dlErr = ""; dlStart(); } else convert(); return; }
  if (id === "rmReset") { st.set = clone(DEF); persist(); sync(); queuePreview(); return; }
  if (id === "rmRev") { var A4 = window.api; if (A4 && A4.ddsReveal && st.lastOut) A4.ddsReveal(st.lastOut); return; }
}
function onInput(e) {
  if (!live()) return;
  var el = e.target.closest("[data-k]"); if (!el || el.tagName === "BUTTON") return;
  var k = el.dataset.k, v = el.value;
  if (el.dataset.n) { v = parseFloat(v); if (!isFinite(v)) return; var mn = parseFloat(el.min), mx = parseFloat(el.max); if (v < mn) v = mn; if (v > mx) v = mx; }
  else if (k === "px" || k === "sx") { v = v.replace(/[\\\/:*?"<>|]/g, ""); }
  setVal(k, v);
}
function bindSplit(stg) {
  var drag = false;
  function mv(e) { var b = $("#rmBox"); if (!b) return; var r = b.getBoundingClientRect(); st.pos = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); var s = b.querySelector(".split"), cv = b.querySelectorAll(".cv"); if (s) s.style.left = st.pos + "%"; if (cv[0]) cv[0].style.clipPath = "inset(0 " + (100 - st.pos) + "% 0 0)"; if (cv[1]) cv[1].style.clipPath = "inset(0 0 0 " + st.pos + "%)"; }
  stg.addEventListener("pointerdown", function (e) { if (st.view !== "split" || !st.prev || !e.target.closest("#rmBox")) return; drag = true; mv(e); try { stg.setPointerCapture(e.pointerId); } catch (x) {} });
  stg.addEventListener("pointermove", function (e) { if (drag) mv(e); });
  stg.addEventListener("pointerup", function () { drag = false; });
  stg.addEventListener("wheel", function (e) {
    var b = $("#rmBox"), c = st.cur; if (!b || b.hidden || !c || !c.img || !st.base) return;
    e.preventDefault();
    var r = b.getBoundingClientRect(), iw = st.base.w, ih = st.base.h, cur = r.width / iw;
    var ns = Math.max(0.02, Math.min(32, cur * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    if (Math.abs(ns - cur) < 1e-4) return;
    var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    st.zoom = ns;
    b.style.width = Math.round(iw * ns) + "px"; b.style.height = Math.round(ih * ns) + "px"; b.classList.toggle("px", ns >= 2);
    var r2 = b.getBoundingClientRect(), sc = stg.querySelector(".sc");
    if (sc) { sc.scrollLeft += r2.left + fx * r2.width - e.clientX; sc.scrollTop += r2.top + fy * r2.height - e.clientY; }
    sync();
  }, { passive: false });
}
function live() { return root && root.querySelector(".rm-g"); }
function onToggle(e) { var d = e.target; if (live() && d && d.dataset && d.dataset.sec) st.open[d.dataset.sec] = d.open ? 1 : 0; }
function onOver(e) { if (!live()) return; e.preventDefault(); var s = $("#rmStage"); if (s) s.classList.add("over"); }
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var s = $("#rmStage"); if (s) s.classList.remove("over"); } }
function onDrop(e) {
  if (!live()) return; e.preventDefault(); var s = $("#rmStage"); if (s) s.classList.remove("over"); var A = window.api;
  var ps = Array.prototype.map.call(e.dataTransfer.files, function (f) { return A && A.pathForFile ? A.pathForFile(f) : f.path; }).filter(Boolean);
  if (ps.length) addPaths(ps);
}
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onInput);
  root.addEventListener("toggle", onToggle, true); root.addEventListener("dragenter", onOver); root.addEventListener("dragover", onOver);
  root.addEventListener("dragleave", onLeave); root.addEventListener("drop", onDrop);
  var stg = $("#rmStage"); if (stg) bindSplit(stg);
  if (window.api && window.api.onRmDownload) window.api.onRmDownload(function (d) { if (st.dl && d && d.name === st.dl.name) { st.dl.got = d.got; st.dl.total = d.total; updDl(); } });
  sync(); drawStage();
  refreshStatus().then(function () { if (!root || !root.isConnected) return; sync(); if (st.cur && st.cur.img && !st.prev && !st.working) queuePreview(0); });
  if (st.cur && st.cur.img && !st.prev && !st.working && st.ms) queuePreview(0);
}
window.addEventListener("resize", function () { if (root && root.isConnected && st.zoom === "fit" && live()) drawStage(); });

window.RMT = { html: html, mount: mount };
window.TOOLS = (window.TOOLS || []).concat([{ id: "rm", ico: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><circle cx="12" cy="10" r="2.5"/><path d="M7.5 17c.7-2.2 2.4-3.5 4.5-3.5s3.8 1.3 4.5 3.5"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
