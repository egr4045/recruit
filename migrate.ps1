param (
    [string]$ServerIp = "2.59.40.15",
    [string]$User = "egr",
    [string]$DeployPath = "/var/www/recruit"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Running migration on $ServerIp..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

scp migrate-remote.sh "${User}@${ServerIp}:/tmp/"
ssh "${User}@${ServerIp}" "chmod +x /tmp/migrate-remote.sh && /tmp/migrate-remote.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Migration successful!" -ForegroundColor Green
