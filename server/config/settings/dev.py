from .base import *
from .base import BASE_DIR, env
import dj_database_url


DEBUG = True
ALLOWED_HOSTS = ['*']

if (env('DB_ENGINE', default='sqlite')) == 'postgres':
    DATABASES={
        'default': dj_database_url.parse(env('DATABASE_URL'))
    }

else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',    # vite dev server
]
