/**
 * HTTP сервер для обработки Telegram Webhook
 * 
 * Использование:
 *   USE_WEBHOOK=true WEBHOOK_PORT=3001 node dist/bot/webhook-server.js
 */

import http from 'http';
import { Bot } from 'grammy';
import { startBotWebhook } from './bot.js';
import { config } from './config.js';
import { handleWebhookSetup } from './webhook-setup-handler.js';
import { handleAutoSetup } from './auto-setup-handler.js';

/**
 * Создаёт HTTP сервер для обработки webhook
 */
export function createWebhookServer(bot: Bot, _port: number = 3001): http.Server {
  // Создаём HTTP сервер
  const server = http.createServer(async (req, res) => {
    const url = req.url || '/';

    // Обрабатываем GET запросы на /setup-webhook
    if (req.method === 'GET' && url === '/setup-webhook') {
      // Сначала выполняем автоматическую установку и запуск
      await handleAutoSetup(req, res);
      
      // Затем настраиваем webhook (если установка прошла успешно)
      // Это будет сделано при следующем запросе или можно добавить редирект
      return;
    }

    // Обрабатываем GET запросы на /setup-webhook-only только для настройки webhook
    if (req.method === 'GET' && url === '/setup-webhook-only') {
      await handleWebhookSetup(req, res);
      return;
    }

    // Обрабатываем только POST запросы на /webhook
    if (req.method === 'POST' && url === '/webhook') {
      // eslint-disable-next-line no-console
      console.log('📨 Получен POST запрос на /webhook');
      
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          // eslint-disable-next-line no-console
          console.log('📦 Размер тела запроса:', body.length, 'байт');
          
          // Парсим обновление от Telegram
          const update = JSON.parse(body);

          // eslint-disable-next-line no-console
          console.log('📨 Получено обновление от Telegram:', {
            update_id: update.update_id,
            message: update.message ? {
              message_id: update.message.message_id,
              text: update.message.text,
              from: update.message.from?.id
            } : 'нет сообщения',
            callback_query: update.callback_query ? 'есть' : 'нет'
          });

          // Обрабатываем обновление через бота
          await bot.handleUpdate(update);

          // eslint-disable-next-line no-console
          console.log('✅ Обновление обработано успешно');

          // Отвечаем успешно
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('❌ Ошибка обработки webhook обновления:', error);
          // eslint-disable-next-line no-console
          if (error instanceof Error) {
            // eslint-disable-next-line no-console
            console.error('Stack trace:', error.stack);
          }
          // eslint-disable-next-line no-console
          console.error('Тело запроса:', body.substring(0, 500));
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
        }
      });
    } else {
      // Для других запросов возвращаем 404
      // eslint-disable-next-line no-console
      console.log(`⚠️ Неподдерживаемый запрос: ${req.method} ${url}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Not found' }));
    }
  });

  return server;
}

/**
 * Запускает webhook сервер
 */
export async function startWebhookServer(): Promise<void> {
  // Используем startBotWebhook для правильной инициализации
  const port = parseInt(process.env.WEBHOOK_PORT || '3001', 10);
  const bot = await startBotWebhook(port);
  
  // Убеждаемся что бот инициализирован (startBotWebhook уже делает это, но на всякий случай)
  if (!bot.botInfo) {
    // eslint-disable-next-line no-console
    console.log('🔧 Дополнительная инициализация бота...');
    await bot.init();
  }

  // eslint-disable-next-line no-console
  console.log('🚀 Запуск webhook сервера...');
  // eslint-disable-next-line no-console
  console.log(`📱 Бот: ${config.botUsername}`);
  // eslint-disable-next-line no-console
  console.log(`🌐 Web App URL: ${config.webAppUrl}`);
  
  // Получаем URL из переменных окружения или формируем
  const webhookUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/webhook`
    : process.env.WEBHOOK_URL || `${config.webAppUrl.replace(/\/$/, '')}/webhook`;
  
  // eslint-disable-next-line no-console
  console.log(`🔗 Webhook URL: ${webhookUrl}`);
  // eslint-disable-next-line no-console
  console.log(`📡 Порт: ${port}`);

  const server = createWebhookServer(bot, port);

  server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`✅ Webhook сервер запущен на порту ${port}`);
    // eslint-disable-next-line no-console
    console.log(`📡 Ожидание обновлений от Telegram...`);
    // eslint-disable-next-line no-console
    console.log(`🌐 Для настройки webhook откройте: ${webhookUrl.replace('/webhook', '/setup-webhook')}`);
  });

  // Обработка завершения
  process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.log('\n🛑 Получен сигнал SIGINT, завершение работы...');
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('✅ Сервер остановлен');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    // eslint-disable-next-line no-console
    console.log('\n🛑 Получен сигнал SIGTERM, завершение работы...');
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('✅ Сервер остановлен');
      process.exit(0);
    });
  });
}

// Запуск если файл выполняется напрямую
// Проверяем через process.argv вместо import.meta для совместимости
if (process.argv[1] && process.argv[1].endsWith('webhook-server.js')) {
  startWebhookServer().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('❌ Ошибка при запуске webhook сервера:', error);
    process.exit(1);
  });
}

