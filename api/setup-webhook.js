/**
 * Скрипт настройки webhook для Telegram бота
 * Node.js версия для Vercel
 */

const https = require('https');

// Конфигурация из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const FULL_URL = process.env.FULL_URL || 'https://tic-tac-toe-virid-two.vercel.app';
const BOT_USERNAME = process.env.BOT_USERNAME || 'TicTacToe_ru_bot';
const BOT_FULL_NAME = `@${BOT_USERNAME}`;

if (!BOT_TOKEN) {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: '<h1>❌ Ошибка</h1><p>BOT_TOKEN не установлен. Убедитесь, что переменная окружения BOT_TOKEN настроена в Vercel Dashboard → Settings → Environment Variables.</p>'
  };
}

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `${FULL_URL}/api/webhook.js`;

// Функция для выполнения HTTP запросов
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ ok: json.ok, result: json.result, error: json.error, description: json.description, raw: data });
        } catch (e) {
          resolve({ ok: false, raw: data, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// HTML шаблон для ответа
function generateHTML(title, steps) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    p { line-height: 1.6; }
    .success { color: green; }
    .error { color: red; }
    .warning { color: orange; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    hr { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p><strong>Бот:</strong> ${BOT_FULL_NAME}</p>
  <p><strong>Токен:</strong> ${BOT_TOKEN.substring(0, 10)}...</p>
  <hr>
  ${steps.join('\n')}
</body>
</html>`;
}

async function setupWebhook() {
  const steps = [];

  // 1. Удаляем старый webhook
  steps.push('<h2>1. Удаление старого webhook...</h2>');
  try {
    const deleteResult = await makeRequest(`${API_URL}/deleteWebhook`);
    if (deleteResult.ok) {
      steps.push('<p class="success">✅ Старый webhook удален</p>');
    } else {
      steps.push(`<p class="warning">⚠️ Ошибка удаления webhook: ${deleteResult.raw}</p>`);
    }
  } catch (error) {
    steps.push(`<p class="warning">⚠️ Ошибка удаления webhook: ${error.message}</p>`);
  }

  // 2. Устанавливаем новый webhook
  steps.push('<h2>2. Установка нового webhook...</h2>');
  try {
    const webhookResult = await makeRequest(`${API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        url: WEBHOOK_URL,
        allowed_updates: ['message', 'callback_query']
      }
    });
    
    if (webhookResult.ok) {
      steps.push(`<p class="success">✅ Webhook установлен: <code>${WEBHOOK_URL}</code></p>`);
    } else {
      steps.push(`<p class="error">❌ Ошибка установки webhook: ${webhookResult.raw}</p>`);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: generateHTML('🔧 Настройка Telegram бота', steps)
      };
    }
  } catch (error) {
    steps.push(`<p class="error">❌ Ошибка установки webhook: ${error.message}</p>`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: generateHTML('🔧 Настройка Telegram бота', steps)
    };
  }

  // 3. Удаляем старые команды
  steps.push('<h2>3. Удаление старых команд...</h2>');
  try {
    const deleteCommandsResult = await makeRequest(`${API_URL}/deleteMyCommands`, {
      method: 'POST'
    });
    if (deleteCommandsResult.ok) {
      steps.push('<p class="success">✅ Старые команды удалены</p>');
    } else {
      steps.push(`<p class="warning">⚠️ Ошибка удаления команд (может не существовать): ${deleteCommandsResult.raw}</p>`);
    }
  } catch (error) {
    steps.push(`<p class="warning">⚠️ Ошибка удаления команд: ${error.message}</p>`);
  }

  // 4. Устанавливаем новую кнопку меню (Web App)
  steps.push('<h2>4. Установка кнопки меню (Web App)...</h2>');
  try {
    const menuButtonResult = await makeRequest(`${API_URL}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        menu_button: {
          type: 'web_app',
          text: '🎮 Играть',
          web_app: {
            url: `${FULL_URL}/web/game.php`
          }
        }
      }
    });
    
    if (menuButtonResult.ok) {
      steps.push('<p class="success">✅ Кнопка меню установлена</p>');
    } else {
      steps.push(`<p class="warning">⚠️ Ошибка установки кнопки меню: ${menuButtonResult.raw}</p>`);
    }
  } catch (error) {
    steps.push(`<p class="warning">⚠️ Ошибка установки кнопки меню: ${error.message}</p>`);
  }

  // 5. Устанавливаем команды бота
  steps.push('<h2>5. Установка команд бота...</h2>');
  try {
    const commands = [
      { command: 'start', description: 'Начать игру' },
      { command: 'help', description: 'Помощь' },
      { command: 'rules', description: 'Правила игры' },
      { command: 'status', description: 'Статус игры' }
    ];

    const setCommandsResult = await makeRequest(`${API_URL}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { commands }
    });
    
    if (setCommandsResult.ok) {
      steps.push('<p class="success">✅ Команды установлены</p>');
    } else {
      steps.push(`<p class="warning">⚠️ Ошибка установки команд: ${setCommandsResult.raw}</p>`);
    }
  } catch (error) {
    steps.push(`<p class="warning">⚠️ Ошибка установки команд: ${error.message}</p>`);
  }

  // 6. Получаем информацию о боте
  steps.push('<h2>6. Информация о боте...</h2>');
  try {
    const botInfoResult = await makeRequest(`${API_URL}/getMe`);
    if (botInfoResult.ok && botInfoResult.result) {
      const botInfo = botInfoResult.result;
      steps.push(`<p class="success">✅ Бот активен: <strong>@${botInfo.username}</strong></p>`);
      steps.push(`<p>Имя: ${botInfo.first_name}</p>`);
    } else {
      steps.push('<p class="error">❌ Ошибка получения информации о боте</p>');
    }
  } catch (error) {
    steps.push(`<p class="error">❌ Ошибка получения информации о боте: ${error.message}</p>`);
  }

  steps.push('<hr>');
  steps.push('<h2>✅ Настройка завершена!</h2>');
  steps.push(`<p>Теперь вы можете использовать бота: <a href="https://t.me/${BOT_USERNAME}">@${BOT_USERNAME}</a></p>`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: generateHTML('🔧 Настройка Telegram бота', steps)
  };
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    const result = await setupWebhook();
    res.status(result.statusCode);
    res.setHeader('Content-Type', result.headers['Content-Type']);
    res.send(result.body);
  } catch (error) {
    res.status(500);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<h1>❌ Ошибка</h1><p>${error.message}</p>`);
  }
};

