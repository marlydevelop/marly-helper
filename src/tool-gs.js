/* Инструмент «Settings». Подключается после tool-tc.js; регистрирует window.TOOLS.
   Человек загружает свой settings.xml (Documents\Rockstar Games\GTA V), правит параметры графики понятным интерфейсом
   или применяет пресет (максимальная/простая оптимизация, баланс, красивая графика) и сохраняет.
   Правка идёт ПО ТЕКСТУ: меняются только значения изменённых тегов <Key value="..." />, остальной файл (CRLF, BOM, порядок, неизвестные теги) как был.
   Если тега нет в файле, а пресет его задаёт, тег дописывается в конец своей секции. Запись на диск: gs.js (IPC gs:save). */
(function () {
"use strict";
var I = {
en: {
 name:"Settings", desc:"Edit your GTA V settings.xml: presets, optimization and beautiful graphics", back:"Tools",
 sub:"Upload your own settings.xml, pick a preset or tune every value by hand, then save the file back to the game folder.",
 dropT:"Drop your settings.xml here", dropS:"or click to choose a file", file:"File", reading:"Reading the file…",
 fName:"Name", fSize:"Size", fVer:"Version", fCard:"Video card", replace:"Replace file", clear:"Remove",
 path:"Usually: Documents\\Rockstar Games\\GTA V\\settings.xml. Close the game before replacing the file.",
 b:"B", kb:"KB", notXml:"This is not an .xml file.", notSet:"This is not a GTA V settings.xml (no <Settings> and <graphics>).", readFail:"Could not read the file.", tooBig:"The file is too large for settings.xml.",
 presets:"Presets", presetsH:"Presets change graphics. Only “Max optimization” also touches VSync, display mode, 3D audio and replay memory. Resolution is never changed.",
 load:"Estimated load", loadWas:"was", loadNote:"Rough estimate from the chosen values, not a real FPS measurement.", ll:["Very light","Light","Medium","Heavy","Very heavy"],
 chg:"Changed", none:"No changes yet", reset:"Reset to file", go:"Save settings.xml", goHint:"Load a file first", saved:"Saved", saveFail:"Could not save", pick:"Save settings.xml",
 vidW:"Resolution, display mode and VSync are personal: change them only if you know why.", otherH:"Tags found in your file that this tool has no description for. Edit with care.", bad:"Number expected",
 g_q:"Quality and details", g_fx:"Effects and lighting", g_sh:"Shadows", g_aa:"Anti-aliasing", g_lod:"Draw distance (LOD)", g_pop:"Population", g_sys:"System", g_vid:"Video", g_ot:"Other tags",
 p_max:"Max optimization", p_maxD:"Potato mode: shadows off, everything at the minimum, VSync off, fullscreen, 3D audio off, less replay memory. Plain picture, almost empty streets (density 0).",
 p_light:"Light optimization", p_lightD:"Noticeably more FPS, the picture stays decent.",
 p_mid:"Balanced", p_midD:"Good picture without heavy effects.",
 p_beauty:"Beautiful graphics", p_beautyD:"Maximum picture quality. Needs a strong video card.", on:"preset applied"
},
ru: {
 name:"Settings", desc:"Правка settings.xml для GTA V: пресеты, оптимизация и красивая графика", back:"Инструменты",
 sub:"Загрузи свой settings.xml, выбери пресет или настрой каждое значение вручную и сохрани файл обратно в папку игры.",
 dropT:"Перетащи сюда свой settings.xml", dropS:"или нажми, чтобы выбрать файл", file:"Файл", reading:"Читаю файл…",
 fName:"Имя", fSize:"Размер", fVer:"Версия", fCard:"Видеокарта", replace:"Заменить файл", clear:"Убрать",
 path:"Обычно: Документы\\Rockstar Games\\GTA V\\settings.xml. Перед заменой файла закрой игру.",
 b:"Б", kb:"КБ", notXml:"Это не .xml файл.", notSet:"Это не settings.xml от GTA V (нет <Settings> и <graphics>).", readFail:"Не удалось прочитать файл.", tooBig:"Файл слишком большой для settings.xml.",
 presets:"Пресеты", presetsH:"Пресеты меняют графику. Только «Максимальная оптимизация» ещё трогает VSync, режим экрана, 3D-звук и память реплея. Разрешение не меняется никогда.",
 load:"Оценка нагрузки", loadWas:"было", loadNote:"Грубая оценка по выбранным значениям, а не замер FPS.", ll:["Очень лёгкая","Лёгкая","Средняя","Тяжёлая","Очень тяжёлая"],
 chg:"Изменено", none:"Изменений пока нет", reset:"Как в файле", go:"Сохранить settings.xml", goHint:"Сначала загрузи файл", saved:"Сохранено", saveFail:"Не удалось сохранить", pick:"Сохранить settings.xml",
 vidW:"Разрешение, режим окна и вертикальная синхронизация у каждого свои: меняй, только если понимаешь зачем.", otherH:"Теги из твоего файла, для которых нет описания. Меняй осторожно.", bad:"Нужно число",
 g_q:"Качество и детали", g_fx:"Эффекты и освещение", g_sh:"Тени", g_aa:"Сглаживание", g_lod:"Дальность прорисовки (LOD)", g_pop:"Население", g_sys:"Система", g_vid:"Видео", g_ot:"Прочие теги",
 p_max:"Максимальная оптимизация", p_maxD:"Режим «картошка»: тени выключены, всё на минимум, VSync выкл, полный экран, 3D-звук выкл, меньше памяти реплея. Простая картинка, улицы почти пустые (плотность 0).",
 p_light:"Простая оптимизация", p_lightD:"Заметно больше FPS, картинка остаётся приличной.",
 p_mid:"Баланс", p_midD:"Хорошая картинка без тяжёлых эффектов.",
 p_beauty:"Красивая графика", p_beautyD:"Максимум качества картинки. Нужна мощная видеокарта.", on:"пресет применён"
},
uk: {
 name:"Settings", desc:"Правка settings.xml для GTA V: пресети, оптимізація та гарна графіка", back:"Інструменти",
 sub:"Завантаж свій settings.xml, обери пресет або налаштуй кожне значення вручну й збережи файл назад у теку гри.",
 dropT:"Перетягни сюди свій settings.xml", dropS:"або натисни, щоб обрати файл", file:"Файл", reading:"Читаю файл…",
 fName:"Ім’я", fSize:"Розмір", fVer:"Версія", fCard:"Відеокарта", replace:"Замінити файл", clear:"Прибрати",
 path:"Зазвичай: Документи\\Rockstar Games\\GTA V\\settings.xml. Перед заміною файлу закрий гру.",
 b:"Б", kb:"КБ", notXml:"Це не .xml файл.", notSet:"Це не settings.xml від GTA V (немає <Settings> і <graphics>).", readFail:"Не вдалося прочитати файл.", tooBig:"Файл завеликий для settings.xml.",
 presets:"Пресети", presetsH:"Пресети змінюють графіку. Лише «Максимальна оптимізація» ще чіпає VSync, режим екрана, 3D-звук і пам’ять реплею. Роздільна здатність не змінюється ніколи.",
 load:"Оцінка навантаження", loadWas:"було", loadNote:"Груба оцінка за обраними значеннями, а не замір FPS.", ll:["Дуже легке","Легке","Середнє","Важке","Дуже важке"],
 chg:"Змінено", none:"Змін поки немає", reset:"Як у файлі", go:"Зберегти settings.xml", goHint:"Спершу завантаж файл", saved:"Збережено", saveFail:"Не вдалося зберегти", pick:"Зберегти settings.xml",
 vidW:"Роздільна здатність, режим вікна та вертикальна синхронізація в кожного свої: змінюй, лише якщо розумієш навіщо.", otherH:"Теги з твого файлу, для яких немає опису. Змінюй обережно.", bad:"Потрібне число",
 g_q:"Якість і деталі", g_fx:"Ефекти та освітлення", g_sh:"Тіні", g_aa:"Згладжування", g_lod:"Дальність промальовування (LOD)", g_pop:"Населення", g_sys:"Система", g_vid:"Відео", g_ot:"Інші теги",
 p_max:"Максимальна оптимізація", p_maxD:"Режим «картопля»: тіні вимкнено, усе на мінімум, VSync вимк, повний екран, 3D-звук вимк, менше пам’яті реплею. Проста картинка, вулиці майже порожні (щільність 0).",
 p_light:"Проста оптимізація", p_lightD:"Помітно більше FPS, картинка лишається пристойною.",
 p_mid:"Баланс", p_midD:"Гарна картинка без важких ефектів.",
 p_beauty:"Гарна графіка", p_beautyD:"Максимум якості картинки. Потрібна потужна відеокарта.", on:"пресет застосовано"
}
};
var LI = { en: 0, ru: 1, uk: 2 };

/* Наборы значений: [значение, [en, ru, uk]] */
var T3 = function (a, b, c) { return [a, b, c]; };
var OPT = {
 Q3: [["0", T3("Normal","Обычное","Звичайне")], ["1", T3("High","Высокое","Високе")], ["2", T3("Very high","Очень высокое","Дуже високе")]],
 Q4: [["0", T3("Normal","Обычное","Звичайне")], ["1", T3("High","Высокое","Високе")], ["2", T3("Very high","Очень высокое","Дуже високе")], ["3", T3("Ultra","Ультра","Ультра")]],
 TESS: [["0", T3("Off","Выкл","Вимк")], ["1", T3("Normal","Обычная","Звичайна")], ["2", T3("High","Высокая","Висока")], ["3", T3("Very high","Очень высокая","Дуже висока")]],
 SS: [["0", T3("Off","Выкл","Вимк")], ["1", T3("Normal","Обычное","Звичайне")], ["2", T3("High","Высокое","Високе")]],
 MS: [["0", T3("Off","Выкл","Вимк")], ["2", T3("2x","2x","2x")], ["4", T3("4x","4x","4x")], ["8", T3("8x","8x","8x")]],
 AF: [["0", T3("Off","Выкл","Вимк")], ["2", T3("2x","2x","2x")], ["4", T3("4x","4x","4x")], ["8", T3("8x","8x","8x")], ["16", T3("16x","16x","16x")]],
 SOFT: [["0", T3("Sharp","Чёткие","Чіткі")], ["1", T3("Soft","Мягкие","М’які")], ["2", T3("Softer","Мягче","М’якші")], ["3", T3("Softest","Самые мягкие","Найм’якші")]],
 DX: [["0", T3("DX 10","DX 10","DX 10")], ["1", T3("DX 10.1","DX 10.1","DX 10.1")], ["2", T3("DX 11","DX 11","DX 11")]],
 CFG: [["SMC_AUTO", T3("Auto","Авто","Авто")], ["SMC_CUSTOM", T3("Custom","Свои","Свої")]],
 WIN: [["0", T3("Fullscreen","Полный экран","Повний екран")], ["1", T3("Windowed","В окне","У вікні")], ["2", T3("Borderless","Без рамки","Без рамки")]],
 VS: [["0", T3("Off","Выкл","Вимк")], ["1", T3("On","Вкл","Увімк")]],
 OO: [["0", T3("Off","Выкл","Вимк")], ["1", T3("On","Вкл","Увімк")]]
};

/* Поля: [секция, ключ, группа, тип, параметр, вес в оценке нагрузки]. Тип: e список, b булево, f дробное (параметр [min,max,шаг]), n число/текст. */
var FIELDS = [
 ["graphics","TextureQuality","q","e","Q3",3],["graphics","ShaderQuality","q","e","Q3",5],["graphics","ParticleQuality","q","e","Q3",3],["graphics","WaterQuality","q","e","Q3",4],
 ["graphics","GrassQuality","q","e","Q4",8],["graphics","Tessellation","q","e","TESS",6],["graphics","AnisotropicFiltering","q","e","AF",3],
 ["graphics","ReflectionQuality","fx","e","Q4",7],["graphics","ReflectionMSAA","fx","e","MS",4],["graphics","Reflection_MipBlur","fx","b",0,1],["graphics","SSAO","fx","e","SS",6],
 ["graphics","PostFX","fx","e","Q4",4],["graphics","DoF","fx","b",0,2],["graphics","MotionBlurStrength","fx","f",[0,1,.05],1],["graphics","Lighting_FogVolumes","fx","b",0,3],["graphics","Shader_SSA","fx","b",0,3],
 ["graphics","ShadowQuality","sh","e","Q3",8],["graphics","Shadow_SoftShadows","sh","e","SOFT",6],["graphics","Shadow_Distance","sh","f",[0,2,.05],5],["graphics","UltraShadows_Enabled","sh","b",0,3],
 ["graphics","Shadow_ParticleShadows","sh","b",0,2],["graphics","Shadow_LongShadows","sh","b",0,2],["graphics","Shadow_DisableScreenSizeCheck","sh","b",0,0],
 ["graphics","Shadow_SplitZStart","sh","n",0,0],["graphics","Shadow_SplitZEnd","sh","n",0,0],["graphics","Shadow_aircraftExpWeight","sh","n",0,0],
 ["graphics","MSAA","aa","e","MS",10],["graphics","FXAA_Enabled","aa","b",0,1],["graphics","TXAA_Enabled","aa","b",0,3],["graphics","MSAAFragments","aa","n",0,0],["graphics","MSAAQuality","aa","n",0,0],["graphics","SamplingMode","aa","n",0,0],
 ["graphics","LodScale","lod","f",[0,1,.05],4],["graphics","MaxLodScale","lod","f",[0,1,.05],4],["graphics","PedLodBias","lod","f",[0,1,.05],2],["graphics","VehicleLodBias","lod","f",[0,1,.05],2],["graphics","HdStreamingInFlight","lod","b",0,1],
 ["graphics","CityDensity","pop","f",[0,1,.05],5],["graphics","PedVarietyMultiplier","pop","f",[0,1,.05],2],["graphics","VehicleVarietyMultiplier","pop","f",[0,1,.05],2],
 ["graphics","DX_Version","sys","e","DX",0],["cfg","configSource","sys","e","CFG",0],["audio","Audio3d","sys","b",0,0],
 ["system","numBytesPerReplayBlock","sys","n",0,0],["system","numReplayBlocks","sys","n",0,0],["system","maxSizeOfStreamingReplay","sys","n",0,0],["system","maxFileStoreSize","sys","n",0,0],
 ["video","ScreenWidth","vid","n",0,0],["video","ScreenHeight","vid","n",0,0],["video","RefreshRate","vid","n",0,0],["video","Windowed","vid","e","WIN",0],["video","VSync","vid","e","VS",0],
 ["video","PauseOnFocusLoss","vid","e","OO",0],["video","Stereo","vid","e","OO",0],["video","AspectRatio","vid","n",0,0],["video","AdapterIndex","vid","n",0,0],["video","OutputIndex","vid","n",0,0],["video","Convergence","vid","n",0,0],["video","Separation","vid","n",0,0]
];
var GROUPS = ["q", "fx", "sh", "aa", "lod", "pop", "sys", "vid", "ot"];
var FM = {};
FIELDS.forEach(function (f) { FM[f[0] + "." + f[1]] = { id: f[0] + "." + f[1], sec: f[0], key: f[1], g: f[2], t: f[3], p: f[4], w: f[5] }; });

/* Подписи и подсказки: ключ -> [en, ru, uk, подсказка en, ru, uk] */
var F = {
 TextureQuality:["Texture quality","Качество текстур","Якість текстур","Needs video memory. Low = blurry textures.","Нужна видеопамять. Низкое = мыльные текстуры.","Потрібна відеопам’ять. Низька = мильні текстури."],
 ShaderQuality:["Shader quality","Качество шейдеров","Якість шейдерів","Detail of surfaces and lighting.","Детализация поверхностей и освещения.","Деталізація поверхонь і освітлення."],
 ParticleQuality:["Particle quality","Качество частиц","Якість часток","Smoke, fire, sparks, tracers.","Дым, огонь, искры, трассеры.","Дим, вогонь, іскри, трасери."],
 WaterQuality:["Water quality","Качество воды","Якість води","",".","."],
 GrassQuality:["Grass quality","Качество травы","Якість трави","One of the heaviest options. Low it for FPS.","Одна из самых тяжёлых опций. Снижай ради FPS.","Одна з найважчих опцій. Знижуй заради FPS."],
 Tessellation:["Tessellation","Тесселяция","Тесселяція","Smooths trees, cars and terrain. Costs FPS.","Сглаживает деревья, машины и землю. Съедает FPS.","Згладжує дерева, машини й землю. Їсть FPS."],
 AnisotropicFiltering:["Anisotropic filtering","Анизотропная фильтрация","Анізотропна фільтрація","Sharper textures at an angle. 16x is cheap on modern cards.","Чёткие текстуры под углом. 16x почти бесплатно на современных картах.","Чіткі текстури під кутом. 16x майже безкоштовно на сучасних картах."],
 ReflectionQuality:["Reflection quality","Качество отражений","Якість відбиттів","Reflections on cars, glass and water.","Отражения на машинах, стёклах и воде.","Відбиття на машинах, склі й воді."],
 ReflectionMSAA:["Reflection MSAA","MSAA отражений","MSAA відбиттів","Smooths edges inside reflections. Heavy.","Сглаживает края в отражениях. Тяжело.","Згладжує краї у відбиттях. Важко."],
 Reflection_MipBlur:["Reflection mip blur","Размытие отражений (mip)","Розмиття відбиттів (mip)","Blurs reflections on rough surfaces.","Размывает отражения на шероховатых поверхностях.","Розмиває відбиття на шорстких поверхнях."],
 SSAO:["Ambient occlusion (SSAO)","Затенение углов (SSAO)","Затінення кутів (SSAO)","Soft darkening in corners and cracks.","Мягкое затемнение в углах и щелях.","М’яке затемнення в кутах і щілинах."],
 PostFX:["Post processing","Постобработка","Постобробка","Bloom, glare, colour effects.","Свечение, блики, цветовые эффекты.","Світіння, відблиски, кольорові ефекти."],
 DoF:["Depth of field","Глубина резкости","Глибина різкості","Blurs the background. Off = sharper.","Размывает задний план. Выкл = чётче.","Розмиває задній план. Вимк = чіткіше."],
 MotionBlurStrength:["Motion blur strength","Сила размытия в движении","Сила розмиття в русі","0 = off.","0 = выкл.","0 = вимк."],
 Lighting_FogVolumes:["Volumetric fog","Объёмный туман","Об’ємний туман","Light shafts and fog volumes.","Лучи света и объёмный туман.","Промені світла й об’ємний туман."],
 Shader_SSA:["Screen space ambient shading","Экранное затенение (SSA)","Екранне затінення (SSA)","Extra shading pass. Heavy.","Дополнительный проход затенения. Тяжело.","Додатковий прохід затінення. Важко."],
 ShadowQuality:["Shadow quality","Качество теней","Якість тіней","The heaviest group for FPS.","Самая тяжёлая группа для FPS.","Найважча група для FPS."],
 Shadow_SoftShadows:["Soft shadows","Мягкие тени","М’які тіні","Edge softness. Sharp is the cheapest.","Мягкость краёв. Чёткие дешевле всего.","М’якість країв. Чіткі найдешевші."],
 Shadow_Distance:["Shadow distance","Дальность теней","Дальність тіней","How far shadows are drawn. 1 = default.","Как далеко рисуются тени. 1 = по умолчанию.","Як далеко малюються тіні. 1 = за замовчуванням."],
 UltraShadows_Enabled:["Ultra shadows","Ультра-тени","Ультра-тіні","Extra detailed shadows. Heavy.","Дополнительно детальные тени. Тяжело.","Додатково детальні тіні. Важко."],
 Shadow_ParticleShadows:["Particle shadows","Тени от частиц","Тіні від часток","Smoke and fire cast shadows.","Дым и огонь отбрасывают тени.","Дим і вогонь відкидають тіні."],
 Shadow_LongShadows:["Long shadows","Длинные тени","Довгі тіні","Long shadows at sunrise and sunset.","Длинные тени на рассвете и закате.","Довгі тіні на світанку й заході."],
 Shadow_DisableScreenSizeCheck:["Disable screen size check","Отключить проверку размера на экране","Вимкнути перевірку розміру на екрані","Advanced. Draws shadows of tiny objects too.","Для опытных. Рисует тени и от мелких объектов.","Для досвідчених. Малює тіні й від дрібних об’єктів."],
 Shadow_SplitZStart:["Shadow split start","Начало разделения теней","Початок поділу тіней","Advanced. -3 = automatic.","Для опытных. -3 = авто.","Для досвідчених. -3 = авто."],
 Shadow_SplitZEnd:["Shadow split end","Конец разделения теней","Кінець поділу тіней","Advanced. 0 = automatic.","Для опытных. 0 = авто.","Для досвідчених. 0 = авто."],
 Shadow_aircraftExpWeight:["Aircraft exposure weight","Вес экспозиции для авиации","Вага експозиції для авіації","Advanced. -3 = automatic.","Для опытных. -3 = авто.","Для досвідчених. -3 = авто."],
 MSAA:["MSAA anti-aliasing","Сглаживание MSAA","Згладжування MSAA","Very heavy. FXAA is far cheaper.","Очень тяжёлое. FXAA гораздо дешевле.","Дуже важке. FXAA значно дешевше."],
 FXAA_Enabled:["FXAA","FXAA","FXAA","Cheap smoothing of edges.","Дешёвое сглаживание краёв.","Дешеве згладжування країв."],
 TXAA_Enabled:["TXAA","TXAA","TXAA","NVIDIA only, needs MSAA 2x or more.","Только NVIDIA, нужен MSAA 2x и выше.","Лише NVIDIA, потрібен MSAA 2x і вище."],
 MSAAFragments:["MSAA fragments","MSAA фрагменты","MSAA фрагменти","Advanced. Set automatically by MSAA.","Для опытных. Ставится автоматически от MSAA.","Для досвідчених. Ставиться автоматично від MSAA."],
 MSAAQuality:["MSAA quality","MSAA качество","MSAA якість","Advanced. Set automatically by MSAA.","Для опытных. Ставится автоматически от MSAA.","Для досвідчених. Ставиться автоматично від MSAA."],
 SamplingMode:["Sampling mode","Режим сэмплинга","Режим семплінгу","Advanced.","Для опытных.","Для досвідчених."],
 LodScale:["Distance scaling","Дальность прорисовки","Дальність промальовування","How far objects keep full detail.","Как далеко объекты остаются детальными.","Як далеко об’єкти лишаються детальними."],
 MaxLodScale:["Extended distance scaling","Расширенная дальность","Розширена дальність","Draws far objects. Heavy on CPU.","Рисует дальние объекты. Нагружает процессор.","Малює далекі об’єкти. Навантажує процесор."],
 PedLodBias:["Pedestrian LOD bias","LOD пешеходов","LOD пішоходів","Higher = detailed pedestrians from further away.","Выше = детальные пешеходы с большего расстояния.","Вище = детальні пішоходи з більшої відстані."],
 VehicleLodBias:["Vehicle LOD bias","LOD машин","LOD машин","Higher = detailed cars from further away.","Выше = детальные машины с большего расстояния.","Вище = детальні машини з більшої відстані."],
 HdStreamingInFlight:["HD streaming in flight","HD-стриминг в полёте","HD-стрімінг у польоті","Loads sharp textures while flying.","Подгружает чёткие текстуры в полёте.","Підвантажує чіткі текстури в польоті."],
 CityDensity:["Population density","Плотность населения","Щільність населення","0 = almost no traffic and pedestrians. Servers may override it.","0 = почти нет машин и людей. Сервер может переопределять.","0 = майже немає машин і людей. Сервер може перевизначати."],
 PedVarietyMultiplier:["Pedestrian variety","Разнообразие пешеходов","Різноманітність пішоходів","Fewer models = less memory.","Меньше моделей = меньше памяти.","Менше моделей = менше пам’яті."],
 VehicleVarietyMultiplier:["Vehicle variety","Разнообразие машин","Різноманітність машин","Fewer models = less memory.","Меньше моделей = меньше памяти.","Менше моделей = менше пам’яті."],
 DX_Version:["DirectX version","Версия DirectX","Версія DirectX","Leave as is unless you know why.","Не меняй без причины.","Не змінюй без причини."],
 configSource:["Settings source","Источник настроек","Джерело налаштувань","Custom = the game keeps your values instead of auto-detecting.","Свои = игра держит твои значения, а не подбирает автоматически.","Свої = гра тримає твої значення, а не добирає автоматично."],
 Audio3d:["3D audio","3D-звук","3D-звук","","",""],
 numBytesPerReplayBlock:["Replay block size","Размер блока реплея","Розмір блоку реплею","Replay Editor memory. Advanced.","Память Replay Editor. Для опытных.","Пам’ять Replay Editor. Для досвідчених."],
 numReplayBlocks:["Replay blocks","Блоков реплея","Блоків реплею","Replay Editor memory. Advanced.","Память Replay Editor. Для опытных.","Пам’ять Replay Editor. Для досвідчених."],
 maxSizeOfStreamingReplay:["Replay streaming size","Размер стриминга реплея","Розмір стрімінгу реплею","Replay Editor memory. Advanced.","Память Replay Editor. Для опытных.","Пам’ять Replay Editor. Для досвідчених."],
 maxFileStoreSize:["Replay file store","Хранилище файлов реплея","Сховище файлів реплею","Replay Editor memory. Advanced.","Память Replay Editor. Для опытных.","Пам’ять Replay Editor. Для досвідчених."],
 ScreenWidth:["Width","Ширина","Ширина","",""," "],ScreenHeight:["Height","Высота","Висота","","",""],RefreshRate:["Refresh rate","Частота обновления","Частота оновлення","Hz","Гц","Гц"],
 Windowed:["Display mode","Режим экрана","Режим екрана","","",""],VSync:["VSync","Вертикальная синхронизация","Вертикальна синхронізація","Off = more FPS, possible tearing.","Выкл = больше FPS, возможны разрывы.","Вимк = більше FPS, можливі розриви."],
 PauseOnFocusLoss:["Pause when unfocused","Пауза при потере фокуса","Пауза при втраті фокусу","","",""],Stereo:["Stereo 3D","Стерео 3D","Стерео 3D","","",""],
 AspectRatio:["Aspect ratio","Соотношение сторон","Співвідношення сторін","","",""],AdapterIndex:["Adapter index","Номер адаптера","Номер адаптера","","",""],OutputIndex:["Output index","Номер выхода","Номер виходу","","",""],
 Convergence:["3D convergence","Конвергенция 3D","Конвергенція 3D","","",""],Separation:["3D separation","Разделение 3D","Розділення 3D","","",""]
};

/* Пресеты: только графика (видео и разрешение не трогаем). Булевы true/false, дробные числом. */
var PRESETS = {
 max: { Tessellation:0, LodScale:0, MaxLodScale:0, PedLodBias:0, VehicleLodBias:0, ShadowQuality:0, ReflectionQuality:0, ReflectionMSAA:0, SSAO:0, AnisotropicFiltering:0, MSAA:0, MSAAFragments:0, MSAAQuality:0,
  TextureQuality:0, ParticleQuality:0, WaterQuality:0, GrassQuality:0, ShaderQuality:0, Shadow_SoftShadows:0, UltraShadows_Enabled:false, Shadow_ParticleShadows:false, Shadow_Distance:0, Shadow_LongShadows:false, Shadow_DisableScreenSizeCheck:false, DX_Version:0, SamplingMode:0,
  "video.VSync":0, "video.Windowed":0, "video.Stereo":0, "audio.Audio3d":false, "system.numReplayBlocks":8, "system.maxSizeOfStreamingReplay":512,
  Reflection_MipBlur:false, FXAA_Enabled:false, TXAA_Enabled:false, Lighting_FogVolumes:false, Shader_SSA:false, PostFX:0, DoF:false, HdStreamingInFlight:false, CityDensity:0, PedVarietyMultiplier:0, VehicleVarietyMultiplier:0, MotionBlurStrength:0 },
 light: { Tessellation:0, LodScale:.8, MaxLodScale:0, PedLodBias:.2, VehicleLodBias:.2, ShadowQuality:1, ReflectionQuality:0, ReflectionMSAA:0, SSAO:0, AnisotropicFiltering:4, MSAA:0,
  TextureQuality:1, ParticleQuality:1, WaterQuality:1, GrassQuality:1, ShaderQuality:1, Shadow_SoftShadows:1, UltraShadows_Enabled:false, Shadow_ParticleShadows:false, Shadow_Distance:1, Shadow_LongShadows:false,
  Reflection_MipBlur:false, FXAA_Enabled:true, TXAA_Enabled:false, Lighting_FogVolumes:false, Shader_SSA:false, PostFX:1, DoF:false, HdStreamingInFlight:false, CityDensity:.8, PedVarietyMultiplier:.8, VehicleVarietyMultiplier:.8, MotionBlurStrength:0 },
 mid: { Tessellation:1, LodScale:1, MaxLodScale:.3, PedLodBias:.5, VehicleLodBias:.5, ShadowQuality:1, ReflectionQuality:1, ReflectionMSAA:0, SSAO:1, AnisotropicFiltering:8, MSAA:0,
  TextureQuality:2, ParticleQuality:1, WaterQuality:1, GrassQuality:2, ShaderQuality:1, Shadow_SoftShadows:2, UltraShadows_Enabled:false, Shadow_ParticleShadows:true, Shadow_Distance:1, Shadow_LongShadows:false,
  Reflection_MipBlur:true, FXAA_Enabled:true, TXAA_Enabled:false, Lighting_FogVolumes:true, Shader_SSA:false, PostFX:2, DoF:false, HdStreamingInFlight:false, CityDensity:1, PedVarietyMultiplier:1, VehicleVarietyMultiplier:1, MotionBlurStrength:0 },
 beauty: { Tessellation:3, LodScale:1, MaxLodScale:1, PedLodBias:1, VehicleLodBias:1, ShadowQuality:2, ReflectionQuality:3, ReflectionMSAA:4, SSAO:2, AnisotropicFiltering:16, MSAA:4,
  TextureQuality:2, ParticleQuality:2, WaterQuality:2, GrassQuality:3, ShaderQuality:2, Shadow_SoftShadows:3, UltraShadows_Enabled:true, Shadow_ParticleShadows:true, Shadow_Distance:1, Shadow_LongShadows:true,
  Reflection_MipBlur:true, FXAA_Enabled:true, TXAA_Enabled:false, Lighting_FogVolumes:true, Shader_SSA:true, PostFX:3, DoF:true, HdStreamingInFlight:true, CityDensity:1, PedVarietyMultiplier:1, VehicleVarietyMultiplier:1, MotionBlurStrength:0 }
};
var PORDER = ["max", "light", "mid", "beauty"];

/* ---------- работа с текстом (чистые функции, без DOM) ---------- */
function secRe(sec) { return new RegExp("(<" + sec + ">)([\\s\\S]*?)(</" + sec + ">)"); }
function parse(text) {
  if (!/<Settings\b/.test(text) || !/<graphics>/.test(text)) return null;
  var vals = {}, order = [];
  ["graphics", "system", "audio", "video"].forEach(function (sec) {
    var m = secRe(sec).exec(text); if (!m) return;
    var re = /<(\w+)\s+value\s*=\s*"([^"]*)"\s*\/>/g, x;
    while ((x = re.exec(m[2]))) { var id = sec + "." + x[1]; if (!(id in vals)) order.push(id); vals[id] = x[2]; }
  });
  var c = /<configSource>([^<]*)<\/configSource>/.exec(text);
  if (c) { vals["cfg.configSource"] = c[1].trim(); order.push("cfg.configSource"); }
  var v = /<version\s+value\s*=\s*"([^"]*)"/.exec(text), d = /<VideoCardDescription>([^<]*)</.exec(text);
  return { vals: vals, order: order, version: v ? v[1] : "", card: d ? d[1].trim() : "" };
}
function setVal(text, sec, key, val) {
  var done = false, eol = /\r\n/.test(text) ? "\r\n" : "\n";
  var out = text.replace(secRe(sec), function (m, a, body, c) {
    var re = new RegExp("(<" + key + "\\s+value\\s*=\\s*\")[^\"]*(\")");
    done = true;
    if (re.test(body)) return a + body.replace(re, function (_m, p, q) { return p + val + q; }) + c;
    var tail = /[ \t]*$/.exec(body)[0], b2 = body.slice(0, body.length - tail.length);
    return a + b2 + "    <" + key + ' value="' + val + '" />' + eol + tail + c;
  });
  return done ? out : text;
}
function build(text, vals, orig) {
  var t = text;
  Object.keys(vals).forEach(function (id) {
    if (vals[id] === orig[id]) return;
    var i = id.indexOf("."), sec = id.slice(0, i), key = id.slice(i + 1);
    if (sec === "cfg") { t = t.replace(/(<configSource>)[^<]*(<\/configSource>)/, function (_m, a, b) { return a + vals[id] + b; }); return; }
    t = setVal(t, sec, key, vals[id]);
  });
  return t;
}

