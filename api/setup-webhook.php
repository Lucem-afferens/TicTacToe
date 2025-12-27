<?php
/**
 * Скрипт настройки webhook для Telegram бота
 * Версия для Vercel - размещена в корне api/
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Определяем путь к корню проекта
$base_path = dirname(__DIR__) . '/dist';

// Подключаем конфигурацию
require_once $base_path . '/config.php';

// Получаем токен из конфигурации
$bot_token = BOT_TOKEN;

if (empty($bot_token)) {
    die("<h1>❌ Ошибка</h1><p>BOT_TOKEN не установлен. Убедитесь, что переменная окружения BOT_TOKEN настроена в Vercel Dashboard → Settings → Environment Variables.</p>");
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
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($webhook_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Webhook установлен: <code>" . htmlspecialchars($webhook_url) . "</code></p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка установки webhook: " . htmlspecialchars($response) . "</p>";
    exit;
}

// 3. Удаляем старые команды
echo "<h2>3. Удаление старых команд...</h2>";
$delete_commands_url = "$api_url/deleteMyCommands";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $delete_commands_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Старые команды удалены</p>";
} else {
    echo "<p style='color: orange;'>⚠️ Ошибка удаления команд (может не существовать): " . htmlspecialchars($response) . "</p>";
}

// 4. Устанавливаем новую кнопку меню (Web App)
echo "<h2>4. Установка кнопки меню (Web App)...</h2>";
$menu_button = [
    'menu_button' => [
        'type' => 'web_app',
        'text' => '🎮 Играть',
        'web_app' => [
            'url' => FULL_URL . '/web/game.php'
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/setChatMenuButton");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($menu_button));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Кнопка меню установлена</p>";
} else {
    echo "<p style='color: orange;'>⚠️ Ошибка установки кнопки меню: " . htmlspecialchars($response) . "</p>";
}

// 5. Устанавливаем команды бота
echo "<h2>5. Установка команд бота...</h2>";
require_once $base_path . '/bot/messages.php';

$commands = [
    ['command' => 'start', 'description' => 'Начать игру'],
    ['command' => 'help', 'description' => 'Помощь'],
    ['command' => 'rules', 'description' => 'Правила игры'],
    ['command' => 'status', 'description' => 'Статус игры']
];

$commands_data = [
    'commands' => $commands
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/setMyCommands");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($commands_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    echo "<p style='color: green;'>✅ Команды установлены</p>";
} else {
    echo "<p style='color: orange;'>⚠️ Ошибка установки команд: " . htmlspecialchars($response) . "</p>";
}

// 6. Получаем информацию о боте
echo "<h2>6. Информация о боте...</h2>";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$api_url/getMe");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['ok']) {
    $bot_info = $result['result'];
    echo "<p style='color: green;'>✅ Бот активен: <strong>@" . htmlspecialchars($bot_info['username']) . "</strong></p>";
    echo "<p>Имя: " . htmlspecialchars($bot_info['first_name']) . "</p>";
} else {
    echo "<p style='color: red;'>❌ Ошибка получения информации о боте</p>";
}

echo "<hr>";
echo "<h2>✅ Настройка завершена!</h2>";
echo "<p>Теперь вы можете использовать бота: <a href='https://t.me/" . TemplateConfig::BOT_USERNAME . "'>@" . TemplateConfig::BOT_USERNAME . "</a></p>";
?>

