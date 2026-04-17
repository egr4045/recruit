# План: фиксы для Telegram-уведомлений и админки

## Context

После поднятия проекта пользователь обнаружил три проблемы при прогоне реальной заявки по полному циклу:

1. **TG-уведомление:** «Открыть в админке» приходит простым текстом, не кликабельно.
2. **Список заявок в админке:** для появления новой заявки нужно вручную обновлять страницу. У пункта «Заявки» в сайдбаре нет счётчика заявок в ожидании.
3. **Вкладка «Кандидаты»:** пустая, даже после проведения заявки по всему циклу (PENDING → CONFIRMED → COMPLETED). В UI есть подсказка «Профили создаются при подтверждении заявки», но на деле этого не происходит.

Все три — разные корневые причины. Фиксы независимы.

---

## Проблема 1 — TG-кнопка не кликабельна

### Причина
[lib/telegram.ts:19-35](lib/telegram.ts) собирает сообщение через `parse_mode: "Markdown"` (v1) с синтаксисом `[Открыть в админке](${NEXT_PUBLIC_BASE_URL}/admin/applications/${id})`. Две проблемы:
- **Главная:** `NEXT_PUBLIC_BASE_URL=http://localhost:3000`. Telegram на мобильных **намеренно** не делает ссылки на `localhost`/`127.0.0.1`/приватные сети кликабельными (anti-abuse). На десктопе они работают, на мобиле — отображаются как текст. Это и наблюдает пользователь.
- **Доп. хрупкость:** Markdown v1 падает на `_`/`*` в пользовательских данных (например `ivan_petrov@mail.ru`). Сейчас `fetch(...).catch(() => null)` глотает даже HTTP 4xx от Telegram — можно никогда не узнать, что сообщение не дошло.

### Решение
1. Заменить текстовую ссылку на **inline-кнопку** через `reply_markup.inline_keyboard`. Кнопки с localhost на мобиле всё ещё не тыкаются — но на десктопе работают надёжно, и шаблон устойчив к спецсимволам.
2. Переключиться на `parse_mode: "HTML"` и экранировать динамические поля (`fullName`, `email`, `position`, `grade`) — убирает риск падений парсинга.
3. Добавить логирование не-200 ответов от Telegram API, чтобы ловить ошибки в будущем.
4. **Вне кода:** для кликабельности на мобиле нужен публичный URL (cloudflared/ngrok tunnel). Это настройка окружения — попрошу пользователя подтвердить, стоит ли добавить инструкцию в `.env.example`.

### Файлы
- [lib/telegram.ts](lib/telegram.ts) — переписать тело сообщения + `reply_markup` + `escapeHtml` хелпер.

---

## Проблема 2 — Автообновление списка заявок + счётчик в сайдбаре

### Причина
- [app/admin/applications/page.tsx:46](app/admin/applications/page.tsx) — `useEffect(..., [status, search])`: fetch только при монтировании и смене фильтра. Никакого polling/revalidate.
- [components/admin/AdminSidebar.tsx:5-9](components/admin/AdminSidebar.tsx) — статический массив `navItems`, никаких счётчиков.

### Решение
1. **Polling в списке заявок:** добавить `setInterval(fetchData, 10_000)` в `useEffect`. Тихое фоновое обновление — без `setLoading(true)`, чтобы таблица не мигала (ввести флаг `initial`/`silent`).
2. **Новый эндпоинт `GET /api/admin/applications/counts`:** возвращает `{ pending: number }` через `prisma.application.count({ where: { status: "PENDING" } })`. Лёгкий, не тянет все поля.
3. **Сайдбар:** в `AdminSidebar` (уже `"use client"`) добавить `useEffect` с polling того же счётчика каждые 10 секунд. Рендерить бейдж (чёрный/красный кружок с числом) справа от «Заявки» когда `pending > 0`. Элементы `navItems` теперь должны поддерживать опциональный `badge` — расширить тип или пройтись условно только по href `/admin/applications`.

### Файлы
- [app/admin/applications/page.tsx](app/admin/applications/page.tsx) — добавить interval в эффект, silent refetch.
- [components/admin/AdminSidebar.tsx](components/admin/AdminSidebar.tsx) — polling + рендер бейджа.
- **Новый файл:** `app/api/admin/applications/counts/route.ts` — GET handler с `prisma.application.count`. Middleware уже защищает `/api/admin/:path*`, так что auth не нужен отдельно.

