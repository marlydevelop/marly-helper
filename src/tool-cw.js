/* Инструмент «RPF Explorer»: свой нативный проводник по архивам GTA V (движок rpf.js, IPC cw:* в cw.js).
   Никаких внешних окон: дерево папок/архивов, поиск по всем .rpf, просмотр (текст/hex/картинка), извлечение,
   режим правки (замена, добавление, удаление, переименование, новая папка). Регистрирует window.TOOLS, window.CWHINT, window.CWT. */
(function () {
"use strict";
var I = {
en: {
 name:"RPF Explorer", desc:"Browse and edit GTA V game archives (.rpf) right in the app", back:"Tools", sub:"Browse and edit GTA V archives right inside the app.",
 needT:"GTA V folder needed", needD:"RPF Explorer reads the game archives, so it needs to know where GTA V is installed. Choose it once.",
 detect:"Find game", pickGame:"Choose game folder", gameBtn:"Game folder", busyD:"Searching…", gFound:"Game found", gNone:"Game not found. Choose its folder manually.",
 keysT:"Reading game keys", keysD:"One-time scan of the game exe to unlock encrypted archives. It stays on this PC and takes a few seconds.", keysOk:"Keys ready",
 keysBad:"Could not find the key in the game exe. Make sure the game files are original (not packed or modified) and try again.", keysMagic:"The key was found, but the CodeWalker key data did not match it (the game version may be newer than the bundled data). Send log.txt so it can be updated.", keysNoMagic:"The key data file (rpfmagic.dat) is missing from the app.", keysSkip:"Browse without keys", retry:"Try again",
 edit:"Edit mode", editOn:"Edit mode on", editNote:"Encrypted (NG) archives are saved as OPEN, which the game accepts.",
 search:"Search in all archives…", filter:"Filter this folder…", scopeAll:"Everywhere", scopeHere:"Here", indexing:"Indexing archives", indexed:"entries indexed", noIdx:"Index is not ready yet, search covers only what is loaded.",
 root:"Game folder", empty:"Empty", more:"Showing the first {n}. Narrow it with the filter.", results:"results",
 colName:"Name", colSize:"Size", colType:"Type", tDir:"Folder", tRpf:"Archive", tBin:"File", tRes:"Resource", enc:"encrypted",
 extract:"Extract", extractDir:"Extract folder", replace:"Replace", del:"Delete", rename:"Rename", add:"Add files", mkdir:"New folder", compact:"Optimize archive", fix:"Fix (encrypt for the game)", fixConfirm:"Encrypt this archive (NG) so the game accepts it? Do not rename the file afterwards.", fixOk:"Archive fixed", unseal:"Unseal", unsealConfirm:"Remove the protection (LOCK) from this archive? The file will be modified; make a copy first if it is important.", unsealOk:"Archive unsealed", unsealClean:"No protection found: the archive is not sealed", e_onyx_win:"Unsealing works only on Windows.", e_onyx_missing:"The ONYX files (bin/onyx) are missing from the app.", e_onyx_keys:"ONYX could not load its keys (bin/onyx/keys).", e_onyx_fail:"ONYX failed to process the archive. Details are in the app log (onyx).", e_onyx_still:"The protection could not be removed completely; the original file was not changed.", e_already_enc:"This archive is already encrypted.", e_enc_data:"Encryption data (rpfenc.bin) is missing or damaged.", e_enc_verify:"Encryption self-check failed; nothing was written.", e_ng_rename:"An encrypted (NG) archive is tied to its file name and cannot be renamed.", e_bad_rpf:"The archive header is damaged.", reveal:"Open game folder", reindex:"Rebuild index",
 sel:"Select a file to preview it", path:"Path", size:"Size", stored:"Stored", kind:"Kind", enc2:"Encryption", prev:"Preview", cut:"…shown part only", big:"File is too large to preview.", dropHint:"Drop files here to add them",
 newName:"New name", folderName:"Folder name", ok:"OK", cancel:"Cancel", confirmDel:"Delete this from the archive?", confirmRep:"Replace with the chosen file?",
 v3d:"3D view", txEdit:"Text editor", mOpen:"Open", xmlInHint:"into this folder", v3Embed:"Embedded textures", v3EmbedNone:"This model has no embedded textures", v3Used:"used", v3Missing:"Not found for materials: {names}", e_xml_no_tex:"Textures for this XML were not found. Put the folder with the DDS files next to the XML (its name = the XML name without extensions), the same way the export saves it.", xmlExpTex:"XML saved. Textures: {n}, folder “{f}” (keep it next to the XML for import)", navBack:"Back (Backspace)", navFwd:"Forward (Alt+Right)", navUp:"Up one level (Alt+Up)", mShow:"Show in Explorer", delFs:"Move this file to the Recycle Bin?", needEdit:"Turn on Edit mode first", txOn:"Enable edit mode", ytEdit:"Texture editor", ytAdd:"Add texture", ytFmt:"Format for PNG/JPG:", ytRepl:"Replace", ytRen:"Rename", ytExp:"Export DDS", ytDel:"Delete", ytName:"Texture name", ytDelQ:"Delete this texture?", ytCnt:"Textures: {n}", ytAdded:"Added: {n}", ytSkip:"already exist: {names}", ytFail:"failed: {n}", ytHint:"Drop images here (DDS, PNG, JPG, BMP, TGA, TIFF) to add textures", ytMips:"mips", ytExported:"Exported", e_ytd_unsupported:"This texture dictionary cannot be edited (only the Legacy/Gen8 format with known texture formats).", e_ytd_dup:"A texture with this name already exists.", e_ytd_gone:"The editing session has expired. Close the editor and open it again.", e_ytd_name:"Bad texture name.", e_ytd_conv:"Could not convert the image (texconv failed).", e_ytd_too_big:"The dictionary is too large for one archive entry.", e_ytd_dds_format:"This DDS format is not supported by the game. Use DXT1/DXT5/BC7/A8R8G8B8 or a PNG/JPG.", e_ytd_dds_kind:"Cubemaps, volume and array textures are not supported.", e_dds_bad:"The DDS file is damaged or truncated.", dropFs:"Copy the dropped items into this game folder?", dropOver:"These already exist. Replace them?", fsDone:"Copied: {n}", rpfNew:"New RPF archive", rpfPack:"RPF from a folder…", rpfName:"New archive name", rpfDone:"Archive created, files: {n}", rpfSkip:"scripts (.ysc) skipped: {n}", e_pack_big:"Too much data to pack (over 50,000 files or 1.5 GB).", e_names_overflow:"Too many files or the names are too long for one archive. Split it into several archives.", ctxHint:"Right-click a file or empty space for actions. Drop files into the window to add them to the open folder. Drag a file out of the window to copy it to the desktop.", dropArch:"Open a folder inside an archive first, then drop the files.", dropAdd:"Add the dropped files to this folder?", txSave:"Save", txClose:"Close", txFind:"Find", txFindPh:"Find", txReplPh:"Replace with", txNext:"Next", txRepl:"Replace", txAll:"Replace all", txWrap:"Word wrap", txChk:"Check XML", txXmlOk:"XML is valid", txXmlBad:"XML error", txSaved:"Saved to the archive", txBadSave:"The XML contains an error. Save anyway?", txDiscard:"Discard unsaved changes?", txNone:"Not found", txRn:"Replaced: {n}", txLn:"Ln", txCol:"Col", txLines:"lines", txMod:"unsaved", txMixed:"Mixed line endings were unified", txRO:"Edit mode is off: read-only", e_not_text:"This file is not a text file.", e_text_big:"The file is too large for the editor (over 8 MB).", v3Tex:"Textures", v3Bones:"Skeleton", v3Wire:"Wireframe", v3Lod:"Detail", v3Obj:"Object",v3All:"All objects",v3Tint:"Color by object",v3Vc:"Vertex colors",v3Nm:"Model normals",v3Objs:"Objects",v3Empty:"empty",v3ShowAll:"Show all",v3HideAll:"Hide all",v3OHint:"Tick = show. Click a name = show only that object.",e_model_empty:"This object has no geometry that can be shown.", v3Reset:"Reset view", v3Close:"Close", v3Tris:"triangles", v3Help:"Drag: rotate · Right drag / Shift+drag: move · Wheel: zoom", v3NoGl:"WebGL is not available.", e_model_fail:"Could not read this model (GTA V Gen8 models and Gen9 geometry are supported).", texN:"textures", noPrevTex:"no preview", xmlx:"Export to XML", cwxOpen:"Open in a separate window", cwxOpenedK:"RPF Explorer is open in a separate window", cwxOpenedS:"It runs as a separate process and stays open even if you close Marly Helper.", cwxGo:"Switch to the window", cwxStart:"Opening the explorer window…", cwxFail:"Could not open the explorer window", txConv:"Shown as XML; on save it is rebuilt into the original file type.", xmlxN:"Export selected to XML ({n})", xmlxAll:"Export all files in this folder to XML", msClear:"Clear selection", selN:"Selected: {n}", xmlxNone:"No files that can be exported to XML", xmlBatchDone:"Exported to XML: {n}", xmlBatchTex:"textures: {n}", xmlBatchSkip:"skipped: {n}", xmli:"Replace from XML", xmlIn:"Import XML files", xmlDone:"Imported: {n}", xmlFailed:"failed: {n}", dropXml:"Convert the dropped XML files and add them to this folder?", xmlConfirm:"Convert the XML and replace the file in the archive?",
 done:"Done", extracted:"Extracted files", working:"Working…", copyPath:"Copy path", copied:"Copied",
 e_no_keys:"This archive is encrypted and the keys are not loaded.", e_not_found:"Not found.", e_exists:"A file or folder with this name already exists.", e_bad_name:"This name is not allowed.", e_ysc:"Script (.ysc) files cannot be replaced or renamed.", e_too_big:"This resource is too large (over 16 MB packed).", e_busy:"Another operation is running. Wait for it to finish.", e_no_game:"Select the GTA V folder first.", e_not_rpf:"Not a valid RPF archive.", e_bad_rpf:"The archive is damaged or unsupported.", e_bad_path:"Bad path.", e_not_game:"This is not a GTA V folder (no gta5.exe or gta5_enhanced.exe).", e_keys_missing:"Keys were not found in the exe.", e_not_dir:"This is not a folder.", e_not_file:"This is not a file.", e_names_overflow:"Too many different names for this archive.", e_no_conv:"The converter is missing from the app files (bin/) or this needs Windows.", e_xml_unsupported:"This file type has no XML conversion.", e_xml_fail:"Could not convert (reason in brackets and in log.txt). For import, check that the XML is valid and was exported from the same file type.", e_fail:"Something went wrong.", e_x:"Something went wrong.", e_toc_size:"The archive table did not fit.", e_is_dir:"This is a folder."
},
ru: {
 name:"RPF Explorer", desc:"Просмотр и правка игровых архивов GTA V (.rpf) прямо в программе", back:"Инструменты", sub:"Просмотр и правка архивов GTA V прямо внутри программы.",
 needT:"Нужна папка GTA V", needD:"RPF Explorer читает архивы игры, поэтому ему нужно знать, где установлена GTA V. Укажи её один раз.",
 detect:"Найти игру", pickGame:"Указать папку игры", gameBtn:"Папка игры", busyD:"Ищу…", gFound:"Игра найдена", gNone:"Игра не найдена. Укажи папку вручную.",
 keysT:"Читаю ключи игры", keysD:"Один раз сканирую exe игры, чтобы открывать зашифрованные архивы. Ключи остаются на этом ПК, это занимает несколько секунд.", keysOk:"Ключи готовы",
 keysBad:"Не удалось найти ключ в exe игры. Проверь, что файлы игры оригинальные (не запакованы и не изменены), и попробуй снова.", keysMagic:"Ключ найден, но данные ключей CodeWalker к нему не подошли (версия игры может быть новее встроенных данных). Пришли log.txt, чтобы обновить.", keysNoMagic:"В программе нет файла с данными ключей (rpfmagic.dat).", keysSkip:"Открыть без ключей", retry:"Повторить",
 edit:"Режим правки", editOn:"Режим правки включён", editNote:"Архивы с шифрованием NG сохраняются как OPEN, игра такие принимает.",
 search:"Поиск по всем архивам…", filter:"Фильтр в этой папке…", scopeAll:"Везде", scopeHere:"Здесь", indexing:"Индексирую архивы", indexed:"записей в индексе", noIdx:"Индекс ещё не готов, поиск идёт только по уже загруженному.",
 root:"Папка игры", empty:"Пусто", more:"Показаны первые {n}. Сузь список фильтром.", results:"найдено",
 colName:"Имя", colSize:"Размер", colType:"Тип", tDir:"Папка", tRpf:"Архив", tBin:"Файл", tRes:"Ресурс", enc:"зашифрован",
 extract:"Извлечь", extractDir:"Извлечь папку", replace:"Заменить", del:"Удалить", rename:"Переименовать", add:"Добавить файлы", mkdir:"Новая папка", compact:"Оптимизировать архив", fix:"Пофиксить (зашифровать для игры)", fixConfirm:"Зашифровать архив (NG), чтобы игра его приняла? После этого не переименовывай файл.", fixOk:"Архив пофикшен", unseal:"Распечатать", unsealConfirm:"Снять защиту (лок) с этого архива? Файл будет изменён, сделай копию, если он важен.", unsealOk:"Архив распечатан", unsealClean:"Защиты нет: архив не запечатан", e_onyx_win:"Распечатывание работает только в Windows.", e_onyx_missing:"В приложении нет файлов ONYX (bin/onyx).", e_onyx_keys:"ONYX не смог загрузить свои ключи (bin/onyx/keys).", e_onyx_fail:"ONYX не смог обработать архив. Подробности в логе приложения (onyx).", e_onyx_still:"Защиту не удалось снять полностью, исходный файл не изменён.", e_already_enc:"Архив уже зашифрован.", e_enc_data:"Данные шифрования (rpfenc.bin) не найдены или повреждены.", e_enc_verify:"Самопроверка шифрования не прошла, ничего не записано.", e_ng_rename:"NG-архив привязан к имени файла, переименовывать его нельзя.", e_bad_rpf:"Заголовок архива повреждён.", reveal:"Открыть папку игры", reindex:"Перестроить индекс",
 sel:"Выбери файл, чтобы посмотреть", path:"Путь", size:"Размер", stored:"В архиве", kind:"Вид", enc2:"Шифрование", prev:"Просмотр", cut:"…показана только часть", big:"Файл слишком большой для просмотра.", dropHint:"Перетащи файлы сюда, чтобы добавить",
 newName:"Новое имя", folderName:"Имя папки", ok:"ОК", cancel:"Отмена", confirmDel:"Удалить это из архива?", confirmRep:"Заменить выбранным файлом?",
 v3d:"3D-просмотр", txEdit:"Текстовый редактор", mOpen:"Открыть", xmlInHint:"в эту папку", v3Embed:"Вложенные текстуры", v3EmbedNone:"В модели нет вложенных текстур", v3Used:"используется", v3Missing:"Не найдены для материалов: {names}", e_xml_no_tex:"Не найдены текстуры для этого XML. Положи рядом с XML папку с DDS-файлами (имя папки = имя XML без расширений), как её сохраняет экспорт.", xmlExpTex:"XML сохранён. Текстур: {n}, папка «{f}» (держи её рядом с XML для импорта)", navBack:"Назад (Backspace)", navFwd:"Вперёд (Alt+Вправо)", navUp:"На уровень выше (Alt+Вверх)", mShow:"Показать в Проводнике", delFs:"Переместить этот файл в Корзину?", needEdit:"Сначала включи режим правки", txOn:"Включить режим правки", ytEdit:"Редактор текстур", ytAdd:"Добавить текстуру", ytFmt:"Формат для PNG/JPG:", ytRepl:"Заменить", ytRen:"Переименовать", ytExp:"Экспорт DDS", ytDel:"Удалить", ytName:"Название текстуры", ytDelQ:"Удалить эту текстуру?", ytCnt:"Текстур: {n}", ytAdded:"Добавлено: {n}", ytSkip:"уже есть: {names}", ytFail:"не удалось: {n}", ytHint:"Перетащи сюда картинки (DDS, PNG, JPG, BMP, TGA, TIFF), чтобы добавить текстуры", ytMips:"мип.", ytExported:"Экспортировано", e_ytd_unsupported:"Этот словарь текстур нельзя редактировать (поддерживается только формат Legacy/Gen8 с известными форматами текстур).", e_ytd_dup:"Текстура с таким названием уже есть.", e_ytd_gone:"Сессия редактирования устарела. Закрой редактор и открой заново.", e_ytd_name:"Некорректное название текстуры.", e_ytd_conv:"Не удалось сконвертировать картинку (texconv завершился с ошибкой).", e_ytd_too_big:"Словарь слишком большой для одной записи архива.", e_ytd_dds_format:"Этот формат DDS игра не поддерживает. Используй DXT1/DXT5/BC7/A8R8G8B8 или PNG/JPG.", e_ytd_dds_kind:"Кубические, объёмные текстуры и массивы не поддерживаются.", e_dds_bad:"Файл DDS повреждён или обрезан.", dropFs:"Скопировать перетащенное в эту папку игры?", dropOver:"Эти файлы уже есть. Заменить?", fsDone:"Скопировано: {n}", rpfNew:"Новый RPF архив", rpfPack:"RPF из папки…", rpfName:"Название нового архива", rpfDone:"Архив создан, файлов: {n}", rpfSkip:"скрипты (.ysc) пропущены: {n}", e_pack_big:"Слишком много данных для упаковки (больше 50 000 файлов или 1,5 ГБ).", e_names_overflow:"Слишком много файлов или длинные имена для одного архива. Раздели на несколько архивов.", ctxHint:"ПКМ по файлу или пустому месту: действия. Перетащи файлы в окно, чтобы добавить их в открытую папку. Перетащи файл из окна на рабочий стол, чтобы скопировать его.", dropArch:"Сначала открой папку внутри архива, затем перетащи файлы.", dropAdd:"Добавить перетащенные файлы в эту папку?", txSave:"Сохранить", txClose:"Закрыть", txFind:"Поиск", txFindPh:"Найти", txReplPh:"Заменить на", txNext:"Далее", txRepl:"Заменить", txAll:"Заменить все", txWrap:"Перенос строк", txChk:"Проверить XML", txXmlOk:"XML корректный", txXmlBad:"Ошибка XML", txSaved:"Сохранено в архив", txBadSave:"В XML есть ошибка. Всё равно сохранить?", txDiscard:"Отбросить несохранённые изменения?", txNone:"Не найдено", txRn:"Заменено: {n}", txLn:"Стр", txCol:"Кол", txLines:"строк", txMod:"не сохранено", txMixed:"Разные переводы строк приведены к одному", txRO:"Режим правки выключен: только просмотр", e_not_text:"Это не текстовый файл.", e_text_big:"Файл слишком большой для редактора (больше 8 МБ).", v3Tex:"Текстуры", v3Bones:"Скелет", v3Wire:"Каркас", v3Lod:"Детализация", v3Obj:"Объект",v3All:"Все объекты",v3Tint:"Цвет по объектам",v3Vc:"Цвета вершин",v3Nm:"Нормали модели",v3Objs:"Объекты",v3Empty:"пусто",v3ShowAll:"Показать все",v3HideAll:"Скрыть все",v3OHint:"Галочка = показать. Клик по имени = только этот объект.",e_model_empty:"В этом объекте нет геометрии, которую можно показать.", v3Reset:"Сбросить вид", v3Close:"Закрыть", v3Tris:"треугольников", v3Help:"Тяни: вращать · ПКМ / Shift+тяни: двигать · Колесо: масштаб", v3NoGl:"WebGL недоступен.", e_model_fail:"Не удалось прочитать модель (поддерживаются модели GTA V Gen8 и геометрия Gen9).", texN:"текстур", noPrevTex:"нет превью", xmlx:"Экспорт в XML", cwxOpen:"Открыть в отдельном окне", cwxOpenedK:"RPF Explorer открыт в отдельном окне", cwxOpenedS:"Он работает отдельным процессом и останется открытым, даже если закрыть Marly Helper.", cwxGo:"Перейти к окну", cwxStart:"Открываю окно проводника…", cwxFail:"Не удалось открыть окно проводника", txConv:"Показан XML-вид; при сохранении собирается обратно в исходный формат файла.", xmlxN:"Экспорт выбранных в XML ({n})", xmlxAll:"Экспорт всех файлов папки в XML", msClear:"Снять выделение", selN:"Выбрано: {n}", xmlxNone:"Нет файлов, которые можно экспортировать в XML", xmlBatchDone:"Экспортировано в XML: {n}", xmlBatchTex:"текстур: {n}", xmlBatchSkip:"пропущено: {n}", xmli:"Заменить из XML", xmlIn:"Импортировать XML-файлы", xmlDone:"Импортировано: {n}", xmlFailed:"не удалось: {n}", dropXml:"Собрать перетащенные XML и добавить в эту папку?", xmlConfirm:"Собрать файл из XML и заменить им файл в архиве?",
 done:"Готово", extracted:"Извлечено файлов", working:"Работаю…", copyPath:"Копировать путь", copied:"Скопировано",
 e_no_keys:"Архив зашифрован, а ключи не загружены.", e_not_found:"Не найдено.", e_exists:"Файл или папка с таким именем уже есть.", e_bad_name:"Такое имя нельзя использовать.", e_ysc:"Скрипты (.ysc) нельзя заменять и переименовывать.", e_too_big:"Ресурс слишком большой (больше 16 МБ в упакованном виде).", e_busy:"Уже идёт другая операция. Дождись окончания.", e_no_game:"Сначала укажи папку GTA V.", e_not_rpf:"Это не архив RPF.", e_bad_rpf:"Архив повреждён или не поддерживается.", e_bad_path:"Некорректный путь.", e_not_game:"Это не папка GTA V (нет gta5.exe или gta5_enhanced.exe).", e_keys_missing:"Ключи в exe не найдены.", e_not_dir:"Это не папка.", e_not_file:"Это не файл.", e_names_overflow:"Слишком много разных имён для этого архива.", e_no_conv:"В файлах программы нет конвертера (bin/) или нужен Windows.", e_xml_unsupported:"Для этого типа файла нет конвертации в XML.", e_xml_fail:"Не удалось сконвертировать (причина в скобках и в log.txt). Для импорта проверь, что XML целый и получен из файла того же типа.", e_fail:"Что-то пошло не так.", e_x:"Что-то пошло не так.", e_toc_size:"Таблица архива не поместилась.", e_is_dir:"Это папка."
},
uk: {
 name:"RPF Explorer", desc:"Перегляд і правка ігрових архівів GTA V (.rpf) прямо в програмі", back:"Інструменти", sub:"Перегляд і правка архівів GTA V прямо всередині програми.",
 needT:"Потрібна папка GTA V", needD:"RPF Explorer читає архіви гри, тому йому треба знати, де встановлена GTA V. Вкажи її один раз.",
 detect:"Знайти гру", pickGame:"Вказати папку гри", gameBtn:"Папка гри", busyD:"Шукаю…", gFound:"Гру знайдено", gNone:"Гру не знайдено. Вкажи папку вручну.",
 keysT:"Читаю ключі гри", keysD:"Один раз скануємо exe гри, щоб відкривати зашифровані архіви. Ключі лишаються на цьому ПК, це займає кілька секунд.", keysOk:"Ключі готові",
 keysBad:"Не вдалося знайти ключ в exe гри. Перевір, що файли гри оригінальні (не запаковані й не змінені), і спробуй ще раз.", keysMagic:"Ключ знайдено, але дані ключів CodeWalker до нього не підійшли (версія гри може бути новішою за вбудовані дані). Надішли log.txt, щоб оновити.", keysNoMagic:"У програмі немає файлу з даними ключів (rpfmagic.dat).", keysSkip:"Відкрити без ключів", retry:"Повторити",
 edit:"Режим правки", editOn:"Режим правки увімкнено", editNote:"Архіви з шифруванням NG зберігаються як OPEN, гра такі приймає.",
 search:"Пошук по всіх архівах…", filter:"Фільтр у цій папці…", scopeAll:"Скрізь", scopeHere:"Тут", indexing:"Індексую архіви", indexed:"записів в індексі", noIdx:"Індекс ще не готовий, пошук іде лише по вже завантаженому.",
 root:"Папка гри", empty:"Порожньо", more:"Показано перші {n}. Звузь список фільтром.", results:"знайдено",
 colName:"Ім'я", colSize:"Розмір", colType:"Тип", tDir:"Папка", tRpf:"Архів", tBin:"Файл", tRes:"Ресурс", enc:"зашифрований",
 extract:"Витягти", extractDir:"Витягти папку", replace:"Замінити", del:"Видалити", rename:"Перейменувати", add:"Додати файли", mkdir:"Нова папка", compact:"Оптимізувати архів", fix:"Пофіксити (зашифрувати для гри)", fixConfirm:"Зашифрувати архів (NG), щоб гра його прийняла? Після цього не перейменовуй файл.", fixOk:"Архів пофікшено", unseal:"Розпечатати", unsealConfirm:"Зняти захист (лок) з цього архіву? Файл буде змінено, зроби копію, якщо він важливий.", unsealOk:"Архів розпечатано", unsealClean:"Захисту немає: архів не запечатаний", e_onyx_win:"Розпечатування працює лише у Windows.", e_onyx_missing:"У застосунку немає файлів ONYX (bin/onyx).", e_onyx_keys:"ONYX не зміг завантажити свої ключі (bin/onyx/keys).", e_onyx_fail:"ONYX не зміг обробити архів. Подробиці в журналі застосунку (onyx).", e_onyx_still:"Захист не вдалося зняти повністю, вихідний файл не змінено.", e_already_enc:"Архів уже зашифрований.", e_enc_data:"Дані шифрування (rpfenc.bin) не знайдено або пошкоджено.", e_enc_verify:"Самоперевірка шифрування не пройшла, нічого не записано.", e_ng_rename:"NG-архів прив'язаний до імені файлу, перейменовувати його не можна.", e_bad_rpf:"Заголовок архіву пошкоджено.", reveal:"Відкрити папку гри", reindex:"Перебудувати індекс",
 sel:"Обери файл, щоб переглянути", path:"Шлях", size:"Розмір", stored:"В архіві", kind:"Вигляд", enc2:"Шифрування", prev:"Перегляд", cut:"…показано лише частину", big:"Файл завеликий для перегляду.", dropHint:"Перетягни файли сюди, щоб додати",
 newName:"Нове ім'я", folderName:"Ім'я папки", ok:"ОК", cancel:"Скасувати", confirmDel:"Видалити це з архіву?", confirmRep:"Замінити вибраним файлом?",
 v3d:"3D-перегляд", txEdit:"Текстовий редактор", mOpen:"Відкрити", xmlInHint:"у цю теку", v3Embed:"Вбудовані текстури", v3EmbedNone:"У моделі немає вбудованих текстур", v3Used:"використовується", v3Missing:"Не знайдено для матеріалів: {names}", e_xml_no_tex:"Не знайдено текстури для цього XML. Поклади поруч з XML теку з DDS-файлами (назва теки = назва XML без розширень), як її зберігає експорт.", xmlExpTex:"XML збережено. Текстур: {n}, тека «{f}» (тримай її поруч з XML для імпорту)", navBack:"Назад (Backspace)", navFwd:"Вперед (Alt+Вправо)", navUp:"На рівень вище (Alt+Вгору)", mShow:"Показати в Провіднику", delFs:"Перемістити цей файл у Кошик?", needEdit:"Спочатку увімкни режим правки", txOn:"Увімкнути режим правки", ytEdit:"Редактор текстур", ytAdd:"Додати текстуру", ytFmt:"Формат для PNG/JPG:", ytRepl:"Замінити", ytRen:"Перейменувати", ytExp:"Експорт DDS", ytDel:"Видалити", ytName:"Назва текстури", ytDelQ:"Видалити цю текстуру?", ytCnt:"Текстур: {n}", ytAdded:"Додано: {n}", ytSkip:"вже є: {names}", ytFail:"не вдалося: {n}", ytHint:"Перетягни сюди картинки (DDS, PNG, JPG, BMP, TGA, TIFF), щоб додати текстури", ytMips:"міп.", ytExported:"Експортовано", e_ytd_unsupported:"Цей словник текстур не можна редагувати (підтримується лише формат Legacy/Gen8 з відомими форматами текстур).", e_ytd_dup:"Текстура з такою назвою вже є.", e_ytd_gone:"Сесія редагування застаріла. Закрий редактор і відкрий знову.", e_ytd_name:"Некоректна назва текстури.", e_ytd_conv:"Не вдалося сконвертувати картинку (texconv завершився з помилкою).", e_ytd_too_big:"Словник завеликий для одного запису архіву.", e_ytd_dds_format:"Цей формат DDS гра не підтримує. Використай DXT1/DXT5/BC7/A8R8G8B8 або PNG/JPG.", e_ytd_dds_kind:"Кубічні, об’ємні текстури та масиви не підтримуються.", e_dds_bad:"Файл DDS пошкоджено або обрізано.", dropFs:"Скопіювати перетягнуте в цю теку гри?", dropOver:"Ці файли вже є. Замінити?", fsDone:"Скопійовано: {n}", rpfNew:"Новий RPF архів", rpfPack:"RPF з теки…", rpfName:"Назва нового архіву", rpfDone:"Архів створено, файлів: {n}", rpfSkip:"скрипти (.ysc) пропущено: {n}", e_pack_big:"Забагато даних для пакування (понад 50 000 файлів або 1,5 ГБ).", e_names_overflow:"Забагато файлів або довгі імена для одного архіву. Розділи на кілька архівів.", ctxHint:"ПКМ по файлу або порожньому місцю: дії. Перетягни файли у вікно, щоб додати їх у відкриту папку. Перетягни файл з вікна на робочий стіл, щоб скопіювати його.", dropArch:"Спочатку відкрий папку всередині архіву, потім перетягни файли.", dropAdd:"Додати перетягнуті файли в цю папку?", txSave:"Зберегти", txClose:"Закрити", txFind:"Пошук", txFindPh:"Знайти", txReplPh:"Замінити на", txNext:"Далі", txRepl:"Замінити", txAll:"Замінити все", txWrap:"Перенесення рядків", txChk:"Перевірити XML", txXmlOk:"XML коректний", txXmlBad:"Помилка XML", txSaved:"Збережено в архів", txBadSave:"В XML є помилка. Все одно зберегти?", txDiscard:"Відкинути незбережені зміни?", txNone:"Не знайдено", txRn:"Замінено: {n}", txLn:"Ряд", txCol:"Кол", txLines:"рядків", txMod:"не збережено", txMixed:"Різні переноси рядків приведено до одного", txRO:"Режим правки вимкнено: лише перегляд", e_not_text:"Це не текстовий файл.", e_text_big:"Файл завеликий для редактора (понад 8 МБ).", v3Tex:"Текстури", v3Bones:"Скелет", v3Wire:"Каркас", v3Lod:"Деталізація", v3Obj:"Обʼєкт",v3All:"Усі обʼєкти",v3Tint:"Колір за обʼєктами",v3Vc:"Кольори вершин",v3Nm:"Нормалі моделі",v3Objs:"Обʼєкти",v3Empty:"порожньо",v3ShowAll:"Показати всі",v3HideAll:"Сховати всі",v3OHint:"Галочка = показати. Клік по назві = лише цей обʼєкт.",e_model_empty:"У цьому обʼєкті немає геометрії, яку можна показати.", v3Reset:"Скинути вигляд", v3Close:"Закрити", v3Tris:"трикутників", v3Help:"Тягни: обертати · ПКМ / Shift+тягни: рухати · Колесо: масштаб", v3NoGl:"WebGL недоступний.", e_model_fail:"Не вдалося прочитати модель (підтримуються моделі GTA V Gen8 і геометрія Gen9).", texN:"текстур", noPrevTex:"немає превʼю", xmlx:"Експорт у XML", cwxOpen:"Відкрити в окремому вікні", cwxOpenedK:"RPF Explorer відкрито в окремому вікні", cwxOpenedS:"Він працює окремим процесом і залишиться відкритим, навіть якщо закрити Marly Helper.", cwxGo:"Перейти до вікна", cwxStart:"Відкриваю вікно провідника…", cwxFail:"Не вдалося відкрити вікно провідника", txConv:"Показано XML-вигляд; під час збереження збирається назад у вихідний формат файлу.", xmlxN:"Експорт вибраних у XML ({n})", xmlxAll:"Експорт усіх файлів теки у XML", msClear:"Зняти виділення", selN:"Вибрано: {n}", xmlxNone:"Немає файлів, які можна експортувати у XML", xmlBatchDone:"Експортовано у XML: {n}", xmlBatchTex:"текстур: {n}", xmlBatchSkip:"пропущено: {n}", xmli:"Замінити з XML", xmlIn:"Імпортувати XML-файли", xmlDone:"Імпортовано: {n}", xmlFailed:"не вдалося: {n}", dropXml:"Зібрати перетягнуті XML і додати в цю папку?", xmlConfirm:"Зібрати файл з XML і замінити ним файл в архіві?",
 done:"Готово", extracted:"Витягнуто файлів", working:"Працюю…", copyPath:"Копіювати шлях", copied:"Скопійовано",
 e_no_keys:"Архів зашифрований, а ключі не завантажені.", e_not_found:"Не знайдено.", e_exists:"Файл або папка з такою назвою вже є.", e_bad_name:"Таку назву використовувати не можна.", e_ysc:"Скрипти (.ysc) не можна замінювати й перейменовувати.", e_too_big:"Ресурс завеликий (понад 16 МБ в упакованому вигляді).", e_busy:"Уже триває інша операція. Дочекайся завершення.", e_no_game:"Спершу вкажи папку GTA V.", e_not_rpf:"Це не архів RPF.", e_bad_rpf:"Архів пошкоджений або не підтримується.", e_bad_path:"Некоректний шлях.", e_not_game:"Це не папка GTA V (немає gta5.exe або gta5_enhanced.exe).", e_keys_missing:"Ключі в exe не знайдено.", e_not_dir:"Це не папка.", e_not_file:"Це не файл.", e_names_overflow:"Забагато різних назв для цього архіву.", e_no_conv:"У файлах програми немає конвертера (bin/) або потрібен Windows.", e_xml_unsupported:"Для цього типу файлу немає конвертації в XML.", e_xml_fail:"Не вдалося сконвертувати (причина в дужках і в log.txt). Для імпорту перевір, що XML цілий і отриманий з файлу того ж типу.", e_fail:"Щось пішло не так.", e_x:"Щось пішло не так.", e_toc_size:"Таблиця архіву не вмістилась.", e_is_dir:"Це папка."
}
};
var lang = "en", root = null, S = null, wired = false;
var hist = [], fwdS = [], navSkip = false, cur = "", items = [], sel = -1, ms = {}, edit = false, scope = "all", q = "", results = null, pv = null, pvKey = "", msg = null, prog = null, loading = false, skipKeys = false, started = false, busyD = false, tmr = 0, enc = "";
function L(k) { return (I[lang] && I[lang][k]) || I.en[k] || k; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function $(s) { return root ? root.querySelector(s) : null; }
function live() { return root && root.querySelector("#cwW"); }
function api() { return window.api || {}; }
function errText(code) { var k = "e_" + String(code || "x").replace(/[^a-z]+/gi, "_"); return I[lang][k] || I.en[k] || L("e_x"); }
function fmt(n) { n = Number(n) || 0; if (n < 1024) return n + " B"; if (n < 1048576) return (n / 1024).toFixed(1) + " KB"; if (n < 1073741824) return (n / 1048576).toFixed(1) + " MB"; return (n / 1073741824).toFixed(2) + " GB"; }
function join(a, b) { return a ? a + "/" + b : b; }
function parent(p) { var i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i); }
function base(p) { var i = p.lastIndexOf("/"); return i < 0 ? p : p.slice(i + 1); }
function toast(t, err) { msg = t ? { t: t, err: !!err } : null; var m = $("#rxMsg"); if (m) { m.className = "rx-msg" + (msg ? (msg.err ? " er" : " ok") : ""); m.textContent = msg ? msg.t : ""; } clearTimeout(tmr); if (msg && !msg.err) tmr = setTimeout(function () { toast(""); }, 3500); }

var CSS = ".rx{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;flex:1;min-height:0;width:100%}"
 + ".rx-l,.rx-r{display:flex;flex-direction:column;min-height:0;min-width:0;border:1px solid rgba(128,128,128,.25);border-radius:12px;overflow:hidden}.rx-r{padding:12px;gap:8px;overflow:auto}"
 + ".rx-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px;border-bottom:1px solid rgba(128,128,128,.2)}.rx-bar .mini{margin:0}.rx-bar input{flex:1;min-width:120px;background:rgba(128,128,128,.12);border:1px solid rgba(128,128,128,.25);border-radius:8px;padding:6px 9px;color:inherit;font:inherit;font-size:13px}"
 + ".rx-crumb{display:flex;flex-wrap:wrap;gap:2px;align-items:center;padding:6px 8px;font-size:12.5px;border-bottom:1px solid rgba(128,128,128,.2);color:var(--muted)}.rx-crumb a{cursor:pointer;padding:1px 5px;border-radius:6px;color:inherit}.rx-crumb a:hover{background:rgba(128,128,128,.2)}.rx-crumb b{font-weight:600;color:inherit;padding:1px 5px}"
 + ".rx-list{flex:1;min-height:0;overflow:auto}.rx-row{display:grid;grid-template-columns:20px minmax(0,1fr) 78px 64px;gap:6px;align-items:center;padding:5px 10px;cursor:default;font-size:13px;border-bottom:1px solid rgba(128,128,128,.08)}.rx-row:hover{background:rgba(128,128,128,.1)}.rx-row.rx-sel{background:rgba(128,128,128,.3)}.rx-row .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rx-row .s,.rx-row .t{font-size:12px;color:var(--muted);text-align:right;white-space:nowrap}.rx-row svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;opacity:.8}.rx-row.dnd{outline:2px dashed rgba(128,128,128,.6)}"
 + ".rx-row .p{display:block;font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis}.rx-foot{padding:6px 10px;font-size:12px;color:var(--muted);border-top:1px solid rgba(128,128,128,.2)}.rx-msg{padding:0 10px;font-size:12.5px;min-height:0}.rx-msg.er{color:#f87171;padding:6px 10px}.rx-msg.ok{color:#34d399;padding:6px 10px}"
 + ".rx-r h3{margin:0;font-size:15px;word-break:break-all}.rx-kv{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12.5px}.rx-kv span:nth-child(odd){color:var(--muted)}.rx-kv span:nth-child(even){word-break:break-all}.rx-acts{display:flex;gap:6px;flex-wrap:wrap}.rx-acts .mini{margin:0}"
 + ".rx-pre{margin:0;padding:8px;background:rgba(128,128,128,.12);border-radius:8px;font:12px/1.45 Consolas,monospace;overflow:auto;max-height:46vh;white-space:pre;tab-size:4}.rx-img{max-width:100%;max-height:40vh;object-fit:contain;background:rgba(128,128,128,.12);border-radius:8px;align-self:flex-start}"
 + ".rx-tex{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}.rx-tx{display:flex;flex-direction:column;gap:2px;font-size:12px;min-width:0}.rx-tx .im{aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(rgba(128,128,128,.25) 0 25%,transparent 0 50%) 0 0/12px 12px;border-radius:6px;overflow:hidden;color:var(--muted)}.rx-tx img{max-width:100%;max-height:100%;image-rendering:pixelated}.rx-tx b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rx-tx small{color:var(--muted)}.rx-3d{align-items:flex-start;padding:54px 16px 16px;box-sizing:border-box}.rx-3d .v3{position:relative;width:min(1100px,100%);height:min(760px,calc(100vh - 72px));margin:0 auto;display:flex;flex-direction:column;background:#17181c;color:#e6e6e6;border:1px solid rgba(128,128,128,.4);border-radius:12px;overflow:hidden}.v3b{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid rgba(128,128,128,.3);font-size:12.5px}.v3b label,.v3b .obj,.v3b .lod{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin:0;cursor:pointer}.v3b input[type=checkbox]{width:auto;height:auto;min-width:0;margin:0;flex:none}.v3b .mini{margin:0}.v3b b{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rx-3d .v3{color-scheme:dark}.v3b select{appearance:none;-webkit-appearance:none;background:#23252b url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23aab2c0' stroke-width='1.6'/%3E%3C/svg%3E\") no-repeat right 8px center;color:#e6e6e6;border:1px solid rgba(128,128,128,.4);border-radius:7px;padding:4px 26px 4px 10px;font:inherit;max-width:240px;cursor:pointer;outline:none;transition:border-color .15s}.v3b select:hover,.v3b select:focus{border-color:rgba(160,190,230,.8)}.v3b select option{background:#1d1f24;color:#e6e6e6}.v3b select option:disabled{color:#6b717c}.v3b .sp{flex:1}.v3m{position:relative;flex:1;min-height:0}.v3 canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;background:radial-gradient(#2b2d34,#121316)}.v3o{position:absolute;top:10px;left:10px;bottom:10px;width:min(290px,42%);background:rgba(23,24,28,.96);border:1px solid rgba(128,128,128,.4);border-radius:10px;display:flex;flex-direction:column;overflow:hidden;z-index:2}.v3oh{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid rgba(128,128,128,.3);font-size:12.5px}.v3oh b{flex:1 1 100%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v3oh .mini{margin:0;padding:2px 8px;font-size:11.5px}.v3og{flex:1;min-height:0;overflow:auto;padding:4px 4px}.v3r{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:6px;font-size:12px;cursor:default}.v3r:hover{background:rgba(128,128,128,.16)}.v3r input[type=checkbox]{width:auto;height:auto;min-width:0;margin:0;flex:none;cursor:pointer}.v3r i{width:11px;height:11px;border-radius:3px;flex:none;border:1px solid rgba(255,255,255,.25)}.v3r .v3n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;font-family:Consolas,monospace}.v3r .v3n:hover{text-decoration:underline}.v3r small{color:#9aa0aa;font-size:11px;flex:none}.v3r.v3e{opacity:.5}.v3r.v3e .v3n{cursor:default;text-decoration:none}.v3r.v3f .v3n{color:#8b919c}.v3oi{padding:6px 10px;font-size:11px;color:#9aa0aa;border-top:1px solid rgba(128,128,128,.3)}.v3i{padding:5px 10px;font-size:12px;color:#9aa0aa;border-top:1px solid rgba(128,128,128,.3)}.v3p{position:absolute;top:10px;right:10px;bottom:10px;width:min(380px,46%);background:rgba(23,24,28,.96);border:1px solid rgba(128,128,128,.4);border-radius:10px;display:flex;flex-direction:column;overflow:hidden;z-index:2}.v3ph{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-bottom:1px solid rgba(128,128,128,.3);font-size:12.5px}.v3ph .mini{margin:0;padding:2px 9px}.v3pm{padding:6px 10px;font-size:11.5px;color:#e0a458;border-bottom:1px solid rgba(128,128,128,.3);word-break:break-word}.v3g{overflow:auto;padding:8px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-content:start}.v3c{display:flex;flex-direction:column;gap:3px;min-width:0;padding:6px;border:1px solid rgba(128,128,128,.3);border-radius:8px;cursor:pointer}.v3c:hover{border-color:rgba(160,190,230,.8)}.v3c .tm{height:92px;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(rgba(128,128,128,.25) 0 25%,transparent 0 50%) 0 0/12px 12px;border-radius:5px;overflow:hidden;color:#9aa0aa}.v3c .tm img{max-width:100%;max-height:100%}.v3c b{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v3c small{color:#9aa0aa;font-size:11px}.v3c.used{border-color:rgba(111,208,140,.55)}.v3c.used small{color:#8fd6a5}.v3big{position:absolute;top:10px;left:10px;right:10px;bottom:10px;background:rgba(18,19,22,.98);border:1px solid rgba(128,128,128,.4);border-radius:10px;flex-direction:column;overflow:hidden;z-index:3}.v3bh{display:flex;align-items:center;gap:10px;padding:8px 10px;border-bottom:1px solid rgba(128,128,128,.3);font-size:12.5px}.v3bh .mini{margin:0}.v3bh .sp{flex:1}.v3bm{color:#9aa0aa;font-size:12px}.v3bi{flex:1;min-height:0;overflow:auto;display:flex;align-items:center;justify-content:center;padding:10px;background:repeating-conic-gradient(rgba(128,128,128,.18) 0 25%,transparent 0 50%) 0 0/16px 16px}.v3bi img{max-width:100%;max-height:100%}.rx-prog{height:8px;border-radius:6px;background:rgba(128,128,128,.25);overflow:hidden;margin:10px 0}.rx-prog i{display:block;height:100%;background:#3fb950;width:0}.rx-edit{color:#fbbf24}.rx-mod{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:50}.rx-mod .card{width:min(440px,92vw);padding:20px 22px}.rx-mod .card h3{font-size:15px;margin:0 0 12px}.rx-mod input{width:100%;box-sizing:border-box;margin:10px 0;background:rgba(128,128,128,.12);border:1px solid rgba(128,128,128,.3);border-radius:8px;padding:8px;color:inherit;font:inherit}.rx-mod .b{display:flex;gap:10px;justify-content:flex-end;align-items:center;margin-top:16px}.rx-mod .b .mini{margin:0;min-width:96px;justify-content:center;padding:9px 18px;font-size:13px}.rx-mod .go{margin:0;width:auto;background:var(--accent);color:var(--on-accent);border:1px solid var(--accent)}.rx-mod .go:hover{background:var(--accent);color:var(--on-accent);opacity:.88}.core-top .cw-exit{width:30px;height:30px;padding:0;margin:0 0 0 4px;justify-content:center;border:1px solid var(--line);background:var(--panel);border-radius:9px;color:var(--muted)}.core-top .cw-exit:hover{color:var(--text);background:var(--panel2)}.cw-exit svg{width:15px;height:15px}.rx-nav{display:inline-flex;gap:4px;margin-right:8px}.rx-nb{width:30px;height:26px;padding:0;margin:0;justify-content:center}.rx-nb svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.rx-nb:disabled{opacity:.35;cursor:default}.rx-cfm{z-index:90}.rx-cm{margin:4px 0 14px;font-size:13.5px;line-height:1.5;word-break:break-word;max-height:50vh;overflow:auto}.rx-l.dnd{outline:2px dashed rgba(128,128,128,.7);outline-offset:-4px}.rx-note{padding:5px 10px;font-size:12px;color:var(--muted);border-top:1px solid rgba(128,128,128,.2)}.rx-menu{position:fixed;z-index:80;min-width:240px;background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:4px;box-shadow:0 8px 28px rgba(0,0,0,.4);font-size:13px}.rx-mi{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:7px 12px;border-radius:7px;white-space:nowrap;cursor:default}.rx-mi:hover{background:rgba(128,128,128,.2)}.rx-mi kbd{font:inherit;font-size:11px;color:var(--muted)}.rx-mi.rx-dis{opacity:.4}.rx-mi.rx-dis:hover{background:none}.rx-mi.rx-danger{color:#f87171}.rx-mi.rx-danger:hover{background:rgba(248,113,113,.16)}.rx-mi.rx-danger.rx-dis:hover{background:none}.rx-sep{height:1px;background:var(--line);margin:4px 2px}.rx-pvw{align-items:flex-start;padding:54px 16px 16px;box-sizing:border-box}.rx-pvw .card{width:min(780px,94vw);max-height:calc(100vh - 80px);overflow:auto;margin:0 auto}.rx-pvw .pvb{margin:10px 0}.rx-yt .ytb{flex:1;min-height:0;overflow:auto;padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;align-content:start}.rx-yt .ytc{display:flex;flex-direction:column;gap:5px;min-width:0;padding:8px;border:1px solid var(--line);border-radius:10px;background:rgba(128,128,128,.07)}.rx-yt .yim{height:130px;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(rgba(128,128,128,.25) 0 25%,transparent 0 50%) 0 0/12px 12px;border-radius:6px;overflow:hidden;color:var(--muted)}.rx-yt .yim img{max-width:100%;max-height:100%}.rx-yt .ytc b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.rx-yt .ytc small{color:var(--muted);font-size:11.5px}.rx-yt .yac{display:flex;gap:4px;flex-wrap:wrap;margin-top:2px}.rx-yt .yac .mini{padding:4px 8px;font-size:11.5px}.rx-yt .ythint{grid-column:1/-1;text-align:center;color:var(--muted);padding:40px 10px}.rx-yt.dnd .ytb{outline:2px dashed rgba(128,128,128,.7);outline-offset:-6px}.rx-yt select{background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:5px 8px;font-size:12.5px}.rx-yt .ytl{color:var(--muted);font-size:12px;white-space:nowrap}.rx-ed .mini:disabled{opacity:.45;cursor:default}.rx-ed .go:disabled{opacity:.55;cursor:default}.rx-ed{align-items:flex-start;padding:54px 16px 16px;box-sizing:border-box}.rx-ed .ed{width:min(1200px,100%);height:min(820px,calc(100vh - 72px));margin:0 auto;display:flex;flex-direction:column;background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:12px;overflow:hidden}.rx-ed .edb,.rx-ed .edf{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid var(--line);font-size:12.5px}.rx-ed label{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin:0;cursor:pointer}.rx-ed input[type=checkbox]{width:auto;height:auto;min-width:0;margin:0;flex:none}.rx-ed .edb b{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rx-ed .mini,.rx-ed .go{width:auto;margin:0;flex:none;padding:6px 14px;font-size:12.5px;line-height:1.2;border-radius:8px;white-space:nowrap}.rx-ed .go{font-weight:700}.rx-ed .edm{font-size:12px;color:var(--muted);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rx-ed .edm.er{color:#f87171}.rx-ed .edm.ok{color:#34d399}.rx-ed input[type=text]{width:190px;margin:0;padding:5px 8px;font:12.5px Consolas,monospace}.rx-ed textarea,.rx-ed input{-webkit-user-select:text;user-select:text}.rx-ed textarea{flex:1;min-height:0;width:100%;resize:none;border:0;outline:0;margin:0;padding:8px 10px;background:var(--bg);color:var(--text);font:13px/20px Consolas,\"Courier New\",monospace;tab-size:4;overflow:auto}.rx-ed .edi{padding:5px 10px;font-size:12px;color:var(--muted);border-top:1px solid var(--line)}";

function cwxBlocked() { return !!(window.CWX && !window.CWX.xm && window.CWX.open); }
function html(lg) {
  lang = lg || lang;
  if (cwxBlocked()) {
    edit = false;
    return '<style>' + CSS + '</style><div class="cw-g cwx-ph" id="cwxW"><div class="core-top"><div class="core-tt"><h1>' + esc(L("name")) + '</h1><p class="sub">' + esc(L("sub")) + '</p></div>'
     + '<button class="back cw-exit" data-tool="" title="' + esc(L("back")) + '" aria-label="' + esc(L("back")) + '"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg></button></div>'
     + '<div class="cwx-box"><span class="cwx-k">' + esc(L("cwxOpenedK")) + '</span><span class="cwx-s">' + esc(L("cwxOpenedS")) + '</span><button class="go" data-cw="cwxgo">' + esc(L("cwxGo")) + '</button></div></div>';
  }
  return '<style>' + CSS + '</style><div class="cw-g" id="cwW"><div class="core-top">'
   + '<div class="core-tt"><h1>' + esc(L("name")) + '</h1><p class="sub">' + esc(L("sub")) + '</p></div><div class="core-sv cw-acts" id="cwActs"></div>'
   + '<button class="back cw-exit" data-tool="" title="' + esc(L("back")) + '" aria-label="' + esc(L("back")) + '"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg></button></div>'
   + '<div class="cw-main" id="cwBody"></div></div>';
}
function btn(act, key, cls, extra) { return '<button class="' + (cls || "mini") + '" data-cw="' + act + '"' + (extra || "") + '>' + esc(L(key)) + '</button>'; }
function ico(t) {
  var p = t === "dir" || t === "fsdir" ? '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
    : t === "rpf" ? '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>' : '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>';
  return '<svg viewBox="0 0 24 24">' + p + '</svg>';
}
function typeName(it) { return it.type === "dir" || it.type === "fsdir" ? L("tDir") : it.type === "rpf" ? L("tRpf") : it.kind === "res" ? L("tRes") : L("tBin"); }

function sync() {
  var b = $("#cwBody"), ac = $("#cwActs"); if (!b || !live()) return;
  var s = S || {}, h = "";
  if (ac) {
    var a = (window.CWX && window.CWX.xm) ? "" : btn("cwxopen", "cwxOpen", "mini");
    if (s.gameOk && (s.keys === "ready" || skipKeys)) a += '<span class="cw-chip on"><i></i>' + esc(s.gameKind === "enhanced" ? "Enhanced" : "Legacy") + '</span>' + btn("edit", edit ? "editOn" : "edit", edit ? "mini rx-edit" : "mini") + btn("game", "gameBtn");
    ac.innerHTML = a;
  }
  if (!s.gameOk) {
    h = '<div class="card cw-setup"><h3>' + esc(L("needT")) + '</h3><p class="note">' + esc(L("needD")) + '</p><div class="cw-b">' + btn("detect", "detect", "go", busyD ? " disabled" : "") + btn("game", "pickGame") + '</div>'
      + (busyD ? '<p class="dsum">' + esc(L("busyD")) + '</p>' : msg ? '<p class="dsum ' + (msg.err ? "erc" : "okc") + '">' + esc(msg.t) + '</p>' : '') + '</div>';
    b.innerHTML = h; return;
  }
  if (!(s.keys === "ready" || skipKeys)) {
    if (s.keys === "error") {
      var f = s.keysFound ? ' (AES ' + (s.keysFound.aes ? "ok" : "no") + (s.keysErr === "keys-magic" ? ', NG ' + s.keysFound.ng + '/101, tables ' + s.keysFound.tb + '/272, ' + (s.keysFound.stage || '') : '') + ')' : "";
      b.innerHTML = '<div class="card cw-setup"><h3>' + esc(L("keysT")) + '</h3><p class="dsum erc">' + esc(L(s.keysErr === "keys-magic" ? "keysMagic" : s.keysErr === "no-magic" ? "keysNoMagic" : "keysBad")) + esc(f) + '</p><div class="cw-b">' + btn("keys", "retry", "go") + btn("skip", "keysSkip") + btn("game", "gameBtn") + '</div></div>';
    } else {
      var pc = Math.round((s.keysP || 0) * 100);
      b.innerHTML = '<div class="card cw-setup"><h3>' + esc(L("keysT")) + '</h3><p class="note">' + esc(L("keysD")) + '</p><div class="rx-prog"><i style="width:' + pc + '%"></i></div><p class="dsum">' + pc + '%</p></div>';
    }
    return;
  }
  if (!$("#rxList")) { b.innerHTML = shell(); }
  drawBar(); drawCrumb(); drawList(); drawNote(); drawFoot();
}
function shell() {
  return '<div class="rx"><div class="rx-l"><div class="rx-bar" id="rxBar"></div><div class="rx-crumb" id="rxCrumb"></div><div class="rx-list" id="rxList"></div><div class="rx-note" id="rxNote"></div><div class="rx-msg" id="rxMsg"></div><div class="rx-foot" id="rxFoot"></div></div></div>';
}
function drawBar() {
  var el = $("#rxBar"); if (!el) return;
  var inp = el.querySelector("input"), val = inp ? inp.value : q, had = inp && document.activeElement === inp;
  var s = S || {}, ready = s.idx && s.idx.state === "done";
  el.innerHTML = '<input id="rxQ" placeholder="' + esc(scope === "all" ? L("search") : L("filter")) + '" value="' + esc(val) + '">'
    + '<button class="mini" data-cw="scope">' + esc(scope === "all" ? L("scopeAll") : L("scopeHere")) + '</button>'
    + btn("reveal", "reveal");
  var n = el.querySelector("input"); if (had && n) { n.focus(); try { n.setSelectionRange(val.length, val.length); } catch (e) { /* ok */ } }
  void ready;
}
function navHtml() {
  function b(a, svg, off, tip) { return '<button class="mini rx-nb" data-cw="' + a + '" title="' + esc(tip) + '"' + (off ? " disabled" : "") + '><svg viewBox="0 0 24 24">' + svg + '</svg></button>'; }
  return '<span class="rx-nav">' + b("hback", '<path d="M15 6l-6 6 6 6"/>', !hist.length, L("navBack")) + b("hfwd", '<path d="M9 6l6 6-6 6"/>', !fwdS.length, L("navFwd")) + b("up", '<path d="M6 15l6-6 6 6"/>', !cur, L("navUp")) + '</span>';
}
function drawCrumb() {
  var el = $("#rxCrumb"); if (!el) return;
  var parts = cur ? cur.split("/") : [], h = navHtml() + '<a data-go="">' + esc(L("root")) + '</a>', acc = "";
  parts.forEach(function (p, i) { acc = join(acc, p); h += ' / ' + (i === parts.length - 1 ? '<b>' + esc(p) + '</b>' : '<a data-go="' + esc(acc) + '">' + esc(p) + '</a>'); });
  el.innerHTML = h + (enc ? ' <span style="margin-left:auto">' + esc(L("enc2")) + ': ' + esc(enc) + '</span>' : "");
}
function visible() {
  if (q && scope === "here") { var w = q.toLowerCase(); return items.filter(function (it) { return it.name.toLowerCase().indexOf(w) >= 0; }); }
  return items;
}
var LIM = 1500, XMLX = /\.(ypt|ydr|ydd|yft|ytd|yld|ycd|ybn|ynd|ynv|ywr|yvr|yed|yfd|ymap|ytyp|ymt|meta|pso|rbf|awc|fxc|ypdb|cut)$/i;
function drawList() {
  var el = $("#rxList"); if (!el) return;
  var h = "";
  if (q && scope === "all") {
    if (!results) h = '<div class="rx-foot">' + esc(L("working")) + '</div>';
    else results.items.forEach(function (r, i) {
      var t = r.f === 1 ? "dir" : r.f === 2 ? "rpf" : "file";
      h += '<div class="rx-row" data-r="' + i + '" title="' + esc(r.path) + '">' + ico(t) + '<span class="n">' + esc(base(r.path)) + '<span class="p">' + esc(parent(r.path)) + '</span></span><span class="s">' + (r.f === 1 ? "" : esc(fmt(r.size))) + '</span><span class="t"></span></div>';
    });
    el.innerHTML = h || '<div class="rx-foot">' + esc(L("empty")) + '</div>'; return;
  }
  var v = visible();
  if (loading) { el.innerHTML = '<div class="rx-foot">' + esc(L("working")) + '</div>'; return; }
  v.slice(0, LIM).forEach(function (it) {
    var i = items.indexOf(it), isSel = i === sel || !!ms[i];
    h += '<div class="rx-row' + (isSel ? " rx-sel" : "") + '" data-i="' + i + '"' + (canDrag(it) ? ' draggable="true"' : "") + '>' + ico(it.type) + '<span class="n">' + esc(it.name) + (it.enc ? ' <small style="color:var(--muted)">🔒</small>' : "") + '</span><span class="s">' + (it.type === "dir" || it.type === "fsdir" ? "" : esc(fmt(it.size))) + '</span><span class="t">' + esc(typeName(it)) + '</span></div>';
  });
  el.innerHTML = h || '<div class="rx-foot">' + esc(L("empty")) + '</div>';
}
function drawFoot() {
  var el = $("#rxFoot"); if (!el) return;
  var s = S || {}, t = "";
  if (prog) t = L("working") + " " + Math.round((prog.p || 0) * 100) + "%";
  else if (q && scope === "all" && results) t = results.total + " " + L("results") + (results.total > results.items.length ? " (" + results.items.length + ")" : "");
  else if (s.idx && s.idx.state === "run") t = L("indexing") + " " + s.idx.done + "/" + s.idx.total + " · " + (s.idx.count || 0);
  else if (s.idx && s.idx.state === "done") t = (s.idx.count || 0) + " " + L("indexed");
  else if (scope === "all") t = L("noIdx");
  if (isMS()) t = L("selN").replace("{n}", msCount()) + (t ? " · " + t : "");
  var v = visible(); if (v.length > LIM) t += (t ? " · " : "") + L("more").replace("{n}", LIM);
  if (s.busy) t += (t ? " · " : "") + L("working");
  el.textContent = t;
}
function selItem() { return sel >= 0 ? items[sel] : null; }
// мультивыделение: ms = {индекс в items: true}, действует, когда выбрано больше одного; sel = опорная строка (для Shift)
function msCount() { return Object.keys(ms).length; }
function isMS() { return msCount() > 1; }
function selItems() { if (isMS()) return Object.keys(ms).map(Number).sort(function (a, b) { return a - b; }).map(function (i) { return items[i]; }).filter(Boolean); var it = selItem(); return it ? [it] : []; }
function selectAll() {
  if (q && scope === "all") return;
  var v = visible().slice(0, LIM); ms = {};
  v.forEach(function (it) { ms[items.indexOf(it)] = true; });
  if (v.length < 2) ms = {};
  if (v.length) sel = items.indexOf(v[0]);
  drawList(); drawFoot();
}
function xmlCandidates(list) { return list.filter(function (it) { return it.type === "file" && XMLX.test(it.name); }); }
function fullOf(it) { return join(cur, it.name); }
function isArchCtx() { return cur && cur.toLowerCase().indexOf(".rpf") >= 0; }
function drawNote() { var el = $("#rxNote"); if (el) el.textContent = (edit ? L("editNote") + " " : "") + L("ctxHint"); }
// BC7 в превью: разжимает видеокарта (WebGL2, EXT_texture_compression_bptc), результат кладётся в картинку
function fillBc7(el, list) {
  var imgs = el.querySelectorAll("img[data-bc7]"); if (!imgs.length) return;
  var cv = document.createElement("canvas"), gl = cv.getContext("webgl2", { preserveDrawingBuffer: true }), ext = gl && gl.getExtension("EXT_texture_compression_bptc");
  if (!gl || !ext) return;
  function sh(t, src) { var x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); return x; }
  var pg = gl.createProgram();
  gl.attachShader(pg, sh(gl.VERTEX_SHADER, "#version 300 es\nout vec2 tc; void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); tc = vec2(p.x, 1.0 - p.y); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }"));
  gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, "#version 300 es\nprecision mediump float; in vec2 tc; uniform sampler2D s; out vec4 o; void main(){ o = texture(s, tc); }"));
  gl.linkProgram(pg); gl.useProgram(pg);
  Array.prototype.forEach.call(imgs, function (img) {
    var t = list.filter(function (x) { return x.name === img.getAttribute("data-bc7"); })[0]; if (!t || !t.bc7) return;
    try {
      cv.width = t.pw; cv.height = t.ph; gl.viewport(0, 0, t.pw, t.ph);
      var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.compressedTexImage2D(gl.TEXTURE_2D, 0, ext.COMPRESSED_RGBA_BPTC_UNORM_EXT, t.pw, t.ph, 0, new Uint8Array(b64buf(t.bc7)));
      gl.drawArrays(gl.TRIANGLES, 0, 3); img.src = cv.toDataURL("image/png"); gl.deleteTexture(tx);
    } catch (e) { /* без превью */ }
  });
}
function hexdump(b64, offset) {
  var bin = atob(b64), out = [];
  for (var i = 0; i < bin.length; i += 16) {
    var hx = "", tx = "";
    for (var j = 0; j < 16; j++) { if (i + j < bin.length) { var c = bin.charCodeAt(i + j); hx += (c < 16 ? "0" : "") + c.toString(16) + " "; tx += c >= 32 && c < 127 ? String.fromCharCode(c) : "."; } else hx += "   "; }
    out.push(("0000000" + (i + (offset || 0)).toString(16)).slice(-8) + "  " + hx + " " + tx);
  }
  return out.join("\n");
}
function pvHtml() {
  if (!pv) return '<p class="note">' + esc(L("working")) + '</p>';
  if (pv.error) return '<p class="dsum erc">' + esc(errText(pv.error)) + '</p>';
  if (pv.kind === "big") return '<p class="note">' + esc(L("big")) + '</p>';
  if (pv.kind === "ytd") return '<p class="note" style="margin:0">' + pv.total + " " + esc(L("texN")) + '</p><div class="rx-tex">' + pv.list.map(function (t) { return '<div class="rx-tx"><div class="im">' + (t.url ? '<img src="' + t.url + '">' : t.bc7 ? '<img data-bc7="' + esc(t.name) + '">' : esc(L("noPrevTex"))) + '</div><b>' + esc(t.name) + '</b><small>' + t.width + "x" + t.height + " · " + esc(t.format) + " · " + t.levels + '</small></div>'; }).join("") + "</div>";
  if (pv.kind === "image") return '<img class="rx-img" src="' + pv.url + '">';
  if (pv.kind === "text") return '<pre class="rx-pre">' + esc(pv.text) + '</pre>' + (pv.cut ? '<p class="note">' + esc(L("cut")) + '</p>' : "");
  return '<pre class="rx-pre">' + esc(hexdump(pv.hex)) + '</pre>' + (pv.cut ? '<p class="note">' + esc(L("cut")) + '</p>' : "");
}

