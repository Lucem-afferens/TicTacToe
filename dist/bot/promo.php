<?php
/**
 * Генерация и управление промокодами
 */

require_once __DIR__ . '/../includes/functions.php';

class PromoCode {
    /**
     * Алфавит для генерации промокодов (латинские буквы + цифры)
     */
    private static $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    /**
     * Генерирует уникальный промокод на основе времени с микросекундами
     * 
     * @param string $tg_id Telegram ID пользователя
     * @param string $game_id ID игры
     * @return string Промокод
     */
    public static function generate($tg_id, $game_id) {
        $promo_file = 'data/promo-codes.json';
        $used_codes = self::getUsedCodes();
        
        // Получаем время с микросекундами для уникальности
        $microtime = microtime(true);
        $timestamp_with_microseconds = $microtime;
        
        // Генерируем код до тех пор, пока не найдем уникальный
        $max_attempts = 100; // Защита от бесконечного цикла
        $attempts = 0;
        
        do {
            $code = self::generateCodeFromTime($timestamp_with_microseconds);
            $attempts++;
            
            // Если слишком много попыток, добавляем случайность
            if ($attempts > 10) {
                $timestamp_with_microseconds = microtime(true) + mt_rand(0, 999999) / 1000000;
            }
        } while (in_array($code, $used_codes) && $attempts < $max_attempts);
        
        // Если все равно не уникален, добавляем случайный суффикс
        if (in_array($code, $used_codes)) {
            $code = self::generateUniqueCode($used_codes);
        }
        
        // Сохраняем промокод с временем в микросекундах
        self::savePromoCode($code, $tg_id, $game_id, $timestamp_with_microseconds);
        
        if (class_exists('Logger')) {
            Logger::userAction('Promo code generated', $tg_id, [
                'promo_code' => $code,
                'game_id' => $game_id,
                'timestamp_microseconds' => $timestamp_with_microseconds
            ]);
        }
        
        return $code;
    }
    
    /**
     * Генерирует промокод на основе времени с микросекундами
     * 
     * @param float $microtime Время с микросекундами
     * @return string Промокод
     */
    private static function generateCodeFromTime($microtime) {
        $code_length = defined('PROMO_CODE_LENGTH') ? PROMO_CODE_LENGTH : 8;
        $alphabet_length = strlen(self::$alphabet);
        
        // Преобразуем время в строку с микросекундами (формат: 1234567890.123456)
        // Убираем точку и берем последние цифры для уникальности
        $time_str = str_replace('.', '', sprintf('%.6f', $microtime));
        
        // Берем последние цифры времени (микросекунды + часть секунд)
        // Это гарантирует уникальность даже при одновременных запросах
        $time_part = substr($time_str, -8); // Последние 8 цифр (включая микросекунды)
        
        // Преобразуем в base36 (цифры 0-9 и буквы a-z)
        // Используем только часть времени, чтобы поместиться в промокод
        $time_base36 = '';
        $time_int = (int)substr($time_part, -6); // Последние 6 цифр как число
        
        // Преобразуем в base36 вручную для надежности
        $base = 36;
        $num = $time_int;
        do {
            $time_base36 = self::$alphabet[$num % $base] . $time_base36;
            $num = intval($num / $base);
        } while ($num > 0);
        
        $time_base36 = strtoupper($time_base36);
        
        // Дополняем случайными символами до нужной длины
        $random_part = '';
        $needed_length = $code_length - strlen($time_base36);
        
        if ($needed_length > 0) {
            for ($i = 0; $i < $needed_length; $i++) {
                $random_part .= self::$alphabet[mt_rand(0, $alphabet_length - 1)];
            }
        }
        
        // Комбинируем: часть времени + случайные символы
        $code = strtoupper($time_base36 . $random_part);
        
        // Обрезаем до нужной длины (на случай если получилось длиннее)
        $code = substr($code, 0, $code_length);
        
        // Если короче нужной длины, дополняем случайными символами
        while (strlen($code) < $code_length) {
            $code .= self::$alphabet[mt_rand(0, $alphabet_length - 1)];
        }
        
        return strtoupper($code);
    }
    
    /**
     * Генерирует полностью случайный уникальный промокод
     * 
     * @param array $used_codes Массив уже использованных кодов
     * @return string Уникальный промокод
     */
    private static function generateUniqueCode($used_codes) {
        $code_length = defined('PROMO_CODE_LENGTH') ? PROMO_CODE_LENGTH : 8;
        $alphabet_length = strlen(self::$alphabet);
        $max_attempts = 1000;
        $attempts = 0;
        
        do {
            $code = '';
            for ($i = 0; $i < $code_length; $i++) {
                $code .= self::$alphabet[mt_rand(0, $alphabet_length - 1)];
            }
            $code = strtoupper($code);
            $attempts++;
        } while (in_array($code, $used_codes) && $attempts < $max_attempts);
        
        return $code;
    }
    
    /**
     * Получение списка использованных промокодов
     * 
     * @return array Массив промокодов
     */
    private static function getUsedCodes() {
        $promo_file = 'data/promo-codes.json';
        $promo_codes = loadJsonFile($promo_file, []);
        
        $used_codes = [];
        foreach ($promo_codes as $promo) {
            if (isset($promo['code'])) {
                $used_codes[] = $promo['code'];
            }
        }
        
        return $used_codes;
    }
    
    /**
     * Сохранение промокода
     * 
     * @param string $code Промокод
     * @param string $tg_id Telegram ID
     * @param string $game_id ID игры
     * @param float $microtime Время с микросекундами
     */
    private static function savePromoCode($code, $tg_id, $game_id, $microtime = null) {
        $promo_file = 'data/promo-codes.json';
        $promo_codes = loadJsonFile($promo_file, []);
        
        // Если время не передано, получаем текущее
        if ($microtime === null) {
            $microtime = microtime(true);
        }
        
        // Форматируем время с микросекундами для читаемости
        $datetime = date('Y-m-d H:i:s', (int)$microtime);
        $microseconds = sprintf('%.6f', $microtime - (int)$microtime);
        $datetime_full = $datetime . substr($microseconds, 1); // Добавляем .123456
        
        $promo_codes[] = [
            'code' => $code,
            'tg_id' => $tg_id,
            'game_id' => $game_id,
            'issued_at' => $datetime,
            'issued_at_full' => $datetime_full,
            'issued_at_timestamp' => (int)$microtime,
            'issued_at_microseconds' => $microtime,
            'used' => false
        ];
        
        saveJsonFile($promo_file, $promo_codes);
    }
    
    /**
     * Проверка существования промокода
     * 
     * @param string $code Промокод для проверки
     * @return bool true если промокод существует
     */
    public static function exists($code) {
        $used_codes = self::getUsedCodes();
        return in_array($code, $used_codes);
    }
}
?>

