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

    // Получаем информацию о текущем webhook
    const webhookInfo = await bot.api.getWebhookInfo();

    // Формируем URL для webhook
    const webhookUrl = process.env.WEBHOOK_URL || `${config.webAppUrl.replace(/\/$/, '')}/webhook`;

    if (!webhookUrl.startsWith('https://')) {
      throw new Error(`Webhook URL должен начинаться с https://. Текущий URL: ${webhookUrl}`);
    }

    if (!webhookUrl.includes('/webhook')) {
      throw new Error(`Webhook URL должен содержать /webhook. Текущий URL: ${webhookUrl}`);
    }

    // Устанавливаем webhook
    const result = await bot.api.setWebhook(webhookUrl, {
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query'],
    });

    if (result) {
      // Проверяем установку
      const newWebhookInfo = await bot.api.getWebhookInfo();

      // Отправляем HTML ответ
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
                <span class="info-label">URL Webhook:</span><br>
                ${newWebhookInfo.url || webhookUrl}
            </div>
            <div class="info-item">
                <span class="info-label">Ожидает обновлений:</span><br>
                ${newWebhookInfo.pending_update_count || 0}
            </div>
            <div class="info-item">
                <span class="info-label">Последняя ошибка:</span><br>
                ${newWebhookInfo.last_error_message || 'Нет ошибок'}
            </div>
            <div class="info-item">
                <span class="info-label">Бот:</span><br>
                ${config.botUsername}
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

