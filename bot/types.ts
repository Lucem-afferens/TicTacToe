/**
 * Типы для Telegram Bot
 */

import type { WebAppData } from '@shared/types.js';

/**
 * Данные сессии пользователя
 */
export interface UserSession {
  userId: number;
  username?: string;
  currentGame?: {
    board: string; // JSON строка игрового поля
    currentPlayer: 'X' | 'O';
  };
}

/**
 * Данные от Web App
 */
export type WebAppMessage = WebAppData;

