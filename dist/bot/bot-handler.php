<?php
/**
 * Обработчик команд и функций Telegram бота
 */

/**
 * Отправка сообщения в Telegram
 */
function sendMessage($chat_id, $text, $reply_markup = null) {
    global $bot_token;
    
    if (!isset($bot_token)) {
        $bot_token = defined('BOT_TOKEN') ? BOT_TOKEN : '';
    }
    
    if (empty($bot_token)) {
        if (class_exists('Logger')) {
            Logger::error("BOT_TOKEN not defined");
        }
        return false;
    }
    
    $data = [
        'chat_id' => $chat_id,
        'text' => $text,
        'parse_mode' => 'HTML'
    ];
    
    if ($reply_markup) {
        $data['reply_markup'] = json_encode($reply_markup);
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.telegram.org/bot$bot_token/sendMessage");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($response !== false && $http_code === 200) {
        $result = json_decode($response, true);
        if ($result && $result['ok']) {
            if (class_exists('Logger')) {
                Logger::info("Message sent successfully", ['chat_id' => $chat_id]);
            }
            return true;
        } else {
            if (class_exists('Logger')) {
                Logger::error("Failed to send message", ['response' => $response]);
            }
            return false;
        }
    } else {
        if (class_exists('Logger')) {
            Logger::error("CURL error", [
                'http_code' => $http_code,
                'curl_error' => $curl_error
            ]);
        }
        return false;
    }
}

/**
 * Ответ на callback query
 */
function answerCallbackQuery($callback_query_id, $text = null, $show_alert = false) {
    global $bot_token;
    
    if (!isset($bot_token)) {
        $bot_token = defined('BOT_TOKEN') ? BOT_TOKEN : '';
    }
    
    if (empty($bot_token)) {
        return false;
    }
    
    $data = [
        'callback_query_id' => $callback_query_id,
        'show_alert' => $show_alert
    ];
    
    if ($text) {
        $data['text'] = $text;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.telegram.org/bot$bot_token/answerCallbackQuery");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    curl_exec($ch);
    curl_close($ch);
    
    return true;
}

/**
 * Создание клавиатуры с кнопкой WebApp
 */
function createWebAppKeyboard($webapp_url) {
    return [
        'inline_keyboard' => [
            [
                [
                    'text' => '🎮 Играть',
                    'web_app' => ['url' => $webapp_url]
                ]
            ]
        ]
    ];
}
?>

