/**
 * HTTP обработчик для автоматической настройки webhook
 * При открытии /setup-webhook в браузере автоматически настраивает webhook
 */

import { Bot } from 'grammy';
import { config } from './config.js';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Обрабатывает запрос на настройку webhook
 */
export async function handleWebhookSetup(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Разрешаем только GET запросы
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const bot = new Bot(config.botToken);

  try {
    // eslint-disable-next-line no-console
    console.log('🔧 Автоматическая настройка webhook...');

    // Формируем URL для webhook
    // Railway предоставляет RAILWAY_PUBLIC_DOMAIN или можно использовать PORT
    // Также проверяем переменную RAILWAY_STATIC_URL
    let webhookUrl = process.env.WEBHOOK_URL;
    
    if (!webhookUrl) {
      // Пробуем разные варианты для Railway
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        webhookUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/webhook`;
      } else if (process.env.RAILWAY_STATIC_URL) {
        webhookUrl = `${process.env.RAILWAY_STATIC_URL}/webhook`;
      } else {
        // Используем WEB_APP_URL как fallback (но это может быть неправильно для Railway)
        webhookUrl = `${config.webAppUrl.replace(/\/$/, '')}/webhook`;
      }
    }

    // eslint-disable-next-line no-console
    console.log('🔍 Определённый webhook URL:', webhookUrl);
    // eslint-disable-next-line no-console
    console.log('🔍 Доступные переменные окружения:');
    // eslint-disable-next-line no-console
    console.log('  - RAILWAY_PUBLIC_DOMAIN:', process.env.RAILWAY_PUBLIC_DOMAIN || 'не установлена');
    // eslint-disable-next-line no-console
    console.log('  - RAILWAY_STATIC_URL:', process.env.RAILWAY_STATIC_URL || 'не установлена');
    // eslint-disable-next-line no-console
    console.log('  - WEBHOOK_URL:', process.env.WEBHOOK_URL || 'не установлена');
    // eslint-disable-next-line no-console
    console.log('  - WEB_APP_URL:', config.webAppUrl);

    if (!webhookUrl.startsWith('https://')) {
      throw new Error(`Webhook URL должен начинаться с https://. Текущий URL: ${webhookUrl}`);
    }

    if (!webhookUrl.includes('/webhook')) {
      throw new Error(`Webhook URL должен содержать /webhook. Текущий URL: ${webhookUrl}`);
    }

    // 1. Удаляем старый webhook
    // eslint-disable-next-line no-console
    console.log('1️⃣ Удаление старого webhook...');
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    // eslint-disable-next-line no-console
    console.log('✅ Старый webhook удалён');

    // 2. Устанавливаем новый webhook
    // eslint-disable-next-line no-console
    console.log('2️⃣ Установка нового webhook...');
    const result = await bot.api.setWebhook(webhookUrl, {
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query'],
    });

    if (result) {
      // eslint-disable-next-line no-console
      console.log('✅ Webhook установлен:', webhookUrl);

      // 3. Удаляем старые команды (если есть)
      // eslint-disable-next-line no-console
      console.log('3️⃣ Удаление старых команд...');
      try {
        await bot.api.deleteMyCommands();
        // eslint-disable-next-line no-console
        console.log('✅ Старые команды удалены');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('⚠️ Ошибка удаления команд (может не существовать):', error);
      }

      // 4. Устанавливаем новую кнопку меню (Web App)
      // eslint-disable-next-line no-console
      console.log('4️⃣ Установка новой кнопки меню...');
      try {
        await bot.api.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: '🎮 Играть',
            web_app: {
              url: config.webAppUrl,
            },
          },
        });
        // eslint-disable-next-line no-console
        console.log('✅ Кнопка меню установлена: 🎮 Играть');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Ошибка установки кнопки меню:', error);
      }

      // 5. Устанавливаем команды бота
      // eslint-disable-next-line no-console
      console.log('5️⃣ Установка команд бота...');
      try {
        await bot.api.setMyCommands([
          { command: 'start', description: '🎮 Начать игру в крестики-нолики' },
          { command: 'help', description: '💡 Получить помощь и справку' },
          { command: 'game', description: '🎯 Быстрый старт игры' },
        ]);
        // eslint-disable-next-line no-console
        console.log('✅ Команды бота установлены');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Ошибка установки команд:', error);
      }

      // 6. Проверяем информацию о боте
      // eslint-disable-next-line no-console
      console.log('6️⃣ Проверка информации о боте...');
      const botInfo = await bot.api.getMe();
      // eslint-disable-next-line no-console
      console.log('✅ Бот активен:', botInfo.first_name, `(@${botInfo.username})`);

      // Проверяем установку webhook
      const newWebhookInfo = await bot.api.getWebhookInfo();

      // Перенаправляем на страницу успеха с информацией о webhook
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webhook настроен ✅</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        .status {
            background: #10b981;
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            margin: 20px 0;
            font-size: 1.2em;
            font-weight: bold;
        }
        .info {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
        .info-item {
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .info-label {
            font-weight: bold;
            color: #667eea;
        }
        .button {
            display: inline-block;
            margin-top: 20px;
            padding: 15px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: scale(1.05);
        }
        .emoji {
            font-size: 3em;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">✅</div>
        <h1>Webhook успешно настроен!</h1>
        <div class="status">Статус: Активен</div>
        
        <div class="info">
            <div class="info-item">
                <span class="info-label">✅ URL Webhook:</span><br>
                ${newWebhookInfo.url || webhookUrl}
            </div>
            <div class="info-item">
                <span class="info-label">✅ Кнопка меню:</span><br>
                🎮 Играть (Web App)
            </div>
            <div class="info-item">
                <span class="info-label">✅ Команды:</span><br>
                /start, /help, /game
            </div>
            <div class="info-item">
                <span class="info-label">📊 Ожидает обновлений:</span><br>
                ${newWebhookInfo.pending_update_count || 0}
            </div>
            <div class="info-item">
                <span class="info-label">📱 Бот:</span><br>
                ${config.botUsername}
            </div>
            <div class="info-item">
                <span class="info-label">🌐 Web App URL:</span><br>
                ${config.webAppUrl}
            </div>
        </div>

        <p style="margin-top: 20px; color: #6b7280;">
            Webhook автоматически настроен и готов к работе!<br>
            Теперь бот будет получать обновления от Telegram.
        </p>

        <a href="https://t.me/${config.botUsername.replace('@', '')}" class="button" target="_blank">
            Открыть бота в Telegram
        </a>
    </div>
</body>
</html>
      `);
    } else {
      throw new Error('Не удалось установить webhook');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Ошибка при настройке webhook:', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';

    // Отправляем HTML с ошибкой
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ошибка настройки Webhook ❌</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 {
            color: #f5576c;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        .error {
            background: #fee2e2;
            color: #991b1b;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            text-align: left;
        }
        .emoji {
            font-size: 3em;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">❌</div>
        <h1>Ошибка настройки Webhook</h1>
        <div class="error">
            ${errorMessage}
        </div>
        <p style="margin-top: 20px; color: #6b7280;">
            Проверьте настройки и попробуйте снова.
        </p>
    </div>
</body>
</html>
    `);
  }
}

