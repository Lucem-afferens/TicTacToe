/**
 * Обработка ошибок бота
 */

import { Bot } from 'grammy';
import { messages } from '../messages.js';

/**
 * Регистрация обработчика ошибок
 */
export function registerErrorHandler(bot: Bot) {
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`, err.error);

    // Отправляем дружелюбное сообщение пользователю
    ctx.reply(messages.error).catch((e) => {
      console.error('Error sending error message:', e);
    });
  });
}

