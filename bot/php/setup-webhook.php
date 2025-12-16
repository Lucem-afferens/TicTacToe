<?php
/**
 * Скрипт настройки webhook для Telegram бота
 * Основан на подходе из prize-wheel
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

$bot_token = BOT_TOKEN;
$webhook_url = getenv('WEBHOOK_URL') ?: ($_ENV['WEBHOOK_URL'] ?? (WEB_APP_URL . 'bot/php/webhook.php'));
$webapp_url = WEB_APP_URL;

$api_url = "https://api.telegram.org/bot$bot_token";

echo "<h1>🔧 Настройка Telegram бота</h1>";
echo "<p><strong>Бот:</strong> @" . BOT_USERNAME . "</p>";
echo "<p><strong>Токен:</strong> " . substr($bot_token, 0, 10) . "...</p>";
echo "<hr>";

// 1. Удаляем старый webhook
echo "<h2>1. Удаление старого webhook...</h2>";
$delete_url = "$api_url/deleteWebhook";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $delete_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Старый webhook удален</p>";
} else {
    echo "<p style='color: orange;'>⚠️ Ошибка удаления webhook: " . htmlspecialchars($response) . "</p>";
    if ($curl_error) {
        echo "<p style='color: red;'>CURL ошибка: " . htmlspecialchars($curl_error) . "</p>";
    }
    echo "<p style='color: blue;'>HTTP код: $http_code</p>";
}

// 2. Устанавливаем новый webhook
echo "<h2>2. Установка нового webhook...</h2>";
$webhook_data = [
    'url' => $webhook_url,
    'allowed_updates' => ['message', 'callback_query']
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/setWebhook");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($webhook_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Webhook установлен: $webhook_url</p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка установки webhook: " . htmlspecialchars($response) . "</p>";
    if ($curl_error) {
        echo "<p style='color: red;'>CURL ошибка: " . htmlspecialchars($curl_error) . "</p>";
    }
    echo "<p style='color: blue;'>HTTP код: $http_code</p>";
}

// 3. Удаляем старую кнопку меню
echo "<h2>3. Удаление старой кнопки меню...</h2>";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/deleteBotCommands");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Старая кнопка меню удалена</p>";
} else {
    echo "<p style='color: orange;'>⚠️ Ошибка удаления кнопки меню: " . htmlspecialchars($response) . "</p>";
    if ($curl_error) {
        echo "<p style='color: red;'>CURL ошибка: " . htmlspecialchars($curl_error) . "</p>";
    }
    echo "<p style='color: blue;'>HTTP код: $http_code</p>";
}

// 4. Устанавливаем новую кнопку меню
echo "<h2>4. Установка новой кнопки меню...</h2>";
$menu_button_data = [
    'type' => 'web_app',
    'text' => '🎮 Играть',
    'web_app' => ['url' => $webapp_url]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/setChatMenuButton");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($menu_button_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Кнопка меню установлена: 🎮 Играть</p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка установки кнопки меню: " . htmlspecialchars($response) . "</p>";
    if ($curl_error) {
        echo "<p style='color: red;'>CURL ошибка: " . htmlspecialchars($curl_error) . "</p>";
    }
    echo "<p style='color: blue;'>HTTP код: $http_code</p>";
}

// 5. Устанавливаем команды бота
echo "<h2>5. Установка команд бота...</h2>";
$commands_data = [
    'commands' => [
        ['command' => 'start', 'description' => '🎮 Начать игру в крестики-нолики'],
        ['command' => 'help', 'description' => '💡 Получить помощь и справку'],
        ['command' => 'game', 'description' => '🎯 Быстрый старт игры']
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/setMyCommands");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($commands_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Команды бота установлены</p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка установки команд: " . htmlspecialchars($response) . "</p>";
    if ($curl_error) {
        echo "<p style='color: red;'>CURL ошибка: " . htmlspecialchars($curl_error) . "</p>";
    }
    echo "<p style='color: blue;'>HTTP код: $http_code</p>";
}

// 6. Проверяем информацию о боте
echo "<h2>6. Информация о боте...</h2>";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/getMe");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    $bot_info = $result['result'];
    echo "<p style='color: green;'>✅ Бот активен</p>";
    echo "<p><strong>Имя бота:</strong> " . htmlspecialchars($bot_info['first_name']) . "</p>";
    echo "<p><strong>Username:</strong> @" . htmlspecialchars($bot_info['username']) . "</p>";
    echo "<p><strong>ID:</strong> " . $bot_info['id'] . "</p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка получения информации о боте: " . htmlspecialchars($response) . "</p>";
    if ($curl_error) {
        echo "<p style='color: red;'>CURL ошибка: " . htmlspecialchars($curl_error) . "</p>";
    }
    echo "<p style='color: blue;'>HTTP код: $http_code</p>";
}

echo "<hr>";
echo "<h2>🎉 Настройка завершена!</h2>";
echo "<p>Ссылки для тестирования:</p>";
echo "<div style='margin: 20px 0;'>";
echo "<p><a href='https://t.me/" . BOT_USERNAME . "' style='color: #007cba; text-decoration: none; font-weight: bold;'>🤖 Открыть бота в Telegram</a></p>";
echo "<p><a href='$webapp_url' style='color: #007cba; text-decoration: none; font-weight: bold;'>🎮 Web App (Игра)</a></p>";
echo "</div>";

echo "<style>";
echo "body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }";
echo "h1, h2, h3 { color: #333; }";
echo "p { margin: 10px 0; }";
echo "a { color: #667eea; text-decoration: none; }";
echo "a:hover { text-decoration: underline; }";
echo "</style>";
?>

