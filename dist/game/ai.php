<?php
/**
 * AI логика для бота-соперника
 * Основана на стратегии: 60% случайность, 30% блокировка, 10% выигрыш
 */

require_once __DIR__ . '/game-logic.php';

class GameAI {
    private static $win_chance = 70;    // 80% - выигрышный ход
    private static $block_chance = 10;   // 10% - блокировка игрока
    private static $random_chance = 20;  // 20% - случайный ход
    
    /**
     * Вычисляет ход бота на основе текущего состояния игры
     * 
     * @param array $board Текущее состояние игрового поля
     * @param string $bot_symbol Символ бота ('O')
     * @param string $player_symbol Символ игрока ('X')
     * @return int|null Позиция хода или null если нет доступных ходов
     */
    public static function makeMove($board, $bot_symbol = null, $player_symbol = null) {
        if ($bot_symbol === null) {
            $bot_symbol = defined('BOT_SYMBOL') ? BOT_SYMBOL : 'O';
        }
        if ($player_symbol === null) {
            $player_symbol = defined('PLAYER_SYMBOL') ? PLAYER_SYMBOL : 'X';
        }
        
        $available_moves = GameLogic::getAvailableMoves($board);
        
        if (empty($available_moves)) {
            return null;
        }
        
        // Если только один ход доступен
        if (count($available_moves) === 1) {
            return $available_moves[0];
        }
        
        // Генерируем случайное число от 1 до 100
        $random = mt_rand(1, 100);
        
        if ($random <= self::$win_chance) {
            // 10% - выигрышный ход
            $winning_move = self::findWinningMove($board, $bot_symbol);
            if ($winning_move !== null) {
                return $winning_move;
            }
        }
        
        if ($random <= self::$win_chance + self::$block_chance) {
            // 30% - блокировка игрока
            $blocking_move = self::findBlockingMove($board, $player_symbol, $bot_symbol);
            if ($blocking_move !== null) {
                return $blocking_move;
            }
        }
        
        // 60% - случайный ход (или fallback если не нашли выигрышный/блокирующий)
        return self::findRandomMove($available_moves);
    }
    
    /**
     * Поиск выигрышного хода
     * 
     * @param array $board Игровое поле
     * @param string $symbol Символ бота
     * @return int|null Позиция выигрышного хода или null
     */
    private static function findWinningMove($board, $symbol) {
        $available_moves = GameLogic::getAvailableMoves($board);
        
        foreach ($available_moves as $position) {
            $test_board = $board;
            $test_board[$position] = $symbol;
            
            if (GameLogic::checkWin($test_board, $symbol)) {
                return $position;
            }
        }
        
        return null;
    }
    
    /**
     * Поиск блокирующего хода (блокировка победы игрока)
     * 
     * @param array $board Игровое поле
     * @param string $player_symbol Символ игрока
     * @param string $bot_symbol Символ бота
     * @return int|null Позиция блокирующего хода или null
     */
    private static function findBlockingMove($board, $player_symbol, $bot_symbol) {
        $available_moves = GameLogic::getAvailableMoves($board);
        
        foreach ($available_moves as $position) {
            $test_board = $board;
            $test_board[$position] = $player_symbol;
            
            // Если игрок может выиграть на этой позиции, блокируем
            if (GameLogic::checkWin($test_board, $player_symbol)) {
                return $position;
            }
        }
        
        return null;
    }
    
    /**
     * Случайный ход из доступных
     * 
     * @param array $available_moves Массив доступных позиций
     * @return int Случайная позиция
     */
    private static function findRandomMove($available_moves) {
        if (empty($available_moves)) {
            return null;
        }
        
        $random_index = array_rand($available_moves);
        return $available_moves[$random_index];
    }
}
?>

