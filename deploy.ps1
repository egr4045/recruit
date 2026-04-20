param (
    [string]$ServerIp = "2.59.40.15",
    [string]$User = "egr",
    [string]$DeployPath = "/var/www/recruit"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Building Docker image locally..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
docker build -t recruit-app .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Docker image." -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "2. Saving and checking image..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
if (Test-Path "recruit-app.tar.gz") { Remove-Item "recruit-app.tar.gz" -Force }
if (Test-Path "recruit-app.tar") { Remove-Item "recruit-app.tar" -Force }

docker save recruit-app -o recruit-app.tar
tar -czf recruit-app.tar.gz recruit-app.tar
Remove-Item recruit-app.tar

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "3. Uploading archive to server ($ServerIp)..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
scp recruit-app.tar.gz "${User}@${ServerIp}:/tmp/"
scp deploy-remote.sh "${User}@${ServerIp}:/tmp/"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "4. Deploying on server..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

ssh "${User}@${ServerIp}" "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote deploy script failed." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Deploy successful!" -ForegroundColor Green
Remove-Item "recruit-app.tar.gz" -Force
