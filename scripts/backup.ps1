# AccrediFy Backup Script (Windows PowerShell)
#
# Supports:
# - Docker Compose backups (recommended): database + media volume
# - Local backups: database (requires pg_dump) + backend/media folder
#
# Usage:
#   .\scripts\backup.ps1 -Docker
#   .\scripts\backup.ps1 -Local
#
# Env (optional):
#   BACKUP_DIR=.\backups
#   BACKUP_RETENTION_DAYS=14
#   DB_NAME / DB_USER / DB_PASSWORD

param(
  [switch]$Docker,
  [switch]$Local
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err([string]$msg)  { Write-Host "[ERROR] $msg" -ForegroundColor Red }

if (-not $Docker -and -not $Local) { $Docker = $true }

$backupDir = $env:BACKUP_DIR
if ([string]::IsNullOrWhiteSpace($backupDir)) { $backupDir = ".\backups" }

$retentionDays = $env:BACKUP_RETENTION_DAYS
if ([string]::IsNullOrWhiteSpace($retentionDays)) { $retentionDays = "14" }

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

function Load-RootEnv {
  if (Test-Path ".\.env") {
    Get-Content ".\.env" | ForEach-Object {
      if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
      }
    }
  }
}

function Dc([string[]]$args) {
  $useNew = $false
  try { docker compose version | Out-Null; $useNew = $true } catch {}
  if ($useNew) { & docker compose @args } else { & docker-compose @args }
}

function Backup-DbDocker {
  Load-RootEnv

  if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) {
    throw "DB_PASSWORD must be set (in .env or environment) for Docker backups."
  }

  if ([string]::IsNullOrWhiteSpace($env:DB_NAME)) { $env:DB_NAME = "accredify_db" }
  if ([string]::IsNullOrWhiteSpace($env:DB_USER)) { $env:DB_USER = "accredify_user" }

  $outFile = Join-Path $backupDir "db_$ts.sql.gz"
  Write-Info "Backing up Postgres (docker) -> $outFile"

  $tmpFile = "/tmp/db_$ts.sql.gz"
  Dc @("exec", "-T", "db", "sh", "-c", "PGPASSWORD=`"$env:DB_PASSWORD`" pg_dump -U `"$env:DB_USER`" `"$env:DB_NAME`" | gzip > $tmpFile")

  $dbContainer = (Dc @("ps", "-q", "db") | Select-Object -First 1).Trim()
  if ([string]::IsNullOrWhiteSpace($dbContainer)) { throw "Could not find db container id." }

  & docker cp "$dbContainer`:$tmpFile" "$outFile"
  Dc @("exec", "-T", "db", "sh", "-c", "rm -f $tmpFile") | Out-Null
}

function Backup-MediaDocker {
  $outFile = Join-Path $backupDir "media_$ts.tar.gz"
  Write-Info "Backing up media volume (docker) -> $outFile"

  $tmpFile = "/tmp/media_$ts.tar.gz"
  # Create archive inside container, then docker cp to avoid binary stream corruption in Windows PowerShell.
  Dc @("exec", "-T", "backend", "sh", "-c", "if test -d /app/media; then tar -czf $tmpFile /app/media; else exit 2; fi")
  if ($LASTEXITCODE -ne 0) {
    Write-Warn "Media backup skipped (no /app/media yet?)"
    return
  }

  $backendContainer = (Dc @("ps", "-q", "backend") | Select-Object -First 1).Trim()
  if ([string]::IsNullOrWhiteSpace($backendContainer)) { throw "Could not find backend container id." }

  & docker cp "$backendContainer`:$tmpFile" "$outFile"
  Dc @("exec", "-T", "backend", "sh", "-c", "rm -f $tmpFile") | Out-Null
}

function Backup-DbLocal {
  if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) {
    throw "DB_PASSWORD must be set in environment for -Local mode."
  }
  if ([string]::IsNullOrWhiteSpace($env:DB_NAME)) { $env:DB_NAME = "accredify_db" }
  if ([string]::IsNullOrWhiteSpace($env:DB_USER)) { $env:DB_USER = "accredify_user" }
  if ([string]::IsNullOrWhiteSpace($env:DB_HOST)) { $env:DB_HOST = "localhost" }
  if ([string]::IsNullOrWhiteSpace($env:DB_PORT)) { $env:DB_PORT = "5432" }

  $outFile = Join-Path $backupDir "db_$ts.sql"
  Write-Info "Backing up Postgres (local) -> $outFile"

  $env:PGPASSWORD = $env:DB_PASSWORD
  & pg_dump -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER $env:DB_NAME | Set-Content -Encoding UTF8 $outFile
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

function Backup-MediaLocal {
  $mediaPath = ".\backend\media"
  if (-not (Test-Path $mediaPath)) {
    Write-Warn "backend/media not found; skipping media backup"
    return
  }
  $outFile = Join-Path $backupDir "media_$ts.zip"
  Write-Info "Backing up backend/media -> $outFile"
  if (Test-Path $outFile) { Remove-Item $outFile -Force }
  Compress-Archive -Path $mediaPath -DestinationPath $outFile
}

function Apply-Retention {
  Write-Info "Applying retention: delete backups older than $retentionDays days"
  $cutoff = (Get-Date).AddDays(-[int]$retentionDays)
  Get-ChildItem -Path $backupDir -File | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Force -ErrorAction SilentlyContinue
}

if ($Docker) {
  Backup-DbDocker
  Backup-MediaDocker
  Apply-Retention
} elseif ($Local) {
  Backup-DbLocal
  Backup-MediaLocal
  Apply-Retention
}

Write-Info "Backup complete: $backupDir"


