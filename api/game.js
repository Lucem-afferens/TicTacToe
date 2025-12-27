/**
 * API endpoint для обработки игровых запросов
 * Node.js версия для Vercel
 */

// Простое хранилище игр в памяти (для демонстрации)
// В продакшене лучше использовать базу данных
const gameStorage = new Map(); // tg_id -> array of games

// Игровая логика
const GameLogic = {
  // Проверка победы
  checkWin(board, symbol) {
    const size = 3;
    
    // Проверка строк
    for (let i = 0; i < size; i++) {
      let win = true;
      for (let j = 0; j < size; j++) {
        const index = i * size + j;
        if (board[index] !== symbol) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
    
    // Проверка столбцов
    for (let j = 0; j < size; j++) {
      let win = true;
      for (let i = 0; i < size; i++) {
        const index = i * size + j;
        if (board[index] !== symbol) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
    
    // Проверка главной диагонали
    let win = true;
    for (let i = 0; i < size; i++) {
      const index = i * size + i;
      if (board[index] !== symbol) {
        win = false;
        break;
      }
    }
    if (win) return true;
    
    // Проверка побочной диагонали
    win = true;
    for (let i = 0; i < size; i++) {
      const index = i * size + (size - 1 - i);
      if (board[index] !== symbol) {
        win = false;
        break;
      }
    }
    return win;
  },
  
  // Проверка ничьей
  checkDraw(board) {
    // Все ячейки заполнены
    for (const cell of board) {
      if (!cell) return false;
    }
    // Нет победителя
    return !this.checkWin(board, 'X') && !this.checkWin(board, 'O');
  },
  
  // Валидация хода
  validateMove(board, position) {
    if (!Array.isArray(board)) return false;
    if (typeof position !== 'number') return false;
    if (position < 0 || position > 8) return false;
    if (!board.hasOwnProperty(position)) return false;
    return !board[position]; // Ячейка пустая
  },
  
  // Создание пустого поля
  createEmptyBoard() {
    return Array(9).fill('');
  },
  
  // Доступные ходы
  getAvailableMoves(board) {
    const available = [];
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        available.push(i);
      }
    }
    return available;
  }
};

// Управление состоянием игры
const GameState = {
  createGame(tgId) {
    const gameId = `game_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const board = GameLogic.createEmptyBoard();
    
    return {
      game_id: gameId,
      tg_id: String(tgId),
      board: board,
      current_player: 'X',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      created_at_timestamp: Math.floor(Date.now() / 1000),
      moves: []
    };
  },
  
  makeMove(gameData, position, symbol) {
    if (!gameData.board || !Array.isArray(gameData.board)) {
      return null;
    }
    
    if (!GameLogic.validateMove(gameData.board, position)) {
      return null;
    }
    
    const newGameData = JSON.parse(JSON.stringify(gameData)); // Глубокая копия
    newGameData.board[position] = symbol;
    
    if (!newGameData.moves) {
      newGameData.moves = [];
    }
    newGameData.moves.push({
      position: position,
      symbol: symbol,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
    // Проверяем результат
    const playerSymbol = 'X';
    const botSymbol = 'O';
    
    if (GameLogic.checkWin(newGameData.board, symbol)) {
      newGameData.status = symbol === playerSymbol ? 'player_win' : 'bot_win';
      newGameData.finished_at = new Date().toISOString();
      newGameData.finished_at_timestamp = Math.floor(Date.now() / 1000);
    } else if (GameLogic.checkDraw(newGameData.board)) {
      newGameData.status = 'draw';
      newGameData.finished_at = new Date().toISOString();
      newGameData.finished_at_timestamp = Math.floor(Date.now() / 1000);
    } else {
      newGameData.status = 'in_progress';
    }
    
    return newGameData;
  },
  
  getResult(gameData) {
    return gameData.status || 'in_progress';
  }
};

// AI для бота
const GameAI = {
  makeMove(board, botSymbol = 'O', playerSymbol = 'X') {
    const availableMoves = GameLogic.getAvailableMoves(board);
    
    if (availableMoves.length === 0) {
      return null;
    }
    
    if (availableMoves.length === 1) {
      return availableMoves[0];
    }
    
    const random = Math.floor(Math.random() * 100) + 1;
    
    // 70% - выигрышный ход
    if (random <= 70) {
      const winningMove = this.findWinningMove(board, botSymbol);
      if (winningMove !== null) {
        return winningMove;
      }
    }
    
    // 30% - блокировка игрока
    if (random <= 100) {
      const blockingMove = this.findBlockingMove(board, playerSymbol);
      if (blockingMove !== null) {
        return blockingMove;
      }
    }
    
    // Случайный ход
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  },
  
  findWinningMove(board, symbol) {
    const availableMoves = GameLogic.getAvailableMoves(board);
    
    for (const position of availableMoves) {
      const testBoard = [...board];
      testBoard[position] = symbol;
      
      if (GameLogic.checkWin(testBoard, symbol)) {
        return position;
      }
    }
    
    return null;
  },
  
  findBlockingMove(board, playerSymbol) {
    const availableMoves = GameLogic.getAvailableMoves(board);
    
    for (const position of availableMoves) {
      const testBoard = [...board];
      testBoard[position] = playerSymbol;
      
      if (GameLogic.checkWin(testBoard, playerSymbol)) {
        return position;
      }
    }
    
    return null;
  }
};

// Генерация промокода
function generatePromoCode(tgId, gameId) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Получаем тело запроса
    let body = '';
    if (req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    } else {
      await new Promise((resolve, reject) => {
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', resolve);
        req.on('error', reject);
      });
    }
    
    if (!body) {
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    const data = JSON.parse(body);
    const action = data.action || '';
    const tgId = data.tg_id || '';
    
    if (!tgId) {
      return res.status(400).json({ error: 'Missing tg_id' });
    }
    
    // Обработка действий
    switch (action) {
      case 'start': {
        const gameData = GameState.createGame(tgId);
        return res.status(200).json({
          success: true,
          game: gameData
        });
      }
      
      case 'move': {
        const gameId = data.game_id || '';
        const position = data.position;
        const gameData = data.game;
        
        if (!gameId) {
          return res.status(400).json({ error: 'Missing game_id' });
        }
        
        if (position === undefined || position === null) {
          return res.status(400).json({ error: 'Missing or invalid position' });
        }
        
        const pos = parseInt(position);
        if (isNaN(pos) || pos < 0 || pos > 8) {
          return res.status(400).json({ error: 'Position out of range (0-8)' });
        }
        
        if (!gameData || !gameData.board || !Array.isArray(gameData.board)) {
          return res.status(400).json({ error: 'Game data not provided or invalid' });
        }
        
        if (gameData.board.length !== 9) {
          return res.status(400).json({ error: 'Invalid board size' });
        }
        
        const playerSymbol = 'X';
        
        // Валидация хода
        if (!GameLogic.validateMove(gameData.board, pos)) {
          return res.status(400).json({ error: 'Invalid move - cell already taken or out of range' });
        }
        
        // Ход игрока
        let updatedGameData = GameState.makeMove(gameData, pos, playerSymbol);
        
        if (!updatedGameData) {
          return res.status(400).json({ error: 'Failed to make move' });
        }
        
        const result = GameState.getResult(updatedGameData);
        const response = {
          success: true,
          game: updatedGameData,
          result: result
        };
        
        // Если игра не закончена, делаем ход бота
        if (result === 'in_progress') {
          try {
            const botSymbol = 'O';
            const botPosition = GameAI.makeMove(updatedGameData.board, botSymbol, playerSymbol);
            
            console.log('Bot move attempt:', {
              board: updatedGameData.board,
              botPosition: botPosition,
              availableMoves: GameLogic.getAvailableMoves(updatedGameData.board)
            });
            
            if (botPosition !== null && botPosition !== undefined) {
              const botMoveResult = GameState.makeMove(updatedGameData, botPosition, botSymbol);
              
              if (botMoveResult) {
                updatedGameData = botMoveResult;
                const finalResult = GameState.getResult(updatedGameData);
                response.game = updatedGameData;
                response.result = finalResult;
                response.bot_move = botPosition;
                console.log('Bot move successful:', {
                  botPosition: botPosition,
                  newBoard: updatedGameData.board,
                  result: finalResult
                });
              } else {
                console.error('Failed to make bot move - GameState.makeMove returned null');
              }
            } else {
              console.error('Bot could not find a move - GameAI.makeMove returned null/undefined');
            }
          } catch (error) {
            console.error('Error in bot move:', error);
            // Продолжаем выполнение даже если бот не смог сделать ход
          }
        }
        
        // Если игра закончена и игрок выиграл, генерируем промокод
        if (response.result === 'player_win') {
          const promoCode = generatePromoCode(tgId, gameId);
          response.promo_code = promoCode;
          updatedGameData.promo_code = promoCode;
        }
        
        // Сохраняем завершенную игру в историю
        if (response.result !== 'in_progress') {
          if (!gameStorage.has(tgId)) {
            gameStorage.set(tgId, []);
          }
          const userGames = gameStorage.get(tgId);
          userGames.push({
            ...updatedGameData,
            saved_at: new Date().toISOString()
          });
          // Ограничиваем историю последними 50 играми
          if (userGames.length > 50) {
            userGames.shift();
          }
        }
        
        return res.status(200).json(response);
      }
      
      case 'history': {
        // Получаем историю игр из хранилища
        const userGames = gameStorage.get(tgId) || [];
        
        // Фильтруем только завершенные игры
        const finishedGames = userGames.filter(game => 
          game.status !== 'in_progress'
        );
        
        // Подсчитываем статистику
        const stats = {
          total_games: finishedGames.length,
          wins: finishedGames.filter(g => g.status === 'player_win').length,
          losses: finishedGames.filter(g => g.status === 'bot_win').length,
          draws: finishedGames.filter(g => g.status === 'draw').length,
          win_rate: finishedGames.length > 0 
            ? Math.round((finishedGames.filter(g => g.status === 'player_win').length / finishedGames.length) * 100)
            : 0
        };
        
        return res.status(200).json({
          success: true,
          games: finishedGames.reverse(), // Новые игры первыми
          stats: stats
        });
      }
      
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('Game API error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};

