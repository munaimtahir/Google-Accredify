# VPS Deployment Checklist for AccrediFy

This document provides a comprehensive checklist of steps required before deploying AccrediFy to a VPS with a public IP address.

## Pre-Deployment Requirements

### 1. Domain and DNS Configuration ⚠️ CRITICAL

- [ ] **Purchase/Register Domain Name**
  - Register a domain (e.g., accredify.com) through a registrar
  - Ensure domain is active and paid for

- [ ] **Configure DNS A Record**
  - Point domain to VPS public IP address
  - Example: `accredify.com` → `123.45.67.89`
  - Example: `www.accredify.com` → `123.45.67.89`
  - Wait for DNS propagation (can take 24-48 hours, usually 1-2 hours)

- [ ] **Verify DNS Resolution**
  ```bash
  # Check DNS records
  nslookup accredify.com
  dig accredify.com
  ```

- [ ] **Update ALLOWED_HOSTS**
  - Set in `backend/.env`: `ALLOWED_HOSTS=accredify.com,www.accredify.com,YOUR_VPS_IP`
  - Verify Django settings reads from environment variable

---

### 2. VPS Server Setup ⚠️ CRITICAL

- [ ] **Provision VPS Instance**
  - Minimum: 2 CPU cores, 4GB RAM, 20GB storage
  - Recommended: 4 CPU cores, 8GB RAM, 50GB SSD
  - OS: Ubuntu 22.04 LTS (or similar)

- [ ] **Initial Server Configuration**
  ```bash
  # Update system
  sudo apt update && sudo apt upgrade -y
  
  # Install essential packages
  sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib \
    certbot python3-certbot-nginx git curl ufw fail2ban
  
  # Install Node.js 18.x
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  
  # Install Docker and Docker Compose (if using Docker)
  # Optional: See Docker deployment section
  ```

- [ ] **Create Application User**
  ```bash
  sudo useradd -m -s /bin/bash accredify
  sudo usermod -aG sudo accredify
  sudo su - accredify
  ```

- [ ] **Configure Firewall (UFW)**
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  sudo ufw status
  ```

- [ ] **Configure SSH Security**
  ```bash
  # Disable password authentication (use keys only)
  sudo nano /etc/ssh/sshd_config
  # Set: PasswordAuthentication no
  # Set: PermitRootLogin no
  sudo systemctl restart sshd
  ```

---

### 3. Database Setup ⚠️ CRITICAL

- [ ] **Install and Configure PostgreSQL**
  ```bash
  # PostgreSQL should already be installed
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  ```

- [ ] **Create Database and User**
  ```bash
  sudo -u postgres psql
  
  # In PostgreSQL shell:
  CREATE DATABASE accredify_db;
  CREATE USER accredify_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
  ALTER ROLE accredify_user SET client_encoding TO 'utf8';
  ALTER ROLE accredify_user SET default_transaction_isolation TO 'read committed';
  ALTER ROLE accredify_user SET timezone TO 'UTC';
  GRANT ALL PRIVILEGES ON DATABASE accredify_db TO accredify_user;
  \q
  ```

- [ ] **Update DATABASE_URL in backend/.env**
  ```env
  DATABASE_URL=postgresql://accredify_user:YOUR_PASSWORD@localhost:5432/accredify_db
  ```

- [ ] **Test Database Connection**
  ```bash
  psql -U accredify_user -d accredify_db -h localhost
  ```

---

### 4. Environment Configuration ⚠️ CRITICAL

- [ ] **Generate Secret Keys**
  ```bash
  # Generate Django SECRET_KEY
  python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
  
  # Save this key - you'll need it for backend/.env
  ```

- [ ] **Configure Backend Environment (backend/.env)**
  ```env
  DJANGO_SECRET_KEY=generated_secret_key_here
  DEBUG=False
  ALLOWED_HOSTS=accredify.com,www.accredify.com,YOUR_VPS_IP
  DATABASE_URL=postgresql://accredify_user:password@localhost:5432/accredify_db
  GEMINI_API_KEY=your_production_gemini_api_key
  CORS_ALLOWED_ORIGINS=https://accredify.com,https://www.accredify.com
  SECURE_SSL_REDIRECT=True
  MAX_UPLOAD_SIZE=10485760
  DJANGO_LOG_LEVEL=INFO
  ```

- [ ] **Configure Frontend Environment (.env.production)**
  ```env
  VITE_API_URL=https://accredify.com/api
  GEMINI_API_KEY=your_production_gemini_api_key
  ```

- [ ] **Secure Environment Files**
  ```bash
  # Ensure .env files are not publicly accessible
  chmod 600 backend/.env
  chmod 600 .env.production
  # Verify .env is in .gitignore
  ```

---

### 5. SSL/HTTPS Certificate ⚠️ CRITICAL

- [ ] **Obtain Let's Encrypt Certificate**
  ```bash
  # Install certbot (already done in step 2)
  # Stop nginx temporarily if running
  sudo systemctl stop nginx
  
  # Obtain certificate
  sudo certbot certonly --standalone -d accredify.com -d www.accredify.com
  
  # Or if nginx is configured:
  sudo certbot --nginx -d accredify.com -d www.accredify.com
  ```

- [ ] **Configure Auto-Renewal**
  ```bash
  # Test renewal
  sudo certbot renew --dry-run
  
  # Certbot automatically sets up renewal via systemd timer
  # Verify it's enabled
  sudo systemctl status certbot.timer
  ```

- [ ] **Update Nginx Configuration for SSL**
  - Modify `nginx/conf.d/default.conf` to include HTTPS server block
  - Redirect HTTP to HTTPS
  - Add SSL certificate paths

---

### 6. Nginx Configuration ⚠️ CRITICAL

- [ ] **Create Production Nginx Configuration**
  - Update `server_name` to your domain
  - Configure SSL certificates
  - Set up HTTP to HTTPS redirect
  - Configure static and media file serving
  - Set proper security headers

- [ ] **Deploy Nginx Configuration**
  ```bash
  # Copy config to nginx sites
  sudo cp nginx/conf.d/default.conf /etc/nginx/sites-available/accredify
  sudo ln -s /etc/nginx/sites-available/accredify /etc/nginx/sites-enabled/
  
  # Remove default site
  sudo rm /etc/nginx/sites-enabled/default
  
  # Test configuration
  sudo nginx -t
  
  # Start/reload nginx
  sudo systemctl restart nginx
  ```

---

### 7. Application Deployment

- [ ] **Clone Repository on VPS**
  ```bash
  cd /home/accredify
  git clone https://github.com/munaimtahir/Google-Accredify.git
  cd Google-Accredify
  ```

- [ ] **Set Up Backend**
  ```bash
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
  ```

- [ ] **Run Database Migrations**
  ```bash
  python manage.py migrate
  ```

- [ ] **Collect Static Files**
  ```bash
  python manage.py collectstatic --noinput
  ```

- [ ] **Create Superuser**
  ```bash
  python manage.py createsuperuser
  ```

- [ ] **Build Frontend for Production**
  ```bash
  cd /home/accredify/Google-Accredify
  npm ci
  # Set environment variables
  export $(cat .env.production | xargs)
  npm run build
  ```

---

### 8. Service Configuration (Systemd) ⚠️ CRITICAL

- [ ] **Create Gunicorn Service File**
  ```bash
  sudo nano /etc/systemd/system/accredify.service
  ```
  
  Content:
  ```ini
  [Unit]
  Description=AccrediFy Gunicorn daemon
  After=network.target postgresql.service
  
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

