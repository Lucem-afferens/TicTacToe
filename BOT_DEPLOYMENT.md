# 🤖 Деплой Telegram бота

## 📋 Обзор

Telegram-бот **НЕ МОЖЕТ** работать на Beget shared-хостинге, так как там нет Node.js.

Бот нужно разместить на отдельном сервере с поддержкой Node.js.

## 🚀 Вариант 1: Railway.app (РЕКОМЕНДУЕТСЯ)

### Преимущества:
- ✅ Бесплатный план (500 часов/месяц)
- ✅ Автоматический деплой из GitHub
- ✅ Поддержка Node.js из коробки
- ✅ Webhook работает автоматически
- ✅ HTTPS включён по умолчанию

### Настройка:

1. **Создайте аккаунт на Railway:**
   - Перейдите на https://railway.app
   - Войдите через GitHub

2. **Создайте новый проект:**
   - Нажмите "New Project"
   - Выберите "Deploy from GitHub repo"
   - Выберите ваш репозиторий `TicTacToe`

3. **Настройте переменные окружения:**
   ```
   BOT_TOKEN=your_bot_token_here
   BOT_USERNAME=TicTacToe_ru_bot
   WEB_APP_URL=https://develonik.ru/
   NODE_ENV=production
   USE_WEBHOOK=true
   ```

4. **Настройте команду запуска:**
   - В настройках проекта найдите "Start Command"
   - Установите: `npm run start:webhook`
   - Или: `USE_WEBHOOK=true node dist/bot/webhook-server.js`

5. **Получите URL:**
   - Railway даст вам URL типа: `https://your-app.railway.app`
   - Это будет ваш webhook URL

6. **Настройте webhook:**
   - Откройте: `https://your-app.railway.app/setup-webhook`
   - Или вручную через API

### Обновление .env на Beget:

После настройки Railway, обновите `WEB_APP_URL` в `.env` бота на Railway:
```
WEB_APP_URL=https://develonik.ru/
```

## 🚀 Вариант 2: Render.com

### Настройка:

1. **Создайте аккаунт:**
   - https://render.com
   - Войдите через GitHub

2. **Создайте новый Web Service:**
   - "New" → "Web Service"
   - Подключите репозиторий

3. **Настройки:**
   - **Name**: `tictactoe-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build:bot`
   - **Start Command**: `USE_WEBHOOK=true npm run start:webhook`
   - **Plan**: Free (может засыпать после неактивности)

4. **Переменные окружения:**
   ```
   BOT_TOKEN=your_bot_token_here
   BOT_USERNAME=TicTacToe_ru_bot
   WEB_APP_URL=https://develonik.ru/
   NODE_ENV=production
   USE_WEBHOOK=true
   ```

5. **Получите URL:**
   - Render даст URL: `https://tictactoe-bot.onrender.com`

## 🚀 Вариант 3: Fly.io

### Настройка:

1. **Установите Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Войдите:**
   ```bash
   fly auth login
   ```

3. **Создайте приложение:**
   ```bash
   fly launch
   ```

4. **Настройте переменные:**
   ```bash
   fly secrets set BOT_TOKEN=your_token
   fly secrets set WEB_APP_URL=https://develonik.ru/
   ```

## 🚀 Вариант 4: VPS (DigitalOcean, Vultr и т.д.)

### Настройка:

1. **Создайте VPS:**
   - Ubuntu 22.04 LTS
   - Минимум 1GB RAM

2. **Установите Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Установите PM2:**
   ```bash
   npm install -g pm2
   ```

4. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/Lucem-afferens/TicTacToe.git
   cd TicTacToe
   ```

5. **Настройте .env:**
   ```bash
   nano bot/.env
   ```

6. **Установите и запустите:**
   ```bash
   npm install --production
   npm run build:bot
   USE_WEBHOOK=true pm2 start npm --name "tictactoe-bot" -- run start:webhook
   pm2 save
   pm2 startup
   ```

7. **Настройте nginx для webhook:**
   ```nginx
   server {
       listen 80;
       server_name bot.yourdomain.com;
       
       location /webhook {
           proxy_pass http://localhost:3001/webhook;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   }
   ```

## 🔗 Настройка webhook

После деплоя бота на любой из сервисов:

1. **Получите URL бота:**
   - Railway: `https://your-app.railway.app`
   - Render: `https://your-app.onrender.com`
   - VPS: `https://bot.yourdomain.com`

2. **Настройте webhook:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -d "url=https://your-bot-url.com/webhook"
   ```

   Или откройте в браузере:
   ```
   https://your-bot-url.com/setup-webhook
   ```

## 📝 Обновление workflow (опционально)

Можно добавить автоматический деплой бота в GitHub Actions, но для каждого сервиса нужны свои секреты и настройки.

## ✅ Итог

- **Web App** → Beget (уже настроено) ✅
- **Bot** → Railway/Render/VPS (нужно настроить) 🔧

После настройки бота на отдельном сервере, всё будет работать!

