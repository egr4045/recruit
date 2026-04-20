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
Write-Host "🚀 3. Отправка архива и скрипта на сервер ($ServerIp)..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
scp recruit-app.tar.gz "${User}@${ServerIp}:/tmp/"
scp deploy-remote.sh "${User}@${ServerIp}:/tmp/"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "⚙️  4. Развертывание на сервере..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

ssh "${User}@${ServerIp}" "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh"

Write-Host "`n✅ Деплой успешно завершен!" -ForegroundColor Green
Remove-Item "recruit-app.tar.gz" -Force
