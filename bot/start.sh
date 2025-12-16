#!/bin/bash
# Скрипт автоматического запуска бота после деплоя

set -e

echo "🚀 Автоматический запуск бота..."

# Переходим в директорию скрипта
cd "$(dirname "$0")" || exit 1

# Проверяем наличие .env
if [ ! -f ".env" ]; then
    echo "❌ Файл .env не найден!"
    exit 1
fi

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm install --production

# Собираем проект
echo "🔨 Сборка проекта..."
npm run build:bot

# Проверяем наличие PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 найден, запускаем через PM2..."
    
    # Останавливаем старый процесс если есть
    pm2 stop tictactoe-webhook 2>/dev/null || true
    pm2 delete tictactoe-webhook 2>/dev/null || true
    
    # Запускаем новый процесс
    USE_WEBHOOK=true pm2 start npm --name "tictactoe-webhook" -- run start:webhook
    pm2 save
    
    echo "✅ Бот запущен через PM2!"
    echo "📊 Статус: pm2 status"
    echo "📋 Логи: pm2 logs tictactoe-webhook"
else
    echo "⚠️ PM2 не найден, запускаем напрямую..."
    echo "💡 Рекомендуется установить PM2: npm install -g pm2"
    
    # Запускаем напрямую (в фоне)
    USE_WEBHOOK=true nohup npm run start:webhook > webhook.log 2>&1 &
    echo $! > webhook.pid
    
    echo "✅ Бот запущен!"
    echo "📋 Логи: tail -f webhook.log"
    echo "🛑 Остановка: kill \$(cat webhook.pid)"
fi

echo ""
echo "🎉 Готово! Бот запущен и готов к работе."
echo "🌐 Откройте https://develonik.ru/setup-webhook для настройки webhook"

