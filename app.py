# app.py - COMPLETAMENTE LIMPIO
from flask import Flask, render_template
from flask_cors import CORS
from routes.postre_routes import postre_bp
from routes.ingrediente_routes import ingrediente_bp

app = Flask(__name__)
CORS(app)

# Registrar blueprints
app.register_blueprint(postre_bp)
app.register_blueprint(ingrediente_bp)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/app")
def app_view():
    return "<h5>Hola, soy la view app</h5>"

if __name__ == "__main__":
    app.run(debug=True)