// ----- загрузка -----
function load(path, keepSel) {
  var A = api();
  if (!navSkip && path !== cur) { hist.push(cur); if (hist.length > 100) hist.shift(); fwdS = []; }
  navSkip = false; loading = true; cur = path; q = ""; results = null; ms = {}; if (!keepSel) { sel = -1; pv = null; pvKey = ""; }
  sync();
  A.cwLs(path).then(function (r) {
    loading = false;
    if (!r || !r.ok) { items = []; toast(errText(r && r.error), true); enc = ""; }
    else { items = r.items || []; enc = r.enc || ""; if (keepSel && typeof keepSel === "string") { sel = items.findIndex(function (x) { return x.name.toLowerCase() === keepSel.toLowerCase(); }); } }
    sync();
  }, function () { loading = false; toast(L("e_x"), true); sync(); });
}
function openPreview(it) {
  var A = api(), fp = fullOf(it), m = document.createElement("div"), h;
  m.className = "rx-mod rx-pvw"; pv = null;
  h = '<div class="card"><h3>' + esc(it.name) + '</h3><div class="rx-kv"><span>' + esc(L("path")) + '</span><span>' + esc(fp) + '</span><span>' + esc(L("kind")) + '</span><span>' + esc(typeName(it)) + '</span>';
  if (it.size != null) h += '<span>' + esc(L("size")) + '</span><span>' + esc(fmt(it.size)) + '</span>';
  if (it.csize != null) h += '<span>' + esc(L("stored")) + '</span><span>' + esc(fmt(it.csize)) + '</span>';
  if (it.enc) h += '<span>' + esc(L("enc2")) + '</span><span>' + esc(L("enc")) + '</span>';
  m.innerHTML = h + '</div><div class="pvb">' + pvHtml() + '</div><div class="b"><button class="mini go">' + esc(L("txClose")) + '</button></div></div>';
  document.body.appendChild(m);
  var body = m.querySelector(".pvb");
  function close() { document.removeEventListener("keydown", onKey, true); m.remove(); }
  function onKey(e) { if (e.key === "Escape") close(); }
  document.addEventListener("keydown", onKey, true);
  m.querySelector(".go").onclick = close;
  m.addEventListener("mousedown", function (e) { if (e.target === m) close(); });
  A.cwPreview(fp).then(function (r) { pv = r && r.ok ? r : { error: r && r.error }; body.innerHTML = pvHtml(); if (pv.kind === "ytd") fillBc7(m, pv.list); }, function () { pv = { error: "fail" }; body.innerHTML = pvHtml(); });
}
var sT = 0;
function doSearch() {
  clearTimeout(sT);
  if (!q) { results = null; sync(); return; }
  if (scope !== "all") { sync(); return; }
  results = null; drawList();
  sT = setTimeout(function () { var my = q; api().cwSearch(my).then(function (r) { if (my !== q) return; results = r && r.ok ? r : { items: [], total: 0 }; drawList(); drawFoot(); }); }, 180);
}
function ask(title, def) {
  return new Promise(function (res) {
    var m = document.createElement("div"); m.className = "rx-mod";
    m.innerHTML = '<div class="card"><h3>' + esc(title) + '</h3><input value="' + esc(def || "") + '"><div class="b"><button class="mini" data-x="0">' + esc(L("cancel")) + '</button><button class="mini go" data-x="1">' + esc(L("ok")) + '</button></div></div>';
    document.body.appendChild(m);
    var inp = m.querySelector("input"); inp.focus(); inp.select();
    var close = function (v) { m.remove(); res(v); };
    m.addEventListener("click", function (e) { var t = e.target.closest("[data-x]"); if (t) close(t.dataset.x === "1" ? inp.value.trim() : null); else if (e.target === m) close(null); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") close(inp.value.trim()); else if (e.key === "Escape") close(null); });
  });
}
var cfmN = 0;
// Своё окно подтверждения вместо window.confirm: в Electron на Windows после системного confirm/alert поля ввода перестают принимать клавиатуру
function cfm(msg) {
  return new Promise(function (res) {
    var prev = document.activeElement, m = document.createElement("div");
    m.className = "rx-mod rx-cfm";
    m.innerHTML = '<div class="card"><div class="rx-cm">' + esc(msg).replace(/\n/g, "<br>") + '</div><div class="b"><button class="mini" data-x="0">' + esc(L("cancel")) + '</button><button class="mini go" data-x="1">' + esc(L("ok")) + '</button></div></div>';
    document.body.appendChild(m); cfmN++;
    m.querySelector(".go").focus();
    function done(v) {
      document.removeEventListener("keydown", onKey, true); m.remove(); cfmN--;
      if (prev && prev.focus && document.body.contains(prev)) { try { prev.focus(); } catch (x) { /* элемента уже нет */ } }
      res(v);
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(false); }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); done(true); }
    }
    document.addEventListener("keydown", onKey, true);
    m.addEventListener("click", function (e) { var t = e.target.closest("[data-x]"); if (t) done(t.dataset.x === "1"); else if (e.target === m) done(false); });
  });
}
function afterOp(p, okMsg) {
  prog = null; if (!p) return;
  p.then(function (r) {
    prog = null;
    if (r && r.ok) { toast((typeof okMsg === "function" ? okMsg(r) : okMsg) || L("done"), false); var keep = selItem() && selItem().name; load(cur, keep || true); }
    else if (r && r.error !== "cancel") toast(errText(r.error) + (r.why ? " [" + String(r.why).slice(0, 160) + "]" : ""), true);
    syncStatus();
  }, function () { prog = null; toast(L("e_x"), true); });
}
function syncStatus() { var A = api(); if (A.cwStatus) A.cwStatus().then(function (s) { if (s) { S = s; if (live()) sync(); } }); }

