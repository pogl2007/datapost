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

## 6. Деплой (свой VDS)

Frontend и backend разворачиваются на одном сервере через **pm2**, база — локальный
**PostgreSQL**, входящий трафик — через **nginx** (с сертификатом Let's Encrypt / certbot).

1. Склонируй репозиторий на сервер, создай БД и пользователя в PostgreSQL.
2. Пропиши `.env` в корне проекта (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `FASTAPI_URL=http://127.0.0.1:8000`)
   и `backend/.env` (`OPENAI_API_KEY`).
3. Frontend: `npm install`, `npx prisma db push`, `npm run build`, затем
   `pm2 start npm --name datapost-frontend -- run start -- -p <порт>`.
4. Backend: `python3 -m venv .venv`, `pip install -r requirements.txt`, затем
   `pm2 start .venv/bin/uvicorn --name datapost-backend --interpreter none -- main:app --host 127.0.0.1 --port 8000`.
5. `pm2 save` — чтобы сервисы поднимались сами после перезагрузки сервера.
6. nginx: server block с `proxy_pass` на порт фронтенда, домен привязан A-записью на IP сервера.
7. HTTPS: `certbot --nginx -d your-domain.ru -d www.your-domain.ru`.

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
