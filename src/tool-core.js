/* Инструмент «Core». Подключается после tool-ret.js; регистрирует window.TOOLS.
   Человек загружает core в формате XML (ParticleEffectsList), ищет партикл по имени в EffectRuleDictionary,
   правит его настройки и настройки под-партиклов (EventEmitters = Time Line Events), потом сохраняет.
   ПРЕДПРОСМОТРА НЕТ (решение автора, не добавлять).
   Правка идёт ПО ТЕКСТУ: XML не пересобирается из DOM, меняются только значения изменённых полей, остальной файл байт в байт как был. */
(function () {
"use strict";
var I = {
en: {
 mEff:"Effect rule", mPrt:"Particle rule", mEmt:"Emitter rule", phP:"ParticleRule name", phE:"EmitterRule name",
 rUse:"Used in {n} sub-particle(s)", rWarn:"This rule is shared by {n} sub-particles: changing it changes all of them.", rNone:"Nothing to edit in this rule.", rRst:"Reset this rule", rKfT:"Time", rKfN:"Keyframe", rKfH:"time · x y z w",
 sec_head:"General", sec_AllBehaviours:"Behaviours", sec_ShaderVars:"Shader variables", sec_KeyframeProps:"Keyframe properties", sec_CreationDomainObj:"Creation domain", sec_TargetDomainObj:"Target domain", sec_AttractorDomainObj:"Attractor domain", sec_EffectSpawnerAtRatio:"Effect spawner (at ratio)", sec_EffectSpawnerOnCollision:"Effect spawner (on collision)",
 name:"Core", desc:"Load your core in XML format and change its values", back:"Tools",
 sub:"Upload your core as an XML file, find a particle, set the values you need and save the result.",
 dropT:"Drop your core .xml here", dropS:"or click to choose a file", file:"File", reading:"Reading the file…",
 fName:"Name", fSize:"Size", fRoot:"Root element", fPart:"Particles", fOk:"Core is valid", fBad:"This is not a valid XML file", notCore:"This XML is not a core (no ParticleEffectsList / EffectRuleDictionary)", readFail:"Could not read this file", notXml:"Only .xml files are supported",
 replace:"Replace file", clear:"Remove",
 sS:"Particle search", loopOn:"Enable particle in game", loopOnH:"Sets the number of loops (NumLoops) to 0", pickS:"Type a name in the search and choose a match. Settings will appear here.", ph:"Particle name, e.g. bullet_tracer", find:"Find", sugN:"Matches", more:"…and more, keep typing",
 nf:"Particle “{n}” was not found: it is not in this file or it has been cut out.",
 pick:"Pick a particle from the list or type the exact name.",
 sP:"Particle", ver:"File version", sub0:"Sub-particles (Time Line Events)", noSub:"This particle has no sub-particles.", idx:"Index", er:"EmitterRule", pr:"ParticleRule",
 gT:"Time settings", gC:"Culling", gK:"Collisions and flags", gE:"Sub-particle settings",
 reset:"Reset this particle", chg:"Changed", chgP:"particles", chgV:"values", none:"No changes yet",
 go:"Save core", goHint:"Load a core first", goNone:"Change at least one value first", saved:"Saved", saveFail:"Could not save", b:"B", kb:"KB", mb:"MB",
 texT:"Texture", texN:"Texture(s) bound to this sub-particle (ShaderVars → TextureName). Type another name to bind a different texture; it is matched by name (the DDS name without .dds).", texNo:"This particle rule has no texture.", texNoR:"ParticleRule “{r}” was not found in this file.", texU:"ParticleRule “{r}” is shared by {n} sub-particles: changing the texture changes all of them.", texMiss:"No texture with this name in the texture dictionary of this core. Put its DDS into the texture folder next to the XML before importing, or the particle will be invisible.", texV:"Texture", texOrig:"was",
 loopsH:"4294967295 = endless", lodT:"Size by distance (LOD)", lodN:"Near size 0 = the shooter does not see this particle; far away (between the particle LOD min/max distances) the size grows to the far value. The button sets near size 0 and LOD distances 4 and 4: a sharp border at 4 m (closer = shooter, farther = enemies).", lodU:"Warning: emitter rule “{r}” is shared by {n} sub-particles, changing it affects all of them.", lodNo:"This sub-particle has no LOD size evolution, so this setting is unavailable.", hideS:"Hide from shooter", nearL:"Near size (what the shooter sees)", farL:"Far size", enemy:"enemies only", lodH:"Distances over which the LOD evolution goes from 0 to 1", colH:"R, G, B, A (0-255)", alphaS:"Opacity", rGT:"Color and opacity of all keyframes", rGC:"Color (all keyframes)", rGA:"Opacity, % of original"
},
ru: {
 mEff:"Effect rule", mPrt:"Particle rule", mEmt:"Emitter rule", phP:"Имя ParticleRule", phE:"Имя EmitterRule",
 rUse:"Используется в под-партиклах: {n}", rWarn:"Это правило общее для {n} под-партиклов: изменение затронет их все.", rNone:"В этом правиле нечего править.", rRst:"Сбросить это правило", rKfT:"Время", rKfN:"Кейфрейм", rKfH:"время · x y z w",
 sec_head:"Общее", sec_AllBehaviours:"Поведения", sec_ShaderVars:"Шейдерные переменные", sec_KeyframeProps:"Кейфреймы", sec_CreationDomainObj:"Зона создания", sec_TargetDomainObj:"Зона цели", sec_AttractorDomainObj:"Зона аттрактора", sec_EffectSpawnerAtRatio:"Спавнер эффекта (по ratio)", sec_EffectSpawnerOnCollision:"Спавнер эффекта (при столкновении)",
 name:"Core", desc:"Загрузи свой core в формате XML и измени его значения", back:"Инструменты",
 sub:"Загрузи свой core в виде XML-файла, найди партикл, задай нужные значения и сохрани результат.",
 dropT:"Перетащи сюда свой core (.xml)", dropS:"или нажми, чтобы выбрать файл", file:"Файл", reading:"Читаю файл…",
 fName:"Имя", fSize:"Размер", fRoot:"Корневой элемент", fPart:"Партиклов", fOk:"Core корректный", fBad:"Это не корректный XML-файл", notCore:"Этот XML не core (нет ParticleEffectsList / EffectRuleDictionary)", readFail:"Не удалось прочитать файл", notXml:"Поддерживаются только файлы .xml",
 replace:"Заменить файл", clear:"Убрать",
 sS:"Поиск партикла", loopOn:"Включить партикл в игре", loopOnH:"Ставит число повторов (NumLoops) в 0", pickS:"Введи имя в поиск и выбери совпадение. Настройки появятся здесь.", ph:"Имя партикла, например bullet_tracer", find:"Найти", sugN:"Совпадения", more:"…и другие, продолжай вводить",
 nf:"Партикл «{n}» не найден: его нет в этом файле или он вырезан.",
 pick:"Выбери партикл из списка или введи точное имя.",
 sP:"Партикл", ver:"Версия файла", sub0:"Под-партиклы (Time Line Events)", noSub:"У этого партикла нет под-партиклов.", idx:"Индекс", er:"EmitterRule", pr:"ParticleRule",
 gT:"Настройки времени", gC:"Отсечение (culling)", gK:"Столкновения и флаги", gE:"Настройки под-партикла",
 reset:"Сбросить этот партикл", chg:"Изменено", chgP:"партиклов", chgV:"значений", none:"Изменений пока нет",
 go:"Сохранить core", goHint:"Сначала загрузи core", goNone:"Сначала измени хотя бы одно значение", saved:"Сохранено", saveFail:"Не удалось сохранить", b:"Б", kb:"КБ", mb:"МБ",
 texT:"Текстура", texN:"Текстура(ы), к которой привязан этот под-партикл (ShaderVars → TextureName). Впиши другое имя, чтобы привязать другую текстуру; связь идёт по названию (имя DDS без .dds).", texNo:"У этого ParticleRule нет текстуры.", texNoR:"ParticleRule «{r}» не найден в этом файле.", texU:"ParticleRule «{r}» используют {n} под-партиклов: смена текстуры изменит их все.", texMiss:"Текстуры с таким именем нет в словаре текстур этого core. Положи её DDS в папку с текстурами рядом с XML перед импортом, иначе партикл будет невидимым.", texV:"Текстура", texOrig:"было",
 loopsH:"4294967295 = бесконечно", lodT:"Размер по дистанции (LOD)", lodN:"Размер вблизи 0 = стрелок не видит этот партикл; вдали (между LOD-дистанциями партикла, мин/макс) размер растёт до значения «вдали». Кнопка ставит размер вблизи 0 и LOD-дистанции 4 и 4: резкая граница на 4 м (ближе стрелок, дальше противники).", lodU:"Внимание: правило эмиттера «{r}» общее, оно используется в {n} под-партиклах, изменение затронет все.", lodNo:"У этого под-партикла нет LOD-эволюции размера, настройка недоступна.", hideS:"Скрыть от стрелка", nearL:"Размер вблизи (так видит стрелок)", farL:"Размер вдали", enemy:"только от противников", lodH:"Дистанции, между которыми LOD-эволюция растёт от 0 до 1", colH:"R, G, B, A (0-255)", alphaS:"Прозрачность", rGT:"Цвет и прозрачность всех кейфреймов", rGC:"Цвет (все кейфреймы)", rGA:"Непрозрачность, % от исходной"
},
uk: {
 mEff:"Effect rule", mPrt:"Particle rule", mEmt:"Emitter rule", phP:"Ім’я ParticleRule", phE:"Ім’я EmitterRule",
 rUse:"Використовується в під-партиклах: {n}", rWarn:"Це правило спільне для {n} під-партиклів: зміна торкнеться їх усіх.", rNone:"У цьому правилі нічого редагувати.", rRst:"Скинути це правило", rKfT:"Час", rKfN:"Кейфрейм", rKfH:"час · x y z w",
 sec_head:"Загальне", sec_AllBehaviours:"Поведінки", sec_ShaderVars:"Шейдерні змінні", sec_KeyframeProps:"Кейфрейми", sec_CreationDomainObj:"Зона створення", sec_TargetDomainObj:"Зона цілі", sec_AttractorDomainObj:"Зона атрактора", sec_EffectSpawnerAtRatio:"Спавнер ефекту (за ratio)", sec_EffectSpawnerOnCollision:"Спавнер ефекту (при зіткненні)",
 name:"Core", desc:"Завантаж свій core у форматі XML та змінюй його значення", back:"Інструменти",
 sub:"Завантаж свій core у вигляді XML-файлу, знайди партикл, задай потрібні значення й збережи результат.",
 dropT:"Перетягни сюди свій core (.xml)", dropS:"або натисни, щоб вибрати файл", file:"Файл", reading:"Читаю файл…",
 fName:"Ім’я", fSize:"Розмір", fRoot:"Кореневий елемент", fPart:"Партиклів", fOk:"Core коректний", fBad:"Це не коректний XML-файл", notCore:"Цей XML не core (немає ParticleEffectsList / EffectRuleDictionary)", readFail:"Не вдалося прочитати файл", notXml:"Підтримуються лише файли .xml",
 replace:"Замінити файл", clear:"Прибрати",
 sS:"Пошук партикла", loopOn:"Увімкнути партикл у грі", loopOnH:"Ставить кількість повторів (NumLoops) у 0", pickS:"Введи ім’я в пошук і обери збіг. Налаштування з’являться тут.", ph:"Ім’я партикла, наприклад bullet_tracer", find:"Знайти", sugN:"Збіги", more:"…і інші, продовжуй вводити",
 nf:"Партикл «{n}» не знайдено: його немає в цьому файлі або він вирізаний.",
 pick:"Обери партикл зі списку або введи точне ім’я.",
 sP:"Партикл", ver:"Версія файлу", sub0:"Під-партикли (Time Line Events)", noSub:"У цього партикла немає під-партиклів.", idx:"Індекс", er:"EmitterRule", pr:"ParticleRule",
 gT:"Налаштування часу", gC:"Відсікання (culling)", gK:"Зіткнення та прапорці", gE:"Налаштування під-партикла",
 reset:"Скинути цей партикл", chg:"Змінено", chgP:"партиклів", chgV:"значень", none:"Змін поки немає",
 go:"Зберегти core", goHint:"Спочатку завантаж core", goNone:"Спочатку зміни хоча б одне значення", saved:"Збережено", saveFail:"Не вдалося зберегти", b:"Б", kb:"КБ", mb:"МБ",
 texT:"Текстура", texN:"Текстура(и), до якої прив’язаний цей під-партикл (ShaderVars → TextureName). Впиши інше ім’я, щоб прив’язати іншу текстуру; зв’язок іде за назвою (ім’я DDS без .dds).", texNo:"У цього ParticleRule немає текстури.", texNoR:"ParticleRule «{r}» не знайдено в цьому файлі.", texU:"ParticleRule «{r}» використовують {n} під-партиклів: зміна текстури змінить їх усі.", texMiss:"Текстури з такою назвою немає в словнику текстур цього core. Поклади її DDS у теку з текстурами поруч з XML перед імпортом, інакше партикл буде невидимим.", texV:"Текстура", texOrig:"було",
 loopsH:"4294967295 = нескінченно", lodT:"Розмір за дистанцією (LOD)", lodN:"Розмір зблизька 0 = стрілець не бачить цей партикл; здалеку (між LOD-дистанціями партикла, мін/макс) розмір зростає до значення «здалеку». Кнопка ставить розмір зблизька 0 і LOD-дистанції 4 та 4: різка межа на 4 м (ближче стрілець, далі противники).", lodU:"Увага: правило емітера «{r}» спільне, воно використовується в {n} під-партиклах, зміна торкнеться всіх.", lodNo:"У цього під-партикла немає LOD-еволюції розміру, налаштування недоступне.", hideS:"Сховати від стрільця", nearL:"Розмір зблизька (так бачить стрілець)", farL:"Розмір здалеку", enemy:"тільки від противників", lodH:"Дистанції, між якими LOD-еволюція зростає від 0 до 1", colH:"R, G, B, A (0-255)", alphaS:"Прозорість", rGT:"Колір і прозорість усіх кейфреймів", rGC:"Колір (усі кейфрейми)", rGA:"Непрозорість, % від початкової"
}
};

/* ---------- текстуры партикла: ParticleRuleDictionary -> ParticleRule -> ShaderVars -> TextureName ---------- */
var TOKA = /<Item(?:\s[^>]*)?\/>|<Item(?:\s[^>]*)?>|<\/Item>/g;
/* верхние Item с учётом атрибутов (<Item type="...">) и <Item /> */
function topItemsA(text, a, b) {
  var re = new RegExp(TOKA.source, "g"), out = [], depth = 0, st0 = 0, m; re.lastIndex = a;
  while ((m = re.exec(text)) && m.index < b) {
    var t = m[0];
    if (t === "</Item>") { depth--; if (depth === 0) out.push([st0, m.index + t.length]); if (depth < 0) break; }
    else if (/\/>$/.test(t)) { if (!depth) out.push([m.index, m.index + t.length]); }
    else { if (!depth) st0 = m.index; depth++; }
  }
  return out;
}
function unx(x) { return String(x).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&amp;/g, "&"); }
function enx(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
/* {имя ParticleRule: {s,e}} */
function pindex(text) {
  var a = text.indexOf("<ParticleRuleDictionary>"), b = text.indexOf("</ParticleRuleDictionary>"), o = {};
  if (a < 0 || b < a) return o;
  topItemsA(text, a, b).forEach(function (p) { var n = tagText(text.substr(p[0], 400), "Name"); if (n && !(n in o)) o[n] = { s: p[0], e: p[1] }; });
  return o;
}
/* текстуры внутри текста ParticleRule: [{s,e,v: имя шейдер-переменной, t: имя текстуры}] */
function texVars(seg) {
  var out = [], re = /<TextureName(?:>([^<]*)<\/TextureName>|\s*\/>)/g, m;
  while ((m = re.exec(seg))) {
    var pre = seg.slice(Math.max(0, m.index - 600), m.index), nm = /<Name>([^<]*)<\/Name>(?![\s\S]*<Name>)/.exec(pre);
    out.push({ s: m.index, e: m.index + m[0].length, v: nm ? unx(nm[1]) : "", t: unx(m[1] || "") });
  }
  return out;
}
function patchTex(seg, map) {
  var v = texVars(seg), i;
  for (i = v.length - 1; i >= 0; i--) if (i in map) seg = seg.slice(0, v[i].s) + "<TextureName>" + enx(map[i]) + "</TextureName>" + seg.slice(v[i].e);
  return seg;
}
/* имена текстур словаря core (FileName без .dds): {list:[...], set:{lower:1}} или null */
function texSet(text) {
  var a = text.indexOf("<TextureDictionary>"), b = a < 0 ? -1 : text.indexOf("</TextureDictionary>", a);
  if (a < 0 || b < 0) return null;
  var re = /<FileName>([^<]*)<\/FileName>/g, m, list = [], set = {}; re.lastIndex = a;
  while ((m = re.exec(text)) && m.index < b) { var n = unx(m[1]).replace(/\.dds$/i, ""); if (n && !set[n.toLowerCase()]) { set[n.toLowerCase()] = 1; list.push(n); } }
  return list.length ? { list: list, set: set } : null;
}

/* ---------- описание полей: тег, тип, русское и украинское имя (английское = тег с пробелами) ---------- */
var FT = [ /* [группа, тег, тип, ru, uk] */
 ["T","NumLoops","int","Число повторов","Кількість повторів"],["T","SortEventsByDistance","bool","Сортировать события по дистанции","Сортувати події за дистанцією"],
 ["T","DrawListID","int","ID списка отрисовки","ID списку малювання"],["T","IsShortLived","bool","Короткоживущий","Короткоживучий"],["T","HasNoShadows","bool","Без теней","Без тіней"],
 ["T","VRandomOffsetPos","vec","Случайное смещение позиции","Випадкове зміщення позиції"],["T","PreUpdateTime","num","Время пред-обновления","Час пре-оновлення"],["T","PreUpdateTimeInterval","num","Интервал пред-обновления","Інтервал пре-оновлення"],
 ["T","DurationMin","num","Длительность, мин","Тривалість, мін"],["T","DurationMax","num","Длительность, макс","Тривалість, макс"],
 ["T","PlaybackRateScalarMin","num","Скорость воспроизведения, мин","Швидкість відтворення, мін"],["T","PlaybackRateScalarMax","num","Скорость воспроизведения, макс","Швидкість відтворення, макс"],
 ["C","ViewportCullingMode","int","Режим отсечения по экрану","Режим відсікання за екраном"],["C","RenderWhenViewportCulled","bool","Рисовать при отсечении по экрану","Малювати при відсіканні за екраном"],
 ["C","UpdateWhenViewportCulled","bool","Обновлять при отсечении по экрану","Оновлювати при відсіканні за екраном"],["C","EmitWhenViewportCulled","bool","Излучать при отсечении по экрану","Випромінювати при відсіканні за екраном"],
 ["C","DistanceCullingMode","int","Режим отсечения по дистанции","Режим відсікання за дистанцією"],["C","RenderWhenDistanceCulled","bool","Рисовать при отсечении по дистанции","Малювати при відсіканні за дистанцією"],
 ["C","UpdateWhenDistanceCulled","bool","Обновлять при отсечении по дистанции","Оновлювати при відсіканні за дистанцією"],["C","EmitWhenDistanceCulled","bool","Излучать при отсечении по дистанции","Випромінювати при відсіканні за дистанцією"],
 ["C","ViewportCullingSphereOffset","vec","Смещение сферы отсечения","Зміщення сфери відсікання"],["C","ViewportCullingSphereRadius","num","Радиус сферы отсечения","Радіус сфери відсікання"],
 ["C","DistanceCullingFadeDist","num","Дистанция затухания","Дистанція згасання"],["C","DistanceCullingCullDist","num","Дистанция отсечения","Дистанція відсікання"],
 ["C","LodEvoDistanceMin","num","LOD-эволюция, дистанция мин","LOD-еволюція, дистанція мін"],["C","LodEvoDistanceMax","num","LOD-эволюция, дистанция макс","LOD-еволюція, дистанція макс"],
 ["K","CollisionRange","num","Дальность коллизий","Дальність колізій"],["K","CollisionProbeDistance","num","Дистанция зонда коллизий","Дистанція зонда колізій"],["K","CollisionType","int","Тип коллизий","Тип колізій"],
 ["K","ShareEntityCollisions","bool","Общие коллизии объектов","Спільні колізії об’єктів"],["K","OnlyUseBVHCollisions","bool","Только BVH-коллизии","Лише BVH-колізії"],["K","GameFlags","int","GameFlags","GameFlags"],
 ["K","ColourTintMaxEnable","bool","Включить макс. цвет-оттенок","Увімкнути макс. колір-відтінок"],["K","UseDataVolume","bool","Использовать Data Volume","Використовувати Data Volume"],["K","DataVolumeType","int","Тип Data Volume","Тип Data Volume"],["K","ZoomLevel","num","Уровень зума","Рівень зуму"],
 ["E","StartRatio","num","Начало (Start Ratio)","Початок (Start Ratio)"],["E","EndRatio","num","Конец (End Ratio)","Кінець (End Ratio)"],
 ["E","PlaybackRateScalarMin","num","Скорость воспроизведения, мин","Швидкість відтворення, мін"],["E","PlaybackRateScalarMax","num","Скорость воспроизведения, макс","Швидкість відтворення, макс"],
 ["E","ZoomScalarMin","num","Множитель зума, мин","Множник зуму, мін"],["E","ZoomScalarMax","num","Множитель зума, макс","Множник зуму, макс"],
 ["E","ColourTintMin","col","Цвет-оттенок, мин","Колір-відтінок, мін"],["E","ColourTintMax","col","Цвет-оттенок, макс","Колір-відтінок, макс"]
];
var GR = { T: [], C: [], K: [], E: [] }, FD = { E: {}, F: {} };
FD.E.near = { tag: "near", t: "num" }; FD.E.lodFar = { tag: "lodFar", t: "num" };
FT.forEach(function (f) { var o = { g: f[0], tag: f[1], t: f[2], ru: f[3], uk: f[4], en: f[1].replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^V Random/, "vRandom") }; GR[f[0]].push(o); (f[0] === "E" ? FD.E : FD.F)[f[1]] = o; });

/* ---------- чистая логика: индекс, чтение, правка текста (без DOM, проверяется в Node) ---------- */
var TOK = /<Item>[^<]*<\/Item>|<Item>|<\/Item>/g;
/* верхние Item внутри text[a..b): [[s,e],...] */
function topItems(text, a, b) {
  var re = new RegExp(TOK.source, "g"), out = [], depth = 0, st = 0, m; re.lastIndex = a;
  while ((m = re.exec(text)) && m.index < b) {
    var t = m[0];
    if (t === "<Item>") { if (!depth) st = m.index; depth++; }
    else if (t === "</Item>") { depth--; if (depth === 0) out.push([st, m.index + t.length]); if (depth < 0) break; }
  }
  return out;
}
function tagText(s, tag) { var m = new RegExp("<" + tag + ">([^<]*)</" + tag + ">").exec(s); return m ? m[1] : ""; }
/* индекс партиклов EffectRuleDictionary: [{name,s,e}] или null */
function index(text) {
  var a = text.indexOf("<EffectRuleDictionary>"), b = text.indexOf("</EffectRuleDictionary>");
  if (a < 0 || b < 0 || b < a) return null;
  return topItems(text, a, b).map(function (p) { return { name: tagText(text.substr(p[0], 400), "Name"), s: p[0], e: p[1] }; });
}
function rdTag(h, tag, vec) {
  if (vec) { var m = new RegExp("<" + tag + " x=\"([^\"]*)\" y=\"([^\"]*)\" z=\"([^\"]*)\"").exec(h); return m ? [m[1], m[2], m[3]] : null; }
  var v = new RegExp("<" + tag + " value=\"([^\"]*)\"").exec(h); return v ? v[1] : null;
}
function readFields(h, grp) {
  var o = {}; Object.keys(grp).forEach(function (k) { var v = rdTag(h, k, grp[k].t === "vec"); if (v !== null) o[k] = v; }); return o;
}
function splitEff(seg) { /* голова партикла, блок EventEmitters, его границы */
  var a = seg.indexOf("<EventEmitters>"), b = a < 0 ? -1 : seg.indexOf("</EventEmitters>", a);
  return { a: a, b: b };
}
function emHeadEnd(s) { var i = s.indexOf("<EvolutionList>"); return i < 0 ? s.length : i; }
/* модель партикла: {name, ver, v:{tag:raw}, em:[{er,pr,v:{tag:raw}}]} */
function model(text, e) {
  var seg = text.slice(e.s, e.e), sp = splitEff(seg), head = sp.a < 0 ? seg : seg.slice(0, sp.a);
  var m = { name: e.name, ver: rdTag(head, "FileVersion"), v: readFields(head, FD.F), em: [] };
  if (sp.a >= 0 && sp.b > sp.a) {
    var blk = seg.slice(sp.a, sp.b);
    topItems(blk, 0, blk.length).forEach(function (p) {
      var it = blk.slice(p[0], p[1]), hd = it.slice(0, emHeadEnd(it));
      var ev = readFields(hd, FD.E), fr = readFar(it.slice(hd.length)); if (fr !== null) ev.lodFar = fr;
      m.em.push({ er: tagText(hd, "EmitterRule"), pr: tagText(hd, "ParticleRule"), v: ev });
    });
  }
  return m;
}
function eindex(text) {
  var a = text.indexOf("<EmitterRuleDictionary>"), b = text.indexOf("</EmitterRuleDictionary>"), o = {};
  if (a < 0 || b < a) return o;
  topItems(text, a, b).forEach(function (p) { var n = tagText(text.substr(p[0], 400), "Name"); if (n && !(n in o)) o[n] = { s: p[0], e: p[1] }; });
  return o;
}
/* ---------- ParticleRule / EmitterRule: универсальный разбор полей (значения и кейфреймы), правка по смещениям ---------- */
var RTK = /<!--[\s\S]*?-->|<(\/?)([A-Za-z_][\w.\-]*)((?:\s+[\w:.\-]+="[^"]*")*)\s*(\/?)>/g;
var RBOOL = /^(Is|Has|Enable|Disable|Use|Tracks|Inherits|Share|Only|Render|Update|Emit|DepthWrite|DepthTest|AlphaBlend|InvertBias|DoFrameBlending|AccumulateAngle|RotateAngleAxes|RotateInitAngleAxes|RGBAMaxEnable|RGBAProportional|RGBCanTint|NearClip$|FarClip$|UVClip|IgnoreMtxWeight|KeepConstantSpeed|FlipU$|FlipV$|ProportionalSize|CoronaUseLightColour|CoronaNotInReflection|CoronaOnlyInReflection|ColourFromParticle|ColourPerFrame|IntensityPerFrame|RangePerFrame|CastsShadows|WrapTextureOverParticleLife|ColourTintFromParticle|SortWithParticles)/;
/* целыми считаем только перечисления; остальное с «0/1/5» в XML может быть дробным (VectorX, ZoomScalar...), его не округляем */
var RINT = /(Mode|Type|Flags|FlagsMin|FlagsMax|BlendSet|FrameID|TexFrameIDMin|TexFrameIDMax|TechniqueID|ID|ReferenceSpace|KillChance|CollisionChance|LodRange)$/;
var RSKP = { RefCount: 1, RandomIndex: 1, ShaderVarID: 1, FileVersion: 1, ExternalReference: 1, DomainType: 1 };
var RNUM = /^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
/* правила словаря: [{name,s,e}] (dict = ParticleRuleDictionary | EmitterRuleDictionary) */
function rindex(text, dict) {
  var a = text.indexOf("<" + dict + ">"), b = text.indexOf("</" + dict + ">");
  if (a < 0 || b < a) return [];
  return topItemsA(text, a, b).map(function (p) { return { name: tagText(text.substr(p[0], 400), "Name"), s: p[0], e: p[1] }; });
}
/* поля правила в порядке документа: [{tag,s,e,a:[значения атрибутов],t:int|hex|num|bool|vec,sec,sub,kfp,kfi}]; EvolutionList не трогаем */
function rleaves(seg) {
  var re = new RegExp(RTK.source, "g"), st = [], out = [], m, skip = -1;
  while ((m = re.exec(seg))) {
    if (m[2] === undefined) continue;
    var cl = m[1], tag = m[2], at = m[3], sl = m[4], par = st[st.length - 1];
    if (cl) { st.pop(); if (skip >= 0 && st.length <= skip) skip = -1; continue; }
    if (!sl) {
      var nd = { tag: tag, name: "", type: "", n: 0, idx: par ? par.n++ : 0 };
      st.push(nd); if ((tag === "EvolutionList" || tag === "Drawables") && skip < 0) skip = st.length - 1;
      if (tag === "Name" && !at && par && !par.name && skip < 0) { var e2 = seg.indexOf("<", re.lastIndex); if (e2 > 0) par.name = unx(seg.slice(re.lastIndex, e2)); }
      continue;
    }
    if (par) par.n++;
    if (skip >= 0) continue;
    if (tag === "Type" && par) { var tv = /value="([^"]*)"/.exec(at); if (tv && !par.type) par.type = unx(tv[1]); continue; }
    if (RSKP[tag]) continue;
    var an = [], av = [], ar = /\s([a-z]+)="([^"]*)"/g, x, t;
    while ((x = ar.exec(at))) { an.push(x[1]); av.push(x[2]); }
    if (!an.length) continue;
    if (an.length === 1 && an[0] === "value") {
      var rw = av[0];
      if (/^0x[0-9a-fA-F]+$/.test(rw)) t = "hex";
      else if (/^-?\d+$/.test(rw)) t = (rw === "0" || rw === "1") && RBOOL.test(tag) ? "bool" : RINT.test(tag) ? "int" : "num";
      else if (RNUM.test(rw)) t = "num"; else continue;
    } else if (an[0] === "x" && (an.length === 3 || an.length === 4) && av.every(function (v) { return RNUM.test(v); })) t = "vec";
    else continue;
    out.push({ tag: tag, s: m.index, e: m.index + m[0].length, a: av, t: t, p: st.slice() });
  }
  out.forEach(function (l) {
    var p = l.p, n = p.length, it = p[2] && p[2].tag === "Item" ? p[2] : null, pr = p[n - 1];
    l.sec = p[1] ? p[1].tag : "head"; l.sub = ""; l.kfp = ""; l.kfi = 0;
    if (it && (l.sec === "AllBehaviours" || l.sec === "ShaderVars")) l.sub = (l.sec === "ShaderVars" ? it.name || it.type : it.type || it.name) || "#" + it.idx;
    if (l.tag === "KeyframeTime" || l.tag === "KeyframeValue") { var kn = p[n - 3]; l.kfp = kn ? kn.name : ""; l.kfi = pr ? pr.idx : 0; }
    else if (pr && (/KFP$/.test(pr.tag) || (l.sec === "KeyframeProps" && pr.tag === "Item"))) l.kfp = pr.name;
    delete l.p;
  });
  return out;
}
/* map: {индекс поля: [значения атрибутов]} -> новый текст правила (остальное байт в байт) */
function patchLeaves(seg, map) {
  var lv = rleaves(seg), ks = Object.keys(map).map(Number).sort(function (a, b) { return b - a; });
  ks.forEach(function (k) {
    var l = lv[k]; if (!l) return; var i = 0;
    var t = seg.slice(l.s, l.e).replace(/(\s(?:value|x|y|z|w)=")[^"]*"/g, function (mm, p) { var v = map[k][i++]; return v == null ? mm : p + v + "\""; });
    seg = seg.slice(0, l.s) + t + seg.slice(l.e);
  });
  return seg;
}
var SZ = "<Name>ptxEmitterRule:m_sizeScalarKFP</Name>";
var KV = /(<KeyframeValue )x="[^"]*" y="[^"]*" z="[^"]*"/g;
function kvSet(txt, v, all) { var done = 0; return txt.replace(KV, function (m, p) { if (!all && done++) return m; return p + "x=\"" + v + "\" y=\"" + v + "\" z=\"" + v + "\""; }); }
/* база (вблизи): m_sizeScalarKFP в правиле эмиттера; пусто = 1 */
function nearSpan(it) {
  var k = it.indexOf(SZ); if (k < 0) return null; var a = it.indexOf("<Keyframes", k); if (a < 0) return null;
  if (it.substr(a, 13) === "<Keyframes />") return { a: a, e: a + 13, empty: true };
  var e = it.indexOf("</Keyframes>", a); return e < 0 ? null : { a: a, e: e + 12, empty: false };
}
function readNear(it) { var sp = nearSpan(it); if (!sp) return null; if (sp.empty) return "1"; var m = /<KeyframeValue x="([^"]*)"/.exec(it.slice(sp.a, sp.e)); return m ? m[1] : null; }
function patchNear(it, v) {
  var sp = nearSpan(it); if (!sp) return it;
  var blk = it.slice(sp.a, sp.e);
  if (blk.indexOf("<KeyframeValue ") >= 0) blk = kvSet(blk, v, true);
  else {
    var eol = it.indexOf("\r\n") >= 0 ? "\r\n" : "\n", ls = it.lastIndexOf("\n", sp.a) + 1, ind = /^\s*/.exec(it.slice(ls, sp.a))[0];
    blk = "<Keyframes>" + eol + ind + " <Item>" + eol + ind + "  <KeyframeTime x=\"0\" y=\"0\" z=\"0\" w=\"0\" />" + eol + ind + "  <KeyframeValue x=\"" + v + "\" y=\"" + v + "\" z=\"" + v + "\" w=\"0\" />" + eol + ind + " </Item>" + eol + ind + "</Keyframes>";
  }
  return it.slice(0, sp.a) + blk + it.slice(sp.e);
}
/* вдали: LOD-эволюция m_sizeScalarKFP в EvolutionList под-партикла */
function farSpan(t) {
  var k = t.indexOf(SZ); if (k < 0) return null; var n = t.indexOf("<Name>", k + 10), end = n < 0 ? t.length : n;
  var l = t.indexOf("<IsLodEvolution value=\"1\"", k); return l < 0 || l > end ? null : { l: l, end: end };
}
function readFar(t) { var sp = farSpan(t); if (!sp) return null; var m = /<KeyframeValue x="([^"]*)"/.exec(t.slice(sp.l, sp.end)); return m ? m[1] : null; }
function patchFar(t, v) { var sp = farSpan(t); return sp ? t.slice(0, sp.l) + kvSet(t.slice(sp.l, sp.end), v, false) + t.slice(sp.end) : t; }
function patchTag(h, tag, v) {
  if (Array.isArray(v)) return h.replace(new RegExp("(<" + tag + " )x=\"[^\"]*\" y=\"[^\"]*\" z=\"[^\"]*\""), function (m, p) { return p + "x=\"" + v[0] + "\" y=\"" + v[1] + "\" z=\"" + v[2] + "\""; });
  return h.replace(new RegExp("(<" + tag + " value=\")[^\"]*\""), function (m, p) { return p + v + "\""; });
}
function patchSeg(seg, mods) {
  var sp = splitEff(seg), head = sp.a < 0 ? seg : seg.slice(0, sp.a), blk = sp.a < 0 ? "" : seg.slice(sp.a, sp.b), tail = sp.a < 0 ? "" : seg.slice(sp.b);
  var em = {};
  Object.keys(mods).forEach(function (k) {
    if (/^t\d+\.\d+$/.test(k)) return;
    var m = /^e(\d+)\.(\w+)$/.exec(k);
    if (m) (em[m[1]] = em[m[1]] || {})[m[2]] = mods[k]; else head = patchTag(head, k, mods[k]);
  });
  if (blk && Object.keys(em).length) {
    var its = topItems(blk, 0, blk.length), out = "", prev = 0;
    its.forEach(function (p, i) {
      var it = blk.slice(p[0], p[1]), c = em[i];
      if (c) { var he = emHeadEnd(it), hd = it.slice(0, he), tl = it.slice(he); Object.keys(c).forEach(function (t) { if (t === "near") return; if (t === "lodFar") tl = patchFar(tl, c[t]); else hd = patchTag(hd, t, c[t]); }); it = hd + tl; }
      out += blk.slice(prev, p[0]) + it; prev = p[1];
    });
    blk = out + blk.slice(prev);
  }
  return head + blk + tail;
}
/* mods: {индекс партикла: {ключ: значение}} -> новый текст файла. eix = eindex(text): нужен для правки размера «вблизи» в EmitterRuleDictionary.
   rm = {prt:{индекс:{поле:[атрибуты]}}, emt:{...}}, rix = {prt:[...], emt:[...]} (rindex): правка полей ParticleRule/EmitterRule. Патчи одного правила складываются (сначала поля, потом размер/текстура) */