var EDITACT = ["replace", "rename", "del", "add", "addto", "mkdir", "xmli", "xmlin", "compact", "fix", "unseal", "rpfnew", "rpfpack"];
function act(a) {
  if (EDITACT.indexOf(a) >= 0 && !edit) { toast(L("needEdit"), true); return; }
  var A = api(), it = selItem(), fp = it ? fullOf(it) : "";
  if (a === "detect") { busyD = true; toast(""); sync(); A.cwDetectGame().then(function (r) { busyD = false; if (r && r.status) S = r.status; var f = r && r.list && r.list[0]; toast(f ? L("gFound") + ": " + f.source + " · " + f.path : L("gNone"), !f); sync(); begin(); }, function () { busyD = false; sync(); }); }
  else if (a === "game") A.cwPickGame({ title: L("pickGame") }).then(function (r) { if (r && r.ok) { S = r.status; started = false; cur = ""; hist = []; fwdS = []; items = []; sel = -1; ms = {}; skipKeys = false; toast(""); sync(); begin(); } else if (r && r.error !== "cancel") toast(errText(r.error), true); });
  else if (a === "keys") { skipKeys = false; A.cwKeys().then(function (r) { if (r && r.status) S = r.status; sync(); if (r && r.ok) begin(); }, function () { syncStatus(); }); }
  else if (a === "skip") { skipKeys = true; begin(); }
  else if (a === "edit") { edit = !edit; sync(); }
  else if (a === "scope") { scope = scope === "all" ? "here" : "all"; results = null; doSearch(); sync(); }
  else if (a === "up") { if (cur) load(parent(cur)); }
  else if (a === "hback") { if (hist.length) { fwdS.push(cur); navSkip = true; load(hist.pop()); } }
  else if (a === "hfwd") { if (fwdS.length) { hist.push(cur); navSkip = true; load(fwdS.pop()); } }
  else if (a === "reveal") A.cwReveal();
  else if (a === "copy") { try { navigator.clipboard.writeText(fp); toast(L("copied"), false); } catch (e) { /* нет буфера */ } }
  else if (a === "extract") afterOp(A.cwExtract(fp));
  else if (a === "xdir") afterOp(A.cwExtractDir(it && (it.type === "dir" || it.type === "rpf") ? fp : cur), null);
  else if (a === "replace") { cfm(L("confirmRep") + "\n" + fp).then(function (ok) { if (ok) { prog = { p: 0 }; afterOp(A.cwReplace(fp)); } }); }
  else if (a === "del") { cfm(L(it.fs ? "delFs" : "confirmDel") + "\n" + fp).then(function (ok) { if (ok) { prog = { p: 0 }; sel = -1; ms = {}; afterOp(it.fs ? A.cwFsOp("delete", fp) : A.cwDelete(fp)); } }); }
  else if (a === "open") { if (it) load(fp); }
  else if (a === "xmlin") xmlImportInto(cur, null);
  else if (a === "rpfnew") ask(L("rpfName"), "new.rpf").then(function (n) { if (n) rpfCreate(n, false); });
  else if (a === "rpfpack") rpfCreate("", true);
  else if (a === "pv") { if (it) openPreview(it); }
  else if (a === "ytd") { if (it) openYtd(it); }
  else if (a === "v3d") open3d(fp, it.name);
  else if (a === "txed") openText(fp, it.name, YMTX.test(it.name) && !(it.kind === "bin" && TEXTX.test(it.name)));
  else if (a === "xmlx") { prog = { p: 0 }; afterOp(A.cwExportXml(fp), function (r) { return r.textures ? L("xmlExpTex").replace("{n}", r.textures).replace("{f}", r.folder) : ""; }); }
  else if (a === "xmli") { cfm(L("xmlConfirm") + "\n" + fp).then(function (ok) { if (ok) { prog = { p: 0 }; afterOp(A.cwImportXml(fp)); } }); }
  else if (a === "rename") ask(L("newName"), it.name).then(function (n) { if (n && n !== it.name) { prog = { p: 0 }; afterOp(it.fs ? A.cwFsOp("rename", fp, n) : A.cwRename(fp, n)); } });
  else if (a === "showfs") { if (it) A.cwFsOp("reveal", fp); }
  else if (a === "cwxopen") cwxOpen();
  else if (a === "xmlxm") xmlBatch(selItems());
  else if (a === "xmlxall") xmlBatch(items);
  else if (a === "msclear") { ms = {}; drawList(); drawFoot(); }
  else if (a === "mkdir") ask(L("folderName"), "").then(function (n) { if (n) { prog = { p: 0 }; afterOp(A.cwMkdir(it && it.type === "dir" && false ? fp : cur, n)); } });
  else if (a === "add") { prog = { p: 0 }; afterOp(A.cwAdd(cur)); }
  else if (a === "addto") { if (it && it.type === "fsdir") fsCopyInto(null, false, true, fp); else if (it) { prog = { p: 0 }; afterOp(A.cwAdd(fp)); } }
  else if (a === "fix") { var fxp = it && it.type === "rpf" ? fp : (cur.toLowerCase().slice(-4) === ".rpf" ? cur : topOf(cur)); cfm(L("fixConfirm") + "\n" + fxp).then(function (ok) { if (ok) { prog = { p: 0 }; afterOp(A.cwFix(fxp), function () { return L("fixOk"); }); } }); }
  else if (a === "unseal") { var usp = it && it.type === "rpf" ? fp : (cur.toLowerCase().slice(-4) === ".rpf" ? cur : topOf(cur)); cfm(L("unsealConfirm") + "\n" + usp).then(function (ok) { if (ok) { prog = { p: 0 }; afterOp(A.cwUnseal(usp), function (r) { return r && r.changed ? L("unsealOk") : L("unsealClean"); }); } }); }
  else if (a === "compact") { prog = { p: 0 }; afterOp(A.cwCompact(it && it.type === "rpf" ? fp : topOf(cur))); }
}
function topOf(p) { var m = p.match(/^(.*?\.rpf)(\/|$)/i); return m ? m[1] : p; }

