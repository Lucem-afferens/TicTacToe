/**
 * Обработчики команд бота
 */

import { Bot, InlineKeyboard } from 'grammy';
import { messages } from '../messages.js';
import { config } from '../config.js';

/**
 * Регистрация обработчиков команд
 */
export function registerCommands(bot: Bot) {
  // Команда /start
  bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('Играть', config.webAppUrl);

    await ctx.reply(messages.welcome, {
      reply_markup: keyboard,
    });
  });

  // Команда /help
  bot.command('help', async (ctx) => {
    await ctx.reply(messages.help);
  });

  // Обработка неизвестных команд
  bot.on('message', async (ctx) => {
    // Игнорируем команды (они обрабатываются выше)
    if (ctx.message.text?.startsWith('/')) {
      return;
    }

    // Для остальных сообщений предлагаем начать игру
    const keyboard = new InlineKeyboard().webApp('Играть', config.webAppUrl);
    await ctx.reply('Нажмите кнопку "Играть" чтобы начать!', {
      reply_markup: keyboard,
    });
  });
}

