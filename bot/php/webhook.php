<?php
/**
 * Telegram Bot Webhook - Обработчик для игры Крестики-Нолики
 * Основан на подходе из prize-wheel
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Подключаем необходимые файлы
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/promo.php';

// Настройки бота
$bot_token = BOT_TOKEN;
$api_url = API_URL;
$web_app_url = WEB_APP_URL;

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

/**
 * Функция отправки сообщения
 */
function sendMessage($chat_id, $text, $reply_markup = null) {
    global $bot_token;
    
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
            Logger::info("WEBHOOK: Message sent successfully", ['chat_id' => $chat_id]);
            return true;
        } else {
            Logger::error("WEBHOOK: Failed to send message", ['response' => $response]);
            return false;
        }
    } else {
        Logger::error("WEBHOOK: CURL error", ['http_code' => $http_code, 'curl_error' => $curl_error]);
        return false;
    }
}

/**
 * Функция ответа на callback query
 */
function answerCallbackQuery($callback_query_id, $text = null) {
    global $bot_token;
    
    $data = [
        'callback_query_id' => $callback_query_id
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
            $welcome_message = "Добро пожаловать 💕\n\n";
            $welcome_message .= "Готовы сыграть в крестики-нолики?\n\n";
            $welcome_message .= "🎮 <b>Правила игры:</b>\n";
            $welcome_message .= "• Вы играете крестиками (❌)\n";
            $welcome_message .= "• Бот играет ноликами (⭕)\n";
            $welcome_message .= "• Первый ход за вами\n";
            $welcome_message .= "• Выигрывает тот, кто соберёт 3 в ряд\n\n";
            $welcome_message .= "🎁 При победе вы получите промокод!\n\n";
            $welcome_message .= "Нажмите кнопку \"Играть\" чтобы начать!";
            
            $keyboard = [
                'inline_keyboard' => [
                    [
                        ['text' => '🎮 Играть', 'web_app' => ['url' => $web_app_url . "?tg_id=$chat_id"]]
                    ]
                ]
            ];
            
            sendMessage($chat_id, $welcome_message, $keyboard);
            break;
            
        case '/help':
            $help_message = "🎮 <b>Игра \"Крестики-Нолики\"</b>\n\n";
            $help_message .= "<b>Правила:</b>\n";
            $help_message .= "• Игровое поле 3x3\n";
            $help_message .= "• Вы играете крестиками (❌), бот - ноликами (⭕)\n";
            $help_message .= "• Первый ход за вами\n";
            $help_message .= "• Выигрывает тот, кто соберёт 3 символа в ряд (горизонталь, вертикаль или диагональ)\n\n";
            $help_message .= "<b>Награды:</b>\n";
            $help_message .= "🎁 При победе вы получите промокод на 5 цифр!\n\n";
            $help_message .= "<b>Команды:</b>\n";
            $help_message .= "/start - Начать игру\n";
            $help_message .= "/help - Показать эту справку\n";
            $help_message .= "/game - Быстрый старт игры\n\n";
            $help_message .= "Нажмите кнопку \"Играть\" чтобы начать!";
            
            $keyboard = [
                'inline_keyboard' => [
                    [
                        ['text' => '🎮 Играть', 'web_app' => ['url' => $web_app_url . "?tg_id=$chat_id"]]
                    ]
                ]
            ];
            
            sendMessage($chat_id, $help_message, $keyboard);
            break;
            
        case '/game':
            $game_message = "🎮 Игра началась! Удачи!";
            
            $keyboard = [
                'inline_keyboard' => [
                    [
                        ['text' => '🎮 Играть', 'web_app' => ['url' => $web_app_url . "?tg_id=$chat_id"]]
                    ]
                ]
            ];
            
            sendMessage($chat_id, $game_message, $keyboard);
            break;
            
        default:
            // Обработка Web App данных
            if (isset($message['web_app_data'])) {
                $web_app_data = $message['web_app_data']['data'] ?? '';
                
                if (!empty($web_app_data)) {
                    $data = json_decode($web_app_data, true);
                    
                    if ($data && isset($data['type'])) {
                        Logger::info("WEBHOOK: Processing Web App data", [
                            'chat_id' => $chat_id,
                            'type' => $data['type']
                        ]);
                        
                        switch ($data['type']) {
                            case 'win':
                                if (isset($data['promoCode'])) {
                                    $promo_code = $data['promoCode'];
                                    $win_message = "🎉 <b>Победа!</b>\n\n";
                                    $win_message .= "Твой промокод:\n";
                                    $win_message .= "<b>$promo_code</b>\n\n";
                                    $win_message .= "Поздравляем! Вы успешно обыграли бота и получили промокод на награду! 🎁\n\n";
                                    $win_message .= "Хотите сыграть ещё раз?";
                                    
                                    $keyboard = [
                                        'inline_keyboard' => [
                                            [
                                                ['text' => '🎮 Сыграть ещё', 'web_app' => ['url' => $web_app_url . "?tg_id=$chat_id"]]
                                            ]
                                        ]
                                    ];
                                    
                                    sendMessage($chat_id, $win_message, $keyboard);
                                } else {
                                    sendMessage($chat_id, "Произошла ошибка 😔\n\nПопробуйте позже или напишите /start для перезапуска.");
                                }
                                break;
                                
                            case 'lose':
                                $lose_message = "Вы проиграли битву, но не войну! 💫\n\n";
                                $lose_message .= "Не расстраивайтесь! Попробуйте ещё раз - удача обязательно улыбнётся! 🌟";
                                
                                $keyboard = [
                                    'inline_keyboard' => [
                                        [
                                            ['text' => '🔄 Попробовать ещё раз', 'web_app' => ['url' => $web_app_url . "?tg_id=$chat_id"]]
                                        ]
                                    ]
                                ];
                                
                                sendMessage($chat_id, $lose_message, $keyboard);
                                break;
                                
                            case 'draw':
                                $draw_message = "Ничья 💫\n\n";
                                $draw_message .= "Отличная игра! Вы показали достойный результат. Хотите попробовать ещё раз?";
                                
                                $keyboard = [
                                    'inline_keyboard' => [
                                        [
                                            ['text' => '🔄 Сыграть ещё раз', 'web_app' => ['url' => $web_app_url . "?tg_id=$chat_id"]]
                                        ]
                                    ]
                                ];
                                
                                sendMessage($chat_id, $draw_message, $keyboard);
                                break;
                                
                            default:
                                sendMessage($chat_id, "Произошла ошибка 😔\n\nПопробуйте позже или напишите /start для перезапуска.");
                        }
                    } else {
                        Logger::error("WEBHOOK: Invalid Web App data", ['data' => $web_app_data]);
                    }
                }
            } else {
                // Для остальных сообщений предлагаем начать игру
                $unknown_message = "Нажмите кнопку \"🎮 Играть\" чтобы начать!";
                
                $keyboard = [
                    'inline_keyboard' => [
                        [
                            ['text' => '🎮 Играть', 'web_app' => ['url' => $web_app_url . "?tg_id=$chat_id"]]
                        ]
                    ]
                ];
                
                sendMessage($chat_id, $unknown_message, $keyboard);
            }
            break;
    }
}

// Отвечаем OK
echo json_encode(['status' => 'ok']);
?>

