import os

class Config:
    """Base configuration parameters shared across all environments."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'vigil-axis-placeholder-secret-key-change-in-prod')
    DEBUG = False
    TESTING = False

class DevelopmentConfig(Config):
    """Development specifics."""
    DEBUG = True
    # Placeholder for dev db url: SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'

class ProductionConfig(Config):
    """Production overrides."""
    DEBUG = False
    # Ensure SECRET_KEY is strictly checked in real production
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

# Config mapping dictionary
config_dict = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
