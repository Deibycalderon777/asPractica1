# models/postre.py
class Postre:
    def __init__(self, id=None, nombre=None, precio=None):
        self.id = id
        self.nombre = nombre
        self.precio = precio
    
    @classmethod
    def from_dict(cls, data):
        """Crear Postre desde diccionario"""
        return cls(
            id=data.get('idPostre'),
            nombre=data.get('nombrePostre'), 
            precio=data.get('precio')
        )
    
    def to_dict(self):
        """Convertir a diccionario para JSON"""
        return {
            'idPostre': self.id,
            'nombrePostre': self.nombre,
            'precio': self.precio
        }

