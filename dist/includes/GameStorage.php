<?php
/**
 * Работа с JSON файлами для хранения игр и статистики
 */

require_once __DIR__ . '/functions.php';

class GameStorage {
    private static $games_file = 'data/games.json';
    private static $statistics_file = 'data/statistics.json';
    
    /**
     * Сохранение игры
     * 
     * @param array $game_data Данные игры
     * @return bool true если успешно
     */
    public static function saveGame($game_data) {
        $games = loadJsonFile(self::$games_file, []);
        $games[] = $game_data;
        return saveJsonFile(self::$games_file, $games);
    }
    
    /**
     * Загрузка игр пользователя
     * 
     * @param string $tg_id Telegram ID (опционально)
     * @return array Массив игр
     */
    public static function loadGames($tg_id = null) {
        $games = loadJsonFile(self::$games_file, []);
        
        if ($tg_id === null) {
            return $games;
        }
        
        // Фильтруем по tg_id
        $user_games = [];
        foreach ($games as $game) {
            if (isset($game['tg_id']) && $game['tg_id'] === $tg_id) {
                $user_games[] = $game;
            }
        }
        
        return $user_games;
    }
    
    /**
     * Получение статистики пользователя
     * 
     * @param string $tg_id Telegram ID
     * @return array Статистика
     */
    public static function getStatistics($tg_id) {
        $games = self::loadGames($tg_id);
        
        $stats = [
            'total_games' => count($games),
            'wins' => 0,
            'losses' => 0,
            'draws' => 0,
            'win_rate' => 0
        ];
        
        foreach ($games as $game) {
            $status = $game['status'] ?? 'in_progress';
            if ($status === 'player_win') {
                $stats['wins']++;
            } elseif ($status === 'bot_win') {
                $stats['losses']++;
            } elseif ($status === 'draw') {
                $stats['draws']++;
            }
        }
        
        if ($stats['total_games'] > 0) {
            $stats['win_rate'] = round(($stats['wins'] / $stats['total_games']) * 100, 2);
        }
        
        return $stats;
    }
    
    /**
     * Обновление общей статистики
     * 
     * @param array $game_data Данные завершенной игры
     */
    public static function updateStatistics($game_data) {
        $stats = loadJsonFile(self::$statistics_file, []);
        
        if (!isset($stats['total_games'])) {
            $stats['total_games'] = 0;
        }
        if (!isset($stats['total_wins'])) {
            $stats['total_wins'] = 0;
        }
        if (!isset($stats['total_losses'])) {
            $stats['total_losses'] = 0;
        }
        if (!isset($stats['total_draws'])) {
            $stats['total_draws'] = 0;
        }
        
        $stats['total_games']++;
        
        $status = $game_data['status'] ?? 'in_progress';
        if ($status === 'player_win') {
            $stats['total_wins']++;
        } elseif ($status === 'bot_win') {
            $stats['total_losses']++;
        } elseif ($status === 'draw') {
            $stats['total_draws']++;
        }
        
        $stats['last_updated'] = date('Y-m-d H:i:s');
        
        saveJsonFile(self::$statistics_file, $stats);
    }
}
?>

