<?php
/**
 * API endpoint для обработки игровых запросов
 */

// Включаем буферизацию вывода
ob_start();

// Устанавливаем заголовок JSON ДО любого вывода
header('Content-Type: application/json; charset=utf-8');

// Очищаем буфер
ob_clean();

// Включаем обработку ошибок
error_reporting(E_ALL);
ini_set('display_errors', 0); // Не показываем ошибки пользователю
ini_set('log_errors', 1);

// Определяем базовый путь
// На Vercel файлы из dist/ находятся на уровень выше
$base_path = dirname(__DIR__) . '/dist';

// Подключаем функции ПЕРВЫМИ (нужны для других классов)
require_once $base_path . '/includes/functions.php';

// Подключаем конфигурацию
require_once $base_path . '/config.php';

// Подключаем игровые классы
require_once $base_path . '/game/game-logic.php';
require_once $base_path . '/game/ai.php';
require_once $base_path . '/game/game-state.php';
require_once $base_path . '/bot/promo.php';
require_once $base_path . '/includes/GameStorage.php';

// Функция для безопасного логирования
function safeLog($level, $message, $context = []) {
    if (class_exists('Logger')) {
        try {
            if ($level === 'info' && method_exists('Logger', 'info')) {
                Logger::info($message, $context);
            } elseif ($level === 'error' && method_exists('Logger', 'error')) {
                Logger::error($message, $context);
            } elseif ($level === 'security' && method_exists('Logger', 'security')) {
                Logger::security($message, $context);
            }
        } catch (Exception $e) {
            // Игнорируем ошибки логирования
        }
    }
}

// Логируем начало обработки запроса
safeLog('info', 'Game API request started', [
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN'
]);

// Проверка метода запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Проверка rate limiting (более мягкий лимит для игровых запросов)
if (class_exists('Security') && function_exists('isFeatureEnabled') && isFeatureEnabled('rate_limiting')) {
    try {
        $ip = Security::getRealIP();
        // Используем более мягкий лимит для игровых действий (500 запросов в час)
        if (!Security::checkRateLimit($ip, 'game', 500, 3600)) {
            safeLog('security', "Rate limit exceeded for game API", ['ip' => $ip]);
            http_response_code(429);
            echo json_encode(['error' => 'Rate limit exceeded. Please wait a moment and try again.']);
            exit;
        }
    } catch (Exception $e) {
        // Игнорируем ошибки rate limiting, продолжаем выполнение
        safeLog('error', 'Rate limit check failed', ['error' => $e->getMessage()]);
    }
}

// Получаем данные запроса
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    $json_error = json_last_error_msg();
    safeLog('error', 'Invalid JSON in game API request', [
        'input_length' => strlen($input),
        'json_error' => $json_error,
        'input_preview' => substr($input, 0, 200)
    ]);
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON: ' . $json_error]);
    exit;
}

$action = $data['action'] ?? '';
$tg_id = $data['tg_id'] ?? '';

// Нормализуем tg_id (может быть строкой или числом из JSON)
if (!empty($tg_id)) {
    $tg_id = (string)$tg_id;
}

if (empty($tg_id)) {
    safeLog('error', 'Missing tg_id in game API request', ['data_keys' => array_keys($data)]);
    http_response_code(400);
    echo json_encode(['error' => 'Missing tg_id']);
    exit;
}

