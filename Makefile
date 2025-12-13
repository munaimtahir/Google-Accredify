.PHONY: help install dev build test lint format clean docker-up docker-down

# Default target
help:
	@echo "AccrediFy - Available Commands"
	@echo "=============================="
	@echo ""
	@echo "Development:"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev         - Start development servers"
	@echo "  make build       - Build for production"
	@echo "  make test        - Run all tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint        - Run linters"
	@echo "  make format      - Format code"
	@echo "  make type-check  - Run TypeScript type checking"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up   - Start Docker containers"
	@echo "  make docker-down - Stop Docker containers"
	@echo "  make docker-logs - View Docker logs"
	@echo ""
	@echo "Utility:"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make setup-env   - Create .env files from examples"

# Install dependencies
install:
	@echo "Installing frontend dependencies..."
	npm install
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt

# Start development servers
dev:
	@echo "Starting development servers..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@make -j2 dev-frontend dev-backend

dev-frontend:
	npm run dev

dev-backend:
	cd backend && python manage.py runserver

# Build for production
build:
	@echo "Building frontend..."
	npm run build
	@echo "Collecting static files..."
	cd backend && python manage.py collectstatic --noinput

# Run tests
test:
	@echo "Running frontend tests..."
	npm test || true
	@echo "Running backend tests..."
	cd backend && python manage.py test || true

# Lint code
lint:
	@echo "Linting frontend code..."
	npm run lint
	@echo "Linting backend code..."
	cd backend && pylint api/ || true

# Format code
format:
	@echo "Formatting frontend code..."
	npm run format
	@echo "Formatting backend code..."
	cd backend && black . || true

# Type check
type-check:
	@echo "Running TypeScript type check..."
	npm run type-check

# Docker commands
docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-build:
	@echo "Building Docker images..."
	docker-compose build

# Setup environment files
setup-env:
	@echo "Creating environment files..."
	@test -f .env.local || cp .env.example .env.local
	@test -f backend/.env || cp backend/.env.example backend/.env
	@echo "Environment files created. Please edit them with your configuration."

# Database operations
migrate:
	@echo "Running database migrations..."
	cd backend && python manage.py migrate

migrations:
	@echo "Creating migrations..."
	cd backend && python manage.py makemigrations

superuser:
	@echo "Creating superuser..."
	cd backend && python manage.py createsuperuser

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/.cache/
	find . -type d -name __pycache__ -exec rm -rf {} + || true
	find . -type f -name "*.pyc" -delete || true
	cd backend && rm -rf staticfiles/

# Backup database
backup:
	@echo "Backing up database..."
	mkdir -p backups
	cd backend && python manage.py dumpdata > ../backups/backup_$(shell date +%Y%m%d_%H%M%S).json

# Security checks
security:
	@echo "Running security checks..."
	npm audit
	cd backend && pip install safety && safety check -r requirements.txt || true

# Full setup for new developers
setup: setup-env install migrate
	@echo ""
	@echo "Setup complete! Next steps:"
	@echo "1. Edit .env.local and backend/.env with your configuration"
	@echo "2. Run 'make dev' to start development servers"
	@echo "3. Visit http://localhost:3000"