- [ ] **Create Log Directory**
  ```bash
  sudo mkdir -p /var/log/accredify
  sudo chown accredify:www-data /var/log/accredify
  ```

- [ ] **Start and Enable Service**
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl start accredify
  sudo systemctl enable accredify
  sudo systemctl status accredify
  ```

---

### 9. File Permissions and Security

- [ ] **Set Proper File Permissions**
  ```bash
  # Application files
  sudo chown -R accredify:accredify /home/accredify/Google-Accredify
  
  # Static files
  sudo chown -R accredify:www-data /home/accredify/Google-Accredify/backend/staticfiles
  sudo chmod -R 755 /home/accredify/Google-Accredify/backend/staticfiles
  
  # Media files
  sudo mkdir -p /home/accredify/Google-Accredify/backend/media
  sudo chown -R accredify:www-data /home/accredify/Google-Accredify/backend/media
  sudo chmod -R 755 /home/accredify/Google-Accredify/backend/media
  
  # Socket file
  sudo chmod 755 /home/accredify/Google-Accredify/accredify.sock
  ```

- [ ] **Configure Fail2Ban (Security)**
  ```bash
  # Fail2Ban should already be installed
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```

---

### 10. Production Build Verification

- [ ] **Verify Frontend Build**
  ```bash
  # Check dist directory exists and has files
  ls -la dist/
  ```

- [ ] **Test Health Endpoint**
  ```bash
  curl http://localhost:8000/api/health/
  # Should return: {"status": "healthy", "database": "connected"}
  ```

- [ ] **Verify Database Connection**
  ```bash
  cd backend
  source venv/bin/activate
  python manage.py dbshell
  # Should connect successfully
  ```

---

### 11. Security Hardening ⚠️ CRITICAL

- [ ] **Verify DEBUG=False**
  ```bash
  # Check backend/.env has DEBUG=False
  grep DEBUG backend/.env
  ```

- [ ] **Verify SECRET_KEY is Set**
  ```bash
  # Should NOT show default/insecure key
  grep SECRET_KEY backend/.env
  ```

- [ ] **Verify ALLOWED_HOSTS includes domain**
  ```bash
  grep ALLOWED_HOSTS backend/.env
  ```

- [ ] **Enable Security Headers in Nginx**
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Strict-Transport-Security (HSTS)
  - Content-Security-Policy (optional)

- [ ] **Disable Unnecessary Services**
  ```bash
  # Check what services are running
  sudo systemctl list-units --type=service --state=running
  ```

---

### 12. Backup Configuration ⚠️ CRITICAL

- [ ] **Create Backup Script**
  ```bash
  # Create backup directory
  mkdir -p /home/accredify/backups
  
  # Create backup script
  nano /home/accredify/backup.sh
  ```
  
  Script content:
  ```bash
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
  ```

- [ ] **Set Up Automated Backups**
  ```bash
  chmod +x /home/accredify/backup.sh
  
  # Add to crontab (runs daily at 2 AM)
  crontab -e
  # Add: 0 2 * * * /home/accredify/backup.sh
  ```

---

### 13. Monitoring and Logging

- [ ] **Set Up Log Rotation**
  ```bash
  sudo nano /etc/logrotate.d/accredify
  ```
  
  Content:
  ```
  /var/log/accredify/*.log {
      daily
      missingok
      rotate 14
      compress
      delaycompress
      notifempty
      create 0640 accredify www-data
      sharedscripts
  }
  ```

- [ ] **Set Up Monitoring (Optional but Recommended)**
  - Uptime monitoring: UptimeRobot, Pingdom
  - Error tracking: Sentry
  - Server monitoring: Prometheus + Grafana

---

### 14. Final Testing and Verification

- [ ] **Test HTTPS Access**
  ```bash
  # Test from local machine
  curl -I https://accredify.com
  # Should return 200 OK
  ```

- [ ] **Test API Endpoints**
  ```bash
  # Health check
  curl https://accredify.com/api/health/
  
  # Test authentication (should require credentials)
  curl https://accredify.com/api/projects/
  # Should return 401 Unauthorized
  ```

- [ ] **Test Frontend Access**
  - Open https://accredify.com in browser
  - Verify page loads
  - Check browser console for errors
  - Test login/registration

- [ ] **Verify SSL Certificate**
  - Check certificate validity
  - Verify HTTPS redirect works
  - Test from different browsers

---

### 15. Docker Deployment (Alternative) 🐳

If using Docker instead of manual deployment:

- [ ] **Install Docker and Docker Compose**
  ```bash
  # Install Docker
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  
  # Install Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  ```

- [ ] **Configure .env for Docker**
  - Create `.env` file in project root
  - Set all required environment variables
  - Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`

- [ ] **Build and Deploy with Docker**
  ```bash
  docker-compose --profile production up -d --build
  ```

- [ ] **Run Migrations**
  ```bash
  docker-compose exec backend python manage.py migrate
  docker-compose exec backend python manage.py collectstatic --noinput
  ```

---

## Post-Deployment Checklist

- [ ] **Create Initial Admin User**
  ```bash
  cd backend
  source venv/bin/activate
  python manage.py createsuperuser
  ```

- [ ] **Verify All Services Running**
  ```bash
  sudo systemctl status accredify
  sudo systemctl status nginx
  sudo systemctl status postgresql
  ```

- [ ] **Monitor Logs**
  ```bash
  # Application logs
  sudo journalctl -u accredify -f
  
  # Nginx logs
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  ```

- [ ] **Test Full Workflow**
  - User registration
  - User login
  - Create project
  - Upload evidence
  - Test AI features

---

## Common Issues and Solutions

### Issue: 502 Bad Gateway
**Solution:**
- Check Gunicorn service: `sudo systemctl status accredify`
- Check socket permissions
- Verify Nginx can access socket file

### Issue: Static Files Not Loading
**Solution:**
- Run `python manage.py collectstatic --noinput`
- Check Nginx static file configuration
- Verify file permissions

### Issue: SSL Certificate Errors
**Solution:**
- Verify DNS points to VPS
- Check certificate paths in Nginx config
- Renew certificate: `sudo certbot renew`

### Issue: Database Connection Failed
**Solution:**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL in .env
- Check PostgreSQL authentication settings

---

## Maintenance Tasks

- [ ] **Set Up Regular Updates**
  - Schedule monthly security updates
  - Monitor dependency vulnerabilities
  - Update packages regularly

- [ ] **Monitor Disk Space**
  ```bash
  df -h
  # Monitor backups directory size
  ```

- [ ] **Review Logs Weekly**
  - Check error logs for issues
  - Monitor access patterns
  - Review failed authentication attempts

---

## Estimated Time to Complete

- **Initial Setup**: 2-3 hours
- **Configuration**: 1-2 hours
- **Testing**: 30 minutes - 1 hour
- **Total**: 4-6 hours for first-time deployment

---

## Priority Levels

⚠️ **CRITICAL** - Must be completed before deployment
- Domain and DNS
- VPS setup
- Database configuration
- Environment variables
- SSL certificate
- Security hardening

🔶 **HIGH PRIORITY** - Should be completed for production
- Backup configuration
- Monitoring setup
- Service configuration
- File permissions

🔷 **RECOMMENDED** - Best practices
- Log rotation
- Fail2Ban configuration
- Automated backups
- Monitoring services

---

**Last Updated:** December 2024  
**Version:** 1.0.0

