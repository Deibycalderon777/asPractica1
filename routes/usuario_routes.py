# routes/usuario_routes.py
from flask import Blueprint, request, jsonify, session
from services.usuario_service import UsuarioService

usuario_bp = Blueprint('usuario', __name__)
usuario_service = UsuarioService()

@usuario_bp.route('/api/login', methods=['POST'])
def login():
    """Endpoint para autenticación de usuarios"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos'
            }), 400
        
        username_or_email = data.get('usuario')
        password = data.get('contrasena')
        
        if not username_or_email or not password:
            return jsonify({
                'success': False,
                'message': 'Usuario y contraseña son requeridos'
            }), 400
        
        # Autenticar usuario
        result = usuario_service.authenticate_user(username_or_email, password)
        
        if result['success']:
            # Guardar información del usuario en la sesión
            session['user_id'] = result['user']['id']
            session['username'] = result['user']['nombre_usuario']
            session['logged_in'] = True
            
            return jsonify(result), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@usuario_bp.route('/api/logout', methods=['POST'])
def logout():
    """Endpoint para cerrar sesión"""
    try:
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Sesión cerrada exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error al cerrar sesión: {str(e)}'
        }), 500

@usuario_bp.route('/api/user/current', methods=['GET'])
def get_current_user():
    """Obtener información del usuario actual"""
    try:
        if not session.get('logged_in'):
            return jsonify({
                'success': False,
                'message': 'No hay sesión activa'
            }), 401
        
        user_id = session.get('user_id')
        result = usuario_service.get_user_by_id(user_id)
        
        return jsonify(result), 200 if result['success'] else 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error al obtener usuario: {str(e)}'
        }), 500

@usuario_bp.route('/api/register', methods=['POST'])
def register():
    """Endpoint para registrar nuevos usuarios"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos'
            }), 400
        
        nombre_usuario = data.get('nombre_usuario')
        correo_electronico = data.get('correo_electronico')
        contrasena = data.get('contrasena')
        
        if not all([nombre_usuario, correo_electronico, contrasena]):
            return jsonify({
                'success': False,
                'message': 'Todos los campos son requeridos'
            }), 400
        
        # Crear usuario
        result = usuario_service.create_user(nombre_usuario, correo_electronico, contrasena)
        
        return jsonify(result), 201 if result['success'] else 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@usuario_bp.route('/api/check-session', methods=['GET'])
def check_session():
    """Verificar si hay una sesión activa"""
    try:
        if session.get('logged_in'):
            return jsonify({
                'success': True,
                'logged_in': True,
                'user': {
                    'id': session.get('user_id'),
                    'username': session.get('username')
                }
            }), 200
        else:
            return jsonify({
                'success': True,
                'logged_in': False
            }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error al verificar sesión: {str(e)}'
        }), 500
