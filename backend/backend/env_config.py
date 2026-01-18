# Environment-specific settings for Django backend

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def load_environment_config():
    """
    Load environment-specific configuration based on ENVIRONMENT variable
    """
    environment = os.getenv('ENVIRONMENT', 'dev')
    
    if environment == 'prod':
        return {
            'DEBUG': False,
            'ALLOWED_HOSTS': ['trinity-app.com', 'www.trinity-app.com', 'api.trinity-app.com'],
            'SECURE_SSL_REDIRECT': True,
            'SESSION_COOKIE_SECURE': True,
            'CSRF_COOKIE_SECURE': True,
            'SECURE_HSTS_SECONDS': 31536000,
            'SECURE_HSTS_INCLUDE_SUBDOMAINS': True,
            'SECURE_HSTS_PRELOAD': True,
            'DB_TIMEOUT': 20,
            'DB_CONN_MAX_AGE': 600,
        }
    else:  # dev
        return {
            'DEBUG': True,
            'ALLOWED_HOSTS': ['*'],
            'SECURE_SSL_REDIRECT': False,
            'SESSION_COOKIE_SECURE': False,
            'CSRF_COOKIE_SECURE': False,
            'DB_TIMEOUT': 5,
            'DB_CONN_MAX_AGE': 0,
        }

ENV_CONFIG = load_environment_config()