function fsCopyInto(ps, over, asked, dir) {
  var A = api(); if (!A.cwFsCopy) return;
  var tgt = dir || cur;
  if (!over && !asked && ps && ps.length) {
    var nm = ps.slice(0, 8).map(function (x) { return x.split(/[\\/]/).pop(); }).join("\n") + (ps.length > 8 ? "\n..." : "");
    cfm(L("dropFs") + "\n" + (tgt || "/") + "\n\n" + nm).then(function (ok) { if (ok) fsCopyInto(ps, false, true, dir); });
    return;
  }
  prog = { p: 0 }; sync();
  A.cwFsCopy(tgt, ps || [], !!over).then(function (r) {
    prog = null;
    if (r && r.ok) { toast(L("fsDone").replace("{n}", r.done), false); load(cur, true); syncStatus(); }
    else if (r && r.error === "exists" && r.names) { cfm(L("dropOver") + "\n" + r.names.slice(0, 8).join("\n")).then(function (ok) { if (ok) fsCopyInto(r.paths || ps, true, true, dir); else sync(); }); return; }
    else if (r && r.error !== "cancel") toast(errText(r.error), true);
    sync();
  }, function () { prog = null; toast(L("e_x"), true); sync(); });
}
function canDrag(it) { return it.type !== "fsdir" && (it.fs ? it.type === "rpf" : isArchCtx()); }
function wireDrop(el) {
  function has(e) { var t = e.dataTransfer && e.dataTransfer.types; return !!t && Array.prototype.indexOf.call(t, "Files") >= 0; }
  function box() { return $(".rx-l"); }
  el.addEventListener("dragover", function (e) { if (!has(e) || !$("#rxList")) return; e.preventDefault(); var b = box(); if (b) b.classList.add("dnd"); });
  el.addEventListener("dragleave", function (e) { if (e.relatedTarget && el.contains(e.relatedTarget)) return; var b = box(); if (b) b.classList.remove("dnd"); });
  el.addEventListener("drop", function (e) {
    var b = box(); if (b) b.classList.remove("dnd");
    if (!has(e) || !$("#rxList")) return; e.preventDefault();
    var A = api(), ps = [];
    Array.prototype.forEach.call(e.dataTransfer.files || [], function (f) { var p = A.pathForFile ? A.pathForFile(f) : ""; if (p) ps.push(p); });
    if (!ps.length) return;
    if (!edit) { toast(L("needEdit"), true); return; }
    if (!isArchCtx()) { fsCopyInto(ps, false); return; }
    var row = e.target.closest ? e.target.closest("[data-i]") : null, it = row ? items[+row.dataset.i] : null;
    if (it && it.type === "file" && ps.length === 1) {
      cfm(L("confirmRep") + "\n" + fullOf(it)).then(function (ok) { if (ok) { prog = { p: 0 }; sync(); afterOp(A.cwReplace(fullOf(it), ps[0])); } });
    } else if (S && S.xml && ps.every(function (x) { return IMPX.test(x); })) {
      var nx = ps.slice(0, 8).map(function (x) { return x.split(/[\\/]/).pop(); }).join("\n") + (ps.length > 8 ? "\n..." : "");
      cfm(L("dropXml") + "\n" + cur + "\n\n" + nx).then(function (ok) { if (ok) xmlImportInto(cur, ps); });
    } else {
      var nm = ps.slice(0, 8).map(function (x) { return x.split(/[\\/]/).pop(); }).join("\n") + (ps.length > 8 ? "\n..." : "");
      cfm(L("dropAdd") + "\n" + cur + "\n\n" + nm).then(function (ok) { if (ok) { prog = { p: 0 }; sync(); afterOp(A.cwAdd(cur, ps)); } });
    }
  });
}
var ctx = null;
function closeCtx() { if (!ctx) return; ctx.remove(); ctx = null; document.removeEventListener("mousedown", ctxOut, true); document.removeEventListener("keydown", ctxKey, true); window.removeEventListener("blur", closeCtx); }
function ctxOut(e) { if (ctx && !ctx.contains(e.target)) closeCtx(); }
function ctxKey(e) { if (e.key === "Escape") closeCtx(); }
function ctxMulti() {
  var out = [], n = xmlCandidates(selItems()).length;
  if (S && S.xml && n) out.push({ a: "xmlxm", t: L("xmlxN").replace("{n}", n), d: false, kb: "", dg: false });
  if (out.length) out.push({ sep: 1 });
  out.push({ a: "msclear", t: L("msClear"), d: false, kb: "Esc", dg: false });
  return out;
}
function ctxItems(it, canX) {
  var out = [], inArch = isArchCtx();
  function mi(a, k, d, kb, danger) { out.push({ a: a, t: L(k), d: !!d, kb: kb || "", dg: !!danger }); }
  function sep() { if (out.length && !out[out.length - 1].sep) out.push({ sep: 1 }); }
  if (it) {
    var isF = it.type === "file", isR = it.type === "rpf", isD = it.type === "dir" || it.type === "fsdir", real = !!it.fs || it.type === "fsdir";
    if (isD || isR) mi("open", "mOpen");
    if (isF) {
      if ((it.kind === "bin" && TEXTX.test(it.name)) || (YMTX.test(it.name) && S && S.xml)) mi("txed", "txEdit");
      if (it.kind === "res" && /\.ytd$/i.test(it.name)) mi("ytd", "ytEdit");
      mi("pv", "prev");
      if (/\.(ydr|ydd|yft)$/i.test(it.name)) mi("v3d", "v3d");
    }
    sep();
    if (isD && (it.type === "fsdir" || inArch)) mi("addto", "add", !edit);
    if (isF || isR) mi("extract", "extract");
    if (isR || it.type === "dir") mi("xdir", "extractDir");
    if (real) mi("showfs", "mShow");
    mi("copy", "copyPath");
    if (S && S.xml && isF && canX) { mi("xmlx", "xmlx"); if (inArch) mi("xmli", "xmli", !edit); }
    if (inArch && S && S.xml) mi("xmlin", "xmlIn", !edit, L("xmlInHint"));
    if (inArch || (it.fs && isR)) {
      sep();
      if (inArch && (isF || isR)) mi("replace", "replace", !edit);
      if (inArch && isR) mi("compact", "compact", !edit);
      if (isR) { mi("fix", "fix", !edit); mi("unseal", "unseal", !edit); }
      mi("rename", "rename", !edit, "F2");
      sep();
      mi("del", "del", !edit, "Del", true);
    }
  } else {
    if (cur && inArch) {
      mi("xdir", "extractDir"); sep();
      mi("add", "add", !edit); mi("mkdir", "mkdir", !edit);
      if (S && S.xml) mi("xmlin", "xmlIn", !edit);
      sep();
    }
    if (cur && inArch && S && S.xml && xmlCandidates(items).length) { mi("xmlxall", "xmlxAll"); sep(); }
    mi("rpfnew", "rpfNew", !edit); mi("rpfpack", "rpfPack", !edit);
    if (cur && inArch && cur.toLowerCase().slice(-4) === ".rpf") { sep(); mi("compact", "compact", !edit); mi("fix", "fix", !edit); mi("unseal", "unseal", !edit); }
  }
  while (out.length && out[out.length - 1].sep) out.pop();
  return out;
}
function openCtx(x, y, list) {
  closeCtx(); if (!list.length) return;
  var m = document.createElement("div"); m.className = "rx-menu";
  m.innerHTML = list.map(function (o) {
    if (o.sep) return '<div class="rx-sep"></div>';
    return '<div class="rx-mi' + (o.d ? " rx-dis" : "") + (o.dg ? " rx-danger" : "") + '" data-a="' + o.a + '"' + (o.d ? ' title="' + esc(L("needEdit")) + '"' : "") + '><span>' + esc(o.t) + '</span>' + (o.kb ? '<kbd>' + esc(o.kb) + '</kbd>' : "") + '</div>';
  }).join("");
  document.body.appendChild(m);
  var w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.max(4, Math.min(x, window.innerWidth - w - 4)) + "px"; m.style.top = Math.max(4, Math.min(y, window.innerHeight - h - 4)) + "px";
  m.addEventListener("click", function (e) { var t = e.target.closest("[data-a]"); if (!t || t.classList.contains("rx-dis")) return; var a = t.dataset.a; closeCtx(); act(a); });
  m.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  ctx = m; document.addEventListener("mousedown", ctxOut, true); document.addEventListener("keydown", ctxKey, true); window.addEventListener("blur", closeCtx);
}
// F2 и Delete работают для выбранной строки, пока не открыто другое окно
function onKeys(e) {
  if (!live() || cfmN || ctx || document.querySelector(".rx-mod")) return;
  var tg = e.target && e.target.tagName; if (tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT") return;
  if (e.key === "Backspace" || (e.altKey && e.key === "ArrowLeft")) { e.preventDefault(); act("hback"); return; }
  if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); act("hfwd"); return; }
  if (e.altKey && e.key === "ArrowUp") { e.preventDefault(); act("up"); return; }
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyA") { e.preventDefault(); selectAll(); return; }
  if (e.key === "Escape" && isMS()) { ms = {}; drawList(); drawFoot(); return; }
  if (isMS()) return;
  if (sel < 0 || !items[sel]) return;
  if (e.key === "F2") { e.preventDefault(); act("rename"); }
  else if (e.key === "Delete") { e.preventDefault(); act("del"); }
}
function onCtx(e) {
  if (!live()) return;
  var l = e.target.closest ? e.target.closest("#rxList") : null; if (!l) return;
  e.preventDefault();
  if (q && scope === "all") return;
  var row = e.target.closest("[data-i]"), it = null;
  var ri = row ? +row.dataset.i : -1, multi = row && isMS() && ms[ri];
  if (multi) { it = items[ri]; } else if (row) { ms = {}; sel = ri; it = items[sel]; } else { ms = {}; sel = -1; }
  drawList(); drawFoot();
  var x = e.clientX, y = e.clientY, my = sel, A = api();
  if (multi) { openCtx(x, y, ctxMulti()); return; }
  function show(can) { if (sel === my) openCtx(x, y, ctxItems(it, can)); }
  if (it && it.type === "file" && S && S.xml && XMLX.test(it.name)) {
    if (it.kind === "res") show(true);
    else if (A.cwXmlCan) A.cwXmlCan(fullOf(it)).then(function (r) { show(!!(r && r.ok && r.can)); }, function () { show(false); });
    else show(false);
  } else show(false);
}
function rpfCreate(name, pack) {
  var A = api(); if (!A.cwRpfNew) return;
  prog = { p: 0 };
  A.cwRpfNew(cur, name, pack).then(function (r) {
    prog = null;
    if (r && r.ok) {
      toast(L("rpfDone").replace("{n}", r.files || 0) + (r.skipped && r.skipped.length ? " · " + L("rpfSkip").replace("{n}", r.skipped.length) : ""), false);
      load(cur, r.name || true); syncStatus();
    } else if (r && r.error !== "cancel") toast(errText(r.error), true);
    sync();
  }, function () { prog = null; toast(L("e_x"), true); sync(); });
}
function cwxOpen() {
  var A = api(); if (!A.cwxOpen) return;
  toast(L("cwxStart"));
  A.cwxOpen({ lang: lang, theme: document.documentElement.getAttribute("data-theme") }).then(function (r) { toast(r && r.ok ? "" : L("cwxFail"), !(r && r.ok)); }, function () { toast(L("cwxFail"), true); });
}
function xmlBatch(list) {
  var A = api(); if (!A.cwExportXmlBatch) return;
  var paths = xmlCandidates(list).map(fullOf);
  if (!paths.length) { toast(L("xmlxNone"), true); return; }
  prog = { p: 0 }; toast(""); drawFoot();
  A.cwExportXmlBatch(paths).then(function (r) {
    prog = null;
    if (r && r.ok) {
      var bad = r.failed || [], sk = r.skipped || [];
      toast(L("xmlBatchDone").replace("{n}", r.done) + (r.textures ? " · " + L("xmlBatchTex").replace("{n}", r.textures) : "") + (sk.length ? " · " + L("xmlBatchSkip").replace("{n}", sk.length) : "") + (bad.length ? " · " + L("xmlFailed").replace("{n}", bad.length) + ": " + bad.slice(0, 3).join(", ") + (bad.length > 3 ? "…" : "") : ""), bad.length > 0 || !r.done);
    } else if (r && r.error !== "cancel") toast(errText(r.error), true);
    sync();
  }, function () { prog = null; toast(L("e_x"), true); sync(); });
}
var IMPX = /\.(ypt|ydr|ydd|yft|ytd|yld|ycd|ybn|ynd|ynv|ywr|yvr|yed|yfd|ymap|ytyp|ymt|ypdb|awc|fxc|cut|pso|rbf)\.xml$/i;
function xmlImportInto(folder, files) {
  var A = api(); if (!A.cwImportXmlFiles) return;
  prog = { p: 0 };
  A.cwImportXmlFiles(folder, files).then(function (r) {
    prog = null;
    if (r && r.ok) {
      var bad = r.failed || [];
      toast(L("xmlDone").replace("{n}", r.done) + (bad.length ? " · " + L("xmlFailed").replace("{n}", bad.length) + ": " + bad.slice(0, 3).join(", ") + (bad.length > 3 ? "…" : "") : ""), bad.length > 0);
      load(cur, true); syncStatus();
    } else if (r && r.error !== "cancel") toast(errText(r.error), true);
    sync();
  }, function () { prog = null; toast(L("e_x"), true); sync(); });
}
function onClick(e) {
  var xg = e.target.closest ? e.target.closest('[data-cw="cwxgo"]') : null;
  if (xg) { var A0 = api(); if (A0.cwxFocus) A0.cwxFocus(); return; }
  if (!live()) return;
  var t = e.target.closest ? e.target.closest("[data-cw]") : null;
  if (t) { if (!t.disabled) act(t.dataset.cw); return; }
  var g = e.target.closest ? e.target.closest("[data-go]") : null;
  if (g) { load(g.dataset.go); return; }
  var r = e.target.closest ? e.target.closest("[data-r]") : null;
  if (r && results) { var x = results.items[+r.dataset.r]; if (x) load(x.f === 1 || x.f === 2 ? x.path : parent(x.path), x.f === 1 || x.f === 2 ? false : base(x.path)); return; }
  var row = e.target.closest ? e.target.closest("[data-i]") : null;
  if (row) {
    var i = +row.dataset.i, it = items[i]; if (!it) return;
    if (e.ctrlKey || e.metaKey) {
      if (!msCount() && sel >= 0 && sel !== i) ms[sel] = true;
      if (ms[i]) delete ms[i]; else ms[i] = true;
      var ks = Object.keys(ms);
      if (ks.length === 1) { sel = +ks[0]; ms = {}; } else if (ks.length) sel = ms[i] ? i : +ks[ks.length - 1]; else sel = -1;
      drawList(); drawFoot(); return;
    }
    if (e.shiftKey && sel >= 0 && items[sel]) {
      var vv = visible(), a0 = vv.indexOf(items[sel]), b0 = vv.indexOf(it);
      if (a0 >= 0 && b0 >= 0) {
        ms = {}; for (var k = Math.min(a0, b0); k <= Math.max(a0, b0); k++) ms[items.indexOf(vv[k])] = true;
        if (msCount() < 2) ms = {}; else window.getSelection && window.getSelection().removeAllRanges();
        drawList(); drawFoot(); return;
      }
    }
    ms = {}; sel = i;
    if (e.detail === 2) { openItem(it); if (it.type === "file") drawList(); return; }
    drawList();
  }
}
function onInput(e) { if (e.target && e.target.id === "rxQ") { q = e.target.value; if (scope === "here") { drawList(); drawFoot(); } else doSearch(); } }
// двойной клик обрабатывается в onClick (e.detail === 2): первый клик перерисовывает список, и браузер теряет событие dblclick
function openItem(it) {
  var fp = fullOf(it);
  if (it.type !== "file") load(fp);
  else if (/\.(ydr|ydd|yft)$/i.test(it.name)) open3d(fp, it.name);
  else if (it.kind === "res" && /\.ytd$/i.test(it.name)) openYtd(it);
  else if (YMTX.test(it.name) && S && S.xml) openText(fp, it.name, true);
  else if (it.kind === "bin" && TEXTX.test(it.name)) openText(fp, it.name);
  else openPreview(it);
}


