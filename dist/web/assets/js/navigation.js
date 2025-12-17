/**
 * Навигация между экранами игры
 */

class Navigation {
    constructor() {
        this.currentScreen = 'menu';
        this.init();
    }
    
    init() {
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
        
        // Кнопка "В меню" из игры
        const backToMenuBtn = document.getElementById('back-to-menu-btn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => this.showMenu());
        }
        
        // Кнопка "В меню" из истории
        const backToMenuFromHistoryBtn = document.getElementById('back-to-menu-from-history-btn');
        if (backToMenuFromHistoryBtn) {
            backToMenuFromHistoryBtn.addEventListener('click', () => this.showMenu());
        }
    }
    
    showMenu() {
        this.hideAllScreens();
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
        this.hideAllScreens();
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
        if (typeof game !== 'undefined' && game) {
            game.startNewGame();
        }
    }
    
    showHistory() {
        this.hideAllScreens();
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
            if (typeof historyManager !== 'undefined' && historyManager) {
                historyManager.loadHistory();
            }
        }, 50);
    }
    
    hideAllScreens() {
        const screens = ['main-menu', 'game-screen', 'history-screen'];
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                // Плавное скрытие
                screen.style.transition = 'opacity 0.15s ease';
                screen.style.opacity = '0';
                setTimeout(() => {
                    screen.classList.add('hidden');
                    screen.style.opacity = '';
                    screen.style.transition = '';
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

