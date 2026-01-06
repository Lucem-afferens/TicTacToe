/**
 * Навигация между экранами игры
 */

class Navigation {
    constructor() {
        this.currentScreen = 'menu';
        // Инициализируем после загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        // Убеждаемся, что начальное состояние правильное
        this.ensureInitialState();
        
        // Кнопка "Играть"
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.showGame());
        }
        
        // Кнопка "История игр"
        const historyBtn = document.getElementById('history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistory());
        }
        
        // Кнопка "В меню" из истории
        const backToMenuFromHistoryBtn = document.getElementById('back-to-menu-from-history-btn');
        if (backToMenuFromHistoryBtn) {
            backToMenuFromHistoryBtn.addEventListener('click', () => this.showMenu());
        }
    }
    
    ensureInitialState() {
        // Меню должно быть видимым
        const menu = document.getElementById('main-menu');
        if (menu) {
            menu.classList.remove('hidden');
            menu.style.opacity = '1';
        }
        
        // Остальные экраны должны быть скрыты
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.add('hidden');
            gameScreen.style.opacity = '';
        }
        
        const historyScreen = document.getElementById('history-screen');
        if (historyScreen) {
            historyScreen.classList.add('hidden');
            historyScreen.style.opacity = '';
        }
    }
    
    showMenu() {
        this.hideAllScreens('main-menu');
        const menu = document.getElementById('main-menu');
        if (menu) {
            menu.style.opacity = '0';
            menu.classList.remove('hidden');
            // Плавное появление
            requestAnimationFrame(() => {
                menu.style.transition = 'opacity 0.2s ease';
                menu.style.opacity = '1';
            });
        }
        this.currentScreen = 'menu';
    }
    
    showGame() {
        this.hideAllScreens('game-screen');
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.opacity = '0';
            gameScreen.classList.remove('hidden');
            // Плавное появление
            requestAnimationFrame(() => {
                gameScreen.style.transition = 'opacity 0.2s ease';
                gameScreen.style.opacity = '1';
            });
        }
        this.currentScreen = 'game';
        
        // Если игра еще не инициализирована, запускаем её
        // Используем setTimeout чтобы дать время экрану появиться
        setTimeout(() => {
            // Пробуем несколько способов получить объект игры
            const gameInstance = window.game || (typeof game !== 'undefined' ? game : null);
            
            if (gameInstance && typeof gameInstance.startNewGame === 'function') {
                console.log('Starting new game from navigation');
                gameInstance.startNewGame();
            } else {
                console.warn('Game instance not found, retrying...');
                // Повторная попытка через еще одну задержку
                setTimeout(() => {
                    const retryInstance = window.game || (typeof game !== 'undefined' ? game : null);
                    if (retryInstance && typeof retryInstance.startNewGame === 'function') {
                        console.log('Starting new game from navigation (retry)');
                        retryInstance.startNewGame();
                    } else {
                        console.error('Game instance still not found after retry');
                    }
                }, 300);
            }
        }, 200);
    }
    
    showHistory() {
        this.hideAllScreens('history-screen');
        const historyScreen = document.getElementById('history-screen');
        if (historyScreen) {
            historyScreen.style.opacity = '0';
            historyScreen.classList.remove('hidden');
            // Плавное появление
            requestAnimationFrame(() => {
                historyScreen.style.transition = 'opacity 0.2s ease';
                historyScreen.style.opacity = '1';
            });
        }
        this.currentScreen = 'history';
        
        // Загружаем историю с небольшой задержкой для плавности
        setTimeout(() => {
            const manager = window.historyManager || historyManager;
            if (typeof manager !== 'undefined' && manager) {
                manager.loadHistory();
            }
        }, 200);
    }
    
    hideAllScreens(exceptScreenId = null) {
        const screens = [
            { id: 'main-menu', element: document.getElementById('main-menu') },
            { id: 'game-screen', element: document.getElementById('game-screen') },
            { id: 'history-screen', element: document.getElementById('history-screen') }
        ];
        
        screens.forEach(({ id, element }) => {
            if (element && id !== exceptScreenId) {
                // Плавное скрытие
                element.style.transition = 'opacity 0.15s ease';
                element.style.opacity = '0';
                setTimeout(() => {
                    if (element.style.opacity === '0' || element.style.opacity === '') {
                        element.classList.add('hidden');
                        element.style.opacity = '';
                        element.style.transition = '';
                    }
                }, 150);
            }
        });
    }
}

// Инициализация навигации при загрузке страницы
let navigation;
document.addEventListener('DOMContentLoaded', () => {
    navigation = new Navigation();
});

