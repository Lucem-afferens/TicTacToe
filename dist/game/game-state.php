<?php
/**
 * Управление состоянием игры
 */

class GameState {
    /**
     * Создание новой игры
     * 
     * @param string $tg_id Telegram ID пользователя
     * @return array Данные игры
     */
    public static function createGame($tg_id) {
        require_once __DIR__ . '/game-logic.php';
        
        $game_id = uniqid('game_') . '_' . mt_rand(1000, 9999);
        $board = GameLogic::createEmptyBoard();
        
        $game_data = [
            'game_id' => $game_id,
            'tg_id' => $tg_id,
            'board' => $board,
            'current_player' => defined('PLAYER_SYMBOL') ? PLAYER_SYMBOL : 'X',
            'status' => 'in_progress',
            'created_at' => date('Y-m-d H:i:s'),
            'created_at_timestamp' => time(),
            'moves' => []
        ];
        
        return $game_data;
    }
    
    /**
     * Обновление состояния игры после хода
     * 
     * @param array $game_data Данные игры
     * @param int $position Позиция хода
     * @param string $symbol Символ игрока
     * @return array Обновленные данные игры
     */
    public static function makeMove($game_data, $position, $symbol) {
        require_once __DIR__ . '/game-logic.php';
        
        // Проверяем валидность хода
        if (!GameLogic::validateMove($game_data['board'], $position)) {
            return null;
        }
        
        // Делаем ход
        $game_data['board'][$position] = $symbol;
        $game_data['moves'][] = [
            'position' => $position,
            'symbol' => $symbol,
            'timestamp' => time()
        ];
        
        // Проверяем результат
        $player_symbol = defined('PLAYER_SYMBOL') ? PLAYER_SYMBOL : 'X';
        $bot_symbol = defined('BOT_SYMBOL') ? BOT_SYMBOL : 'O';
        
        if (GameLogic::checkWin($game_data['board'], $symbol)) {
            $game_data['status'] = $symbol === $player_symbol ? 'player_win' : 'bot_win';
            $game_data['finished_at'] = date('Y-m-d H:i:s');
            $game_data['finished_at_timestamp'] = time();
        } elseif (GameLogic::checkDraw($game_data['board'])) {
            $game_data['status'] = 'draw';
            $game_data['finished_at'] = date('Y-m-d H:i:s');
            $game_data['finished_at_timestamp'] = time();
        }
        
        return $game_data;
    }
    
    /**
     * Получение результата игры
     * 
     * @param array $game_data Данные игры
     * @return string Результат: 'player_win', 'bot_win', 'draw', 'in_progress'
     */
    public static function getResult($game_data) {
        return $game_data['status'] ?? 'in_progress';
    }
}
?>

