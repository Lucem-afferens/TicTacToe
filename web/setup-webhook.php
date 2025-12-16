<?php
/**
 * Автоматический запуск и настройка webhook через браузер
 * Доступен через Apache напрямую
 */

header('Content-Type: text/html; charset=utf-8');

// Путь к директории бота (относительно этого файла)
$botDir = __DIR__ . '/../bot';
$botDir = realpath($botDir) ?: dirname(__DIR__) . '/bot';

// Проверяем существование директории
if (!is_dir($botDir)) {
    http_response_code(500);
    die('Директория бота не найдена: ' . $botDir);
}

$steps = [];
$errors = [];

// Функция для выполнения команд
function execCommand($command, $cwd = null) {
    $descriptorspec = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];
    
    $process = proc_open($command, $descriptorspec, $pipes, $cwd);
    
    if (!is_resource($process)) {
        return ['success' => false, 'output' => 'Не удалось запустить процесс'];
    }
    
    fclose($pipes[0]);
    
    $output = stream_get_contents($pipes[1]);
    $error = stream_get_contents($pipes[2]);
    
    fclose($pipes[1]);
    fclose($pipes[2]);
    
    $returnCode = proc_close($process);
    
    return [
        'success' => $returnCode === 0,
        'output' => $output,
        'error' => $error,
        'code' => $returnCode
    ];
}

// Шаг 1: Проверка Node.js
$steps[] = '🔍 Проверка Node.js...';
$nodeCheck = execCommand('node --version');
if ($nodeCheck['success']) {
    $steps[] = '✅ Node.js найден: ' . trim($nodeCheck['output']);
} else {
    $errors[] = 'Node.js не найден! Установите Node.js 18+';
}

// Шаг 2: Проверка npm
$steps[] = '🔍 Проверка npm...';
$npmCheck = execCommand('npm --version');
if ($npmCheck['success']) {
    $steps[] = '✅ npm найден: ' . trim($npmCheck['output']);
} else {
    $errors[] = 'npm не найден!';
}

// Шаг 3: Проверка .env файла
$steps[] = '🔍 Проверка .env файла...';
$envFile = $botDir . '/.env';
if (file_exists($envFile)) {
    $steps[] = '✅ .env файл найден';
} else {
    $errors[] = '.env файл не найден в ' . $botDir;
}

// Шаг 4: Установка зависимостей (если нужно)
if (empty($errors)) {
    $steps[] = '📦 Проверка зависимостей...';
    $nodeModules = $botDir . '/node_modules';
    if (!is_dir($nodeModules)) {
        $steps[] = '📦 Установка зависимостей...';
        $install = execCommand('npm install --production', $botDir);
        if ($install['success']) {
            $steps[] = '✅ Зависимости установлены';
        } else {
            $errors[] = 'Ошибка установки зависимостей: ' . $install['error'];
        }
    } else {
        $steps[] = '✅ Зависимости уже установлены';
    }
}

// Шаг 5: Сборка проекта (если нужно)
if (empty($errors)) {
    $steps[] = '🔨 Проверка сборки...';
    $distBot = $botDir . '/dist/bot/index.js';
    if (!file_exists($distBot)) {
        $steps[] = '🔨 Сборка проекта...';
        $build = execCommand('npm run build:bot', $botDir);
        if ($build['success']) {
            $steps[] = '✅ Проект собран';
        } else {
            $errors[] = 'Ошибка сборки: ' . $build['error'];
        }
    } else {
        $steps[] = '✅ Проект уже собран';
    }
}

