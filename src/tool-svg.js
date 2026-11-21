/* Инструмент «PNG → SVG». Подключается после tool-dds.js; регистрирует window.TOOLS.
   Картинка готовится в окне (прозрачность, удаление фона), векторизует vtracer.exe в главном процессе (svg.js, IPC svg:trace),
   на диск пишет тоже главный процесс (IPC svg:save). Состояние живёт в модуле, переживает перерисовку. */
(function () {
"use strict";
var I = {
en: {
 name:"PNG → SVG", desc:"Turn PNG, JPG and BMP into clean vector SVG with background and transparency control", back:"Tools",
 sub:"Add images, pick a preset, decide what happens to the background and compare the vector with the original before saving.",
 dropT:"Drop images here", dropS:"PNG, JPG, BMP · or click to browse", add:"Add", clear:"Clear", files:"Files", nofiles:"No files yet",
 vO:"Original", vS:"Compare", vV:"SVG", bgC:"Checker", bgD:"Dark", bgL:"Light", fit:"Fit", copy:"Copy SVG", copied:"Copied",
 busy:"Tracing…", perr:"Tracing error", noapp:"Conversion works in the desktop app only", big:"Large image: tracing may take a few seconds",
 iO:"Original", iV:"SVG", pth:"paths", clr:"colors", px:"px", smaller:"smaller", larger:"larger",
 sP:"Preset", pLogo:"Logo", pIll:"Illustration", pPho:"Photo", pBw:"B/W", pPix:"Pixel art",
 hLogo:"Few flat colors, crisp edges. Logos, icons, stickers.", hIll:"More colors, soft shapes. Drawings, cartoons, game art.", hPho:"Many colors with smoothing. Looks like a poster, files get big.", hBw:"One ink color, no gradients. Silhouettes, stamps, cut files, line art.", hPix:"Keeps hard pixel edges and right angles. Sprites and pixel art.",
 sB:"Background & transparency", bgm:"Background", bgKeep:"As in image", bgAuto:"Remove automatically", bgCol:"Remove a color", bgFill:"Solid fill",
 hKeep:"Transparent areas of the PNG stay empty. An opaque background becomes a big shape.", hAuto:"The background color is taken from the image corners and removed.", hCol:"You choose the color to remove, for example white.", hFill:"Keeps the picture and puts a solid color rectangle behind it.",
 ac:"Transparency cutoff", acS:"Pixels more transparent than this become empty, the rest become solid",
 pal:"Colors in the image", palS:"Click a color to remove it from the picture; click it again to keep everything", rc:"Color to remove", pick:"Pick", picking:"Click the image…", tol:"Tolerance", tolS:"How far a color may differ and still count as background",
 scope:"Where to remove", scEdge:"Edge only", scAll:"Everywhere", scopeS:"Edge only keeps white eyes, letters and holes inside the subject",
 fc:"Fill color",
 sC:"Colors", mono:"Black & white", monoS:"Two colors only: ink and paper", thr:"Threshold", thrS:"Darker than this becomes ink", ink:"Ink color", paperT:"Transparent paper", paperTS:"Off = paper is solid white",
 nc:"Number of colors", ncS:"More colors = more detail and a bigger file", smp:"Palette", smA:"Smart", smR:"Random", smG:"Grid", cyc:"Refinement passes",
 sD:"Detail & smoothing", lt:"Line precision", ltS:"Lower = follows the image more exactly, more points", qt:"Curve precision", qtS:"Lower = tighter curves, more points",
 po:"Ignore specks", poS:"Drop shapes smaller than this many pixels", ra:"Sharp corners", raS:"Keeps right angles crisp", blur:"Pre-blur", blurS:"Smooths noise before tracing, 0 = off",
 strk:"Gap fix", strkS:"Thin outline in the fill color that hides hairline gaps between shapes (grows shapes slightly)",
 sS:"Size & output", up:"Edge refinement", upS:"Traces an enlarged copy: smoother curves on small images, bigger file", ms:"Working size", msS:"Larger images are shrunk to this before tracing (speed)", os:"Output scale", osS:"Scales the width/height written to the file",
 fx:"Write width/height", fxS:"Off = the SVG scales to any size (viewBox only)", rd:"Decimals", lay:"Layering", layC:"Cutouts", layS:"Stacked", layH:"Stacked has no gaps between colors but a larger file",
 sO:"Saving", pfx:"Prefix", sfx:"Suffix", lc:"Lowercase names", ow:"Overwrite existing", out:"Output folder", outAuto:"Next to the original", pickD:"Choose",
 go:"Convert", doing:"Converting {a} / {n}", ok:"{n} saved", errs:"{n} failed", reveal:"Show in folder", reset:"Reset settings", exists:"File exists",
 sE:"Vector engine", simp:"Simplify curves", simpS:"Refits outlines: far fewer nodes with the same shape (a bit slower)", tl:"Accuracy", tlS:"Max deviation from the original, px. Lower = more exact, more nodes (0.25–0.6 works well)",
 upc:"Upscale small images", upcS:"Small images are enlarged before tracing for smoother curves; the SVG keeps the original size", blender:"Blender / 3D mode", blenderS:"Shapes don’t overlap, holes are cut out, no transforms. For Blender, 3D, CNC and laser. Also saves a *_blender.py next to the SVG: run it in Blender (Scripting) to get one mesh with colors in a Color Attribute instead of materials",
 pSharp:"Sharp", hSharp:"Logos, icons, flat graphics: clean edges, few colors.", pBal:"Balanced", hBal:"All-round default for most images.", pDet:"Detailed", hDet:"Gradients, art and complex illustrations: more layers and shades, bigger file.",
 noeng:"Converter component is missing. Reinstall the app",
 sG:"Guide: backgrounds & transparency",
 g1:"<b>Transparent PNG.</b> If the PNG already has a transparent background, keep “As in image”: empty areas stay empty and the SVG gets no background shape.",
 g2:"<b>Solid background (white, black, any color).</b> The tracer sees it as one more color, so it turns into a big rectangle behind your shapes. Use “Remove automatically” or “Remove a color” to cut it out.",
 g3:"<b>Remove only the outside.</b> “Edge only” removes the color only where it touches the image border, so white eyes, letters and holes inside the subject stay. “Everywhere” removes that color in every place.",
 g4:"<b>Tolerance.</b> JPG and smooth edges are never one exact color. Raise tolerance to 10–25% if a halo of the old background remains, lower it if parts of the subject disappear.",
 g5:"<b>Soft edges and shadows.</b> SVG shapes are flat colors. Soft shadows, glows and half-transparent pixels can’t be kept exactly: they become empty or solid by the cutoff. Gradients turn into color steps; more colors = smoother, bigger file.",
g7:"<b>Dark or black background.</b> Dark tones are very close to each other, so with a black background the automatic removal can also eat a dark subject. Lower tolerance to 0–3%, or use “Remove a color” with the pipette, and keep “Edge only”.",
 g6:"<b>Need a background back?</b> “Solid fill” puts a colored rectangle under the whole image, handy for icons and printing. Best results come from clean, high-contrast images at least 500 px wide; logos and flat art trace well, photos only look like posters."
},
ru: {
 name:"PNG → SVG", desc:"Превращает PNG, JPG и BMP в чистый вектор SVG с управлением фоном и прозрачностью", back:"Инструменты",
 sub:"Добавь картинки, выбери пресет, реши, что делать с фоном, и сравни вектор с оригиналом перед сохранением.",
 dropT:"Перетащи изображения сюда", dropS:"PNG, JPG, BMP · или нажми, чтобы выбрать", add:"Добавить", clear:"Очистить", files:"Файлы", nofiles:"Файлов пока нет",
 vO:"Оригинал", vS:"Сравнение", vV:"SVG", bgC:"Шахматка", bgD:"Тёмный", bgL:"Светлый", fit:"По размеру", copy:"Копировать SVG", copied:"Скопировано",
 busy:"Векторизую…", perr:"Ошибка векторизации", noapp:"Конвертация работает только в приложении", big:"Большая картинка: векторизация может занять несколько секунд",
 iO:"Оригинал", iV:"SVG", pth:"контуров", clr:"цветов", px:"px", smaller:"меньше", larger:"больше",
 sP:"Пресет", pLogo:"Логотип", pIll:"Иллюстрация", pPho:"Фото", pBw:"Ч/Б", pPix:"Пиксель-арт",
 hLogo:"Мало плоских цветов, чёткие края. Логотипы, иконки, стикеры.", hIll:"Больше цветов, мягкие формы. Рисунки, мультяшная графика, арты для игр.", hPho:"Много цветов со сглаживанием. Выглядит как постер, файл получается тяжёлым.", hBw:"Один цвет туши, без градиентов. Силуэты, печати, файлы для резки, лайн-арт.", hPix:"Сохраняет резкие пиксельные края и прямые углы. Спрайты и пиксель-арт.",
 sB:"Фон и прозрачность", bgm:"Фон", bgKeep:"Как в картинке", bgAuto:"Убрать автоматически", bgCol:"Убрать цвет", bgFill:"Сплошная заливка",
 hKeep:"Прозрачные места PNG остаются пустыми. Непрозрачный фон станет большой фигурой.", hAuto:"Цвет фона берётся из углов картинки и удаляется.", hCol:"Ты сам выбираешь цвет, который нужно убрать, например белый.", hFill:"Картинка остаётся, а под ней ставится прямоугольник сплошного цвета.",
 ac:"Порог прозрачности", acS:"Пиксели прозрачнее этого значения становятся пустыми, остальные сплошными",
 pal:"Цвета на картинке", palS:"Нажми на цвет, чтобы убрать его с фото; нажми ещё раз, чтобы вернуть", rc:"Какой цвет убрать", pick:"Пипетка", picking:"Кликни по картинке…", tol:"Допуск", tolS:"Насколько цвет может отличаться и всё ещё считаться фоном",
 scope:"Где убирать", scEdge:"Только по краям", scAll:"Везде", scopeS:"«Только по краям» сохраняет белые глаза, буквы и дырки внутри объекта",
 fc:"Цвет заливки",
 sC:"Цвета", mono:"Чёрно-белый", monoS:"Только два цвета: тушь и бумага", thr:"Порог", thrS:"Темнее этого значения станет тушью", ink:"Цвет туши", paperT:"Прозрачная бумага", paperTS:"Выкл = бумага сплошная белая",
 nc:"Количество цветов", ncS:"Больше цветов = больше деталей и тяжелее файл", smp:"Палитра", smA:"Умная", smR:"Случайная", smG:"Сетка", cyc:"Проходов уточнения",
 sD:"Детали и сглаживание", lt:"Точность линий", ltS:"Меньше = точнее повторяет картинку, больше точек", qt:"Точность кривых", qtS:"Меньше = плотнее кривые, больше точек",
 po:"Игнорировать мелочь", poS:"Убирать фигуры меньше этого числа пикселей", ra:"Острые углы", raS:"Сохраняет прямые углы чёткими", blur:"Предразмытие", blurS:"Сглаживает шум перед векторизацией, 0 = выкл",
 strk:"Убрать щели", strkS:"Тонкая обводка цветом заливки, скрывающая щели между фигурами (чуть увеличивает фигуры)",
 sS:"Размер и вывод", up:"Уточнение краёв", upS:"Векторизует увеличенную копию: плавнее кривые у маленьких картинок, файл больше", ms:"Рабочий размер", msS:"Большие картинки перед векторизацией уменьшаются до этого (скорость)", os:"Масштаб вывода", osS:"Меняет width/height, записанные в файл",
 fx:"Писать width/height", fxS:"Выкл = SVG масштабируется до любого размера (только viewBox)", rd:"Знаков после точки", lay:"Слои", layC:"Вырезы", layS:"Стопка", layH:"Стопка без щелей между цветами, но файл больше",
 sO:"Сохранение", pfx:"Префикс", sfx:"Суффикс", lc:"Имена строчными", ow:"Перезаписывать", out:"Папка вывода", outAuto:"Рядом с оригиналом", pickD:"Выбрать",
 go:"Конвертировать", doing:"Конвертирую {a} / {n}", ok:"Сохранено: {n}", errs:"Ошибок: {n}", reveal:"Показать в папке", reset:"Сбросить настройки", exists:"Файл уже есть",
 sE:"Векторный движок", simp:"Упростить кривые", simpS:"Переподгонка контуров: в разы меньше узлов при той же форме (чуть медленнее)", tl:"Точность", tlS:"Макс. отклонение от оригинала, px. Меньше = точнее, больше узлов (рабочий диапазон 0.25–0.6)",
 upc:"Увеличивать мелкие картинки", upcS:"Мелкие картинки перед векторизацией увеличиваются для плавных кривых, размер SVG остаётся исходным", blender:"Режим Blender / 3D", blenderS:"Фигуры не перекрываются, дырки вырезаются, transform вшит в координаты. Для Blender, 3D, ЧПУ и лазера. Рядом с SVG сохраняется *_blender.py: запусти его в Blender (Scripting), получишь один меш с цветами в Color Attribute вместо материалов",
 pSharp:"Чёткий", hSharp:"Логотипы, иконки, плоская графика: чистые края, мало цветов.", pBal:"Баланс", hBal:"Универсальный вариант для большинства картинок.", pDet:"Детальный", hDet:"Градиенты, арты, сложные иллюстрации: больше слоёв и оттенков, файл тяжелее.",
 noeng:"Компонент конвертации не найден. Переустанови приложение",
 sG:"Справка: фон и прозрачность",
 g1:"<b>Прозрачный PNG.</b> Если у PNG уже прозрачный фон, оставь «Как в картинке»: пустые места останутся пустыми, фоновой фигуры в SVG не будет.",
 g2:"<b>Сплошной фон (белый, чёрный, любой цвет).</b> Векторизатор видит его как ещё один цвет, поэтому он превращается в большой прямоугольник за фигурами. Включи «Убрать автоматически» или «Убрать цвет», чтобы вырезать его.",
 g3:"<b>Убрать только внешний фон.</b> «Только по краям» убирает цвет лишь там, где он касается края картинки, поэтому белые глаза, буквы и дырки внутри объекта остаются. «Везде» убирает этот цвет повсюду.",
 g4:"<b>Допуск.</b> У JPG и сглаженных краёв цвет никогда не бывает одним точным значением. Подними допуск до 10–25%, если остался ореол старого фона, и опусти, если пропадают части объекта.",
 g5:"<b>Мягкие края и тени.</b> Фигуры в SVG залиты плоским цветом. Мягкие тени, свечение и полупрозрачные пиксели нельзя сохранить точно: по порогу они становятся пустыми или сплошными. Градиенты превращаются в ступени цвета; больше цветов = плавнее, но тяжелее.",
g7:"<b>Тёмный или чёрный фон.</b> Тёмные тона очень близки друг к другу, поэтому при чёрном фоне автоматическое удаление может съесть и тёмный объект. Снизь допуск до 0–3% или используй «Убрать цвет» с пипеткой, режим «Только по краям» оставь.",
 g6:"<b>Нужен фон обратно?</b> «Сплошная заливка» ставит цветной прямоугольник под всю картинку, удобно для иконок и печати. Лучший результат дают чистые контрастные картинки от 500 px по ширине: логотипы и плоская графика векторизуются хорошо, а фото выглядят только как постер."
},
uk: {
 name:"PNG → SVG", desc:"Перетворює PNG, JPG і BMP на чистий вектор SVG з керуванням тлом і прозорістю", back:"Інструменти",
 sub:"Додай картинки, обери пресет, вирішуй, що робити з тлом, і порівняй вектор з оригіналом перед збереженням.",
 dropT:"Перетягни зображення сюди", dropS:"PNG, JPG, BMP · або натисни, щоб обрати", add:"Додати", clear:"Очистити", files:"Файли", nofiles:"Файлів поки немає",
 vO:"Оригінал", vS:"Порівняння", vV:"SVG", bgC:"Шахівниця", bgD:"Темний", bgL:"Світлий", fit:"За розміром", copy:"Копіювати SVG", copied:"Скопійовано",
 busy:"Векторизую…", perr:"Помилка векторизації", noapp:"Конвертація працює лише в застосунку", big:"Велика картинка: векторизація може тривати кілька секунд",
 iO:"Оригінал", iV:"SVG", pth:"контурів", clr:"кольорів", px:"px", smaller:"менше", larger:"більше",
 sP:"Пресет", pLogo:"Логотип", pIll:"Ілюстрація", pPho:"Фото", pBw:"Ч/Б", pPix:"Піксель-арт",
 hLogo:"Мало плоских кольорів, чіткі краї. Логотипи, іконки, стікери.", hIll:"Більше кольорів, м’які форми. Малюнки, мультяшна графіка, арти для ігор.", hPho:"Багато кольорів зі згладжуванням. Виглядає як постер, файл виходить важким.", hBw:"Один колір туші, без градієнтів. Силуети, печатки, файли для різання, лайн-арт.", hPix:"Зберігає різкі піксельні краї та прямі кути. Спрайти й піксель-арт.",
 sB:"Тло і прозорість", bgm:"Тло", bgKeep:"Як у картинці", bgAuto:"Прибрати автоматично", bgCol:"Прибрати колір", bgFill:"Суцільна заливка",
 hKeep:"Прозорі місця PNG залишаються порожніми. Непрозоре тло стане великою фігурою.", hAuto:"Колір тла береться з кутів картинки й видаляється.", hCol:"Ти сам обираєш колір, який треба прибрати, наприклад білий.", hFill:"Картинка залишається, а під нею ставиться прямокутник суцільного кольору.",
 ac:"Поріг прозорості", acS:"Пікселі прозоріші за це значення стають порожніми, решта суцільними",
 pal:"Кольори на зображенні", palS:"Натисни на колір, щоб прибрати його з фото; натисни ще раз, щоб повернути", rc:"Який колір прибрати", pick:"Піпетка", picking:"Клікни по картинці…", tol:"Допуск", tolS:"Наскільки колір може відрізнятися й усе ще вважатися тлом",
 scope:"Де прибирати", scEdge:"Лише по краях", scAll:"Скрізь", scopeS:"«Лише по краях» зберігає білі очі, літери й дірки всередині об’єкта",
 fc:"Колір заливки",
 sC:"Кольори", mono:"Чорно-білий", monoS:"Лише два кольори: туш і папір", thr:"Поріг", thrS:"Темніше за це значення стане тушшю", ink:"Колір туші", paperT:"Прозорий папір", paperTS:"Вимк = папір суцільний білий",
 nc:"Кількість кольорів", ncS:"Більше кольорів = більше деталей і важчий файл", smp:"Палітра", smA:"Розумна", smR:"Випадкова", smG:"Сітка", cyc:"Проходів уточнення",
 sD:"Деталі та згладжування", lt:"Точність ліній", ltS:"Менше = точніше повторює картинку, більше точок", qt:"Точність кривих", qtS:"Менше = щільніші криві, більше точок",
 po:"Ігнорувати дрібниці", poS:"Прибирати фігури менші за це число пікселів", ra:"Гострі кути", raS:"Зберігає прямі кути чіткими", blur:"Передрозмиття", blurS:"Згладжує шум перед векторизацією, 0 = вимк",
 strk:"Прибрати щілини", strkS:"Тонка обводка кольором заливки, що ховає щілини між фігурами (трохи збільшує фігури)",
 sS:"Розмір і вивід", up:"Уточнення країв", upS:"Векторизує збільшену копію: плавніші криві в маленьких картинок, файл більший", ms:"Робочий розмір", msS:"Великі картинки перед векторизацією зменшуються до цього (швидкість)", os:"Масштаб виводу", osS:"Змінює width/height, записані у файл",
 fx:"Писати width/height", fxS:"Вимк = SVG масштабується до будь-якого розміру (лише viewBox)", rd:"Знаків після коми", lay:"Шари", layC:"Вирізи", layS:"Стос", layH:"Стос без щілин між кольорами, але файл більший",
 sO:"Збереження", pfx:"Префікс", sfx:"Суфікс", lc:"Імена малими літерами", ow:"Перезаписувати", out:"Тека виводу", outAuto:"Поруч з оригіналом", pickD:"Обрати",
 go:"Конвертувати", doing:"Конвертую {a} / {n}", ok:"Збережено: {n}", errs:"Помилок: {n}", reveal:"Показати в теці", reset:"Скинути налаштування", exists:"Файл уже є",
 sE:"Векторний рушій", simp:"Спростити криві", simpS:"Переподгонка контурів: у рази менше вузлів за тієї ж форми (трохи повільніше)", tl:"Точність", tlS:"Макс. відхилення від оригіналу, px. Менше = точніше, більше вузлів (робочий діапазон 0.25–0.6)",
 upc:"Збільшувати дрібні зображення", upcS:"Дрібні зображення перед векторизацією збільшуються для плавних кривих, розмір SVG лишається вихідним", blender:"Режим Blender / 3D", blenderS:"Фігури не перекриваються, діри вирізаються, transform вшито в координати. Для Blender, 3D, ЧПУ та лазера. Поруч із SVG зберігається *_blender.py: запусти його в Blender (Scripting), отримаєш один меш з кольорами в Color Attribute замість матеріалів",
 pSharp:"Чіткий", hSharp:"Логотипи, іконки, пласка графіка: чисті краї, мало кольорів.", pBal:"Баланс", hBal:"Універсальний варіант для більшості зображень.", pDet:"Детальний", hDet:"Градієнти, арти, складні ілюстрації: більше шарів і відтінків, файл важчий.",
 noeng:"Компонент конвертації не знайдено. Перевстановіть застосунок",
 sG:"Довідка: тло і прозорість",
 g1:"<b>Прозорий PNG.</b> Якщо у PNG уже прозоре тло, залиш «Як у картинці»: порожні місця залишаться порожніми, фонової фігури в SVG не буде.",
 g2:"<b>Суцільне тло (біле, чорне, будь-який колір).</b> Векторизатор бачить його як ще один колір, тому воно перетворюється на великий прямокутник за фігурами. Увімкни «Прибрати автоматично» або «Прибрати колір», щоб вирізати його.",
 g3:"<b>Прибрати лише зовнішнє тло.</b> «Лише по краях» прибирає колір тільки там, де він торкається краю картинки, тому білі очі, літери й дірки всередині об’єкта залишаються. «Скрізь» прибирає цей колір усюди.",
 g4:"<b>Допуск.</b> У JPG і згладжених країв колір ніколи не буває одним точним значенням. Підніми допуск до 10–25%, якщо лишився німб старого тла, і зніж, якщо зникають частини об’єкта.",
 g5:"<b>М’які краї та тіні.</b> Фігури в SVG залиті плоским кольором. М’які тіні, сяйво й напівпрозорі пікселі не можна зберегти точно: за порогом вони стають порожніми або суцільними. Градієнти перетворюються на сходинки кольору; більше кольорів = плавніше, але важче.",
g7:"<b>Темне або чорне тло.</b> Темні тони дуже близькі між собою, тому при чорному тлі автоматичне видалення може з’їсти й темний об’єкт. Зніж допуск до 0–3% або використай «Прибрати колір» з піпеткою, режим «Лише по краях» залиш.",
 g6:"<b>Потрібне тло назад?</b> «Суцільна заливка» ставить кольоровий прямокутник під усю картинку, зручно для іконок і друку. Найкращий результат дають чисті контрастні картинки від 500 px завширшки: логотипи й плоска графіка векторизуються добре, а фото виглядають лише як постер."
}
};

var PRESETS = [
 ["sharp", "pSharp", "hSharp", {}],
 ["balanced", "pBal", "hBal", {}],
 ["detailed", "pDet", "hDet", {}],
 ["bw", "pBw", "hBw", {}]
];
var DEF = { pre:"balanced", bgm:"keep", ac:128, rc:"#ffffff", tol:8, scope:"edge", fc:"#ffffff",
 simp:1, tl:0.35, upc:1, blender:0, ms:1024, os:1, fx:1,
 px:"", sx:"", lc:0, ow:1 };
var st = { files:[], sel:-1, outDir:"", set:clone(DEF), view:"split", bg:"check", zoom:"fit", pos:50, open:{p:1,b:1,c:1,s:0,o:0,g:0},
 cur:null, svg:null, info:null, state:"idle", err:"", busy:false, prog:null, summary:null, lastOut:"", pick:false, copied:0 };
var root = null, lang = "en", rid = 0, tmr = 0, loadId = 0, svgUrl = "";
try { var sv = JSON.parse(localStorage.getItem("mh_svg3") || "null"); if (sv) { Object.keys(DEF).forEach(function (k) { if (sv.set && sv.set[k] !== undefined && typeof sv.set[k] === typeof DEF[k]) st.set[k] = sv.set[k]; }); if (typeof sv.outDir === "string") st.outDir = sv.outDir; } } catch (e) {}
function persist() { try { localStorage.setItem("mh_svg3", JSON.stringify({ set: st.set, outDir: st.outDir })); } catch (e) {} }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function L(k, v) { var s = (I[lang] && I[lang][k]) || I.en[k] || k; if (v) Object.keys(v).forEach(function (n) { s = s.replace("{" + n + "}", v[n]); }); return s; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function api() { return window.api && window.api.svgSave ? window.api : null; }
function $(s) { return root ? root.querySelector(s) : null; }
function bytesFmt(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
function hex2rgb(h) { var m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return [255, 255, 255]; var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb2hex(r, g, b) { return "#" + [r, g, b].map(function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }

/* ---------- палитра картинки: основные цвета, чтобы выбрать, какой убрать ---------- */
function palette(img) {
  var m = Math.min(1, 160 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.max(1, Math.round(img.naturalWidth * m)), h = Math.max(1, Math.round(img.naturalHeight * m));
  var c = document.createElement("canvas"); c.width = w; c.height = h;
  var g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  var d = g.getImageData(0, 0, w, h).data, ex = {}, bk = {}, tot = 0, i, key, bq, n;
  for (i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    tot++; key = d[i] << 16 | d[i + 1] << 8 | d[i + 2]; n = ex[key] = (ex[key] || 0) + 1;
    bq = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4);
    var b = bk[bq] || (bk[bq] = { n: 0, best: key, bn: 0 }); b.n++; if (n > b.bn) { b.bn = n; b.best = key; }
  }
  if (!tot) return [];
  var arr = Object.keys(bk).map(function (k) { return bk[k]; }).sort(function (a, b2) { return b2.n - a.n; }), out = [];
  arr.forEach(function (b2) {
    if (b2.n / tot < 0.003) return;
    var r = b2.best >> 16 & 255, gg = b2.best >> 8 & 255, bl = b2.best & 255, near = null;
    out.forEach(function (o) { var dr = o.r - r, dg = o.g - gg, db = o.b - bl; if (!near && dr * dr + dg * dg + db * db < 48 * 48) near = o; });
    if (near) near.n += b2.n; else if (out.length < 10) out.push({ r: r, g: gg, b: bl, n: b2.n });
  });
  return out.map(function (o) { return { hex: rgb2hex(o.r, o.g, o.b), pct: o.n / tot * 100 }; });
}

/* ---------- векторизация (чистые функции) ---------- */
/* Подготовка пикселей: прозрачность, удаление фона, чёрно-белый режим. Меняет data на месте. */
function prep(d, w, h, s) {
  var i, a, cut = Math.max(1, Math.min(254, s.ac | 0));
  for (i = 0; i < d.length; i += 4) { a = d[i + 3] >= cut ? 255 : 0; d[i + 3] = a; if (!a) { d[i] = d[i + 1] = d[i + 2] = 0; } }
  if (s.bgm === "auto" || s.bgm === "color") {
    var tc = null;
    if (s.bgm === "color") tc = hex2rgb(s.rc);
    else {
      var cs = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]], rs = [], gs = [], bs = [];
      cs.forEach(function (p) { var o = (p[1] * w + p[0]) * 4; if (d[o + 3]) { rs.push(d[o]); gs.push(d[o + 1]); bs.push(d[o + 2]); } });
      if (rs.length) { var med = function (x) { x.sort(function (m, n) { return m - n; }); return x[x.length >> 1]; }; tc = [med(rs), med(gs), med(bs)]; }
    }
    if (tc) {
      var lim = s.tol / 100 * 441.673, lim2 = lim * lim;
      var near = function (o) { if (!d[o + 3]) return false; var dr = d[o] - tc[0], dg = d[o + 1] - tc[1], db = d[o + 2] - tc[2]; return dr * dr + dg * dg + db * db <= lim2; };
      if (s.scope === "all") { for (i = 0; i < d.length; i += 4) if (near(i)) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; } }
      else {
        var seen = new Uint8Array(w * h), stack = [], push = function (x, y) { if (x < 0 || y < 0 || x >= w || y >= h) return; var k = y * w + x; if (seen[k]) return; seen[k] = 1; if (near(k * 4)) stack.push(k); };
        var x, y, k, o2;
        for (x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
        for (y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
        while (stack.length) { k = stack.pop(); o2 = k * 4; d[o2] = d[o2 + 1] = d[o2 + 2] = d[o2 + 3] = 0; x = k % w; y = (k - x) / w; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
      }
    }
  }
}

/* ---------- векторизация: PNG уходит в главный процесс, там работает vtracer.exe ---------- */
function canvasPng(c) {
  return new Promise(function (res, rej) {
    c.toBlob(function (b) { if (!b) { rej(new Error("png")); return; } b.arrayBuffer().then(res, rej); }, "image/png");
  });
}
/* Приводит ответ движка к нашему виду: чистая шапка, размеры, подложка «Сплошная заливка», счётчики. */
function finishSvg(raw, ow, oh, s) {
  var m = /<svg[^>]*>/.exec(raw); if (!m) throw new Error("bad svg");
  var vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(m[0]), w = vb ? +vb[1] : ow, h = vb ? +vb[2] : oh;
  var rest = raw.slice(m.index + m[0].length), colors = {}, fm, re = /<path[^>]*?fill="([^"]+)"/g, paths = (rest.match(/<path/g) || []).length;
  while ((fm = re.exec(rest))) colors[fm[1].toLowerCase()] = 1;
  if (s.bgm === "fill") rest = '<rect width="' + w + '" height="' + h + '" fill="' + s.fc + '"/>' + rest;
  var sz = s.fx ? ' width="' + Math.round(ow * s.os * 100) / 100 + '" height="' + Math.round(oh * s.os * 100) / 100 + '"' : "";
  return { svg: '<svg xmlns="http://www.w3.org/2000/svg"' + sz + ' viewBox="0 0 ' + w + " " + h + '">' + rest, paths: paths, colors: Object.keys(colors).length };
}
function vectorize(img, s, preview) {
  var ow = img.naturalWidth, oh = img.naturalHeight, k = Math.min(1, s.ms / Math.max(ow, oh));
  var w = Math.max(1, Math.round(ow * k)), h = Math.max(1, Math.round(oh * k));
  var c = document.createElement("canvas"); c.width = w; c.height = h;
  var x = c.getContext("2d", { willReadFrequently: true }); x.imageSmoothingQuality = "high"; x.drawImage(img, 0, 0, w, h);
  var id = x.getImageData(0, 0, w, h), d = id.data, i; prep(d, w, h, s);
  /* Ч/Б трассируется по яркости: прозрачное нужно залить белым, иначе оно станет «чернилами» */
  if (s.pre === "bw") for (i = 0; i < d.length; i += 4) if (!d[i + 3]) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 255; }
  x.putImageData(id, 0, 0);
  return canvasPng(c).then(function (buf) {
    var A = window.api; if (!A || !A.svgTrace) throw new Error(L("noapp"));
    return A.svgTrace({ png: buf, preset: s.pre, blender: !!s.blender, simplify: !!s.simp, tol: s.tl, upscale: !!s.upc, preview: !!preview });
  }).then(function (r) {
    if (!r || !r.ok) { var e = new Error(r && r.error === "noengine" ? L("noeng") : String(r && r.error || "error")); e.code = r && r.error; throw e; }
    var out = finishSvg(r.svg, ow, oh, s); out.w = w; out.h = h; return out;
  });
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
  var pre = '<div class="seg pre">' + PRESETS.map(function (p) { return '<button data-pre="' + p[0] + '" aria-pressed="false" title="' + esc(L(p[2])) + '">' + L(p[1]) + '</button>'; }).join("") + '</div>';
  var settings =
   sec("p", L("sP"), '<div class="prow">' + pre + '<p class="phint" id="svPh"></p></div>')
  + sec("b", L("sB"), row(L("bgm"), "", seg("bgm", [["keep", L("bgKeep")], ["auto", L("bgAuto")], ["color", L("bgCol")], ["fill", L("bgFill")]]), "", "st") + '<p class="phint" id="svBh"></p>'
     + row(L("pal"), L("palS"), '<span class="pal" id="svPal"></span>', "ispal")
     + row(L("rc"), "", '<span class="cc">' + clr("rc") + '<button class="mini" id="svPick">' + L("pick") + '</button></span>', "isc")
     + row(L("tol"), L("tolS"), '<span class="cc">' + num("tol", 0, 100, 0.5) + '<small>%</small></span>', "isac")
     + row(L("scope"), L("scopeS"), seg("scope", [["edge", L("scEdge")], ["all", L("scAll")]]), "isac", "st")
     + row(L("fc"), "", clr("fc"), "isf")
     + row(L("ac"), L("acS"), num("ac", 1, 254, 1)))
  + sec("c", L("sE"), row(L("simp"), L("simpS"), chk("simp")) + row(L("tl"), L("tlS"), num("tl", 0.1, 3, 0.05), "issm") + row(L("upc"), L("upcS"), chk("upc")) + row(L("blender"), L("blenderS"), chk("blender")))
  + sec("s", L("sS"), row(L("ms"), L("msS"), seg("ms", [[1024, "1024"], [2048, "2048"], [4096, "4096"]]), "", "st") + row(L("os"), L("osS"), num("os", 0.1, 16, 0.1)) + row(L("fx"), L("fxS"), chk("fx")))
  + sec("o", L("sO"), row(L("pfx"), "", '<input class="inp" type="text" data-k="px" maxlength="40" spellcheck="false">') + row(L("sfx"), "", '<input class="inp" type="text" data-k="sx" maxlength="40" spellcheck="false">') + row(L("lc"), "", chk("lc")) + row(L("ow"), "", chk("ow")))
  + sec("g", L("sG"), ["g1", "g2", "g3", "g4", "g7", "g5", "g6"].map(function (k) { return '<p class="note">' + L(k) + '</p>'; }).join(""));
  return '<div class="tvh"><button class="back" data-tool="">' + ico("back") + L("back") + '</button><h1>' + L("name") + '</h1><p class="sub">' + L("sub") + '</p></div>'
   + '<div class="svg-g"><div class="ddl"><div class="card ddp">'
   + '<div class="ddt"><div class="ddtr">' + seg("view", [["orig", L("vO")], ["split", L("vS")], ["svg", L("vV")]]) + '<button class="mini" id="svCopy">' + L("copy") + '</button></div>'
   + '<div class="ddtr">' + seg("bg", [["check", L("bgC")], ["dark", L("bgD")], ["light", L("bgL")]]) + seg("zoom", [["fit", L("fit")], ["1", "100%"], ["2", "200%"], ["4", "400%"]]) + '</div></div>'
   + '<div class="stage" id="svStage"><div class="sc"><div class="drop" id="svDrop"><b>' + L("dropT") + '</b><span>' + L("dropS") + '</span></div><div class="cvb" id="svBox" hidden></div></div><div class="stb" id="svBadge" hidden></div></div>'
   + '<div class="ddi"><span id="sviO"></span><span id="sviV"></span></div></div></div>'
   + '<div class="ddr"><div class="card ddf"><div class="ddfh"><h3>' + L("files") + '</h3><span><button class="mini" id="svAdd">' + L("add") + '</button><button class="mini" id="svClr">' + L("clear") + '</button></span></div>'
   + '<div class="flist" id="svList"></div>'
   + '<div class="fout"><span class="l">' + L("out") + '<small id="svOut"></small></span><span class="fob"><button class="mini" id="svDir">' + L("pickD") + '</button><button class="mini" id="svOutX" title="×">×</button></span></div>'
   + '<button class="go ddgo" id="svGo"></button><div class="pbar" id="svPb" hidden><i></i></div><p class="dsum" id="svSum"></p></div>'
   + '<div class="card dds">' + settings + '<div class="dres"><button class="mini" id="svReset">' + L("reset") + '</button></div></div></div></div>';
}

/* ---------- состояние -> DOM ---------- */
var COND = {
  isc: function (s) { return s.bgm === "color"; }, isac: function (s) { return s.bgm === "color" || s.bgm === "auto"; }, isf: function (s) { return s.bgm === "fill"; },
  issm: function (s) { return !!s.simp; },
  ispal: function (s) { return s.bgm !== "fill" && !!(st.cur && st.cur.pal && st.cur.pal.length); }
};
var BGH = { keep: "hKeep", auto: "hAuto", color: "hCol", fill: "hFill" };
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
  var ph = $("#svPh"), pr = PRESETS.filter(function (p) { return p[0] === s.pre; })[0]; if (ph) ph.textContent = pr ? L(pr[2]) : "";
  var bh = $("#svBh"); if (bh) bh.textContent = L(BGH[s.bgm] || "hKeep");
  var pk = $("#svPick"); if (pk) pk.textContent = st.pick ? L("picking") : L("pick");
  if (st.cur && st.cur.img && !st.cur.pal) { try { st.cur.pal = palette(st.cur.img); } catch (e) { st.cur.pal = []; } }
  var pl = $("#svPal");
  if (pl) {
    var on = s.bgm === "color" || s.bgm === "auto" ? (s.bgm === "color" ? s.rc.toLowerCase() : "") : "";
    pl.innerHTML = ((st.cur && st.cur.pal) || []).map(function (c) {
      return '<span class="swc"><button class="sw" data-sw="' + c.hex + '" title="' + c.hex + '" aria-pressed="' + String(c.hex === on) + '" style="background:' + c.hex + '"></button><i>' + (c.pct >= 10 ? Math.round(c.pct) : c.pct.toFixed(1)) + '%</i></span>';
    }).join("");
  }
  root.querySelectorAll("[data-if]").forEach(function (el) { var f = COND[el.dataset.if]; el.hidden = !(f && f(s)); });
  root.querySelectorAll("details[data-sec]").forEach(function (d) { d.open = !!st.open[d.dataset.sec]; });
  var cp = $("#svCopy"); if (cp) { cp.disabled = !st.svg; cp.textContent = st.copied ? L("copied") : L("copy"); }
  renderFiles(); renderInfo();
}
function renderFiles() {
  var list = $("#svList"); if (!list) return;
  var has = st.files.length > 0;
  $("#svDrop").hidden = has && st.cur && st.cur.img ? true : false;
  list.innerHTML = has ? st.files.map(function (f, i) {
    var ic = f.status === "done" ? "✓" : f.status === "err" ? "!" : f.status === "busy" ? "…" : "";
    return '<div class="fi' + (i === st.sel ? " on" : "") + (f.status ? " " + f.status : "") + '" data-i="' + i + '"><span class="fs">' + ic + '</span><span class="fn" title="' + esc(f.path) + '">' + esc(f.name) + '</span>' + (f.err ? '<span class="fe" title="' + esc(f.err) + '">' + esc(f.err === "exists" ? L("exists") : f.err) + '</span>' : "") + '<button class="fx" data-rm="' + i + '" title="×">×</button></div>';
  }).join("") : '<p class="fnone">' + L("nofiles") + '</p>';
  var o = $("#svOut"); if (o) o.textContent = st.outDir || L("outAuto");
  var x = $("#svOutX"); if (x) x.hidden = !st.outDir;
  var go = $("#svGo");
  if (go) { go.disabled = !has || st.busy || !api(); go.textContent = st.busy && st.prog ? L("doing", { a: Math.min(st.prog.i + 1, st.prog.n), n: st.prog.n }) : L("go") + (has ? " (" + st.files.length + ")" : ""); }
  var sm = $("#svSum");
  if (sm) {
    if (!api()) sm.textContent = L("noapp");
    else if (st.summary) { sm.innerHTML = (st.summary.ok ? '<b class="okc">' + L("ok", { n: st.summary.ok }) + '</b> ' : "") + (st.summary.err ? '<b class="erc">' + L("errs", { n: st.summary.err }) + '</b> ' : "") + (st.lastOut ? '<button class="lnk" id="svRev">' + L("reveal") + '</button>' : ""); }
    else sm.textContent = "";
  }
}
function renderInfo() {
  var a = $("#sviO"), b = $("#sviV"); if (!a) return;
  var c = st.cur;
  if (!c || !c.img) { a.textContent = ""; b.textContent = ""; return; }
  a.textContent = L("iO") + ": " + c.img.naturalWidth + "×" + c.img.naturalHeight + " " + L("px") + " · " + bytesFmt(c.size || 0);
  if (!st.info) { b.textContent = ""; return; }
  var n = st.info.bytes, rt = c.size ? Math.round((1 - n / c.size) * 100) : 0;
  b.textContent = L("iV") + ": " + st.info.paths + " " + L("pth") + " · " + st.info.colors + " " + L("clr") + " · " + bytesFmt(n) + (c.size ? " (" + Math.abs(rt) + "% " + (rt >= 0 ? L("smaller") : L("larger")) + ")" : "");
}
function badge(t, err) { var b = $("#svBadge"); if (!b) return; b.hidden = !t; b.textContent = t || ""; b.classList.toggle("er", !!err); }

/* ---------- сцена ---------- */
function drawStage() {
  var box = $("#svBox"), stg = $("#svStage"); if (!box) return;
  var c = st.cur;
  if (!c || !c.img) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  var iw = c.img.naturalWidth, ih = c.img.naturalHeight, sw = stg.clientWidth - 24, sh = stg.clientHeight - 24;
  var sc = st.zoom === "fit" ? Math.min(8, Math.max(0.05, Math.min(sw / iw, sh / ih))) : Number(st.zoom);
  box.style.width = Math.round(iw * sc) + "px"; box.style.height = Math.round(ih * sc) + "px";
  box.classList.toggle("px", sc >= 2);
  stg.className = "stage bg-" + st.bg + (st.pick ? " picking" : "");
  var hasV = !!svgUrl && !!st.svg, view = st.view === "svg" && !hasV ? "orig" : st.view;
  box.innerHTML = "";
  var co = document.createElement("img"); co.className = "cv"; co.src = c.img.src; co.draggable = false;
  var cv = null; if (hasV) { cv = document.createElement("img"); cv.className = "cv"; cv.src = svgUrl; cv.draggable = false; }
  if (view === "orig" || (view === "split" && !cv)) box.appendChild(co);
  else if (view === "svg") box.appendChild(cv);
  else {
    box.appendChild(co); cv.style.clipPath = "inset(0 0 0 " + st.pos + "%)"; box.appendChild(cv);
    var hd = document.createElement("div"); hd.className = "split"; hd.style.left = st.pos + "%"; hd.innerHTML = "<i></i>"; box.appendChild(hd);
    var a = document.createElement("span"); a.className = "tag l"; a.textContent = L("vO"); var b = document.createElement("span"); b.className = "tag r"; b.textContent = L("vV"); box.appendChild(a); box.appendChild(b);
  }
}
function setSvg(res) {
  if (svgUrl) { try { URL.revokeObjectURL(svgUrl); } catch (e) {} svgUrl = ""; }
  if (res) { st.svg = res.svg; st.info = { paths: res.paths, colors: res.colors, bytes: new Blob([res.svg]).size }; svgUrl = URL.createObjectURL(new Blob([res.svg], { type: "image/svg+xml" })); }
  else { st.svg = null; st.info = null; }
}

/* ---------- файлы ---------- */
function addPaths(paths) {
  var seen = {}; st.files.forEach(function (f) { seen[f.path.toLowerCase()] = 1; });
  var add = paths.filter(function (p) { return /\.(png|jpe?g|bmp)$/i.test(p) && !seen[p.toLowerCase()] && (seen[p.toLowerCase()] = 1); });
  add.slice(0, 200 - st.files.length).forEach(function (p) { st.files.push({ path: p, name: p.split(/[\\/]/).pop() }); });
  st.summary = null;
  if (st.sel < 0 && st.files.length) select(0); else sync();
}
function loadImage(path) {
  return new Promise(function (res, rej) {
    var A = window.api; if (!A || !A.ddsRead) { rej(new Error("noapp")); return; }
    A.ddsRead(path).then(function (r) {
      if (!r || !r.ok) { rej(new Error(String(r && r.error || "error"))); return; }
      var im = new Image(); im.onload = function () { res({ img: im, size: r.size }); }; im.onerror = function () { rej(new Error("decode error")); }; im.src = r.url;
    }, rej);
  });
}
function select(i) {
  if (i < 0 || i >= st.files.length) { st.sel = -1; st.cur = null; setSvg(null); loadId++; drawStage(); sync(); return; }
  st.sel = i; setSvg(null); var f = st.files[i], id = ++loadId;
  st.cur = { path: f.path, img: null, size: 0 }; sync(); drawStage(); badge(L("busy"));
  if (!window.api) { badge(L("noapp"), 1); return; }
  loadImage(f.path).then(function (r) {
    if (id !== loadId) return;
    st.cur = { path: f.path, img: r.img, size: r.size }; sync(); drawStage(); queueTrace(0);
  }, function (e) { if (id === loadId) badge(String(e.message || e), 1); });
}
function queueTrace(delay) {
  if (!st.cur || !st.cur.img) return;
  clearTimeout(tmr); var big = Math.max(st.cur.img.naturalWidth, st.cur.img.naturalHeight) > 1600 && st.set.ms >= 2048;
  badge(big ? L("big") : L("busy"));
  tmr = setTimeout(runTrace, delay === undefined ? 450 : delay);
}
function runTrace() {
  var c = st.cur; if (!c || !c.img) return;
  var id = ++rid, path = c.path;
  setTimeout(function () {
    if (id !== rid || !st.cur || st.cur.path !== path) return;
    vectorize(c.img, st.set, true).then(function (r) {
      if (id !== rid || !st.cur || st.cur.path !== path) return;
      setSvg(r); st.err = ""; badge(""); drawStage(); sync();
    }, function (e) {
      if (id !== rid || !st.cur || st.cur.path !== path) return;
      setSvg(null); badge(L("perr") + ": " + String(e && e.message || e).slice(0, 120), 1); drawStage(); sync();
    });
  }, 20);
}
function convert() {
  var A = api(); if (!A || st.busy || !st.files.length) return;
  st.busy = true; st.summary = null; st.lastOut = ""; st.prog = { i: 0, n: st.files.length };
  st.files.forEach(function (f) { f.status = "busy"; f.err = ""; });
  var pb = $("#svPb"); if (pb) { pb.hidden = false; pb.firstChild.style.width = "0%"; }
  sync();
  var ok = 0, er = 0, n = st.files.length, set = clone(st.set), list = st.files.slice(), dir = st.outDir, idx = 0;
  function done() {
    st.busy = false; st.summary = { ok: ok, err: er }; st.prog = null; sync();
    setTimeout(function () { var p = $("#svPb"); if (p) p.hidden = true; }, 800);
  }
  function step() {
    if (idx >= n) { done(); return; }
    var f = list[idx], i = idx++;
    function fin(success, err, out) {
      f.status = success ? "done" : "err"; f.err = err || ""; if (success) { ok++; if (out) st.lastOut = out; } else er++;
      st.prog = { i: i + 1, n: n }; var p = $("#svPb"); if (p) p.firstChild.style.width = Math.round((i + 1) / n * 100) + "%";
      renderFiles(); setTimeout(step, 0);
    }
    loadImage(f.path).then(function (r) {
      vectorize(r.img, set, false).then(function (res) {
        return A.svgSave({ items: [{ input: f.path, svg: res.svg }], outDir: dir, px: set.px, sx: set.sx, lc: set.lc, ow: set.ow, bl: !!set.blender, reset: i === 0 }).then(function (rr) {
          var q = rr && rr[0]; fin(!!(q && q.success), q && q.error, q && q.output);
        });
      }).catch(function (e) { fin(false, String(e && e.message || e).slice(0, 120)); });
    }, function (e) { fin(false, String(e && e.message || e).slice(0, 120)); });
  }
  step();
}

/* ---------- события ---------- */
function applyPreset(id) {
  var p = PRESETS.filter(function (x) { return x[0] === id; })[0]; if (!p) return;
  Object.keys(p[3]).forEach(function (k) { st.set[k] = p[3][k]; }); st.set.pre = id; persist(); sync(); queueTrace();
}
function setVal(k, v) {
  if (k === "view" || k === "bg") { st[k] = v; drawStage(); sync(); return; }
  if (k === "zoom") { st.zoom = v === "fit" ? "fit" : Number(v); drawStage(); sync(); return; }
  st.set[k] = v; persist(); sync(); queueTrace();
}
function pickColor(e) {
  var box = $("#svBox"); if (!box || !st.cur || !st.cur.img) return false;
  var r = box.getBoundingClientRect(), im = st.cur.img;
  var x = Math.floor((e.clientX - r.left) / r.width * im.naturalWidth), y = Math.floor((e.clientY - r.top) / r.height * im.naturalHeight);
  if (x < 0 || y < 0 || x >= im.naturalWidth || y >= im.naturalHeight) return false;
  var c = document.createElement("canvas"); c.width = 1; c.height = 1; var g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(im, x, y, 1, 1, 0, 0, 1, 1);
  var p = g.getImageData(0, 0, 1, 1).data; if (!p[3]) return false;
  st.set.rc = rgb2hex(p[0], p[1], p[2]); return true;
}
function onClick(e) {
  if (!live()) return;
  var t = e.target;
  if (st.pick && t.closest("#svBox")) { st.pick = false; if (pickColor(e)) { persist(); queueTrace(); } drawStage(); sync(); return; }
  var sw = t.closest("[data-sw]");
  if (sw) { var hx = sw.dataset.sw; if (st.set.bgm === "color" && st.set.rc.toLowerCase() === hx) st.set.bgm = "keep"; else { st.set.bgm = "color"; st.set.rc = hx; } persist(); sync(); queueTrace(); return; }
  var rm = t.closest("[data-rm]"); if (rm) { var i = Number(rm.dataset.rm); st.files.splice(i, 1); st.summary = null; if (!st.files.length) select(-1); else if (i === st.sel) select(Math.min(i, st.files.length - 1)); else { if (i < st.sel) st.sel--; sync(); } return; }
  var fi = t.closest(".fi"); if (fi) { var j = Number(fi.dataset.i); if (j !== st.sel) select(j); return; }
  var pre = t.closest("[data-pre]"); if (pre) { applyPreset(pre.dataset.pre); return; }
  var b = t.closest("button[data-k]");
  if (b && !b.disabled) { var k = b.dataset.k; if (b.classList.contains("chk")) setVal(k, st.set[k] ? 0 : 1); else { var v = b.dataset.v; setVal(k, k === "zoom" || typeof st.set[k] !== "number" ? v : Number(v)); } return; }
  var id = t.id || (t.closest("button") || {}).id;
  if (id === "svAdd" || t.closest("#svDrop")) { var A = window.api; if (A && A.ddsPickFiles) A.ddsPickFiles().then(addPaths); return; }
  if (id === "svClr") { st.files = []; st.summary = null; select(-1); return; }
  if (id === "svDir") { var A2 = window.api; if (A2 && A2.ddsPickDir) A2.ddsPickDir().then(function (d) { if (d) { st.outDir = d; persist(); sync(); } }); return; }
  if (id === "svOutX") { st.outDir = ""; persist(); sync(); return; }
  if (id === "svGo") { convert(); return; }
  if (id === "svReset") { st.set = clone(DEF); persist(); sync(); queueTrace(); return; }
  if (id === "svPick") { st.pick = !st.pick; drawStage(); sync(); return; }
  if (id === "svCopy") { var A3 = api(); if (A3 && st.svg) A3.svgCopy(st.svg).then(function (ok) { if (ok) { st.copied = 1; sync(); setTimeout(function () { st.copied = 0; sync(); }, 1500); } }); return; }
  if (id === "svRev") { var A4 = window.api; if (A4 && A4.ddsReveal && st.lastOut) A4.ddsReveal(st.lastOut); return; }
}
function onInput(e) {
  if (!live()) return;
  var el = e.target.closest("[data-k]"); if (!el || el.tagName === "BUTTON") return;
  var k = el.dataset.k, v = el.value;
  if (el.dataset.n) { v = parseFloat(v); if (!isFinite(v)) return; var mn = parseFloat(el.min), mx = parseFloat(el.max); if (v < mn) v = mn; if (v > mx) v = mx; }
  else if (k === "px" || k === "sx") { v = v.replace(/[\\\/:*?"<>|]/g, ""); }
  else if (el.type === "color") { if (!/^#[0-9a-f]{6}$/i.test(v)) return; }
  st.set[k] = v; persist(); sync(); queueTrace();
}
function bindSplit(stg) {
  var drag = false;
  function mv(e) { var b = $("#svBox"); if (!b) return; var r = b.getBoundingClientRect(); st.pos = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); var s = b.querySelector(".split"), cv = b.querySelectorAll(".cv"); if (s) s.style.left = st.pos + "%"; if (cv[1]) cv[1].style.clipPath = "inset(0 0 0 " + st.pos + "%)"; }
  stg.addEventListener("pointerdown", function (e) { if (st.view !== "split" || st.pick || !e.target.closest("#svBox")) return; drag = true; mv(e); try { stg.setPointerCapture(e.pointerId); } catch (x) {} });
  stg.addEventListener("pointermove", function (e) { if (drag) mv(e); });
  stg.addEventListener("pointerup", function () { drag = false; });
  stg.addEventListener("wheel", function (e) {
    var b = $("#svBox"), c = st.cur; if (!b || b.hidden || !c || !c.img) return;
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
function live() { return root && root.querySelector(".svg-g"); }
function onToggle(e) { var d = e.target; if (live() && d && d.dataset && d.dataset.sec) st.open[d.dataset.sec] = d.open ? 1 : 0; }
function onOver(e) { if (!live()) return; e.preventDefault(); var s = $("#svStage"); if (s) s.classList.add("over"); }
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var s = $("#svStage"); if (s) s.classList.remove("over"); } }
function onDrop(e) {
  if (!live()) return; e.preventDefault(); var s = $("#svStage"); if (s) s.classList.remove("over"); var A = window.api;
  var ps = Array.prototype.map.call(e.dataTransfer.files, function (f) { return A && A.pathForFile ? A.pathForFile(f) : f.path; }).filter(Boolean);
  if (ps.length) addPaths(ps);
}
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onInput);
  root.addEventListener("toggle", onToggle, true); root.addEventListener("dragenter", onOver); root.addEventListener("dragover", onOver);
  root.addEventListener("dragleave", onLeave); root.addEventListener("drop", onDrop);
  var stg = $("#svStage"); if (stg) bindSplit(stg);
  sync(); drawStage();
  if (st.cur && st.cur.img && !st.svg) queueTrace(0);
}
window.addEventListener("resize", function () { if (root && root.isConnected && st.zoom === "fit") drawStage(); });

window.SVGT = { vectorize: vectorize, html: html, mount: mount, prep: prep, finishSvg: finishSvg };
window.TOOLS = (window.TOOLS || []).concat([{ id: "svg", ico: '<path d="M4 18c3-9 6-9 8-4s5 3 8-8"/><circle cx="4" cy="18" r="1.8"/><circle cx="20" cy="6" r="1.8"/><circle cx="12" cy="14" r="1.8"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
