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
        // Валидация входных данных
        if (!is_array($game_data)) {
            if (class_exists('Logger')) {
                Logger::error('Invalid game_data in saveGame', ['type' => gettype($game_data)]);
            }
            return false;
        }
        
        if (!isset($game_data['game_id'])) {
            if (class_exists('Logger')) {
                Logger::error('Missing game_id in saveGame', ['game_data_keys' => array_keys($game_data)]);
            }
            return false;
        }
        
        if (!isset($game_data['tg_id'])) {
            if (class_exists('Logger')) {
                Logger::error('Missing tg_id in saveGame', ['game_id' => $game_data['game_id']]);
            }
            return false;
        }
        
        // Нормализуем tg_id (сохраняем как строку для консистентности)
        $game_data['tg_id'] = (string)$game_data['tg_id'];
        
        $games = loadJsonFile(self::$games_file, []);
        
        // Логируем перед сохранением
        if (class_exists('Logger')) {
            Logger::info('Saving game', [
                'game_id' => $game_data['game_id'],
                'tg_id' => $game_data['tg_id'],
                'status' => $game_data['status'] ?? 'unknown',
                'current_games_count' => count($games)
            ]);
        }
        
        // Проверяем, не существует ли уже игра с таким ID
        $existing_index = null;
        foreach ($games as $index => $game) {
            if (isset($game['game_id']) && isset($game_data['game_id']) && 
                $game['game_id'] === $game_data['game_id']) {
                $existing_index = $index;
                break;
            }
        }
        
        if ($existing_index !== null) {
            // Обновляем существующую игру (объединяем данные)
            $games[$existing_index] = array_merge($games[$existing_index], $game_data);
            if (class_exists('Logger')) {
                Logger::info('Updating existing game', [
                    'game_id' => $game_data['game_id'],
                    'index' => $existing_index
                ]);
            }
        } else {
            // Добавляем новую игру
            $games[] = $game_data;
            if (class_exists('Logger')) {
                Logger::info('Adding new game', [
                    'game_id' => $game_data['game_id'],
                    'new_total' => count($games)
                ]);
            }
        }
        
        $saved = saveJsonFile(self::$games_file, $games);
        
        if ($saved) {
            if (class_exists('Logger')) {
                Logger::info('Game saved successfully', [
                    'game_id' => $game_data['game_id'],
                    'tg_id' => $game_data['tg_id'],
                    'status' => $game_data['status'] ?? 'unknown',
                    'total_games' => count($games)
                ]);
            }
        } else {
            if (class_exists('Logger')) {
                Logger::error('Failed to save game', [
                    'game_id' => $game_data['game_id'] ?? null,
                    'tg_id' => $game_data['tg_id'] ?? null,
                    'file' => self::$games_file,
                    'file_exists' => file_exists(__DIR__ . '/../' . self::$games_file),
                    'dir_writable' => is_writable(dirname(__DIR__ . '/../' . self::$games_file))
                ]);
            }
        }
        
        return $saved;
    }
    
    /**
     * Загрузка игр пользователя
     * 
     * @param string $tg_id Telegram ID (опционально)
     * @return array Массив игр
     */
    public static function loadGames($tg_id = null) {
        $games = loadJsonFile(self::$games_file, []);
        
        // Логируем загрузку
        if (class_exists('Logger')) {
            Logger::info('Loading games', [
                'tg_id' => $tg_id,
                'total_games' => count($games),
                'file' => self::$games_file
            ]);
        }
        
        if ($tg_id === null) {
            return $games;
        }
        
        // Нормализуем tg_id (может быть строкой или числом)
        $tg_id_normalized = (string)$tg_id;
        
        // Фильтруем по tg_id (сравниваем как строки для надежности)
        $user_games = [];
        foreach ($games as $game) {
            if (isset($game['tg_id'])) {
                $game_tg_id = (string)$game['tg_id'];
                if ($game_tg_id === $tg_id_normalized) {
                    $user_games[] = $game;
                }
            }
        }
        
        // Логируем результат фильтрации
        if (class_exists('Logger')) {
            Logger::info('Games filtered by tg_id', [
                'tg_id' => $tg_id,
                'filtered_count' => count($user_games),
                'total_count' => count($games)
            ]);
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