/* ---------- значения ---------- */
function fmt6(x) { return Number(x).toFixed(6); }
function norm(id, v) { var f = FM[id]; if (f && f.t === "b") return v ? "true" : "false"; if (f && f.t === "f") return fmt6(v); return String(v); }
function same(id, a, b) { var f = FM[id]; if (f && f.t === "f" && !isNaN(Number(a)) && !isNaN(Number(b))) return Math.abs(Number(a) - Number(b)) < 1e-6; return a === b; }
function pid(k) { return k.indexOf(".") < 0 ? "graphics." + k : k; }
function applyPreset(vals, name) {
  var p = PRESETS[name], out = {}; Object.keys(vals).forEach(function (k) { out[k] = vals[k]; });
  Object.keys(p).forEach(function (k) { var id = pid(k); out[id] = norm(id, p[k]); });
  if ("cfg.configSource" in out) out["cfg.configSource"] = "SMC_CUSTOM";
  return out;
}
function matches(vals, name) {
  var p = PRESETS[name], ok = true;
  Object.keys(p).forEach(function (k) { var id = pid(k); if (!(id in vals) || !same(id, vals[id], norm(id, p[k]))) ok = false; });
  return ok;
}
/* Оценка нагрузки 0..100 по весам полей */
function load(vals) {
  var s = 0, w = 0;
  FIELDS.forEach(function (f) {
    var id = f[0] + "." + f[1], wt = f[5]; if (!wt || !(id in vals)) return;
    var v = vals[id], n = 0;
    if (f[3] === "b") n = v === "true" ? 1 : 0;
    else if (f[3] === "f") { var r = f[4]; n = Math.max(0, Math.min(1, (Number(v) - r[0]) / (r[1] - r[0]))); if (isNaN(n)) n = 0; }
    else { var o = OPT[f[4]], k = -1; o.forEach(function (x, i) { if (x[0] === v) k = i; }); n = k < 0 ? 0 : k / (o.length - 1); }
    s += wt * n; w += wt;
  });
  return w ? Math.round(100 * s / w) : 0;
}

