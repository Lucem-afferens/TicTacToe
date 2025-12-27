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
        // Определяем путь к API
        // На Vercel API находится в /api/game.js (Node.js версия)
        this.apiUrl = '/api/game.js';
        
        // Определяем путь к изображениям
        // На Vercel используем абсолютный путь от корня
        this.imagesPath = '/web/assets/images/';
        
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
        console.log('Game init started');
        
        // Сначала инициализируем Telegram API (чтобы получить доступ к WebApp SDK)
        const telegramInitialized = telegramAPI.init();
        console.log('Telegram API initialized:', telegramInitialized);
        
        // Получаем Telegram ID из URL или из Telegram WebApp API
        const urlParams = new URLSearchParams(window.location.search);
        const tgIdFromUrl = urlParams.get('tg_id');
        const tgIdFromAPI = telegramAPI.getUserId();
        
        console.log('tg_id from URL:', tgIdFromUrl);
        console.log('tg_id from Telegram API:', tgIdFromAPI);
        console.log('Telegram WebApp available:', typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp);
        
        if (window.Telegram && window.Telegram.WebApp) {
            console.log('Telegram WebApp initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
            console.log('Telegram WebApp initDataUnsafe.user:', window.Telegram.WebApp.initDataUnsafe?.user);
        }
        
        this.tgId = tgIdFromUrl || tgIdFromAPI;
        
        // Если tg_id все еще не найден, пытаемся получить его после небольшой задержки
        // (на случай, если Telegram WebApp SDK еще не полностью загружен)
        if (!this.tgId) {
            console.warn('tg_id not found immediately, retrying after delay...');
            setTimeout(() => {
                this.tgId = telegramAPI.getUserId();
                console.log('tg_id after delay:', this.tgId);
                
                if (!this.tgId) {
                    console.error('Telegram ID not found after retry');
                    // Показываем ошибку только если это точно не Telegram WebApp
                    if (!window.Telegram || !window.Telegram.WebApp) {
            this.showError('Не удалось определить пользователя. Откройте игру через Telegram бота.');
                        return;
                    }
                    // Если Telegram WebApp доступен, но tg_id нет, продолжаем с предупреждением
                    console.warn('Continuing without tg_id - Telegram WebApp is available');
                }
                // Продолжаем инициализацию
                this.createBoard();
            }, 500); // Увеличиваем задержку до 500мс
            return;
        }
        
        console.log('Using tg_id:', this.tgId);
        
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
            
            // Скрываем экран результатов и промокод
            this.hideResultScreen();
            this.hidePromoInModal();
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
            const img = document.createElement('img');
            // Используем абсолютный путь для надежности
            const imageSrc = this.imageCache.X ? this.imageCache.X.src : (this.imagesPath + 'X.png');
            img.src = imageSrc;
            img.alt = 'X';
            img.className = 'cell-symbol-img';
            // Обработчик ошибок загрузки
            img.onerror = () => {
                // Fallback: используем текст если изображение не загрузилось
                cell.innerHTML = '<span style="font-size: 48px; font-weight: bold; color: var(--color-primary);">X</span>';
            };
            cell.innerHTML = '';
            cell.appendChild(img);
        } else if (symbol === 'O') {
            cell.classList.add('o');
            const img = document.createElement('img');
            // Используем абсолютный путь для надежности
            const imageSrc = this.imageCache.O ? this.imageCache.O.src : (this.imagesPath + 'O.png');
            img.src = imageSrc;
            img.alt = 'O';
            img.className = 'cell-symbol-img';
            // Обработчик ошибок загрузки
            img.onerror = () => {
                // Fallback: используем текст если изображение не загрузилось
                cell.innerHTML = '<span style="font-size: 48px; font-weight: bold; color: var(--color-secondary);">O</span>';
            };
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
                message = 'Победа!';
                icon = '';
                if (promoCode) {
                    // Показываем промокод в модальном окне
                    this.showPromoInModal(promoCode);
                    // Отправляем данные в бот
                    telegramAPI.sendData({
                        action: 'win',
                        promo_code: promoCode,
                        game_id: this.gameId
                    });
                } else {
                    // Скрываем промокод если его нет
                    this.hidePromoInModal();
                }
                break;
            case 'bot_win':
                message = 'Проигрыш';
                icon = '';
                this.hidePromoInModal();
                telegramAPI.sendData({
                    action: 'lose',
                    game_id: this.gameId
                });
                break;
            case 'draw':
                message = 'Ничья';
                icon = '';
                this.hidePromoInModal();
                telegramAPI.sendData({
                    action: 'draw',
                    game_id: this.gameId
                });
                break;
        }
        
        this.showResultScreen(message, icon);
    }
    
    /**
     * Показ промокода в модальном окне
     */
    showPromoInModal(promoCode) {
        const promoContainer = document.getElementById('result-promo-container');
        const promoValue = document.getElementById('result-promo-value');
        
        if (promoContainer && promoValue) {
            promoValue.textContent = promoCode;
            promoContainer.classList.remove('hidden');
        }
    }
    
    /**
     * Скрытие промокода в модальном окне
     */
    hidePromoInModal() {
        const promoContainer = document.getElementById('result-promo-container');
        if (promoContainer) {
            promoContainer.classList.add('hidden');
        }
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
     * Показ экрана результатов (модальное окно)
     */
    showResultScreen(message, icon) {
        const resultModal = document.getElementById('result-modal');
        const resultIcon = document.getElementById('result-icon');
        const resultTitle = document.getElementById('result-title');
        
        if (resultModal) {
            // Иконка скрыта, не показываем смайлы
            if (resultIcon) {
                resultIcon.style.display = 'none';
            }
            if (resultTitle) {
                resultTitle.textContent = message;
            }
            resultModal.classList.remove('hidden');
        }
    }
    
    /**
     * Скрытие экрана результатов
     */
    hideResultScreen() {
        const resultModal = document.getElementById('result-modal');
        if (resultModal) {
            resultModal.classList.add('hidden');
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
    
    // Обработчик кнопки копирования промокода (старая кнопка)
    const copyPromoBtn = document.getElementById('copy-promo-btn');
    if (copyPromoBtn) {
        copyPromoBtn.addEventListener('click', () => {
            const promoValue = document.getElementById('promo-code-value');
            if (promoValue) {
                PromoCodeDisplay.copyToClipboard(promoValue.textContent);
            }
        });
    }
    
    // Обработчик кнопки копирования промокода в модальном окне
    const resultCopyPromoBtn = document.getElementById('result-copy-promo-btn');
    if (resultCopyPromoBtn) {
        resultCopyPromoBtn.addEventListener('click', () => {
            const resultPromoValue = document.getElementById('result-promo-value');
            if (resultPromoValue) {
                PromoCodeDisplay.copyToClipboard(resultPromoValue.textContent);
            }
        });
    }
    
    // Обработчик кнопки "Играть" удален - теперь управляется через navigation.js
});

