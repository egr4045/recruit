param (
    [string]$ServerIp = "2.59.40.15",
    [string]$User = "egr",
    [string]$DeployPath = "/var/www/recruit"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Running migration on $ServerIp..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Push current local schema files to server (bypass git state)
Write-Host "Syncing schema files..." -ForegroundColor Gray
scp prisma/schema.prisma "${User}@${ServerIp}:${DeployPath}/prisma/schema.prisma"
scp prisma.config.ts "${User}@${ServerIp}:${DeployPath}/prisma.config.ts"

scp migrate-remote.sh "${User}@${ServerIp}:/tmp/"
ssh "${User}@${ServerIp}" "chmod +x /tmp/migrate-remote.sh && /tmp/migrate-remote.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Migration successful!" -ForegroundColor Green
