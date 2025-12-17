<?php
/**
 * Главная страница игры в крестики-нолики
 * Telegram WebApp
 */

// Получаем Telegram ID из параметров
$tg_id = $_GET['tg_id'] ?? '';

// Если нет Telegram ID, показываем сообщение
if (empty($tg_id)) {
    echo '<!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Крестики-Нолики</title>
        <link rel="stylesheet" href="assets/css/variables.css">
        <link rel="stylesheet" href="assets/css/main.css">
    </head>
    <body>
        <div class="game-container">
            <h1>🎮 Крестики-Нолики</h1>
            <div class="message error">
                Для доступа к игре необходимо открыть приложение через Telegram-бота.
            </div>
        </div>
    </body>
    </html>';
    exit;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Крестики-Нолики</title>
    
    <!-- Telegram WebApp SDK -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    
    <!-- Styles -->
    <link rel="stylesheet" href="assets/css/variables.css">
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
    <div class="game-container">
        <h1>🎮 Крестики-Нолики</h1>
        
        <!-- Главное меню (показывается по умолчанию) -->
        <div id="main-menu" class="main-menu">
            <button id="play-btn" class="button button-primary">
                🎮 Играть
            </button>
            <button id="history-btn" class="button button-secondary">
                📊 История игр
            </button>
        </div>
        
        <!-- Игровое поле (скрыто по умолчанию) -->
        <div id="game-screen" class="game-screen hidden">
            <div id="game-board" class="game-board"></div>
            
            <!-- Сообщения -->
            <div id="message-container"></div>
            
            <!-- Промокод (скрыт по умолчанию) -->
            <div id="promo-container" class="promo-code hidden">
                <div class="promo-code-label">Твой промокод:</div>
                <div id="promo-code-value" class="promo-code-value"></div>
                <button id="copy-promo-btn" class="button button-secondary">📋 Копировать</button>
            </div>
            
            <!-- Экран результатов (скрыт по умолчанию) -->
            <div id="result-screen" class="result-screen hidden">
                <div id="result-icon" class="result-icon"></div>
                <h2 id="result-title" class="result-title"></h2>
                <p class="result-message">Сыграем ещё раз?</p>
                <button id="play-again-btn" class="button">🎮 Сыграть ещё раз</button>
                <button id="back-to-menu-btn" class="button button-secondary mt-md">🏠 В меню</button>
            </div>
        </div>
        
        <!-- Экран истории (скрыт по умолчанию) -->
        <div id="history-screen" class="history-screen hidden">
            <h2>📊 История игр</h2>
            <div id="history-content" class="history-content">
                <!-- Контент загружается динамически -->
            </div>
            <button id="back-to-menu-from-history-btn" class="button button-secondary mt-lg">🏠 В меню</button>
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="assets/js/telegram-api.js"></script>
    <script src="assets/js/promo.js"></script>
    <script src="assets/js/game.js"></script>
    <script src="assets/js/history.js"></script>
    <script src="assets/js/navigation.js"></script>
</body>
</html>
