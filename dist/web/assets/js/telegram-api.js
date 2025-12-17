/**
 * Интеграция с Telegram WebApp SDK
 */

class TelegramAPI {
    constructor() {
        this.tg = null;
        this.initialized = false;
    }
    
    /**
     * Инициализация Telegram WebApp SDK
     */
    init() {
        if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.ready();
            this.tg.expand();
            this.initialized = true;
            
            console.log('Telegram WebApp SDK initialized');
            return true;
        } else {
            console.warn('Telegram WebApp SDK not available');
            return false;
        }
    }
    
    /**
     * Отправка данных в бот
     */
    sendData(data) {
        if (!this.initialized || !this.tg) {
            console.warn('Telegram WebApp SDK not initialized');
            return false;
        }
        
        try {
            const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
            this.tg.sendData(jsonData);
            console.log('Data sent to bot:', data);
            return true;
        } catch (error) {
            console.error('Error sending data to bot:', error);
            return false;
        }
    }
    
    /**
     * Получение данных пользователя из Telegram
     */
    getUserData() {
        if (!this.initialized || !this.tg) {
            return null;
        }
        
        return this.tg.initDataUnsafe?.user || null;
    }
    
    /**
     * Получение Telegram ID пользователя
     */
    getUserId() {
        const user = this.getUserData();
        return user?.id || null;
    }
    
    /**
     * Показ главной кнопки
     */
    showMainButton(text, callback) {
        if (!this.initialized || !this.tg) {
            return;
        }
        
        this.tg.MainButton.setText(text);
        this.tg.MainButton.onClick(callback);
        this.tg.MainButton.show();
    }
    
    /**
     * Скрытие главной кнопки
     */
    hideMainButton() {
        if (!this.initialized || !this.tg) {
            return;
        }
        
        this.tg.MainButton.hide();
    }
    
    /**
     * Показ всплывающего окна
     */
    showAlert(message) {
        if (!this.initialized || !this.tg) {
            alert(message);
            return;
        }
        
        this.tg.showAlert(message);
    }
    
    /**
     * Показ подтверждения
     */
    showConfirm(message, callback) {
        if (!this.initialized || !this.tg) {
            if (confirm(message)) {
                callback(true);
            } else {
                callback(false);
            }
            return;
        }
        
        this.tg.showConfirm(message, callback);
    }
}

// Создаем глобальный экземпляр
const telegramAPI = new TelegramAPI();

