/**
 * AI логика бота-соперника
 */

import type { GameBoard, Move } from '@shared/types';
import { findWinningMove, getAvailableMoves } from '@shared/game-logic';
import { PLAYER_X, PLAYER_O, AI_STRATEGY } from '@shared/constants';

/**
 * Получить ход бота по стратегии 60/30/10
 */
export function getBotMove(board: GameBoard): Move {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) {
    throw new Error('No available moves');
  }

  const random = Math.random();

  // 10% - выигрышный ход (если возможно)
  if (random < AI_STRATEGY.WIN) {
    const winningMove = findWinningMove(board, PLAYER_O);
    if (winningMove) {
      return winningMove;
    }
  }

  // 30% - блокировка игрока (если возможно)
  if (random < AI_STRATEGY.WIN + AI_STRATEGY.BLOCK) {
    const blockingMove = findWinningMove(board, PLAYER_X);
    if (blockingMove) {
      return blockingMove;
    }
  }

  // 60% - случайный ход
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
}

