/**
 * Обработка данных от Web App
 */

import { Bot, Context } from 'grammy';
import type { WebAppMessage } from '../types.js';
import { messages } from '../messages.js';

/**
 * Регистрация обработчика Web App данных
 */
export function registerWebAppHandler(bot: Bot) {
  bot.on('message:web_app_data', async (ctx: Context) => {
    try {
      if (!ctx.message) {
        await ctx.reply(messages.error);
        return;
      }

      const dataStr = ctx.message.web_app_data?.data;
      if (!dataStr) {
        await ctx.reply(messages.error);
        return;
      }

      // Парсим данные от Web App
      const data: WebAppMessage = JSON.parse(dataStr);

      // Обрабатываем в зависимости от типа
      switch (data.type) {
        case 'win':
          if (data.promoCode) {
            await ctx.reply(messages.win(data.promoCode));
          } else {
            await ctx.reply(messages.error);
          }
          break;

        case 'lose':
          await ctx.reply(messages.lose);
          break;

        case 'draw':
          await ctx.reply(messages.draw);
          break;

        default:
          await ctx.reply(messages.error);
      }
    } catch (error) {
      console.error('Error processing Web App data:', error);
      await ctx.reply(messages.error);
    }
  });
}

