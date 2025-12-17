/**
 * Управление историей игр
 */

class HistoryManager {
    constructor() {
        this.tgId = null;
        this.apiUrl = '../api/game.php';
        this.init();
    }
    
    init() {
        // Получаем Telegram ID
        const urlParams = new URLSearchParams(window.location.search);
        this.tgId = urlParams.get('tg_id') || telegramAPI.getUserId();
    }
    
    /**
     * Загрузка истории игр
     */
    async loadHistory() {
        const historyContent = document.getElementById('history-content');
        if (!historyContent) {
            return;
        }
        
        // Показываем минимальный индикатор загрузки без анимации
        historyContent.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--color-text-light);">Загрузка...</div>';
        
        try {
            const response = await this.apiRequest('history', {
                tg_id: this.tgId
            });
            
            if (response.success && response.games) {
                // Плавное обновление контента
                this.displayHistory(response.games, response.stats);
            } else {
                historyContent.innerHTML = '<div class="message error">Не удалось загрузить историю</div>';
            }
        } catch (error) {
            console.error('Error loading history:', error);
            historyContent.innerHTML = '<div class="message error">Ошибка при загрузке истории</div>';
        }
    }
    
    /**
     * Отображение истории игр
     */
    displayHistory(games, stats) {
        const historyContent = document.getElementById('history-content');
        if (!historyContent) {
            return;
        }
        
        if (games.length === 0) {
            historyContent.innerHTML = `
                <div class="message info">
                    <p>У вас пока нет сыгранных игр.</p>
                    <p>Начните игру, чтобы увидеть здесь свою историю! 🎮</p>
                </div>
            `;
            return;
        }
        
        // Статистика - новая структура v2
        let statsHtml = '';
        if (stats) {
            statsHtml = `
                <div class="stats-container-v2">
                    <h3 class="stats-title-v2">📈 Статистика</h3>
                    <div class="stats-grid-v2">
                        <div class="stat-card-v2">
                            <div class="stat-number-v2">${stats.total_games || 0}</div>
                            <div class="stat-text-v2">Всего игр</div>
                        </div>
                        <div class="stat-card-v2 stat-card-win-v2">
                            <div class="stat-number-v2 stat-number-win-v2">${stats.wins || 0}</div>
                            <div class="stat-text-v2">Побед</div>
                        </div>
                        <div class="stat-card-v2 stat-card-lose-v2">
                            <div class="stat-number-v2 stat-number-lose-v2">${stats.losses || 0}</div>
                            <div class="stat-text-v2">Проигрышей</div>
                        </div>
                        <div class="stat-card-v2 stat-card-draw-v2">
                            <div class="stat-number-v2 stat-number-draw-v2">${stats.draws || 0}</div>
                            <div class="stat-text-v2">Ничьих</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Список игр
        // Сортируем игры по дате (новые сначала)
        const sortedGames = [...games].sort((a, b) => {
            const timeA = a.finished_at_timestamp || a.created_at_timestamp || 0;
            const timeB = b.finished_at_timestamp || b.created_at_timestamp || 0;
            return timeB - timeA;
        });
        
        const totalGames = sortedGames.length;
        const visibleGamesCount = 5; // Показываем первые 5 игр
        
        let gamesHtml = `
            <div class="history-games">
                <h3>🎮 История игр ${totalGames > visibleGamesCount ? `(${totalGames})` : ''}</h3>
                <div class="history-games-list">
        `;
        
        sortedGames.forEach((game, index) => {
            const status = game.status || 'in_progress';
            const date = game.finished_at || game.created_at || 'Неизвестно';
            
            let statusIcon = '';
            let statusText = '';
            let promoCode = '';
            
            switch (status) {
                case 'player_win':
                    statusIcon = '🎉';
                    statusText = 'Победа';
                    // Ищем промокод для этой игры
                    if (typeof game.promo_code !== 'undefined') {
                        promoCode = `<div class="game-promo-code"><span class="promo-label">💝 Промокод:</span><code>${game.promo_code}</code></div>`;
                    }
                    break;
                case 'bot_win':
                    statusIcon = '😔';
                    statusText = 'Проигрыш';
                    break;
                case 'draw':
                    statusIcon = '🤝';
                    statusText = 'Ничья';
                    break;
                default:
                    statusIcon = '⏳';
                    statusText = 'В процессе';
            }
            
            gamesHtml += `
                <div class="history-game-item">
                    <div class="game-header">
                        <span class="game-number">#${index + 1}</span>
                        <span class="game-status ${status}">
                            ${statusIcon} ${statusText}
                        </span>
                        <span class="game-date">${date}</span>
                    </div>
                    ${promoCode}
                </div>
            `;
        });
        
        gamesHtml += `
                </div>
            </div>
        `;
        
        historyContent.innerHTML = statsHtml + gamesHtml;
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
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }
            
            return responseData;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
}

// Инициализация менеджера истории
let historyManager;
document.addEventListener('DOMContentLoaded', () => {
    historyManager = new HistoryManager();
    // Делаем доступным глобально
    window.historyManager = historyManager;
});

