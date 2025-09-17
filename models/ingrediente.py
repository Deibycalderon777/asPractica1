# models/ingrediente.py
class Ingrediente:
    def __init__(self, id=None, nombre=None, existencias=None):
        self.id = id
        self.nombre = nombre
        self.existencias = existencias
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data.get('idIngrediente'),
            nombre=data.get('nombreIngrediente'),
            existencias=data.get('existencias')
        )
    
    def to_dict(self):
        return {
            'idIngrediente': self.id,
            'nombreIngrediente': self.nombre,
            'existencias': self.existencias
        }