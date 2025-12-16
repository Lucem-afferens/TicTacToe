/**
 * Отображение и обработка промокодов
 */

import { generatePromoCode } from '@shared/utils';
import { sendDataToBot } from './telegram.js';
import type { WebAppData } from '@shared/types';

/**
 * Генерирует промокод и отправляет в бот
 */
export function generateAndSendPromoCode(): string {
  const promoCode = generatePromoCode();

  // Отправляем данные в бот
  const data: WebAppData = {
    type: 'win',
    promoCode,
  };

  sendDataToBot(data);

  return promoCode;
}

