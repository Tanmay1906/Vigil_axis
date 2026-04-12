import os
from flask import Flask, jsonify
from flask_cors import CORS
from .config import config_dict

def create_app(config_name=None):
    """
    Factory function to create and configure the Flask application context.
    
    Args:
        config_name (str): Specifies the environment type (e.g. 'development').
        
    Returns:
        Flask: The initialized Flask application.
    """
    # Environment-based config taking precedence
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_dict.get(config_name, config_dict['default']))
    
    # Enable lightweight CORS
    CORS(app)
    
    # Import and Register Core blueprints
    # Note: These imports assume that blueprints are named exactly as required
    # inside their respective route files.
    from .routes.evidence_routes import evidence_bp
    from .routes.verification_routes import verification_bp
    from .routes.report_routes import report_bp
    from .routes.audit_routes import audit_bp
    
    app.register_blueprint(evidence_bp, url_prefix='/api/v1/evidence')
    app.register_blueprint(verification_bp, url_prefix='/api/v1/verification')
    app.register_blueprint(report_bp, url_prefix='/api/v1/reports')
    app.register_blueprint(audit_bp, url_prefix='/api/v1/audit')

    # Basic error handling built globally
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad Request', 'message': str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': 'The requested resource does not exist.'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected error occurred.'}), 500

    @app.route('/health', methods=['GET'])
    def health_check():
        """Basic health check route built directly onto the app."""
        return jsonify({'status': 'healthy', 'service': 'VIGIL-AXIS Backend', 'env': config_name})

    return app
