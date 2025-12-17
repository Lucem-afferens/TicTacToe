/**
 * Отображение и управление промокодом
 */

class PromoCodeDisplay {
    /**
     * Отображение промокода на экране
     */
    static show(promoCode) {
        const promoContainer = document.getElementById('promo-container');
        if (!promoContainer) {
            return;
        }
        
        const promoValue = document.getElementById('promo-code-value');
        if (promoValue) {
            promoValue.textContent = promoCode;
        }
        
        promoContainer.classList.remove('hidden');
        
        // Анимация появления
        setTimeout(() => {
            promoContainer.style.opacity = '1';
            promoContainer.style.transform = 'scale(1)';
        }, 100);
    }
    
    /**
     * Скрытие промокода
     */
    static hide() {
        const promoContainer = document.getElementById('promo-container');
        if (!promoContainer) {
            return;
        }
        
        promoContainer.classList.add('hidden');
    }
    
    /**
     * Копирование промокода в буфер обмена
     */
    static async copyToClipboard(promoCode) {
        try {
            await navigator.clipboard.writeText(promoCode);
            
            // Показываем уведомление
            const notification = document.createElement('div');
            notification.className = 'message success';
            notification.textContent = 'Промокод скопирован!';
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.zIndex = '1000';
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
}

