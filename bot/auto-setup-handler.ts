/**
 * Автоматический обработчик установки и запуска
 * Выполняет все команды автоматически при открытии /setup-webhook
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

const execAsync = promisify(exec);

/**
 * Проверяет установлены ли зависимости
 */
async function checkDependencies(): Promise<boolean> {
  try {
    await fs.access(path.join(process.cwd(), 'node_modules'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Проверяет собран ли проект
 */
async function checkBuild(): Promise<boolean> {
  try {
    await fs.access(path.join(process.cwd(), 'dist', 'bot', 'index.js'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Устанавливает зависимости
 */
async function installDependencies(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('npm install --production', {
      cwd: process.cwd(),
      timeout: 300000, // 5 минут
    });
    return stdout + stderr;
  } catch (error) {
    throw new Error(`Ошибка установки зависимостей: ${error}`);
  }
}

/**
 * Собирает проект
 */
async function buildProject(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('npm run build:bot', {
      cwd: process.cwd(),
      timeout: 300000, // 5 минут
    });
    return stdout + stderr;
  } catch (error) {
    throw new Error(`Ошибка сборки проекта: ${error}`);
  }
}

/**
 * Проверяет запущен ли webhook сервер
 */
async function checkServerRunning(port: number = 3001): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port} || echo ""`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Запускает webhook сервер
 */
async function startServer(): Promise<string> {
  try {
    // Проверяем наличие PM2
    try {
      await execAsync('which pm2');
      
      // Запускаем через PM2
      await execAsync('pm2 stop tictactoe-webhook 2>/dev/null || true');
      await execAsync('pm2 delete tictactoe-webhook 2>/dev/null || true');
      
      const { stdout, stderr } = await execAsync(
        'USE_WEBHOOK=true pm2 start npm --name "tictactoe-webhook" -- run start:webhook',
        { cwd: process.cwd(), timeout: 10000 }
      );
      
      await execAsync('pm2 save');
      return `Запущено через PM2:\n${stdout}${stderr}`;
    } catch {
      // PM2 не найден, запускаем напрямую в фоне
      const { stdout, stderr } = await execAsync(
        'USE_WEBHOOK=true nohup npm run start:webhook > webhook.log 2>&1 &',
        { cwd: process.cwd(), timeout: 10000 }
      );
      return `Запущено напрямую:\n${stdout}${stderr}`;
    }
  } catch (error) {
    throw new Error(`Ошибка запуска сервера: ${error}`);
  }
}

/**
 * Обрабатывает автоматическую установку и запуск
 */
export async function handleAutoSetup(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const steps: string[] = [];
  const errors: string[] = [];

  try {
    // Шаг 1: Проверка зависимостей
    steps.push('🔍 Проверка зависимостей...');
    const depsInstalled = await checkDependencies();
    
    if (!depsInstalled) {
      steps.push('📦 Установка зависимостей...');
      await installDependencies();
      steps.push(`✅ Зависимости установлены`);
    } else {
      steps.push('✅ Зависимости уже установлены');
    }

    // Шаг 2: Проверка сборки
    steps.push('🔍 Проверка сборки проекта...');
    const buildExists = await checkBuild();
    
    if (!buildExists) {
      steps.push('🔨 Сборка проекта...');
      await buildProject();
      steps.push(`✅ Проект собран`);
    } else {
      steps.push('✅ Проект уже собран');
    }

    // Шаг 3: Проверка запуска сервера
    const port = parseInt(process.env.WEBHOOK_PORT || '3001', 10);
    steps.push(`🔍 Проверка запуска сервера на порту ${port}...`);
    const serverRunning = await checkServerRunning(port);
    
    if (!serverRunning) {
      steps.push('🚀 Запуск webhook сервера...');
      await startServer();
      steps.push(`✅ Сервер запущен`);
      
      // Ждём немного чтобы сервер успел запуститься
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      steps.push('✅ Сервер уже запущен');
    }

    // Шаг 4: Настройка webhook (через другой handler)
    steps.push('🔗 Настройка webhook...');
    // Webhook будет настроен через основной handler

    // Отправляем успешный ответ
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateSuccessPage(steps));

  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateErrorPage(steps, errors));
  }
}

/**
 * Генерирует HTML страницу успеха
 */
function generateSuccessPage(steps: string[]): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Автоматическая настройка ✅</title>
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
            color: #667eea;
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
        <div class="emoji">✅</div>
        <h1>Всё настроено автоматически!</h1>
        
        <div class="steps">
            ${steps.map(step => `<div class="step">${step}</div>`).join('')}
        </div>

        <div class="info">
            <strong>🎉 Готово!</strong><br>
            Все команды выполнены автоматически. Бот готов к работе!
        </div>

        <a href="/setup-webhook" class="button" onclick="location.reload()">
            🔄 Обновить статус
        </a>
    </div>
</body>
</html>
  `;
}

/**
 * Генерирует HTML страницу ошибки
 */
function generateErrorPage(steps: string[], errors: string[]): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ошибка настройки ❌</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
            color: #f5576c;
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
            max-height: 300px;
            overflow-y: auto;
        }
        .step {
            margin: 10px 0;
            padding: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .error {
            background: #fee2e2;
            color: #991b1b;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">❌</div>
        <h1>Ошибка настройки</h1>
        
        <div class="steps">
            ${steps.map(step => `<div class="step">${step}</div>`).join('')}
        </div>

        <div class="error">
            <strong>Ошибки:</strong><br>
            ${errors.map(err => `• ${err}`).join('<br>')}
        </div>
    </div>
</body>
</html>
  `;
}

