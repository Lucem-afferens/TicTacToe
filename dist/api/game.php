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

// Определяем базовый путь
$base_path = dirname(__DIR__);

require_once $base_path . '/config.php';
require_once $base_path . '/game/game-logic.php';
require_once $base_path . '/game/ai.php';
require_once $base_path . '/game/game-state.php';
require_once $base_path . '/bot/promo.php';
require_once $base_path . '/includes/GameStorage.php';

// Логируем начало обработки запроса
Logger::info('Game API request started', [
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN'
]);

// Проверка метода запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Проверка rate limiting
if (class_exists('Security')) {
    $ip = Security::getRealIP();
    if (!Security::checkRateLimit($ip, 'game')) {
        Logger::security("Rate limit exceeded for game API", ['ip' => $ip]);
        http_response_code(429);
        echo json_encode(['error' => 'Rate limit exceeded']);
        exit;
    }
}

// Получаем данные запроса
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    Logger::error('Invalid JSON in game API request', ['input' => $input]);
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$action = $data['action'] ?? '';
$tg_id = $data['tg_id'] ?? '';

if (empty($tg_id)) {
    Logger::error('Missing tg_id in game API request');
    http_response_code(400);
    echo json_encode(['error' => 'Missing tg_id']);
    exit;
}

// Обработка действий
switch ($action) {
    case 'start':
        // Создание новой игры
        $game_data = GameState::createGame($tg_id);
        
        // Сохраняем в сессию (если используется)
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION['game_id'] = $game_data['game_id'];
            $_SESSION['tg_id'] = $tg_id;
        }
        
        Logger::gameEvent('Game started', $game_data['game_id'], ['tg_id' => $tg_id]);
        
        echo json_encode([
            'success' => true,
            'game' => $game_data
        ]);
        break;
        
    case 'move':
        // Ход игрока
        $game_id = $data['game_id'] ?? '';
        $position = $data['position'] ?? null;
        
        Logger::info('Game move request', [
            'tg_id' => $tg_id,
            'game_id' => $game_id,
            'position' => $position,
            'position_type' => gettype($position)
        ]);
        
        if (empty($game_id) || $position === null) {
            Logger::error('Missing game_id or position', [
                'game_id' => $game_id,
                'position' => $position
            ]);
            http_response_code(400);
            echo json_encode(['error' => 'Missing game_id or position']);
            exit;
        }
        
        // Преобразуем position в число
        $position = (int)$position;
        
        // Загружаем игру из запроса
        $game_data = $data['game'] ?? null;
        
        if (!$game_data) {
            Logger::error('Game data not provided', ['game_id' => $game_id]);
            http_response_code(400);
            echo json_encode(['error' => 'Game data not provided']);
            exit;
        }
        
        // Проверяем наличие board
        if (!isset($game_data['board']) || !is_array($game_data['board'])) {
            Logger::error('Invalid game board', ['game_data' => $game_data]);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid game board']);
            exit;
        }
        
        $player_symbol = defined('PLAYER_SYMBOL') ? PLAYER_SYMBOL : 'X';
        
        // Валидация хода
        if (!GameLogic::validateMove($game_data['board'], $position)) {
            Logger::error('Invalid move', [
                'position' => $position,
                'board' => $game_data['board']
            ]);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid move - cell already taken or out of range']);
            exit;
        }
        
        // Делаем ход игрока
        try {
            $game_data = GameState::makeMove($game_data, $position, $player_symbol);
            
            if (!$game_data) {
                Logger::error('Failed to make move', [
                    'position' => $position,
                    'game_data' => $game_data
                ]);
                http_response_code(400);
                echo json_encode(['error' => 'Failed to make move']);
                exit;
            }
        } catch (Exception $e) {
            Logger::error('Exception during move', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
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
            $bot_symbol = defined('BOT_SYMBOL') ? BOT_SYMBOL : 'O';
            $bot_position = GameAI::makeMove($game_data['board'], $bot_symbol, $player_symbol);
            
            if ($bot_position !== null) {
                $game_data = GameState::makeMove($game_data, $bot_position, $bot_symbol);
                $result = GameState::getResult($game_data);
                
                $response['game'] = $game_data;
                $response['result'] = $result;
                $response['bot_move'] = $bot_position;
            }
        }
        
        // Если игра закончена, сохраняем и генерируем промокод при победе
        if ($result !== 'in_progress') {
            GameStorage::saveGame($game_data);
            GameStorage::updateStatistics($game_data);
            
            if ($result === 'player_win') {
                $promo_code = PromoCode::generate($tg_id, $game_data['game_id']);
                $response['promo_code'] = $promo_code;
            }
            
            Logger::gameEvent('Game finished', $game_data['game_id'], [
                'tg_id' => $tg_id,
                'result' => $result,
                'promo_code' => $response['promo_code'] ?? null
            ]);
        }
        
        echo json_encode($response);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
        break;
}

ob_end_flush();
?>

