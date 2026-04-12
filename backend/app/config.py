import os

class Config:
    """Base configuration parameters shared across all environments."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'vigil-axis-placeholder-secret-key-change-in-prod')
    DATABASE_URL = os.environ.get('DATABASE_URL')
    HASH_INDEX_DATABASE_URL = os.environ.get('HASH_INDEX_DATABASE_URL', DATABASE_URL)
    BLOCKCHAIN_RPC_URL = os.environ.get('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545')
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