// ----- 3D-просмотр (WebGL2): только позиции и индексы, нормали из производных (плоская заливка) -----
function b64buf(t) { var b = atob(t), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
function m4mul(a, b) { var o = new Float32Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) { var v = 0; for (var k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = v; } return o; }
function m4persp(f, asp, n, fa) { var t = 1 / Math.tan(f / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[10] = (fa + n) / (n - fa); o[11] = -1; o[14] = 2 * fa * n / (n - fa); return o; }
function v3sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function v3cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function v3norm(a) { var l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function m4look(e, t, up) { var f = v3norm(v3sub(t, e)), s = v3norm(v3cross(f, up)), u = v3cross(s, f), o = new Float32Array(16);
  o[0] = s[0]; o[4] = s[1]; o[8] = s[2]; o[1] = u[0]; o[5] = u[1]; o[9] = u[2]; o[2] = -f[0]; o[6] = -f[1]; o[10] = -f[2];
  o[12] = -(s[0] * e[0] + s[1] * e[1] + s[2] * e[2]); o[13] = -(u[0] * e[0] + u[1] * e[1] + u[2] * e[2]); o[14] = f[0] * e[0] + f[1] * e[1] + f[2] * e[2]; o[15] = 1; return o; }

var TEXTX = /\.(meta|xml|dat|txt|cfg|ini|json|csv|lst|ide|ipl)$/i, YMTX = /\.(ymt|ytyp|ymap)$/i;
function xmlErr(s) { try { var d = new DOMParser().parseFromString(s, "application/xml"), e = d.getElementsByTagName("parsererror")[0]; if (!e) return ""; var t = (e.textContent || "error").replace(/\s+/g, " ").trim(), k = /error on line[^]*?(?=Below is a rendering|$)/i.exec(t); return (k ? k[0] : t).trim().slice(0, 220); } catch (x) { return ""; } }
function openText(vp, title, conv) {
  var A = api(); if (!(conv ? A.cwConvRead : A.cwTextRead)) return;
  if (conv) toast(L("working"));
  (conv ? A.cwConvRead(vp) : A.cwTextRead(vp)).then(function (r) {
    if (conv) toast("");
    if (!r || !r.ok) { toast(errText(r && r.error), true); return; }
    build(r);
  }, function () { toast(L("e_x"), true); });
  function build(r) {
    var m = document.createElement("div"), isX = conv || /\.(xml|meta)$/i.test(title), LH = 20;
    m.className = "rx-mod rx-ed";
    m.innerHTML = '<div class="ed"><div class="edb"><b title="' + esc(vp) + '">' + esc(title) + '</b><span class="edm"></span>'
      + '<label><input type="checkbox" class="wr"> ' + esc(L("txWrap")) + '</label>'
      + (isX ? '<button class="mini edchk">' + esc(L("txChk")) + '</button>' : "")
      + (edit ? "" : '<button class="mini edon">' + esc(L("txOn")) + '</button>')
      + '<button class="mini fnd">' + esc(L("txFind")) + '</button>'
      + '<button class="mini go sv">' + esc(L("txSave")) + '</button><button class="mini cls">' + esc(L("txClose")) + '</button></div>'
      + '<div class="edf" style="display:none"><input type="text" class="fi" placeholder="' + esc(L("txFindPh")) + '"><input type="text" class="ri" placeholder="' + esc(L("txReplPh")) + '">'
      + '<label><input type="checkbox" class="cs"> Aa</label><button class="mini fn">' + esc(L("txNext")) + '</button><button class="mini rp">' + esc(L("txRepl")) + '</button><button class="mini ra">' + esc(L("txAll")) + '</button><span class="edm fr"></span></div>'
      + '<textarea class="eta" spellcheck="false" wrap="off"></textarea><div class="edi"></div></div>';
    document.body.appendChild(m);
    var ta = m.querySelector(".eta"), note = m.querySelector(".edb .edm"), info = m.querySelector(".edi"), bar = m.querySelector(".edf"),
        fi = m.querySelector(".fi"), ri = m.querySelector(".ri"), cs = m.querySelector(".cs"), fr = m.querySelector(".fr"), sv = m.querySelector(".sv");
    var dirty = false, saving = false, tU = 0, ENC = { utf8: "UTF-8", utf8bom: "UTF-8 BOM", utf16le: "UTF-16 LE", latin1: "ANSI" };
    ta.value = r.text;
    sv.disabled = !edit; ta.readOnly = !edit; if (!edit) sv.title = L("txRO");
    var onB = m.querySelector(".edon");
    if (onB) onB.onclick = function () { edit = true; sync(); ta.readOnly = false; sv.disabled = false; sv.title = ""; onB.remove(); say(conv && r.xname ? L("txConv") : ""); ta.focus(); };
    function say(t, cls) { note.textContent = t || ""; note.className = "edm" + (cls ? " " + cls : ""); }
    if (r.mixed) say(L("txMixed")); else if (!edit) say(L("txRO")); else if (conv && r.xname) say(L("txConv"));
    function cnt(s) { var n = 1, i = -1; while ((i = s.indexOf("\n", i + 1)) >= 0) n++; return n; }
    function upd() {
      var v = ta.value, p = ta.selectionStart || 0, head = v.slice(0, p), ln = cnt(head), col = p - (head.lastIndexOf("\n") + 1) + 1;
      info.textContent = L("txLn") + " " + ln + ", " + L("txCol") + " " + col + " · " + cnt(v) + " " + L("txLines") + " · " + ENC[r.enc] + " · " + (r.eol === "crlf" ? "CRLF" : "LF") + (dirty ? " · " + L("txMod") : "");
    }
    function updL() { clearTimeout(tU); tU = setTimeout(upd, 90); }
    function reveal(pos) {
      if (ta.getAttribute("wrap") === "off") { var line = cnt(ta.value.slice(0, pos)) - 1; ta.scrollTop = Math.max(0, line * LH - ta.clientHeight / 2); }
      else { var a = document.activeElement; ta.focus(); if (a && a !== ta && a.focus) a.focus(); }
    }
    function gotoLine(n) { var v = ta.value, i = 0; for (var k = 1; k < n; k++) { var j = v.indexOf("\n", i); if (j < 0) break; i = j + 1; } var e = v.indexOf("\n", i); ta.setSelectionRange(i, e < 0 ? v.length : e); reveal(i); updL(); }
    function ins(t) { ta.focus(); if (!document.execCommand || !document.execCommand("insertText", false, t)) ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, "end"); dirty = true; updL(); }
    function re() { var q = fi.value; return q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), cs.checked ? "g" : "gi") : null; }
    function findNext() {
      var x = re(); fr.textContent = ""; if (!x) return false;
      var v = ta.value; x.lastIndex = ta.selectionEnd; var h = x.exec(v);
      if (!h) { x.lastIndex = 0; h = x.exec(v); }
      if (!h) { fr.textContent = L("txNone"); return false; }
      ta.setSelectionRange(h.index, h.index + h[0].length); reveal(h.index); updL(); return true;
    }
    function replOne() {
      if (!edit) return;
      var x = re(); if (!x) return;
      var s = ta.selectionStart, e = ta.selectionEnd, cur = ta.value.slice(s, e);
      if (cur && cur.toLowerCase() === fi.value.toLowerCase() && (cs.checked ? cur === fi.value : true)) { ta.focus(); ta.setSelectionRange(s, e); ins(ri.value); fi.focus(); }
      findNext();
    }
    function replAll() {
      if (!edit) return;
      var x = re(); if (!x) return;
      var v = ta.value, n = (v.match(x) || []).length; if (!n) { fr.textContent = L("txNone"); return; }
      var nv = v.replace(x, function () { return ri.value; });
      if (nv.length < 2000000 && document.execCommand) { ta.focus(); ta.select(); if (!document.execCommand("insertText", false, nv)) ta.value = nv; } else ta.value = nv;
      dirty = true; fr.textContent = L("txRn").replace("{n}", n); updL(); fi.focus();
    }
    function openBar(on) { bar.style.display = on ? "flex" : "none"; if (on) { var s = ta.value.slice(ta.selectionStart, ta.selectionEnd); if (s && s.indexOf("\n") < 0) fi.value = s; fi.focus(); fi.select(); } else ta.focus(); }
    function check() {
      var e = xmlErr(ta.value); if (!e) { say(L("txXmlOk"), "ok"); return true; }
      say(L("txXmlBad") + ": " + e, "er"); var mm = /line (\d+)/i.exec(e); if (mm) gotoLine(+mm[1]); return false;
    }
    function save() {
      if (saving || !edit) return;
      if (isX && ta.value.length < 3000000 && !check()) { cfm(L("txBadSave")).then(function (ok) { if (ok) doSave(); }); return; }
      doSave();
    }
    function doSave() {
      if (saving) return;
      saving = true; sv.disabled = true;
      (conv ? A.cwConvSave(vp, ta.value, { enc: r.enc, eol: r.eol }, r.xname) : A.cwTextSave(vp, ta.value, { enc: r.enc, eol: r.eol })).then(function (x) {
        saving = false; sv.disabled = false;
        if (x && x.ok) { dirty = false; upd(); say(L("txSaved"), "ok"); var k = selItem() && selItem().name; load(cur, k || true); syncStatus(); }
        else if (x && x.error !== "cancel") say(errText(x.error), "er");
      }, function () { saving = false; sv.disabled = false; say(L("e_x"), "er"); });
    }
    function close() {
      if (dirty) { cfm(L("txDiscard")).then(function (ok) { if (ok) fin(); }); return; }
      fin();
    }
    function fin() { clearTimeout(tU); m.remove(); }
    ta.addEventListener("input", function () { dirty = true; updL(); });
    ["keyup", "click", "select"].forEach(function (ev) { ta.addEventListener(ev, updL); });
    m.querySelector(".wr").addEventListener("change", function (e) { ta.setAttribute("wrap", e.target.checked ? "soft" : "off"); });
    m.querySelector(".cls").onclick = close; sv.onclick = save; m.querySelector(".fnd").onclick = function () { openBar(bar.style.display === "none"); };
    if (isX) m.querySelector(".edchk").onclick = check;
    m.querySelector(".fn").onclick = findNext; m.querySelector(".rp").onclick = replOne; m.querySelector(".ra").onclick = replAll;
    fi.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); findNext(); } });
    ri.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); replOne(); } });
    ta.addEventListener("keydown", function (e) { if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); ins("  "); } });
    m.addEventListener("keydown", function (e) {
      var k = String(e.key).toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "s") { e.preventDefault(); save(); }
      else if ((e.ctrlKey || e.metaKey) && (k === "f" || k === "h")) { e.preventDefault(); openBar(true); }
      else if (k === "escape") { e.preventDefault(); if (bar.style.display !== "none") openBar(false); else close(); }
    });
    if (A.cwFocus) A.cwFocus();
    upd(); ta.setSelectionRange(0, 0); ta.focus(); ta.scrollTop = 0; ta.scrollLeft = 0;
  }
}
function openYtd(it) {
  var A = api(); if (!A.cwYtd) return;
  var vp = fullOf(it);
  A.cwYtd("open", vp).then(function (r) {
    if (!r || !r.ok) { toast(errText(r && r.error), true); return; }
    build(r);
  }, function () { toast(L("e_x"), true); });
  function build(r) {
    var sid = r.sid, list = r.list, dirty = false, working = false, m = document.createElement("div");
    m.className = "rx-mod rx-ed rx-yt";
    m.innerHTML = '<div class="ed"><div class="edb"><b title="' + esc(vp) + '">' + esc(it.name) + '</b><span class="edm"></span>'
      + '<span class="ytl">' + esc(L("ytFmt")) + '</span><select class="ytsel"><option>DXT5</option><option>DXT1</option><option>BC7</option><option>A8R8G8B8</option></select>'
      + '<button class="mini ytadd">' + esc(L("ytAdd")) + '</button>'
      + (edit ? "" : '<button class="mini edon">' + esc(L("txOn")) + '</button>')
      + '<button class="mini go sv">' + esc(L("txSave")) + '</button><button class="mini cls">' + esc(L("txClose")) + '</button></div>'
      + '<div class="ytb"></div><div class="edi"></div></div>';
    document.body.appendChild(m);
    var body = m.querySelector(".ytb"), note = m.querySelector(".edm"), info = m.querySelector(".edi"), sv = m.querySelector(".sv"), addB = m.querySelector(".ytadd"), fsel = m.querySelector(".ytsel");
    function say(t, cls) { note.textContent = t || ""; note.className = "edm" + (cls ? " " + cls : ""); }
    function gate() {
      sv.disabled = !edit || working || !dirty; addB.disabled = !edit || working;
      Array.prototype.forEach.call(body.querySelectorAll("[data-yt]"), function (b) { b.disabled = working || (!edit && b.getAttribute("data-yt") !== "exp"); });
      if (!edit && !note.textContent) say(L("txRO"));
    }
    function draw() {
      var h = list.map(function (x) {
        var k = ' data-k="' + x.i + '"';
        return '<div class="ytc"><div class="yim">' + (x.url ? '<img src="' + x.url + '">' : x.bc7 ? '<img data-bc7="' + esc(x.name) + '">' : "?") + '</div><b title="' + esc(x.name) + '">' + esc(x.name) + '</b>'
          + '<small>' + x.width + "×" + x.height + " · " + esc(x.format) + " · " + x.levels + " " + esc(L("ytMips")) + " · " + esc(fmt(x.size)) + '</small>'
          + '<div class="yac"><button class="mini" data-yt="repl"' + k + '>' + esc(L("ytRepl")) + '</button><button class="mini" data-yt="ren"' + k + '>' + esc(L("ytRen")) + '</button>'
          + '<button class="mini" data-yt="exp"' + k + '>' + esc(L("ytExp")) + '</button><button class="mini" data-yt="del"' + k + '>' + esc(L("ytDel")) + '</button></div></div>';
      }).join("");
      body.innerHTML = h || '<div class="ythint">' + esc(L("ytHint")) + '</div>';
      fillBc7(m, list);
      info.textContent = L("ytCnt").replace("{n}", list.length) + (dirty ? " · " + L("txMod") : "");
      gate();
    }
    function run(p, after) {
      working = true; gate(); say("");
      p.then(function (x) {
        working = false;
        if (x && x.ok) { if (x.list) { list = x.list; if (!(x.added && !x.added.length)) dirty = true; } if (after) after(x); draw(); }
        else { if (x && x.error !== "cancel") say(errText(x.error), "er"); gate(); }
      }, function () { working = false; say(L("e_x"), "er"); gate(); });
    }
    function addNote(x) {
      var t = L("ytAdded").replace("{n}", x.added.length);
      if (x.skipped.length) t += " · " + L("ytSkip").replace("{names}", x.skipped.join(", "));
      if (x.failed.length) t += " · " + L("ytFail").replace("{n}", x.failed.length) + " (" + errText(x.failed[0].error) + ")";
      say(t, x.failed.length ? "er" : "ok");
    }
    function addFiles(paths) { if (!edit || working) return; run(A.cwYtd("add", sid, paths || null, fsel.value), addNote); }
    addB.onclick = function () { addFiles(null); };
    body.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-yt]") : null; if (!b || b.disabled) return;
      var k = +b.getAttribute("data-k"), a = b.getAttribute("data-yt"), x = list.filter(function (q) { return q.i === k; })[0]; if (!x) return;
      if (a === "repl") run(A.cwYtd("replace", sid, k, null, fsel.value));
      else if (a === "exp") run(A.cwYtd("export", sid, k), function () { say(L("ytExported"), "ok"); });
      else if (a === "ren") ask(L("ytName"), x.name).then(function (n) { if (n && n !== x.name) run(A.cwYtd("rename", sid, k, n)); });
      else if (a === "del") { cfm(L("ytDelQ") + "\n" + x.name).then(function (ok) { if (ok) run(A.cwYtd("remove", sid, k)); }); }
    });
    sv.onclick = function () {
      if (!edit || working || !dirty) return;
      working = true; gate(); say("");
      A.cwYtd("save", sid).then(function (x) {
        working = false;
        if (x && x.ok) { dirty = false; say(L("txSaved"), "ok"); var k = selItem() && selItem().name; load(cur, k || true); syncStatus(); draw(); }
        else { if (x && x.error !== "cancel") say(errText(x.error), "er"); gate(); }
      }, function () { working = false; say(L("e_x"), "er"); gate(); });
    };
    var onB = m.querySelector(".edon");
    if (onB) onB.onclick = function () { edit = true; sync(); onB.remove(); say(""); gate(); };
    function close() {
      if (dirty) { cfm(L("txDiscard")).then(function (ok) { if (ok) fin(); }); return; }
      fin();
    }
    function fin() { document.removeEventListener("keydown", onKey, true); A.cwYtd("close", sid); m.remove(); }
    function onKey(e) { if (cfmN) return; if (e.key === "Escape") { e.preventDefault(); close(); } }
    document.addEventListener("keydown", onKey, true);
    m.querySelector(".cls").onclick = close;
    function hasFiles(e) { var t = e.dataTransfer && e.dataTransfer.types; return !!t && Array.prototype.indexOf.call(t, "Files") >= 0; }
    m.addEventListener("dragover", function (e) { if (hasFiles(e)) { e.preventDefault(); m.classList.add("dnd"); } });
    m.addEventListener("dragleave", function (e) { if (!e.relatedTarget || !m.contains(e.relatedTarget)) m.classList.remove("dnd"); });
    m.addEventListener("drop", function (e) {
      m.classList.remove("dnd"); if (!hasFiles(e)) return; e.preventDefault();
      if (!edit) { say(L("needEdit"), "er"); return; }
      var ps = []; Array.prototype.forEach.call(e.dataTransfer.files || [], function (f) { var p = A.pathForFile ? A.pathForFile(f) : ""; if (p) ps.push(p); });
      if (ps.length) addFiles(ps);
    });
    draw();
  }
}
function open3d(vp, title) {
  var A = api(), m = document.createElement("div"); m.className = "rx-mod rx-3d";
  m.innerHTML = '<div class="v3"><div class="v3b"><b>' + esc(title) + '</b><span class="obj"></span><span class="lod"></span><label><input type="checkbox" class="tx" checked> ' + esc(L("v3Tex")) + '</label><label class="v3tl" style="display:none"><input type="checkbox" class="v3tn"> ' + esc(L("v3Tint")) + '</label><label class="v3vl" style="display:none"><input type="checkbox" class="v3vc" checked> ' + esc(L("v3Vc")) + '</label><label class="v3nl" style="display:none"><input type="checkbox" class="v3nm" checked> ' + esc(L("v3Nm")) + '</label><label><input type="checkbox" class="wire"> ' + esc(L("v3Wire")) + '</label><label class="bl" style="display:none"><input type="checkbox" class="bn"> ' + esc(L("v3Bones")) + '</label><button class="mini rst">' + esc(L("v3Reset")) + '</button><button class="mini emb" disabled>' + esc(L("v3Embed")) + '</button><button class="mini v3ob" style="display:none"></button><span class="sp"></span><button class="mini cls">' + esc(L("v3Close")) + '</button></div><div class="v3m"><canvas></canvas><div class="v3o" style="display:none"><div class="v3oh"><b></b><button class="mini v3va">' + esc(L("v3ShowAll")) + '</button><button class="mini v3vn">' + esc(L("v3HideAll")) + '</button></div><div class="v3og"></div><div class="v3oi">' + esc(L("v3OHint")) + '</div></div><div class="v3p" style="display:none"><div class="v3ph"><b class="v3pt"></b><button class="mini v3px">×</button></div><div class="v3pm" style="display:none"></div><div class="v3g"></div></div><div class="v3big" style="display:none"><div class="v3bh"><b class="v3bn"></b><span class="v3bm"></span><span class="sp"></span><button class="mini v3be">' + esc(L("ytExp")) + '</button><button class="mini v3bx">' + esc(L("v3Close")) + '</button></div><div class="v3bi"></div></div></div><div class="v3i">' + esc(L("v3Help")) + '</div></div>';
  document.body.appendChild(m);
  var cv = m.querySelector("canvas"), info = m.querySelector(".v3i"), gl = cv.getContext("webgl2", { antialias: true, powerPreference: "high-performance" });
  var st = { all: false, oi: [], hid: {}, tint: false, opanel: false, emb: [], miss: [], which: 0, lod: "", wire: false, tex: true, bones: false, yaw: 0.8, pitch: 0.45, dist: 3, tgt: [0, 0, 0], rad: 1, n: 0, idx16: true, groups: [], texs: [], mats: [], nbl: 0, nex: 0, dirty: true, dead: false, pos: null, idx: null, act: 0, mv: false, rl: 0, fast: 0, lt: 0 }, prog, vao, vbo, uvb, clb, nmb, ibo, wvao, wbo, bvao, bbo, loc, bptc = null, white = null;
  function close() { st.dead = true; document.removeEventListener("keydown", onEsc, true); try { var x = gl && gl.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); } catch (e) { /* ok */ } m.remove(); }
  m.querySelector(".cls").onclick = close;
  m.addEventListener("mousedown", function (e) { if (e.target === m) close(); });
  if (!gl) { info.textContent = L("v3NoGl"); return; }
  bptc = gl.getExtension("EXT_texture_compression_bptc");
  function sh(t, src) { var x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); return x; }
  prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, "#version 300 es\nin vec3 p; in vec2 uv; in vec4 cl; in vec3 nm; uniform mat4 mvp; uniform mat4 mv; out vec3 vp; out vec2 tc; out vec3 bary; out vec4 vc; out vec3 vn; void main(){ vp = (mv * vec4(p, 1.0)).xyz; tc = uv; vc = cl; vn = mat3(mv) * nm; int k = gl_VertexID % 3; bary = vec3(k == 0 ? 1.0 : 0.0, k == 1 ? 1.0 : 0.0, k == 2 ? 1.0 : 0.0); gl_Position = mvp * vec4(p, 1.0); }"));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, "#version 300 es\nprecision highp float; in vec3 vp; in vec2 tc; in vec3 bary; in vec4 vc; in vec3 vn; uniform float useNrm; uniform float useVc; uniform vec3 col; uniform float mode; uniform float useTex; uniform sampler2D smp; out vec4 o; void main(){ if (mode > 1.5) { float e = min(min(bary.x, bary.y), bary.z); if (e > fwidth(e) * 1.1) discard; o = vec4(col, 1.0); return; } if (mode > 0.5) { o = vec4(col, 1.0); return; } vec3 n = (useNrm > 0.5 && dot(vn, vn) > 0.01) ? normalize(vn) : normalize(cross(dFdx(vp), dFdy(vp))); float l = abs(n.z) * 0.75 + 0.25; vec4 c = vec4(col, 1.0); if (useVc > 0.5) c.rgb = vc.rgb; if (useTex > 0.5) { vec4 t = texture(smp, tc); if (t.a < 0.35) discard; c = useVc > 0.5 ? vec4(t.rgb * vc.rgb, t.a) : t; } o = vec4(c.rgb * l, 1.0); }"));
  gl.linkProgram(prog);
  if (gl.getProgramParameter(prog, gl.LINK_STATUS) === false) { info.textContent = "WebGL: " + String(gl.getProgramInfoLog(prog) || "shader error").slice(0, 300); return; }
  loc = { p: gl.getAttribLocation(prog, "p"), uv: gl.getAttribLocation(prog, "uv"), cl: gl.getAttribLocation(prog, "cl"), nm: gl.getAttribLocation(prog, "nm"), useNrm: gl.getUniformLocation(prog, "useNrm"), useVc: gl.getUniformLocation(prog, "useVc"), mvp: gl.getUniformLocation(prog, "mvp"), mv: gl.getUniformLocation(prog, "mv"), col: gl.getUniformLocation(prog, "col"), mode: gl.getUniformLocation(prog, "mode"), useTex: gl.getUniformLocation(prog, "useTex"), smp: gl.getUniformLocation(prog, "smp") };
  vao = gl.createVertexArray(); vbo = gl.createBuffer(); uvb = gl.createBuffer(); clb = gl.createBuffer(); nmb = gl.createBuffer(); ibo = gl.createBuffer(); wvao = gl.createVertexArray(); wbo = gl.createBuffer(); bvao = gl.createVertexArray(); bbo = gl.createBuffer();
  function fit(pos) {
    var mn = [1e30, 1e30, 1e30], mx = [-1e30, -1e30, -1e30];
    for (var i = 0; i < pos.length; i += 3) for (var k = 0; k < 3; k++) { var v = pos[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
    st.tgt = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
    st.rad = Math.max(0.001, Math.sqrt(Math.pow(mx[0] - mn[0], 2) + Math.pow(mx[1] - mn[1], 2) + Math.pow(mx[2] - mn[2], 2)) / 2); st.dist = st.rad * 3.3; st.yaw = 0.8; st.pitch = 0.45;
  }
  function mkTex(t) {
    if (!t) return null;
    var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    if (t.bc7 && bptc) { gl.compressedTexImage2D(gl.TEXTURE_2D, 0, bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT, t.w, t.h, 0, new Uint8Array(b64buf(t.bc7))); return tx; }
    if (t.png) { var img = new Image(); img.onload = function () { if (st.dead) return; gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); st.dirty = true; }; img.src = t.png; return tx; }
    return null;
  }
  function pcol(o) { var h = (o * 137.508) % 360, a = 0.6 * Math.min(0.62, 0.38); function f(n) { var k = (n + h / 30) % 12; return 0.62 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); } return [f(0), f(8), f(4)]; }
  function pcss(o) { var c = pcol(o); return "rgb(" + Math.round(c[0] * 255) + "," + Math.round(c[1] * 255) + "," + Math.round(c[2] * 255) + ")"; }
  var ov = m.querySelector(".v3o"), objB = m.querySelector(".v3ob"), tlab = m.querySelector(".v3tl"), tn = m.querySelector(".v3tn");
  function vis() { var n = 0; st.oi.forEach(function (x, i) { if (!x.empty && !st.hid[i]) n++; }); return n; }
  function objCount() { var n = 0; st.oi.forEach(function (x) { if (!x.empty) n++; }); return n; }
  function renderObjs() {
    ov.querySelector(".v3oh b").textContent = L("v3Objs") + ": " + vis() + "/" + objCount();
    ov.querySelector(".v3og").innerHTML = st.oi.map(function (x, i) {
      return '<div class="v3r' + (x.empty ? " v3e" : "") + (st.hid[i] ? " v3f" : "") + '" data-o="' + i + '"' + (x.why ? ' title="' + esc(x.why) + '"' : "") + '><input type="checkbox" class="v3k"' + (x.empty ? " disabled" : st.hid[i] ? "" : " checked") + '><i style="background:' + pcss(i) + '"></i><span class="v3n">' + esc(x.name || ("#" + (i + 1))) + '</span><small>' + (x.empty ? esc(L("v3Empty")) : x.tris) + '</small></div>';
    }).join("");
  }
  function showUi() {
    var multi = st.all; ov.style.display = multi && st.opanel ? "flex" : "none"; tlab.style.display = multi ? "" : "none";
    objB.style.display = multi ? "" : "none"; objB.textContent = L("v3Objs") + " (" + objCount() + ")";
    if (multi) renderObjs();
  }
  objB.onclick = function () { st.opanel = !st.opanel; showUi(); };
  tn.onchange = function () { st.tint = tn.checked; st.dirty = true; };
  ov.querySelector(".v3va").onclick = function () { st.hid = {}; renderObjs(); st.dirty = true; };
  ov.querySelector(".v3vn").onclick = function () { st.oi.forEach(function (x, i) { st.hid[i] = true; }); renderObjs(); st.dirty = true; };
  ov.querySelector(".v3og").addEventListener("click", function (e) {
    var row = e.target.closest ? e.target.closest(".v3r") : null; if (!row || row.classList.contains("v3e")) return; var i = +row.getAttribute("data-o");
    if (e.target.classList.contains("v3k")) { if (e.target.checked) delete st.hid[i]; else st.hid[i] = true; row.classList.toggle("v3f", !!st.hid[i]); ov.querySelector(".v3oh b").textContent = L("v3Objs") + ": " + vis() + "/" + objCount(); st.dirty = true; }
    else if (e.target.classList.contains("v3n")) { st.hid = {}; st.oi.forEach(function (x, k) { if (k !== i) st.hid[k] = true; }); renderObjs(); st.dirty = true; }
  });
  function clearView() { st.n = 0; st.nbl = 0; try { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); } catch (x) { /* ok */ } }
  function upload(r) {
    var pos = new Float32Array(b64buf(r.pos)), uv = new Float32Array(b64buf(r.uv)), idx = r.idx16 ? new Uint16Array(b64buf(r.idx)) : new Uint32Array(b64buf(r.idx));
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc.p); gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvb); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW); if (loc.uv >= 0) { gl.enableVertexAttribArray(loc.uv); gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 0, 0); }
    st.hasCol = !!r.col; if (st.hasCol && loc.cl >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, clb); gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(b64buf(r.col)), gl.STATIC_DRAW); gl.enableVertexAttribArray(loc.cl); gl.vertexAttribPointer(loc.cl, 4, gl.UNSIGNED_BYTE, true, 0, 0); } else if (loc.cl >= 0) gl.disableVertexAttribArray(loc.cl);
    st.hasNrm = !!r.nrm; if (st.hasNrm && loc.nm >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, nmb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(b64buf(r.nrm)), gl.STATIC_DRAW); gl.enableVertexAttribArray(loc.nm); gl.vertexAttribPointer(loc.nm, 3, gl.FLOAT, false, 0, 0); } else if (loc.nm >= 0) gl.disableVertexAttribArray(loc.nm);
    m.querySelector(".v3nl").style.display = st.hasNrm ? "" : "none"; st.nm = st.hasNrm && m.querySelector(".v3nm").checked;
    m.querySelector(".v3vl").style.display = st.hasCol ? "" : "none"; st.vc = st.hasCol && m.querySelector(".v3vc").checked;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    st.n = idx.length; st.idx16 = r.idx16; st.groups = r.groups; st.pos = pos; st.idx = idx; st.nl = 0; st.nex = 0;
    st.texs.forEach(function (t) { if (t) gl.deleteTexture(t); }); st.texs = r.mats.map(mkTex); st.mats = r.mats;
    // скелет: линии родитель -> кость
    st.nbl = 0;
    if (r.bones && r.bones.length) {
      var ln = []; r.bones.forEach(function (b) { if (b.parent >= 0 && r.bones[b.parent]) { var q = r.bones[b.parent].pos; ln.push(q[0], q[1], q[2], b.pos[0], b.pos[1], b.pos[2]); } });
      if (ln.length) { gl.bindVertexArray(bvao); gl.bindBuffer(gl.ARRAY_BUFFER, bbo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ln), gl.STATIC_DRAW); gl.enableVertexAttribArray(loc.p); gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0); st.nbl = ln.length / 3; }
    }
    m.querySelector(".bl").style.display = st.nbl ? "" : "none";
    var wasAll = st.all; st.all = r.index === -1; st.oi = r.objInfo || [];
    if (st.all && !wasAll) { st.hid = {}; st.opanel = true; st.tint = !st.hasCol && !r.mats.some(function (t) { return t && (t.png || t.bc7); }); tn.checked = st.tint; }
    if (!st.all) { st.hid = {}; st.opanel = false; st.tint = false; }
    showUi();
    fit(pos); st.dirty = true;
  }
  // каркас: разворачиваем треугольники в отдельные вершины (барицентрика берётся из gl_VertexID)
  function ensureWire() {
    if (st.nex || !st.idx) return;
    var n = st.idx.length, ex = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { var v = st.idx[i] * 3; ex[i * 3] = st.pos[v]; ex[i * 3 + 1] = st.pos[v + 1]; ex[i * 3 + 2] = st.pos[v + 2]; }
    gl.bindVertexArray(wvao); gl.bindBuffer(gl.ARRAY_BUFFER, wbo); gl.bufferData(gl.ARRAY_BUFFER, ex, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc.p); gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0); st.nex = n;
  }
  function bar(r) {
    var o = m.querySelector(".obj"), l = m.querySelector(".lod"), h = "";
    if (r.objects.length > 1) { var oi = r.objInfo || []; h = esc(L("v3Obj")) + ' <select><option value="-1"' + (r.index === -1 ? " selected" : "") + ">" + esc(L("v3All")) + " (" + r.objects.length + ")</option>" + r.objects.map(function (n, i) { var em = oi[i] && oi[i].empty; return '<option value="' + i + '"' + (i === r.index ? " selected" : "") + (em ? " disabled" : "") + ">" + esc(n || ("#" + (i + 1))) + (em ? " (" + esc(L("v3Empty")) + ")" : "") + "</option>"; }).join("") + "</select>"; }
    o.innerHTML = h; var sel = o.querySelector("select"); if (sel) sel.onchange = function () { go(+sel.value, ""); };
    l.innerHTML = r.lods.length > 1 ? esc(L("v3Lod")) + ' <select>' + r.lods.map(function (n) { return '<option value="' + n + '"' + (n === r.lod ? " selected" : "") + ">" + n + "</option>"; }).join("") + "</select>" : "";
    var ls = l.querySelector("select"); if (ls) ls.onchange = function () { go(st.which, ls.value); };
    var withTex = r.mats.filter(function (t) { return t && (t.png || t.bc7); }).length;
    info.textContent = r.tris + " " + L("v3Tris") + " · " + r.verts + " · " + L("v3Tex") + ": " + withTex + "/" + r.mats.length + " · " + L("v3Help");
  }
  function go(which, lod) {
    info.textContent = L("working");
    A.cwModel(vp, which, lod).then(function (r) {
      if (st.dead) return;
      if (!r || !r.ok) { clearView(); info.textContent = errText(r && r.error) + (r && r.why ? " [" + r.why + "]" : ""); return; }
      st.which = r.index; st.lod = r.lod; upload(r); bar(r); embUpdate(r);
    }, function () { info.textContent = L("e_x"); });
  }
  function draw() {
    if (st.dead) return;
    // адаптивное разрешение: пока крутим/приближаем и кадры тормозят, рисуем в меньшем разрешении, в покое перерисовываем в полном
    var now = performance.now(), dt = st.lt ? now - st.lt : 16; st.lt = now;
    var mvg = now - st.act < 220;
    if (st.mv && !mvg) st.dirty = true;
    st.mv = mvg;
    if (mvg && st.dirty) { if (dt > 28 && st.rl < 3) { st.rl++; st.fast = 0; } else if (dt < 19 && st.rl > 0 && ++st.fast > 40) { st.rl--; st.fast = 0; } }
    if (st.dirty && st.n) {
      st.dirty = false;
      var w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2) * (mvg ? [1, 0.75, 0.5, 0.35][st.rl] : 1);
      if (cv.width !== Math.max(1, w * dpr | 0) || cv.height !== Math.max(1, h * dpr | 0)) { cv.width = Math.max(1, w * dpr | 0); cv.height = Math.max(1, h * dpr | 0); }
      gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.enable(gl.DEPTH_TEST); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      var cp = Math.cos(st.pitch), eye = [st.tgt[0] + st.dist * cp * Math.cos(st.yaw), st.tgt[1] + st.dist * cp * Math.sin(st.yaw), st.tgt[2] + st.dist * Math.sin(st.pitch)];
      var V = m4look(eye, st.tgt, [0, 0, 1]), P = m4persp(0.8, cv.width / Math.max(1, cv.height), Math.max(st.rad * 1e-4, Math.min(st.dist * 0.02, st.rad * 0.05)), st.dist + st.rad * 3), MVP = m4mul(P, V);
      gl.useProgram(prog); gl.uniformMatrix4fv(loc.mvp, false, MVP); gl.uniformMatrix4fv(loc.mv, false, V); gl.uniform1i(loc.smp, 0);
      gl.bindVertexArray(vao); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      if (st.wire) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1); }
      var type = st.idx16 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT, sz = st.idx16 ? 2 : 4;
      var tint = st.all && st.tint;
      st.groups.forEach(function (g) {
        if (g.o !== undefined && st.hid[g.o]) return;
        var tx = st.tex && !tint ? st.texs[g.m] : null, pc = tint ? pcol(g.o) : [0.62, 0.72, 0.86];
        gl.uniform1f(loc.mode, 0); gl.uniform1f(loc.useNrm, st.nm && st.hasNrm ? 1 : 0); gl.uniform1f(loc.useVc, st.vc && st.hasCol && !tint ? 1 : 0); gl.uniform1f(loc.useTex, tx ? 1 : 0); gl.uniform3f(loc.col, pc[0], pc[1], pc[2]);
        if (tx) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx); }
        gl.drawElements(gl.TRIANGLES, g.c, type, g.s * sz);
      });
      gl.disable(gl.POLYGON_OFFSET_FILL);
      if (st.wire) { ensureWire(); gl.bindVertexArray(wvao); gl.uniform1f(loc.mode, 2); gl.uniform3f(loc.col, 0.05, 0.07, 0.1); st.groups.forEach(function (g) { if (g.o !== undefined && st.hid[g.o]) return; gl.drawArrays(gl.TRIANGLES, g.s, g.c); }); }
      if (st.bones && st.nbl) { gl.disable(gl.DEPTH_TEST); gl.bindVertexArray(bvao); gl.uniform1f(loc.mode, 1); gl.uniform3f(loc.col, 1, 0.55, 0.1); gl.drawArrays(gl.LINES, 0, st.nbl); gl.enable(gl.DEPTH_TEST); }
    }
    requestAnimationFrame(draw);
  }
  m.querySelector(".v3nm").onchange = function (e) { st.nm = e.target.checked && st.hasNrm; st.dirty = true; };
  m.querySelector(".v3vc").onchange = function (e) { st.vc = e.target.checked && st.hasCol; st.dirty = true; };
  m.querySelector(".wire").onchange = function (e) { st.wire = e.target.checked; st.dirty = true; };
  m.querySelector(".tx").onchange = function (e) { st.tex = e.target.checked; st.dirty = true; };
  m.querySelector(".bn").onchange = function (e) { st.bones = e.target.checked; st.dirty = true; };
  m.querySelector(".rst").onclick = function () { st.yaw = 0.8; st.pitch = 0.45; st.dist = st.rad * 3.3; st.dirty = true; };
  var drag = null;
  cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  cv.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey }; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } cv.style.cursor = "grabbing"; });
  cv.addEventListener("pointerup", function () { drag = null; cv.style.cursor = "grab"; });
  cv.addEventListener("pointermove", function (e) {
    if (!drag) return; st.act = performance.now(); var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (drag.pan) {
      var cp = Math.cos(st.pitch), f = [-cp * Math.cos(st.yaw), -cp * Math.sin(st.yaw), -Math.sin(st.pitch)], r = v3norm(v3cross(f, [0, 0, 1])), u = v3cross(r, f), k = st.dist * 0.0016;
      for (var i = 0; i < 3; i++) st.tgt[i] += (-r[i] * dx + u[i] * dy) * k;
    } else { st.yaw -= dx * 0.008; st.pitch = Math.max(-1.55, Math.min(1.55, st.pitch + dy * 0.008)); }
    st.dirty = true;
  });
  cv.addEventListener("wheel", function (e) { e.preventDefault(); var dy = Math.max(-240, Math.min(240, e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY)); st.dist = Math.max(st.rad * 0.002, Math.min(st.rad * 60, st.dist * Math.exp(dy * 0.001))); st.act = performance.now(); st.dirty = true; }, { passive: false });
  window.addEventListener("resize", function () { st.dirty = true; });
  // ---- вложенные текстуры модели: список с миниатюрами, крупный просмотр, экспорт DDS ----
  var pan = m.querySelector(".v3p"), big = m.querySelector(".v3big"), embB = m.querySelector(".emb"), bigName = "";
  function embUpdate(r) {
    st.emb = r.embedded || []; st.miss = r.missing || [];
    embB.textContent = L("v3Embed") + " (" + st.emb.length + ")"; embB.disabled = !st.emb.length; embB.title = st.emb.length ? "" : L("v3EmbedNone");
    if (!st.emb.length) { pan.style.display = "none"; big.style.display = "none"; } else if (pan.style.display !== "none") renderPan();
  }
  function renderPan() {
    pan.querySelector(".v3g").innerHTML = st.emb.map(function (x) {
      return '<div class="v3c' + (x.used ? " used" : "") + '" data-n="' + esc(x.name) + '"><div class="tm">' + (x.png ? '<img src="' + x.png + '">' : x.bc7 ? '<img data-bc7="' + esc(x.name) + '">' : "?") + '</div><b title="' + esc(x.name) + '">' + esc(x.name) + '</b><small>' + x.width + "×" + x.height + " · " + esc(x.format) + " · " + x.levels + " " + esc(L("ytMips")) + (x.used ? " · " + esc(L("v3Used")) : "") + '</small></div>';
    }).join("");
    pan.querySelector(".v3pt").textContent = L("v3Embed") + ": " + st.emb.length;
    var ms = pan.querySelector(".v3pm"); ms.textContent = st.miss.length ? L("v3Missing").replace("{names}", st.miss.slice(0, 6).join(", ") + (st.miss.length > 6 ? "…" : "")) : ""; ms.style.display = st.miss.length ? "" : "none";
    fillBc7(pan, st.emb);
  }
  function openBig(name) {
    bigName = name; big.style.display = "flex";
    var body = big.querySelector(".v3bi"), meta = big.querySelector(".v3bm");
    big.querySelector(".v3bn").textContent = name; meta.textContent = L("working"); body.innerHTML = "";
    A.cwModelTex(vp, st.which, name, 1024).then(function (r) {
      if (st.dead || bigName !== name) return;
      if (!r || !r.ok) { meta.textContent = errText(r && r.error); return; }
      meta.textContent = r.width + "×" + r.height + " · " + r.fmt + " · " + r.levels + " " + L("ytMips");
      if (r.png) body.innerHTML = '<img src="' + r.png + '">';
      else if (r.bc7) { body.innerHTML = '<img data-bc7="' + esc(r.name) + '">'; fillBc7(big, [{ name: r.name, bc7: r.bc7, pw: r.w, ph: r.h }]); }
    }, function () { meta.textContent = L("e_x"); });
  }
  embB.onclick = function () { if (pan.style.display === "none") { renderPan(); pan.style.display = "flex"; } else { pan.style.display = "none"; big.style.display = "none"; } };
  pan.querySelector(".v3px").onclick = function () { pan.style.display = "none"; big.style.display = "none"; };
  pan.querySelector(".v3g").addEventListener("click", function (e) { var c = e.target.closest ? e.target.closest(".v3c") : null; if (c) openBig(c.getAttribute("data-n")); });
  big.querySelector(".v3bx").onclick = function () { big.style.display = "none"; };
  big.querySelector(".v3be").onclick = function () {
    var meta = big.querySelector(".v3bm");
    A.cwModelTex(vp, st.which, bigName, 0, true).then(function (r) { if (r && r.ok) meta.textContent = L("ytExported"); else if (r && r.error !== "cancel") meta.textContent = errText(r.error); });
  };
  function onEsc(e) {
    if (st.dead || cfmN || e.key !== "Escape") return;
    if (big.style.display !== "none") { e.preventDefault(); e.stopPropagation(); big.style.display = "none"; }
    else if (pan.style.display !== "none") { e.preventDefault(); e.stopPropagation(); pan.style.display = "none"; }
  }
  document.addEventListener("keydown", onEsc, true);
  go(-2, ""); requestAnimationFrame(draw);
}

