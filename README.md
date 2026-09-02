# DATAPOST — AI-аудитор датасетов

DATAPOST — веб-приложение, которое анализирует загруженные датасеты (CSV/Excel/JSON), находит проблемы
(утечки таргета, дисбаланс классов, пропуски, выбросы, дубликаты и т.д.), выдаёт подробный отчёт с
объяснением от AI и, на плане PRO, автоматически чистит датасет.

Проект состоит из двух частей:

- **Frontend** (эта директория) — Next.js 14 (App Router, TypeScript), Prisma + PostgreSQL, NextAuth v5.
- **Backend** (`backend/`) — Python FastAPI сервис с эндпоинтами `/analyze` и `/clean` (разрабатывается отдельно).

## Стек

Next.js 14 · TypeScript (strict) · Tailwind CSS · Framer Motion · Recharts · TanStack Table v8 ·
NextAuth v5 (Credentials, JWT) · Prisma ORM · PostgreSQL · bcryptjs

## 1. Установка Frontend

```bash
npm install
```

### Переменные окружения

Скопируй `.env.example` в `.env` и заполни значения:

```bash
cp .env.example .env
```

```
DATABASE_URL=postgresql://user:password@localhost:5432/datapost
NEXTAUTH_SECRET=<сгенерируй: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
FASTAPI_URL=http://localhost:8000
```

### База данных (Prisma + PostgreSQL)

Убедись, что PostgreSQL запущен и `DATABASE_URL` указывает на существующую базу данных.

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

После сидирования появится тестовый пользователь:

- Email: `test@datapost.ru`
- Пароль: `test12345`
- План: PRO, с 5 готовыми (COMPLETED) датасетами в истории.

### Запуск frontend в dev-режиме

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3000`.

## 2. Установка Backend (FastAPI, папка `backend/`)

Backend разрабатывается отдельно и не должен изменяться при работе над frontend'ом. Для локального запуска:

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Создай `.env` (или экспортируй переменные окружения) в `backend/` согласно требованиям сервиса
(например, ключ OpenAI API, если используется `openai_client.py`).

Запусти сервис:

```bash
uvicorn main:app --reload --port 8000
```

(имя модуля/приложения `main:app` зависит от того, как backend-разработчик назовёт entrypoint —
уточни у него итоговую команду запуска, если она отличается).

FastAPI должен слушать порт, указанный в переменной `FASTAPI_URL` фронтенда (по умолчанию `8000`) и
предоставлять:

- `POST /analyze` — multipart/form-data (`file`, `target_column`, `task_type`, `user_id`, `plan`) →
  JSON с `quality_score`, `issues[]`, `stats`, `sample_data[]`, `summary`, `ready_for_training`,
  `critical_count`, `row_count`, `col_count`.
- `POST /clean` — JSON (`file_content_base64`, `file_name`, `issues`) → JSON с `cleaned_file_base64`,
  `changes_made[]`.

## 3. Как связать frontend с локальным backend

1. Запусти backend на `http://localhost:8000` (или другом порту).
2. В `.env` фронтенда пропиши `FASTAPI_URL=http://localhost:8000` (или актуальный адрес/порт).
3. Перезапусти `npm run dev`, чтобы Next.js подхватил новую переменную окружения.

Все обращения к backend идут через серверные API-роуты Next.js (`app/api/datasets/upload`,
`app/api/datasets/[id]/clean`), которые сами вызывают `FASTAPI_URL`. Клиент никогда не обращается к
FastAPI напрямую.

## 4. Структура проекта

```
app/                    — страницы и API-роуты (App Router)
  api/                  — серверные роуты (auth, datasets, dashboard, subscription, profile, usage)
  auth/                 — страницы входа/регистрации
  upload/                — страница загрузки датасета
  report/[id]/           — страница отчёта по датасету
  dashboard/, history/, subscription/
components/
  ui/                   — базовые UI-компоненты
  layout/                — навбар, футер, модалки
  landing/               — секции лендинга
  upload/, report/, dashboard/
lib/                    — prisma-клиент, authConfig, planGuard, api-обёртка для FastAPI
hooks/                  — useCurrentUser, useDragDrop
types/                  — общие TypeScript-типы
prisma/                 — schema.prisma, seed.ts
```

## 5. Планы FREE / PRO

| Ограничение              | FREE           | PRO                  |
|---------------------------|----------------|----------------------|
| Макс. размер файла        | 5 MB           | 100 MB               |
| Загрузок в день            | 3              | без ограничений       |
| Форматы                    | CSV            | CSV, Excel, JSON      |
| Автоочистка                | ✗              | ✓                     |
| Скачивание чистого файла   | ✗              | ✓                     |
| История датасетов          | последние 5    | вся история           |

Ограничения проверяются на сервере в `app/api/datasets/upload/route.ts` и
`app/api/datasets/[id]/clean/route.ts` (см. `lib/planGuard.ts`).

## 6. Деплой

### Frontend → Vercel

1. Импортируй репозиторий в Vercel.
2. Root Directory — корень этого проекта (не трогай `backend/`, он деплоится отдельно).
3. Пропиши переменные окружения в настройках проекта Vercel:
   - `DATABASE_URL` — строка подключения к PostgreSQL на Railway (см. ниже).
   - `NEXTAUTH_SECRET` — сгенерированный секрет.
   - `NEXTAUTH_URL` — публичный URL фронтенда (например, `https://datapost.vercel.app`).
   - `FASTAPI_URL` — публичный URL backend-сервиса на Railway.
4. Build command: `npm run build` (Vercel определит автоматически для Next.js).
5. После первого деплоя выполни миграции Prisma против продовой базы:
   ```bash
   DATABASE_URL=<railway-url> npx prisma migrate deploy
   DATABASE_URL=<railway-url> npm run prisma:seed   # опционально, для тестовых данных
   ```

### Backend → Railway

1. Создай новый сервис в Railway из папки `backend/` (например, отдельный репозиторий или monorepo с
   указанием root directory `backend`).
2. Railway должен установить зависимости из `backend/requirements.txt` и запустить сервис командой вида
   `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. Пропиши необходимые backend-специфичные переменные окружения (ключи AI-провайдера и т.д.) в
   настройках сервиса Railway.
4. Скопируй публичный URL сервиса Railway — это значение для `FASTAPI_URL` на фронтенде.

### PostgreSQL → Railway

1. Добавь плагин PostgreSQL в проект Railway (или создай отдельный Railway Postgres сервис).
2. Скопируй `DATABASE_URL` из вкладки Connect — используй его и во фронтенд-сервисе (Vercel), и при
   локальных миграциях.
3. Прогони миграции: `npx prisma migrate deploy` с этим `DATABASE_URL`.

## 7. Тестовые данные

После `npm run prisma:seed` доступен пользователь:

```
Email: test@datapost.ru
Пароль: test12345
План: PRO
```

У него уже есть 5 обработанных датасетов в истории для проверки страниц `/dashboard`, `/history` и
`/report/[id]` без необходимости поднимать backend.

## 8. Полезные команды

```bash
npm run dev              # dev-сервер Next.js
npm run build             # прод-сборка
npm run start              # запуск прод-сборки
npm run prisma:generate    # сгенерировать Prisma Client
npm run prisma:migrate     # применить миграции в dev
npm run prisma:seed        # засеять тестовые данные
```
