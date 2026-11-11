# Steam Workshop — поля публикации карты

Карта — не мод: в игру не встраивается, открывается в браузере (GitHub Pages). Предмет Мастерской нужен ради
страницы с описанием и ссылками. Загрузка — Storm Workshop Tool (Steam → Caribbean Legend → альтернативный запуск).

| Поле | Значение |
|---|---|
| Workshop ID | — (после первой публикации вписать сюда и в описание мода `D:\Progs\CaribbeanLegendMod\WORKSHOP.md`) |
| Title | `Interactive Map / Интерактивная карта` |
| Contents folder | `D:\Progs\CaribbeanLegendMap\workshop\content` — только `README.txt` со ссылками. Пустую папку инструмент для **нового** предмета не принимает («For new mods you MUST specify a content folder»); при обновлениях папку можно не указывать (инструмент спросит «без изменений контента?» → Да) |
| Preview image | `map.jpg` (≈240 КБ; лимит Steam 1 МБ) |
| Visibility | сначала Private → проверить страницу → Public |
| Description | блок ниже (BBCode Steam). Лимит Steam — 8000 байт UTF-8 (кириллица = 2 байта). Картинки — только `[img]` с полным https-адресом |
| Change notes | `Initial release / Первая версия` |

**Перед публикацией:** включить GitHub Pages для репозитория — GitHub → `CaribbeanLegendMap` → Settings → Pages →
Source: *Deploy from a branch*, Branch: `main`, папка `/ (root)` → Save. Через 1–2 минуты карта откроется по адресу
https://lukovenkoas.github.io/CaribbeanLegendMap/ (на него ведут ссылки в описании).

---

## Description (вставить целиком)

```
[h2]Open the map / Открыть карту: [url=https://lukovenkoas.github.io/CaribbeanLegendMap/]lukovenkoas.github.io/CaribbeanLegendMap[/url][/h2]
[url=https://lukovenkoas.github.io/CaribbeanLegendMap/][img]https://raw.githubusercontent.com/lukovenkoas/CaribbeanLegendMap/main/map.jpg[/img][/url]

[b]EN[/b]
An interactive map of the West Indies for Caribbean Legend 1.9 — built from the game files. Opens in any browser, nothing to install. [b]This item does not change the game[/b]: subscribing only downloads a text file with the link.

[list]
[*][b]Navigation[/b]: mouse wheel — zoom, drag — pan, ⤢ — fit the map. Right-click — a point with its latitude/longitude.
[*][b]Layers[/b]: islands, regions (the Main and parts of Cuba/Hispaniola), settlements with nation flags and a nation filter, lighthouses, landing spots (bays/coves), hidden quest islands, your own marks. Bay names appear when you zoom in (or always).
[*][b]Search[/b] by name in English/Russian or by internal id; "filter the map" leaves only what was found.
[*][b]Object card[/b]: coordinates, nation, what is on the island, the game's map items (ordinary and admiral's maps) — click to open the map picture.
[*][b]Latitude/longitude → point[/b]: enter the coordinates from the sextant/compass and see where it is (the game's own formula).
[*][b]Background[/b]: a clean map or the game map with labels; sea-area borders; grid.
[*]The page address keeps your selection, so a link can be shared: [i]#sel=island:Jamaica[/i], [i]#ll=15.4667,63.4667[/i], [i]#q=bay[/i].
[*]Interface: English / Russian.
[/list]

[hr][/hr]

[b]RU[/b]
Интерактивная карта Вест-Индии для Caribbean Legend 1.9 — собрана из файлов игры. Открывается в любом браузере, ничего ставить не нужно. [b]Игру этот предмет не меняет[/b]: при подписке скачивается только текстовый файл со ссылкой.

[list]
[*][b]Навигация[/b]: колесо — масштаб, перетаскивание — сдвиг, ⤢ — вписать карту. Правый клик — точка с широтой/долготой.
[*][b]Слои[/b]: острова, регионы (материк и части Кубы/Эспаньолы), поселения с флажком нации и фильтром по нациям, маяки, места высадки (бухты), скрытые квестовые острова, свои метки. Названия бухт появляются при приближении (или всегда).
[*][b]Поиск[/b] по названию на русском/английском или по id; «фильтровать карту» оставляет только найденное.
[*][b]Карточка объекта[/b]: координаты, нация, что на острове, карты-предметы игры (обычные и адмиральские) — клик открывает картинку карты.
[*][b]Широта/долгота → точка[/b]: введите координаты с секстанта/буссоли и увидите место на карте (формула самой игры).
[*][b]Фон[/b]: очищенная карта или «Отличная карта» игры с надписями; границы акваторий; сетка.
[*]Адрес страницы запоминает выбор — ссылкой можно поделиться: [i]#sel=island:Jamaica[/i], [i]#ll=15.4667,63.4667[/i], [i]#q=бухта[/i].
[*]Интерфейс: русский / английский.
[/list]

[hr][/hr]
[b]CL Toolkit[/b] — my mod with almost everything you may need in the game (items, ship class, teleports, relations, quest fleet finder…) / мой мод, в котором есть почти всё, что может понадобиться в игре (предметы, класс корабля, телепорты, отношения, поиск квестовых флотов…):
https://steamcommunity.com/sharedfiles/filedetails/?id=3837821686

Source / Исходники: https://github.com/lukovenkoas/CaribbeanLegendMap
Game assets / Материалы игры: [url=https://github.com/Blackmark-Studio/Caribbean-Legend/blob/main/LICENSE.md]Storm Engine EULA[/url]
```
