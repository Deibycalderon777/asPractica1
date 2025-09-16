# ========================================
# 2. REPOSITORIO DE USUARIOS - repositories/usuario_repository.py
# ========================================

from config.database import DatabaseConfig
from models.usuario import Usuario
import mysql.connector
import logging

logger = logging.getLogger(__name__)

class UsuarioRepository:
    def __init__(self):
        self.db_config = DatabaseConfig()
    
    def find_by_username_or_email(self, login_field):
        """Buscar usuario por nombre de usuario o email"""
        try:
            with self.db_config.get_connection() as connection:
                cursor = connection.cursor(dictionary=True)
                query = """
                SELECT Id, Nombre_Usuario, Correo_Electronico, Contrasena 
                FROM usuarios 
                WHERE Nombre_Usuario = %s OR Correo_Electronico = %s
                """
                cursor.execute(query, (login_field, login_field))
                result = cursor.fetchone()
                return Usuario.from_dict(result) if result else None
        except mysql.connector.Error as error:
            logger.error(f"Error en find_by_username_or_email: {error}")
            return None
    
    def find_by_id(self, user_id):
        """Buscar usuario por ID"""
        try:
            with self.db_config.get_connection() as connection:
                cursor = connection.cursor(dictionary=True)
                query = "SELECT Id, Nombre_Usuario, Correo_Electronico FROM usuarios WHERE Id = %s"
                cursor.execute(query, (user_id,))
                result = cursor.fetchone()
                return Usuario.from_dict(result) if result else None
        except mysql.connector.Error as error:
            logger.error(f"Error en find_by_id: {error}")
            return None
    
    def find_by_email(self, email):
        """Buscar usuario por email"""
        try:
            with self.db_config.get_connection() as connection:
                cursor = connection.cursor(dictionary=True)
                query = "SELECT Id, Nombre_Usuario, Correo_Electronico FROM usuarios WHERE Correo_Electronico = %s"
                cursor.execute(query, (email,))
                result = cursor.fetchone()
                return Usuario.from_dict(result) if result else None
        except mysql.connector.Error as error:
            logger.error(f"Error en find_by_email: {error}")
            return None
    
    def update_last_login(self, user_id):
        """Actualizar último login (opcional)"""
        try:
            with self.db_config.get_connection() as connection:
                cursor = connection.cursor()
                # Si tienes columna ultimo_login en tu tabla
                # query = "UPDATE usuarios SET ultimo_login = NOW() WHERE Id = %s"
                # cursor.execute(query, (user_id,))
                # connection.commit()
                return True
        except mysql.connector.Error as error:
            logger.error(f"Error en update_last_login: {error}")
            return False
