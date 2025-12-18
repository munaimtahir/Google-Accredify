# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: security@accredify.example.com

**Note:** Before deploying to production, replace this email with your actual security contact email.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information (as much as you can provide):

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Security Best Practices

### For Developers

#### 1. Environment Variables

**Never commit sensitive data to the repository:**

```bash
# ❌ WRONG - Don't hardcode secrets
GEMINI_API_KEY = "AIzaSyC..."

# ✅ CORRECT - Use environment variables
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
```

**Always use `.env` files** and ensure they're in `.gitignore`

#### 2. Input Validation

**Backend (Django):**
```python
from django.core.validators import validate_email
from rest_framework import serializers

class ProjectSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=200, required=True)
    email = serializers.EmailField(validators=[validate_email])
    
    def validate_name(self, value):
        # Custom validation
        if len(value) < 3:
            raise serializers.ValidationError("Name too short")
        return value
```

**Frontend (TypeScript):**
```typescript
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

#### 3. File Upload Security

```python
from django.core.exceptions import ValidationError

ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.png']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file(file):
    # Check file size
    if file.size > MAX_FILE_SIZE:
        raise ValidationError('File too large')
    
    # Check file extension
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError('File type not allowed')
    
    # Check MIME type
    import magic
    mime = magic.from_buffer(file.read(1024), mime=True)
    file.seek(0)
    
    allowed_mimes = ['application/pdf', 'image/jpeg', 'image/png']
    if mime not in allowed_mimes:
        raise ValidationError('Invalid file type')
```

#### 4. Authentication & Authorization

**Implement proper authentication in production:**

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

**Add permission checks:**
```python
from rest_framework.permissions import BasePermission

class IsProjectOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
```

#### 5. SQL Injection Prevention

**Always use Django ORM** (provides built-in protection):

```python
# ✅ SAFE - Using ORM
Project.objects.filter(name=user_input)

# ❌ DANGEROUS - Raw SQL with user input
cursor.execute(f"SELECT * FROM projects WHERE name='{user_input}'")

# ✅ SAFE - Parameterized raw SQL if absolutely needed
cursor.execute("SELECT * FROM projects WHERE name=%s", [user_input])
```

#### 6. XSS Prevention

**React provides default protection**, but be careful with:

```typescript
// ❌ DANGEROUS
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ SAFE - React escapes by default
<div>{userInput}</div>

// ✅ SAFE - Use a sanitizer library if HTML is needed
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

#### 7. CSRF Protection

Django provides CSRF protection by default. Ensure it's enabled:

```python
# settings.py
MIDDLEWARE = [
    'django.middleware.csrf.CsrfViewMiddleware',  # Keep this
    # ...
]

# For API endpoints, use CSRF tokens or exempt read-only endpoints
from django.views.decorators.csrf import csrf_exempt
```

#### 8. Rate Limiting

```python
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class BurstRateThrottle(UserRateThrottle):
    rate = '60/min'

class SustainedRateThrottle(UserRateThrottle):
    rate = '1000/day'

# In views
class ProjectViewSet(viewsets.ModelViewSet):
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]
```

### For Deployment

#### 1. HTTPS Only

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}

# Force HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

#### 2. Security Headers

```python
# settings.py
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
```

**In Nginx:**
```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

#### 3. Environment Configuration

**Production settings:**
```python
# settings.py
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# Use strong secret key
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

#### 4. Dependency Management

**Keep dependencies updated:**
```bash
# Python
pip install --upgrade pip
pip list --outdated
pip install -U package-name

# Node.js
npm outdated
npm update
npm audit fix
```

**Regular security audits:**
```bash
# Python
pip install safety
safety check

# Node.js
npm audit
npm audit fix
```

#### 5. API Key Security

**Rotate API keys regularly:**
- Change API keys every 90 days
- Use different keys for dev/staging/production
- Implement key rotation without downtime

**Monitor API usage:**
- Track API calls to detect unusual patterns
- Set up alerts for suspicious activity
- Review access logs regularly

#### 6. Backup Security

```bash
# Encrypt backups
gpg --encrypt --recipient admin@example.com backup.sql

# Secure backup storage
chmod 600 /backups/*
chown backup-user:backup-user /backups/*

# Use secure protocols for remote backups
rsync -avz -e "ssh -i /path/to/key" /backups/ user@backup-server:/backups/
```

## Security Checklist

### Development

- [ ] No secrets in code or version control
- [ ] Input validation on all user inputs
- [ ] Output encoding/escaping
- [ ] Parameterized database queries
- [ ] File upload restrictions
- [ ] Error handling doesn't expose sensitive info
- [ ] Dependencies up to date
- [ ] Security linting enabled

### Deployment

- [ ] HTTPS enabled with valid certificate
- [ ] DEBUG=False in production
- [ ] Strong SECRET_KEY configured
- [ ] Database credentials secured
- [ ] File permissions properly set
- [ ] Firewall configured
- [ ] Security headers enabled
- [ ] Rate limiting implemented
- [ ] Logging and monitoring enabled
- [ ] Regular backups configured
- [ ] Backup encryption enabled
- [ ] Intrusion detection enabled

### Ongoing

- [ ] Regular security audits
- [ ] Dependency updates (monthly)
- [ ] API key rotation (quarterly)
- [ ] Access log review (weekly)
- [ ] Penetration testing (annually)
- [ ] Security training for team
- [ ] Incident response plan documented
- [ ] Backup restoration tested

## Common Vulnerabilities to Avoid

### 1. Mass Assignment

```python
# ❌ DANGEROUS
project = Project(**request.data)

# ✅ SAFE - Use serializers
serializer = ProjectSerializer(data=request.data)
if serializer.is_valid():
    project = serializer.save()
```

### 2. Insecure Direct Object References

```python
# ❌ DANGEROUS - Any user can access any project
project = Project.objects.get(id=request.GET['id'])

# ✅ SAFE - Check ownership
project = Project.objects.get(id=request.GET['id'], owner=request.user)
```

### 3. Information Disclosure

```python
# ❌ DANGEROUS
except Exception as e:
    return JsonResponse({'error': str(e)})  # Might expose internals

# ✅ SAFE
except Exception as e:
    logger.error(f"Error: {e}")
    return JsonResponse({'error': 'An error occurred'}, status=500)
```

### 4. Insufficient Logging

```python
# ✅ Log security events
import logging
logger = logging.getLogger(__name__)

# Log authentication attempts
logger.info(f"Login attempt for user: {username}")

# Log access to sensitive resources
logger.warning(f"Unauthorized access attempt to project {project_id} by user {user_id}")

# Log errors with context
logger.error(f"Failed to process request", exc_info=True)
```

## Incident Response

### If a vulnerability is discovered:

1. **Assess the impact** - Determine severity and scope
2. **Contain the issue** - Temporarily disable affected features if needed
3. **Develop a fix** - Create and test a patch
4. **Deploy the fix** - Roll out to all environments
5. **Notify users** - If user data was affected, notify them
6. **Document** - Record what happened and how it was fixed
7. **Review** - Conduct post-mortem to prevent recurrence

### Incident Severity Levels

- **Critical**: Immediate action required (data breach, remote code execution)
- **High**: Fix within 24 hours (authentication bypass, privilege escalation)
- **Medium**: Fix within 1 week (information disclosure, DoS)
- **Low**: Fix in next release (minor information leak, configuration issue)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [React Security](https://react.dev/learn/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

## Contact

For security concerns, contact: security@accredify.example.com

**Note:** Update this email address with your actual security contact before production deployment.

---

**Last Updated:** January 2024  
**Version:** 1.0.0
