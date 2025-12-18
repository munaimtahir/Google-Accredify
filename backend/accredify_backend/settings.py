"""
Django settings for accredify_backend project.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Optional: Sentry error tracking (enabled only if SENTRY_DSN is set)
SENTRY_DSN = (os.getenv('SENTRY_DSN') or '').strip()
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    def _env_float(name: str, default: float) -> float:
        raw = (os.getenv(name) or '').strip()
        if not raw:
            return default
        try:
            return float(raw)
        except ValueError:
            return default

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        environment=os.getenv('SENTRY_ENVIRONMENT', 'production'),
        traces_sample_rate=_env_float('SENTRY_TRACES_SAMPLE_RATE', 0.0),
        send_default_pii=os.getenv('SENTRY_SEND_DEFAULT_PII', 'False') == 'True',
    )

# SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY must be set via environment variable
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError(
        "DJANGO_SECRET_KEY environment variable is required. "
        "Generate one with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'"
    )

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# Allow the VPS public IP by default (override via ALLOWED_HOSTS env var).
ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv('ALLOWED_HOSTS', '172.237.95.120,localhost,127.0.0.1').split(',')
    if h.strip()
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Content Security Policy (CSP) - production only
if not DEBUG:
    # Add CSP middleware early so headers are applied consistently.
    MIDDLEWARE = ['csp.middleware.CSPMiddleware', *MIDDLEWARE]

    # Conservative defaults suitable for a single-origin React SPA.
    # If your frontend calls Gemini directly, connect-src allows Google APIs.
    CSP_DEFAULT_SRC = ("'self'",)
    CSP_BASE_URI = ("'self'",)
    CSP_FORM_ACTION = ("'self'",)
    CSP_OBJECT_SRC = ("'none'",)
    CSP_FRAME_ANCESTORS = ("'none'",)

    CSP_SCRIPT_SRC = ("'self'",)
    CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
    CSP_IMG_SRC = ("'self'", "data:", "blob:")
    CSP_FONT_SRC = ("'self'", "data:")
    CSP_CONNECT_SRC = (
        "'self'",
        "https://generativelanguage.googleapis.com",
        "https://*.googleapis.com",
    )

ROOT_URLCONF = 'accredify_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'accredify_backend.wsgi.application'

# Database
import dj_database_url

DATABASE_URL = (os.getenv('DATABASE_URL') or '').strip()
DB_CONN_MAX_AGE = int(os.getenv('DB_CONN_MAX_AGE', '600'))

# Fail fast in production: require PostgreSQL DATABASE_URL when DEBUG=False.
if not DEBUG:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required when DEBUG=False (production).")
    if not DATABASE_URL.startswith(('postgres://', 'postgresql://')):
        raise ValueError("Production requires a PostgreSQL DATABASE_URL (postgres:// or postgresql://).")

    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=DB_CONN_MAX_AGE),
    }
else:
    # Local development: allow SQLite when DATABASE_URL is not provided.
    if DATABASE_URL:
        DATABASES = {
            'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=DB_CONN_MAX_AGE),
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Cache (Redis optional)
REDIS_URL = (os.getenv('REDIS_URL') or '').strip()
AI_CACHE_TTL = int(os.getenv('AI_CACHE_TTL', '3600'))

if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            },
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'accredify-locmem',
        }
    }

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': None,
    # Rate limiting configuration
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',  # Anonymous users: 100 requests per hour
        'user': '1000/hour',  # Authenticated users: 1000 requests per hour
        'ai_endpoint': '30/hour',  # AI endpoints: 30 requests per hour (stricter)
    },
}

# OpenAPI / Swagger configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'AccrediFy API',
    'DESCRIPTION': 'AccrediFy backend API (Django REST Framework).',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Configuration
def _csv_env(name: str, default: str = '') -> list[str]:
    value = os.getenv(name, default)
    # Split on commas, trim whitespace, drop empties
    return [v.strip() for v in value.split(',') if v.strip()]


# Frontend origins that are allowed to call the API from a browser.
# Override in production via CORS_ALLOWED_ORIGINS.
CORS_ALLOWED_ORIGINS = _csv_env(
    'CORS_ALLOWED_ORIGINS',
    # Local dev + VPS IP (http/https)
    'http://localhost:3000,http://127.0.0.1:3000,'
    'http://localhost:5173,http://127.0.0.1:5173,'
    'http://172.237.95.120,https://172.237.95.120',
)

CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins (needed when serving over HTTPS behind a reverse proxy).
# Must include scheme, e.g. https://yourdomain.com
CSRF_TRUSTED_ORIGINS = _csv_env(
    'CSRF_TRUSTED_ORIGINS',
    # Safe defaults for local + VPS IP (set to your real domain in production)
    'http://localhost,http://127.0.0.1,http://172.237.95.120,https://172.237.95.120',
)

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv('MAX_UPLOAD_SIZE', str(10 * 1024 * 1024)))
DATA_UPLOAD_MAX_MEMORY_SIZE = FILE_UPLOAD_MAX_MEMORY_SIZE

# Logging Configuration
DJANGO_LOG_LEVEL = os.getenv('DJANGO_LOG_LEVEL', 'INFO').upper()
LOG_DIR = Path(os.getenv('DJANGO_LOG_DIR', str(BASE_DIR / 'logs')))
LOG_DIR.mkdir(parents=True, exist_ok=True)

APP_LOG_FILE = os.getenv('DJANGO_APP_LOG_FILE', str(LOG_DIR / 'app.log'))
ERROR_LOG_FILE = os.getenv('DJANGO_ERROR_LOG_FILE', str(LOG_DIR / 'error.log'))

LOG_ROTATE_WHEN = os.getenv('DJANGO_LOG_ROTATE_WHEN', 'midnight')
LOG_BACKUP_COUNT = int(os.getenv('DJANGO_LOG_BACKUP_COUNT', '30'))

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '[{levelname}] {asctime} {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'filename': APP_LOG_FILE,
            'when': LOG_ROTATE_WHEN,
            'backupCount': LOG_BACKUP_COUNT,
            'encoding': 'utf-8',
            'utc': True,
            'formatter': 'simple',
        },
        'error_file': {
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'filename': ERROR_LOG_FILE,
            'when': LOG_ROTATE_WHEN,
            'backupCount': LOG_BACKUP_COUNT,
            'encoding': 'utf-8',
            'utc': True,
            'formatter': 'simple',
            'level': 'ERROR',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': DJANGO_LOG_LEVEL,
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': DJANGO_LOG_LEVEL,
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'api': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# Security Settings for Production
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
    # If running behind a reverse proxy (nginx) that terminates TLS, trust X-Forwarded-Proto.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HSTS (enable only when you are confident HTTPS is correctly configured)
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '0'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'True') == 'True'
    SECURE_HSTS_PRELOAD = os.getenv('SECURE_HSTS_PRELOAD', 'False') == 'True'
