<?php
/**
 * Telegram Bot Webhook - Обработчик обновлений от Telegram
 * Основан на архитектуре prize-wheel
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Подключаем необходимые файлы
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/bot/messages.php';
require_once __DIR__ . '/bot/bot-handler.php';

// Настройки бота
$bot_token = BOT_TOKEN;
$api_url = "https://api.telegram.org/bot$bot_token";

// Устанавливаем заголовки
header('Content-Type: application/json');

// Получаем данные
$input = file_get_contents('php://input');
$update = json_decode($input, true);

// Логируем входящие данные
Logger::info("WEBHOOK: Received update", ['input' => $input]);

// Проверяем JSON
if (!$update) {
    Logger::error("WEBHOOK: Invalid JSON", ['input' => $input]);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Проверка rate limiting
if (class_exists('Security')) {
    $ip = Security::getRealIP();
    if (!Security::checkRateLimit($ip, 'webhook')) {
        Logger::security("Rate limit exceeded for webhook", ['ip' => $ip]);
        echo json_encode(['error' => 'Rate limit exceeded']);
        exit;
    }
}

// Обрабатываем сообщения
if (isset($update['message'])) {
    $message = $update['message'];
    $chat_id = $message['chat']['id'];
    $text = $message['text'] ?? '';
    $first_name = $message['from']['first_name'] ?? '';
    $username = $message['from']['username'] ?? '';
    
    Logger::info("WEBHOOK: Processing message", [
        'chat_id' => $chat_id,
        'text' => $text,
        'first_name' => $first_name,
        'username' => $username
    ]);
    
    // Обрабатываем команды
    switch ($text) {
        case '/start':
            $welcome_message = BotMessages::WELCOME;
            
            // Создаем URL для WebApp
            $webapp_url = FULL_URL . "/web/game.php?tg_id=" . $chat_id;
            
            $keyboard = createWebAppKeyboard($webapp_url);
            
            sendMessage($chat_id, $welcome_message, $keyboard);
            break;
            
        case '/help':
            sendMessage($chat_id, BotMessages::HELP);
            break;
            
        default:
            // Обработка данных из WebApp (через sendData)
            if (isset($message['web_app_data'])) {
                $webapp_data = json_decode($message['web_app_data']['data'], true);
                
                if ($webapp_data && isset($webapp_data['action'])) {
                    switch ($webapp_data['action']) {
                        case 'win':
                            if (isset($webapp_data['promo_code'])) {
                                $promo_code = $webapp_data['promo_code'];
                                sendMessage($chat_id, BotMessages::win($promo_code));
                                Logger::userAction('Game won (via WebApp sendData)', $chat_id, [
                                    'promo_code' => $promo_code,
                                    'game_id' => $webapp_data['game_id'] ?? null
                                ]);
                            }
                            break;
                            
                        case 'lose':
                            sendMessage($chat_id, BotMessages::LOSE);
                            Logger::userAction('Game lost (via WebApp sendData)', $chat_id);
                            break;
                            
                        case 'draw':
                            sendMessage($chat_id, BotMessages::DRAW);
                            Logger::userAction('Game draw (via WebApp sendData)', $chat_id);
                            break;
                    }
                }
            } else {
                // Неизвестная команда
                $unknown_message = "🤔 Неизвестная команда: $text\n\n";
                $unknown_message .= "Используйте /start для начала игры или /help для справки.";
                sendMessage($chat_id, $unknown_message);
            }
            break;
    }
}

// Обрабатываем callback queries
if (isset($update['callback_query'])) {
    $callback_query = $update['callback_query'];
    $chat_id = $callback_query['message']['chat']['id'];
    $callback_data = $callback_query['data'] ?? '';
    $callback_query_id = $callback_query['id'];
    
    Logger::info("WEBHOOK: Processing callback", [
        'chat_id' => $chat_id,
        'callback_data' => $callback_data
    ]);
    
    // Отвечаем на callback query
    answerCallbackQuery($callback_query_id);
    
    // Обработка callback данных (если понадобится)
    switch ($callback_data) {
        default:
            // Пока нет callback обработчиков
            break;
    }
}

// Отвечаем OK
echo json_encode(['status' => 'ok']);
?>

