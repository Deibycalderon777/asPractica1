# services/postre_service.py
from repositories.postre_repository import PostreRepository
from services.pusher_service import PusherService
from models.postre import Postre

class PostreService:
    def __init__(self):
        self.repository = PostreRepository()
        self.pusher = PusherService()
    
    def listar_postres(self):
        """Obtener lista de postres"""
        return self.repository.obtener_todos()
    
    def buscar_postres(self, termino):
        """Buscar postres por término"""
        if not termino or termino.strip() == "":
            return self.listar_postres()
        return self.repository.buscar(termino.strip())
    
    def obtener_postre(self, id):
        """Obtener un postre por ID"""
        return self.repository.obtener_por_id(id)
    
    def guardar_postre(self, datos):
        """Guardar o actualizar postre"""
        postre = Postre(
            id=datos.get('idPostre') if datos.get('idPostre') else None,
            nombre=datos.get('nombrePostre'),
            precio=datos.get('precio')
        )
        
        # Validaciones básicas
        if not postre.nombre or not postre.precio:
            raise ValueError("Nombre y precio son requeridos")
        
        resultado = self.repository.guardar(postre)
        if resultado:
            self.pusher.notificar_postres()
        return resultado
    
    def eliminar_postre(self, id):
        """Eliminar postre"""
        resultado = self.repository.eliminar(id)
        if resultado:
            self.pusher.notificar_postres()
        return resultado
    
    def obtener_ingredientes_postre(self, postre_id):
        """Obtener ingredientes de un postre"""
        return self.repository.obtener_ingredientes(postre_id)