// Обработка действий
switch ($action) {
    case 'start':
        try {
            // Создание новой игры
            $game_data = GameState::createGame($tg_id);
            
            if (!$game_data || !isset($game_data['game_id'])) {
                safeLog('error', 'Failed to create game', ['tg_id' => $tg_id]);
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create game']);
                exit;
            }
            
            // Сохраняем в сессию (если используется)
            if (session_status() === PHP_SESSION_ACTIVE) {
                $_SESSION['game_id'] = $game_data['game_id'];
                $_SESSION['tg_id'] = $tg_id;
            }
            
            safeLog('info', 'Game started', [
                'game_id' => $game_data['game_id'],
                'tg_id' => $tg_id
            ]);
            
            echo json_encode([
                'success' => true,
                'game' => $game_data
            ]);
        } catch (Exception $e) {
            safeLog('error', 'Exception in start action', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
            exit;
        }
        break;
        
    case 'move':
        try {
            // Ход игрока
            $game_id = $data['game_id'] ?? '';
            $position = $data['position'] ?? null;
            
            safeLog('info', 'Game move request', [
                'tg_id' => $tg_id,
                'game_id' => $game_id,
                'position' => $position,
                'position_type' => gettype($position)
            ]);
            
            // Валидация входных данных
            if (empty($game_id)) {
                safeLog('error', 'Missing game_id', ['data' => $data]);
                http_response_code(400);
                echo json_encode(['error' => 'Missing game_id']);
                exit;
            }
            
            if ($position === null || $position === '') {
                safeLog('error', 'Missing or invalid position', [
                    'position' => $position,
                    'position_type' => gettype($position)
                ]);
                http_response_code(400);
                echo json_encode(['error' => 'Missing or invalid position']);
                exit;
            }
            
            // Преобразуем position в число
            $position = (int)$position;
            
            // Проверяем диапазон
            if ($position < 0 || $position > 8) {
                safeLog('error', 'Position out of range', ['position' => $position]);
                http_response_code(400);
                echo json_encode(['error' => 'Position out of range (0-8)']);
                exit;
            }
            
            // Загружаем игру из запроса
            $game_data = $data['game'] ?? null;
            
            if (!$game_data) {
                safeLog('error', 'Game data not provided', [
                    'game_id' => $game_id,
                    'data_keys' => array_keys($data)
                ]);
                http_response_code(400);
                echo json_encode(['error' => 'Game data not provided']);
                exit;
            }
            
            // Проверяем наличие board
            if (!isset($game_data['board'])) {
                safeLog('error', 'Board not found in game_data', [
                    'game_data_keys' => array_keys($game_data)
                ]);
                http_response_code(400);
                echo json_encode(['error' => 'Board not found in game data']);
                exit;
            }
            
            if (!is_array($game_data['board'])) {
                safeLog('error', 'Board is not an array', [
                    'board_type' => gettype($game_data['board'])
                ]);
                http_response_code(400);
                echo json_encode(['error' => 'Board must be an array']);
                exit;
            }
            
            // Проверяем размер доски
            if (count($game_data['board']) !== 9) {
                safeLog('error', 'Invalid board size', [
                    'board_size' => count($game_data['board']),
                    'board' => $game_data['board']
                ]);
                http_response_code(400);
                echo json_encode(['error' => 'Invalid board size']);
                exit;
            }
            
            $player_symbol = defined('PLAYER_SYMBOL') ? PLAYER_SYMBOL : 'X';
            
            // Валидация хода
            if (!GameLogic::validateMove($game_data['board'], $position)) {
                safeLog('error', 'Invalid move', [
                    'position' => $position,
                    'board' => $game_data['board'],
                    'board_at_position' => $game_data['board'][$position] ?? 'NOT_SET'
                ]);
                http_response_code(400);
                echo json_encode(['error' => 'Invalid move - cell already taken or out of range']);
                exit;
            }
            
            // Делаем ход игрока
            $game_data = GameState::makeMove($game_data, $position, $player_symbol);
            
            if (!$game_data) {
                safeLog('error', 'Failed to make move - GameState returned null', [
                    'position' => $position,
                    'symbol' => $player_symbol
                ]);
                http_response_code(400);
                echo json_encode(['error' => 'Failed to make move']);
                exit;
            }
            
            // Проверяем, что board обновлен
            if (!isset($game_data['board']) || !is_array($game_data['board'])) {
                safeLog('error', 'Board missing after move', ['game_data' => $game_data]);
                http_response_code(500);
                echo json_encode(['error' => 'Server error: board missing']);
                exit;
            }
            
            $result = GameState::getResult($game_data);
            $response = [
                'success' => true,
                'game' => $game_data,
                'result' => $result
            ];
            
            // Если игра не закончена, делаем ход бота
            if ($result === 'in_progress') {
                try {
                    $bot_symbol = defined('BOT_SYMBOL') ? BOT_SYMBOL : 'O';
                    $bot_position = GameAI::makeMove($game_data['board'], $bot_symbol, $player_symbol);
                    
                    if ($bot_position !== null) {
                        $game_data = GameState::makeMove($game_data, $bot_position, $bot_symbol);
                        
                        if ($game_data) {
                            $result = GameState::getResult($game_data);
                            
                            $response['game'] = $game_data;
                            $response['result'] = $result;
                            $response['bot_move'] = $bot_position;
                        }
                    }
                } catch (Exception $e) {
                    safeLog('error', 'Error in bot move', ['error' => $e->getMessage()]);
                    // Продолжаем выполнение даже если ход бота не удался
                }
            }
            
            // Если игра закончена, сохраняем и генерируем промокод при победе
            if ($result !== 'in_progress') {
                try {
                    // Убеждаемся, что tg_id есть в game_data
                    if (!isset($game_data['tg_id'])) {
                        $game_data['tg_id'] = $tg_id;
                    }
                    
                    // Нормализуем tg_id
                    $game_data['tg_id'] = (string)$game_data['tg_id'];
                    
                    safeLog('info', 'Game finished, preparing to save', [
                        'game_id' => $game_data['game_id'] ?? null,
                        'tg_id' => $game_data['tg_id'],
                        'result' => $result,
                        'has_tg_id' => isset($game_data['tg_id'])
                    ]);
                    
                    // Генерируем промокод ПЕРЕД сохранением, чтобы добавить его в game_data
                    if ($result === 'player_win') {
                        $promo_code = PromoCode::generate($tg_id, $game_data['game_id']);
                        $response['promo_code'] = $promo_code;
                        // Добавляем промокод в данные игры для истории
                        $game_data['promo_code'] = $promo_code;
                        
                        safeLog('info', 'Promo code generated and added to game_data', [
                            'game_id' => $game_data['game_id'],
                            'promo_code' => $promo_code
                        ]);
                    }
                    
                    // Сохраняем игру (с промокодом если есть)
                    $saved = GameStorage::saveGame($game_data);
                    if (!$saved) {
                        safeLog('error', 'Failed to save game to file', [
                            'game_id' => $game_data['game_id'] ?? null,
                            'tg_id' => $game_data['tg_id'] ?? null,
                            'result' => $result,
                            'game_data_keys' => array_keys($game_data)
                        ]);
                    } else {
                        safeLog('info', 'Game saved successfully to file', [
                            'game_id' => $game_data['game_id'] ?? null,
                            'tg_id' => $game_data['tg_id'] ?? null,
                            'result' => $result,
                            'has_promo' => isset($game_data['promo_code'])
                        ]);
                    }
                    
                    // Обновляем статистику
                    try {
                        GameStorage::updateStatistics($game_data);
                        safeLog('info', 'Statistics updated', ['tg_id' => $game_data['tg_id']]);
                    } catch (Exception $e) {
                        safeLog('error', 'Error updating statistics', [
                            'message' => $e->getMessage(),
                            'tg_id' => $game_data['tg_id']
                        ]);
                    }
                    
                    // Отправляем сообщение в бот при победе
                    if ($result === 'player_win' && isset($promo_code)) {
                        try {
                            require_once $base_path . '/bot/messages.php';
                            require_once $base_path . '/bot/bot-handler.php';
                            
                            $win_message = BotMessages::win($promo_code);
                            $chat_id = $tg_id; // В Telegram chat_id = user_id для личных сообщений
                            
                            if (function_exists('sendMessage')) {
                                $sent = sendMessage($chat_id, $win_message);
                                if ($sent) {
                                    safeLog('info', 'Win message sent to bot', [
                                        'tg_id' => $tg_id,
                                        'promo_code' => $promo_code
                                    ]);
                                } else {
                                    safeLog('error', 'Failed to send win message to bot', [
                                        'tg_id' => $tg_id
                                    ]);
                                }
                            }
                        } catch (Exception $e) {
                            // Логируем ошибку, но не прерываем выполнение
                            safeLog('error', 'Error sending win message', [
                                'message' => $e->getMessage(),
                                'tg_id' => $tg_id
                            ]);
                        }
                    }
                    
                    safeLog('info', 'Game finished and saved', [
                        'game_id' => $game_data['game_id'],
                        'tg_id' => $tg_id,
                        'result' => $result,
                        'has_promo' => isset($promo_code)
                    ]);
                } catch (Exception $e) {
                    // Логируем ошибку, но не прерываем выполнение
                    safeLog('error', 'Error saving game', [
                        'message' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                        'game_id' => $game_data['game_id'] ?? null
                    ]);
                }
            }
            
            safeLog('info', 'Move completed successfully', [
                'position' => $position,
                'result' => $result
            ]);
            
            echo json_encode($response);
            
        } catch (Exception $e) {
            safeLog('error', 'Exception in move action', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
            exit;
        } catch (Error $e) {
            // Обработка фатальных ошибок PHP
            safeLog('error', 'Fatal error in move action', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
            exit;
        }
        break;
        
    case 'history':
        // Получение истории игр пользователя
        try {
            // Нормализуем tg_id
            $tg_id_normalized = (string)$tg_id;
            
            safeLog('info', 'Loading history', [
                'tg_id' => $tg_id,
                'tg_id_normalized' => $tg_id_normalized
            ]);
            
            $games = GameStorage::loadGames($tg_id_normalized);
            $stats = GameStorage::getStatistics($tg_id_normalized);
            
            safeLog('info', 'Games loaded from storage', [
                'tg_id' => $tg_id_normalized,
                'games_count' => count($games),
                'games_sample' => count($games) > 0 ? [
                    'first_game' => [
                        'game_id' => $games[0]['game_id'] ?? null,
                        'tg_id' => $games[0]['tg_id'] ?? null,
                        'status' => $games[0]['status'] ?? null
                    ]
                ] : []
            ]);
            
            // Загружаем промокоды для победных игр (если не были добавлены при сохранении)
            $promo_codes = loadJsonFile('data/promo-codes.json', []);
            $promo_map = [];
            foreach ($promo_codes as $promo) {
                if (isset($promo['game_id']) && isset($promo['code'])) {
                    $promo_map[$promo['game_id']] = $promo['code'];
                }
            }
            
            safeLog('info', 'Promo codes loaded', [
                'promo_codes_count' => count($promo_codes),
                'promo_map_size' => count($promo_map)
            ]);
            
            // Добавляем промокоды к играм (если их еще нет)
            foreach ($games as &$game) {
                // Если промокод уже есть в game_data, не перезаписываем
                if (!isset($game['promo_code']) && isset($game['game_id']) && isset($promo_map[$game['game_id']])) {
                    $game['promo_code'] = $promo_map[$game['game_id']];
                }
            }
            unset($game); // Важно для foreach по ссылке
            
            // Фильтруем только завершенные игры для истории
            $finished_games = [];
            foreach ($games as $game) {
                $status = $game['status'] ?? 'in_progress';
                if ($status !== 'in_progress') {
                    $finished_games[] = $game;
                }
            }
            
            safeLog('info', 'History processed', [
                'tg_id' => $tg_id_normalized,
                'total_games' => count($games),
                'finished_games' => count($finished_games),
                'stats' => $stats
            ]);
            
            echo json_encode([
                'success' => true,
                'games' => $finished_games, // Только завершенные игры
                'stats' => $stats
            ]);
        } catch (Exception $e) {
            safeLog('error', 'Error loading history', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'tg_id' => $tg_id
            ]);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to load history: ' . $e->getMessage()]);
            exit;
        }
        break;
        
    default:
        safeLog('error', 'Unknown action', ['action' => $action]);
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action: ' . $action]);
        break;
}

ob_end_flush();
?>
