#!/bin/bash
set -e

DEPLOY_PATH="/var/www/recruit"
cd $DEPLOY_PATH

DB_URL=$(grep '^DATABASE_URL=' .env | cut -d '=' -f2-)
DB_URL=$(echo $DB_URL | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL not found in .env"
  exit 1
fi

echo "📂 Pulling latest schema from git..."
sudo git pull

if [ ! -f node_modules/.bin/prisma ]; then
  echo "📦 prisma not found in node_modules, installing deps..."
  npm install --prefer-offline 2>/dev/null || npm install
fi

echo "🗄️  Running prisma db push..."
DATABASE_URL="$DB_URL" node_modules/.bin/prisma db push

echo "✅ Migration done"
