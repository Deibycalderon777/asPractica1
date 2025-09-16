# ========================================
# 4. RUTAS DE AUTENTICACIÓN - routes/auth_routes.py
# ========================================

from flask import Blueprint, request, jsonify, session, render_template
from services.auth_service import AuthService
from datetime import timedelta, datetime
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

# Inicializar servicio
auth_service = AuthService()

@auth_bp.route('/login')
def login_page():
    """Renderizar página de login"""
    return render_template('login.html')

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Endpoint de login"""
    try:
        # Validar contenido JSON
        if not request.is_json:
            return jsonify({
                'success': False,
                'message': 'Contenido debe ser JSON'
            }), 400
        
        data = request.get_json()
        login_field = data.get('loginField', '').strip()
        password = data.get('password', '').strip()
        remember_me = data.get('rememberMe', False)
        
        # Validaciones
        if not login_field or not password:
            return jsonify({
                'success': False,
                'message': 'Todos los campos son obligatorios'
            }), 400
        
        # Autenticar usuario
        user = auth_service.authenticate_user(login_field, password)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Credenciales incorrectas'
            }), 401
        
        # Crear sesión
        session['user_id'] = user.Id
        session['username'] = user.Nombre_Usuario
        session['email'] = user.Correo_Electronico
        session['login_time'] = datetime.now().isoformat()
        
        if remember_me:
            session.permanent = True
        
        logger.info(f"Login exitoso para usuario: {user.Nombre_Usuario}")
        
        return jsonify({
            'success': True,
            'message': '¡Login exitoso!',
            'user': user.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error en login: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    """Endpoint de logout"""
    try:
        username = session.get('username', 'Usuario desconocido')
        session.clear()
        
        logger.info(f"Logout exitoso para usuario: {username}")
        
        return jsonify({
            'success': True,
            'message': 'Sesión cerrada exitosamente'
        })
    except Exception as e:
        logger.error(f"Error en logout: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al cerrar sesión'
        }), 500

@auth_bp.route('/api/profile', methods=['GET'])
def get_profile():
    """Obtener perfil del usuario actual"""
    try:
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'message': 'No autenticado'
            }), 401
        
        user = auth_service.get_user_by_id(session['user_id'])
        
        if not user:
            session.clear()  # Limpiar sesión si el usuario no existe
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'session_info': {
                'login_time': session.get('login_time'),
                'is_permanent': session.permanent
            }
        })
        
    except Exception as e:
        logger.error(f"Error en get_profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@auth_bp.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """Recuperación de contraseña"""
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'message': 'Contenido debe ser JSON'
            }), 400
        
        data = request.get_json()
        email = data.get('email', '').strip()
        
        if not email:
            return jsonify({
                'success': False,
                'message': 'Email es obligatorio'
            }), 400
        
        user = auth_service.find_user_by_email(email)
        
        if user:
            # En producción: generar token y enviar email real
            logger.info(f"Solicitud de recuperación de contraseña para: {email}")
            return jsonify({
                'success': True,
                'message': f'Se ha enviado un email de recuperación a {email}'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Email no encontrado en el sistema'
            }), 404
            
    except Exception as e:
        logger.error(f"Error en forgot_password: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500