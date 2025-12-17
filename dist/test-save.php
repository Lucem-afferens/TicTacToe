<?php
/**
 * Тестовый скрипт для проверки сохранения игр
 * УДАЛИТЕ ЭТОТ ФАЙЛ ПОСЛЕ ТЕСТИРОВАНИЯ!
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/GameStorage.php';

// Тестовые данные
$test_tg_id = '1847244710';
$test_game = [
    'game_id' => 'test_' . time(),
    'tg_id' => $test_tg_id,
    'board' => ['X', 'O', 'X', 'O', 'X', 'O', 'X', '', ''],
    'status' => 'player_win',
    'created_at' => date('Y-m-d H:i:s'),
    'created_at_timestamp' => time(),
    'finished_at' => date('Y-m-d H:i:s'),
    'finished_at_timestamp' => time(),
    'moves' => [],
    'promo_code' => '12345'
];

echo "<h1>Тест сохранения игры</h1>";

// Сохраняем
$saved = GameStorage::saveGame($test_game);
echo "<p>Сохранение: " . ($saved ? "✅ Успешно" : "❌ Ошибка") . "</p>";

// Загружаем
$games = GameStorage::loadGames($test_tg_id);
echo "<p>Загружено игр: " . count($games) . "</p>";

// Показываем последние 5 игр
echo "<h2>Последние игры:</h2>";
echo "<pre>";
foreach (array_slice($games, -5) as $game) {
    echo "Game ID: " . ($game['game_id'] ?? 'N/A') . "\n";
    echo "TG ID: " . ($game['tg_id'] ?? 'N/A') . " (type: " . gettype($game['tg_id'] ?? null) . ")\n";
    echo "Status: " . ($game['status'] ?? 'N/A') . "\n";
    echo "Promo: " . ($game['promo_code'] ?? 'N/A') . "\n";
    echo "---\n";
}
echo "</pre>";

// Проверяем файл
$games_file = __DIR__ . '/data/games.json';
echo "<p>Файл существует: " . (file_exists($games_file) ? "✅" : "❌") . "</p>";
echo "<p>Файл доступен для чтения: " . (is_readable($games_file) ? "✅" : "❌") . "</p>";
echo "<p>Файл доступен для записи: " . (is_writable($games_file) ? "✅" : "❌") . "</p>";

if (file_exists($games_file)) {
    $content = file_get_contents($games_file);
    $data = json_decode($content, true);
    echo "<p>Всего игр в файле: " . count($data) . "</p>";
}

?>

