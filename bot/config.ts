/**
 * Конфигурация бота
 */

import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

/**
 * Валидация обязательных переменных окружения
 */
function validateEnv() {
  const required = ['BOT_TOKEN'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file.'
    );
  }
}

// Валидируем при загрузке модуля
validateEnv();

/**
 * Конфигурация бота
 */
export const config = {
  botToken: process.env.BOT_TOKEN!,
  botUsername: process.env.BOT_USERNAME || 'TicTacToe_ru_bot',
  webAppUrl: process.env.WEB_APP_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

