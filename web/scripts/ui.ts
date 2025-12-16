/**
 * Управление UI состояниями
 */

import type { GameBoard, CellValue } from '@shared/types';
import { PLAYER_X } from '@shared/constants';

/**
 * Показать экран игры
 */
export function showGameScreen(): void {
  hideAllScreens();
  const screen = document.getElementById('game-screen');
  if (screen) {
    screen.classList.add('active');
  }
}

/**
 * Показать экран победы
 */
export function showWinScreen(promoCode: string): void {
  hideAllScreens();
  const screen = document.getElementById('win-screen');
  const promoElement = document.getElementById('promo-code');
  
  if (screen) {
    screen.classList.add('active');
  }
  
  if (promoElement) {
    promoElement.textContent = promoCode;
  }
}

/**
 * Показать экран проигрыша
 */
export function showLoseScreen(): void {
  hideAllScreens();
  const screen = document.getElementById('lose-screen');
  if (screen) {
    screen.classList.add('active');
  }
}

/**
 * Показать экран ничьей
 */
export function showDrawScreen(): void {
  hideAllScreens();
  const screen = document.getElementById('draw-screen');
  if (screen) {
    screen.classList.add('active');
  }
}

/**
 * Скрыть все экраны
 */
function hideAllScreens(): void {
  const screens = document.querySelectorAll('.screen');
  screens.forEach((screen) => screen.classList.remove('active'));
}

/**
 * Отрисовка игрового поля
 */
export function renderBoard(board: GameBoard): void {
  const boardElement = document.getElementById('game-board');
  if (!boardElement) {
    return;
  }

  boardElement.innerHTML = '';

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = document.createElement('div');
      cell.className = 'game-cell';
      cell.dataset.row = row.toString();
      cell.dataset.col = col.toString();

      const value = board[row][col];
      if (value) {
        cell.textContent = value === PLAYER_X ? '❌' : '⭕';
        cell.classList.add('filled', value.toLowerCase());
      }

      boardElement.appendChild(cell);
    }
  }
}

/**
 * Обновить ячейку на поле
 */
export function updateCell(row: number, col: number, value: CellValue): void {
  const cell = document.querySelector(
    `.game-cell[data-row="${row}"][data-col="${col}"]`
  ) as HTMLElement;

  if (!cell) {
    return;
  }

  if (value) {
    cell.textContent = value === PLAYER_X ? '❌' : '⭕';
    cell.classList.add('filled', value.toLowerCase());
  }
}

/**
 * Обновить статус игры
 */
export function updateGameStatus(text: string): void {
  const statusElement = document.getElementById('game-status');
  if (statusElement) {
    statusElement.textContent = text;
  }
}

/**
 * Блокировать/разблокировать поле
 */
export function setBoardDisabled(disabled: boolean): void {
  const cells = document.querySelectorAll('.game-cell');
  cells.forEach((cell) => {
    if (disabled) {
      cell.classList.add('disabled');
    } else {
      cell.classList.remove('disabled');
    }
  });
}

