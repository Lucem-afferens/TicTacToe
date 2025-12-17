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
            menu.classList.remove('hidden');
        }
        this.currentScreen = 'menu';
    }
    
    showGame() {
        this.hideAllScreens();
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
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
            historyScreen.classList.remove('hidden');
        }
        this.currentScreen = 'history';
        
        // Загружаем историю
        if (typeof historyManager !== 'undefined' && historyManager) {
            historyManager.loadHistory();
        }
    }
    
    hideAllScreens() {
        const screens = ['main-menu', 'game-screen', 'history-screen'];
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('hidden');
            }
        });
    }
}

// Инициализация навигации при загрузке страницы
let navigation;
document.addEventListener('DOMContentLoaded', () => {
    navigation = new Navigation();
});

