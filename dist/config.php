<?php
/**
 * Основная конфигурация системы
 * Подключает настройки из TemplateConfig и устанавливает константы
 */

// Подключаем настройки шаблона
require_once __DIR__ . '/template-config.php';

// Пытаемся загрузить локальный конфиг (создается при деплое из GitHub Secrets)
// Этот файл НЕ попадает в git и создается только на сервере
$local_config_file = __DIR__ . '/config.local.php';
if (file_exists($local_config_file)) {
    require_once $local_config_file;
}

// Основные настройки (используем настройки из шаблона)
// Приоритет: config.local.php > переменная окружения > fallback
$bot_token = null;
if (defined('LOCAL_BOT_TOKEN')) {
    $bot_token = LOCAL_BOT_TOKEN;
} elseif (!empty(getenv('BOT_TOKEN'))) {
    $bot_token = getenv('BOT_TOKEN');
} else {
    $bot_token = TemplateConfig::getBotToken();
}

define('BOT_TOKEN', $bot_token);
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: '');
define('DOMAIN', TemplateConfig::DOMAIN);
define('FULL_URL', TemplateConfig::FULL_URL);
define('PROJECT_NAME', TemplateConfig::PROJECT_NAME);

// Флаги для включения функций
define('ENABLE_RATE_LIMITING', TemplateConfig::ENABLE_RATE_LIMITING);
define('ENABLE_CACHING', TemplateConfig::ENABLE_CACHING);
define('ENABLE_ENHANCED_LOGGING', true);
define('ENABLE_CSRF_PROTECTION', false); // Для простоты пока отключено

// Настройки безопасности
define('RATE_LIMIT_GAME', TemplateConfig::RATE_LIMIT_GAME);
define('RATE_LIMIT_WEBHOOK', TemplateConfig::RATE_LIMIT_WEBHOOK);
define('SESSION_TIMEOUT', TemplateConfig::SESSION_TIMEOUT);

// Настройки логирования
define('LOG_LEVEL', TemplateConfig::LOG_LEVEL);
define('LOG_FILE', TemplateConfig::LOG_FILE);

// Настройки кэширования
define('CACHE_ENABLED', TemplateConfig::ENABLE_CACHING);
define('CACHE_TTL', TemplateConfig::CACHE_TTL);

// Настройки игры
define('BOARD_SIZE', TemplateConfig::BOARD_SIZE);
define('PLAYER_SYMBOL', TemplateConfig::PLAYER_SYMBOL);
define('BOT_SYMBOL', TemplateConfig::BOT_SYMBOL);

// Настройки промокодов
define('PROMO_CODE_LENGTH', TemplateConfig::PROMO_CODE_LENGTH);
define('PROMO_CODE_MIN', TemplateConfig::PROMO_CODE_MIN);
define('PROMO_CODE_MAX', TemplateConfig::PROMO_CODE_MAX);

// Функция для проверки включения функции
function isFeatureEnabled($feature) {
    $features = [
        'rate_limiting' => ENABLE_RATE_LIMITING,
        'caching' => ENABLE_CACHING,
        'enhanced_logging' => ENABLE_ENHANCED_LOGGING,
        'csrf_protection' => ENABLE_CSRF_PROTECTION,
    ];
    
    return $features[$feature] ?? false;
}

// Подключаем функции ПЕРВЫМИ (нужны для других классов)
require_once __DIR__ . '/includes/functions.php';

// Подключаем улучшенные классы (после определения функций)
require_once __DIR__ . '/includes/Logger.php';
require_once __DIR__ . '/includes/Security.php';

// Инициализация при загрузке
if (function_exists('Logger::info')) {
    Logger::info('System initialized', [
        'version' => '1.0.0',
        'features' => [
            'rate_limiting' => isFeatureEnabled('rate_limiting'),
            'caching' => isFeatureEnabled('caching'),
            'enhanced_logging' => isFeatureEnabled('enhanced_logging'),
            'csrf_protection' => isFeatureEnabled('csrf_protection'),
        ]
    ]);
}
?>

