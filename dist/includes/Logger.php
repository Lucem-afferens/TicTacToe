<?php
/**
 * Улучшенная система логирования
 * Основана на архитектуре prize-wheel
 */
class Logger {
    private static $log_file = 'logs/app.log';
    private static $max_file_size = 10 * 1024 * 1024; // 10MB
    private static $max_files = 5;
    
    /**
     * Логирование с различными уровнями
     */
    public static function log($level, $message, $context = []) {
        // Проверяем, определена ли функция isFeatureEnabled
        if (function_exists('isFeatureEnabled') && !isFeatureEnabled('enhanced_logging')) {
            error_log("[$level] $message");
            return;
        }
        
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => strtoupper($level),
            'message' => $message,
            'context' => $context,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
        ];
        
        // Добавляем информацию о пользователе если доступна
        if (session_status() === PHP_SESSION_ACTIVE) {
            if (isset($_SESSION['tg_id'])) {
                $log_entry['tg_id'] = $_SESSION['tg_id'];
            }
            if (isset($_SESSION['game_id'])) {
                $log_entry['game_id'] = $_SESSION['game_id'];
            }
        }
        
        $log_line = json_encode($log_entry, JSON_UNESCAPED_UNICODE) . "\n";
        
        // Создаем директорию если не существует
        $log_dir = dirname(__DIR__ . '/' . self::$log_file);
        if (!is_dir($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        $log_file_path = __DIR__ . '/../' . self::$log_file;
        
        // Проверяем размер файла и ротируем если нужно
        self::rotateLogIfNeeded($log_file_path);
        
        // Записываем лог
        file_put_contents($log_file_path, $log_line, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Логирование информационных сообщений
     */
    public static function info($message, $context = []) {
        self::log('INFO', $message, $context);
    }
    
    /**
     * Логирование предупреждений
     */
    public static function warning($message, $context = []) {
        self::log('WARNING', $message, $context);
    }
    
    /**
     * Логирование ошибок
     */
    public static function error($message, $context = []) {
        self::log('ERROR', $message, $context);
    }
    
    /**
     * Логирование отладочной информации
     */
    public static function debug($message, $context = []) {
        if (defined('LOG_LEVEL') && LOG_LEVEL === 'DEBUG') {
            self::log('DEBUG', $message, $context);
        }
    }
    
    /**
     * Логирование действий пользователей
     */
    public static function userAction($action, $user_id = null, $details = []) {
        $context = array_merge($details, ['action_type' => 'user_action']);
        if ($user_id) {
            $context['user_id'] = $user_id;
        }
        self::log('USER_ACTION', $action, $context);
    }
    
    /**
     * Логирование игровых событий
     */
    public static function gameEvent($event, $game_id = null, $details = []) {
        $context = array_merge($details, ['event_type' => 'game_event']);
        if ($game_id) {
            $context['game_id'] = $game_id;
        }
        self::log('GAME_EVENT', $event, $context);
    }
    
    /**
     * Логирование безопасности
     */
    public static function security($event, $details = []) {
        $context = array_merge($details, ['event_type' => 'security']);
        self::log('SECURITY', $event, $context);
    }
    
    /**
     * Ротация логов
     */
    private static function rotateLogIfNeeded($log_file_path) {
        if (!file_exists($log_file_path)) {
            return;
        }
        
        $file_size = filesize($log_file_path);
        if ($file_size < self::$max_file_size) {
            return;
        }
        
        // Ротируем файлы
        for ($i = self::$max_files - 1; $i >= 1; $i--) {
            $old_file = $log_file_path . ".$i";
            $new_file = $log_file_path . "." . ($i + 1);
            
            if (file_exists($old_file)) {
                if ($i === self::$max_files - 1) {
                    unlink($old_file); // Удаляем самый старый
                } else {
                    rename($old_file, $new_file);
                }
            }
        }
        
        // Переименовываем текущий файл
        rename($log_file_path, $log_file_path . '.1');
    }
}
?>

