# ========================================
# 5. MIDDLEWARE DE AUTENTICACIÓN - middleware/auth_middleware.py  
# ========================================

from flask import session, jsonify
from functools import wraps
import logging

logger = logging.getLogger(__name__)

def require_auth(f):
    """Decorador para rutas que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            logger.warning("Acceso no autorizado a ruta protegida")
            return jsonify({
                'success': False,
                'message': 'Acceso no autorizado'
            }), 401
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Obtener usuario actual de la sesión"""
    if 'user_id' in session:
        return {
            'id': session['user_id'],
            'username': session['username'],
            'email': session['email'],
            'login_time': session.get('login_time')
        }
    return None
