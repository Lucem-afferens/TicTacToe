<?php
/**
 * Основная логика игры в крестики-нолики
 */

class GameLogic {
    /**
     * Проверка победы на игровом поле
     * 
     * @param array $board Игровое поле (массив из 9 элементов)
     * @param string $symbol Символ для проверки ('X' или 'O')
     * @return bool true если есть победа
     */
    public static function checkWin($board, $symbol) {
        $board_size = defined('BOARD_SIZE') ? BOARD_SIZE : 3;
        $size = $board_size;
        
        // Проверка строк
        for ($i = 0; $i < $size; $i++) {
            $win = true;
            for ($j = 0; $j < $size; $j++) {
                $index = $i * $size + $j;
                if ($board[$index] !== $symbol) {
                    $win = false;
                    break;
                }
            }
            if ($win) {
                return true;
            }
        }
        
        // Проверка столбцов
        for ($j = 0; $j < $size; $j++) {
            $win = true;
            for ($i = 0; $i < $size; $i++) {
                $index = $i * $size + $j;
                if ($board[$index] !== $symbol) {
                    $win = false;
                    break;
                }
            }
            if ($win) {
                return true;
            }
        }
        
        // Проверка главной диагонали
        $win = true;
        for ($i = 0; $i < $size; $i++) {
            $index = $i * $size + $i;
            if ($board[$index] !== $symbol) {
                $win = false;
                break;
            }
        }
        if ($win) {
            return true;
        }
        
        // Проверка побочной диагонали
        $win = true;
        for ($i = 0; $i < $size; $i++) {
            $index = $i * $size + ($size - 1 - $i);
            if ($board[$index] !== $symbol) {
                $win = false;
                break;
            }
        }
        if ($win) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Проверка ничьей
     * 
     * @param array $board Игровое поле
     * @return bool true если ничья
     */
    public static function checkDraw($board) {
        // Ничья если все ячейки заполнены и нет победителя
        foreach ($board as $cell) {
            if (empty($cell)) {
                return false;
            }
        }
        
        $player_symbol = defined('PLAYER_SYMBOL') ? PLAYER_SYMBOL : 'X';
        $bot_symbol = defined('BOT_SYMBOL') ? BOT_SYMBOL : 'O';
        
        // Проверяем, что нет победителя
        return !self::checkWin($board, $player_symbol) && 
               !self::checkWin($board, $bot_symbol);
    }
    
    /**
     * Валидация хода
     * 
     * @param array $board Текущее состояние поля
     * @param int $position Позиция хода (0-8)
     * @return bool true если ход валиден
     */
    public static function validateMove($board, $position) {
        $board_size = defined('BOARD_SIZE') ? BOARD_SIZE : 3;
        $max_position = $board_size * $board_size - 1;
        
        // Проверка диапазона
        if (!is_numeric($position) || $position < 0 || $position > $max_position) {
            return false;
        }
        
        $pos = (int)$position;
        
        // Проверка, что ячейка свободна
        return isset($board[$pos]) && empty($board[$pos]);
    }
    
    /**
     * Создание пустого игрового поля
     * 
     * @return array Пустое поле
     */
    public static function createEmptyBoard() {
        $board_size = defined('BOARD_SIZE') ? BOARD_SIZE : 3;
        $total_cells = $board_size * $board_size;
        return array_fill(0, $total_cells, '');
    }
    
    /**
     * Подсчет доступных ходов
     * 
     * @param array $board Игровое поле
     * @return array Массив доступных позиций
     */
    public static function getAvailableMoves($board) {
        $available = [];
        foreach ($board as $index => $cell) {
            if (empty($cell)) {
                $available[] = $index;
            }
        }
        return $available;
    }
}
?>