function build(text, ix, mods, eix, pix, rm, rix) {
  var PM = {}, en = {}, tx = {};
  function pr(r, fn) { if (!PM[r.s]) PM[r.s] = [r.s, r.e, text.slice(r.s, r.e)]; PM[r.s][2] = fn(PM[r.s][2]); }
  ["prt", "emt"].forEach(function (md) {
    var arr = rix && rix[md], o = rm && rm[md] || {};
    Object.keys(o).forEach(function (i) { var r = arr && arr[+i], c = o[i]; if (r && Object.keys(c).length) pr(r, function (t) { return patchLeaves(t, c); }); });
  });
  Object.keys(mods).forEach(function (k) {
    var o = mods[k], e = ix[+k]; if (!e || !Object.keys(o).length) return;
    pr(e, function (t) { return patchSeg(t, o); });
    var tk = Object.keys(o).filter(function (x) { return /^t\d+\.\d+$/.test(x); });
    if (tk.length) { var mt = model(text, e); tk.forEach(function (x) { var q2 = /^t(\d+)\.(\d+)$/.exec(x), rn = mt.em[+q2[1]] && mt.em[+q2[1]].pr; if (rn) (tx[rn] = tx[rn] || {})[+q2[2]] = o[x]; }); }
    var nk = Object.keys(o).filter(function (x) { return /^e\d+\.near$/.test(x); });
    if (nk.length) { var m = model(text, e); nk.forEach(function (x) { var n = +/^e(\d+)/.exec(x)[1]; if (m.em[n] && m.em[n].er) en[m.em[n].er] = o[x]; }); }
  });
  Object.keys(en).forEach(function (n) { var r = eix && eix[n]; if (r) pr(r, function (t) { return patchNear(t, en[n]); }); });
  Object.keys(tx).forEach(function (n) { var r = pix && pix[n]; if (r) pr(r, function (t) { return patchTex(t, tx[n]); }); });
  var P = Object.keys(PM).map(function (k) { return PM[k]; }).sort(function (a, b) { return a[0] - b[0]; });
  var parts = [], prev = 0; P.forEach(function (p) { parts.push(text.slice(prev, p[0]), p[2]); prev = p[1]; });
  parts.push(text.slice(prev)); return parts.join("");
}
/* значения */
function numOf(raw) { return /^0x/i.test(raw) ? parseInt(raw, 16) : parseFloat(raw); }
function numStr(v) { return String(parseFloat(Number(v).toPrecision(9))); }
function colOf(raw) { var n = numOf(raw) >>> 0; return { a: (n >>> 24) & 255, r: (n >>> 16) & 255, g: (n >>> 8) & 255, b: n & 255 }; }
function colStr(c) { return "0x" + (((c.a << 24) | (c.r << 16) | (c.g << 8) | c.b) >>> 0).toString(16).toUpperCase().padStart(8, "0"); }
function hex2(n) { return (n < 16 ? "0" : "") + n.toString(16); }

