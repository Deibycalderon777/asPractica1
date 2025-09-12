# python.exe -m venv .venv
# cd .venv/Scripts
# activate.bat
# py -m ensurepip --upgrade
# pip install -r requirements.txt

from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify, make_response
# se agrego la libreria/paquete de sesion de flask
from flask import session

import mysql.connector
import datetime
import pytz

from flask_cors import CORS, cross_origin

con = mysql.connector.connect(
    host="185.232.14.52",
    database="u760464709_23005089_bd",
    user="u760464709_23005089_usr",
    password=":Sa[MX~2l"
)

app = Flask(__name__)
# agrege esta linea de codigo para usar una clave secreta
app.secret_key = '25021996'
CORS(app)

def pusherPostres():
    import pusher
    
    pusher_client = pusher.Pusher(
      app_id="2049017",
      key="df675041e275bafce4a7",
      secret="e3e5eb065e55edc089f8",
      cluster="mt1",
      ssl=True
    )
    
    pusher_client.trigger("canalPostres", "eventoPostres", {"message": "Actualizar postres"})
    return make_response(jsonify({}))

def pusherIngredientes():
    import pusher
    
    pusher_client = pusher.Pusher(
      app_id="2046025",
      key="48294aad3f28c3669613", 
      secret="5c287b63141dae2934ef",
      cluster="us2",
      ssl=True
    )
    
    pusher_client.trigger("canalIngredientes", "eventoDeIngredientes", {"message": "Actualizar ingredientes"})
    return make_response(jsonify({}))

@app.route("/")
def index():
    if not con.is_connected():
        con.reconnect()
    con.close()
    return render_template("index.html")

@app.route("/app")
def app2():
    if not con.is_connected():
        con.reconnect()
    con.close()
    return "<h5>Hola, soy la view app</h5>"
@app.route("/login", methods=["POST"])
def login():
    if not con.is_connected():
        con.reconnect()
    
    usuario = request.form["usuario"]
    contrasena = request.form["contrasena"]
    
    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT Id, Nombre_Usuario, Correo_Electronico
    FROM usuarios 
    WHERE (Nombre_Usuario = %s OR Correo_Electronico = %s) 
    AND Contrasena = %s
    """
    
    cursor.execute(sql, (usuario, usuario, contrasena))
    usuario_encontrado = cursor.fetchone()
    con.close()
    
    if usuario_encontrado:
        # Guardar datos del usuario en la sesión
        session['user_id'] = usuario_encontrado['Id']
        session['username'] = usuario_encontrado['Nombre_Usuario']
        session['email'] = usuario_encontrado['Correo_Electronico']
        session['logged_in'] = True
        
        return make_response(jsonify({
            "success": True, 
            "message": "Login exitoso",
            "user": {
                "id": usuario_encontrado['Id'],
                "username": usuario_encontrado['Nombre_Usuario'],
                "email": usuario_encontrado['Correo_Electronico']
            }
        }))
    else:
        return make_response(jsonify({
            "success": False, 
            "message": "Usuario o contraseña incorrectos"
        }), 401)

# NUEVA RUTA PARA LOGOUT - Agregar esto a tu app.py
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return make_response(jsonify({
        "success": True, 
        "message": "Logout exitoso"
    }))

# NUEVA RUTA PARA VERIFICAR SESIÓN - Agregar esto a tu app.py
@app.route("/verificar_sesion", methods=["GET"])
def verificar_sesion():
    if 'logged_in' in session and session['logged_in']:
        return make_response(jsonify({
            "logged_in": True,
            "user": {
                "id": session.get('user_id'),
                "username": session.get('username'),
                "email": session.get('email')
            }
        }))
    else:
        return make_response(jsonify({
            "logged_in": False
        }))
# RUTAS PARA POSTRES
@app.route("/postres")
def postres():
    return render_template("postres.html")

@app.route("/tbodyPostres")
def tbodyPostres():
    if not con.is_connected():
        con.reconnect()

    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT idPostre,
           nombrePostre,
           precio
    FROM postres
    ORDER BY idPostre DESC
    LIMIT 10 OFFSET 0
    """

    cursor.execute(sql)
    registros = cursor.fetchall()
    con.close()

    return render_template("tbodyPostres.html", postres=registros)

@app.route("/postre", methods=["POST"])
def guardarPostre():
    if not con.is_connected():
        con.reconnect()

    idPostre = request.form["idPostre"]
    nombrePostre = request.form["nombrePostre"]
    precio = request.form["precio"]
    
    cursor = con.cursor()

    if idPostre:
        # Actualizar
        sql = """
        UPDATE postres
        SET nombrePostre = %s,
            precio = %s
        WHERE idPostre = %s
        """
        val = (nombrePostre, precio, idPostre)
    else:
        # Insertar
        sql = """
        INSERT INTO postres (nombrePostre, precio)
        VALUES (%s, %s)
        """
        val = (nombrePostre, precio)
    
    cursor.execute(sql, val)
    con.commit()
    con.close()

    pusherPostres()
    
    return make_response(jsonify({"success": True, "message": "Postre guardado correctamente"}))

