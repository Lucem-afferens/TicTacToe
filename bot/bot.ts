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
 * Запускает бота
 */
export async function startBot(): Promise<void> {
  const bot = createBot();

  console.log('🤖 Бот запускается...');
  console.log(`📱 Имя бота: ${config.botUsername}`);
  console.log(`🌐 Web App URL: ${config.webAppUrl}`);

  await bot.start();
  console.log('✅ Бот успешно запущен!');
}

