/**
 * Telegram Bot Webhook - Обработчик обновлений от Telegram
 * Node.js версия для Vercel
 */

const https = require('https');

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN;
const FULL_URL = process.env.FULL_URL || 'https://tic-tac-toe-virid-two.vercel.app';

// Сообщения бота
const BotMessages = {
  WELCOME: "Добро пожаловать 💕\nСыграем в крестики-нолики?",
  HELP: "📋 <b>Помощь</b>\n\n" +
        "🎮 <b>Как играть:</b>\n" +
        "1. Нажмите кнопку '🎮 Играть'\n" +
        "2. Делайте ходы, кликая на ячейки\n" +
        "3. Бот будет отвечать автоматически\n" +
        "4. Играйте и получайте призы!\n\n" +
        "📱 <b>Команды:</b>\n" +
        "/start - Начать игру\n" +
        "/help - Показать эту справку",
  win: () => "🎉 <b>Поздравляем с победой!</b>\n\n" +
                  "Вы выиграли в крестики-нолики! 🎊\n\n" +
                  "Откройте свой приз в игре! ✨",
  LOSE: "Вы проиграли битву, но не войну! 💫\n\nПопробуйте ещё раз!",
  DRAW: "Ничья 💫\n\nСыграем ещё раз?"
};

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
          resolve({ ok: json.ok, result: json.result, error: json.error, description: json.description });
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

// Отправка сообщения в Telegram
async function sendMessage(chatId, text, replyMarkup = null, apiUrl) {
  const data = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  
  if (replyMarkup) {
    data.reply_markup = replyMarkup;
  }
  
  try {
    const result = await makeRequest(`${apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    });
    return result.ok;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Ответ на callback query
async function answerCallbackQuery(callbackQueryId, text = null, apiUrl) {
  const data = {
    callback_query_id: callbackQueryId
  };
  
  if (text) {
    data.text = text;
  }
  
  try {
    await makeRequest(`${apiUrl}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

// Создание клавиатуры с Web App кнопкой
function createWebAppKeyboard(webappUrl) {
  return {
    inline_keyboard: [[
      {
        text: '🎮 Играть',
        web_app: { url: webappUrl }
      }
    ]]
  };
}

// Обработка обновления
async function handleUpdate(update, apiUrl) {
  // Обрабатываем сообщения
  if (update.message) {
    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const firstName = message.from?.first_name || '';
    const username = message.from?.username || '';
    
    console.log('Processing message:', { chatId, text, firstName, username });
    
    // Обрабатываем команды
    switch (text) {
      case '/start':
        const welcomeMessage = BotMessages.WELCOME;
        const webappUrl = `${FULL_URL}/web/game.html?tg_id=${chatId}`;
        const keyboard = createWebAppKeyboard(webappUrl);
        await sendMessage(chatId, welcomeMessage, keyboard, apiUrl);
        break;
        
      case '/help':
        await sendMessage(chatId, BotMessages.HELP, null, apiUrl);
        break;
        
      default:
        // Обработка данных из WebApp (через sendData)
        if (message.web_app_data) {
          try {
            const webappData = JSON.parse(message.web_app_data.data);
            
            if (webappData && webappData.action) {
              switch (webappData.action) {
                case 'win':
                  await sendMessage(chatId, BotMessages.win(), null, apiUrl);
                  console.log('Game won (via WebApp sendData)', { chatId });
                  break;
                  
                case 'lose':
                  await sendMessage(chatId, BotMessages.LOSE, null, apiUrl);
                  console.log('Game lost (via WebApp sendData)', { chatId });
                  break;
                  
                case 'draw':
                  await sendMessage(chatId, BotMessages.DRAW, null, apiUrl);
                  console.log('Game draw (via WebApp sendData)', { chatId });
                  break;
              }
            }
          } catch (error) {
            console.error('Error parsing webapp data:', error);
          }
        } else {
          // Неизвестная команда
          const unknownMessage = `🤔 Неизвестная команда: ${text}\n\nИспользуйте /start для начала игры или /help для справки.`;
          await sendMessage(chatId, unknownMessage, null, apiUrl);
        }
        break;
    }
  }
  
  // Обрабатываем callback queries
  if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const chatId = callbackQuery.message?.chat?.id;
    const callbackData = callbackQuery.data || '';
    const callbackQueryId = callbackQuery.id;
    
    console.log('Processing callback:', { chatId, callbackData });
    
    // Отвечаем на callback query
    await answerCallbackQuery(callbackQueryId, null, apiUrl);
    
    // Обработка callback данных (если понадобится)
    // Пока нет callback обработчиков
  }
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Устанавливаем заголовки
  res.setHeader('Content-Type', 'application/json');
  
  // Проверяем BOT_TOKEN
  if (!BOT_TOKEN) {
    console.error('WEBHOOK: BOT_TOKEN not configured');
    return res.status(500).json({ error: 'BOT_TOKEN not configured' });
  }
  
  // Если это GET-запрос (прямое открытие в браузере), возвращаем информационное сообщение
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok',
      message: 'Webhook endpoint is active. This endpoint receives POST requests from Telegram.',
      method: req.method
    });
  }
  
  // Проверяем, что это POST-запрос
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
  
  try {
    // Получаем данные из тела запроса
    // В Vercel тело может быть уже прочитано или нужно читать через stream
    let body = '';
    
    // Если тело уже есть (например, через middleware)
    if (req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    } else {
      // Читаем из stream
      await new Promise((resolve, reject) => {
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', resolve);
        req.on('error', reject);
      });
    }
    
    if (!body) {
      console.error('WEBHOOK: Empty body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Парсим JSON
    let update;
    try {
      update = JSON.parse(body);
    } catch (error) {
      console.error('WEBHOOK: Invalid JSON', { body, error: error.message });
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    
    console.log('WEBHOOK: Received update', { 
      updateId: update.update_id,
      hasMessage: !!update.message,
      hasCallbackQuery: !!update.callback_query
    });
    
    // Проверяем наличие обновления
    if (!update) {
      console.error('WEBHOOK: Empty update');
      return res.status(400).json({ error: 'Empty update' });
    }
    
    // Обрабатываем обновление
    await handleUpdate(update, API_URL);
    
    // Отвечаем OK
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('WEBHOOK: Fatal error', { 
      message: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

