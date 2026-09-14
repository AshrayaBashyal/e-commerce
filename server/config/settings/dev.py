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


SPECTACULAR_SETTINGS = {
    # Basic API Metadata
    'TITLE': 'E-commerce',
    'DESCRIPTION': 'E-commerce API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    
    # UI Customization (Swagger & ReDoc)
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,  # Keeps the token saved after reloading the page
        'displayOperationId': True,
    },
    
    # Advanced Configurations
    'COMPONENT_SPLIT_REQUEST': True, # Separates Request and Response schemas in documentation
    'OAS_VERSION': '3.1.0',          
    
    # Hook for Authentication / Third-party apps
    # (drf-spectacular auto-detects most common packages like SimpleJWT)
}