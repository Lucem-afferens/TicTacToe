/**
 * Общая игровая логика крестиков-нолики
 */

import type { GameBoard, CellValue, Player, Move } from './types.js';
import { BOARD_SIZE, WINNING_COMBINATIONS } from './constants.js';

/**
 * Создаёт пустое игровое поле 3x3
 */
export function createEmptyBoard(): GameBoard {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null) as CellValue[]);
}

/**
 * Проверяет, является ли ход валидным
 */
export function isValidMove(board: GameBoard, move: Move): boolean {
  const { row, col } = move;

  // Проверка границ
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }

  // Проверка, что ячейка пустая
  return board[row][col] === null;
}

/**
 * Выполняет ход на игровом поле
 * Возвращает новое поле (не мутирует исходное)
 */
export function makeMove(
  board: GameBoard,
  move: Move,
  player: Player
): GameBoard {
  if (!isValidMove(board, move)) {
    throw new Error(`Invalid move: ${move.row}, ${move.col}`);
  }

  // Создаём копию поля
  const newBoard = board.map((row) => [...row]);
  newBoard[move.row][move.col] = player;

  return newBoard;
}

/**
 * Проверяет, заполнено ли поле
 */
export function isBoardFull(board: GameBoard): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}

/**
 * Получает список доступных ходов
 */
export function getAvailableMoves(board: GameBoard): Move[] {
  const moves: Move[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        moves.push({ row, col });
      }
    }
  }

  return moves;
}

/**
 * Проверяет, есть ли победитель
 * Возвращает символ победителя, 'draw' для ничьей, или null если игра продолжается
 */
export function checkWinner(board: GameBoard): Player | 'draw' | null {
  // Проверяем все выигрышные комбинации
  for (const combination of WINNING_COMBINATIONS) {
    const values = combination.map(([row, col]) => board[row][col]);

    // Если все три ячейки одинаковые и не null
    if (values[0] !== null && values[0] === values[1] && values[1] === values[2]) {
      return values[0] as Player;
    }
  }

  // Если нет победителя и поле заполнено - ничья
  if (isBoardFull(board)) {
    return 'draw';
  }

  // Игра продолжается
  return null;
}

/**
 * Проверяет, может ли игрок выиграть следующим ходом
 * Возвращает координаты выигрышного хода или null
 */
export function findWinningMove(board: GameBoard, player: Player): Move | null {
  for (const combination of WINNING_COMBINATIONS) {
    const values = combination.map(([row, col]) => ({
      value: board[row][col],
      move: { row, col } as Move,
    }));

    // Считаем, сколько ячеек занято игроком и сколько пустых
    const playerCount = values.filter((v) => v.value === player).length;
    const emptyCount = values.filter((v) => v.value === null).length;

    // Если 2 ячейки игрока и 1 пустая - это выигрышный ход
    if (playerCount === 2 && emptyCount === 1) {
      const emptyMove = values.find((v) => v.value === null);
      if (emptyMove && isValidMove(board, emptyMove.move)) {
        return emptyMove.move;
      }
    }
  }

  return null;
}

