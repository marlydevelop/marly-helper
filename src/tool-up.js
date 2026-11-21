/* Инструмент «Улучшение фото». Подключается после lib/upcore.js; регистрирует window.TOOLS.
   Обработка идёт в окне (Web Worker из UPFactory), на диск пишет главный процесс (up.js, IPC up:*).
   Предпросмотр считает небольшой фрагмент в реальных пикселях результата, а не весь кадр. */
(function () {
"use strict";
var I = {
en: {
 name:"Photo Enhancer", desc:"Upscale photos to 2–8× or 2K–8K, reduce noise, recover detail and compare before and after", back:"Tools",
 sub:"Add pictures, pick the size and a preset, then check a real-pixel preview of the area you choose before saving.",
 dropT:"Drop pictures here", dropS:"PNG, JPG, WEBP, BMP, GIF, AVIF · or click to browse", add:"Add", clear:"Clear", files:"Files", nofiles:"No files yet",
 vO:"Original", vS:"Compare", vA:"Result", bgC:"Checker", bgD:"Dark", bgL:"Light", fit:"Fit", tB:"Before", tA:"After",
 busy:"Processing…", perr:"Processing error", noapp:"Processing works in the desktop app only", hintO:"Click the picture to choose the preview area",
 iO:"Original", iA:"Result", px:"px", mp:"MP", lim:"limited to the maximum size",
 sP:"Preset", pPho:"Photo", pOld:"Old / compressed", pArt:"Art / anime", pTex:"Textures", pPix:"Pixel art",
 hPho:"Balanced for normal photos: light cleanup, natural sharpness.", hOld:"Strong cleanup for noisy, low-quality or heavily compressed pictures.", hArt:"Crisp lines for drawings, anime and game art.", hTex:"No denoise, keeps transparency. For mod textures and game assets.", hPix:"Keeps hard pixel edges. Sprites and pixel art.",
 sZ:"Size", mode:"Set size by", mSc:"Scale", mRs:"Resolution", mCu:"Custom", sc:"Scale", scS:"Pick a button or type any factor", rs:"Target", rsS:"Long side of the picture, in pixels", cu:"Long side", cuS:"Pixels, up to 16384", nd:"Don’t shrink", ndS:"If the picture is already bigger than the target, keep its size",
 kern:"Resize method", kL:"Lanczos", kB:"Bicubic", kBi:"Bilinear", kN:"Nearest", kS:"Lanczos is the sharpest. Nearest keeps hard pixels.",
 sC:"Cleanup", nr:"Noise reduction", nrS:"Smooths noise before enlarging and keeps edges. High values are slower", jp:"JPEG artifacts", jpS:"Smooths color blocks left by compression", al:"Auto levels", alS:"Stretches flat, dull contrast",
 sE:"Detail", ibp:"Detail recovery", ibpS:"Passes that pull the enlarged picture back toward the original. More = sharper, slower", off:"Off", sh:"Sharpness", shS:"Sharpens edges by brightness only, no color fringes", dt:"Local contrast", dtS:"Adds depth to midtones and textures", sat:"Saturation", satS:"−50 … +50", gr:"Film grain", grS:"Fine grain so smooth areas don’t look plastic",
 sO:"Saving", fmt:"Format", fSame:"As original", fPng:"PNG", fJpg:"JPG", fWebp:"WEBP", q:"Quality", pfx:"Prefix", sfx:"Suffix", lc:"Lowercase names", ow:"Overwrite existing", out:"Output folder", outAuto:"Next to the original", pickD:"Choose",
 go:"Enhance", stop:"Stop", doing:"Processing {a} / {n}", ok:"{n} saved", errs:"{n} failed", stopped:"Stopped", reveal:"Show in folder", reset:"Reset settings", exists:"File exists",
 sG:"Guide",
 g1:"<b>What it does.</b> Classic algorithms, not AI: smart resizing, denoising, detail recovery and sharpening. Pictures get bigger, cleaner and crisper, but it can’t invent details that were never captured (faces, small text).",
 g2:"<b>Best results.</b> 2–4× on sharp or lightly compressed pictures. Beyond 4× the picture gets bigger but not more detailed.",
 g3:"<b>Preview.</b> Shows a small area at real result pixels. In “Original” click the picture to choose another area, in “Compare” drag the slider. “Before” is the plain stretched original.",
 g4:"<b>Speed.</b> Big files, strong noise reduction and detail recovery take time (a 24 MP result can take 10–20 seconds). You can stop at any time.",
 g5:"<b>Limits and files.</b> The result is capped at 64 MP and 16384 px per side. Input: PNG, JPG, WEBP, BMP, GIF, AVIF. Output: PNG, JPG, WEBP. Transparency stays in PNG and WEBP, JPG gets a white background. Originals are never changed unless you turn on “Overwrite” and leave the suffix empty."
},
ru: {
 name:"Улучшение фото", desc:"Увеличивает фото в 2–8 раз или до 2K–8K, убирает шум, возвращает детали и показывает до/после", back:"Инструменты",
 sub:"Добавь картинки, выбери размер и пресет и проверь предпросмотр в реальных пикселях на нужном участке перед сохранением.",
 dropT:"Перетащи картинки сюда", dropS:"PNG, JPG, WEBP, BMP, GIF, AVIF · или нажми, чтобы выбрать", add:"Добавить", clear:"Очистить", files:"Файлы", nofiles:"Файлов пока нет",
 vO:"Оригинал", vS:"Сравнение", vA:"Результат", bgC:"Шахматка", bgD:"Тёмный", bgL:"Светлый", fit:"По размеру", tB:"До", tA:"После",
 busy:"Обрабатываю…", perr:"Ошибка обработки", noapp:"Обработка работает только в приложении", hintO:"Кликни по картинке, чтобы выбрать участок предпросмотра",
 iO:"Оригинал", iA:"Результат", px:"px", mp:"Мп", lim:"ограничено максимальным размером",
 sP:"Пресет", pPho:"Фото", pOld:"Старое / сжатое", pArt:"Арт / аниме", pTex:"Текстуры", pPix:"Пиксель-арт",
 hPho:"Баланс для обычных фото: лёгкая очистка, естественная резкость.", hOld:"Сильная очистка для шумных, плохих и сильно сжатых картинок.", hArt:"Чёткие линии для рисунков, аниме и артов из игр.", hTex:"Без шумоподавления, прозрачность сохраняется. Для текстур модов и игровых ассетов.", hPix:"Сохраняет жёсткие пиксельные края. Спрайты и пиксель-арт.",
 sZ:"Размер", mode:"Задать размер через", mSc:"Масштаб", mRs:"Разрешение", mCu:"Свой", sc:"Масштаб", scS:"Выбери кнопку или впиши любой множитель", rs:"Цель", rsS:"Длинная сторона картинки в пикселях", cu:"Длинная сторона", cuS:"Пиксели, до 16384", nd:"Не уменьшать", ndS:"Если картинка уже больше цели, оставить её размер",
 kern:"Метод увеличения", kL:"Lanczos", kB:"Bicubic", kBi:"Bilinear", kN:"Nearest", kS:"Lanczos самый чёткий. Nearest сохраняет жёсткие пиксели.",
 sC:"Очистка", nr:"Шумоподавление", nrS:"Сглаживает шум до увеличения, края сохраняются. Большие значения медленнее", jp:"Артефакты JPEG", jpS:"Сглаживает цветные блоки от сжатия", al:"Авто-уровни", alS:"Растягивает вялый плоский контраст",
 sE:"Детали", ibp:"Возврат деталей", ibpS:"Проходы, подтягивающие увеличенную картинку к оригиналу. Больше = чётче, но медленнее", off:"Выкл", sh:"Резкость", shS:"Усиливает края только по яркости, без цветной каймы", dt:"Локальный контраст", dtS:"Добавляет глубину средним тонам и фактурам", sat:"Насыщенность", satS:"От −50 до +50", gr:"Плёночное зерно", grS:"Тонкое зерно, чтобы гладкие места не выглядели пластиковыми",
 sO:"Сохранение", fmt:"Формат", fSame:"Как оригинал", fPng:"PNG", fJpg:"JPG", fWebp:"WEBP", q:"Качество", pfx:"Префикс", sfx:"Суффикс", lc:"Имена строчными", ow:"Перезаписывать", out:"Папка вывода", outAuto:"Рядом с оригиналом", pickD:"Выбрать",
 go:"Улучшить", stop:"Остановить", doing:"Обрабатываю {a} / {n}", ok:"Сохранено: {n}", errs:"Ошибок: {n}", stopped:"Остановлено", reveal:"Показать в папке", reset:"Сбросить настройки", exists:"Файл уже есть",
 sG:"Справка",
 g1:"<b>Что делает.</b> Классические алгоритмы, не нейросеть: умное изменение размера, шумоподавление, возврат деталей и резкость. Картинка становится больше, чище и чётче, но придумать детали, которых не было на снимке (лица, мелкий текст), она не может.",
 g2:"<b>Лучший результат.</b> 2–4× на чётких или слабо сжатых картинках. Больше 4× картинка становится крупнее, но не детальнее.",
 g3:"<b>Предпросмотр.</b> Показывает небольшой участок в реальных пикселях результата. В режиме «Оригинал» кликни по картинке, чтобы выбрать другой участок, в «Сравнении» двигай ползунок. «До» это просто растянутый оригинал.",
 g4:"<b>Скорость.</b> Большие файлы, сильное шумоподавление и возврат деталей занимают время (результат в 24 Мп может считаться 10–20 секунд). Остановить можно в любой момент.",
 g5:"<b>Лимиты и файлы.</b> Результат ограничен 64 Мп и 16384 px по стороне. На входе: PNG, JPG, WEBP, BMP, GIF, AVIF. На выходе: PNG, JPG, WEBP. Прозрачность сохраняется в PNG и WEBP, у JPG будет белый фон. Оригиналы не меняются, пока ты сам не включишь «Перезаписывать» и не оставишь суффикс пустым."
},
uk: {
 name:"Покращення фото", desc:"Збільшує фото у 2–8 разів або до 2K–8K, прибирає шум, повертає деталі та показує до/після", back:"Інструменти",
 sub:"Додай картинки, обери розмір і пресет та перевір попередній перегляд у реальних пікселях на потрібній ділянці перед збереженням.",
 dropT:"Перетягни картинки сюди", dropS:"PNG, JPG, WEBP, BMP, GIF, AVIF · або натисни, щоб обрати", add:"Додати", clear:"Очистити", files:"Файли", nofiles:"Файлів поки немає",
 vO:"Оригінал", vS:"Порівняння", vA:"Результат", bgC:"Шахівниця", bgD:"Темний", bgL:"Світлий", fit:"За розміром", tB:"До", tA:"Після",
 busy:"Обробляю…", perr:"Помилка обробки", noapp:"Обробка працює лише в застосунку", hintO:"Клікни по картинці, щоб обрати ділянку попереднього перегляду",
 iO:"Оригінал", iA:"Результат", px:"px", mp:"Мп", lim:"обмежено максимальним розміром",
 sP:"Пресет", pPho:"Фото", pOld:"Старе / стиснене", pArt:"Арт / аніме", pTex:"Текстури", pPix:"Піксель-арт",
 hPho:"Баланс для звичайних фото: легке очищення, природна різкість.", hOld:"Сильне очищення для шумних, поганих і дуже стиснених картинок.", hArt:"Чіткі лінії для малюнків, аніме та артів із ігор.", hTex:"Без шумозаглушення, прозорість зберігається. Для текстур модів та ігрових ассетів.", hPix:"Зберігає жорсткі піксельні краї. Спрайти та піксель-арт.",
 sZ:"Розмір", mode:"Задати розмір через", mSc:"Масштаб", mRs:"Роздільність", mCu:"Свій", sc:"Масштаб", scS:"Обери кнопку або впиши будь-який множник", rs:"Ціль", rsS:"Довша сторона картинки в пікселях", cu:"Довша сторона", cuS:"Пікселі, до 16384", nd:"Не зменшувати", ndS:"Якщо картинка вже більша за ціль, залишити її розмір",
 kern:"Метод збільшення", kL:"Lanczos", kB:"Bicubic", kBi:"Bilinear", kN:"Nearest", kS:"Lanczos найчіткіший. Nearest зберігає жорсткі пікселі.",
 sC:"Очищення", nr:"Шумозаглушення", nrS:"Згладжує шум до збільшення, краї зберігаються. Великі значення повільніші", jp:"Артефакти JPEG", jpS:"Згладжує кольорові блоки від стиснення", al:"Авто-рівні", alS:"Розтягує млявий плаский контраст",
 sE:"Деталі", ibp:"Повернення деталей", ibpS:"Проходи, що підтягують збільшену картинку до оригіналу. Більше = чіткіше, але повільніше", off:"Вимк", sh:"Різкість", shS:"Підсилює краї лише за яскравістю, без кольорової облямівки", dt:"Локальний контраст", dtS:"Додає глибину середнім тонам і фактурам", sat:"Насиченість", satS:"Від −50 до +50", gr:"Плівкове зерно", grS:"Тонке зерно, щоб гладкі місця не виглядали пластиковими",
 sO:"Збереження", fmt:"Формат", fSame:"Як оригінал", fPng:"PNG", fJpg:"JPG", fWebp:"WEBP", q:"Якість", pfx:"Префікс", sfx:"Суфікс", lc:"Імена малими літерами", ow:"Перезаписувати", out:"Папка виводу", outAuto:"Поруч з оригіналом", pickD:"Обрати",
 go:"Покращити", stop:"Зупинити", doing:"Обробляю {a} / {n}", ok:"Збережено: {n}", errs:"Помилок: {n}", stopped:"Зупинено", reveal:"Показати в папці", reset:"Скинути налаштування", exists:"Файл уже є",
 sG:"Довідка",
 g1:"<b>Що робить.</b> Класичні алгоритми, не нейромережа: розумна зміна розміру, шумозаглушення, повернення деталей і різкість. Картинка стає більшою, чистішою і чіткішою, але вигадати деталі, яких не було на знімку (обличчя, дрібний текст), вона не може.",
 g2:"<b>Найкращий результат.</b> 2–4× на чітких або слабко стиснених картинках. Більше 4× картинка стає більшою, але не детальнішою.",
 g3:"<b>Попередній перегляд.</b> Показує невелику ділянку в реальних пікселях результату. У режимі «Оригінал» клікни по картинці, щоб обрати іншу ділянку, у «Порівнянні» рухай повзунок. «До» це просто розтягнутий оригінал.",
 g4:"<b>Швидкість.</b> Великі файли, сильне шумозаглушення і повернення деталей потребують часу (результат у 24 Мп може рахуватися 10–20 секунд). Зупинити можна будь-коли.",
 g5:"<b>Ліміти і файли.</b> Результат обмежений 64 Мп і 16384 px за стороною. На вході: PNG, JPG, WEBP, BMP, GIF, AVIF. На виході: PNG, JPG, WEBP. Прозорість зберігається в PNG і WEBP, у JPG буде білий фон. Оригінали не змінюються, доки ти сам не ввімкнеш «Перезаписувати» і не залишиш суфікс порожнім."
}
};
var PRESETS = [
 ["photo", "pPho", "hPho", { nr:20, jp:0, al:0, sh:40, dt:10, ibp:1, sat:0, gr:0, kern:"lanczos" }],
 ["old",   "pOld", "hOld", { nr:50, jp:1, al:1, sh:45, dt:10, ibp:1, sat:6, gr:2, kern:"lanczos" }],
 ["art",   "pArt", "hArt", { nr:15, jp:1, al:0, sh:60, dt:0,  ibp:2, sat:0, gr:0, kern:"lanczos" }],
 ["tex",   "pTex", "hTex", { nr:0,  jp:0, al:0, sh:35, dt:10, ibp:1, sat:0, gr:0, kern:"lanczos" }],
 ["pix",   "pPix", "hPix", { nr:0,  jp:0, al:0, sh:0,  dt:0,  ibp:0, sat:0, gr:0, kern:"nearest" }]
];
var DEF = { pre:"photo", mode:"scale", scale:2, res:3840, custom:3000, nd:1, kern:"lanczos", nr:20, jp:0, al:0, sh:40, dt:10, ibp:1, sat:0, gr:0, fmt:"same", q:95, px:"", sx:"_up", lc:0, ow:0 };
var P = 720;
var st = { files:[], sel:-1, outDir:"", set:clone(DEF), view:"split", bg:"check", zoom:"fit", pos:50, cx:0.5, cy:0.5, open:{p:1,z:1,c:0,e:0,o:0,g:0},
 cur:null, prev:null, busy:false, prog:null, summary:null, lastOut:"", stopFlag:false };
var root = null, lang = "en", tmr = 0, loadId = 0, jobId = 0, pw = null, exW = null, U = null;
function persist() { try { localStorage.setItem("mh_up", JSON.stringify({ set: st.set, outDir: st.outDir })); } catch (e) {} }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
try { var sv = JSON.parse(localStorage.getItem("mh_up") || "null"); if (sv) { Object.keys(DEF).forEach(function (k) { if (sv.set && sv.set[k] !== undefined && typeof sv.set[k] === typeof DEF[k]) st.set[k] = sv.set[k]; }); if (typeof sv.outDir === "string") st.outDir = sv.outDir; } } catch (e) {}
function L(k, v) { var s = (I[lang] && I[lang][k]) || I.en[k] || k; if (v) Object.keys(v).forEach(function (n) { s = s.replace("{" + n + "}", v[n]); }); return s; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function api() { return window.api && window.api.upSave ? window.api : null; }
function $(s) { return root ? root.querySelector(s) : null; }
function bytesFmt(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
function core() { if (!U && window.UPFactory) U = window.UPFactory(); return U; }
function coreSet() { var s = st.set; return { mode: s.mode, scale: s.scale, res: s.res, custom: s.custom, noDown: s.nd, kern: s.kern, nr: s.nr, jp: s.jp, al: s.al, sh: s.sh, dt: s.dt, ibp: s.ibp, sat: s.sat, grain: s.gr }; }
function outDims() { var c = st.cur, u = core(); if (!c || !c.img || !u) return null; return u.outSize(c.img.naturalWidth, c.img.naturalHeight, coreSet()); }

/* ---------- Worker ---------- */
function makeWorker() {
  try {
    var src = "var U=(" + window.UPFactory.toString() + ")();onmessage=function(e){var j=e.data;try{var r=U.run(j,function(p){postMessage({t:'p',v:p})});postMessage({t:'d',w:r.w,h:r.h,hasA:r.hasA,data:r.data.buffer},[r.data.buffer])}catch(x){postMessage({t:'e',m:String(x&&x.message||x)})}};";
    var url = URL.createObjectURL(new Blob([src], { type: "text/javascript" })), w = new Worker(url);
    try { URL.revokeObjectURL(url); } catch (e) {}
    return w;
  } catch (e) { return null; }
}
/* запуск задачи: Promise<{w,h,data:Uint8ClampedArray}>; handle.kill() прерывает расчёт */
function runJob(job, onProg, handle) {
  return new Promise(function (resolve, reject) {
    var w = makeWorker();
    if (!w) {
      setTimeout(function () { try { var r = core().run(job, onProg); resolve({ w: r.w, h: r.h, data: r.data }); } catch (e) { reject(e); } }, 20);
      return;
    }
    handle.w = w; handle.kill = function () { try { w.terminate(); } catch (e) {} handle.w = null; reject(new Error("cancel")); };
    w.onmessage = function (e) {
      var m = e.data;
      if (m.t === "p") { if (onProg) onProg(m.v); }
      else if (m.t === "d") { try { w.terminate(); } catch (x) {} handle.w = null; resolve({ w: m.w, h: m.h, data: new Uint8ClampedArray(m.data) }); }
      else { try { w.terminate(); } catch (x) {} handle.w = null; reject(new Error(m.m)); }
    };
    w.onerror = function (e) { try { w.terminate(); } catch (x) {} handle.w = null; reject(new Error(String(e && e.message || "worker error"))); };
    w.postMessage(job, [job.data.buffer]);
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
   sec("p", L("sP"), '<div class="prow">' + pre + '<p class="phint" id="upPh"></p></div>')
  + sec("z", L("sZ"), row(L("mode"), "", seg("mode", [["scale", L("mSc")], ["res", L("mRs")], ["custom", L("mCu")]]), "", "st")
     + row(L("sc"), L("scS"), seg("scale", [["1.5", "1.5×"], ["2", "2×"], ["3", "3×"], ["4", "4×"], ["6", "6×"], ["8", "8×"]]) + num("scale", 0.1, 16, 0.1), "isSc", "st")
     + row(L("rs"), L("rsS"), seg("res", [["1920", "HD 1920"], ["2560", "2K 2560"], ["3072", "3K 3072"], ["3840", "4K 3840"], ["5120", "5K 5120"], ["7680", "8K 7680"]]), "isRs", "st")
     + row(L("cu"), L("cuS"), num("custom", 64, 16384, 1), "isCu")
     + row(L("nd"), L("ndS"), chk("nd"), "notSc")
     + '<p class="phint" id="upSz"></p>'
     + row(L("kern"), L("kS"), seg("kern", [["lanczos", L("kL")], ["bicubic", L("kB")], ["bilinear", L("kBi")], ["nearest", L("kN")]]), "", "st"))
  + sec("c", L("sC"), row(L("nr"), L("nrS"), num("nr", 0, 100, 5)) + row(L("jp"), L("jpS"), chk("jp")) + row(L("al"), L("alS"), chk("al")))
  + sec("e", L("sE"), row(L("ibp"), L("ibpS"), seg("ibp", [["0", L("off")], ["1", "1"], ["2", "2"], ["3", "3"]]))
     + row(L("sh"), L("shS"), num("sh", 0, 150, 5)) + row(L("dt"), L("dtS"), num("dt", 0, 100, 5)) + row(L("sat"), L("satS"), num("sat", -50, 50, 5)) + row(L("gr"), L("grS"), num("gr", 0, 20, 1)))
  + sec("o", L("sO"), row(L("fmt"), "", seg("fmt", [["same", L("fSame")], ["png", L("fPng")], ["jpg", L("fJpg")], ["webp", L("fWebp")]]), "", "st")
     + row(L("q"), "", num("q", 50, 100, 1), "hasQ")
     + row(L("pfx"), "", '<input class="inp" type="text" data-k="px" maxlength="40" spellcheck="false">') + row(L("sfx"), "", '<input class="inp" type="text" data-k="sx" maxlength="40" spellcheck="false">') + row(L("lc"), "", chk("lc")) + row(L("ow"), "", chk("ow")))
  + sec("g", L("sG"), ["g1", "g2", "g3", "g4", "g5"].map(function (k) { return '<p class="note">' + L(k) + '</p>'; }).join(""));
  return '<div class="tvh"><button class="back" data-tool="">' + ico("back") + L("back") + '</button><h1>' + L("name") + '</h1><p class="sub">' + L("sub") + '</p></div>'
   + '<div class="up-g"><div class="ddl"><div class="card ddp">'
   + '<div class="ddt"><div class="ddtr">' + seg("view", [["orig", L("vO")], ["split", L("vS")], ["after", L("vA")]]) + '</div>'
   + '<div class="ddtr">' + seg("bg", [["check", L("bgC")], ["dark", L("bgD")], ["light", L("bgL")]]) + seg("zoom", [["fit", L("fit")], ["1", "100%"], ["2", "200%"], ["4", "400%"]]) + '</div></div>'
   + '<div class="stage" id="upStage"><div class="sc"><div class="drop" id="upDrop"><b>' + L("dropT") + '</b><span>' + L("dropS") + '</span></div><div class="cvb" id="upBox" hidden></div></div><div class="stb" id="upBadge" hidden></div></div>'
   + '<div class="ddi"><span id="upiO"></span><span id="upiV"></span></div></div></div>'
   + '<div class="ddr"><div class="card ddf"><div class="ddfh"><h3>' + L("files") + '</h3><span><button class="mini" id="upAdd">' + L("add") + '</button><button class="mini" id="upClr">' + L("clear") + '</button></span></div>'
   + '<div class="flist" id="upList"></div>'
   + '<div class="fout"><span class="l">' + L("out") + '<small id="upOut"></small></span><span class="fob"><button class="mini" id="upDir">' + L("pickD") + '</button><button class="mini" id="upOutX" title="×">×</button></span></div>'
   + '<button class="go ddgo" id="upGo"></button><div class="pbar" id="upPb" hidden><i></i></div><p class="dsum" id="upSum"></p></div>'
   + '<div class="card dds">' + settings + '<div class="dres"><button class="mini" id="upReset">' + L("reset") + '</button></div></div></div></div>';
}

/* ---------- состояние -> DOM ---------- */
var COND = {
  isSc: function (s) { return s.mode === "scale"; }, isRs: function (s) { return s.mode === "res"; }, isCu: function (s) { return s.mode === "custom"; },
  notSc: function (s) { return s.mode !== "scale"; }, hasQ: function (s) { return s.fmt !== "png"; }
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
  var ph = $("#upPh"), pr = PRESETS.filter(function (p) { return p[0] === s.pre; })[0]; if (ph) ph.textContent = pr ? L(pr[2]) : "";
  root.querySelectorAll("[data-if]").forEach(function (el) { var f = COND[el.dataset.if]; el.hidden = !(f && f(s)); });
  root.querySelectorAll("details[data-sec]").forEach(function (d) { d.open = !!st.open[d.dataset.sec]; });
  var od = outDims(), sz = $("#upSz");
  if (sz) sz.textContent = od ? L("iA") + ": " + od.w + "×" + od.h + " " + L("px") + " · " + (od.w * od.h / 1e6).toFixed(1) + " " + L("mp") + (od.limited ? " (" + L("lim") + ")" : "") : "";
  renderFiles(); renderInfo();
}
function renderFiles() {
  var list = $("#upList"); if (!list) return;
  var has = st.files.length > 0;
  $("#upDrop").hidden = has && st.cur && st.cur.img ? true : false;
  list.innerHTML = has ? st.files.map(function (f, i) {
    var ic = f.status === "done" ? "✓" : f.status === "err" ? "!" : f.status === "busy" ? "…" : "";
    return '<div class="fi' + (i === st.sel ? " on" : "") + (f.status ? " " + f.status : "") + '" data-i="' + i + '"><span class="fs">' + ic + '</span><span class="fn" title="' + esc(f.path) + '">' + esc(f.name) + '</span>' + (f.err ? '<span class="fe" title="' + esc(f.err) + '">' + esc(f.err === "exists" ? L("exists") : f.err) + '</span>' : "") + '<button class="fx" data-rm="' + i + '" title="×">×</button></div>';
  }).join("") : '<p class="fnone">' + L("nofiles") + '</p>';
  var o = $("#upOut"); if (o) o.textContent = st.outDir || L("outAuto");
  var x = $("#upOutX"); if (x) x.hidden = !st.outDir;
  var go = $("#upGo");
  if (go) { go.disabled = st.busy ? false : (!has || !api()); go.textContent = st.busy ? L("stop") + (st.prog ? " (" + Math.min(st.prog.i + 1, st.prog.n) + " / " + st.prog.n + ")" : "") : L("go") + (has ? " (" + st.files.length + ")" : ""); }
  var sm = $("#upSum");
  if (sm) {
    if (!api()) sm.textContent = L("noapp");
    else if (st.summary) { sm.innerHTML = (st.summary.ok ? '<b class="okc">' + L("ok", { n: st.summary.ok }) + '</b> ' : "") + (st.summary.err ? '<b class="erc">' + L("errs", { n: st.summary.err }) + '</b> ' : "") + (st.summary.stopped ? '<b>' + L("stopped") + '</b> ' : "") + (st.lastOut ? '<button class="lnk" id="upRev">' + L("reveal") + '</button>' : ""); }
    else sm.textContent = "";
  }
}
function renderInfo() {
  var a = $("#upiO"), b = $("#upiV"); if (!a) return;
  var c = st.cur;
  if (!c || !c.img) { a.textContent = ""; b.textContent = ""; return; }
  a.textContent = L("iO") + ": " + c.img.naturalWidth + "×" + c.img.naturalHeight + " " + L("px") + " · " + bytesFmt(c.size || 0);
  var od = outDims();
  b.textContent = od ? L("iA") + ": " + od.w + "×" + od.h + " " + L("px") + " · ×" + od.f.toFixed(2) : "";
}
function badge(t, err) { var b = $("#upBadge"); if (!b) return; b.hidden = !t; b.textContent = t || ""; b.classList.toggle("er", !!err); }

/* ---------- сцена ---------- */
function drawStage() {
  var box = $("#upBox"), stg = $("#upStage"); if (!box) return;
  var c = st.cur;
  if (!c || !c.img) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  var pv = st.prev, eff = st.view === "orig" || !pv ? "orig" : st.view;
  var iw = eff === "orig" ? c.img.naturalWidth : pv.w, ih = eff === "orig" ? c.img.naturalHeight : pv.h;
  st.base = { w: iw, h: ih };
  var sw = stg.clientWidth - 24, sh = stg.clientHeight - 24;
  var fw0 = eff !== "orig" && pv && pv.ow ? pv.ow : iw, fh0 = eff !== "orig" && pv && pv.oh ? pv.oh : ih; /* «по размеру» считаем по полному разрешению результата, фрагмент не растягивается на всю сцену */
  var sc = st.zoom === "fit" ? Math.min(8, Math.max(0.02, Math.min(sw / fw0, sh / fh0))) : Number(st.zoom);
  box.style.width = Math.round(iw * sc) + "px"; box.style.height = Math.round(ih * sc) + "px";
  box.classList.toggle("px", sc >= 2);
  stg.className = "stage bg-" + st.bg;
  box.innerHTML = "";
  function im(src) { var e = document.createElement("img"); e.className = "cv"; e.src = src; e.draggable = false; return e; }
  if (eff === "orig") {
    box.appendChild(im(c.img.src));
    if (pv) { var m = document.createElement("div"); m.className = "upm"; m.style.left = pv.rx * 100 + "%"; m.style.top = pv.ry * 100 + "%"; m.style.width = pv.rw * 100 + "%"; m.style.height = pv.rh * 100 + "%"; box.appendChild(m); }
    if (!st.working) badge(L("hintO"));
  } else if (eff === "after") { box.appendChild(im(pv.afterUrl)); }
  else {
    box.appendChild(im(pv.beforeUrl));
    var a2 = im(pv.afterUrl); a2.style.clipPath = "inset(0 0 0 " + st.pos + "%)"; box.appendChild(a2);
    var hd = document.createElement("div"); hd.className = "split"; hd.style.left = st.pos + "%"; hd.innerHTML = "<i></i>"; box.appendChild(hd);
    var t1 = document.createElement("span"); t1.className = "tag l"; t1.textContent = L("tB"); var t2 = document.createElement("span"); t2.className = "tag r"; t2.textContent = L("tA"); box.appendChild(t1); box.appendChild(t2);
  }
  if (eff !== "orig" && !st.working) badge("");
}

/* ---------- предпросмотр: считаем фрагмент ---------- */
function queuePreview(delay) {
  if (!st.cur || !st.cur.img) return;
  clearTimeout(tmr); badge(L("busy"));
  tmr = setTimeout(runPreview, delay === undefined ? 450 : delay);
}
function killPreview() { if (pw && pw.kill) { try { pw.kill(); } catch (e) {} } pw = null; }
function revoke(p) { if (p) { try { URL.revokeObjectURL(p.afterUrl); URL.revokeObjectURL(p.beforeUrl); } catch (e) {} } }
function runPreview() {
  var c = st.cur, u = core(); if (!c || !c.img || !u) return;
  killPreview();
  var id = ++jobId, path = c.path, img = c.img, w = img.naturalWidth, h = img.naturalHeight, od = u.outSize(w, h, coreSet()), f = od.f;
  var fw = Math.min(od.w, P), fh = Math.min(od.h, P);
  var fx = Math.max(0, Math.min(od.w - fw, Math.round(st.cx * od.w - fw / 2))), fy = Math.max(0, Math.min(od.h - fh, Math.round(st.cy * od.h - fh / 2)));
  var M = 8 + Math.ceil(24 / Math.max(f, 0.05));
  var x0 = Math.max(0, Math.floor(fx / f) - M), y0 = Math.max(0, Math.floor(fy / f) - M), x1 = Math.min(w, Math.ceil((fx + fw) / f) + M), y1 = Math.min(h, Math.ceil((fy + fh) / f) + M);
  if (x1 <= x0) x1 = Math.min(w, x0 + 1); if (y1 <= y0) y1 = Math.min(h, y0 + 1);
  var cw = x1 - x0, ch = y1 - y0, cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  var g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(img, x0, y0, cw, ch, 0, 0, cw, ch);
  var id0 = g.getImageData(0, 0, cw, ch);
  var job = { data: id0.data, w: cw, h: ch, tw: Math.max(1, Math.round(cw * f)), th: Math.max(1, Math.round(ch * f)), s: coreSet(), seed: 7,
    cut: { x: fx - Math.round(x0 * f), y: fy - Math.round(y0 * f), w: fw, h: fh } };
  var hd = {}; pw = hd; st.working = true;
  runJob(job, function (p) { if (id === jobId) badge(L("busy") + " " + Math.round(p * 100) + "%"); }, hd).then(function (r) {
    if (id !== jobId || !st.cur || st.cur.path !== path) return;
    var ac = document.createElement("canvas"); ac.width = r.w; ac.height = r.h; ac.getContext("2d").putImageData(new ImageData(r.data, r.w, r.h), 0, 0);
    var bc = document.createElement("canvas"); bc.width = r.w; bc.height = r.h; var bg = bc.getContext("2d"); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = "high";
    bg.drawImage(img, fx / f, fy / f, r.w / f, r.h / f, 0, 0, r.w, r.h);
    var pending = 2, aUrl = "", bUrl = "";
    function fin() {
      if (--pending) return;
      if (id !== jobId) { try { URL.revokeObjectURL(aUrl); URL.revokeObjectURL(bUrl); } catch (e) {} return; }
      revoke(st.prev); st.working = false;
      st.prev = { w: r.w, h: r.h, ow: od.w, oh: od.h, afterUrl: aUrl, beforeUrl: bUrl, rx: (fx / f) / w, ry: (fy / f) / h, rw: (r.w / f) / w, rh: (r.h / f) / h };
      badge(""); drawStage(); sync();
    }
    ac.toBlob(function (b) { aUrl = b ? URL.createObjectURL(b) : ""; fin(); }, "image/png");
    bc.toBlob(function (b) { bUrl = b ? URL.createObjectURL(b) : ""; fin(); }, "image/png");
  }, function (e) {
    if (id !== jobId || String(e && e.message) === "cancel") return;
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
  killPreview(); jobId++; clearTimeout(tmr); revoke(st.prev); st.prev = null; st.working = false;
  if (i < 0 || i >= st.files.length) { st.sel = -1; st.cur = null; loadId++; drawStage(); sync(); badge(""); return; }
  st.sel = i; st.cx = 0.5; st.cy = 0.5; var f = st.files[i], id = ++loadId;
  st.cur = { path: f.path, img: null, size: 0 }; sync(); drawStage(); badge(L("busy"));
  if (!window.api) { badge(L("noapp"), 1); return; }
  loadImage(f.path).then(function (r) {
    if (id !== loadId) return;
    st.cur = { path: f.path, img: r.img, size: r.size }; sync(); drawStage(); queuePreview(0);
  }, function (e) { if (id === loadId) badge(String(e.message || e), 1); });
}

/* ---------- сохранение ---------- */
function outExt(path, fmt) {
  if (fmt === "png") return ".png"; if (fmt === "jpg") return ".jpg"; if (fmt === "webp") return ".webp";
  var e = (/\.[a-z0-9]+$/i.exec(path) || [""])[0].toLowerCase();
  return e === ".jpg" || e === ".jpeg" || e === ".jfif" ? ".jpg" : e === ".webp" ? ".webp" : ".png";
}
function encode(res, ext, q) {
  return new Promise(function (resolve, reject) {
    var cv = document.createElement("canvas"); cv.width = res.w; cv.height = res.h;
    cv.getContext("2d").putImageData(new ImageData(res.data, res.w, res.h), 0, 0);
    var src = cv;
    if (ext === ".jpg") { src = document.createElement("canvas"); src.width = res.w; src.height = res.h; var g = src.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, res.w, res.h); g.drawImage(cv, 0, 0); cv.width = 1; cv.height = 1; }
    src.toBlob(function (b) {
      src.width = 1; src.height = 1;
      if (!b) { reject(new Error("encode error")); return; }
      b.arrayBuffer().then(resolve, reject);
    }, ext === ".jpg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png", Math.max(0.5, Math.min(1, q / 100)));
  });
}
function convert() {
  var A = api(); if (!A || st.busy || !st.files.length || !core()) return;
  st.busy = true; st.stopFlag = false; st.summary = null; st.lastOut = ""; st.prog = { i: 0, n: st.files.length };
  killPreview(); jobId++; clearTimeout(tmr);
  st.files.forEach(function (f) { f.status = "busy"; f.err = ""; });
  var pb = $("#upPb"); if (pb) { pb.hidden = false; pb.firstChild.style.width = "0%"; }
  sync();
  var ok = 0, er = 0, n = st.files.length, set = clone(st.set), list = st.files.slice(), dir = st.outDir, idx = 0;
  function done() {
    st.busy = false; st.summary = { ok: ok, err: er, stopped: st.stopFlag }; st.prog = null;
    if (st.stopFlag) list.forEach(function (f) { if (f.status === "busy") f.status = ""; });
    sync(); setTimeout(function () { var p = $("#upPb"); if (p) p.hidden = true; }, 800);
    queuePreview(200);
  }
  function step() {
    if (idx >= n || st.stopFlag) { done(); return; }
    var f = list[idx], i = idx++;
    function setBar(p) { var pbb = $("#upPb"); if (pbb) pbb.firstChild.style.width = Math.round((i + p) / n * 100) + "%"; }
    function fin(success, err, out) {
      if (st.stopFlag && !success) { f.status = ""; done(); return; }
      f.status = success ? "done" : "err"; f.err = err || ""; if (success) { ok++; if (out) st.lastOut = out; } else er++;
      st.prog = { i: i + 1, n: n }; setBar(1); renderFiles(); setTimeout(step, 0);
    }
    st.prog = { i: i, n: n }; renderFiles();
    loadImage(f.path).then(function (r) {
      var im = r.img, w = im.naturalWidth, h = im.naturalHeight, od = core().outSize(w, h, coreSet()), cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      var g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(im, 0, 0); var d = g.getImageData(0, 0, w, h); cv.width = 1; cv.height = 1;
      var hd = {}; exW = hd;
      return runJob({ data: d.data, w: w, h: h, tw: od.w, th: od.h, s: coreSet(), seed: 7 }, function (p) { setBar(p * 0.9); }, hd).then(function (res) {
        exW = null; var ext = outExt(f.path, set.fmt); setBar(0.93);
        return encode(res, ext, set.q).then(function (buf) {
          setBar(0.97);
          return A.upSave({ item: { input: f.path, ext: ext, data: buf }, outDir: dir, px: set.px, sx: set.sx, lc: set.lc, ow: set.ow, reset: i === 0 });
        });
      });
    }).then(function (q) { fin(!!(q && q.success), q && q.error, q && q.output); },
      function (e) { exW = null; var m = String(e && e.message || e); fin(false, m === "cancel" ? "" : m.slice(0, 120)); });
  }
  step();
}
function stopConvert() { st.stopFlag = true; if (exW && exW.kill) { try { exW.kill(); } catch (e) {} } }

/* ---------- события ---------- */
function applyPreset(id) {
  var p = PRESETS.filter(function (x) { return x[0] === id; })[0]; if (!p) return;
  Object.keys(p[3]).forEach(function (k) { st.set[k] = p[3][k]; }); st.set.pre = id; persist(); sync(); queuePreview();
}
function setVal(k, v) {
  if (k === "view") { st.view = v; drawStage(); sync(); return; }
  if (k === "bg") { st.bg = v; drawStage(); sync(); return; }
  if (k === "zoom") { st.zoom = v === "fit" ? "fit" : Number(v); drawStage(); sync(); return; }
  st.set[k] = v; persist(); sync();
  if (["fmt", "q", "px", "sx", "lc", "ow"].indexOf(k) < 0) queuePreview();
}
function onClick(e) {
  if (!live()) return;
  var t = e.target;
  var box = t.closest("#upBox");
  if (box && (st.view === "orig" || !st.prev) && st.cur && st.cur.img && !t.closest(".split")) {
    var r = box.getBoundingClientRect();
    st.cx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); st.cy = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    st.view = "split"; sync(); queuePreview(0); return;
  }
  var rm = t.closest("[data-rm]"); if (rm) { if (st.busy) return; var i = Number(rm.dataset.rm); st.files.splice(i, 1); st.summary = null; if (!st.files.length) select(-1); else if (i === st.sel) select(Math.min(i, st.files.length - 1)); else { if (i < st.sel) st.sel--; sync(); } return; }
  var fi = t.closest(".fi"); if (fi) { var j = Number(fi.dataset.i); if (j !== st.sel && !st.busy) select(j); return; }
  var pre = t.closest("[data-pre]"); if (pre) { applyPreset(pre.dataset.pre); return; }
  var b = t.closest("button[data-k]");
  if (b && !b.disabled) { var k = b.dataset.k; if (b.classList.contains("chk")) setVal(k, st.set[k] ? 0 : 1); else { var v = b.dataset.v; setVal(k, k === "zoom" || k === "view" || k === "bg" || typeof st.set[k] !== "number" ? v : Number(v)); } return; }
  var id = t.id || (t.closest("button") || {}).id;
  if (id === "upAdd" || t.closest("#upDrop")) { var A = window.api; if (A && A.upPickFiles) A.upPickFiles().then(addPaths); return; }
  if (id === "upClr") { if (st.busy) return; st.files = []; st.summary = null; select(-1); return; }
  if (id === "upDir") { var A2 = window.api; if (A2 && A2.ddsPickDir) A2.ddsPickDir().then(function (d) { if (d) { st.outDir = d; persist(); sync(); } }); return; }
  if (id === "upOutX") { st.outDir = ""; persist(); sync(); return; }
  if (id === "upGo") { if (st.busy) stopConvert(); else convert(); return; }
  if (id === "upReset") { st.set = clone(DEF); persist(); sync(); queuePreview(); return; }
  if (id === "upRev") { var A4 = window.api; if (A4 && A4.ddsReveal && st.lastOut) A4.ddsReveal(st.lastOut); return; }
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
  var drag = false, moved = false;
  function mv(e) { var b = $("#upBox"); if (!b) return; var r = b.getBoundingClientRect(); st.pos = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); var s = b.querySelector(".split"), cv = b.querySelectorAll(".cv"); if (s) s.style.left = st.pos + "%"; if (cv[1]) cv[1].style.clipPath = "inset(0 0 0 " + st.pos + "%)"; }
  stg.addEventListener("pointerdown", function (e) { if (st.view !== "split" || !st.prev || !e.target.closest("#upBox")) return; drag = true; mv(e); try { stg.setPointerCapture(e.pointerId); } catch (x) {} });
  stg.addEventListener("pointermove", function (e) { if (drag) mv(e); });
  stg.addEventListener("pointerup", function () { drag = false; });
  stg.addEventListener("wheel", function (e) {
    var b = $("#upBox"), c = st.cur; if (!b || b.hidden || !c || !c.img || !st.base) return;
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
function live() { return root && root.querySelector(".up-g"); }
function onToggle(e) { var d = e.target; if (live() && d && d.dataset && d.dataset.sec) st.open[d.dataset.sec] = d.open ? 1 : 0; }
function onOver(e) { if (!live()) return; e.preventDefault(); var s = $("#upStage"); if (s) s.classList.add("over"); }
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var s = $("#upStage"); if (s) s.classList.remove("over"); } }
function onDrop(e) {
  if (!live()) return; e.preventDefault(); var s = $("#upStage"); if (s) s.classList.remove("over"); var A = window.api;
  var ps = Array.prototype.map.call(e.dataTransfer.files, function (f) { return A && A.pathForFile ? A.pathForFile(f) : f.path; }).filter(Boolean);
  if (ps.length) addPaths(ps);
}
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onInput);
  root.addEventListener("toggle", onToggle, true); root.addEventListener("dragenter", onOver); root.addEventListener("dragover", onOver);
  root.addEventListener("dragleave", onLeave); root.addEventListener("drop", onDrop);
  var stg = $("#upStage"); if (stg) bindSplit(stg);
  sync(); drawStage();
  if (st.cur && st.cur.img && !st.prev && !st.working) queuePreview(0);
}
window.addEventListener("resize", function () { if (root && root.isConnected && st.zoom === "fit") drawStage(); });

window.UPT = { html: html, mount: mount };
window.TOOLS = (window.TOOLS || []).concat([{ id: "up", ico: '<path d="M14 4h6v6M20 4l-8 8M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
