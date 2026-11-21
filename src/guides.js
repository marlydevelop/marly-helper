/* ============================================================
   ГАЙДЫ: сюда ты вручную вписываешь все гайды.
   Порядок в списке = порядок в приложении (первый блок сверху).

   КАК ДОБАВИТЬ ГАЙД:
   1. Скопируй целиком один блок { ... },  (вместе с запятой в конце).
   2. Вставь его в нужное место списка, между другими блоками.
   3. Заполни поля и сохрани файл. Перезапусти приложение (start.bat).
      Для готового exe: пересобери через build-exe.bat.

   ПОЛЯ ГАЙДА:
   - title   название гайда (ru, uk, en).
   - short   КОРОТКОЕ описание, видно в списке под названием (ru, uk, en).
   - full    ПОЛНОЕ описание, видно в окне гайда (ru, uk, en).
             Пустая строка = новый абзац. Абзац, который начинается
             с "# " (решётка и пробел), становится заголовком.
             Пиши между обратными кавычками `...`.
   - video   ссылки на видео на YouTube, по одной на язык приложения:
             video: { ru: "...", uk: "...", en: "..." }
             Какой язык выбран в приложении, то видео и показывается
             (и превью в списке тоже от него). Подходят ссылки вида
             "https://www.youtube.com/watch?v=XXXXXXXXXXX" и
             "https://youtu.be/XXXXXXXXXXX".
             Если для языка ссылка пустая "", покажется русская.
             Если пусты все три = видео нет, в списке серая заглушка.
             Можно и одной ссылкой: video: "https://..." (одно видео
             для всех языков).
   - file    ссылка на материалы для скачивания (https://...).
             Пусто "" = в окне гайда кнопки «Скачать» не будет.
   - thumb   НЕОБЯЗАТЕЛЬНО: своя картинка превью вместо YouTube,
             ссылка https://... или путь от папки src, например
             "guides/mod1.jpg". Не нужна, оставь "".
   - new     0 или 1. 0 = обычный гайд, ничего не меняется.
             1 = гайд поднимается в самый верх списка, получает
             золотую обводку и надпись NEW на превью. Если у нескольких
             гайдов new: 1, они идут сверху в своём порядке. Если поля
             new в блоке нет, считается 0. Когда гайд перестал быть
             новым, поставь 0.

   ПРАВИЛА:
   - Если язык не нужен, оставь его пустым "" (в приложении покажется
     русский).
   - Внутри обычных кавычек "..." не используй двойные кавычки:
     пиши «ёлочки» или одинарные '...'.
   - Не удаляй квадратные скобки [ ], запятые между блоками
     и строку "];" в самом конце.
   - Ошибка в этом файле ломает только вкладку «Гайды»,
     остальное приложение работает.
   ============================================================ */
window.GUIDES = [
  {
    title: { ru: "Урок 1 - Создание ПНГ карты", uk: "Урок 1 - Створення ПНГ карти", en: "Lesson 1 – Creating a PNG map" },
    short: { ru: "Учимся создавать свою ПНГ карту.", uk: "Вчимося створювати свою ПНГ карту.", en: "Temproary unavailable. You can watch in another language." },
    full: {
      ru: `# Что будет в уроке?

В этом уроке будет наглядн показано как создать свою ПНГ карту.
Сначало просмотр, потом пробуешь сам.
Если не что-то не вышло - вернулся, пересмотрел, пошёл делать.`,
      uk: `# Що буде на уроці?

На цьому уроці наочно покажуть, як створити власну карту ПНГ.
Спочатку переглянь, потім спробуй сам.
Якщо щось не вийшло — повернися, переглянь ще раз і спробуй знову.`,
      en: `# What will this lesson cover?

This lesson will clearly demonstrate how to create your own PNG map.
First, watch the tutorial; then have a go yourself.
If something doesn’t work out, go back, watch it again, and then have another go.`
    },
    video: { ru: "https://youtu.be/79kd1kRjBUI", uk: "https://youtu.be/79kd1kRjBUI", en: "https://youtu.be/79kd1kRjBUI" },
    file: "https://drive.google.com/file/d/1-_MaORmNYoEy5NiEh7nnZR4K1Qq8parK/view?usp=sharing",
    thumb: "",
    new: 0
  },
  {
    title: { ru: "Урок 2 - Создание векторной карты", uk: "Урок 2 - Створення векторної карти", en: "Lesson 2 – Creating a vector map" },
    short: { ru: "Учимся создавать свою векторную карту.", uk: "Вчимося створювати свою векторну карту.", en: "Temproary unavailable. You can watch in another language." },
    full: {
      ru: `# Что будет в уроке?

В этом уроке будет наглядн показано как создать свою векторную карту.
Сначало просмотр, потом пробуешь сам.
Если не что-то не вышло - вернулся, пересмотрел, пошёл делать.`,
      uk: `# Що буде на уроці?

На цьому уроці наочно покажуть, як створити власну векторну карту.
Спочатку переглянь, потім спробуй сам.
Якщо щось не вийшло — повернися, переглянь ще раз і спробуй знову.`,
      en: `# What will this lesson cover?

This lesson will clearly demonstrate how to create your own vector map.
First, watch the tutorial; then have a go yourself.
If something doesn’t work out, go back, watch it again, and then have another go.`
    },
    video: { ru: "https://youtu.be/U2Etd_e2hPU", uk: "https://youtu.be/U2Etd_e2hPU", en: "https://youtu.be/U2Etd_e2hPU" },
    file: "https://drive.google.com/file/d/1tlGbLY6PK91_znwl0LixztmFi6tYUvMW/view?usp=sharing",
    thumb: "",
    new: 0
  },
  {
    title: { ru: "Урок 3 - Создание гташного прицела", uk: "Урок 3 - Створення гташного прицілу", en: "Lesson 3 – Creating a sight" },
    short: { ru: "Учимся создавать свой прицел.", uk: "Вчимося створювати свій приціл.", en: "Temproary unavailable. You can watch in another language." },
    full: {
      ru: `# Что будет в уроке?

В этом уроке будет наглядн показано как создать свой прицел.
Сначало просмотр, потом пробуешь сам.
Если не что-то не вышло - вернулся, пересмотрел, пошёл делать.`,
      uk: `# Що буде на уроці?

На цьому уроці наочно покажуть, як створити власний приціл.
Спочатку переглянь, потім спробуй сам.
Якщо щось не вийшло — повернися, переглянь ще раз і спробуй знову.`,
      en: `# What will this lesson cover?

This lesson will clearly show you how to create your own crosshair.
First, watch the tutorial; then have a go yourself.
If something doesn’t work out, go back, watch it again, and have another go.`
    },
    video: { ru: "https://youtu.be/CDI7mzyTTik", uk: "https://youtu.be/CDI7mzyTTik", en: "https://youtu.be/CDI7mzyTTik" },
    file: "",
    thumb: "",
    new: 0
  }
];
