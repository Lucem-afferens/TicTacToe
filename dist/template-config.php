<?php
/**
 * Универсальная конфигурация шаблона игры "Крестики-Нолики"
 * Этот файл содержит все настройки, которые можно изменить для адаптации под любой проект
 */

class TemplateConfig {
    
    // ========================================
    // ОСНОВНЫЕ НАСТРОЙКИ ПРОЕКТА
    // ========================================
    
    /**
     * Название проекта/бренда
     */
    const PROJECT_NAME = 'Крестики-Нолики';
    
    /**
     * Короткое название проекта
     */
    const PROJECT_SHORT_NAME = 'TicTacToe';
    
    /**
     * Описание проекта
     */
    const PROJECT_DESCRIPTION = 'Telegram Bot Game - Крестики-Нолики с промокодами';
    
    /**
     * Домен сайта (без https://)
     */
    const DOMAIN = 'develonik.ru';
    
    /**
     * Полный URL сайта
     */
    const FULL_URL = 'https://develonik.ru';
    
    // ========================================
    // НАСТРОЙКИ TELEGRAM БОТА
    // ========================================
    
    /**
     * Токен Telegram бота
     * Читается из переменной окружения BOT_TOKEN (безопасно для публичных репозиториев)
     */
    const BOT_TOKEN = null; // Будет переопределено из getenv()
    
    /**
     * Имя бота (без @)
     */
    const BOT_USERNAME = 'TicTacToe_ru_bot';
    
    /**
     * Полное имя бота с @
     */
    const BOT_FULL_NAME = '@TicTacToe_ru_bot';
    
    // ========================================
    // НАСТРОЙКИ ИГРЫ
    // ========================================
    
    /**
     * Размер игрового поля
     */
    const BOARD_SIZE = 3;
    
    /**
     * Символ игрока
     */
    const PLAYER_SYMBOL = 'X';
    
    /**
     * Символ бота
     */
    const BOT_SYMBOL = 'O';
    
    /**
     * Вероятности ходов AI (в процентах)
     */
    const AI_WIN_CHANCE = 10;      // Выигрышный ход
    const AI_BLOCK_CHANCE = 30;   // Блокировка игрока
    const AI_RANDOM_CHANCE = 60;   // Случайный ход
    
    // ========================================
    // НАСТРОЙКИ ПРОМОКОДОВ
    // ========================================
    
    /**
     * Длина промокода (цифры + латинские буквы)
     */
    const PROMO_CODE_LENGTH = 8;
    
    /**
     * Минимальное значение промокода (устарело, используется для совместимости)
     * @deprecated Используется новый формат с буквами и цифрами
     */
    const PROMO_CODE_MIN = 10000;
    
    /**
     * Максимальное значение промокода (устарело, используется для совместимости)
     * @deprecated Используется новый формат с буквами и цифрами
     */
    const PROMO_CODE_MAX = 99999;
    
    // ========================================
    // НАСТРОЙКИ БЕЗОПАСНОСТИ
    // ========================================
    
    /**
     * Включить rate limiting
     */
    const ENABLE_RATE_LIMITING = true;
    
    /**
     * Лимит запросов на игру в час
     */
    const RATE_LIMIT_GAME = 20;
    
    /**
     * Лимит запросов webhook в час
     */
    const RATE_LIMIT_WEBHOOK = 100;
    
    /**
     * Таймаут сессии в секундах (24 часа)
     */
    const SESSION_TIMEOUT = 86400;
    
    // ========================================
    // НАСТРОЙКИ ЛОГИРОВАНИЯ
    // ========================================
    
    /**
     * Уровень логирования
     */
    const LOG_LEVEL = 'INFO';
    
    /**
     * Файл логов
     */
    const LOG_FILE = 'logs/app.log';
    
    /**
     * Максимальный размер лог-файла (10MB)
     */
    const LOG_MAX_SIZE = 10 * 1024 * 1024;
    
    /**
     * Количество ротированных лог-файлов
     */
    const LOG_MAX_FILES = 5;
    
    // ========================================
    // НАСТРОЙКИ КЭШИРОВАНИЯ
    // ========================================
    
    /**
     * Включить кэширование
     */
    const ENABLE_CACHING = false;
    
