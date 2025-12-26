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
        this.isProcessingMove = false; // Флаг блокировки во время обработки хода
        // Определяем путь к API относительно текущей страницы
        // Определяем путь к API относительно текущей страницы
        // Если game.php находится в /web/, то API в /api/
        const currentPath = window.location.pathname;
        if (currentPath.includes('/web/')) {
            this.apiUrl = '../api/game.php';
        } else {
            this.apiUrl = '/api/game.php';
        }
        
        // Определяем путь к изображениям - используем тот же подход
        // game.php находится в /web/, assets/images/ находится в /web/assets/images/
        this.imagesPath = 'assets/images/';
        
        // Предзагружаем изображения для плавного отображения
        this.imageCache = {
            X: null,
            O: null
        };
        this.preloadImages();
        
        this.init();
    }
    
    /**
     * Предзагрузка изображений символов
     */
    preloadImages() {
        // Предзагружаем изображение X
        this.imageCache.X = new Image();
        this.imageCache.X.src = this.imagesPath + 'X.png';
        this.imageCache.X.alt = 'X';
        this.imageCache.X.className = 'cell-symbol-img';
        
        // Предзагружаем изображение O
        this.imageCache.O = new Image();
        this.imageCache.O.src = this.imagesPath + 'O.png';
        this.imageCache.O.alt = 'O';
        this.imageCache.O.className = 'cell-symbol-img';
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
            cell.dataset.symbol = ''; // Инициализируем пустым символом
            cell.addEventListener('click', () => this.handleCellClick(i));
            boardElement.appendChild(cell);
        }
    }
    
    /**
     * Начало новой игры
     */
    async startNewGame() {
        try {
            // Сбрасываем все флаги
            this.gameOver = false;
            this.isProcessingMove = false;
            this.board = ['', '', '', '', '', '', '', '', ''];
            this.currentPlayer = 'X';
            this.gameId = null;
            
            // Сбрасываем кэш символов в ячейках и убираем все классы
            const cells = document.querySelectorAll('.game-cell');
            cells.forEach(cell => {
                cell.dataset.symbol = '';
                cell.classList.remove('processing', 'disabled', 'x', 'o');
                cell.style.pointerEvents = '';
                cell.style.cursor = '';
                cell.innerHTML = ''; // Полностью очищаем содержимое
            });
            
            // Скрываем экран результатов
            this.hideResultScreen();
            PromoCodeDisplay.hide();
            
            // Убеждаемся, что игровой экран виден
            const gameScreen = document.getElementById('game-screen');
            const resultScreen = document.getElementById('result-screen');
            if (gameScreen) {
                gameScreen.classList.remove('hidden');
            }
            if (resultScreen) {
                resultScreen.classList.add('hidden');
            }
            
            // Очищаем поле визуально
            this.updateBoardDisplay();
            
            // Отправляем запрос на сервер
            const response = await this.apiRequest('start', {
                tg_id: this.tgId
            });
            
            if (response.success && response.game) {
                this.gameId = response.game.game_id;
                this.board = response.game.board;
                this.updateBoardDisplay();
                // Разблокируем ячейки после начала игры
                this.unblockAllCells();
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
        // Блокируем клики во время обработки хода
        if (this.isProcessingMove) {
            return;
        }
        
        // Блокируем клики если игра окончена или ячейка занята
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
        // Блокируем повторные клики
        if (this.isProcessingMove) {
            return;
        }
        
        try {
            // Устанавливаем флаг обработки хода
            this.isProcessingMove = true;
            
            // Блокируем все ячейки визуально
            this.blockAllCells();
            
            // ВАЖНО: Сохраняем состояние доски ДО хода
            const boardBeforeMove = [...this.board];
            
            // Визуально обновляем только одну ячейку (оптимистичное обновление UI)
            this.board[position] = symbol;
            this.updateCellDisplay(position);
            
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
                this.updateCellDisplay(position);
                // Разблокируем ячейки
                this.isProcessingMove = false;
                this.unblockAllCells();
                return;
            }
            
            // Обновляем состояние игры
            if (response.game) {
                // Обновляем только измененные ячейки
                const oldBoard = [...this.board];
                this.board = response.game.board;
                
                // Находим измененные ячейки
                const changedCells = [];
                for (let i = 0; i < 9; i++) {
                    if (oldBoard[i] !== this.board[i]) {
                        changedCells.push(i);
                    }
                }
                
                // Обновляем только измененные ячейки
                changedCells.forEach(index => {
                    this.updateCellDisplay(index);
                });
                
                // Если бот сделал ход
                if (response.bot_move !== undefined) {
                    // Небольшая задержка для визуализации
                    await this.delay(500);
                }
            }
            
            // Проверяем результат
            if (response.result && response.result !== 'in_progress') {
                // При окончании игры обновляем все ячейки для disabled состояния
                this.updateBoardDisplay();
                this.handleGameEnd(response.result, response.promo_code);
                // Игра окончена - не разблокируем ячейки
                this.isProcessingMove = false;
                return;
            }
            
            // Разблокируем ячейки после завершения хода бота
            this.isProcessingMove = false;
            this.unblockAllCells();
            
        } catch (error) {
            console.error('Error making move:', error);
            this.showError('Ошибка при выполнении хода');
            // Разблокируем ячейки при ошибке
            this.isProcessingMove = false;
            this.unblockAllCells();
        }
    }
    
    /**
     * Блокировка всех ячеек во время обработки хода
     */
    blockAllCells() {
        const cells = document.querySelectorAll('.game-cell');
        cells.forEach(cell => {
            // Блокируем все ячейки функционально, но БЕЗ визуальных эффектов
            cell.style.pointerEvents = 'none';
            cell.style.cursor = 'wait';
            // НЕ добавляем класс processing - никаких спиннеров!
        });
    }
    
    /**
     * Разблокировка всех ячеек после обработки хода
     */
    unblockAllCells() {
        const cells = document.querySelectorAll('.game-cell');
        cells.forEach(cell => {
            // Убираем блокировку только если ячейка пустая и игра не окончена
            const index = parseInt(cell.dataset.index);
            if (!this.gameOver && this.board[index] === '') {
                cell.style.pointerEvents = '';
                cell.style.cursor = '';
            }
            // Убираем все классы processing на всякий случай
            cell.classList.remove('processing');
        });
    }
    
    /**
     * Обновление одной ячейки (оптимизированное)
     */
    updateCellDisplay(index) {
        const cell = document.querySelector(`.game-cell[data-index="${index}"]`);
        if (!cell) return;
        
        const symbol = this.board[index];
        const currentSymbol = cell.dataset.symbol || '';
        
        // Если символ не изменился, обновляем только состояние disabled
        if (currentSymbol === symbol) {
            if (this.gameOver || symbol !== '') {
                cell.classList.add('disabled');
            } else {
                cell.classList.remove('disabled');
            }
            // Принудительное обновление стилей
            this.forceStyleUpdate(cell);
            return;
        }
        
        // Символ изменился - обновляем ячейку
        cell.dataset.symbol = symbol;
        cell.className = 'game-cell';
        cell.classList.remove('x', 'o', 'disabled');
        
        if (symbol === '') {
            cell.innerHTML = '';
        } else if (symbol === 'X') {
            cell.classList.add('x');
            // Создаем новое изображение на основе предзагруженного
            const img = document.createElement('img');
            img.src = this.imageCache.X.src; // Используем уже загруженный src
            img.alt = 'X';
            img.className = 'cell-symbol-img';
            cell.innerHTML = '';
            cell.appendChild(img);
        } else if (symbol === 'O') {
            cell.classList.add('o');
            // Создаем новое изображение на основе предзагруженного
            const img = document.createElement('img');
            img.src = this.imageCache.O.src; // Используем уже загруженный src
            img.alt = 'O';
            img.className = 'cell-symbol-img';
            cell.innerHTML = '';
            cell.appendChild(img);
        }
        
        if (this.gameOver || symbol !== '') {
            cell.classList.add('disabled');
        }
        
        // Принудительное обновление стилей
        this.forceStyleUpdate(cell);
    }
    
    /**
     * Принудительное обновление стилей элемента
     */
    forceStyleUpdate(element) {
        if (!element) return;
        
        // Принудительный reflow для применения стилей
        void element.offsetHeight;
        
        // Обновляем computed styles
        if (window.getComputedStyle) {
            window.getComputedStyle(element);
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
     * Оптимизированная версия - обновляет только измененные ячейки
     */
    updateBoardDisplay() {
        const cells = document.querySelectorAll('.game-cell');
        
        cells.forEach((cell, index) => {
            const symbol = this.board[index];
            const currentSymbol = cell.dataset.symbol || ''; // Сохраняем текущий символ в data-атрибуте
            
            // Обновляем только если символ изменился
            if (currentSymbol === symbol) {
                // Символ не изменился - обновляем только классы состояния
                if (this.gameOver || symbol !== '') {
                    cell.classList.add('disabled');
                } else {
                    cell.classList.remove('disabled');
                }
                // Принудительное обновление стилей
                this.forceStyleUpdate(cell);
                return; // Пропускаем ячейку, которая не изменилась
            }
            
            // Символ изменился - используем оптимизированное обновление одной ячейки
            this.updateCellDisplay(index);
        });
        
        // Принудительное обновление всего поля
        const boardElement = document.getElementById('game-board');
        if (boardElement) {
            this.forceStyleUpdate(boardElement);
        }
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
            resultScreen.style.display = 'none';
        }
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
            resultScreen.style.display = 'block';
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
    // Делаем доступным глобально
    window.game = game;
    
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
    
    // Обработчик кнопки "Играть" удален - теперь управляется через navigation.js
});

