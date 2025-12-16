/**
 * Управление сессиями пользователей
 * Простая in-memory реализация для MVP
 */

import type { UserSession } from './types.js';

/**
 * Хранилище сессий (в памяти)
 * В продакшене можно заменить на Redis или БД
 */
const sessions = new Map<number, UserSession>();

/**
 * Получить сессию пользователя
 */
export function getSession(userId: number): UserSession | undefined {
  return sessions.get(userId);
}

/**
 * Установить сессию пользователя
 */
export function setSession(userId: number, session: UserSession): void {
  sessions.set(userId, session);
}

/**
 * Очистить сессию пользователя
 */
export function clearSession(userId: number): void {
  sessions.delete(userId);
}

/**
 * Проверить, существует ли сессия
 */
export function hasSession(userId: number): boolean {
  return sessions.has(userId);
}