/* ---------- состояние ---------- */
var lang = "en", root = null;
function blank() { return { name: "", size: 0, text: "", ok: false, err: "", vals: {}, orig: {}, order: [], version: "", card: "" }; }
var st = blank(), busy = "", saveMsg = null, openG = { q: 1, sh: 1 }, note = "";

function L(k) { return (I[lang] && I[lang][k]) || I.en[k] || k; }
function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function $(s) { return root ? root.querySelector(s) : null; }
function live() { return root && root.querySelector(".gs-w"); }
function ico(n) { return n === "back" ? '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' : ""; }
function fmtSize(n) { return n < 1024 ? n + " " + L("b") : (n / 1024).toFixed(1) + " " + L("kb"); }
function fname(key) { var f = F[key]; return f ? f[LI[lang]] : key; }
function fhint(key) { var f = F[key]; var h = f ? f[3 + LI[lang]] : ""; return h && h.length > 1 ? h : ""; }
function oname(o) { return o[1][LI[lang]]; }
function groupOf(id) { return FM[id] ? FM[id].g : "ot"; }
function changedIds() { return Object.keys(st.vals).filter(function (id) { return !(id in st.orig) || !same(id, st.vals[id], st.orig[id]); }); }
function GN(g) { return L("g_" + g); }

function html(lg) {
  lang = lg || lang;
  return '<div class="gs-w nofile" id="gsW"><div class="core-top"><button class="back" data-tool="">' + ico("back") + L("back") + '</button><div class="core-tt"><h1>' + esc(L("name")) + '</h1><p class="sub">' + L("sub") + '</p></div>'
   + '<div class="core-sv gs-sv"><p class="dsum" id="gsSum"></p><button class="mini" id="gsReset">' + L("reset") + '</button><button class="go ddgo" id="gsGo">' + L("go") + '</button></div></div>'
   + '<div class="card gs-side"><div><div class="ddfh"><h3>' + L("file") + '</h3><span id="gsBtns"></span></div><div id="gsBody"></div></div><div id="gsRest"></div><p class="note">' + esc(L("path")) + '</p></div>'
   + '<div class="card gs-main"><div id="gsGroups"></div></div><input type="file" id="gsPick" accept=".xml,text/xml,application/xml" hidden></div>';
}

