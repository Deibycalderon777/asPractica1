# repositories/ingrediente_repository.py
from config.database import DatabaseConfig
from models.ingrediente import Ingrediente

class IngredienteRepository:
    def __init__(self):
        self.db = DatabaseConfig()
    
    def obtener_todos(self):
        """Obtener TODOS los ingredientes (SIN LÍMITE para el select)"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            sql = """
            SELECT idIngrediente, nombreIngrediente, existencias
            FROM ingredientes
            ORDER BY nombreIngrediente ASC
            """
            # NOTA: Sin LIMIT para obtener todos los ingredientes
            cursor.execute(sql)
            registros = cursor.fetchall()
            return [Ingrediente.from_dict(r) for r in registros]
    
    def obtener_ultimos_10(self):
        """Obtener últimos 10 ingredientes para la tabla principal"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            sql = """
            SELECT idIngrediente, nombreIngrediente, existencias
            FROM ingredientes
            ORDER BY idIngrediente DESC
            LIMIT 10 OFFSET 0
            """
            cursor.execute(sql)
            registros = cursor.fetchall()
            return [Ingrediente.from_dict(r) for r in registros]
    
    def buscar(self, termino):
        """Buscar ingredientes por nombre o existencias"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            busqueda = f"%{termino}%"
            sql = """
            SELECT idIngrediente, nombreIngrediente, existencias
            FROM ingredientes
            WHERE nombreIngrediente LIKE %s OR existencias LIKE %s
            ORDER BY idIngrediente DESC
            LIMIT 10 OFFSET 0
            """
            cursor.execute(sql, (busqueda, busqueda))
            registros = cursor.fetchall()
            return [Ingrediente.from_dict(r) for r in registros]
    
    def obtener_por_id(self, id):
        """Obtener ingrediente por ID"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            sql = "SELECT idIngrediente, nombreIngrediente, existencias FROM ingredientes WHERE idIngrediente = %s"
            cursor.execute(sql, (id,))
            registro = cursor.fetchone()
            return Ingrediente.from_dict(registro) if registro else None
    
    def guardar(self, ingrediente):
        """Guardar o actualizar ingrediente"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
            
            if ingrediente.id:
                # Actualizar
                sql = """
                UPDATE ingredientes 
                SET nombreIngrediente = %s, existencias = %s 
                WHERE idIngrediente = %s
                """
                cursor.execute(sql, (ingrediente.nombre, ingrediente.existencias, ingrediente.id))
            else:
                # Insertar
                sql = "INSERT INTO ingredientes (nombreIngrediente, existencias) VALUES (%s, %s)"
                cursor.execute(sql, (ingrediente.nombre, ingrediente.existencias))
            
            con.commit()
            return True
    
    def eliminar(self, id):
        """Eliminar ingrediente por ID"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
            sql = "DELETE FROM ingredientes WHERE idIngrediente = %s"
            cursor.execute(sql, (id,))
            con.commit()
            return cursor.rowcount > 0