/**
 * Общие типы данных для проекта
 */

/**
 * Игрок (символ)
 */
export type Player = 'X' | 'O';

/**
 * Значение ячейки игрового поля
 */
export type CellValue = Player | null;

/**
 * Игровое поле 3x3
 */
export type GameBoard = CellValue[][];

/**
 * Координаты хода
 */
export interface Move {
  row: number;
  col: number;
}

/**
 * Состояние игры
 */
export interface GameState {
  board: GameBoard;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  isGameOver: boolean;
}

/**
 * Результат игры
 */
export type GameResult = 'win' | 'lose' | 'draw';

/**
 * Данные для отправки в бот из Web App
 */
export interface WebAppData {
  type: 'win' | 'lose' | 'draw';
  promoCode?: string;
}

