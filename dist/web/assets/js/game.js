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
        // На Vercel используем путь через /web/assets/images/
        // который через rewrite /web/:path* -> /dist/web/:path* 
        // будет направлен на /dist/web/assets/images/
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
     * Пробуем загрузить PNG, если не получится - используем SVG
     */
    preloadImages() {
        // Пробуем загрузить PNG изображения
        const xImg = new Image();
        xImg.src = this.imagesPath + 'X.png';
        xImg.onload = () => {
            this.imageCache.X = xImg;
            console.log('X.png loaded successfully');
        };
        xImg.onerror = () => {
            console.warn('X.png failed to load, using SVG fallback');
            this.imageCache.X = this.createXSVG();
        };
        
        const oImg = new Image();
        oImg.src = this.imagesPath + 'O.png';
        oImg.onload = () => {
            this.imageCache.O = oImg;
            console.log('O.png loaded successfully');
        };
        oImg.onerror = () => {
            console.warn('O.png failed to load, using SVG fallback');
            this.imageCache.O = this.createOSVG();
        };
        
        // Устанавливаем SVG как fallback по умолчанию
        if (!this.imageCache.X) {
            this.imageCache.X = this.createXSVG();
        }
        if (!this.imageCache.O) {
            this.imageCache.O = this.createOSVG();
        }
    }
    
    /**
     * Создание SVG для крестика
     */
    createXSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('class', 'cell-symbol-img');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        // Две диагональные линии для X
        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', '20');
        line1.setAttribute('y1', '20');
        line1.setAttribute('x2', '80');
        line1.setAttribute('y2', '80');
        line1.setAttribute('stroke', 'currentColor');
        line1.setAttribute('stroke-width', '8');
        line1.setAttribute('stroke-linecap', 'round');
        
        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', '80');
        line2.setAttribute('y1', '20');
        line2.setAttribute('x2', '20');
        line2.setAttribute('y2', '80');
        line2.setAttribute('stroke', 'currentColor');
        line2.setAttribute('stroke-width', '8');
        line2.setAttribute('stroke-linecap', 'round');
        
        svg.appendChild(line1);
        svg.appendChild(line2);
        return svg;
    }
    
    /**
     * Создание SVG для нолика
     */
    createOSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('class', 'cell-symbol-img');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        // Круг для O
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '50');
        circle.setAttribute('cy', '50');
        circle.setAttribute('r', '30');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', 'currentColor');
        circle.setAttribute('stroke-width', '8');
        
        svg.appendChild(circle);
        return svg;
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
            console.log('startNewGame called, tg_id:', this.tgId);
            
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
            if (typeof PromoCodeDisplay !== 'undefined') {
                PromoCodeDisplay.hide();
            }
            
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
            
            // Проверяем наличие tg_id перед отправкой запроса
            if (!this.tgId) {
                console.warn('tg_id not available, trying to get it again...');
                const urlParams = new URLSearchParams(window.location.search);
                const tgIdFromUrl = urlParams.get('tg_id');
                const tgIdFromAPI = telegramAPI.getUserId();
                this.tgId = tgIdFromUrl || tgIdFromAPI;
                
                if (!this.tgId) {
                    console.error('tg_id still not available');
                    this.showError('Не удалось определить пользователя. Пожалуйста, откройте игру через Telegram бота.');
                    return;
                }
            }
            
            // Отправляем запрос на сервер
            const response = await this.apiRequest('start', {
                tg_id: this.tgId
            });
            
            console.log('Start game response:', response);
            
            if (response.success && response.game) {
                this.gameId = response.game.game_id;
                this.board = response.game.board;
                this.updateBoardDisplay();
                // Разблокируем ячейки после начала игры
                this.unblockAllCells();
                console.log('Game started successfully, game_id:', this.gameId);
            } else {
                console.error('Failed to start game:', response);
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
            
            // Отправляем ход на сервер с состоянием ДО хода (без оптимистичного обновления)
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
                // Разблокируем ячейки
                this.isProcessingMove = false;
                this.unblockAllCells();
                return;
            }
            
            // Обновляем состояние игры из ответа сервера
            if (response.game && response.game.board) {
                // Сохраняем старое состояние доски для сравнения
                const oldBoard = [...this.board];
                const serverBoard = [...response.game.board];
                
                console.log('Updating board from server response:', {
                    oldBoard: oldBoard,
                    serverBoard: serverBoard,
                    botMove: response.bot_move,
                    result: response.result
                });
                
                // ШАГ 1: Отображаем ТОЛЬКО ход игрока
                // Обновляем доску только с ходом игрока (без хода бота)
                const playerMoveBoard = [...oldBoard];
                playerMoveBoard[position] = 'X';
                this.board = playerMoveBoard;
                
                // Обновляем только ячейку игрока
                this.updateCellDisplay(position);
                
                // Ждем следующего кадра анимации для гарантии отрисовки
                await new Promise(resolve => requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                }));
                
                // ШАГ 2: Если бот сделал ход, ждем перед отображением
                if (response.bot_move !== undefined && response.bot_move !== null) {
                    const botMovePosition = response.bot_move;
                    
                    console.log('Bot will move at position:', botMovePosition);
                    console.log('Board state before delay (should NOT have bot move):', [...this.board]);
                    
                    // ВАЖНО: Проверяем, что доска НЕ содержит ход бота
                    if (this.board[botMovePosition] !== '') {
                        console.error('ERROR: Bot cell is not empty before delay!', this.board[botMovePosition]);
                    }
                    
                    // Задержка перед ходом бота (800мс)
                    console.log('Starting 800ms delay before bot move...', new Date().getTime());
                    await new Promise(resolve => setTimeout(resolve, 800)); // Используем напрямую setTimeout для гарантии
                    console.log('Delay completed, now displaying bot move', new Date().getTime());
                    
                    // ШАГ 3: ТОЛЬКО ПОСЛЕ ЗАДЕРЖКИ обновляем ход бота
                    // Обновляем только ячейку бота, не трогая остальные
                    this.board[botMovePosition] = 'O';
                    this.updateCellDisplay(botMovePosition);
                    
                    console.log('Board state after bot move:', [...this.board]);
                } else {
                    // Если бот не сделал ход (игра окончена), обновляем доску полностью
                    this.board = serverBoard;
                    this.updateBoardDisplay();
                    console.log('No bot move - game ended');
                }
            } else {
                console.error('Invalid response from server:', response);
            }
            
            // Проверяем результат
            // ВАЖНО: Проверяем результат только ПОСЛЕ того, как отобразили ход бота
            if (response.result && response.result !== 'in_progress') {
                // При окончании игры обновляем все ячейки для disabled состояния
                // Но только если мы уже отобразили ход бота (или его нет)
                this.updateBoardDisplay();
                this.handleGameEnd(response.result, response.promo_code);
                // Игра окончена - не разблокируем ячейки
                this.isProcessingMove = false;
                return;
            }
            
            // Разблокируем ячейки после завершения хода бота
            // ВАЖНО: Это происходит только ПОСЛЕ задержки и отображения хода бота
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
        
        // ВАЖНО: Читаем символ ТОЛЬКО из this.board, не из response.game.board
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
            cell.innerHTML = '';
            
            // Используем изображение если загружено, иначе SVG
            if (this.imageCache.X && this.imageCache.X instanceof Image && this.imageCache.X.complete) {
                const img = this.imageCache.X.cloneNode(false);
                img.className = 'cell-symbol-img';
                cell.appendChild(img);
            } else if (this.imageCache.X && this.imageCache.X instanceof SVGElement) {
                const svg = this.imageCache.X.cloneNode(true);
                cell.appendChild(svg);
            } else {
                // Fallback: создаем новый SVG
                const svg = this.createXSVG();
                cell.appendChild(svg);
            }
        } else if (symbol === 'O') {
            cell.classList.add('o');
            cell.innerHTML = '';
            
            // Используем изображение если загружено, иначе SVG
            if (this.imageCache.O && this.imageCache.O instanceof Image && this.imageCache.O.complete) {
                const img = this.imageCache.O.cloneNode(false);
                img.className = 'cell-symbol-img';
                cell.appendChild(img);
            } else if (this.imageCache.O && this.imageCache.O instanceof SVGElement) {
                const svg = this.imageCache.O.cloneNode(true);
                cell.appendChild(svg);
            } else {
                // Fallback: создаем новый SVG
                const svg = this.createOSVG();
                cell.appendChild(svg);
            }
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

