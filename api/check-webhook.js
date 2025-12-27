/**
 * Скрипт проверки настроек webhook и кнопки меню
 */

const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const FULL_URL = process.env.FULL_URL || 'https://tic-tac-toe-virid-two.vercel.app';

if (!BOT_TOKEN) {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: '<h1>❌ Ошибка</h1><p>BOT_TOKEN не установлен</p>'
  };
}

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

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
          resolve(json);
        } catch (e) {
          resolve({ ok: false, raw: data });
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

async function checkSettings() {
  const results = [];
  
  // 1. Проверяем webhook
  results.push('<h2>1. Webhook Info</h2>');
  try {
    const webhookInfo = await makeRequest(`${API_URL}/getWebhookInfo`);
    if (webhookInfo.ok) {
      const info = webhookInfo.result;
      results.push(`<p><strong>URL:</strong> ${info.url || 'Not set'}</p>`);
      results.push(`<p><strong>Pending updates:</strong> ${info.pending_update_count || 0}</p>`);
      results.push(`<p><strong>Last error date:</strong> ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : 'None'}</p>`);
      results.push(`<p><strong>Last error message:</strong> ${info.last_error_message || 'None'}</p>`);
    } else {
      results.push(`<p class="error">❌ Error: ${webhookInfo.description || 'Unknown error'}</p>`);
    }
  } catch (error) {
    results.push(`<p class="error">❌ Exception: ${error.message}</p>`);
  }
  
  // 2. Проверяем кнопку меню
  results.push('<h2>2. Menu Button Info</h2>');
  try {
    const menuButtonInfo = await makeRequest(`${API_URL}/getChatMenuButton`);
    if (menuButtonInfo.ok) {
      const button = menuButtonInfo.result;
      results.push(`<p><strong>Type:</strong> ${button.type || 'Not set'}</p>`);
      if (button.text) {
        results.push(`<p><strong>Text:</strong> ${button.text}</p>`);
      }
      if (button.web_app) {
        results.push(`<p><strong>Web App URL:</strong> <code>${button.web_app.url}</code></p>`);
        results.push(`<p><strong>Expected URL:</strong> <code>${FULL_URL}/web/game.html</code></p>`);
        if (button.web_app.url !== `${FULL_URL}/web/game.html`) {
          results.push(`<p class="warning">⚠️ URL mismatch! Menu button URL should be <code>${FULL_URL}/web/game.html</code> (not .php)</p>`);
          results.push(`<p class="warning">⚠️ Click <a href="/api/setup-webhook.js">here</a> to update the menu button URL.</p>`);
        }
      }
    } else {
      results.push(`<p class="error">❌ Error: ${menuButtonInfo.description || 'Unknown error'}</p>`);
    }
  } catch (error) {
    results.push(`<p class="error">❌ Exception: ${error.message}</p>`);
  }
  
  // 3. Проверяем команды
  results.push('<h2>3. Bot Commands</h2>');
  try {
    const commandsInfo = await makeRequest(`${API_URL}/getMyCommands`);
    if (commandsInfo.ok) {
      const commands = commandsInfo.result || [];
      if (commands.length > 0) {
        results.push('<ul>');
        commands.forEach(cmd => {
          results.push(`<li><code>/${cmd.command}</code> - ${cmd.description}</li>`);
        });
        results.push('</ul>');
      } else {
        results.push('<p>No commands set</p>');
      }
    } else {
      results.push(`<p class="error">❌ Error: ${commandsInfo.description || 'Unknown error'}</p>`);
    }
  } catch (error) {
    results.push(`<p class="error">❌ Exception: ${error.message}</p>`);
  }
  
  return results;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  try {
    const results = await checkSettings();
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Webhook Check</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    p { line-height: 1.6; }
    .error { color: red; }
    .warning { color: orange; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    ul { margin: 10px 0; }
  </style>
</head>
<body>
  <h1>🔍 Проверка настроек бота</h1>
  <p><strong>Bot:</strong> ${process.env.BOT_USERNAME || 'TicTacToe_ru_bot'}</p>
  <p><strong>Full URL:</strong> ${FULL_URL}</p>
  <hr>
  ${results.join('\n')}
  <hr>
  <p><a href="/api/setup-webhook.js">🔧 Настроить webhook заново</a></p>
</body>
</html>`;
    
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send(`<h1>❌ Ошибка</h1><p>${error.message}</p>`);
  }
};

