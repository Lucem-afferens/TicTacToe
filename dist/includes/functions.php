<?php
/**
 * Общие функции для проекта
 */

/**
 * Загрузка JSON файла
 */
function loadJsonFile($filename, $default = []) {
    $file_path = __DIR__ . '/../' . $filename;
    
    if (!file_exists($file_path)) {
        return $default;
    }
    
    $content = @file_get_contents($file_path);
    if ($content === false) {
        if (class_exists('Logger')) {
            Logger::error("Failed to read file", ['file' => $filename]);
        }
        return $default;
    }
    
    $data = @json_decode($content, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        if (class_exists('Logger')) {
            Logger::error("JSON decode error", [
                'file' => $filename,
                'error' => json_last_error_msg()
            ]);
        }
        return $default;
    }
    
    return $data ?: $default;
}

/**
 * Сохранение JSON файла
 */
function saveJsonFile($filename, $data) {
    $file_path = __DIR__ . '/../' . $filename;
    $dir = dirname($file_path);
    
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = file_put_contents($file_path, $json, LOCK_EX);
    
    if ($result === false) {
        if (class_exists('Logger')) {
            Logger::error("Failed to save file", ['file' => $filename]);
        }
        return false;
    }
    
    return true;
}

/**
 * Генерация уникального ID
 */
function generateId($prefix = '') {
    return $prefix . uniqid() . '_' . mt_rand(1000, 9999);
}

/**
 * Форматирование даты
 */
function formatDate($timestamp, $format = 'Y-m-d H:i:s') {
    return date($format, $timestamp);
}

/**
 * Проверка существования файла и создание если нужно
 */
function ensureFileExists($filename, $default_content = '[]') {
    $file_path = __DIR__ . '/../' . $filename;
    
    if (!file_exists($file_path)) {
        $dir = dirname($file_path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($file_path, $default_content);
    }
}

/**
 * Получение значения из массива с дефолтным значением
 */
function getArrayValue($array, $key, $default = null) {
    return isset($array[$key]) ? $array[$key] : $default;
}
?>

