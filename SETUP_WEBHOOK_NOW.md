# 🚀 Настройка Webhook - Прямо сейчас

## ✅ Шаг 1: Получите URL бота на Railway

1. Откройте Railway: https://railway.app
2. Выберите ваш проект
3. Перейдите: **Settings** → **Networking** → **Domains**
4. Скопируйте URL (например: `https://your-app.up.railway.app`)

**Если домена нет:**
- Нажмите **"Generate Domain"** или **"Add Domain"**
- Railway создаст домен автоматически

## ✅ Шаг 2: Настройте webhook

### Вариант А: Через браузер (самый простой)

Откройте в браузере (замените на ваш URL):
```
https://your-app.up.railway.app/setup-webhook
```

### Вариант Б: Через curl (вручную)

```bash
curl -X POST "https://api.telegram.org/bot8511369237:AAE1AOI2lO0mhZ2Wzf6Q_13dOIzCZ3Co6iE/setWebhook" \
  -d "url=https://your-app.up.railway.app/webhook" \
  -d "drop_pending_updates=true"
```

**Замените `your-app.up.railway.app` на ваш Railway домен!**

## ✅ Шаг 3: Проверьте что webhook настроен

```bash
curl "https://api.telegram.org/bot8511369237:AAE1AOI2lO0mhZ2Wzf6Q_13dOIzCZ3Co6iE/getWebhookInfo"
```

**Должно вернуть:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.up.railway.app/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## ✅ Шаг 4: Проверьте бота

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`
4. Бот должен ответить!

## 🔍 Если не работает

1. **Проверьте логи Railway:**
   - Railway → Deployments → View Logs
   - Должны быть логи: `✅ Webhook сервер запущен`

2. **Проверьте что endpoint доступен:**
   ```bash
   curl https://your-app.up.railway.app/webhook
   ```
   Должен вернуть 404 (это нормально для GET запроса)

3. **Проверьте переменные окружения в Railway:**
   - `BOT_TOKEN` - должен быть установлен
   - `USE_WEBHOOK=true` - должен быть установлен
   - `WEB_APP_URL` - должен быть установлен

