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
    try {
      // eslint-disable-next-line no-console
      console.log('📨 Получена команда /start от пользователя:', ctx.from?.id);
      
      const keyboard = new InlineKeyboard().webApp('🎮 Играть', config.webAppUrl);

      await ctx.reply(messages.welcome, {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      });
      
      // eslint-disable-next-line no-console
      console.log('✅ Ответ на /start отправлен');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Ошибка при обработке /start:', error);
      await ctx.reply(messages.error).catch(() => {
        // eslint-disable-next-line no-console
        console.error('❌ Не удалось отправить сообщение об ошибке');
      });
    }
  });

  // Команда /help
  bot.command('help', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('🎮 Играть', config.webAppUrl);
    
    await ctx.reply(messages.help, {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  });

  // Команда /game - быстрый старт игры
  bot.command('game', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('🎮 Играть', config.webAppUrl);
    
    await ctx.reply(messages.gameStarted, {
      reply_markup: keyboard,
    });
  });

  // Обработка неизвестных команд
  bot.on('message', async (ctx) => {
    // Игнорируем команды (они обрабатываются выше)
    if (ctx.message.text?.startsWith('/')) {
      return;
    }

    // Для остальных сообщений предлагаем начать игру
    const keyboard = new InlineKeyboard().webApp('🎮 Играть', config.webAppUrl);
    await ctx.reply('Нажмите кнопку "🎮 Играть" чтобы начать!', {
      reply_markup: keyboard,
    });
  });
}

