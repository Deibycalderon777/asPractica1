# repositories/postre_repository.py - VERSIÓN MEJORADA
from config.database import DatabaseConfig
from models.postre import Postre

class PostreRepository:
    def __init__(self):
        self.db = DatabaseConfig()
    
    def obtener_todos(self):
        """Obtener últimos 10 postres"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            sql = """
            SELECT idPostre, nombrePostre, precio
            FROM postres
            ORDER BY idPostre DESC
            LIMIT 10 OFFSET 0
            """
            cursor.execute(sql)
            registros = cursor.fetchall()
            return [Postre.from_dict(r) for r in registros]
    
    def buscar(self, termino):
        """Buscar postres por nombre o precio"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            busqueda = f"%{termino}%"
            sql = """
            SELECT idPostre, nombrePostre, precio
            FROM postres
            WHERE nombrePostre LIKE %s OR precio LIKE %s
            ORDER BY idPostre DESC
            LIMIT 10 OFFSET 0
            """
            cursor.execute(sql, (busqueda, busqueda))
            registros = cursor.fetchall()
            return [Postre.from_dict(r) for r in registros]
    
    def obtener_por_id(self, id):
        """Obtener postre por ID"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            sql = "SELECT idPostre, nombrePostre, precio FROM postres WHERE idPostre = %s"
            cursor.execute(sql, (id,))
            registro = cursor.fetchone()
            return Postre.from_dict(registro) if registro else None
    
    def guardar(self, postre):
        """Guardar o actualizar postre"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
            
            if postre.id:
                # Actualizar
                sql = """
                UPDATE postres 
                SET nombrePostre = %s, precio = %s 
                WHERE idPostre = %s
                """
                cursor.execute(sql, (postre.nombre, postre.precio, postre.id))
                postre_id = postre.id
            else:
                # Insertar
                sql = "INSERT INTO postres (nombrePostre, precio) VALUES (%s, %s)"
                cursor.execute(sql, (postre.nombre, postre.precio))
                postre_id = cursor.lastrowid
            
            con.commit()
            return postre_id
    
    def eliminar(self, id):
        """Eliminar postre por ID"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
            
            # Primero eliminar los ingredientes asociados
            sql_ingredientes = "DELETE FROM postresingredientes WHERE idPostre = %s"
            cursor.execute(sql_ingredientes, (id,))
            
            # Luego eliminar el postre
            sql = "DELETE FROM postres WHERE idPostre = %s"
            cursor.execute(sql, (id,))
            con.commit()
            return cursor.rowcount > 0
    
    def obtener_ingredientes(self, postre_id):
        """Obtener ingredientes de un postre"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            sql = """
            SELECT p.nombrePostre, i.nombreIngrediente, 
                   pi.cantidad, i.existencias
            FROM postresingredientes pi
            INNER JOIN postres p ON p.idPostre = pi.idPostre
            INNER JOIN ingredientes i ON i.idIngrediente = pi.idIngrediente
            WHERE pi.idPostre = %s
            ORDER BY i.nombreIngrediente
            """
            cursor.execute(sql, (postre_id,))
            return cursor.fetchall()
    
    # ===== NUEVOS MÉTODOS PARA MANEJAR INGREDIENTES =====
    
    def agregar_ingrediente(self, postre_id, ingrediente_id, cantidad):
        """Agregar un ingrediente a un postre"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
            sql = """
            INSERT INTO postresingredientes (idPostre, idIngrediente, cantidad)
            VALUES (%s, %s, %s)
            """
            cursor.execute(sql, (postre_id, ingrediente_id, cantidad))
            con.commit()
            return True
    
    def actualizar_cantidad_ingrediente(self, postre_id, ingrediente_id, cantidad):
        """Actualizar cantidad de un ingrediente en un postre"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
            sql = """
            UPDATE postresingredientes 
            SET cantidad = %s 
            WHERE idPostre = %s AND idIngrediente = %s
            """
            cursor.execute(sql, (cantidad, postre_id, ingrediente_id))
            con.commit()
            return cursor.rowcount > 0
    
    def eliminar_ingrediente(self, postre_id, ingrediente_id):
        """Eliminar un ingrediente de un postre"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
            sql = "DELETE FROM postresingredientes WHERE idPostre = %s AND idIngrediente = %s"
            cursor.execute(sql, (postre_id, ingrediente_id))
            con.commit()
            return cursor.rowcount > 0
    
    def eliminar_todos_ingredientes(self, postre_id):
        """Eliminar todos los ingredientes de un postre"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
            sql = "DELETE FROM postresingredientes WHERE idPostre = %s"
            cursor.execute(sql, (postre_id,))
            con.commit()
            return True
    
    def verificar_ingrediente_existe(self, postre_id, ingrediente_id):
        """Verificar si un ingrediente ya está asociado a un postre"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            sql = """
            SELECT COUNT(*) as count 
            FROM postresingredientes 
            WHERE idPostre = %s AND idIngrediente = %s
            """
            cursor.execute(sql, (postre_id, ingrediente_id))
            resultado = cursor.fetchone()
            return resultado['count'] > 0
    
    def obtener_todos_ingredientes_disponibles(self):
        """Obtener todos los ingredientes disponibles para agregar"""
        with self.db.get_connection() as con:
            cursor = con.cursor(dictionary=True)
            sql = """
            SELECT idIngrediente, nombreIngrediente, existencias
            FROM ingredientes
            ORDER BY nombreIngrediente
            """
            cursor.execute(sql)
            return cursor.fetchall()