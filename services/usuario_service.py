# services/usuario_service.py
from repositories.usuario_repository import UsuarioRepository
from models.usuario import Usuario

class UsuarioService:
    def __init__(self):
        self.usuario_repository = UsuarioRepository()
    
    def authenticate_user(self, username_or_email, password):
        """Autenticar usuario con credenciales"""
        try:
            # Buscar usuario por nombre de usuario o email
            usuario = self.usuario_repository.find_by_username_or_email(username_or_email)
            
            if not usuario:
                return {
                    'success': False,
                    'message': 'Usuario no encontrado',
                    'user': None
                }
            
            # Verificar contraseña
            if usuario.contrasena == password:  # Comparación directa ya que las contraseñas están en texto plano
                return {
                    'success': True,
                    'message': f'Bienvenido {usuario.nombre_usuario}',
                    'user': {
                        'id': usuario.id,
                        'nombre_usuario': usuario.nombre_usuario,
                        'correo_electronico': usuario.correo_electronico
                    }
                }
            else:
                return {
                    'success': False,
                    'message': 'Contraseña incorrecta',
                    'user': None
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error en la autenticación: {str(e)}',
                'user': None
            }
    
    def get_user_by_id(self, user_id):
        """Obtener usuario por ID"""
        try:
            usuario = self.usuario_repository.find_by_id(user_id)
            if usuario:
                return {
                    'success': True,
                    'user': {
                        'id': usuario.id,
                        'nombre_usuario': usuario.nombre_usuario,
                        'correo_electronico': usuario.correo_electronico
                    }
                }
            else:
                return {
                    'success': False,
                    'message': 'Usuario no encontrado'
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al obtener usuario: {str(e)}'
            }
    
    def create_user(self, nombre_usuario, correo_electronico, contrasena):
        """Crear nuevo usuario"""
        try:
            # Verificar si el usuario ya existe
            existing_user = self.usuario_repository.find_by_username_or_email(nombre_usuario)
            if existing_user:
                return {
                    'success': False,
                    'message': 'El usuario ya existe'
                }
            
            # Verificar si el email ya existe
            existing_email = self.usuario_repository.find_by_username_or_email(correo_electronico)
            if existing_email:
                return {
                    'success': False,
                    'message': 'El email ya está registrado'
                }
            
            # Crear nuevo usuario
            nuevo_usuario = Usuario(
                nombre_usuario=nombre_usuario,
                correo_electronico=correo_electronico,
                contrasena=contrasena  # Guardamos en texto plano como en la tabla
            )
            
            user_id = self.usuario_repository.create_user(nuevo_usuario)
            
            return {
                'success': True,
                'message': 'Usuario creado exitosamente',
                'user_id': user_id
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al crear usuario: {str(e)}'
            }
