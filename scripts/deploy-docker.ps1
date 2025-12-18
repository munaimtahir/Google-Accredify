# AccrediFy Docker deployment script (Windows PowerShell)
#
# Modes:
#   -Dev  : db + backend + frontend (Vite dev server)
#   -Prod : db + backend + nginx (+redis) using built ./dist
#
# Usage:
#   .\scripts\deploy-docker.ps1 -Dev
#   .\scripts\deploy-docker.ps1 -Prod
#
# Requirements:
# - Docker + Docker Compose
# - For -Prod: Node/npm available to build ./dist (or use -SkipFrontend and provide prebuilt dist)

param(
  [switch]$Dev,
  [switch]$Prod,
  [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Err([string]$msg)  { Write-Host "[ERROR] $msg" -ForegroundColor Red }

if (-not $Dev -and -not $Prod) { $Prod = $true }

function Dc([string[]]$args) {
  $useNew = $false
  try { docker compose version | Out-Null; $useNew = $true } catch {}
  if ($useNew) { & docker compose @args } else { & docker-compose @args }
}

function Require-Env {
  if (-not (Test-Path ".\.env")) {
    throw ".env not found. Copy .env.example -> .env and set DB_PASSWORD + DJANGO_SECRET_KEY."
  }
  # Load .env into process env (best-effort)
  Get-Content ".\.env" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
      [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
  }
  if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) { throw "DB_PASSWORD is required in .env" }
  if ([string]::IsNullOrWhiteSpace($env:DJANGO_SECRET_KEY)) { throw "DJANGO_SECRET_KEY is required in .env" }
}

function Build-Frontend {
  if ($SkipFrontend) {
    Write-Info "SkipFrontend set; skipping frontend build"
    return
  }
  Write-Info "Building frontend (npm ci && npm run build)"
  npm ci
  npm run build
}

function Deploy-Dev {
  Require-Env
  Write-Info "Starting dev stack: db + backend + frontend"
  Dc @("up", "-d", "--build", "db", "backend", "frontend")
  Write-Info "Running migrations + collectstatic"
  Dc @("exec", "-T", "backend", "python", "manage.py", "migrate", "--noinput")
  Dc @("exec", "-T", "backend", "python", "manage.py", "collectstatic", "--noinput")
  Write-Info "Done. Frontend: http://localhost:3000  Backend: http://localhost:8000/api/health/"
}

function Deploy-Prod {
  Require-Env
  Build-Frontend
  Write-Info "Starting prod stack: db + backend + nginx (+redis)"
  Dc @("up", "-d", "--build", "db", "backend")
  try {
    Dc @("--profile", "production", "up", "-d", "--build", "nginx", "redis")
  } catch {
    Dc @("--profile", "production", "up", "-d", "--build", "nginx")
  }
  Write-Info "Running migrations + collectstatic"
  Dc @("exec", "-T", "backend", "python", "manage.py", "migrate", "--noinput")
  Dc @("exec", "-T", "backend", "python", "manage.py", "collectstatic", "--noinput")
  Write-Info "Done. Nginx: http://localhost  API: http://localhost/api/health/"
}

if ($Dev) { Deploy-Dev } else { Deploy-Prod }



