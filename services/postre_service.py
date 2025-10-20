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
    
    # ===== NUEVOS MÉTODOS PARA GESTIÓN DE INGREDIENTES =====
    
    def agregar_ingrediente_a_postre(self, postre_id, ingrediente_id, cantidad):
        """
        Agregar un ingrediente a un postre
        
        Args:
            postre_id: ID del postre
            ingrediente_id: ID del ingrediente
            cantidad: Cantidad del ingrediente
            
        Returns:
            bool: True si se agregó correctamente
            
        Raises:
            ValueError: Si hay errores de validación
        """
        # Validaciones
        if not postre_id or not ingrediente_id or not cantidad:
            raise ValueError("Postre ID, Ingrediente ID y cantidad son requeridos")
        
        try:
            cantidad_float = float(cantidad)
            if cantidad_float <= 0:
                raise ValueError("La cantidad debe ser mayor a 0")
        except (ValueError, TypeError):
            raise ValueError("La cantidad debe ser un número válido")
        
        # Verificar si el ingrediente ya existe para este postre
        if self.repository.verificar_ingrediente_existe(postre_id, ingrediente_id):
            # Si ya existe, actualizar la cantidad
            resultado = self.repository.actualizar_cantidad_ingrediente(
                postre_id, ingrediente_id, cantidad_float
            )
        else:
            # Si no existe, agregarlo
            resultado = self.repository.agregar_ingrediente(
                postre_id, ingrediente_id, cantidad_float
            )
        
        if resultado:
            self.pusher.notificar_postres()
        
        return resultado
    
    def actualizar_ingrediente_postre(self, postre_id, ingrediente_id, cantidad):
        """
        Actualizar la cantidad de un ingrediente en un postre
        
        Args:
            postre_id: ID del postre
            ingrediente_id: ID del ingrediente
            cantidad: Nueva cantidad
            
        Returns:
            bool: True si se actualizó correctamente
        """
        if not cantidad or float(cantidad) <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        
        resultado = self.repository.actualizar_cantidad_ingrediente(
            postre_id, ingrediente_id, float(cantidad)
        )
        
        if resultado:
            self.pusher.notificar_postres()
        
        return resultado
    
    def eliminar_ingrediente_de_postre(self, postre_id, ingrediente_id):
        """
        Eliminar un ingrediente de un postre
        
        Args:
            postre_id: ID del postre
            ingrediente_id: ID del ingrediente
            
        Returns:
            bool: True si se eliminó correctamente
        """
        resultado = self.repository.eliminar_ingrediente(postre_id, ingrediente_id)
        
        if resultado:
            self.pusher.notificar_postres()
        
        return resultado
    
    def guardar_ingredientes_postre(self, postre_id, ingredientes):
        """
        Guardar múltiples ingredientes para un postre
        (Útil al crear o actualizar un postre con varios ingredientes)
        
        Args:
            postre_id: ID del postre
            ingredientes: Lista de diccionarios con 'ingrediente_id' y 'cantidad'
                         Ejemplo: [
                             {'ingrediente_id': 1, 'cantidad': 250},
                             {'ingrediente_id': 2, 'cantidad': 100}
                         ]
        
        Returns:
            dict: Resultado con éxitos y errores
        """
        if not ingredientes or not isinstance(ingredientes, list):
            return {
                'success': True,
                'agregados': 0,
                'errores': []
            }
        
        agregados = 0
        errores = []
        
        for ing in ingredientes:
            try:
                ingrediente_id = ing.get('ingrediente_id') or ing.get('id')
                cantidad = ing.get('cantidad')
                
                if not ingrediente_id or not cantidad:
                    errores.append({
                        'ingrediente': ing,
                        'error': 'Datos incompletos'
                    })
                    continue
                
                self.agregar_ingrediente_a_postre(postre_id, ingrediente_id, cantidad)
                agregados += 1
                
            except Exception as e:
                errores.append({
                    'ingrediente': ing,
                    'error': str(e)
                })
        
        return {
            'success': len(errores) == 0,
            'agregados': agregados,
            'errores': errores
        }
    
    def reemplazar_ingredientes_postre(self, postre_id, nuevos_ingredientes):
        """
        Reemplazar todos los ingredientes de un postre
        (Elimina los existentes y agrega los nuevos)
        
        Args:
            postre_id: ID del postre
            nuevos_ingredientes: Lista de ingredientes nuevos
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Primero eliminar todos los ingredientes actuales
            self.repository.eliminar_todos_ingredientes(postre_id)
            
            # Luego agregar los nuevos
            resultado = self.guardar_ingredientes_postre(postre_id, nuevos_ingredientes)
            
            if resultado['success']:
                self.pusher.notificar_postres()
            
            return resultado
            
        except Exception as e:
            raise ValueError(f"Error al reemplazar ingredientes: {str(e)}")
    
    def obtener_ingredientes_disponibles(self):
        """
        Obtener todos los ingredientes disponibles para agregar a postres
        
        Returns:
            list: Lista de ingredientes disponibles
        """
        return self.repository.obtener_todos_ingredientes_disponibles()
    
    def validar_stock_ingredientes(self, postre_id):
        """
        Validar si hay suficiente stock de ingredientes para un postre
        
        Args:
            postre_id: ID del postre
            
        Returns:
            dict: Información sobre disponibilidad de ingredientes
        """
        ingredientes = self.repository.obtener_ingredientes(postre_id)
        
        ingredientes_insuficientes = []
        
        for ing in ingredientes:
            if ing.get('existencias', 0) < ing.get('cantidad', 0):
                ingredientes_insuficientes.append({
                    'ingrediente': ing.get('nombreIngrediente'),
                    'necesario': ing.get('cantidad'),
                    'disponible': ing.get('existencias')
                })
        
        return {
            'tiene_stock': len(ingredientes_insuficientes) == 0,
            'ingredientes_insuficientes': ingredientes_insuficientes
        }