/* ---------- состояние (живёт, пока открыто приложение) ---------- */
var lang = "en", root = null;
function blank() { return { name: "", size: 0, text: "", ok: false, rootName: "", err: "", ix: null, eix: null, users: null, pix: null, pusers: null, tex: null, rix: null }; }
var st = blank(), cur = null /* {i, m} */, mods = {}, q = "", msg = "", busy = "", saveMsg = null, mode = "eff" /* eff|prt|emt */, rcur = null /* {i,name,lv}: открытое правило текущего режима */, rcurs = {}, rmods = { prt: {}, emt: {} };

function L(k) { return (I[lang] && I[lang][k]) || I.en[k] || k; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function $(s) { return root ? root.querySelector(s) : null; }
function live() { return root && root.querySelector(".core-w"); }
function ico(n) { return n === "back" ? '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' : ""; }
function fmt(n) { return n < 1024 ? n + " " + L("b") : n < 1048576 ? (n / 1024).toFixed(1) + " " + L("kb") : (n / 1048576).toFixed(2) + " " + L("mb"); }
function lab(f) { if (f.tag === "near" || f.tag === "lodFar") return L(f.tag === "near" ? "nearL" : "farL"); return lang === "ru" ? f.ru : lang === "uk" ? f.uk : f.en; }

function html(lg) {
  lang = lg || lang;
  return '<div class="core-w nofile" id="coreW">'
   + '<div class="core-top"><button class="back" data-tool="">' + ico("back") + L("back") + '</button><div class="core-tt"><h1>' + L("name") + '</h1><p class="sub">' + L("sub") + '</p></div>'
   + '<div class="core-sv"><p class="dsum" id="coreSum"></p><button class="go ddgo" id="coreGo" disabled>' + L("go") + '</button></div></div>'
   + '<aside class="core-side card"><div class="ddfh"><h3>' + L("file") + '</h3><span id="coreBtns"></span></div><div id="coreBody"></div>'
   + '<input type="file" id="corePick" accept=".xml,text/xml,application/xml" hidden>'
   + '<div id="coreSearch" class="core-sbox"></div>' + (window.CWHINT ? window.CWHINT(lang, "xml") : "") + '</aside>'
   + '<section class="core-main" id="coreRes"></section>'
   + '</div>';
}

/* ---------- отрисовка ---------- */
function getRaw(key) {
  var o = mods[cur.i]; if (o && key in o) return o[key];
  if (/^t\d+\.\d+$/.test(key)) return texOf(key);
  var m = /^e(\d+)\.(\w+)$/.exec(key); return m ? cur.m.em[+m[1]].v[m[2]] : cur.m.v[key];
}
function texOf(key) { var q2 = /^t(\d+)\.(\d+)$/.exec(key), e = q2 && cur.m.em[+q2[1]], v = e && e.tex && e.tex[+q2[2]]; return v ? v.t : null; }
function origRaw(key) { if (/^t\d+\.\d+$/.test(key)) return texOf(key); var m = /^e(\d+)\.(\w+)$/.exec(key); return m ? cur.m.em[+m[1]].v[m[2]] : cur.m.v[key]; }
function ctl(key, f) {
  var raw = getRaw(key), k = ' data-k="' + key + '"', i;
  if (f.t === "bool") return '<button class="chk" role="checkbox"' + k + ' aria-checked="' + (raw === "1" || raw === "true") + '"></button>';
  if (f.t === "vec") { var a = raw, s = ""; for (i = 0; i < 3; i++) s += '<input class="inp s" type="number" step="any"' + k + ' data-i="' + i + '" value="' + esc(a[i]) + '">'; return '<span class="core-r">' + s + '</span>'; }
  if (f.t === "col") {
    var c = colOf(raw);
    return '<span class="core-r" title="' + L("colH") + '">' + ["r", "g", "b", "a"].map(function (ch) { return '<input class="inp s" type="number" min="0" max="255" step="1"' + k + ' data-c="' + ch + '" value="' + c[ch] + '">'; }).join("")
      + '<input type="color" class="core-c"' + k + ' data-cp="1" value="#' + hex2(c.r) + hex2(c.g) + hex2(c.b) + '">'
      + '<span class="core-as" title="' + esc(L("alphaS")) + '"><input type="range" min="0" max="100" step="1"' + k + ' data-ca="1" value="' + Math.round(c.a / 2.55) + '"><b class="core-ap">' + Math.round(c.a / 2.55) + '%</b></span></span>';
  }
  return '<input class="inp" type="number" step="' + (f.t === "int" ? 1 : "any") + '"' + k + ' value="' + esc(numStr(numOf(raw))) + '">';
}
function rowH(key, f) {
  if (getRaw(key) == null) return "";
  var ch = mods[cur.i] && key in mods[cur.i], lod = /LodEvoDistance|lodFar$/.test(key), lodD = /LodEvoDistance/.test(key);
  return '<div class="row' + (f.t === "vec" || f.t === "col" ? ' core-wide' : '') + (ch ? ' core-mod' : '') + '" data-row="' + key + '"><span class="l">' + esc(lab(f)) + (lod ? ' <span class="core-tag">(' + L("enemy") + ')</span>' : '') + (key === "NumLoops" ? '<small>' + L("loopsH") + '</small>' : lodD ? '<small>' + L("lodH") + '</small>' : '') + '</span>' + ctl(key, f) + '</div>' + (key === "NumLoops" ? loopRow() : "");
}
function loopRow() {
  return '<div class="row core-loop" data-row="NumLoopsOn"><span class="l">' + L("loopOn") + '<small>' + L("loopOnH") + '</small></span><button class="chk" role="checkbox" data-loop="1" aria-checked="' + (numOf(getRaw("NumLoops")) === 0) + '"></button></div>';
}
function loopSync() {
  var sw = root && root.querySelector(".chk[data-loop]"); if (!sw || !cur) return;
  sw.setAttribute("aria-checked", numOf(getRaw("NumLoops")) === 0 ? "true" : "false");
  var hi = root.querySelector('input[data-k="NumLoops"]'); if (hi && document.activeElement !== hi) hi.value = numStr(numOf(getRaw("NumLoops")));
}
function secH(title, rows, open) { return '<details class="dsec"' + (open ? " open" : "") + '><summary><span>' + title + '<em class="core-cnt" hidden></em></span></summary><div class="core-grid">' + rows + '</div></details>'; }
function pills() {
  if (!root) return;
  root.querySelectorAll("#coreRes details").forEach(function (d) {
    var c = d.querySelectorAll(".core-mod").length, p = d.querySelector("summary .core-cnt");
    if (p) { p.hidden = !c; p.textContent = c; }
  });
}
function drawRes() {
  var box = $("#coreRes"); if (!box) return;
  if (mode !== "eff") { drawRule(); return; }
  if (!cur) { box.innerHTML = msg ? '<div class="card"><p class="note" style="margin:0">' + esc(msg) + '</p></div>' : (st.ok ? '<div class="core-ph"><b>' + L("pick") + '</b><span>' + L("pickS") + '</span></div>' : ""); return; }
  var m = cur.m, nm = Object.keys(mods[cur.i] || {}).length;
  var h = '<div class="card core-hd"><div class="core-t"><div><h2>' + esc(m.name) + '</h2><div class="core-meta">'
    + (m.ver ? '<span>' + L("ver") + ' <b>' + esc(m.ver) + '</b></span>' : '') + '<span>' + L("sub0") + ': <b>' + m.em.length + '</b></span></div></div><button class="mini" id="coreRst">' + L("reset") + '</button></div></div>'
    + '<div class="card dds">';
  [["T", "gT", 1], ["C", "gC", 0], ["K", "gK", 0]].forEach(function (g) { h += secH(L(g[1]), GR[g[0]].map(function (f) { return rowH(f.tag, f); }).join(""), g[2]); });
  h += '</div><div class="card dds"><h3 class="core-h3">' + L("sub0") + '<em>' + m.em.length + '</em></h3>';
  if (!m.em.length) h += '<p class="note">' + L("noSub") + '</p>';
  m.em.forEach(function (e, n) {
    var rows0 = GR.E.map(function (f) { return rowH("e" + n + "." + f.tag, f); }).join("");
    h += '<details class="dsec core-em"' + (m.em.length === 1 ? " open" : "") + '><summary><span class="core-ix">' + n + '</span><span class="core-en">' + esc(e.er || "—")
      + '<small>' + (e.pr && e.pr !== e.er ? L("er") + ' / ' + L("pr") + ': ' + esc(e.pr) : L("er") + ' = ' + L("pr")) + '</small></span><em class="core-cnt" hidden></em></summary><div class="core-grid">' + rows0 + '</div>' + lodBlock(e, n) + texBlock(e, n) + '</details>';
  });
  box.innerHTML = h + '</div>' + (st.tex ? '<datalist id="coreTexL">' + st.tex.list.slice(0, 4000).map(function (x) { return '<option value="' + esc(x) + '">'; }).join("") + '</datalist>' : ""); pills();
}
function texMissing(v) { return !!(st.tex && v && !st.tex.set[String(v).replace(/\.dds$/i, "").toLowerCase()]); }
function texBlock(e, n) {
  if (!e.pr) return "";
  var h = '<div class="core-lod"><div class="core-lh"><b>' + L("texT") + '</b></div><p class="note" style="margin:6px 0 0">' + L("texN") + '</p>';
  if (!e.tex) return h + '<p class="note core-warn" style="margin:6px 0 0">' + L("texNoR").replace("{r}", esc(e.pr)) + '</p></div>';
  if (!e.tex.length) return h + '<p class="note" style="margin:6px 0 0">' + L("texNo") + '</p></div>';
  var u = st.pusers && st.pusers[e.pr] || 0;
  if (u > 1) h += '<p class="note core-warn" style="margin:6px 0 0">' + L("texU").replace("{n}", u).replace("{r}", esc(e.pr)) + '</p>';
  h += '<div class="core-grid">';
  e.tex.forEach(function (t, k) {
    var key = "t" + n + "." + k, val = getRaw(key), ch = mods[cur.i] && key in mods[cur.i];
    h += '<div class="row core-wide' + (ch ? " core-mod" : "") + '" data-row="' + key + '"><span class="l">' + esc(t.v || L("texV")) + '<small>' + L("texOrig") + ': ' + esc(t.t || "—") + '</small></span>'
      + '<input class="inp" type="text" spellcheck="false" autocomplete="off" data-dl="coreTexL" data-k="' + key + '" value="' + esc(val) + '" style="min-width:220px"></div>'
      + '<p class="note core-warn" data-tw="' + key + '" style="margin:2px 0 6px"' + (texMissing(val) ? "" : " hidden") + '>' + L("texMiss") + '</p>';
  });
  return h + '</div></div>';
}
function lodBlock(e, n) {
  if (e.v.near == null || e.v.lodFar == null) return '<p class="note" style="margin:10px 0 0">' + L("lodNo") + '</p>';
  var u = st.users && st.users[e.er] || 0;
  return '<div class="core-lod"><div class="core-lh"><b>' + L("lodT") + '</b><button class="mini" data-hide="' + n + '">' + L("hideS") + '</button></div><p class="note" style="margin:6px 0 0">' + L("lodN") + '</p>'
    + (u > 1 ? '<p class="note core-warn" style="margin:6px 0 0">' + L("lodU").replace("{n}", u).replace("{r}", esc(e.er)) + '</p>' : '')
    + '<div class="core-grid">' + rowH("e" + n + ".near", FD.E.near) + rowH("e" + n + ".lodFar", FD.E.lodFar) + '</div></div>';
}
function drawSearch() {
  var box = $("#coreSearch"); if (!box) return;
  if (!st.ok) { box.innerHTML = ""; return; }
  box.innerHTML = '<div class="core-sc"><div class="ddfh"><h3>' + L("sS") + '</h3></div>' + modeTabs() + '<div class="core-q"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input class="inp" id="coreQ" type="text" spellcheck="false" autocomplete="off" placeholder="' + esc(L(mode === "eff" ? "ph" : mode === "prt" ? "phP" : "phE")) + '" value="' + esc(q) + '"><button class="go" id="coreFind">' + L("find") + '</button></div><div class="core-sug" id="coreSug"></div></div>';
  drawSug();
}
function matches(s) {
  s = s.trim().toLowerCase(); if (!s) return [];
  var a = curList(), ex = [], pre = [], inc = [], i, n;
  for (i = 0; i < a.length; i++) { n = a[i].name.toLowerCase(); if (n === s) ex.push(i); else if (n.indexOf(s) === 0) pre.push(i); else if (n.indexOf(s) > 0) inc.push(i); }
  return ex.concat(pre, inc);
}
function drawSug() {
  var b = $("#coreSug"); if (!b) return;
  var r = matches(q), mx = 80;
  b.innerHTML = r.slice(0, mx).map(function (i) { var sl = mode === "eff" ? cur : rcur; return '<button class="mini' + (sl && sl.i === i ? ' on' : '') + '" data-pick="' + i + '">' + esc(curList()[i].name) + '</button>'; }).join("") + (r.length > mx ? '<span class="more">' + L("more") + ' (' + r.length + ')</span>' : "");
}
function stat() {
  var go = $("#coreGo"), sum = $("#coreSum"); if (!go || !sum) return;
  var np = 0, nv = 0; Object.keys(mods).forEach(function (i) { var c = Object.keys(mods[i]).length; if (c) { np++; nv += c; } });
  ["prt", "emt"].forEach(function (md) { Object.keys(rmods[md]).forEach(function (i) { var c = Object.keys(rmods[md][i]).length; if (c) { np++; nv += c; } }); });
  go.disabled = !(st.ok && np) || !!busy;
  if (!st.name) { sum.className = "dsum"; sum.textContent = L("goHint"); return; }
  if (busy) { sum.className = "dsum"; sum.textContent = busy; return; }
  if (saveMsg) { sum.className = "dsum " + (saveMsg.ok ? "okc" : "erc"); sum.textContent = saveMsg.t; return; }
  if (!st.ok) { sum.className = "dsum erc"; sum.textContent = st.err || L("fBad"); return; }
  sum.className = "dsum"; sum.textContent = np ? L("chg") + ": " + np + " " + L("chgP") + ", " + nv + " " + L("chgV") : L("goNone");
}
function sync() {
  if (!live()) return;
  var body = $("#coreBody"), btns = $("#coreBtns"), cw = $("#coreW");
  if (cw) cw.classList.toggle("nofile", !st.name);
  if (!st.name) {
    body.innerHTML = '<div class="drop" id="coreDrop"><b>' + L("dropT") + '</b><span>' + L("dropS") + '</span></div>'; btns.innerHTML = "";
    drawSearch(); drawRes(); stat(); return;
  }
  body.innerHTML = '<div class="retf"><span>' + L("fName") + ': <b>' + esc(st.name) + '</b></span><span>' + L("fSize") + ': <b>' + fmt(st.size) + '</b></span>'
    + (st.ok ? '<span>' + L("fRoot") + ': <b>' + esc(st.rootName) + '</b></span><span>' + L("fPart") + ': <b>' + st.ix.length + '</b></span>' : '') + '</div>';
  btns.innerHTML = '<button class="mini" id="coreRep">' + L("replace") + '</button><button class="mini" id="coreClr">' + L("clear") + '</button>';
  drawSearch(); drawRes(); stat();
}

/* ---------- загрузка ---------- */
function loadFile(f) {
  if (!f) return;
  cur = null; mods = {}; q = ""; msg = ""; saveMsg = null; rcur = null; rcurs = {}; rmods = { prt: {}, emt: {} };
  if (!/\.xml$/i.test(f.name || "")) { st = blank(); sync(); var s = $("#coreSum"); if (s) { s.className = "dsum erc"; s.textContent = L("notXml"); } return; }
  busy = L("reading"); stat();
  f.text().then(function (t) {
    if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
    var n = blank(); n.name = f.name; n.size = f.size; n.text = t;
    var rm = /<([A-Za-z_][\w.\-]*)/.exec(t.slice(0, 2000)); n.rootName = rm ? rm[1] : "";
    if (n.rootName !== "ParticleEffectsList") n.err = n.rootName ? L("notCore") : L("fBad");
    else { n.ix = index(t); if (!n.ix || !n.ix.length) n.err = L("notCore"); else n.ok = true; }
    busy = ""; st = n; sync();
  }).catch(function () { busy = ""; st = blank(); st.name = f.name; st.size = f.size; st.err = L("readFail"); sync(); });
}
function ensureEm() {
  if (st.eix) return;
  st.eix = eindex(st.text); var u = {}, a = st.text.indexOf("<EffectRuleDictionary>"), b = st.text.indexOf("</EffectRuleDictionary>"), re = /<EmitterRule>([^<]*)<\/EmitterRule>/g, m;
  re.lastIndex = a; while ((m = re.exec(st.text)) && m.index < b) u[m[1]] = (u[m[1]] || 0) + 1; st.users = u;
  var pu = {}, rp = /<ParticleRule>([^<]*)<\/ParticleRule>/g; rp.lastIndex = a; while ((m = rp.exec(st.text)) && m.index < b) pu[m[1]] = (pu[m[1]] || 0) + 1; st.pusers = pu;
  st.pix = pindex(st.text); st.tex = texSet(st.text);
}
function openEff(i) {
  cur = { i: i, m: model(st.text, st.ix[i]) }; msg = ""; saveMsg = null; ensureEm();
  cur.m.em.forEach(function (e) { var it = st.eix[e.er]; if (it) { var nr = readNear(st.text.slice(it.s, it.e)); if (nr !== null) e.v.near = nr; } });
  cur.m.em.forEach(function (e) { var r = e.pr && st.pix[e.pr]; e.tex = r ? texVars(st.text.slice(r.s, r.e)) : null; });
  drawRes(); drawSug();
  var r = $("#coreRes"); if (r && r.scrollIntoView) r.scrollIntoView({ block: "nearest" });
}
/* ---------- ParticleRule / EmitterRule: режимы поиска и редактор ---------- */
function ensureR(md) { if (!st.rix) st.rix = {}; if (!st.rix[md]) st.rix[md] = rindex(st.text, md === "prt" ? "ParticleRuleDictionary" : "EmitterRuleDictionary"); return st.rix[md]; }
function curList() { return mode === "eff" ? st.ix : ensureR(mode); }
function setMode(md) { if (md === mode) return; if (mode !== "eff") rcurs[mode] = rcur; mode = md; rcur = md === "eff" ? null : rcurs[md] || null; q = ""; msg = ""; saveMsg = null; drawSearch(); drawRes(); }
function modeTabs() { return '<div class="core-modes" style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px">' + [["eff", "mEff"], ["prt", "mPrt"], ["emt", "mEmt"]].map(function (x) { return '<button class="mini' + (mode === x[0] ? " on" : "") + '" data-mode="' + x[0] + '">' + L(x[1]) + '</button>'; }).join("") + '</div>'; }
function openAny(i) { if (mode === "eff") openEff(i); else openRule(i); }
function openRule(i) {
  var r = curList()[i]; if (!r) return; ensureEm();
  rcur = { i: i, name: r.name, lv: rleaves(st.text.slice(r.s, r.e)) }; msg = ""; saveMsg = null; drawRes(); drawSug();
  var b = $("#coreRes"); if (b && b.scrollIntoView) b.scrollIntoView({ block: "nearest" });
}
function rmo() { return (rcur && rmods[mode][rcur.i]) || {}; }
function rget(k) { var o = rmo(); return k in o ? o[k] : rcur.lv[k].a; }
function secTitle(s) { var k = "sec_" + s, t = L(k); return t !== k ? t : s; }
function kfpName(n) { return String(n).replace(/^[^:]*:m_/, "").replace(/KFP$/, ""); }
function rhex(a) { return "#" + [0, 1, 2].map(function (i) { return hex2(Math.max(0, Math.min(255, Math.round(parseFloat(a[i]) * 255) || 0))); }).join(""); }
function drawRule() {
  var box = $("#coreRes"); if (!box) return;
  if (!rcur) { box.innerHTML = msg ? '<div class="card"><p class="note" style="margin:0">' + esc(msg) + '</p></div>' : (st.ok ? '<div class="core-ph"><b>' + L("pick") + '</b><span>' + L("pickS") + '</span></div>' : ""); return; }
  var lv = rcur.lv, secs = [], seen = {}, u = mode === "emt" ? (st.users && st.users[rcur.name] || 0) : (st.pusers && st.pusers[rcur.name] || 0);
  lv.forEach(function (l) { if (!seen[l.sec]) { seen[l.sec] = 1; secs.push(l.sec); } });
  var h = '<div class="card core-hd"><div class="core-t"><div><h2>' + esc(rcur.name) + '</h2><div class="core-meta"><span>' + L(mode === "prt" ? "mPrt" : "mEmt") + '</span><span>' + L("rUse").replace("{n}", "<b>" + u + "</b>") + '</span></div></div><button class="mini" id="coreRst">' + L("rRst") + '</button></div>'
    + (u > 1 ? '<p class="note core-warn" style="margin:8px 0 0">' + L("rWarn").replace("{n}", u) + '</p>' : "") + '</div>';
  if (!lv.length) h += '<div class="card"><p class="note" style="margin:0">' + L("rNone") + '</p></div>';
  else h += '<div class="card dds">' + secs.map(function (sc, i) { return '<details class="dsec" data-rsec="' + esc(sc) + '"' + (i ? "" : " open") + '><summary><span>' + esc(secTitle(sc)) + '<em class="core-cnt" hidden></em></span></summary><div class="core-grid" data-rb="' + esc(sc) + '"></div></details>'; }).join("") + '</div>';
  box.innerHTML = h;
  var f = box.querySelector("details[data-rsec][open]"); if (f) fillSec(f);
  rpills();
}
function fillSec(d) { var b = d.querySelector("[data-rb]"); if (!b || b.dataset.f) return; b.dataset.f = "1"; b.innerHTML = secHtml(d.dataset.rsec); }
function onToggle(e) { if (!live()) return; var d = e.target; if (d && d.tagName === "DETAILS" && d.open && d.dataset.rsec != null) fillSec(d); }
/* ключи KeyframeValue одной группы (тот же раздел, под-блок и KFP), что и у поля k */
function gKeys(k) {
  var lv = rcur.lv, b = lv[k], r = [], i;
  for (i = 0; i < lv.length; i++) if (lv[i].tag === "KeyframeValue" && lv[i].sec === b.sec && lv[i].sub === b.sub && lv[i].kfp === b.kfp && lv[i].a.length >= 3) r.push(i);
  return r;
}
/* общий блок группы цветовых кейфреймов: цвет всем ключам + ползунок прозрачности (множитель к исходной альфе) */
function gColHtml(k) {
  var l = rcur.lv[k]; if (!/rgb/i.test(l.kfp || "")) return "";
  var ks = gKeys(k); if (!ks.length) return "";
  var hasA = ks.some(function (i) { return rcur.lv[i].a.length >= 4; }), h = "", mult = 100;
  var first = ks[0], i2, o, c;
  c = rhex(rget(first));
  if (hasA) {
    for (i2 = 0; i2 < ks.length; i2++) { o = parseFloat(rcur.lv[ks[i2]].a[3]); if (o > 0.0001) { mult = Math.round(parseFloat(rget(ks[i2])[3]) / o * 100); break; } }
    mult = Math.max(0, Math.min(200, mult || 0));
  }
  h += '<div class="row core-wide core-grp" style="grid-column:1/-1"><span class="l">' + L("rGT") + '</span><span class="core-r">'
    + '<span class="core-as" title="' + esc(L("rGC")) + '"><input type="color" class="core-c" data-rg="' + k + '" data-rgc="1" value="' + c + '"></span>'
    + (hasA ? '<span class="core-as" title="' + esc(L("rGA")) + '"><input type="range" min="0" max="200" step="1" data-rg="' + k + '" data-rga="1" value="' + mult + '"><b class="core-ap">' + mult + '%</b></span>' : "")
    + '</span></div>';
  return h;
}
function rRefresh(idx) {
  var a = rget(idx), els = root.querySelectorAll('input[data-rk="' + idx + '"]');
  Array.prototype.forEach.call(els, function (n2) { if (n2.dataset.cp) n2.value = rhex(a); else n2.value = a[+n2.dataset.i || 0]; });
  var row = els[0] && els[0].closest(".row"); if (row) row.classList.toggle("core-mod", Array.prototype.some.call(row.querySelectorAll("[data-rk]"), function (x) { return +x.dataset.rk in rmo(); }));
}
function rGroup(el) {
  if (!rcur) return;
  var k = +el.dataset.rg, ks = gKeys(k), i, j, idx, a, o, n;
  if (el.dataset.rga) {
    var m = Math.max(0, Math.min(200, +el.value || 0)) / 100;
    ks.forEach(function (ix) {
      o = rcur.lv[ix].a; if (o.length < 4) return;
      a = rget(ix).slice();
      n = Math.max(0, Math.min(Math.max(1, parseFloat(o[3]) || 0), (parseFloat(o[3]) || 0) * m));
      a[3] = numOf(numStr(n)) === numOf(o[3]) ? o[3] : numStr(n);
      setRMod(ix, a); rRefresh(ix);
    });
    var sp = el.parentNode && el.parentNode.querySelector(".core-ap"); if (sp) sp.textContent = Math.round(m * 100) + "%";
  } else if (el.dataset.rgc) {
    var x = el.value;
    ks.forEach(function (ix) {
      o = rcur.lv[ix].a; a = rget(ix).slice();
      for (j = 0; j < 3; j++) { var v = numStr(parseInt(x.slice(1 + j * 2, 3 + j * 2), 16) / 255); a[j] = numOf(v) === numOf(o[j]) ? o[j] : v; }
      setRMod(ix, a); rRefresh(ix);
    });
  }
}
function secHtml(sec) {
  var lv = rcur.lv, h = "", last = null, pt = null, k, l;
  for (k = 0; k < lv.length; k++) {
    l = lv[k]; if (l.sec !== sec) continue;
    var g = l.sub + "|" + l.kfp;
    if (g !== last) { last = g; var tt = (l.sub || "") + (l.sub && l.kfp ? " · " : "") + (l.kfp ? kfpName(l.kfp) : ""); if (tt) h += '<p class="note" style="grid-column:1/-1;margin:10px 0 0"><b>' + esc(tt) + '</b></p>'; h += gColHtml(k); }
    if (l.tag === "KeyframeTime") { pt = k; continue; }
    if (l.tag === "KeyframeValue") { h += kfRow(k, pt, l); pt = null; continue; }
    h += rrow(k, l);
  }
  return h;
}
function rnum(k, i, v, cls, ttl) { return '<input class="inp' + (cls ? " " + cls : "") + '" type="number" step="any"' + (ttl ? ' title="' + esc(ttl) + '"' : "") + ' data-rk="' + k + '" data-i="' + i + '" value="' + esc(v) + '">'; }
function rrow(k, l) {
  var a = rget(k), c = "", i, ch = k in rmo(), lab = l.tag.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  if (l.t === "bool") c = '<button class="chk" role="checkbox" data-rk="' + k + '" aria-checked="' + (a[0] === "1") + '"></button>';
  else if (l.t === "vec") { var s2 = ""; for (i = 0; i < a.length; i++) s2 += rnum(k, i, a[i], "s"); c = '<span class="core-r">' + s2 + '</span>'; }
  else c = rnum(k, 0, l.t === "hex" ? numStr(numOf(a[0])) : a[0]);
  return '<div class="row' + (l.t === "vec" ? " core-wide" : "") + (ch ? " core-mod" : "") + '"><span class="l">' + esc(lab) + '</span>' + c + '</div>';
}
function kfRow(k, pt, l) {
  var a = rget(k), s2 = "", i, o = rmo(), ch = (k in o) || (pt != null && pt in o);
  if (pt != null) s2 += rnum(pt, 0, rget(pt)[0], "s", L("rKfT"));
  for (i = 0; i < a.length; i++) s2 += rnum(k, i, a[i], "s");
  if (/rgb/i.test(l.kfp || "") && a.length >= 3) s2 += '<input type="color" class="core-c" data-rk="' + k + '" data-cp="1" value="' + rhex(a) + '">';
  return '<div class="row core-wide' + (ch ? " core-mod" : "") + '"><span class="l">' + L("rKfN") + ' ' + l.kfi + '<small>' + L("rKfH") + '</small></span><span class="core-r">' + s2 + '</span></div>';
}
function rpills() {
  if (!root || !rcur) return;
  var cnt = {}, o = rmo(); Object.keys(o).forEach(function (k) { var sc = rcur.lv[+k].sec; cnt[sc] = (cnt[sc] || 0) + 1; });
  root.querySelectorAll("#coreRes details[data-rsec]").forEach(function (d) { var p = d.querySelector("summary .core-cnt"), c = cnt[d.dataset.rsec] || 0; if (p) { p.hidden = !c; p.textContent = c; } });
}
function setRMod(k, a) {
  var all = rmods[mode], o = (all[rcur.i] = all[rcur.i] || {});
  if (JSON.stringify(a) === JSON.stringify(rcur.lv[k].a)) delete o[k]; else o[k] = a;
  if (!Object.keys(o).length) delete all[rcur.i];
  saveMsg = null;
  var el = root.querySelector('[data-rk="' + k + '"]'), row = el && el.closest(".row"), mo = rmo();
  if (row) row.classList.toggle("core-mod", Array.prototype.some.call(row.querySelectorAll("[data-rk]"), function (x) { return +x.dataset.rk in mo; }));
  rpills(); stat();
}
function rInput(el) {
  if (!rcur) return;
  var k = +el.dataset.rk, l = rcur.lv[k]; if (!l) return;
  var a = rget(k).slice(), row = el.closest(".row"), i;
  if (el.dataset.cp) { var x = el.value; for (i = 0; i < 3; i++) a[i] = numStr(parseInt(x.slice(1 + i * 2, 3 + i * 2), 16) / 255); }
  else {
    if (el.value === "" || isNaN(+el.value)) return;
    i = +el.dataset.i || 0; var n = +el.value; if (l.t === "int" || l.t === "hex") n = Math.round(n);
    a[i] = l.t === "hex" ? "0x" + (n >>> 0).toString(16).toUpperCase() : numStr(n);
  }
  for (i = 0; i < a.length; i++) if (numOf(a[i]) === numOf(l.a[i])) a[i] = l.a[i];
  setRMod(k, a);
  if (row) {
    if (el.dataset.cp) row.querySelectorAll('input[data-rk="' + k + '"]:not([data-cp])').forEach(function (n2) { n2.value = a[+n2.dataset.i]; });
    else { var cp = row.querySelector('[data-cp][data-rk="' + k + '"]'); if (cp) cp.value = rhex(a); }
  }
}
function find() {
  var s = q.trim(); if (!s) return;
  var A = curList(), r = matches(s), ex = r.filter(function (i) { return A[i].name.toLowerCase() === s.toLowerCase(); });
  if (ex.length) { openAny(ex[0]); return; }
  if (r.length === 1) { openAny(r[0]); return; }
  if (mode === "eff") cur = null; else rcur = null;
  msg = r.length ? L("pick") : L("nf").replace("{n}", s); drawRes();
}

/* ---------- правка значений ---------- */
function setMod(key, val) {
  var o = (mods[cur.i] = mods[cur.i] || {}), orig = origRaw(key);
  if (JSON.stringify(val) === JSON.stringify(orig)) delete o[key]; else o[key] = val;
  if (!Object.keys(o).length) delete mods[cur.i];
  saveMsg = null;
  var row = root.querySelector('[data-row="' + key + '"]'); if (row) row.classList.toggle("core-mod", !!(mods[cur.i] && key in mods[cur.i]));
  pills(); stat();
}
function tagOf(k) { return k.replace(/^e\d+\./, ""); }
function fdOf(k) { return /^e\d+\./.test(k) ? FD.E[tagOf(k)] : FD.F[tagOf(k)]; }
function onInput(e) {
  if (!live()) return;
  var el = e.target, k = el.dataset && el.dataset.k;
  if (el.id === "coreQ") { q = el.value; drawSug(); return; }
  if (el.dataset && el.dataset.rg != null) { rGroup(el); return; }
  if (el.dataset && el.dataset.rk != null) { rInput(el); return; }
  if (!k || !cur) return;
  if (/^t\d+\.\d+$/.test(k)) {
    var tv = String(el.value).replace(/[\x00-\x1f]/g, "").trim(); if (!tv) return;
    setMod(k, tv); var tw = root.querySelector('[data-tw="' + k + '"]'); if (tw) tw.hidden = !texMissing(tv); return;
  }
  var f = fdOf(k); if (!f) return;
  var v;
  if (f.t === "vec") { if (el.value === "" || isNaN(+el.value)) return; var a = getRaw(k).slice(); a[+el.dataset.i] = numStr(el.value); setMod(k, a); return; }
  if (f.t === "col") {
    var c = colOf(getRaw(k)), r = root.querySelector('[data-row="' + k + '"]');
    if (el.dataset.cp) { var x = el.value; c.r = parseInt(x.slice(1, 3), 16); c.g = parseInt(x.slice(3, 5), 16); c.b = parseInt(x.slice(5, 7), 16); }
    else if (el.dataset.ca) { c.a = Math.max(0, Math.min(255, Math.round(+el.value * 2.55))); }
    else { if (el.value === "" || isNaN(+el.value)) return; c[el.dataset.c] = Math.max(0, Math.min(255, Math.round(+el.value))); }
    var raw = colStr(c); setMod(k, raw === "0x" + numOf(origRaw(k)).toString(16).toUpperCase().padStart(8, "0") ? origRaw(k) : raw);
    if (r && (el.dataset.cp || el.dataset.ca)) ["r", "g", "b", "a"].forEach(function (ch) { var i = r.querySelector('[data-c="' + ch + '"]'); if (i) i.value = c[ch]; });
    if (r) { var sl = r.querySelector("[data-ca]"), pc = Math.round(c.a / 2.55); if (sl && sl !== el) sl.value = pc; var sp = r.querySelector(".core-ap"); if (sp) sp.textContent = pc + "%"; }
    if (r && !el.dataset.cp && !el.dataset.ca) { var p = r.querySelector("[data-cp]"); if (p) p.value = "#" + hex2(c.r) + hex2(c.g) + hex2(c.b); }
    return;
  }
  if (el.value === "" || isNaN(+el.value)) return;
  var n = +el.value; if (f.t === "int") n = Math.round(n);
  var og = origRaw(k); v = (f.t === "int" && /^0x/i.test(og)) ? "0x" + (n >>> 0).toString(16).toUpperCase() : numStr(n);
  if (k === "NumLoops" && n === 0) v = "0x0";
  setMod(k, numOf(v) === numOf(og) ? og : v);
  if (k === "NumLoops") loopSync();
}
function onClick(e) {
  if (!live()) return;
  var t = e.target;
  if (t.closest("#coreDrop") || t.closest("#coreRep")) { var p = $("#corePick"); if (p) { p.value = ""; p.click(); } return; }
  if (t.closest("#coreClr")) { st = blank(); cur = null; mods = {}; rcur = null; rcurs = {}; rmods = { prt: {}, emt: {} }; q = ""; msg = ""; saveMsg = null; sync(); return; }
  if (t.closest("#coreFind")) { find(); return; }
  var md = t.closest("[data-mode]"); if (md) { setMode(md.dataset.mode); return; }
  var rc = t.closest(".chk[data-rk]"); if (rc && rcur) { var ron = rc.getAttribute("aria-checked") !== "true"; rc.setAttribute("aria-checked", ron ? "true" : "false"); setRMod(+rc.dataset.rk, [ron ? "1" : "0"]); return; }
  var pk = t.closest("[data-pick]"); if (pk) { var i = +pk.dataset.pick; q = curList()[i].name; var qi = $("#coreQ"); if (qi) qi.value = q; drawSug(); openAny(i); return; }
  if (t.closest("#coreRst")) { if (mode !== "eff") { if (rcur) { delete rmods[mode][rcur.i]; saveMsg = null; drawRes(); stat(); } } else if (cur) { delete mods[cur.i]; saveMsg = null; drawRes(); stat(); } return; }
  var hb = t.closest("[data-hide]");
  if (hb && cur) {
    [["e" + hb.dataset.hide + ".near", "0"], ["LodEvoDistanceMin", "4"], ["LodEvoDistanceMax", "4"]].forEach(function (x) {
      if (getRaw(x[0]) == null) return; var og = origRaw(x[0]); setMod(x[0], numOf(x[1]) === numOf(og) ? og : x[1]);
      var hi = root.querySelector('input[data-k="' + x[0] + '"]'); if (hi) hi.value = x[1];
    });
    return;
  }
  var lp = t.closest(".chk[data-loop]");
  if (lp && cur) {
    var og0 = origRaw("NumLoops"), isOn = numOf(getRaw("NumLoops")) === 0, nv;
    if (isOn) nv = numOf(og0) === 0 ? "0x1" : og0; else nv = "0x0";
    setMod("NumLoops", nv); loopSync(); return;
  }
  var cb = t.closest(".chk[data-k]");
  if (cb && cur) { var on = cb.getAttribute("aria-checked") !== "true"; cb.setAttribute("aria-checked", on ? "true" : "false"); setMod(cb.dataset.k, on ? "1" : "0"); return; }
  if (t.closest("#coreGo")) save();
}
function onKey(e) { if (live() && e.target && e.target.id === "coreQ" && e.key === "Enter") { e.preventDefault(); find(); } }
function save() {
  if (!st.ok) return;
  var text;
  try { ensureEm(); text = build(st.text, st.ix, mods, st.eix, st.pix, rmods, st.rix); } catch (e) { saveMsg = { ok: false, t: L("saveFail") }; stat(); return; }
  var base = /\.xml$/i.test(st.name) ? st.name : st.name + ".xml";
  busy = L("reading"); stat();
  var done = function (r) { busy = ""; saveMsg = r && r.ok ? { ok: true, t: L("saved") + ": " + (r.path || base) } : (r && r.error === "cancel" ? null : { ok: false, t: L("saveFail") + (r && r.error ? " (" + r.error + ")" : "") }); stat(); };
  if (window.api && window.api.coreSave) window.api.coreSave({ text: text, name: base }).then(done, function () { done({ ok: false, error: "ipc" }); });
  else { try { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/xml" })); a.download = base; document.body.appendChild(a); a.click(); a.remove(); done({ ok: true, path: base }); } catch (e) { done({ ok: false, error: "dl" }); } }
}
function onChange(e) { if (live() && e.target && e.target.id === "corePick") loadFile(e.target.files && e.target.files[0]); }
function onOver(e) { if (!live()) return; e.preventDefault(); var d = $("#coreDrop"); if (d) d.style.borderColor = "var(--accent)"; }
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var d = $("#coreDrop"); if (d) d.style.borderColor = ""; } }
function onDrop(e) { if (!live()) return; e.preventDefault(); var d = $("#coreDrop"); if (d) d.style.borderColor = ""; var fs = e.dataTransfer && e.dataTransfer.files; if (fs && fs.length) loadFile(fs[0]); }
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("click", onClick); root.addEventListener("change", onChange); root.addEventListener("input", onInput); root.addEventListener("keydown", onKey); root.addEventListener("toggle", onToggle, true);
  root.addEventListener("dragover", onOver); root.addEventListener("dragleave", onLeave); root.addEventListener("drop", onDrop);
  sync();
}

window.CORET = { html: html, mount: mount, state: function () { return st; }, lib: { pindex: pindex, texVars: texVars, patchTex: patchTex, texSet: texSet, topItemsA: topItemsA, eindex: eindex, readNear: readNear, patchNear: patchNear, index: index, model: model, build: build, patchSeg: patchSeg, rindex: rindex, rleaves: rleaves, patchLeaves: patchLeaves, colOf: colOf, colStr: colStr, numStr: numStr } };
window.TOOLS = (window.TOOLS || []).concat([{ id: "core", ico: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
