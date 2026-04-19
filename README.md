# 🎓 UUST Schedule Bot

Telegram-бот для получения расписания занятий УУНиТ (пока что только ИСПО) (Уфимского университета науки и технологий) из Google Drive / Excel.

## 📦 Возможности

- Регистрация пользователя с выбором курса, специализации и группы
- Просмотр расписания на **сегодня**, **завтра** или **на всю неделю**
- Навигация по дням и неделям (вперёд/назад)
- Поддержка нескольких групп: можно добавить несколько конфигураций и переключаться между ними
- Установка группы **по умолчанию** и активация/деактивация
- Кэширование расписания (файл `.cache`) с TTL 2 часа для экономии запросов к Google API

## 🛠️ Технологии

- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/) (CommonJS)
- [grammy](https://grammy.dev/) – фреймворк для Telegram ботов
- [Prisma](https://www.prisma.io/) + PostgreSQL – хранение пользователей и конфигураций
- [Google APIs](https://github.com/googleapis/google-api-nodejs-client) – доступ к Google Drive
- [SheetJS (xlsx)](https://sheetjs.com/) – парсинг Excel-файлов
- [fenviee](https://github.com/fockusty/fenviee) – валидация переменных окружения

## 📁 Структура проекта

```
src/
├── env.ts                    # Загрузка и валидация переменных окружения
├── index.ts                  # Точка входа (экспорт модулей)
├── database/                 # Работа с БД
│   ├── prisma.ts
│   ├── user.service.ts
│   └── schema.prisma
├── schedule/                 # Логика получения и кэширования расписания
│   ├── google/               # Взаимодействие с Google Drive и Excel
│   ├── google-drive.service.ts
│   ├── schedule-loader.ts
│   ├── schedule-cache.ts
│   ├── week-calculator.ts
│   ├── formatter.ts
│   └── schedule.ts
└── telegram/                 # Telegram-бот и UI
    ├── bot.ts
    ├── session.ts
    ├── commands/
    ├── conversations/
    ├── keyboards/
    ├── menu/
    ├── services/
    └── utils/
```

## ⚙️ Установка и настройка

### 1. Клонирование и установка зависимостей

```bash
git clone https://github.com/yourname/uust-schedule-bot.git
cd uust-schedule-bot
pnpm install
```

### 2. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
GOOGLE_DRIVE_FOLDER_URL="https://drive.google.com/drive/folders/ВАШ_ID_ПАПКИ"
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
TELEGRAM_BOT_TOKEN="1234567890:ABCdef..."
START_DATE="2025-09-01"
```

- `GOOGLE_DRIVE_FOLDER_URL` — ссылка на корневую папку с курсами (должна содержать подпапки курсов, внутри которых Excel-файлы специализаций)
- `DATABASE_URL` — строка подключения к PostgreSQL
- `TELEGRAM_BOT_TOKEN` — токен бота от [@BotFather](https://t.me/BotFather)
- `START_DATE` — дата начала учебного года (формат `YYYY-MM-DD`), от неё считается номер недели

### 3. Сервисный аккаунт Google

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/)
2. Включите **Google Drive API**
3. Создайте сервисный аккаунт и скачайте JSON-ключ
4. Переименуйте ключ в `credentials.json` и поместите в корень проекта
5. Предоставьте сервисному аккаунту доступ к нужной папке на Google Drive (как минимум на чтение)

### 4. База данных

Примените миграции Prisma:

```bash
npx prisma migrate deploy
npx prisma generate
```

## 🚀 Запуск

### Сборка

```bash
pnpm build
```

### Запуск бота

```bash
pnpm start
```

Или в режиме разработки (с авто-пересборкой) можно использовать `ts-node` или `tsx`.

## 📝 Использование бота

1. Найдите бота в Telegram по имени или ссылке.
2. Отправьте команду `/start`.
3. Следуйте инструкциям для выбора курса → специализации → группы.
4. После регистрации используйте кнопки меню для навигации по расписанию.
5. Можно добавить несколько групп и переключаться между ними через меню «🔄 Сменить группу».

## 🔧 Команды бота

| Команда     | Описание                            |
| ----------- | ----------------------------------- |
| `/start`    | Начать работу, выбрать группу       |
| `/schedule` | Показать расписание (текущий режим) |

## 📄 Лицензия

MIT © 2026 FOCKUSTY

---

Разработано с ❤️ и вниманием к чистому коду (согласно стандартам команды **LAF**).