// Шаг 6: Запуск webhook сервера
if (empty($errors)) {
    $steps[] = '🚀 Проверка запуска сервера...';
    $port = 3001;
    
    // Проверяем запущен ли сервер
    $checkPort = execCommand("lsof -ti:$port || echo ''");
    $serverRunning = !empty(trim($checkPort['output']));
    
    if (!$serverRunning) {
        $steps[] = '🚀 Запуск webhook сервера...';
        
        // Пробуем через PM2
        $pm2Check = execCommand('which pm2');
        if ($pm2Check['success']) {
            // Останавливаем старый процесс если есть
            execCommand('pm2 stop tictactoe-webhook 2>/dev/null', $botDir);
            execCommand('pm2 delete tictactoe-webhook 2>/dev/null', $botDir);
            
            // Запускаем через PM2
            $start = execCommand(
                'USE_WEBHOOK=true pm2 start npm --name "tictactoe-webhook" -- run start:webhook',
                $botDir
            );
            
            if ($start['success']) {
                execCommand('pm2 save', $botDir);
                $steps[] = '✅ Сервер запущен через PM2';
            } else {
                $errors[] = 'Ошибка запуска через PM2: ' . $start['error'];
            }
        } else {
            // Запускаем напрямую в фоне
            $start = execCommand(
                "cd " . escapeshellarg($botDir) . " && USE_WEBHOOK=true nohup npm run start:webhook > webhook.log 2>&1 &",
                null
            );
            
            if ($start['success'] || empty($start['error'])) {
                $steps[] = '✅ Сервер запущен';
                sleep(2); // Ждём запуска
            } else {
                $errors[] = 'Ошибка запуска: ' . $start['error'];
            }
        }
    } else {
        $steps[] = '✅ Сервер уже запущен';
    }
}

// Шаг 7: Настройка webhook (через curl к локальному серверу)
if (empty($errors)) {
    $steps[] = '🔗 Настройка webhook...';
    
    // Ждём немного чтобы сервер точно запустился
    sleep(1);
    
    // Делаем запрос к локальному серверу для настройки webhook
    $webhookUrl = 'http://localhost:3001/setup-webhook-only';
    $ch = curl_init($webhookUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $steps[] = '✅ Webhook настроен';
    } else {
        $steps[] = '⚠️ Webhook: сервер ещё запускается, попробуйте обновить страницу через несколько секунд';
    }
}

// Генерируем HTML страницу
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo empty($errors) ? 'Всё настроено ✅' : 'Ошибка настройки ❌'; ?></title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 700px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: <?php echo empty($errors) ? '#667eea' : '#f5576c'; ?>;
            margin-bottom: 20px;
            font-size: 2.5em;
            text-align: center;
        }
        .emoji {
            font-size: 4em;
            text-align: center;
            margin-bottom: 20px;
        }
        .steps {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            max-height: 400px;
            overflow-y: auto;
        }
        .step {
            margin: 10px 0;
            padding: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            border-left: 3px solid #667eea;
            padding-left: 15px;
        }
        .error {
            background: #fee2e2;
            color: #991b1b;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        .button {
            display: inline-block;
            margin-top: 20px;
            padding: 15px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            transition: transform 0.2s;
            text-align: center;
            width: 100%;
            border: none;
            cursor: pointer;
            font-size: 1em;
        }
        .button:hover {
            transform: scale(1.05);
        }
        .info {
            margin-top: 20px;
            padding: 15px;
            background: #dbeafe;
            border-radius: 10px;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji"><?php echo empty($errors) ? '✅' : '❌'; ?></div>
        <h1><?php echo empty($errors) ? 'Всё настроено автоматически!' : 'Ошибка настройки'; ?></h1>
        
        <div class="steps">
            <?php foreach ($steps as $step): ?>
                <div class="step"><?php echo htmlspecialchars($step); ?></div>
            <?php endforeach; ?>
        </div>

        <?php if (!empty($errors)): ?>
            <div class="error">
                <strong>Ошибки:</strong><br>
                <?php foreach ($errors as $error): ?>
                    • <?php echo htmlspecialchars($error); ?><br>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="info">
                <strong>🎉 Готово!</strong><br>
                Все команды выполнены автоматически. Бот готов к работе!<br>
                Откройте бота в Telegram и отправьте /start
            </div>
        <?php endif; ?>

        <button class="button" onclick="location.reload()">
            🔄 Обновить статус
        </button>
    </div>
</body>
</html>

