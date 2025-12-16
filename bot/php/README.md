# PHP Telegram Bot - Крестики-Нолики

PHP версия Telegram бота для игры в крестики-нолики, основанная на подходе из проекта `prize-wheel`.

## Структура

```
bot/php/
├── config.php          # Конфигурация бота
├── Logger.php          # Система логирования
├── promo.php           # Генерация промокодов
├── webhook.php         # Основной обработчик webhook
├── setup-webhook.php   # Настройка webhook и команд
└── logs/               # Директория для логов
```

## Установка

1. Убедитесь, что PHP 7.4+ установлен
2. Установите переменные окружения в `.env`:
   ```
   BOT_TOKEN=your_bot_token
   BOT_USERNAME=TicTacToe_ru_bot
   WEB_APP_URL=https://develonik.ru/
   WEBHOOK_URL=https://develonik.ru/bot/php/webhook.php
   ```

3. Создайте директорию для логов:
   ```bash
   mkdir -p bot/php/logs
   chmod 755 bot/php/logs
   ```

## Настройка webhook

Откройте в браузере:
```
https://your-domain.com/bot/php/setup-webhook.php
```

Или настройте вручную через Telegram API:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/bot/php/webhook.php"
```

## Использование

После настройки webhook бот будет автоматически обрабатывать:
- Команды: `/start`, `/help`, `/game`
- Данные от Web App (результаты игры)
- Callback queries (если будут добавлены)

## Логирование

Логи сохраняются в `bot/php/logs/app.log` с автоматической ротацией.

## Особенности

- Простая структура как в `prize-wheel`
- Прямые вызовы Telegram Bot API через curl
- Обработка команд через switch/case
- Поддержка Web App данных
- Генерация промокодов при победе

