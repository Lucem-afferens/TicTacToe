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
    
    // Создаем директорию если не существует
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            if (class_exists('Logger')) {
                Logger::error("Failed to create directory", ['dir' => $dir]);
            }
            return false;
        }
    }
    
    // Проверяем права на запись
    if (!is_writable($dir)) {
        if (class_exists('Logger')) {
            Logger::error("Directory is not writable", ['dir' => $dir]);
        }
        return false;
    }
    
    // Кодируем в JSON
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    if ($json === false) {
        if (class_exists('Logger')) {
            Logger::error("JSON encode failed", [
                'file' => $filename,
                'error' => json_last_error_msg()
            ]);
        }
        return false;
    }
    
    // Сохраняем во временный файл, затем переименовываем (атомарная операция)
    $temp_file = $file_path . '.tmp';
    $result = file_put_contents($temp_file, $json, LOCK_EX);
    
    if ($result === false) {
        if (class_exists('Logger')) {
            Logger::error("Failed to write temp file", [
                'file' => $filename,
                'temp_file' => $temp_file
            ]);
        }
        return false;
    }
    
    // Атомарное переименование
    if (!rename($temp_file, $file_path)) {
        if (class_exists('Logger')) {
            Logger::error("Failed to rename temp file", [
                'file' => $filename,
                'temp_file' => $temp_file
            ]);
        }
        @unlink($temp_file); // Удаляем временный файл
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

