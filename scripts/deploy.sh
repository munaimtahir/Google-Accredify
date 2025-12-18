#!/bin/bash
# AccrediFy Deployment Script
# This script automates the deployment process for AccrediFy

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f "backend/.env" ]; then
        print_error "Backend .env file not found!"
        print_info "Copy backend/.env.example to backend/.env and configure it"
        exit 1
    fi
    
    if [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
        print_warning "Frontend .env file not found (optional for build)"
    fi
}

# Validate required environment variables
validate_env() {
    print_info "Validating environment variables..."
    
    source backend/.env
    
    if [ -z "$DJANGO_SECRET_KEY" ]; then
        print_error "DJANGO_SECRET_KEY is not set in backend/.env"
        exit 1
    fi
    
    if [ "$DJANGO_SECRET_KEY" = "your-secret-key-change-this-in-production" ]; then
        print_error "Please set a proper DJANGO_SECRET_KEY in backend/.env"
        exit 1
    fi
    
    if [ -z "$GEMINI_API_KEY" ]; then
        print_warning "GEMINI_API_KEY is not set - AI features will not work"
    fi
    
    print_info "Environment variables validated"
}

# Install backend dependencies
install_backend() {
    print_info "Installing backend dependencies..."
    cd backend
    
    if [ ! -d "venv" ]; then
        print_info "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate || source venv/Scripts/activate
    
    print_info "Upgrading pip..."
    pip install --upgrade pip
    
    print_info "Installing requirements..."
    pip install -r requirements.txt
    
    cd ..
    print_info "Backend dependencies installed"
}

# Install frontend dependencies
install_frontend() {
    print_info "Installing frontend dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm ci
    else
        npm ci --prefer-offline
    fi
    
    print_info "Frontend dependencies installed"
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    cd backend
    source venv/bin/activate || source venv/Scripts/activate
    
    python manage.py migrate --noinput
    
    cd ..
    print_info "Migrations completed"
}

# Collect static files
collect_static() {
    print_info "Collecting static files..."
    cd backend
    source venv/bin/activate || source venv/Scripts/activate
    
    python manage.py collectstatic --noinput
    
    cd ..
    print_info "Static files collected"
}

# Build frontend
build_frontend() {
    print_info "Building frontend..."
    
    # Use production env if available
    if [ -f ".env.production" ]; then
        export $(cat .env.production | xargs)
    elif [ -f ".env.local" ]; then
        export $(cat .env.local | xargs)
    fi
    
    npm run build
    
    print_info "Frontend built successfully"
}

# Create superuser (interactive)
create_superuser() {
    print_info "Creating superuser (if needed)..."
    cd backend
    source venv/bin/activate || source venv/Scripts/activate
    
    print_warning "Superuser creation is interactive - press Ctrl+C to skip"
    python manage.py createsuperuser || print_warning "Superuser creation skipped"
    
    cd ..
}

# Run tests
run_tests() {
    print_info "Running tests..."
    cd backend
    source venv/bin/activate || source venv/Scripts/activate
    
    python manage.py test || print_warning "Some tests failed"
    
    cd ..
}

# Check health endpoint
check_health() {
    print_info "Checking health endpoint..."
    
    # Start server in background (if not already running)
    cd backend
    source venv/bin/activate || source venv/Scripts/activate
    
    # Try to check health endpoint
    timeout 5 bash -c 'until curl -f http://localhost:8000/api/health/; do sleep 1; done' || print_warning "Health check failed - server may not be running"
    
    cd ..
}

# Main deployment function
deploy() {
    print_info "Starting AccrediFy deployment..."
    
    # Check prerequisites
    check_env_file
    validate_env
    
    # Installation
    install_backend
    install_frontend
    
    # Database setup
    run_migrations
    
    # Build
    collect_static
    build_frontend
    
    # Optional steps
    if [ "$1" = "--create-superuser" ]; then
        create_superuser
    fi
    
    if [ "$1" = "--test" ] || [ "$2" = "--test" ]; then
        run_tests
    fi
    
    print_info "Deployment completed successfully!"
    print_info "Next steps:"
    print_info "  1. Review backend/.env configuration"
    print_info "  2. Start the backend server: cd backend && source venv/bin/activate && python manage.py runserver"
    print_info "  3. For production, use gunicorn or docker-compose"
}

# Docker deployment
deploy_docker() {
    print_info "Deploying with Docker..."
    
    check_env_file
    validate_env
    
    print_info "Building Docker images..."
    docker-compose build
    
    print_info "Starting services..."
    docker-compose up -d
    
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    print_info "Running migrations..."
    docker-compose exec backend python manage.py migrate --noinput
    
    print_info "Collecting static files..."
    docker-compose exec backend python manage.py collectstatic --noinput
    
    print_info "Docker deployment completed!"
    print_info "View logs with: docker-compose logs -f"
}

# Parse arguments
case "${1:-}" in
    --docker)
        deploy_docker
        ;;
    --help)
        echo "AccrediFy Deployment Script"
        echo ""
        echo "Usage: ./scripts/deploy.sh [options]"
        echo ""
        echo "Options:"
        echo "  --docker              Deploy using Docker Compose"
        echo "  --create-superuser    Create Django superuser interactively"
        echo "  --test                Run tests after deployment"
        echo "  --help                Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./scripts/deploy.sh                    # Standard deployment"
        echo "  ./scripts/deploy.sh --test             # Deploy and run tests"
        echo "  ./scripts/deploy.sh --docker           # Deploy with Docker"
        ;;
    *)
        deploy "$@"
        ;;
esac

