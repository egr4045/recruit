param (
    [string]$ServerIp = "2.59.40.15",
    [string]$User = "egr",
    [string]$DeployPath = "/var/www/recruit"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🛠️  1. Сборка Docker образа локально..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
docker build -t recruit-app .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка: Не удалось собрать Docker образ." -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "📦 2. Сохранение и архивация образа..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
if (Test-Path "recruit-app.tar.gz") { Remove-Item "recruit-app.tar.gz" -Force }
if (Test-Path "recruit-app.tar") { Remove-Item "recruit-app.tar" -Force }

docker save recruit-app -o recruit-app.tar
tar -czf recruit-app.tar.gz recruit-app.tar
Remove-Item recruit-app.tar

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "🚀 3. Отправка архива на сервер ($ServerIp)..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
scp recruit-app.tar.gz "${User}@${ServerIp}:/tmp/"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "⚙️  4. Развертывание на сервере..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$RemoteScript = @"
    echo '📥 Загружаем Docker образ...'
    docker load -i /tmp/recruit-app.tar.gz
    
    echo '📂 Переходим в директорию проекта и подтягиваем изменения кода...'
    cd $DeployPath || exit 1
    git pull
    
    echo '🔄 Перезапускаем контейнеры...'
    docker compose down
    docker compose up -d
    
    echo '🧹 Очищаем временные файлы и старые образы...'
    rm /tmp/recruit-app.tar.gz
    docker image prune -f
    
    echo '\n'
    echo '=========================================='
    echo '📊 HEALTH CHECK СЕРВЕРА'
    echo '=========================================='
    echo '💽 Место на диске:'
    df -h /
    echo '------------------------------------------'
    echo '🏃 Активные контейнеры:'
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep recruit
    echo '=========================================='
"@

ssh "${User}@${ServerIp}" $RemoteScript

Write-Host "`n✅ Деплой успешно завершен!" -ForegroundColor Green
Remove-Item "recruit-app.tar.gz" -Force