---

## Проблема 3 — Кандидаты не создаются

### Причина
[app/api/admin/applications/[id]/route.ts:56-63](app/api/admin/applications/[id]/route.ts) — PATCH обновляет только `Application`. `CandidateProfile` не создаётся нигде. При этом:
- [prisma/schema.prisma:74-89](prisma/schema.prisma) — `CandidateProfile` висит на `@unique applicationId`, связь 1:1 с `Application`.
- [app/admin/candidates/page.tsx:81](app/admin/candidates/page.tsx) — UI-подсказка обещает «создаются при подтверждении заявки», но триггер не реализован.

Вывод: при переводе заявки в `CONFIRMED` надо делать upsert `CandidateProfile`.

### Решение
1. **В PATCH хендлере:** после `prisma.application.update(...)` добавить:
   ```ts
   if (status === "CONFIRMED") {
     await prisma.candidateProfile.upsert({
       where: { applicationId: Number(id) },
       create: { applicationId: Number(id) },
       update: {},
     });
   }
   ```
   Срабатывает на переход → CONFIRMED. Upsert идемпотентен — повторный CONFIRMED не ломается.

2. **Бэкфилл существующих заявок:** у пользователя уже есть CONFIRMED-заявки без профилей (они и прогонял цикл). Добавить разовый скрипт `scripts/backfill-candidates.mjs`, который для всех `Application` в статусе `CONFIRMED`/`COMPLETED` без профиля создаёт пустой `CandidateProfile`. Запускается один раз через `node scripts/backfill-candidates.mjs`.

### Файлы
- [app/api/admin/applications/[id]/route.ts](app/api/admin/applications/[id]/route.ts) — добавить upsert после update.
- **Новый файл:** `scripts/backfill-candidates.mjs` — разовый бэкфилл.

### Почему именно CONFIRMED, а не COMPLETED
UI прямо говорит «при подтверждении». Логика: как только админ подтвердил слот — кандидат уже в базе, можно редактировать его профиль (теги, заметки, рейтинг) параллельно с самим собесом. Если завязаться на COMPLETED, профиль появится только после ручного перевода в финальный статус — теряется смысл базы.

---

## Верификация

1. **Dev-сервер уже запущен** на `http://localhost:3000` (фон `brvivllep`).
2. **TG-уведомление:**
   - Создать тестовую заявку через `/sobies` (или вручную через API).
   - Проверить, что TG-сообщение содержит **кнопку** «Открыть в админке» (inline-кнопка, не текст).
   - На десктопе Telegram — клик должен открывать `http://localhost:3000/admin/applications/<id>`.
   - На мобиле — ожидаемо: localhost остаётся нетыкабельным (это ограничение TG). Если нужна мобильная проверка — подключать tunnel.
3. **Автообновление:**
   - Открыть `/admin/applications` во вкладке 1, создать заявку в другой вкладке — через ≤10 сек новая строка появляется без перезагрузки.
   - Сайдбар: бейдж у «Заявки» показывает актуальное число PENDING; при смене статуса на CONFIRMED — уменьшается.
4. **Кандидаты:**
   - Один раз запустить `node scripts/backfill-candidates.mjs` — в консоли вывести кол-во созданных профилей.
   - Открыть `/admin/candidates` — все уже-подтверждённые заявки там.
   - Создать новую заявку → подтвердить через `/admin/applications/[id]` (с paymentLink) → в `/admin/candidates` появляется новый профиль (в пределах ≤10 сек polling, либо сразу при переходе на страницу).

---

## Итоговый чеклист изменений

- [x] `lib/telegram.ts` — HTML + inline keyboard + escape + лог ошибок
- [x] `app/admin/applications/page.tsx` — silent polling 10s
- [x] `components/admin/AdminSidebar.tsx` — бейдж + polling 10s
- [x] `app/api/admin/applications/counts/route.ts` — новый GET-хендлер
- [x] `app/api/admin/applications/[id]/route.ts` — upsert CandidateProfile при CONFIRMED
- [x] `scripts/backfill-candidates.mjs` — разовый бэкфилл (выполнен: создан 1 профиль)