@app.route("/postres/ingredientes/<int:id>")
def postresIngredientes(id):
    if not con.is_connected():
        con.reconnect()

    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT p.nombrePostre, 
           i.nombreIngrediente, 
           pi.cantidad,
           i.existencias
    FROM postresingredientes pi
    INNER JOIN postres p ON p.idPostre = pi.idPostre
    INNER JOIN ingredientes i ON i.idIngrediente = pi.idIngrediente
    WHERE pi.idPostre = %s
    ORDER BY i.nombreIngrediente
    """

    cursor.execute(sql, (id,))
    registros = cursor.fetchall()
    con.close()

    return render_template("modal.html", postresIngredientes=registros)

@app.route("/postre/<int:id>")
def editarPostre(id):
    if not con.is_connected():
        con.reconnect()

    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT idPostre, nombrePostre, precio
    FROM postres
    WHERE idPostre = %s
    """
    
    cursor.execute(sql, (id,))
    registros = cursor.fetchall()
    con.close()

    return make_response(jsonify(registros))

@app.route("/postre/eliminar", methods=["POST"])
def eliminarPostre():
    if not con.is_connected():
        con.reconnect()

    id = request.form["id"]

    cursor = con.cursor()
    sql = """
    DELETE FROM postres
    WHERE idPostre = %s
    """
    
    cursor.execute(sql, (id,))
    con.commit()
    con.close()

    pusherPostres()
    return make_response(jsonify({"success": True, "message": "Postre eliminado"}))

# RUTAS PARA INGREDIENTES
@app.route("/ingredientes")
def ingredientes():
    return render_template("ingredientes.html")

@app.route("/tbodyIngredientes")
def tbodyIngredientes():
    if not con.is_connected():
        con.reconnect()

    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT idIngrediente,
           nombreIngrediente,
           existencias
    FROM ingredientes
    ORDER BY idIngrediente DESC
    LIMIT 10 OFFSET 0
    """

    cursor.execute(sql)
    registros = cursor.fetchall()
    con.close()

    return render_template("tbodyIngredientes.html", ingredientes=registros)

@app.route("/ingrediente", methods=["POST"])
def guardarIngrediente():
    if not con.is_connected():
        con.reconnect()

    idIngrediente = request.form["idIngrediente"]
    nombreIngrediente = request.form["nombreIngrediente"]
    existencias = request.form["existencias"]
    
    cursor = con.cursor()

    if idIngrediente:
        # Actualizar
        sql = """
        UPDATE ingredientes
        SET nombreIngrediente = %s,
            existencias = %s
        WHERE idIngrediente = %s
        """
        val = (nombreIngrediente, existencias, idIngrediente)
    else:
        # Insertar
        sql = """
        INSERT INTO ingredientes (nombreIngrediente, existencias)
        VALUES (%s, %s)
        """
        val = (nombreIngrediente, existencias)
    
    cursor.execute(sql, val)
    con.commit()
    con.close()

    pusherIngredientes()
    
    return make_response(jsonify({"success": True, "message": "Ingrediente guardado correctamente"}))

@app.route("/ingrediente/<int:id>")
def editarIngrediente(id):
    if not con.is_connected():
        con.reconnect()

    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT idIngrediente, nombreIngrediente, existencias
    FROM ingredientes
    WHERE idIngrediente = %s
    """
    
    cursor.execute(sql, (id,))
    registros = cursor.fetchall()
    con.close()

    return make_response(jsonify(registros))

@app.route("/ingrediente/eliminar", methods=["POST"])
def eliminarIngrediente():
    if not con.is_connected():
        con.reconnect()

    id = request.form["id"]

    cursor = con.cursor()
    sql = """
    DELETE FROM ingredientes
    WHERE idIngrediente = %s
    """
    
    cursor.execute(sql, (id,))
    con.commit()
    con.close()

    pusherIngredientes()
    return make_response(jsonify({"success": True, "message": "Ingrediente eliminado"}))

# RUTAS PARA BÚSQUEDAS
@app.route("/postres/buscar", methods=["GET"])
def buscarPostres():
    if not con.is_connected():
        con.reconnect()

    args = request.args
    busqueda = args["busqueda"]
    busqueda = f"%{busqueda}%"
    
    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT idPostre,
           nombrePostre,
           precio
    FROM postres
    WHERE nombrePostre LIKE %s
    OR    precio LIKE %s
    ORDER BY idPostre DESC
    LIMIT 10 OFFSET 0
    """
    val = (busqueda, busqueda)

    try:
        cursor.execute(sql, val)
        registros = cursor.fetchall()
    except mysql.connector.errors.ProgrammingError as error:
        print(f"Error de programación en MySQL: {error}")
        registros = []
    finally:
        con.close()

    return make_response(jsonify(registros))

@app.route("/ingredientes/buscar", methods=["GET"])
def buscarIngredientes():
    if not con.is_connected():
        con.reconnect()

    args = request.args
    busqueda = args["busqueda"]
    busqueda = f"%{busqueda}%"
    
    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT idIngrediente,
           nombreIngrediente,
           existencias
    FROM ingredientes
    WHERE nombreIngrediente LIKE %s
    OR    existencias LIKE %s
    ORDER BY idIngrediente DESC
    LIMIT 10 OFFSET 0
    """
    val = (busqueda, busqueda)

    try:
        cursor.execute(sql, val)
        registros = cursor.fetchall()
    except mysql.connector.errors.ProgrammingError as error:
        print(f"Error de programación en MySQL: {error}")
        registros = []
    finally:
        con.close()

    return make_response(jsonify(registros))

if __name__ == "__main__":
    app.run(debug=True)