    /**
     * Время жизни кэша в секундах
     */
    const CACHE_TTL = 300;
    
    // ========================================
    // МЕТОДЫ ДЛЯ ПОЛУЧЕНИЯ НАСТРОЕК
    // ========================================
    
    /**
     * Получить все настройки
     */
    public static function getAllSettings() {
        return [
            'project' => [
                'name' => self::PROJECT_NAME,
                'short_name' => self::PROJECT_SHORT_NAME,
                'description' => self::PROJECT_DESCRIPTION,
                'domain' => self::DOMAIN,
                'full_url' => self::FULL_URL,
            ],
            'bot' => [
                'token' => self::getBotToken(),
                'username' => self::BOT_USERNAME,
                'full_name' => self::BOT_FULL_NAME,
            ],
            'game' => [
                'board_size' => self::BOARD_SIZE,
                'player_symbol' => self::PLAYER_SYMBOL,
                'bot_symbol' => self::BOT_SYMBOL,
                'ai_win_chance' => self::AI_WIN_CHANCE,
                'ai_block_chance' => self::AI_BLOCK_CHANCE,
                'ai_random_chance' => self::AI_RANDOM_CHANCE,
            ],
            'promo' => [
                'code_length' => self::PROMO_CODE_LENGTH,
                'code_min' => self::PROMO_CODE_MIN,
                'code_max' => self::PROMO_CODE_MAX,
            ],
            'security' => [
                'rate_limiting' => self::ENABLE_RATE_LIMITING,
                'rate_limit_game' => self::RATE_LIMIT_GAME,
                'rate_limit_webhook' => self::RATE_LIMIT_WEBHOOK,
                'session_timeout' => self::SESSION_TIMEOUT,
            ],
            'logging' => [
                'level' => self::LOG_LEVEL,
                'file' => self::LOG_FILE,
                'max_size' => self::LOG_MAX_SIZE,
                'max_files' => self::LOG_MAX_FILES,
            ],
            'caching' => [
                'enabled' => self::ENABLE_CACHING,
                'ttl' => self::CACHE_TTL,
            ],
        ];
    }
    
    /**
     * Получить токен бота из переменной окружения
     */
    public static function getBotToken() {
        $token = getenv('BOT_TOKEN');
        if (empty($token)) {
            // Fallback для локальной разработки (не использовать в продакшн!)
            $token = defined('BOT_TOKEN') ? BOT_TOKEN : '';
        }
        return $token;
    }
    
    /**
     * Проверить корректность настроек
     */
    public static function validateSettings() {
        $errors = [];
        
        // Проверяем токен бота
        $bot_token = self::getBotToken();
        if (empty($bot_token)) {
            $errors[] = 'BOT_TOKEN не может быть пустым (установите переменную окружения BOT_TOKEN)';
        } elseif (!preg_match('/^\d+:[A-Za-z0-9_-]+$/', $bot_token)) {
            $errors[] = 'BOT_TOKEN имеет неверный формат';
        }
        
        if (empty(self::DOMAIN)) {
            $errors[] = 'DOMAIN не может быть пустым';
        }
        
        if (empty(self::PROJECT_NAME)) {
            $errors[] = 'PROJECT_NAME не может быть пустым';
        }
        
        // Проверяем формат домена
        if (!preg_match('/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', self::DOMAIN)) {
            $errors[] = 'DOMAIN имеет неверный формат';
        }
        
        return $errors;
    }
    
    /**
     * Получить информацию о версии шаблона
     */
    public static function getTemplateInfo() {
        return [
            'version' => '1.0.0',
            'name' => 'TicTacToe Telegram Bot Template',
            'description' => 'Шаблон игры крестики-нолики для Telegram WebApp',
            'created' => '2024-12-20',
            'updated' => date('Y-m-d'),
        ];
    }
}

// Автоматическая валидация при загрузке (отложенная)
if (class_exists('TemplateConfig') && method_exists('TemplateConfig', 'validateSettings')) {
    $validation_errors = TemplateConfig::validateSettings();
    if (!empty($validation_errors)) {
        error_log('TemplateConfig validation errors: ' . implode(', ', $validation_errors));
    }
}
?>

