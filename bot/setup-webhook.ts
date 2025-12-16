/**
 * Скрипт для настройки Telegram Webhook
 * 
 * Использование:
 *   npm run setup-webhook
 *   или
 *   node dist/bot/setup-webhook.js
 */

import { Bot } from 'grammy';
import { config } from './config.js';

/**
 * Настройка webhook для Telegram бота
 */
async function setupWebhook() {
  const bot = new Bot(config.botToken);

  try {
    // eslint-disable-next-line no-console
    console.log('🔧 Настройка webhook...');
    // eslint-disable-next-line no-console
    console.log(`📱 Бот: ${config.botUsername}`);
    // eslint-disable-next-line no-console
    console.log(`🌐 Web App URL: ${config.webAppUrl}`);

    // Получаем информацию о текущем webhook
    const webhookInfo = await bot.api.getWebhookInfo();
    
    // eslint-disable-next-line no-console
    console.log('\n📊 Текущий статус webhook:');
    // eslint-disable-next-line no-console
    console.log(`   URL: ${webhookInfo.url || 'не установлен'}`);
    // eslint-disable-next-line no-console
    console.log(`   Ожидает обновлений: ${webhookInfo.pending_update_count || 0}`);
    // eslint-disable-next-line no-console
    console.log(`   Последняя ошибка: ${webhookInfo.last_error_message || 'нет'}`);

    // Формируем URL для webhook
    // Предполагаем, что бот будет доступен по HTTPS на том же домене что и Web App
    const webhookUrl = process.env.WEBHOOK_URL || `${config.webAppUrl.replace(/\/$/, '')}/webhook`;
    
    if (!webhookUrl.startsWith('https://')) {
      throw new Error('Webhook URL должен начинаться с https://');
    }

    // Устанавливаем webhook
    // eslint-disable-next-line no-console
    console.log(`\n🔗 Установка webhook: ${webhookUrl}`);
    
    const result = await bot.api.setWebhook(webhookUrl, {
      drop_pending_updates: true, // Удаляем ожидающие обновления
      allowed_updates: ['message', 'callback_query'], // Разрешаем только нужные типы обновлений
    });

    if (result) {
      // eslint-disable-next-line no-console
      console.log('✅ Webhook успешно установлен!');
      
      // Проверяем установку
      const newWebhookInfo = await bot.api.getWebhookInfo();
      // eslint-disable-next-line no-console
      console.log(`\n✅ Проверка: Webhook установлен на ${newWebhookInfo.url}`);
      
      // eslint-disable-next-line no-console
      console.log('\n📋 Следующие шаги:');
      // eslint-disable-next-line no-console
      console.log('   1. Убедитесь, что сервер принимает POST запросы на /webhook');
      // eslint-disable-next-line no-console
      console.log('   2. Проверьте, что сервер использует правильный токен для верификации');
      // eslint-disable-next-line no-console
      console.log('   3. Отправьте /start боту для тестирования');
    } else {
      throw new Error('Не удалось установить webhook');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Ошибка при настройке webhook:', error);
    process.exit(1);
  } finally {
    // Не удаляем webhook в finally, так как мы его только что установили
    // await bot.api.deleteWebhook({ drop_pending_updates: true });
  }
}

// Запуск
setupWebhook();

