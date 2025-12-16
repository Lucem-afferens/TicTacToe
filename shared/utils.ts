/**
 * Общие утилиты
 */

import { PROMO_CODE_MIN, PROMO_CODE_MAX } from './constants.js';

/**
 * Генерирует случайный 5-значный промокод
 * Диапазон: 10000-99999
 */
export function generatePromoCode(): string {
  const code = Math.floor(PROMO_CODE_MIN + Math.random() * (PROMO_CODE_MAX - PROMO_CODE_MIN + 1));
  return code.toString();
}

/**
 * Валидирует промокод
 * Проверяет, что это строка из 5 цифр
 */
export function validatePromoCode(code: string): boolean {
  // Проверяем формат: ровно 5 цифр
  const promoCodeRegex = /^\d{5}$/;
  if (!promoCodeRegex.test(code)) {
    return false;
  }

  // Проверяем диапазон
  const num = parseInt(code, 10);
  return num >= PROMO_CODE_MIN && num <= PROMO_CODE_MAX;
}

