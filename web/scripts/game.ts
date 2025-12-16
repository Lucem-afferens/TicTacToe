/**
 * Логика игры крестики-нолики
 */

import type { GameBoard, Player, Move, GameResult } from '@shared/types';
import {
  createEmptyBoard,
  makeMove,
  checkWinner,
  isValidMove,
} from '@shared/game-logic';
import { PLAYER_X, PLAYER_O } from '@shared/constants';

/**
 * Класс для управления игрой
 */
export class Game {
  private board: GameBoard;
  private currentPlayer: Player;
  private winner: Player | 'draw' | null;

  constructor() {
    this.board = createEmptyBoard();
    this.currentPlayer = PLAYER_X; // Игрок всегда ходит первым
    this.winner = null;
  }

  /**
   * Инициализация новой игры
   */
  init(): void {
    this.board = createEmptyBoard();
    this.currentPlayer = PLAYER_X;
    this.winner = null;
  }

  /**
   * Получить текущее состояние поля
   */
  getBoard(): GameBoard {
    return this.board.map((row) => [...row]);
  }

  /**
   * Получить текущего игрока
   */
  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  /**
   * Получить победителя
   */
  getWinner(): Player | 'draw' | null {
    return this.winner;
  }

  /**
   * Проверить, закончена ли игра
   */
  isGameOver(): boolean {
    return this.winner !== null;
  }

  /**
   * Обработка хода игрока
   */
  handlePlayerMove(row: number, col: number): boolean {
    if (this.isGameOver()) {
      return false;
    }

    if (this.currentPlayer !== PLAYER_X) {
      return false; // Не очередь игрока
    }

    const move: Move = { row, col };

    if (!isValidMove(this.board, move)) {
      return false;
    }

    // Выполняем ход
    this.board = makeMove(this.board, move, PLAYER_X);

    // Проверяем результат
    this.winner = checkWinner(this.board);

    // Если игра не закончена, переключаем игрока
    if (!this.isGameOver()) {
      this.currentPlayer = PLAYER_O;
    }

    return true;
  }

  /**
   * Обработка хода бота
   */
  handleBotMove(move: Move): void {
    if (this.isGameOver()) {
      return;
    }

    if (this.currentPlayer !== PLAYER_O) {
      return; // Не очередь бота
    }

    if (!isValidMove(this.board, move)) {
      return;
    }

    // Выполняем ход
    this.board = makeMove(this.board, move, PLAYER_O);

    // Проверяем результат
    this.winner = checkWinner(this.board);

    // Если игра не закончена, переключаем игрока
    if (!this.isGameOver()) {
      this.currentPlayer = PLAYER_X;
    }
  }

  /**
   * Получить результат игры для текущего игрока
   */
  getGameResult(): GameResult | null {
    if (!this.isGameOver()) {
      return null;
    }

    if (this.winner === 'draw') {
      return 'draw';
    }

    // Если победил X (игрок) - победа
    if (this.winner === PLAYER_X) {
      return 'win';
    }

    // Если победил O (бот) - проигрыш
    return 'lose';
  }
}

