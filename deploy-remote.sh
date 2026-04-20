#!/bin/bash
set -e

DEPLOY_PATH="/var/www/recruit"

echo "📥 Распаковываем и загружаем Docker образ..."
tar -xzf /tmp/recruit-app.tar.gz -C /tmp/
sudo docker load -i /tmp/recruit-app.tar
sudo rm /tmp/recruit-app.tar

echo "📂 Подтягиваем изменения кода..."
cd $DEPLOY_PATH
sudo git pull

echo "🔄 Перезапускаем контейнеры..."
sudo docker compose down
sudo docker compose up -d

echo "🗄️ Обновляем схему базы данных..."
DB_URL=$(grep '^DATABASE_URL=' .env | cut -d '=' -f2-)
# Убираем возможные кавычки
DB_URL=$(echo $DB_URL | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
# host.docker.internal резолвится только внутри контейнера — снаружи используем localhost
DB_URL=$(echo "$DB_URL" | sed 's/host\.docker\.internal/localhost/g')

# Запускаем из директории проекта — там есть node_modules и prisma.config.ts
if [ ! -f node_modules/.bin/prisma ]; then
  echo "node_modules не найден, устанавливаем зависимости..."
  npm install --prefer-offline 2>/dev/null || npm install
fi
DATABASE_URL="$DB_URL" node_modules/.bin/prisma db push

echo "📝 Создаем тестовую статью..."
sudo docker exec -i -e DATABASE_URL="$DB_URL" recruit-app node - < seed-article.js

echo "🧹 Очищаем временные файлы и старые образы..."
sudo rm -f /tmp/recruit-app.tar.gz
sudo docker image prune -f

echo ""
echo "=========================================="
echo "📊 HEALTH CHECK СЕРВЕРА"
echo "=========================================="
echo "💽 Место на диске:"
df -h /
echo "------------------------------------------"
echo "🏃 Активные контейнеры:"
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep recruit
echo "=========================================="
