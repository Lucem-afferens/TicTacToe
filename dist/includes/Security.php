<?php
/**
 * Улучшенная система безопасности
 * Основана на архитектуре prize-wheel
 */
class Security {
    private static $rate_limit_file = 'cache/rate_limits.json';
    
    /**
     * Проверка rate limiting
     */
    public static function checkRateLimit($ip, $action, $limit = null, $window = 3600) {
        if (!function_exists('isFeatureEnabled') || !isFeatureEnabled('rate_limiting')) {
            return true;
        }
        
        $default_limits = [
            'game' => defined('RATE_LIMIT_GAME') ? RATE_LIMIT_GAME : 20,
            'webhook' => defined('RATE_LIMIT_WEBHOOK') ? RATE_LIMIT_WEBHOOK : 100,
            'api' => 50
        ];
        
        $limit = $limit ?: ($default_limits[$action] ?? 100);
        
        $rate_limits = self::loadRateLimits();
        $key = "{$ip}_{$action}";
        $current_time = time();
        
        if (!isset($rate_limits[$key])) {
            $rate_limits[$key] = [
                'count' => 1,
                'first_request' => $current_time,
                'last_request' => $current_time
            ];
        } else {
            $rate_data = $rate_limits[$key];
            
            // Проверяем, не истек ли период
            if ($current_time - $rate_data['first_request'] > $window) {
                $rate_limits[$key] = [
                    'count' => 1,
                    'first_request' => $current_time,
                    'last_request' => $current_time
                ];
            } else {
                $rate_limits[$key]['count']++;
                $rate_limits[$key]['last_request'] = $current_time;
            }
        }
        
        self::saveRateLimits($rate_limits);
        
        $current_count = $rate_limits[$key]['count'];
        
        if ($current_count > $limit) {
            if (class_exists('Logger')) {
                Logger::security("Rate limit exceeded", [
                    'ip' => $ip,
                    'action' => $action,
                    'limit' => $limit,
                    'current' => $current_count,
                    'window' => $window
                ]);
            }
            
            return false;
        }
        
        return true;
    }
    
    /**
     * Валидация входных данных
     */
    public static function validateInput($data, $rules) {
        $errors = [];
        
        foreach ($rules as $field => $rule) {
            if (!isset($data[$field])) {
                if (strpos($rule, 'required') !== false) {
                    $errors[$field] = "Поле обязательно для заполнения";
                }
                continue;
            }
            
            $value = $data[$field];
            
            if (strpos($rule, 'required') !== false && empty($value)) {
                $errors[$field] = "Поле обязательно для заполнения";
                continue;
            }
            
            if (strpos($rule, 'numeric') !== false && !is_numeric($value)) {
                $errors[$field] = "Только цифры";
            }
            
            if (strpos($rule, 'integer') !== false && !is_numeric($value) || (int)$value != $value) {
                $errors[$field] = "Только целое число";
            }
            
            if (preg_match('/min:(\d+)/', $rule, $matches)) {
                $min = (int)$matches[1];
                if (is_numeric($value) && (int)$value < $min) {
                    $errors[$field] = "Минимальное значение: $min";
                } elseif (strlen($value) < $min) {
                    $errors[$field] = "Минимальная длина: $min символов";
                }
            }
            
            if (preg_match('/max:(\d+)/', $rule, $matches)) {
                $max = (int)$matches[1];
                if (is_numeric($value) && (int)$value > $max) {
                    $errors[$field] = "Максимальное значение: $max";
                } elseif (strlen($value) > $max) {
                    $errors[$field] = "Максимальная длина: $max символов";
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Валидация позиции на игровом поле
     */
    public static function validateBoardPosition($position, $board_size = 3) {
        if (!is_numeric($position)) {
            return false;
        }
        
        $pos = (int)$position;
        return $pos >= 0 && $pos < ($board_size * $board_size);
    }
    
    /**
     * Генерация уникального токена
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }
    
    /**
     * Получение реального IP адреса
     */
    public static function getRealIP() {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
    
    /**
     * Санитизация строки
     */
    public static function sanitizeString($string) {
        return htmlspecialchars(strip_tags(trim($string)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Загрузка rate limits
     */
    private static function loadRateLimits() {
        $file_path = __DIR__ . '/../' . self::$rate_limit_file;
        
        if (!file_exists($file_path)) {
            return [];
        }
        
        $data = @file_get_contents($file_path);
        if ($data === false) {
            return [];
        }
        
        $limits = @json_decode($data, true);
        return $limits ?: [];
    }
    
    /**
     * Сохранение rate limits
     */
    private static function saveRateLimits($limits) {
        $file_path = __DIR__ . '/../' . self::$rate_limit_file;
        $dir = dirname($file_path);
        
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // Очищаем старые записи (старше 24 часов)
        $current_time = time();
        foreach ($limits as $key => $data) {
            if ($current_time - $data['first_request'] > 86400) {
                unset($limits[$key]);
            }
        }
        
        file_put_contents($file_path, json_encode($limits, JSON_PRETTY_PRINT), LOCK_EX);
    }
}
?>

