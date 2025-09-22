# models/usuario.py
import hashlib

class Usuario:
    def __init__(self, id=None, nombre_usuario=None, correo_electronico=None, contrasena=None):
        self.id = id
        self.nombre_usuario = nombre_usuario
        self.correo_electronico = correo_electronico
        self.contrasena = contrasena
    
    @classmethod
    def from_dict(cls, data):
        """Crear Usuario desde diccionario"""
        return cls(
            id=data.get('Id'),
            nombre_usuario=data.get('Nombre_Usuario'),
            correo_electronico=data.get('Correo_Electronico'),
            contrasena=data.get('Contrasena')
        )
    
    def to_dict(self):
        """Convertir a diccionario para JSON"""
        return {
            'Id': self.id,
            'Nombre_Usuario': self.nombre_usuario,
            'Correo_Electronico': self.correo_electronico,
            'Contrasena': self.contrasena
        }
    
    @staticmethod
    def hash_password(password):
        """Hashear contraseña usando SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password):
        """Verificar contraseña"""
        return self.contrasena == self.hash_password(password)
