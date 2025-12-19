# Deployment Guide

This guide covers deploying AccrediFy to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Cloud Platform Deployment](#cloud-platform-deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space
- Ubuntu 20.04 LTS or similar

**Recommended:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage
- Ubuntu 22.04 LTS

### Required Software

- **Node.js** 18.x or higher
- **Python** 3.9 or higher
- **PostgreSQL** 14 or higher
- **Nginx** (for reverse proxy)
- **Git**
- **SSL Certificate** (Let's Encrypt recommended)

### Required Services

- **Google Gemini API** account with API key
- **Google Drive API** credentials (optional, for Drive integration)
- **Domain name** with DNS configured

---

## Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib certbot python3-certbot-nginx git curl

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version
python3 --version
psql --version
nginx -v
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE accredify_db;
CREATE USER accredify_user WITH PASSWORD 'your_secure_password';
ALTER ROLE accredify_user SET client_encoding TO 'utf8';
ALTER ROLE accredify_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE accredify_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE accredify_db TO accredify_user;

# Exit PostgreSQL
\q
```

### 3. Application User

```bash
# Create application user
sudo useradd -m -s /bin/bash accredify
sudo usermod -aG sudo accredify

# Switch to application user
sudo su - accredify
```

### 4. Clone Repository

```bash
cd /home/accredify
git clone https://github.com/munaimtahir/Google-Accredify.git
cd Google-Accredify
```

---

## Docker Deployment

### Admin panel access (production)

- **Via nginx (recommended):** `http://<your-domain-or-ip>/admin/`
- **Via direct Django port (enabled if you publish 8000):** `http://<your-domain-or-ip>:8000/admin/`

### 1. Create Docker Configuration

Create `Dockerfile` in the project root:

```dockerfile
# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend stage
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-build /app/dist ./static

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "python backend/manage.py migrate && gunicorn --chdir backend --bind 0.0.0.0:8000 accredify_backend.wsgi:application"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=accredify_db
      - POSTGRES_USER=accredify_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

  web:
    build: .
    command: gunicorn --chdir backend --bind 0.0.0.0:8000 --workers 4 accredify_backend.wsgi:application
    volumes:
      - ./backend:/app/backend
      - static_volume:/app/static
      - media_volume:/app/media
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://accredify_user:${DB_PASSWORD}@db:5432/accredify_db
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - DEBUG=False
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
    depends_on:
      - db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - static_volume:/var/www/static
      - media_volume:/var/www/media
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### 2. Environment Configuration

For Docker Compose, use the template and create your secret file:

```bash
# Copy the template
cp compose.env.example compose.env

# Edit compose.env with your real values (this file is gitignored)
# Set GEMINI_API_KEY=your_actual_key_here to enable AI features
```

Or create `.env` file (Docker Compose auto-loads `.env` from repo root):

```env
DB_PASSWORD=your_secure_db_password
DJANGO_SECRET_KEY=your_very_long_random_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### 3. Deploy with Docker

```bash
# Build and start containers
docker-compose up -d --build

# Run migrations
docker-compose exec web python backend/manage.py migrate

# Create superuser
docker-compose exec web python backend/manage.py createsuperuser

# Collect static files
docker-compose exec web python backend/manage.py collectstatic --noinput

# View logs
docker-compose logs -f
```

### Automatic superuser creation (non-interactive)

If you want the Docker deployment to automatically create the Django admin user on startup, set these environment variables (recommended to put in your `.env` on the server):

```env
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=change-me-to-a-strong-password
```

---

## Manual Deployment

### 1. Backend Setup

```bash
cd /home/accredify/Google-Accredify/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://accredify_user:your_password@localhost:5432/accredify_db
DJANGO_SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
GEMINI_API_KEY=your_gemini_api_key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
EOF

# Update Django settings to use environment variables
# (Ensure settings.py reads from environment)

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### 2. Frontend Build

```bash
cd /home/accredify/Google-Accredify

# Install dependencies
npm ci

# Create production environment file (if custom API URL needed)
cat > .env.production << EOF
VITE_API_URL=https://yourdomain.com/api
EOF

# Note: GEMINI_API_KEY is only needed in backend/.env or Docker Compose .env file

# Build frontend
npm run build
```

### 3. Gunicorn Setup

Create `/etc/systemd/system/accredify.service`:

```ini
[Unit]
Description=AccrediFy Gunicorn daemon
After=network.target

[Service]
User=accredify
Group=www-data
WorkingDirectory=/home/accredify/Google-Accredify/backend
Environment="PATH=/home/accredify/Google-Accredify/backend/venv/bin"
EnvironmentFile=/home/accredify/Google-Accredify/backend/.env
ExecStart=/home/accredify/Google-Accredify/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind unix:/home/accredify/Google-Accredify/accredify.sock \
    --timeout 120 \
    --access-logfile /var/log/accredify/access.log \
    --error-logfile /var/log/accredify/error.log \
    accredify_backend.wsgi:application

[Install]
WantedBy=multi-user.target
```

Create log directory:
```bash
sudo mkdir -p /var/log/accredify
sudo chown accredify:www-data /var/log/accredify
```

Start Gunicorn:
```bash
sudo systemctl start accredify
sudo systemctl enable accredify
sudo systemctl status accredify
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/accredify`:

```nginx
upstream accredify_backend {
    server unix:/home/accredify/Google-Accredify/accredify.sock fail_timeout=0;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    client_max_body_size 100M;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    client_max_body_size 100M;
    
    # Frontend static files
    location / {
        root /home/accredify/Google-Accredify/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://accredify_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://accredify_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        alias /home/accredify/Google-Accredify/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /home/accredify/Google-Accredify/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/accredify /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate

```bash
# Obtain Let's Encrypt certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically by certbot
# Test renewal
sudo certbot renew --dry-run
```

---

## Cloud Platform Deployment

### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p python-3.11 accredify

# Create environment
eb create accredify-prod

# Deploy
eb deploy
```

### Google Cloud Platform (App Engine)

Create `app.yaml`:
```yaml
runtime: python311
entrypoint: gunicorn -b :$PORT accredify_backend.wsgi:application

env_variables:
  DJANGO_SECRET_KEY: "your-secret-key"
  GEMINI_API_KEY: "your-api-key"

handlers:
- url: /static
  static_dir: staticfiles/
- url: /.*
  script: auto
```

Deploy:
```bash
gcloud app deploy
```

### Heroku

```bash
# Create Procfile
echo "web: gunicorn --chdir backend accredify_backend.wsgi" > Procfile

# Create runtime.txt
echo "python-3.11.0" > runtime.txt

# Deploy
heroku create accredify-app
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
heroku run python backend/manage.py migrate
heroku run python backend/manage.py createsuperuser
```

### Vercel (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## Post-Deployment

### 1. Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Django `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` configured
- [ ] Database password is strong and secure
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key-based authentication enabled
- [ ] Regular security updates scheduled
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] File upload size limits set

### 2. Performance Optimization

```bash
# Enable Gzip compression in Nginx
# Add to server block:
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

# Enable caching
# Already included in the Nginx config above

# Database optimization
sudo -u postgres psql accredify_db
CREATE INDEX idx_indicator_status ON api_indicator(status);
CREATE INDEX idx_evidence_indicator ON api_evidence(indicator_id);
```

### 3. Backup Configuration

```bash
# Database backup script
cat > /home/accredify/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/accredify/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U accredify_user accredify_db | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Media files backup
tar -czf $BACKUP_DIR/media_backup_$TIMESTAMP.tar.gz /home/accredify/Google-Accredify/backend/media/

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /home/accredify/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/accredify/backup.sh
```

---

## Monitoring and Maintenance

### 1. Logging

```bash
# View application logs
sudo journalctl -u accredify -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View application error logs
tail -f /var/log/accredify/error.log
```

### 2. Monitoring Tools

**Recommended:**
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Performance**: New Relic, Datadog
- **Server monitoring**: Prometheus + Grafana

### 3. Health Checks

Add to Django (create `backend/api/health.py`):
```python
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        connection.ensure_connection()
        return JsonResponse({"status": "healthy", "database": "connected"})
    except Exception as e:
        return JsonResponse({"status": "unhealthy", "error": str(e)}, status=500)
```

### 4. Update Procedure

```bash
# 1. Backup database
/home/accredify/backup.sh

# 2. Pull latest code
cd /home/accredify/Google-Accredify
git pull origin main

# 3. Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# 4. Update frontend
cd ..
npm ci
npm run build

# 5. Restart services
sudo systemctl restart accredify
sudo systemctl restart nginx
```

---

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** Gunicorn not running or socket permission issue

**Solution:**
```bash
sudo systemctl status accredify
sudo systemctl restart accredify
sudo chmod 755 /home/accredify/Google-Accredify/accredify.sock
```

### Issue: Static files not loading

**Cause:** Static files not collected or Nginx misconfigured

**Solution:**
```bash
cd /home/accredify/Google-Accredify/backend
source venv/bin/activate
python manage.py collectstatic --noinput
sudo nginx -t
sudo systemctl reload nginx
```

### Issue: Database connection errors

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l
# Check DATABASE_URL in .env file
```

### Issue: High memory usage

**Solution:**
```bash
# Reduce Gunicorn workers
# Edit /etc/systemd/system/accredify.service
# Change --workers 4 to --workers 2
sudo systemctl daemon-reload
sudo systemctl restart accredify
```

### Issue: Slow AI responses

**Cause:** Google Gemini API rate limiting or network issues

**Solution:**
- Implement caching for common queries
- Add rate limiting on client side
- Consider upgrading Gemini API tier

---

## Scaling Considerations

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Add Redis caching

### Horizontal Scaling
- Load balancer with multiple app servers
- Separate database server
- CDN for static files
- Managed services (RDS, S3, etc.)

### Architecture for Scale

```
┌─────────────┐
│ CDN/Cloudflare │
└─────────────┘
       ↓
┌─────────────┐
│ Load Balancer │
└─────────────┘
       ↓
┌──────────────────────────┐
│ App Server 1 | App Server 2 │
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ PostgreSQL (Primary)     │
│ + Read Replicas          │
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ Redis Cache              │
└──────────────────────────┘
```

---

## Support

For deployment issues:
- Check logs first
- Review [ARCHITECTURE.md](ARCHITECTURE.md)
- Open GitHub issue with logs and configuration
- Contact: [Your support email]

---

**Last Updated:** January 2024
**Version:** 1.0.0
