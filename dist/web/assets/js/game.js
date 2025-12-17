/**
 * Основная логика игры в крестики-нолики
 */

class TicTacToeGame {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.gameId = null;
        this.tgId = null;
        // Определяем путь к API относительно текущей страницы
        // Определяем путь к API относительно текущей страницы
        // Если game.php находится в /web/, то API в /api/
        const currentPath = window.location.pathname;
        if (currentPath.includes('/web/')) {
            this.apiUrl = '../api/game.php';
        } else {
            this.apiUrl = '/api/game.php';
        }
        
        this.init();
    }
    
    /**
     * Инициализация игры
     */
    init() {
        // Получаем Telegram ID из URL
        const urlParams = new URLSearchParams(window.location.search);
        this.tgId = urlParams.get('tg_id') || telegramAPI.getUserId();
        
        if (!this.tgId) {
            console.error('Telegram ID not found');
            this.showError('Не удалось определить пользователя. Откройте игру через Telegram бота.');
            return;
        }
        
        // Инициализируем Telegram API
        telegramAPI.init();
        
        // Создаем игровое поле
        this.createBoard();
        
        // НЕ начинаем игру автоматически - ждем нажатия кнопки "Играть"
    }
    
    /**
     * Создание игрового поля в DOM
     */
    createBoard() {
        const boardElement = document.getElementById('game-board');
        if (!boardElement) {
            return;
        }
        
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'game-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleCellClick(i));
            boardElement.appendChild(cell);
        }
    }
    
    /**
     * Начало новой игры
     */
    async startNewGame() {
        try {
            this.gameOver = false;
            this.board = ['', '', '', '', '', '', '', '', ''];
            this.currentPlayer = 'X';
            
            // Очищаем поле
            this.updateBoardDisplay();
            
            // Скрываем результаты
            this.hideResultScreen();
            PromoCodeDisplay.hide();
            
            // Отправляем запрос на сервер
            const response = await this.apiRequest('start', {
                tg_id: this.tgId
            });
            
            if (response.success && response.game) {
                this.gameId = response.game.game_id;
                this.board = response.game.board;
                this.updateBoardDisplay();
            } else {
                this.showError('Не удалось начать игру');
            }
        } catch (error) {
            console.error('Error starting game:', error);
            this.showError('Ошибка при запуске игры');
        }
    }
    
    /**
     * Обработка клика по ячейке
     */
    async handleCellClick(position) {
        if (this.gameOver || this.board[position] !== '') {
            return;
        }
        
        // Делаем ход игрока
        await this.makeMove(position, 'X');
    }
    
    /**
     * Выполнение хода
     */
    async makeMove(position, symbol) {
        try {
            // ВАЖНО: Сохраняем состояние доски ДО хода
            const boardBeforeMove = [...this.board];
            
            // Визуально обновляем (оптимистичное обновление UI)
            this.board[position] = symbol;
            this.updateBoardDisplay();
            
            // Отправляем ход на сервер с состоянием ДО хода
            const response = await this.apiRequest('move', {
                tg_id: this.tgId,
                game_id: this.gameId,
                position: position,
                game: {
                    game_id: this.gameId,
                    board: boardBeforeMove, // Отправляем состояние ДО хода!
                    status: 'in_progress'
                }
            });
            
            if (!response.success) {
                this.showError(response.error || 'Ошибка при выполнении хода');
                // Откатываем ход
                this.board = boardBeforeMove;
                this.updateBoardDisplay();
                return;
            }
            
            // Обновляем состояние игры
            if (response.game) {
                this.board = response.game.board;
                this.updateBoardDisplay();
                
                // Если бот сделал ход
                if (response.bot_move !== undefined) {
                    // Небольшая задержка для визуализации
                    await this.delay(500);
                }
            }
            
            // Проверяем результат
            if (response.result && response.result !== 'in_progress') {
                this.handleGameEnd(response.result, response.promo_code);
            }
        } catch (error) {
            console.error('Error making move:', error);
            this.showError('Ошибка при выполнении хода');
        }
    }
    
    /**
     * Обработка окончания игры
     */
    handleGameEnd(result, promoCode) {
        this.gameOver = true;
        
        let message = '';
        let icon = '';
        
        switch (result) {
            case 'player_win':
                message = '🎉 Победа!';
                icon = '🎉';
                if (promoCode) {
                    PromoCodeDisplay.show(promoCode);
                    // Отправляем данные в бот
                    telegramAPI.sendData({
                        action: 'win',
                        promo_code: promoCode,
                        game_id: this.gameId
                    });
                }
                break;
            case 'bot_win':
                message = 'Проигрыш 💫';
                icon = '😔';
                telegramAPI.sendData({
                    action: 'lose',
                    game_id: this.gameId
                });
                break;
            case 'draw':
                message = 'Ничья 💫';
                icon = '🤝';
                telegramAPI.sendData({
                    action: 'draw',
                    game_id: this.gameId
                });
                break;
        }
        
        this.showResultScreen(message, icon);
    }
    
    /**
     * Обновление отображения игрового поля
     */
    updateBoardDisplay() {
        const cells = document.querySelectorAll('.game-cell');
        cells.forEach((cell, index) => {
            const symbol = this.board[index];
            cell.textContent = symbol;
            cell.className = 'game-cell';
            
            if (symbol === 'X') {
                cell.classList.add('x');
            } else if (symbol === 'O') {
                cell.classList.add('o');
            }
            
            if (this.gameOver || symbol !== '') {
                cell.classList.add('disabled');
            }
        });
    }
    
    /**
     * Показ экрана результатов
     */
    showResultScreen(message, icon) {
        const resultScreen = document.getElementById('result-screen');
        const resultIcon = document.getElementById('result-icon');
        const resultTitle = document.getElementById('result-title');
        
        if (resultScreen) {
            if (resultIcon) resultIcon.textContent = icon;
            if (resultTitle) resultTitle.textContent = message;
            resultScreen.classList.remove('hidden');
        }
    }
    
    /**
     * Скрытие экрана результатов
     */
    hideResultScreen() {
        const resultScreen = document.getElementById('result-screen');
        if (resultScreen) {
            resultScreen.classList.add('hidden');
        }
    }
    
    /**
     * Показ ошибки
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.textContent = message;
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translateX(-50%)';
        errorDiv.style.zIndex = '1000';
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
    
    /**
     * API запрос
     */
    async apiRequest(action, data) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    ...data
                })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error('API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: responseData
                });
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }
            
            return responseData;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
    
    /**
     * Задержка
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Инициализация игры при загрузке страницы
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new TicTacToeGame();
    
    // Обработчик кнопки "Сыграть ещё раз"
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            game.startNewGame();
        });
    }
    
    // Обработчик кнопки копирования промокода
    const copyPromoBtn = document.getElementById('copy-promo-btn');
    if (copyPromoBtn) {
        copyPromoBtn.addEventListener('click', () => {
            const promoValue = document.getElementById('promo-code-value');
            if (promoValue) {
                PromoCodeDisplay.copyToClipboard(promoValue.textContent);
            }
        });
    }
    
    // Обработчик кнопки "Играть" из меню
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (game) {
                game.startNewGame();
            }
        });
    }
});

