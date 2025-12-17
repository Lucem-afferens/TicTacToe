<?php
/**
 * Генерация и управление промокодами
 */

require_once __DIR__ . '/../includes/functions.php';

class PromoCode {
    /**
     * Генерирует уникальный промокод
     * 
     * @param string $tg_id Telegram ID пользователя
     * @param string $game_id ID игры
     * @return string Промокод
     */
    public static function generate($tg_id, $game_id) {
        $promo_file = 'data/promo-codes.json';
        $used_codes = self::getUsedCodes();
        
        // Генерируем код до тех пор, пока не найдем уникальный
        do {
            $code = str_pad(
                mt_rand(
                    defined('PROMO_CODE_MIN') ? PROMO_CODE_MIN : 10000,
                    defined('PROMO_CODE_MAX') ? PROMO_CODE_MAX : 99999
                ),
                defined('PROMO_CODE_LENGTH') ? PROMO_CODE_LENGTH : 5,
                '0',
                STR_PAD_LEFT
            );
        } while (in_array($code, $used_codes));
        
        // Сохраняем промокод
        self::savePromoCode($code, $tg_id, $game_id);
        
        if (class_exists('Logger')) {
            Logger::userAction('Promo code generated', $tg_id, [
                'promo_code' => $code,
                'game_id' => $game_id
            ]);
        }
        
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
     */
    private static function savePromoCode($code, $tg_id, $game_id) {
        $promo_file = 'data/promo-codes.json';
        $promo_codes = loadJsonFile($promo_file, []);
        
        $promo_codes[] = [
            'code' => $code,
            'tg_id' => $tg_id,
            'game_id' => $game_id,
            'issued_at' => date('Y-m-d H:i:s'),
            'issued_at_timestamp' => time(),
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

