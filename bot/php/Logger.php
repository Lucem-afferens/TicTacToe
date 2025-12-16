<?php
/**
 * Улучшенная система логирования
 */
class Logger {
    private static $log_file = __DIR__ . '/logs/app.log';
    private static $max_file_size = 10 * 1024 * 1024; // 10MB
    private static $max_files = 5;
    
    /**
     * Логирование с различными уровнями
     */
    public static function log($level, $message, $context = []) {
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => strtoupper($level),
            'message' => $message,
            'context' => $context,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
        ];
        
        $log_line = json_encode($log_entry, JSON_UNESCAPED_UNICODE) . "\n";
        
        // Создаем директорию если не существует
        $log_dir = dirname(self::$log_file);
        if (!is_dir($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        // Проверяем размер файла и ротируем если нужно
        if (file_exists(self::$log_file) && filesize(self::$log_file) > self::$max_file_size) {
            self::rotateLogs();
        }
        
        // Записываем в файл
        file_put_contents(self::$log_file, $log_line, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Ротация логов
     */
    private static function rotateLogs() {
        for ($i = self::$max_files - 1; $i >= 1; $i--) {
            $old_file = self::$log_file . ".$i";
            $new_file = self::$log_file . "." . ($i + 1);
            if (file_exists($old_file)) {
                rename($old_file, $new_file);
            }
        }
        if (file_exists(self::$log_file)) {
            rename(self::$log_file, self::$log_file . ".1");
        }
    }
    
    /**
     * Информационное сообщение
     */
    public static function info($message, $context = []) {
        self::log('info', $message, $context);
    }
    
    /**
     * Предупреждение
     */
    public static function warning($message, $context = []) {
        self::log('warning', $message, $context);
    }
    
    /**
     * Ошибка
     */
    public static function error($message, $context = []) {
        self::log('error', $message, $context);
    }
    
    /**
     * Отладочное сообщение
     */
    public static function debug($message, $context = []) {
        self::log('debug', $message, $context);
    }
}

