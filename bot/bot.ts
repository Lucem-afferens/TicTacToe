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

  // eslint-disable-next-line no-console
  console.log('🤖 Создание бота...');
  // eslint-disable-next-line no-console
  console.log('📱 Имя бота:', config.botUsername);
  // eslint-disable-next-line no-console
  console.log('🔑 Токен (первые 10 символов):', config.botToken.substring(0, 10) + '...');

  // Регистрируем обработчики
  // eslint-disable-next-line no-console
  console.log('📝 Регистрация обработчиков...');
  registerCommands(bot);
  registerWebAppHandler(bot);
  registerErrorHandler(bot);
  // eslint-disable-next-line no-console
  console.log('✅ Обработчики зарегистрированы');

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
 * Возвращает экземпляр бота для использования в HTTP сервере
 */
export async function startBotWebhook(_port: number = 3001): Promise<Bot> {
  const bot = createBot();

  // eslint-disable-next-line no-console
  console.log('🤖 Бот запускается в режиме webhook...');
  // eslint-disable-next-line no-console
  console.log(`📱 Имя бота: ${config.botUsername}`);
  // eslint-disable-next-line no-console
  console.log(`🌐 Web App URL: ${config.webAppUrl}`);

  // Удаляем старый webhook если есть
  await bot.api.deleteWebhook({ drop_pending_updates: true });
  
  // eslint-disable-next-line no-console
  console.log('✅ Бот готов принимать webhook обновления!');
  
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

