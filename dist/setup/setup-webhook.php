<?php
/**
 * Скрипт настройки webhook для Telegram бота
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config.php';

// Получаем токен из конфигурации
$bot_token = BOT_TOKEN;

if (empty($bot_token)) {
    die("<h1>❌ Ошибка</h1><p>BOT_TOKEN не установлен. Убедитесь, что переменная окружения BOT_TOKEN настроена на сервере.</p>");
}

$webhook_url = FULL_URL . '/webhook.php';

$api_url = "https://api.telegram.org/bot$bot_token";

echo "<h1>🔧 Настройка Telegram бота</h1>";
echo "<p><strong>Бот:</strong> " . TemplateConfig::BOT_FULL_NAME . "</p>";
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
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Старый webhook удален</p>";
} else {
    echo "<p style='color: orange;'>⚠️ Ошибка удаления webhook: " . htmlspecialchars($response) . "</p>";
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
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Webhook установлен: $webhook_url</p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка установки webhook: " . htmlspecialchars($response) . "</p>";
}

// 3. Устанавливаем команды бота
echo "<h2>3. Установка команд бота...</h2>";
$commands_data = [
    'commands' => [
        ['command' => 'start', 'description' => '🎮 Начать игру в крестики-нолики'],
        ['command' => 'help', 'description' => '💡 Получить помощь и справку']
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
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Команды бота установлены</p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка установки команд: " . htmlspecialchars($response) . "</p>";
}

// 4. Проверяем информацию о боте
echo "<h2>4. Информация о боте...</h2>";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/getMe");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    $bot_info = $result['result'];
    echo "<p style='color: green;'>✅ Бот активен</p>";
    echo "<p><strong>Имя бота:</strong> " . htmlspecialchars($bot_info['first_name']) . "</p>";
    echo "<p><strong>Username:</strong> @" . htmlspecialchars($bot_info['username']) . "</p>";
    echo "<p><strong>ID:</strong> " . $bot_info['id'] . "</p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка получения информации о боте</p>";
}

echo "<hr>";
echo "<h2>🎉 Настройка завершена!</h2>";
echo "<p>Теперь бот готов к работе. Отправьте /start боту для проверки.</p>";
?>

