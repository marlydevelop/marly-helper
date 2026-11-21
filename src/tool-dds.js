/* Инструмент «PNG → DDS». Подключается до основного скрипта; регистрирует window.TOOLS.
   Интерфейс: window.DDS.html(lang) -> строка, window.DDS.mount(rootEl, lang). Состояние живёт в модуле, переживает перерисовку. */
(function () {
"use strict";
var I = {
en: {
 name:"PNG → DDS", desc:"Convert images to DDS: live preview and all conversion options", back:"Tools",
 sub:"Add images, tune the settings and compare the result with the original before saving.",
 dropT:"Drop images here", dropS:"PNG, JPG, BMP · or click to browse", add:"Add", clear:"Clear", files:"Files",
 vO:"Original", vS:"Compare", vD:"DDS", bgC:"Checker", bgD:"Dark", bgL:"Light", fit:"Fit",
 busy:"Rendering preview…", perr:"Preview error", noapp:"Preview and conversion work in the desktop app only", nobin:"Conversion engine not found (bin folder)",
 iO:"Original", iD:"DDS", est:"est.", lv:"mips", smaller:"smaller", larger:"larger", real:"result",
 sF:"Format", sM:"Mipmaps", sS:"Size", sQ:"Scaling", sA:"Alpha & color", sN:"Normals & channels", sB:"Compression", sO:"Saving",
 fmt:"DDS format", hdr:"DDS header", hAuto:"Auto", h9:"DX9", h10:"DX10", hdrS:"DX9 is the most compatible; BC6H/BC7 and others always use DX10",
 mip:"Mipmaps", mAuto:"Auto", mOff:"Off", mCus:"Custom", mipN:"Levels", mipS:"Auto = full chain (recommended for GTA 5 textures)",
 w:"Width", h:"Height", sz0:"0 = keep the original size", pow2:"Fit to power of 2", warn4:"BC formats need width and height divisible by 4",
 flt:"Filter", dith:"Filter dithering", dN:"None", dO:"Ordered", dD:"Diffusion", addr:"Edge mode", aC:"Clamp", aW:"Wrap", aM:"Mirror", fh:"Flip horizontally", fv:"Flip vertically",
 aMode:"Alpha mode", aKeep:"As is", aPre:"Premultiply", aStr:"Straighten", sep:"Separate alpha scaling", sepS:"Resize alpha apart from color", at:"Alpha threshold", atS:"For BC1 and 1-bit alpha", aw:"Alpha weight", awS:"BC7 compressor",
 kc:"Keep alpha coverage", kcS:"Alpha-test reference for mips", ck:"Color key", ckS:"RRGGBB hex becomes transparent", srgbi:"Input is sRGB", srgbo:"Output is sRGB",
 nm:"Height map → normal map", nmc:"Height from", nma:"Amplitude", nmi:"Invert", iy:"Invert Y (green)", iyS:"DirectX ↔ OpenGL normals", rz:"Reconstruct Z (blue)", rzS:"Rebuild blue from red/green",
 swz:"Channel swizzle", swzS:"e.g. bgra, rrr1 (r g b a x y z w 0 1)",
 bq:"BC7 quality", qD:"Default", qQ:"Fast", qM:"Max", bd:"Dithering", bdS:"Smoother gradients", bu:"Uniform weights", buS:"Equal weight for R, G, B", ng:"Disable GPU compression", ngS:"Use if BC6H/BC7 fails",
 px:"Name prefix", sx:"Name suffix", lc:"Lowercase names", ow:"Overwrite existing", out:"Output folder", outAuto:"Next to each source file", pick:"Choose", reveal:"Open folder", reset:"Reset",
 go:"Convert", doing:"Converting {a} of {n}…", ok:"Done: {n}", errs:"Errors: {n}", exists:"file exists", nofiles:"Add images to convert",
 f1:"DXT1 · RGB, no alpha. Smallest size.", f3:"DXT5 · RGBA. Best for GTA 5 diffuse.", f4:"Grayscale / roughness maps.", f5:"Normal maps (RG channels).", f7:"High quality RGBA. Larger file.", f8:"Uncompressed. Max quality, max size.",
 gC:"Compressed", gU:"Uncompressed"
},
ru: {
 name:"PNG → DDS", desc:"Конвертация картинок в DDS: предпросмотр и все настройки конвертации", back:"Инструменты",
 sub:"Добавь картинки, настрой параметры и сравни результат с оригиналом перед сохранением.",
 dropT:"Перетащи изображения сюда", dropS:"PNG, JPG, BMP · или нажми, чтобы выбрать", add:"Добавить", clear:"Очистить", files:"Файлы",
 vO:"Оригинал", vS:"Сравнение", vD:"DDS", bgC:"Шахматка", bgD:"Тёмный", bgL:"Светлый", fit:"По размеру",
 busy:"Считаю предпросмотр…", perr:"Ошибка предпросмотра", noapp:"Предпросмотр и конвертация работают только в приложении", nobin:"Движок конвертации не найден (папка bin)",
 iO:"Оригинал", iD:"DDS", est:"~", lv:"mip", smaller:"меньше", larger:"больше", real:"итог",
 sF:"Формат", sM:"Мипмапы", sS:"Размер", sQ:"Масштабирование", sA:"Альфа и цвет", sN:"Нормали и каналы", sB:"Сжатие", sO:"Сохранение",
 fmt:"Формат DDS", hdr:"Заголовок DDS", hAuto:"Авто", h9:"DX9", h10:"DX10", hdrS:"DX9 самый совместимый; BC6H/BC7 и др. всегда DX10",
 mip:"Мипмапы", mAuto:"Авто", mOff:"Выкл", mCus:"Своё", mipN:"Уровней", mipS:"Авто = полная цепочка (рекомендуется для текстур GTA 5)",
 w:"Ширина", h:"Высота", sz0:"0 = исходный размер", pow2:"Подогнать под степень двойки", warn4:"Для BC размер должен делиться на 4",
 flt:"Фильтр", dith:"Дизеринг фильтра", dN:"Нет", dO:"Упорядоченный", dD:"Диффузия", addr:"Края", aC:"Clamp", aW:"Wrap", aM:"Mirror", fh:"Отразить по горизонтали", fv:"Отразить по вертикали",
 aMode:"Режим альфы", aKeep:"Как есть", aPre:"Премультипликация", aStr:"Убрать премульт.", sep:"Альфа отдельно", sepS:"Масштабировать альфу отдельно от цвета", at:"Порог альфы", atS:"Для BC1 и 1-битной альфы", aw:"Вес альфы", awS:"Для компрессора BC7",
 kc:"Сохранять покрытие альфы", kcS:"Опорное значение alpha-test для мипов", ck:"Цветовой ключ", ckS:"Цвет RRGGBB станет прозрачным", srgbi:"Вход в sRGB", srgbo:"Выход в sRGB",
 nm:"Карта высот → нормали", nmc:"Высота из", nma:"Амплитуда", nmi:"Инвертировать", iy:"Инвертировать Y (зелёный)", iyS:"Нормали DirectX ↔ OpenGL", rz:"Восстановить Z (синий)", rzS:"Пересчитать синий по красному/зелёному",
 swz:"Перестановка каналов", swzS:"напр. bgra, rrr1 (r g b a x y z w 0 1)",
 bq:"Качество BC7", qD:"Обычное", qQ:"Быстрое", qM:"Максимум", bd:"Дизеринг", bdS:"Плавнее градиенты", bu:"Равные веса", buS:"Одинаковый вес R, G, B", ng:"Без GPU-сжатия", ngS:"Если BC6H/BC7 падает",
 px:"Префикс имени", sx:"Суффикс имени", lc:"Имена строчными", ow:"Перезаписывать", out:"Папка вывода", outAuto:"Рядом с исходным файлом", pick:"Выбрать", reveal:"Открыть папку", reset:"Сбросить",
 go:"Конвертировать", doing:"Конвертирую {a} из {n}…", ok:"Готово: {n}", errs:"Ошибок: {n}", exists:"файл уже есть", nofiles:"Добавь картинки для конвертации",
 f1:"DXT1 · RGB без альфы. Самый маленький размер.", f3:"DXT5 · RGBA. Лучший выбор для diffuse в GTA 5.", f4:"Градации серого / карты roughness.", f5:"Карты нормалей (каналы RG).", f7:"RGBA высокого качества. Файл больше.", f8:"Без сжатия. Макс. качество и размер.",
 gC:"Сжатые", gU:"Без сжатия"
},
uk: {
 name:"PNG → DDS", desc:"Конвертація зображень у DDS: попередній перегляд і всі налаштування конвертації", back:"Інструменти",
 sub:"Додай зображення, налаштуй параметри та порівняй результат з оригіналом перед збереженням.",
 dropT:"Перетягни зображення сюди", dropS:"PNG, JPG, BMP · або натисни, щоб обрати", add:"Додати", clear:"Очистити", files:"Файли",
 vO:"Оригінал", vS:"Порівняння", vD:"DDS", bgC:"Шахівниця", bgD:"Темний", bgL:"Світлий", fit:"За розміром",
 busy:"Рахую попередній перегляд…", perr:"Помилка перегляду", noapp:"Перегляд і конвертація працюють лише в застосунку", nobin:"Рушій конвертації не знайдено (тека bin)",
 iO:"Оригінал", iD:"DDS", est:"~", lv:"mip", smaller:"менше", larger:"більше", real:"підсумок",
 sF:"Формат", sM:"Міпмапи", sS:"Розмір", sQ:"Масштабування", sA:"Альфа і колір", sN:"Нормалі та канали", sB:"Стиснення", sO:"Збереження",
 fmt:"Формат DDS", hdr:"Заголовок DDS", hAuto:"Авто", h9:"DX9", h10:"DX10", hdrS:"DX9 найсумісніший; BC6H/BC7 та ін. завжди DX10",
 mip:"Міпмапи", mAuto:"Авто", mOff:"Вимк", mCus:"Своє", mipN:"Рівнів", mipS:"Авто = повний ланцюжок (рекомендовано для текстур GTA 5)",
 w:"Ширина", h:"Висота", sz0:"0 = початковий розмір", pow2:"Підігнати під степінь двійки", warn4:"Для BC розмір має ділитися на 4",
 flt:"Фільтр", dith:"Дизерінг фільтра", dN:"Ні", dO:"Впорядкований", dD:"Дифузія", addr:"Краї", aC:"Clamp", aW:"Wrap", aM:"Mirror", fh:"Віддзеркалити по горизонталі", fv:"Віддзеркалити по вертикалі",
 aMode:"Режим альфи", aKeep:"Як є", aPre:"Премультиплікація", aStr:"Прибрати премульт.", sep:"Альфа окремо", sepS:"Масштабувати альфу окремо від кольору", at:"Поріг альфи", atS:"Для BC1 та 1-бітної альфи", aw:"Вага альфи", awS:"Для компресора BC7",
 kc:"Зберігати покриття альфи", kcS:"Опорне значення alpha-test для міпів", ck:"Колірний ключ", ckS:"Колір RRGGBB стане прозорим", srgbi:"Вхід у sRGB", srgbo:"Вихід у sRGB",
 nm:"Карта висот → нормалі", nmc:"Висота з", nma:"Амплітуда", nmi:"Інвертувати", iy:"Інвертувати Y (зелений)", iyS:"Нормалі DirectX ↔ OpenGL", rz:"Відновити Z (синій)", rzS:"Перерахувати синій за червоним/зеленим",
 swz:"Перестановка каналів", swzS:"напр. bgra, rrr1 (r g b a x y z w 0 1)",
 bq:"Якість BC7", qD:"Звичайна", qQ:"Швидка", qM:"Максимум", bd:"Дизерінг", bdS:"Плавніші градієнти", bu:"Рівні ваги", buS:"Однакова вага R, G, B", ng:"Без GPU-стиснення", ngS:"Якщо BC6H/BC7 падає",
 px:"Префікс імені", sx:"Суфікс імені", lc:"Імена малими", ow:"Перезаписувати", out:"Тека виводу", outAuto:"Поруч із вихідним файлом", pick:"Обрати", reveal:"Відкрити теку", reset:"Скинути",
 go:"Конвертувати", doing:"Конвертую {a} з {n}…", ok:"Готово: {n}", errs:"Помилок: {n}", exists:"файл уже є", nofiles:"Додай зображення для конвертації",
 f1:"DXT1 · RGB без альфи. Найменший розмір.", f3:"DXT5 · RGBA. Найкращий вибір для diffuse у GTA 5.", f4:"Відтінки сірого / карти roughness.", f5:"Карти нормалей (канали RG).", f7:"RGBA високої якості. Файл більший.", f8:"Без стиснення. Макс. якість і розмір.",
 gC:"Стиснені", gU:"Без стиснення"
}};

var FM = { // формат: [блок(байт на 4x4) | бит на пиксель, тип]
 BC1_UNORM:[8,"b"],BC1_UNORM_SRGB:[8,"b"],BC2_UNORM:[16,"b"],BC2_UNORM_SRGB:[16,"b"],BC3_UNORM:[16,"b"],BC3_UNORM_SRGB:[16,"b"],BC4_UNORM:[8,"b"],BC4_SNORM:[8,"b"],BC5_UNORM:[16,"b"],BC5_SNORM:[16,"b"],BC6H_UF16:[16,"b"],BC6H_SF16:[16,"b"],BC7_UNORM:[16,"b"],BC7_UNORM_SRGB:[16,"b"],
 R8G8B8A8_UNORM:[32,"p"],R8G8B8A8_UNORM_SRGB:[32,"p"],B8G8R8A8_UNORM:[32,"p"],B8G8R8A8_UNORM_SRGB:[32,"p"],B8G8R8X8_UNORM:[32,"p"],B8G8R8X8_UNORM_SRGB:[32,"p"],B5G6R5_UNORM:[16,"p"],B5G5R5A1_UNORM:[16,"p"],B4G4R4A4_UNORM:[16,"p"],R8_UNORM:[8,"p"],R8G8_UNORM:[16,"p"],A8_UNORM:[8,"p"],R16_UNORM:[16,"p"],R16G16_UNORM:[32,"p"],R16G16B16A16_UNORM:[64,"p"],R16G16B16A16_FLOAT:[64,"p"],R32G32B32A32_FLOAT:[128,"p"],R10G10B10A2_UNORM:[32,"p"]};
var PRESETS = [["BC1","BC1_UNORM","f1"],["BC3","BC3_UNORM","f3"],["BC4","BC4_UNORM","f4"],["BC5","BC5_UNORM","f5"],["BC7","BC7_UNORM","f7"],["RGBA8","R8G8B8A8_UNORM","f8"]];
var DX9_OK = {BC1_UNORM:1,BC2_UNORM:1,BC3_UNORM:1,BC4_UNORM:1,BC5_UNORM:1,R8G8B8A8_UNORM:1,B8G8R8A8_UNORM:1,B8G8R8X8_UNORM:1,B5G6R5_UNORM:1,B5G5R5A1_UNORM:1,B4G4R4A4_UNORM:1,A8_UNORM:1};

var DEF = { fmt:"BC3_UNORM", hdr:"dx9", mip:"auto", mipN:8, w:0, h:0, pow2:0, filter:"CUBIC", dith:"none", addr:"clamp", hflip:0, vflip:0,
 alphaMode:"keep", sep:0, atOn:0, at:0.5, awOn:0, aw:1, kcOn:0, kc:0.5, ck:"", srgbi:0, srgbo:0,
 nmap:0, nmapCh:"l", nmapA:1, nmapI:0, invY:0, recZ:0, swz:"", bq:"default", bd:0, bu:0, nogpu:0, px:"", sx:"", lc:0, ow:1 };
var st = { files:[], sel:-1, outDir:"", set:clone(DEF), view:"split", ch:"rgba", bg:"check", zoom:"fit", pos:50, open:{f:1,m:1,s:1,o:1},
 cur:null, dds:null, ddsState:"idle", ddsErr:"", ddsMs:0, avail:null, busy:false, prog:null, summary:null, lastOut:"" };
var root = null, lang = "en", rid = 0, tmr = 0, loadId = 0;
try { var sv = JSON.parse(localStorage.getItem("mh_dds") || "null"); if (sv) { Object.keys(DEF).forEach(function (k) { if (sv.set && sv.set[k] !== undefined && typeof sv.set[k] === typeof DEF[k]) st.set[k] = sv.set[k]; }); if (typeof sv.outDir === "string") st.outDir = sv.outDir; } } catch (e) {}
function persist() { try { localStorage.setItem("mh_dds", JSON.stringify({ set: st.set, outDir: st.outDir })); } catch (e) {} }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function L(k, v) { var s = (I[lang] && I[lang][k]) || I.en[k] || k; if (v) Object.keys(v).forEach(function (n) { s = s.replace("{" + n + "}", v[n]); }); return s; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function api() { return window.api && window.api.ddsPreview ? window.api : null; }
function isBC(f) { return /^BC/.test(f); }
function $(s) { return root ? root.querySelector(s) : null; }
function bytesFmt(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB"; }

/* ---------- разметка ---------- */
function seg(k, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button data-k="' + k + '" data-v="' + o[0] + '" aria-pressed="false">' + o[1] + '</button>'; }).join("") + '</div>'; }
function chk(k) { return '<button class="chk" role="checkbox" data-k="' + k + '" aria-checked="false"></button>'; }
function row(label, hint, ctl, cond, cls) { return '<div class="row' + (cls ? ' ' + cls : '') + '"' + (cond ? ' data-if="' + cond + '"' : '') + '><span class="l">' + label + (hint ? '<small>' + hint + '</small>' : '') + '</span>' + ctl + '</div>'; }
function num(k, min, max, step, cond) { return '<input class="inp" type="number" data-k="' + k + '" data-n="1" min="' + min + '" max="' + max + '" step="' + (step || 1) + '"' + (cond ? ' data-if="' + cond + '"' : '') + '>'; }
function cc(a, b) { return '<span class="cc">' + a + b + '</span>'; }
function sel(k, opts) { return '<select class="inp sel" data-k="' + k + '">' + opts + '</select>'; }
function opt(v, t) { return '<option value="' + v + '">' + t + '</option>'; }
function sec(id, title, body) { return '<details class="dsec" data-sec="' + id + '"><summary>' + title + '</summary>' + body + '</details>'; }
function fmtOptions() {
  var c = [], u = [];
  Object.keys(FM).forEach(function (k) { (isBC(k) ? c : u).push(opt(k, k)); });
  return '<optgroup label="' + L("gC") + '">' + c.join("") + '</optgroup><optgroup label="' + L("gU") + '">' + u.join("") + '</optgroup>';
}
function html(lg) {
  lang = lg || lang;
  var presets = '<div class="seg pre">' + PRESETS.map(function (p) { return '<button data-pre="' + p[1] + '" aria-pressed="false" title="' + esc(L(p[2])) + '">' + p[0] + '</button>'; }).join("") + '</div>';
  var settings =
   sec("f", L("sF"), '<div class="prow">' + presets + '<p class="phint" id="ddPh"></p></div>' + row(L("fmt"), "", sel("fmt", fmtOptions())) + row(L("hdr"), L("hdrS"), seg("hdr", [["auto", L("hAuto")], ["dx9", L("h9")], ["dx10", L("h10")]])))
  + sec("m", L("sM"), row(L("mip"), L("mipS"), seg("mip", [["auto", L("mAuto")], ["none", L("mOff")], ["custom", L("mCus")]])) + row(L("mipN"), "", num("mipN", 1, 16), "mipn"))
  + sec("s", L("sS"), row(L("w"), L("sz0"), num("w", 0, 16384)) + row(L("h"), "", num("h", 0, 16384)) + row(L("pow2"), "", chk("pow2")) + '<p class="warn" data-if="w4">' + L("warn4") + '</p>')
  + sec("q", L("sQ"), row(L("flt"), "", sel("filter", opt("CUBIC", "CUBIC") + opt("FANT", "FANT") + opt("LINEAR", "LINEAR") + opt("POINT", "POINT") + opt("BOX", "BOX") + opt("TRIANGLE", "TRIANGLE"))) + row(L("dith"), "", seg("dith", [["none", L("dN")], ["ordered", L("dO")], ["diffusion", L("dD")]])) + row(L("addr"), "", seg("addr", [["clamp", L("aC")], ["wrap", L("aW")], ["mirror", L("aM")]])) + row(L("fh"), "", chk("hflip")) + row(L("fv"), "", chk("vflip")))
  + sec("a", L("sA"), row(L("aMode"), "", seg("alphaMode", [["keep", L("aKeep")], ["pre", L("aPre")], ["straight", L("aStr")]]), "", "st") + row(L("sep"), L("sepS"), chk("sep")) + row(L("at"), L("atS"), cc(num("at", 0.01, 1, 0.05, "aton"), chk("atOn"))) + row(L("aw"), L("awS"), cc(num("aw", 0.01, 10, 0.1, "awon"), chk("awOn")), "bc7") + row(L("kc"), L("kcS"), cc(num("kc", 0, 1, 0.05, "kcon"), chk("kcOn")))
     + row(L("ck"), L("ckS"), '<input class="inp" type="text" data-k="ck" maxlength="6" placeholder="FF00FF" spellcheck="false">') + row(L("srgbi"), "", chk("srgbi")) + row(L("srgbo"), "", chk("srgbo")))
  + sec("n", L("sN"), row(L("nm"), "", chk("nmap")) + row(L("nmc"), "", sel("nmapCh", opt("l", "Luminance") + opt("r", "R") + opt("g", "G") + opt("b", "B") + opt("a", "A")), "nmon") + row(L("nma"), "", num("nmapA", 0.01, 100, 0.1), "nmon") + row(L("nmi"), "", chk("nmapI"), "nmon") + row(L("iy"), L("iyS"), chk("invY")) + row(L("rz"), L("rzS"), chk("recZ"))
     + row(L("swz"), L("swzS"), '<input class="inp" type="text" data-k="swz" maxlength="4" placeholder="rgba" spellcheck="false">'))
  + sec("b", L("sB"), row(L("bq"), "", seg("bq", [["default", L("qD")], ["quick", L("qQ")], ["max", L("qM")]]), "bcq") + row(L("bd"), L("bdS"), chk("bd"), "bc") + row(L("bu"), L("buS"), chk("bu"), "bc") + row(L("ng"), L("ngS"), chk("nogpu")))
  + sec("o", L("sO"), row(L("px"), "", '<input class="inp" type="text" data-k="px" maxlength="40" spellcheck="false">') + row(L("sx"), "", '<input class="inp" type="text" data-k="sx" maxlength="40" spellcheck="false">') + row(L("lc"), "", chk("lc")) + row(L("ow"), "", chk("ow")));
  return '<div class="tvh"><button class="back" data-tool="">' + ico("back") + L("back") + '</button><h1>' + L("name") + '</h1><p class="sub">' + L("sub") + '</p></div>'
   + '<div class="ddg"><div class="ddl"><div class="card ddp">'
   + '<div class="ddt"><div class="ddtr">' + seg("view", [["orig", L("vO")], ["split", L("vS")], ["dds", L("vD")]]) + seg("ch", [["rgba", "RGBA"], ["rgb", "RGB"], ["r", "R"], ["g", "G"], ["b", "B"], ["a", "A"]]) + '</div>'
   + '<div class="ddtr">' + seg("bg", [["check", L("bgC")], ["dark", L("bgD")], ["light", L("bgL")]]) + seg("zoom", [["fit", L("fit")], ["1", "100%"], ["2", "200%"], ["4", "400%"]]) + '</div></div>'
   + '<div class="stage" id="ddStage"><div class="sc"><div class="drop" id="ddDrop"><b>' + L("dropT") + '</b><span>' + L("dropS") + '</span></div><div class="cvb" id="ddBox" hidden></div></div><div class="stb" id="ddBadge" hidden></div></div>'
   + '<div class="ddi"><span id="ddiO"></span><span id="ddiD"></span></div></div></div>'
   + '<div class="ddr"><div class="card ddf"><div class="ddfh"><h3>' + L("files") + '</h3><span><button class="mini" id="ddAdd">' + L("add") + '</button><button class="mini" id="ddClr">' + L("clear") + '</button></span></div>'
   + '<div class="flist" id="ddList"></div>'
   + '<div class="fout"><span class="l">' + L("out") + '<small id="ddOut"></small></span><span class="fob"><button class="mini" id="ddPick">' + L("pick") + '</button><button class="mini" id="ddOutX" title="×">×</button></span></div>'
   + '<button class="go ddgo" id="ddGo"></button><div class="pbar" id="ddPb" hidden><i></i></div><p class="dsum" id="ddSum"></p></div>'
   + '<div class="card dds">' + settings + '<div class="dres"><button class="mini" id="ddReset">' + L("reset") + '</button></div></div></div></div>';
}
function ico(n) { return n === "back" ? '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' : ""; }

/* ---------- состояние -> DOM ---------- */
var COND = {
  mipn: function (s) { return s.mip === "custom"; }, w4: function (s) { return isBC(s.fmt) && (s.w % 4 || s.h % 4 || (cdims() && (cdims()[0] % 4 || cdims()[1] % 4))); },
  aton: function (s) { return s.atOn; }, awon: function (s) { return s.awOn && /^BC7/.test(s.fmt); }, kcon: function (s) { return s.kcOn; }, bc7: function (s) { return /^BC7/.test(s.fmt); },
  nmon: function (s) { return s.nmap; }, bc: function (s) { return isBC(s.fmt); }, bcq: function (s) { return /^BC7/.test(s.fmt); }
};
function cdims() { var d = st.dds || (st.cur && st.cur.img); return d ? [d.naturalWidth || d.width, d.naturalHeight || d.height] : null; }
function sync() {
  if (!root) return;
  var s = st.set, vals = { view: st.view, ch: st.ch, bg: st.bg, zoom: String(st.zoom) };
  root.querySelectorAll("[data-k]").forEach(function (el) {
    var k = el.dataset.k, v = k in vals ? vals[k] : s[k];
    if (el.tagName === "BUTTON" && el.classList.contains("chk")) el.setAttribute("aria-checked", v ? "true" : "false");
    else if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", String(el.dataset.v === String(v)));
    else if (document.activeElement !== el) el.value = v === undefined ? "" : v;
  });
  var f9 = !!DX9_OK[s.fmt];
  root.querySelectorAll('[data-k="hdr"][data-v="dx9"]').forEach(function (b) { b.disabled = !f9; });
  root.querySelectorAll("[data-pre]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.pre === s.fmt)); });
  var ph = $("#ddPh"), pr = PRESETS.filter(function (p) { return p[1] === s.fmt; })[0];
  if (ph) ph.textContent = pr ? L(pr[2]) : "";
  root.querySelectorAll("[data-if]").forEach(function (el) { var f = COND[el.dataset.if]; el.hidden = !(f && f(s)); });
  root.querySelectorAll("details[data-sec]").forEach(function (d) { d.open = !!st.open[d.dataset.sec]; });
  renderFiles(); renderInfo();
}
function renderFiles() {
  var list = $("#ddList"); if (!list) return;
  var has = st.files.length > 0;
  $("#ddDrop").hidden = has && st.cur && st.cur.img ? true : false;
  list.innerHTML = has ? st.files.map(function (f, i) {
    var ic = f.status === "done" ? "✓" : f.status === "err" ? "!" : f.status === "busy" ? "…" : "";
    return '<div class="fi' + (i === st.sel ? " on" : "") + (f.status ? " " + f.status : "") + '" data-i="' + i + '"><span class="fs">' + ic + '</span><span class="fn" title="' + esc(f.path) + '">' + esc(f.name) + '</span>' + (f.err ? '<span class="fe" title="' + esc(f.err) + '">' + esc(f.err === "exists" ? L("exists") : f.err) + '</span>' : "") + (st.busy ? "" : '<button class="fx" data-rm="' + i + '" aria-label="remove">×</button>') + '</div>';
  }).join("") : '<p class="fnone">' + L("nofiles") + '</p>';
  var o = $("#ddOut"); if (o) o.textContent = st.outDir || L("outAuto");
  var x = $("#ddOutX"); if (x) x.hidden = !st.outDir;
  var go = $("#ddGo");
  if (go) { go.disabled = !has || st.busy || !api(); go.textContent = st.busy && st.prog ? L("doing", { a: Math.min(st.prog.i + 1, st.prog.n), n: st.prog.n }) : L("go") + (has ? " (" + st.files.length + ")" : ""); }
  var sm = $("#ddSum");
  if (sm) {
    if (!api()) sm.textContent = L("noapp");
    else if (st.avail === false) sm.textContent = L("nobin");
    else if (st.summary) { sm.innerHTML = (st.summary.ok ? '<b class="okc">' + L("ok", { n: st.summary.ok }) + '</b> ' : "") + (st.summary.err ? '<b class="erc">' + L("errs", { n: st.summary.err }) + '</b> ' : "") + (st.lastOut ? '<button class="lnk" id="ddRev">' + L("reveal") + '</button>' : ""); }
    else sm.textContent = "";
  }
}
function estimate(w, h, mips) {
  var f = FM[st.set.fmt]; if (!f) return 0; var tot = 0, hdr = 128 + (isBC(st.set.fmt) || !DX9_OK[st.set.fmt] || st.set.hdr === "dx10" ? 20 : 0);
  if (st.set.hdr === "dx9" && DX9_OK[st.set.fmt]) hdr = 128;
  for (var i = 0; i < mips; i++) { var mw = Math.max(1, w >> i), mh = Math.max(1, h >> i); tot += f[1] === "b" ? Math.ceil(mw / 4) * Math.ceil(mh / 4) * f[0] : Math.ceil(mw * mh * f[0] / 8); }
  return tot + hdr;
}
function mipCount(w, h) { var full = Math.floor(Math.log2(Math.max(w, h))) + 1; return st.set.mip === "none" ? 1 : st.set.mip === "custom" ? Math.max(1, Math.min(full, st.set.mipN | 0)) : full; }
function renderInfo() {
  var a = $("#ddiO"), b = $("#ddiD"); if (!a) return;
  var c = st.cur;
  if (!c || !c.img) { a.textContent = ""; b.textContent = ""; return; }
  a.textContent = L("iO") + ": " + c.img.naturalWidth + "×" + c.img.naturalHeight + " · " + bytesFmt(c.size || 0);
  var d = cdims(), w = st.dds ? st.dds.naturalWidth : d[0], h = st.dds ? st.dds.naturalHeight : d[1], m = mipCount(w, h), e = estimate(w, h, m);
  var rt = c.size ? Math.round((1 - e / c.size) * 100) : 0;
  b.textContent = L("iD") + " " + st.set.fmt + ": " + w + "×" + h + " · " + m + " " + L("lv") + " · " + L("est") + bytesFmt(e) + (c.size ? " (" + Math.abs(rt) + "% " + (rt >= 0 ? L("smaller") : L("larger")) + ")" : "");
}
function badge(t, err) { var b = $("#ddBadge"); if (!b) return; b.hidden = !t; b.textContent = t || ""; b.classList.toggle("er", !!err); }

/* ---------- сцена (оригинал / DDS / сравнение) ---------- */
function chCanvas(img, ch) {
  var c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  var x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
  if (ch !== "rgba") {
    var d = x.getImageData(0, 0, c.width, c.height), p = d.data, i, v;
    for (i = 0; i < p.length; i += 4) {
      if (ch === "rgb") p[i + 3] = 255;
      else { v = ch === "r" ? p[i] : ch === "g" ? p[i + 1] : ch === "b" ? p[i + 2] : p[i + 3]; p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255; }
    }
    x.putImageData(d, 0, 0);
  }
  return c;
}
function drawStage() {
  var box = $("#ddBox"), stg = $("#ddStage"); if (!box) return;
  var c = st.cur;
  if (!c || !c.img) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  var iw = c.img.naturalWidth, ih = c.img.naturalHeight, sw = stg.clientWidth - 24, sh = stg.clientHeight - 24;
  var sc = st.zoom === "fit" ? Math.min(8, Math.max(0.05, Math.min(sw / iw, sh / ih))) : Number(st.zoom);
  box.style.width = Math.round(iw * sc) + "px"; box.style.height = Math.round(ih * sc) + "px";
  box.classList.toggle("px", sc >= 2);
  stg.className = "stage bg-" + st.bg;
  var hasD = !!st.dds, view = st.view === "dds" && !hasD ? "orig" : st.view;
  box.innerHTML = "";
  var co = chCanvas(c.img, st.ch); co.className = "cv"; 
  var cd = hasD ? chCanvas(st.dds, st.ch) : null; if (cd) cd.className = "cv";
  if (view === "orig" || (view === "split" && !cd)) box.appendChild(co);
  else if (view === "dds") box.appendChild(cd);
  else {
    box.appendChild(co); cd.style.clipPath = "inset(0 0 0 " + st.pos + "%)"; box.appendChild(cd);
    var hd = document.createElement("div"); hd.className = "split"; hd.style.left = st.pos + "%"; hd.innerHTML = "<i></i>"; box.appendChild(hd);
    var a = document.createElement("span"); a.className = "tag l"; a.textContent = L("vO"); var b = document.createElement("span"); b.className = "tag r"; b.textContent = L("vD"); box.appendChild(a); box.appendChild(b);
  }
}

/* ---------- файлы ---------- */
function addPaths(paths) {
  var seen = {}; st.files.forEach(function (f) { seen[f.path.toLowerCase()] = 1; });
  var add = paths.filter(function (p) { return /\.(png|jpe?g|bmp)$/i.test(p) && !seen[p.toLowerCase()] && (seen[p.toLowerCase()] = 1); });
  add.slice(0, 200 - st.files.length).forEach(function (p) { st.files.push({ path: p, name: p.split(/[\\/]/).pop() }); });
  st.summary = null;
  if (st.sel < 0 && st.files.length) select(0); else sync();
}
function select(i) {
  if (i < 0 || i >= st.files.length) { st.sel = -1; st.cur = null; st.dds = null; drawStage(); sync(); return; }
  st.sel = i; st.dds = null; st.ddsState = "idle"; var f = st.files[i], id = ++loadId;
  st.cur = { path: f.path, img: null, size: 0 }; sync(); drawStage(); badge(L("busy"));
  var A = api(); if (!A) { badge(L("noapp"), 1); return; }
  A.ddsRead(f.path).then(function (r) {
    if (id !== loadId) return;
    if (!r || !r.ok) { badge(String(r && r.error || "error"), 1); return; }
    var im = new Image(); im.onload = function () { if (id !== loadId) return; st.cur = { path: f.path, img: im, size: r.size }; sync(); drawStage(); queuePreview(0); };
    im.onerror = function () { badge("decode error", 1); }; im.src = r.url;
  });
}
function queuePreview(delay) {
  if (!st.cur || !st.cur.img || !api()) return;
  clearTimeout(tmr); badge(L("busy"));
  tmr = setTimeout(runPreview, delay === undefined ? 400 : delay);
}
function runPreview() {
  var A = api(), c = st.cur; if (!A || !c || !c.img) return;
  var id = ++rid, path = c.path;
  A.ddsPreview({ path: path, s: st.set, id: id }).then(function (r) {
    if (id !== rid || !st.cur || st.cur.path !== path) return;
    if (r && r.cancelled) return;
    if (!r || !r.ok) { st.dds = null; badge(L("perr") + ": " + (r && r.error === "nobin" ? L("nobin") : (r && r.error) || ""), 1); drawStage(); renderInfo(); return; }
    var im = new Image(); im.onload = function () { if (id !== rid) return; st.dds = im; badge(""); drawStage(); sync(); }; im.src = r.url;
  });
}
function convert() {
  var A = api(); if (!A || st.busy || !st.files.length) return;
  st.busy = true; st.summary = null; st.lastOut = ""; st.prog = { i: 0, n: st.files.length };
  st.files.forEach(function (f) { f.status = "busy"; f.err = ""; });
  var pb = $("#ddPb"); if (pb) { pb.hidden = false; pb.firstChild.style.width = "0%"; }
  sync();
  A.onDdsProgress(function (d) {
    var f = st.files[d.i]; if (f) { f.status = d.success ? "done" : "err"; f.err = d.error || ""; }
    st.prog = { i: d.i + 1, n: d.n }; if (d.success && d.output) st.lastOut = d.output;
    var p = $("#ddPb"); if (p) p.firstChild.style.width = Math.round((d.i + 1) / d.n * 100) + "%";
    renderFiles();
  });
  A.ddsConvert({ files: st.files.map(function (f) { return f.path; }), s: st.set, outDir: st.outDir }).then(function (res) {
    var ok = 0, er = 0; (res || []).forEach(function (r, i) { if (r.success) ok++; else er++; var f = st.files[i]; if (f) { f.status = r.success ? "done" : "err"; f.err = r.error || ""; } });
    (res || []).forEach(function (r) { if (r.success && r.output) st.lastOut = r.output; });
    st.busy = false; st.summary = { ok: ok, err: er }; st.prog = null; sync();
    setTimeout(function () { var p = $("#ddPb"); if (p) p.hidden = true; }, 800);
  }).catch(function (e) { st.busy = false; st.summary = { ok: 0, err: st.files.length }; sync(); });
}

/* ---------- события ---------- */
function setVal(k, v) {
  if (k === "view" || k === "ch" || k === "bg") { st[k] = v; drawStage(); sync(); return; }
  if (k === "zoom") { st.zoom = v === "fit" ? "fit" : Number(v); drawStage(); sync(); return; }
  st.set[k] = v; persist();
  if (k === "fmt" && st.set.hdr === "dx9" && !DX9_OK[v]) { /* DX9 недоступен: сервер сам использует DX10, кнопка отключится */ }
  sync(); queuePreview();
}
function onClick(e) {
  if (!live()) return;
  var t = e.target;
  var rm = t.closest("[data-rm]"); if (rm) { var i = Number(rm.dataset.rm); st.files.splice(i, 1); st.summary = null; if (!st.files.length) select(-1); else if (i === st.sel) select(Math.min(i, st.files.length - 1)); else { if (i < st.sel) st.sel--; sync(); } return; }
  var fi = t.closest(".fi"); if (fi) { var j = Number(fi.dataset.i); if (j !== st.sel) select(j); return; }
  var pre = t.closest("[data-pre]"); if (pre) { setVal("fmt", pre.dataset.pre); return; }
  var b = t.closest("button[data-k]");
  if (b && !b.disabled) { var k = b.dataset.k; if (b.classList.contains("chk")) setVal(k, st.set[k] ? 0 : 1); else { var v = b.dataset.v; setVal(k, k === "zoom" || typeof st.set[k] !== "number" ? v : Number(v)); } return; }
  var id = t.id || (t.closest("button") || {}).id;
  if (id === "ddAdd" || t.closest("#ddDrop")) { var A = api(); if (A) A.ddsPickFiles().then(addPaths); return; }
  if (id === "ddClr") { st.files = []; st.summary = null; select(-1); return; }
  if (id === "ddPick") { var A2 = api(); if (A2) A2.ddsPickDir().then(function (d) { if (d) { st.outDir = d; persist(); sync(); } }); return; }
  if (id === "ddOutX") { st.outDir = ""; persist(); sync(); return; }
  if (id === "ddGo") { convert(); return; }
  if (id === "ddReset") { st.set = clone(DEF); persist(); sync(); queuePreview(); return; }
  if (id === "ddRev") { var A3 = api(); if (A3 && st.lastOut) A3.ddsReveal(st.lastOut); return; }
}
function onInput(e) {
  if (!live()) return;
  var el = e.target.closest("[data-k]"); if (!el || el.tagName === "BUTTON") return;
  var k = el.dataset.k, v = el.value;
  if (el.dataset.n) { v = parseFloat(v); if (!isFinite(v)) return; var mn = parseFloat(el.min), mx = parseFloat(el.max); if (v < mn) v = mn; if (v > mx) v = mx; }
  else if (k === "ck") { v = v.replace(/[^0-9a-fA-F]/g, "").slice(0, 6); el.value = v; }
  else if (k === "swz") { v = v.replace(/[^rgbaxywzRGBAXYWZ01]/g, "").slice(0, 4); el.value = v; }
  else if (k === "px" || k === "sx") { v = v.replace(/[\\\/:*?"<>|]/g, ""); }
  st.set[k] = v; persist(); sync(); queuePreview();
}
function bindSplit(stg) {
  var drag = false;
  function mv(e) { var b = $("#ddBox"); if (!b) return; var r = b.getBoundingClientRect(); st.pos = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); var s = b.querySelector(".split"), cv = b.querySelectorAll(".cv"); if (s) s.style.left = st.pos + "%"; if (cv[1]) cv[1].style.clipPath = "inset(0 0 0 " + st.pos + "%)"; }
  stg.addEventListener("pointerdown", function (e) { if (st.view !== "split" || !e.target.closest("#ddBox")) return; drag = true; mv(e); try { stg.setPointerCapture(e.pointerId); } catch (x) {} });
  stg.addEventListener("pointermove", function (e) { if (drag) mv(e); });
  stg.addEventListener("pointerup", function () { drag = false; });
  stg.addEventListener("wheel", function (e) {
    var b = $("#ddBox"), c = st.cur; if (!b || b.hidden || !c || !c.img) return;
    e.preventDefault();
    var r = b.getBoundingClientRect(), iw = c.img.naturalWidth, cur = r.width / iw;
    var ns = Math.max(0.05, Math.min(32, cur * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    if (Math.abs(ns - cur) < 1e-4) return;
    var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    st.zoom = ns;
    b.style.width = Math.round(iw * ns) + "px"; b.style.height = Math.round(c.img.naturalHeight * ns) + "px"; b.classList.toggle("px", ns >= 2);
    var r2 = b.getBoundingClientRect(), sc = stg.querySelector(".sc");
    if (sc) { sc.scrollLeft += r2.left + fx * r2.width - e.clientX; sc.scrollTop += r2.top + fy * r2.height - e.clientY; }
    sync();
  }, { passive: false });
}
function live(e) { return root && root.querySelector(".ddg"); }
function onToggle(e) { var d = e.target; if (live() && d && d.dataset && d.dataset.sec) st.open[d.dataset.sec] = d.open ? 1 : 0; }
function onOver(e) { if (!live()) return; e.preventDefault(); var s = $("#ddStage"); if (s) s.classList.add("over"); }
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var s = $("#ddStage"); if (s) s.classList.remove("over"); } }
function onDrop(e) {
  if (!live()) return; e.preventDefault(); var s = $("#ddStage"); if (s) s.classList.remove("over"); var A = window.api;
  var ps = Array.prototype.map.call(e.dataTransfer.files, function (f) { return A && A.pathForFile ? A.pathForFile(f) : f.path; }).filter(Boolean);
  if (ps.length) addPaths(ps);
}
function mount(el, lg) {
  root = el; lang = lg || lang;
  /* обработчики именованные: повторный mount на том же элементе не создаёт дублей */
  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onInput);
  root.addEventListener("toggle", onToggle, true); root.addEventListener("dragenter", onOver); root.addEventListener("dragover", onOver);
  root.addEventListener("dragleave", onLeave); root.addEventListener("drop", onDrop);
  var stg = $("#ddStage"); if (stg) bindSplit(stg);
  if (st.avail === null && api()) api().ddsAvailable().then(function (v) { st.avail = !!v; renderFiles(); });
  sync(); drawStage();
  if (st.cur && st.cur.img && !st.dds && api()) queuePreview(0);
}
window.addEventListener("resize", function () { if (root && root.isConnected && st.zoom === "fit") drawStage(); });

window.DDS = { html: html, mount: mount };
window.TOOLS = (window.TOOLS || []).concat([{ id: "dds", ico: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.6"/><path d="M21 15l-5-5L5 21"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; }, view: html, mount: mount }]);
})();