function begin() {
  var A = api(); if (started || !live()) return;
  A.cwStatus().then(function (s) {
    if (s) S = s; sync();
    if (!s || !s.gameOk) { if (!busyD) act("detect"); return; }
    if (s.keys === "ready" || skipKeys) { started = true; load(cur); if (!s.idx || s.idx.state === "none") A.cwIndex(); return; }
    if (s.keys === "scanning") return;
    A.cwKeys().then(function (r) { if (r && r.status) S = r.status; sync(); if (r && r.ok) { started = true; load(cur); A.cwIndex(); } }, function () { syncStatus(); });
  });
}
function mount(el, lg) {
  root = el; lang = lg || lang; started = false;
  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("contextmenu", onCtx); wireDrop(root);
  root.addEventListener("mouseup", function (e) { if (e.button === 3) { e.preventDefault(); act("hback"); } else if (e.button === 4) { e.preventDefault(); act("hfwd"); } });
  if (window.__cwKeys) document.removeEventListener("keydown", window.__cwKeys);
  window.__cwKeys = onKeys; document.addEventListener("keydown", onKeys);
  root.addEventListener("dragstart", function (e) {
    var row = e.target.closest ? e.target.closest("[data-i]") : null, it = row ? items[+row.dataset.i] : null;
    if (!row || !it || !canDrag(it)) return;
    e.preventDefault(); if (api().cwDragOut) api().cwDragOut(fullOf(it));
  });
  var A = api();
  if (A.onCwState && !wired) {
    wired = true;
    A.onCwState(function (s) { if (!s) return; var was = S && S.keys; S = s; if (!live()) return; if (s.keys === "ready" && was !== "ready" && !started) begin(); else sync(); });
    if (A.onCwProgress) A.onCwProgress(function (p) { if (p && live()) { prog = { p: p.p }; drawFoot(); } });
  }
  sync(); begin();
}

