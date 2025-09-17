# services/ingrediente_service.py
from repositories.ingrediente_repository import IngredienteRepository
from services.pusher_service import PusherService
from models.ingrediente import Ingrediente

class IngredienteService:
    def __init__(self):
        self.repository = IngredienteRepository()
        self.pusher = PusherService()
    
    def listar_ingredientes(self):
        """Obtener lista de ingredientes"""
        return self.repository.obtener_todos()
    
    def buscar_ingredientes(self, termino):
        """Buscar ingredientes por término"""
        if not termino or termino.strip() == "":
            return self.listar_ingredientes()
        return self.repository.buscar(termino.strip())
    
    def obtener_ingrediente(self, id):
        """Obtener un ingrediente por ID"""
        return self.repository.obtener_por_id(id)
    
    def guardar_ingrediente(self, datos):
        """Guardar o actualizar ingrediente"""
        ingrediente = Ingrediente(
            id=datos.get('idIngrediente') if datos.get('idIngrediente') else None,
            nombre=datos.get('nombreIngrediente'),
            existencias=datos.get('existencias')
        )
        
        # Validaciones básicas
        if not ingrediente.nombre or ingrediente.existencias is None:
            raise ValueError("Nombre y existencias son requeridos")
        
        resultado = self.repository.guardar(ingrediente)
        if resultado:
            self.pusher.notificar_ingredientes()
        return resultado
    
    def eliminar_ingrediente(self, id):
        """Eliminar ingrediente"""
        resultado = self.repository.eliminar(id)
        if resultado:
            self.pusher.notificar_ingredientes()
        return resultado