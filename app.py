# app.py - COMPLETAMENTE LIMPIO
from flask import Flask, render_template
from flask_cors import CORS
from routes.postre_routes import postre_bp
from routes.ingrediente_routes import ingrediente_bp
from routes.usuario_routes import usuario_bp

app = Flask(__name__)
app.secret_key = 'tu_clave_secreta_aqui_cambiar_en_produccion'  # Necesario para las sesiones
CORS(app)

# Registrar blueprints
app.register_blueprint(postre_bp)
app.register_blueprint(ingrediente_bp)
app.register_blueprint(usuario_bp)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def app_view():
    return render_template("login.html")

if __name__ == "__main__":
    app.run(debug=True)
