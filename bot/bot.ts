/**
 * Основная логика Telegram Bot
 */

import { Bot } from 'grammy';
import { config } from './config.js';
import { registerCommands } from './handlers/commands.js';
import { registerWebAppHandler } from './handlers/webapp.js';
import { registerErrorHandler } from './handlers/errors.js';

/**
 * Создаёт и настраивает бота
 */
export function createBot(): Bot {
  const bot = new Bot(config.botToken);

  // Регистрируем обработчики
  registerCommands(bot);
  registerWebAppHandler(bot);
  registerErrorHandler(bot);

  return bot;
}

/**
 * Запускает бота в режиме polling (для разработки)
 */
export async function startBotPolling(): Promise<void> {
  const bot = createBot();

  // eslint-disable-next-line no-console
  console.log('🤖 Бот запускается в режиме polling...');
  // eslint-disable-next-line no-console
  console.log(`📱 Имя бота: ${config.botUsername}`);
  // eslint-disable-next-line no-console
  console.log(`🌐 Web App URL: ${config.webAppUrl}`);

  await bot.start();
  // eslint-disable-next-line no-console
  console.log('✅ Бот успешно запущен (polling mode)!');
}

/**
 * Запускает бота в режиме webhook (для продакшена)
 */
export async function startBotWebhook(port: number = 3001): Promise<void> {
  const bot = createBot();

  // eslint-disable-next-line no-console
  console.log('🤖 Бот запускается в режиме webhook...');
  // eslint-disable-next-line no-console
  console.log(`📱 Имя бота: ${config.botUsername}`);
  // eslint-disable-next-line no-console
  console.log(`🌐 Web App URL: ${config.webAppUrl}`);
  // eslint-disable-next-line no-console
  console.log(`🔗 Webhook порт: ${port}`);

  // Запускаем webhook сервер
  await bot.api.deleteWebhook({ drop_pending_updates: true });
  
  // eslint-disable-next-line no-console
  console.log('✅ Бот готов принимать webhook обновления!');
  // eslint-disable-next-line no-console
  console.log(`📡 Ожидание обновлений на порту ${port}...`);
  
  // Возвращаем обработчик для использования в HTTP сервере
  return bot;
}

/**
 * Запускает бота (автоматически выбирает режим)
 */
export async function startBot(): Promise<void> {
  const useWebhook = process.env.USE_WEBHOOK === 'true';
  
  if (useWebhook) {
    const port = parseInt(process.env.WEBHOOK_PORT || '3001', 10);
    await startBotWebhook(port);
  } else {
    await startBotPolling();
  }
}

