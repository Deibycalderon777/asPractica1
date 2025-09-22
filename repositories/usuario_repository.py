# repositories/usuario_repository.py
from config.database import DatabaseConfig
from models.usuario import Usuario

class UsuarioRepository:
    def __init__(self):
        self.db_config = DatabaseConfig()
    
    def find_by_username_or_email(self, username_or_email):
        """Buscar usuario por nombre de usuario o email"""
        with self.db_config.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            query = """
                SELECT Id, Nombre_Usuario, Correo_Electronico, Contrasena 
                FROM usuarios 
                WHERE Nombre_Usuario = %s OR Correo_Electronico = %s
            """
            cursor.execute(query, (username_or_email, username_or_email))
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                return Usuario.from_dict(result)
            return None
    
    def find_by_id(self, user_id):
        """Buscar usuario por ID"""
        with self.db_config.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            query = """
                SELECT Id, Nombre_Usuario, Correo_Electronico, Contrasena 
                FROM usuarios 
                WHERE Id = %s
            """
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                return Usuario.from_dict(result)
            return None
    
    def create_user(self, usuario):
        """Crear nuevo usuario"""
        with self.db_config.get_connection() as con:
            cursor = con.cursor()
            query = """
                INSERT INTO usuarios (Nombre_Usuario, Correo_Electronico, Contrasena) 
                VALUES (%s, %s, %s)
            """
            cursor.execute(query, (
                usuario.nombre_usuario,
                usuario.correo_electronico,
                usuario.contrasena
            ))
            con.commit()
            user_id = cursor.lastrowid
            cursor.close()
            return user_id
    
    def get_all_users(self):
        """Obtener todos los usuarios"""
        with self.db_config.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            query = "SELECT Id, Nombre_Usuario, Correo_Electronico FROM usuarios"
            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            
            return [Usuario.from_dict(row) for row in results]
