# ========================================
# 1. MODELO DE USUARIO - models/usuario.py
# ========================================

from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class Usuario:
    Id: int
    Nombre_Usuario: str
    Correo_Electronico: str
    Contrasena: Optional[str] = None  # No exponer en respuestas
    ultimo_login: Optional[datetime] = None
    
    def to_dict(self, include_password=False):
        """Convertir a diccionario, excluyendo contraseña por defecto"""
        result = {
            'Id': self.Id,
            'Nombre_Usuario': self.Nombre_Usuario,
            'Correo_Electronico': self.Correo_Electronico
        }
        if include_password and self.Contrasena:
            result['Contrasena'] = self.Contrasena
        if self.ultimo_login:
            result['ultimo_login'] = self.ultimo_login
        return result
    
    @classmethod
    def from_dict(cls, data):
        """Crear instancia desde diccionario"""
        if not data:
            return None
        return cls(
            Id=data.get('Id'),
            Nombre_Usuario=data.get('Nombre_Usuario'),
            Correo_Electronico=data.get('Correo_Electronico'),
            Contrasena=data.get('Contrasena'),
            ultimo_login=data.get('ultimo_login')
        )
