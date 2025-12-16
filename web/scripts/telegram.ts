/**
 * Интеграция с Telegram Web App SDK
 */

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        sendData: (data: string) => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

/**
 * Инициализация Telegram Web App SDK
 */
export function initTelegramWebApp(): void {
  if (!window.Telegram?.WebApp) {
    console.warn('Telegram Web App SDK not available');
    return;
  }

  const tg = window.Telegram.WebApp;

  // Готовность приложения
  tg.ready();

  // Развернуть на весь экран
  tg.expand();

  // eslint-disable-next-line no-console
  console.log('Telegram Web App initialized');
}

/**
 * Отправка данных в бот
 */
export function sendDataToBot(data: object): void {
  if (!window.Telegram?.WebApp) {
    console.error('Telegram Web App SDK not available');
    return;
  }

  try {
    const dataStr = JSON.stringify(data);
    window.Telegram.WebApp.sendData(dataStr);
    // eslint-disable-next-line no-console
    console.log('Data sent to bot:', data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending data to bot:', error);
  }
}

/**
 * Получение данных пользователя (если нужно)
 */
export function getUserData() {
  if (!window.Telegram?.WebApp?.initDataUnsafe) {
    return null;
  }

  return window.Telegram.WebApp.initDataUnsafe.user;
}

