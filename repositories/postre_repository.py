# repositories/postre_repository.py
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
            else:
                # Insertar
                sql = "INSERT INTO postres (nombrePostre, precio) VALUES (%s, %s)"
                cursor.execute(sql, (postre.nombre, postre.precio))
            
            con.commit()
            return True
    
    def eliminar(self, id):
        """Eliminar postre por ID"""
        with self.db.get_connection() as con:
            cursor = con.cursor()
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