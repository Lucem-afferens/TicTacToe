/**
 * Генерация и валидация промокодов
 */

import { generatePromoCode, validatePromoCode } from '@shared/utils.js';

/**
 * Генерирует новый промокод
 */
export function createPromoCode(): string {
  return generatePromoCode();
}

/**
 * Валидирует промокод
 */
export function isValidPromoCode(code: string): boolean {
  return validatePromoCode(code);
}

