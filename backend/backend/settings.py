import os
from pathlib import Path
from datetime import timedelta
 
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-yv$^&b1-355p9j2vsvd9d_li58nb@hd6fuco@idie#8^2dkxo1'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Local
    'core',
    'orders',
    'payments',
    'users',
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

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

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
# https://docs.djangoproject.com/en/5.2/topics/i18n/

AUTH_USER_MODEL = 'users.User'
 
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True
 
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
 
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
 
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
 
# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 24,
}
 
# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}
 
# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True
 
# M-Pesa Configuration
MPESA_DEBUG = DEBUG  # When True, uses sandbox; when False, uses production
MPESA_CONSUMER_KEY = os.environ.get('MPESA_CONSUMER_KEY', 'your_consumer_key')
MPESA_CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET', 'your_consumer_secret')
MPESA_SHORTCODE = os.environ.get('MPESA_SHORTCODE', '174379')  # Sandbox default
MPESA_PASSKEY = os.environ.get('MPESA_PASSKEY', 'your_passkey')
MPESA_CALLBACK_URL = os.environ.get('MPESA_CALLBACK_URL', 'https://yourdomain.com/api/payments/mpesa/callback/')
 
# Delivery fee base rates (KSh) per county
DELIVERY_FEES = {
    # Central Kenya
    'Nairobi': 300,
    'Kiambu': 400,
    'Murang\'a': 600,
    'Nyeri': 700,
    'Kirinyaga': 650,
    # Rift Valley
    'Nakuru': 700,
    'Uasin Gishu': 900,
    'Trans Nzoia': 1000,
    'Kericho': 850,
    'Bomet': 900,
    # Coast
    'Mombasa': 1200,
    'Kilifi': 1300,
    'Kwale': 1400,
    'Taita Taveta': 1500,
    # Western
    'Kisumu': 900,
    'Kakamega': 1000,
    'Bungoma': 1100,
    'Siaya': 950,
    # Eastern
    'Meru': 800,
    'Embu': 700,
    'Kitui': 900,
    'Machakos': 600,
    'Makueni': 700,
    # North Eastern
    'Garissa': 1800,
    'Wajir': 2000,
    'Mandera': 2200,
}
 
# Pickup stations
PICKUP_STATIONS = {
    'nyeri': {'name': 'Nyeri Showroom', 'fee': 0, 'address': 'Nyeri Town'},
    'nakuru': {'name': 'Nakuru Showroom', 'fee': 0, 'address': 'Nakuru Town'},
    'nairobi': {'name': 'Nairobi Showroom | HQ', 'fee': 0, 'address': 'Ruiru, Behind Spur Mall'},
}
 
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'