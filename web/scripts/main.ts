/**
 * Главный файл инициализации Web App
 */

import { initTelegramWebApp, sendDataToBot } from './telegram.js';
import { Game } from './game.js';
import { getBotMove } from './ai.js';
import { generateAndSendPromoCode } from './promo.js';
import {
  renderBoard,
  showGameScreen,
  showWinScreen,
  showLoseScreen,
  showDrawScreen,
  updateGameStatus,
  setBoardDisabled,
  updateCell,
} from './ui.js';
import { PLAYER_X, PLAYER_O } from '@shared/constants';
import type { WebAppData } from '@shared/types';

// Инициализация игры
let game: Game;

/**
 * Инициализация приложения
 */
function init() {
  // Инициализация Telegram Web App SDK
  initTelegramWebApp();

  // Создание новой игры
  game = new Game();
  game.init();

  // Отрисовка поля
  renderBoard(game.getBoard());

  // Показ экрана игры
  showGameScreen();
  updateGameStatus('Ваш ход!');

  // Обработчики событий
  setupEventHandlers();
}

/**
 * Настройка обработчиков событий
 */
function setupEventHandlers() {
  // Обработчик клика по ячейке
  const boardElement = document.getElementById('game-board');
  if (boardElement) {
    boardElement.addEventListener('click', handleCellClick);
  }

  // Кнопки "Сыграть ещё раз"
  const playAgainWin = document.getElementById('play-again-win');
  const playAgainLose = document.getElementById('play-again-lose');
  const playAgainDraw = document.getElementById('play-again-draw');
  const resetBtn = document.getElementById('reset-btn');

  if (playAgainWin) {
    playAgainWin.addEventListener('click', startNewGame);
  }
  if (playAgainLose) {
    playAgainLose.addEventListener('click', startNewGame);
  }
  if (playAgainDraw) {
    playAgainDraw.addEventListener('click', startNewGame);
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', startNewGame);
  }
}

/**
 * Обработка клика по ячейке
 */
function handleCellClick(event: Event) {
  const target = event.target as HTMLElement;
  if (!target.classList.contains('game-cell') || target.classList.contains('filled')) {
    return;
  }

  const row = parseInt(target.dataset.row || '0', 10);
  const col = parseInt(target.dataset.col || '0', 10);

  // Ход игрока
  const moveSuccessful = game.handlePlayerMove(row, col);

  if (!moveSuccessful) {
    return;
  }

  // Обновляем UI
  updateCell(row, col, PLAYER_X);
  setBoardDisabled(true);

  // Проверяем результат
  checkGameResult();

  // Если игра продолжается - ход бота
  if (!game.isGameOver()) {
    setTimeout(() => {
      makeBotMove();
    }, 500); // Небольшая задержка для UX
  }
}

/**
 * Ход бота
 */
function makeBotMove() {
  const board = game.getBoard();
  const botMove = getBotMove(board);

  game.handleBotMove(botMove);

  // Обновляем UI
  updateCell(botMove.row, botMove.col, PLAYER_O);

  // Проверяем результат
  checkGameResult();

  // Если игра продолжается - разблокируем поле
  if (!game.isGameOver()) {
    setBoardDisabled(false);
    updateGameStatus('Ваш ход!');
  }
}

/**
 * Проверка результата игры
 */
function checkGameResult() {
  const result = game.getGameResult();

  if (!result) {
    return;
  }

  setBoardDisabled(true);

  switch (result) {
    case 'win':
      const promoCode = generateAndSendPromoCode();
      showWinScreen(promoCode);
      break;

    case 'lose':
      const loseData: WebAppData = { type: 'lose' };
      sendDataToBot(loseData);
      showLoseScreen();
      break;

    case 'draw':
      const drawData: WebAppData = { type: 'draw' };
      sendDataToBot(drawData);
      showDrawScreen();
      break;
  }
}

/**
 * Начать новую игру
 */
function startNewGame() {
  game.init();
  renderBoard(game.getBoard());
  showGameScreen();
  updateGameStatus('Ваш ход!');
  setBoardDisabled(false);
}

// Запуск приложения при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