var H = {
en: { t:"How to put the file into the game", s1:"Open RPF Explorer with the button below.", s2:"Find the original file: use the search or browse the archives.", s2b:"Extract the original first and keep it as a backup.", s3:"Turn on Edit mode, select the file and choose Replace.", s3x:"Turn on Edit mode, select the file and choose Import XML, then pick your edited XML (Export XML gives you the original XML first).", open:"Open RPF Explorer" },
ru: { t:"Как заменить файл в игре", s1:"Открой RPF Explorer кнопкой ниже.", s2:"Найди оригинальный файл: через поиск или по папкам архивов.", s2b:"Сначала извлеки оригинал и сохрани как запасной.", s3:"Включи режим правки, выбери файл и нажми «Заменить».", s3x:"Включи режим правки, выбери файл и нажми «Импорт XML», затем укажи свой изменённый XML (оригинальный XML даёт «Экспорт XML»).", open:"Открыть RPF Explorer" },
uk: { t:"Як замінити файл у грі", s1:"Відкрий RPF Explorer кнопкою нижче.", s2:"Знайди оригінальний файл: через пошук або по папках архівів.", s2b:"Спершу витягни оригінал і збережи як запасний.", s3:"Увімкни режим правки, обери файл і натисни «Замінити».", s3x:"Увімкни режим правки, обери файл і натисни «Імпорт XML», потім вкажи свій змінений XML (оригінальний XML дає «Експорт XML»).", open:"Відкрити RPF Explorer" }
};
// Подсказка для других инструментов (Core, Таймциклы, Прицел): kind "xml" добавляет оговорку про .ypt.
// Кнопка data-tool="cw" открывает эту страницу через общий обработчик в index.html (нужна именно <button>).
window.CWHINT = function (lg, kind) {
  var d = H[lg] || H.en, x = kind === "xml";
  return '<details class="dsec cw-hint"><summary>' + esc(d.t) + '</summary><ol class="cw-steps"><li>' + esc(d.s1) + '</li><li>' + esc(d.s2) + '<br><small>' + esc(d.s2b) + '</small></li><li>' + esc(x ? d.s3x : d.s3) + '</li></ol>'
    + '<button class="mini" data-tool="cw">' + esc(d.open) + '</button></details>';
};

window.CWT = { html: html, mount: mount, open3d: open3d };
window.TOOLS = (window.TOOLS || []).concat([{ id: "cw", ico: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v4M10 13h4"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
