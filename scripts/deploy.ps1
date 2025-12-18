# AccrediFy Deployment Script for Windows
# This script automates the deployment process for AccrediFy on Windows

param(
    [switch]$Docker,
    [switch]$CreateSuperuser,
    [switch]$Test,
    [switch]$Help
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if .env file exists
function Test-EnvFile {
    if (-not (Test-Path "backend\.env")) {
        Write-Error "Backend .env file not found!"
        Write-Info "Copy backend\.env.example to backend\.env and configure it"
        exit 1
    }
    
    if (-not (Test-Path ".env.local") -and -not (Test-Path ".env.production")) {
        Write-Warning "Frontend .env file not found (optional for build)"
    }
}

# Validate required environment variables
function Test-EnvVariables {
    Write-Info "Validating environment variables..."
    
    $envContent = Get-Content "backend\.env" | Where-Object { $_ -match "^\s*[^#]" }
    
    $secretKey = ($envContent | Where-Object { $_ -match "DJANGO_SECRET_KEY" }) -replace ".*=", ""
    $secretKey = $secretKey.Trim()
    
    if ([string]::IsNullOrWhiteSpace($secretKey) -or 
        $secretKey -eq "your-secret-key-change-this-in-production") {
        Write-Error "Please set a proper DJANGO_SECRET_KEY in backend\.env"
        exit 1
    }
    
    $geminiKey = ($envContent | Where-Object { $_ -match "GEMINI_API_KEY" }) -replace ".*=", ""
    $geminiKey = $geminiKey.Trim()
    
    if ([string]::IsNullOrWhiteSpace($geminiKey)) {
        Write-Warning "GEMINI_API_KEY is not set - AI features will not work"
    }
    
    Write-Info "Environment variables validated"
}

# Install backend dependencies
function Install-Backend {
    Write-Info "Installing backend dependencies..."
    Push-Location backend
    
    if (-not (Test-Path "venv")) {
        Write-Info "Creating virtual environment..."
        python -m venv venv
    }
    
    & "venv\Scripts\Activate.ps1"
    
    Write-Info "Upgrading pip..."
    python -m pip install --upgrade pip
    
    Write-Info "Installing requirements..."
    pip install -r requirements.txt
    
    Pop-Location
    Write-Info "Backend dependencies installed"
}

# Install frontend dependencies
function Install-Frontend {
    Write-Info "Installing frontend dependencies..."
    
    if (-not (Test-Path "node_modules")) {
        npm ci
    } else {
        npm ci --prefer-offline
    }
    
    Write-Info "Frontend dependencies installed"
}

# Run database migrations
function Start-Migrations {
    Write-Info "Running database migrations..."
    Push-Location backend
    & "venv\Scripts\Activate.ps1"
    
    python manage.py migrate --noinput
    
    Pop-Location
    Write-Info "Migrations completed"
}

# Collect static files
function Start-CollectStatic {
    Write-Info "Collecting static files..."
    Push-Location backend
    & "venv\Scripts\Activate.ps1"
    
    python manage.py collectstatic --noinput
    
    Pop-Location
    Write-Info "Static files collected"
}

# Build frontend
function Start-BuildFrontend {
    Write-Info "Building frontend..."
    
    # Load environment variables if available
    if (Test-Path ".env.production") {
        Get-Content ".env.production" | ForEach-Object {
            if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    } elseif (Test-Path ".env.local") {
        Get-Content ".env.local" | ForEach-Object {
            if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    npm run build
    
    Write-Info "Frontend built successfully"
}

# Create superuser (interactive)
function Start-CreateSuperuser {
    Write-Info "Creating superuser (if needed)..."
    Push-Location backend
    & "venv\Scripts\Activate.ps1"
    
    Write-Warning "Superuser creation is interactive - press Ctrl+C to skip"
    try {
        python manage.py createsuperuser
    } catch {
        Write-Warning "Superuser creation skipped"
    }
    
    Pop-Location
}

# Run tests
function Start-Tests {
    Write-Info "Running tests..."
    Push-Location backend
    & "venv\Scripts\Activate.ps1"
    
    try {
        python manage.py test
    } catch {
        Write-Warning "Some tests failed"
    }
    
    Pop-Location
}

# Docker deployment
function Start-DockerDeploy {
    Write-Info "Deploying with Docker..."
    
    Test-EnvFile
    Test-EnvVariables
    
    Write-Info "Building Docker images..."
    docker-compose build
    
    Write-Info "Starting services..."
    docker-compose up -d
    
    Write-Info "Waiting for services to be healthy..."
    Start-Sleep -Seconds 10
    
    Write-Info "Running migrations..."
    docker-compose exec backend python manage.py migrate --noinput
    
    Write-Info "Collecting static files..."
    docker-compose exec backend python manage.py collectstatic --noinput
    
    Write-Info "Docker deployment completed!"
    Write-Info "View logs with: docker-compose logs -f"
}

# Main deployment function
function Start-Deploy {
    Write-Info "Starting AccrediFy deployment..."
    
    # Check prerequisites
    Test-EnvFile
    Test-EnvVariables
    
    # Installation
    Install-Backend
    Install-Frontend
    
    # Database setup
    Start-Migrations
    
    # Build
    Start-CollectStatic
    Start-BuildFrontend
    
    # Optional steps
    if ($CreateSuperuser) {
        Start-CreateSuperuser
    }
    
    if ($Test) {
        Start-Tests
    }
    
    Write-Info "Deployment completed successfully!"
    Write-Info "Next steps:"
    Write-Info "  1. Review backend\.env configuration"
    Write-Info "  2. Start the backend server: cd backend; .\venv\Scripts\Activate.ps1; python manage.py runserver"
    Write-Info "  3. For production, use gunicorn or docker-compose"
}

# Show help
if ($Help) {
    Write-Host "AccrediFy Deployment Script for Windows"
    Write-Host ""
    Write-Host "Usage: .\scripts\deploy.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Docker              Deploy using Docker Compose"
    Write-Host "  -CreateSuperuser     Create Django superuser interactively"
    Write-Host "  -Test                Run tests after deployment"
    Write-Host "  -Help                Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\deploy.ps1                    # Standard deployment"
    Write-Host "  .\scripts\deploy.ps1 -Test              # Deploy and run tests"
    Write-Host "  .\scripts\deploy.ps1 -Docker            # Deploy with Docker"
    exit 0
}

# Main execution
if ($Docker) {
    Start-DockerDeploy
} else {
    Start-Deploy
}

