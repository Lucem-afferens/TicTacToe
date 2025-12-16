<?php
/**
 * Конфигурация Telegram бота
 */

// Загружаем переменные окружения из .env если доступно
if (file_exists(__DIR__ . '/../../.env')) {
    $env_file = file_get_contents(__DIR__ . '/../../.env');
    $lines = explode("\n", $env_file);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Основные настройки бота
define('BOT_TOKEN', getenv('BOT_TOKEN') ?: ($_ENV['BOT_TOKEN'] ?? ''));
define('BOT_USERNAME', getenv('BOT_USERNAME') ?: ($_ENV['BOT_USERNAME'] ?? 'TicTacToe_ru_bot'));
define('WEB_APP_URL', getenv('WEB_APP_URL') ?: ($_ENV['WEB_APP_URL'] ?? 'https://develonik.ru/'));

// Проверка обязательных настроек
if (empty(BOT_TOKEN)) {
    error_log('ERROR: BOT_TOKEN не установлен! Проверьте .env файл или переменные окружения.');
}

// API URL для Telegram
define('API_URL', 'https://api.telegram.org/bot' . BOT_TOKEN);