/* ---------- отрисовка ---------- */
function ctl(id) {
  var f = FM[id], v = st.vals[id];
  if (!f) return '<input class="inp" data-k="' + id + '" data-raw="1" value="' + esc(v) + '">';
  if (f.t === "b") return '<button class="chk" role="checkbox" data-k="' + id + '" aria-checked="' + (v === "true") + '"></button>';
  if (f.t === "f" && !isNaN(Number(v))) { var r = f.p; return '<span class="gs-rg"><input type="range" data-k="' + id + '" min="' + r[0] + '" max="' + r[1] + '" step="' + r[2] + '" value="' + Number(v) + '"><b class="gs-v">' + Number(v).toFixed(2) + '</b></span>'; }
  if (f.t === "e") {
    var o = OPT[f.p].slice(), has = o.some(function (x) { return x[0] === v; });
    if (!has) o.push([v, [v, v, v]]);
    if (o.length <= 4) return '<div class="seg">' + o.map(function (x) { return '<button data-k="' + id + '" data-v="' + esc(x[0]) + '" aria-pressed="' + (x[0] === v) + '">' + esc(oname(x)) + '</button>'; }).join("") + '</div>';
    return '<select class="inp sel" data-k="' + id + '">' + o.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === v ? " selected" : "") + '>' + esc(oname(x)) + '</option>'; }).join("") + '</select>';
  }
  return '<input class="inp" data-k="' + id + '" data-num="1" value="' + esc(v) + '">';
}
function rowH(id) {
  var key = id.slice(id.indexOf(".") + 1), h = FM[id] ? fhint(key) : "", wide = FM[id] && FM[id].t === "e" && OPT[FM[id].p].length <= 4 && (FM[id].p === "Q3" || FM[id].p === "Q4" || FM[id].p === "TESS" || FM[id].p === "SOFT" || FM[id].p === "WIN") ? " st" : "";
  return '<div class="row' + wide + '" data-row="' + id + '"><span class="l">' + esc(FM[id] ? fname(key) : key) + (h ? '<small>' + esc(h) + '</small>' : "") + '</span>' + ctl(id) + '</div>';
}
function drawGroups() {
  var box = $("#gsGroups"); if (!box) return;
  var by = {}; GROUPS.forEach(function (g) { by[g] = []; });
  FIELDS.forEach(function (f) { var id = f[0] + "." + f[1]; if (id in st.vals) by[f[2]].push(id); });
  st.order.forEach(function (id) { if (!FM[id] && id in st.vals) by.ot.push(id); });
  box.innerHTML = GROUPS.filter(function (g) { return by[g].length; }).map(function (g) {
    return '<details class="dsec" data-g="' + g + '"' + (openG[g] ? " open" : "") + '><summary><span>' + esc(GN(g)) + '</span><em class="gs-pill" data-pill="' + g + '"></em></summary>'
      + (g === "vid" ? '<p class="warn">' + esc(L("vidW")) + '</p>' : "") + (g === "ot" ? '<p class="note">' + esc(L("otherH")) + '</p>' : "") + '<div class="gs-rows">' + by[g].map(rowH).join("") + '</div></details>';
  }).join("");
  pills();
}
function pills() {
  var c = {}; changedIds().forEach(function (id) { var g = groupOf(id); c[g] = (c[g] || 0) + 1; });
  Array.prototype.forEach.call(root.querySelectorAll("[data-pill]"), function (p) { var n = c[p.dataset.pill] || 0; p.textContent = n ? String(n) : ""; p.style.display = n ? "" : "none"; });
}
function meter() {
  var m = $("#gsMeter"); if (!m) return;
  var a = load(st.vals), b = load(st.orig), k = a < 15 ? 0 : a < 35 ? 1 : a < 55 ? 2 : a < 78 ? 3 : 4;
  m.innerHTML = '<div class="gs-mh"><b>' + L("load") + ': ' + a + '%</b><span>' + esc(L("ll")[k]) + (a !== b ? ' · ' + L("loadWas") + ' ' + b + '%' : '') + '</span></div>'
    + '<div class="gs-tr"><i style="width:' + a + '%;background:hsl(' + Math.round(130 - a * 1.3) + ',65%,50%)"></i></div><p class="note">' + esc(L("loadNote")) + '</p>';
}
function presetsHtml() {
  return PORDER.map(function (p) { return '<button class="gs-pc gs-p-' + p + '" data-preset="' + p + '" aria-pressed="' + matches(st.vals, p) + '"><b>' + esc(L("p_" + p)) + '</b><small>' + esc(L("p_" + p + "D")) + '</small></button>'; }).join("");
}
function stat() {
  var go = $("#gsGo"), sum = $("#gsSum"); if (!go || !sum) return;
  var n = changedIds().length, bad = !!root.querySelector(".inp.bad");
  go.disabled = !st.ok || !!busy || bad;
  if (!st.ok) { sum.className = "dsum"; sum.textContent = ""; var b0 = $("#gsReset"); if (b0) b0.disabled = true; return; }
  var b2 = $("#gsReset"); if (b2) b2.disabled = !n;
  if (busy) { sum.className = "dsum"; sum.textContent = busy; return; }
  if (saveMsg) { sum.className = "dsum " + (saveMsg.ok ? "okc" : "erc"); sum.textContent = saveMsg.t; return; }
  if (bad) { sum.className = "dsum erc"; sum.textContent = L("bad"); return; }
  sum.className = "dsum"; sum.textContent = n ? L("chg") + ": " + n : L("none");
}
function refresh() { meter(); pills(); stat(); var pb = $("#gsPre"); if (pb) pb.innerHTML = presetsHtml(); }
function sync() {
  if (!live()) return;
  var body = $("#gsBody"), btns = $("#gsBtns"), rest = $("#gsRest"), w = $("#gsW");
  w.classList.toggle("nofile", !st.ok);
  if (!st.name) {
    body.innerHTML = '<div class="drop" id="gsDrop"><b>' + L("dropT") + '</b><span>' + L("dropS") + '</span></div>'; btns.innerHTML = ""; rest.innerHTML = ""; $("#gsGroups").innerHTML = "";
    if (note) { var d = $("#gsDrop"); if (d) d.insertAdjacentHTML("afterend", '<p class="dsum erc">' + esc(note) + '</p>'); }
    stat(); return;
  }
  body.innerHTML = '<div class="retf"><span>' + L("fName") + ': <b>' + esc(st.name) + '</b></span><span>' + L("fSize") + ': <b>' + fmtSize(st.size) + '</b></span>'
    + (st.ok ? (st.version ? '<span>' + L("fVer") + ': <b>' + esc(st.version) + '</b></span>' : "") + (st.card ? '<span>' + L("fCard") + ': <b>' + esc(st.card) + '</b></span>' : "") : '<span class="erc">' + esc(st.err) + '</span>') + '</div>';
  btns.innerHTML = '<button class="mini" id="gsRep">' + L("replace") + '</button><button class="mini" id="gsClr">' + L("clear") + '</button>';
  if (!st.ok) { rest.innerHTML = ""; $("#gsGroups").innerHTML = ""; stat(); return; }
  rest.innerHTML = '<h4>' + L("presets") + '</h4><p class="note">' + esc(L("presetsH")) + '</p><div class="gs-pre" id="gsPre" style="margin-top:10px"></div><div id="gsMeter" class="gs-meter"></div>';
  drawGroups(); refresh();
}

