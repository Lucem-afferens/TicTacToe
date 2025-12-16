/**
 * Точка входа Telegram Bot
 */

import { startBot } from './bot.js';

// Обработка сигналов завершения
process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('\n🛑 Получен сигнал SIGINT, завершение работы...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('\n🛑 Получен сигнал SIGTERM, завершение работы...');
  process.exit(0);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Запуск бота
startBot().catch((error) => {
  console.error('❌ Ошибка при запуске бота:', error);
  process.exit(1);
});

