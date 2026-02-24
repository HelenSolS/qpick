# Сервис продажи сертификатов фотостудии

Mobile-first сервис подарочных сертификатов: Telegram Mini App + веб.  
Next.js App Router, PostgreSQL, Vercel Serverless.

## Требования

- Node.js 18+
- PostgreSQL со схемой **Quick Pic** (каноническая схема, например pg4.sweb.ru)

## ⚠️ Секреты не коммитить

**Файлы с паролями и токенами не должны попадать в репозиторий и в pull request.**

- Хранить `POSTGRES_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID` только в `.env` (локально) и в Environment Variables на Vercel.
- Файл `.env` уже в `.gitignore` — перед каждым коммитом проверяй, что в `git status` нет `.env`.

## Установка

```bash
cd studio-certs
npm install
cp .env.example .env
# В .env задать POSTGRES_URL и др. (никогда не коммитить .env и не включать в PR!)
# Опционально: TELEGRAM_BOT_TOKEN и TELEGRAM_ADMIN_CHAT_ID для уведомлений админу
```

## База данных (Quick Pic)

Сервис рассчитан на каноническую схему Quick Pic (таблицы `cities`, `tariffs`, `designs`, `clients`, `certificates` и др.). Если БД уже развёрнута по этой схеме, достаточно применить миграцию для полей формы покупки:

```bash
psql "$POSTGRES_URL" -f sql/migration_quickpic_certificate_fields.sql
psql "$POSTGRES_URL" -f sql/migration_certificate_purchase_data.sql
```

Первая миграция добавляет в `certificates` колонки `recipient_name`, `greeting`, `design_id`. Вторая — колонку `pd_consent_at` (согласие на обработку ПД) и таблицу `certificate_payments` (записи о платежах при покупке). Справочники городов, тарифов и дизайнов заполняются по правилам Quick Pic (у тарифов и дизайнов есть `city_id`).

## Запуск

- Разработка: `npm run dev`
- Сборка: `npm run build`
- Тесты: `npm run test`

## Деплой (Vercel)

Подключить репозиторий, в Environment Variables задать `POSTGRES_URL`. Деплой через GitHub.

## API

- `POST /api/identify-client` — тело `{ "telegram_id": "..." }`
- `GET /api/cities` — список городов
- `GET /api/tariffs` — список тарифов
- `GET /api/designs` — список дизайнов
- `POST /api/create-certificate` — тело: telegram_id, tariff_id, design_id, city_id, recipient_name, greeting? (после создания — оповещение в Telegram админу, если заданы `TELEGRAM_BOT_TOKEN` и `TELEGRAM_ADMIN_CHAT_ID`)
- `GET /api/get-vault?telegram_id=...` — сертификаты клиента
- `POST /api/redeem-certificate` — погашение сертификата по коду (тело `{ "code": "QPIC-XXXX-1234" }` или `?code=...`). Ответ: 200 `{ ok: true }` или 404/409 с `error`: NOT_FOUND, ALREADY_REDEEMED, EXPIRED
- **Админ:** страница `/admin` — список сертификатов (коды по умолчанию скрыты, раскрытие по клику), поиск и сортировка по дате, городу, коду, ФИО. Заголовок `x-admin-key` или `Authorization: Bearer <ключ>`. В окружении задать `ADMIN_SECRET`.