/* ---------- загрузка ---------- */
function fail(f, key) { busy = ""; st = blank(); st.name = f.name; st.size = f.size; st.err = L(key); sync(); }
function loadFile(f) {
  if (!f) return;
  saveMsg = null; note = "";
  if (!/\.xml$/i.test(f.name || "")) { st = blank(); note = L("notXml"); sync(); return; }
  if (f.size > 1024 * 1024) { fail(f, "tooBig"); return; }
  busy = L("reading");
  f.arrayBuffer().then(function (buf) {
    var t = new TextDecoder("utf-8", { ignoreBOM: true }).decode(buf), p = parse(t);
    if (!p) { fail(f, "notSet"); return; }
    var n = blank(); n.name = f.name; n.size = f.size; n.text = t; n.ok = true; n.order = p.order; n.version = p.version; n.card = p.card;
    n.vals = {}; n.orig = {}; Object.keys(p.vals).forEach(function (k) { n.vals[k] = p.vals[k]; n.orig[k] = p.vals[k]; });
    busy = ""; st = n; sync();
  }).catch(function () { fail(f, "readFail"); });
}

/* ---------- сохранение ---------- */
function save() {
  if (!st.ok) return;
  var text = build(st.text, st.vals, st.orig);
  busy = L("reading"); saveMsg = null; stat();
  var done = function (r) {
    busy = "";
    saveMsg = r && r.ok ? { ok: true, t: L("saved") + (r.path ? ": " + r.path : "") } : (r && r.error === "cancel" ? null : { ok: false, t: L("saveFail") + (r && r.error ? " (" + r.error + ")" : "") });
    stat();
  };
  if (window.api && window.api.gsSave) {
    window.api.gsSave({ name: "settings.xml", text: text, labels: { pick: L("pick") } }).then(done, function () { done({ ok: false, error: "ipc" }); });
  } else {
    try { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/xml" })); a.download = "settings.xml"; document.body.appendChild(a); a.click(); a.remove(); done({ ok: true }); }
    catch (e) { done({ ok: false, error: "dl" }); }
  }
}

/* ---------- события ---------- */
function setV(id, v) { st.vals[id] = v; saveMsg = null; }
function onClick(e) {
  if (!live()) return;
  var t = e.target;
  if (t.closest("#gsDrop") || t.closest("#gsRep")) { var p = $("#gsPick"); if (p) { p.value = ""; p.click(); } return; }
  if (t.closest("#gsClr")) { st = blank(); saveMsg = null; note = ""; sync(); return; }
  if (t.closest("#gsGo")) { save(); return; }
  if (t.closest("#gsReset")) { Object.keys(st.vals).forEach(function (k) { if (!(k in st.orig)) delete st.vals[k]; else st.vals[k] = st.orig[k]; }); saveMsg = null; drawGroups(); refresh(); return; }
  var pr = t.closest("[data-preset]");
  if (pr) { st.vals = applyPreset(st.vals, pr.dataset.preset); saveMsg = null; drawGroups(); refresh(); return; }
  var c = t.closest(".chk[data-k]");
  if (c) { var on = c.getAttribute("aria-checked") !== "true"; c.setAttribute("aria-checked", on); setV(c.dataset.k, on ? "true" : "false"); refresh(); return; }
  var b = t.closest(".seg button[data-k]");
  if (b) { Array.prototype.forEach.call(b.parentNode.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); setV(b.dataset.k, b.dataset.v); refresh(); return; }
}
function onInput(e) {
  if (!live()) return;
  var t = e.target, id = t.dataset && t.dataset.k; if (!id) return;
  if (t.type === "range") { var s = $('[data-row="' + id + '"] .gs-v'); if (s) s.textContent = Number(t.value).toFixed(2); setV(id, fmt6(t.value)); meter(); pills(); stat(); return; }
  if (t.tagName === "SELECT") { setV(id, t.value); refresh(); return; }
  var v = t.value.trim(), ok = t.dataset.num ? /^-?\d+(\.\d+)?$/.test(v) : !/["<>&]/.test(v);
  t.classList.toggle("bad", !ok);
  if (ok) setV(id, v);
  refresh();
}
function onToggle(e) { var d = e.target; if (d && d.tagName === "DETAILS" && d.dataset.g) openG[d.dataset.g] = d.open ? 1 : 0; }
function onChange(e) { if (live() && e.target && e.target.id === "gsPick") loadFile(e.target.files && e.target.files[0]); }
function onOver(e) { if (!live()) return; e.preventDefault(); var d = $("#gsDrop"); if (d) d.style.borderColor = "var(--accent)"; }
function onLeave(e) { if (!live()) return; if (!root.contains(e.relatedTarget)) { var d = $("#gsDrop"); if (d) d.style.borderColor = ""; } }
function onDrop(e) { if (!live()) return; e.preventDefault(); var d = $("#gsDrop"); if (d) d.style.borderColor = ""; var fs = e.dataTransfer && e.dataTransfer.files; if (fs && fs.length) loadFile(fs[0]); }
function mount(el, lg) {
  root = el; lang = lg || lang;
  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onChange);
  root.addEventListener("toggle", onToggle, true);
  root.addEventListener("dragover", onOver); root.addEventListener("dragleave", onLeave); root.addEventListener("drop", onDrop);
  sync();
}

window.GST = { html: html, mount: mount, state: function () { return st; }, lib: { parse: parse, build: build, setVal: setVal, applyPreset: applyPreset, matches: matches, load: load, PRESETS: PRESETS, FIELDS: FIELDS, FM: FM, F: F, OPT: OPT } };
window.TOOLS = (window.TOOLS || []).concat([{ id: "gs", ico: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>', name: function (lg) { return I[lg].name; }, desc: function (lg) { return I[lg].desc; },
  view: function (lg) { return html(lg); }, mount: function (el, lg) { mount(el, lg); } }]);
})();
