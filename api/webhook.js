/**
 * Telegram Bot Webhook - Обработчик обновлений от Telegram
 * Node.js версия для Vercel
 */

const https = require('https');

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN;
const FULL_URL = process.env.FULL_URL || 'https://tic-tac-toe-virid-two.vercel.app';

if (!BOT_TOKEN) {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'BOT_TOKEN not configured' })
  };
}

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Сообщения бота
const BotMessages = {
  WELCOME: "Добро пожаловать 💕\nСыграем в крестики-нолики?",
  HELP: "📋 <b>Помощь</b>\n\n" +
        "🎮 <b>Как играть:</b>\n" +
        "1. Нажмите кнопку '🎮 Играть'\n" +
        "2. Делайте ходы, кликая на ячейки\n" +
        "3. Бот будет отвечать автоматически\n" +
        "4. При победе получите промокод!\n\n" +
        "📱 <b>Команды:</b>\n" +
        "/start - Начать игру\n" +
        "/help - Показать эту справку",
  win: (code) => "🎉 <b>Поздравляем с победой!</b>\n\n" +
                  "Вы выиграли в крестики-нолики! 🎊\n\n" +
                  "💝 <b>Ваш промокод:</b> <code>" + code + "</code>\n\n" +
                  "Сохраните его, он может пригодиться! ✨",
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
async function sendMessage(chatId, text, replyMarkup = null) {
  const data = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  
  if (replyMarkup) {
    data.reply_markup = replyMarkup;
  }
  
  try {
    const result = await makeRequest(`${API_URL}/sendMessage`, {
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
async function answerCallbackQuery(callbackQueryId, text = null) {
  const data = {
    callback_query_id: callbackQueryId
  };
  
  if (text) {
    data.text = text;
  }
  
  try {
    await makeRequest(`${API_URL}/answerCallbackQuery`, {
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
async function handleUpdate(update) {
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
        const webappUrl = `${FULL_URL}/web/game.php?tg_id=${chatId}`;
        const keyboard = createWebAppKeyboard(webappUrl);
        await sendMessage(chatId, welcomeMessage, keyboard);
        break;
        
      case '/help':
        await sendMessage(chatId, BotMessages.HELP);
        break;
        
      default:
        // Обработка данных из WebApp (через sendData)
        if (message.web_app_data) {
          try {
            const webappData = JSON.parse(message.web_app_data.data);
            
            if (webappData && webappData.action) {
              switch (webappData.action) {
                case 'win':
                  if (webappData.promo_code) {
                    await sendMessage(chatId, BotMessages.win(webappData.promo_code));
                    console.log('Game won (via WebApp sendData)', { chatId, promoCode: webappData.promo_code });
                  }
                  break;
                  
                case 'lose':
                  await sendMessage(chatId, BotMessages.LOSE);
                  console.log('Game lost (via WebApp sendData)', { chatId });
                  break;
                  
                case 'draw':
                  await sendMessage(chatId, BotMessages.DRAW);
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
          await sendMessage(chatId, unknownMessage);
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
    await answerCallbackQuery(callbackQueryId);
    
    // Обработка callback данных (если понадобится)
    // Пока нет callback обработчиков
  }
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Устанавливаем заголовки
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Получаем данные
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    await new Promise((resolve) => {
      req.on('end', async () => {
        try {
          const update = JSON.parse(body);
          console.log('WEBHOOK: Received update', { update });
          
          // Проверяем JSON
          if (!update) {
            console.error('WEBHOOK: Invalid JSON', { body });
            res.status(400).json({ error: 'Invalid JSON' });
            return;
          }
          
          // Обрабатываем обновление
          await handleUpdate(update);
          
          // Отвечаем OK
          res.status(200).json({ status: 'ok' });
          resolve();
        } catch (error) {
          console.error('WEBHOOK: Error processing update', error);
          res.status(500).json({ error: 'Server error' });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('WEBHOOK: Fatal error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

