# app.py - COMPLETAMENTE LIMPIO
from flask import Flask, render_template
from flask_cors import CORS
from routes.postre_routes import postre_bp
from routes.ingrediente_routes import ingrediente_bp
from flask import request, jsonify
import pymysql, hmac, hashlib, base64, json, time


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
    
# ====== Config mínima JWT ======
SECRET = "UTNC2025"   # pon algo largo y único
EXP_SECONDS = 2 * 60 * 60                         # 2 horas

def _b64url(b: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

def _b64url_dec(s: str) -> bytes:
    import base64
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s.encode())

def _jwt_encode(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    h = _b64url(json.dumps(header, separators=(",", ":"), ensure_ascii=False).encode())
    p = _b64url(json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode())
    sig = hmac.new(SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
    return f"{h}.{p}.{_b64url(sig)}"
@app.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    usuario    = (data.get("usuario") or "").strip()
    contrasena =  data.get("contrasena") or ""

    if not usuario or not contrasena:
        return jsonify(success=False, msg="Faltan campos"), 400

    # Ajusta credenciales/BD a tu servidor
    conn = pymysql.connect(
        host="185.232.14.52", user="u760464709_23005089_usr", password=":Sa[MX~2l",
        database="u760464709_23005089_bd", cursorclass=pymysql.cursors.DictCursor
    )
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, Nombre_Usuario, Contrasena
                FROM usuarios
                WHERE Nombre_Usuario=%s
                LIMIT 1
            """, (usuario,))
            row = cur.fetchone()
    finally:
        conn.close()

    # Versión mínima: compara texto plano (para pruebas)
    if not row or row["Contrasena"] != contrasena:
        return jsonify(success=False, msg="Usuario o contraseña incorrectos"), 401

    now = int(time.time())
    token = _jwt_encode({
        "sub": str(row["id"]),
        "name": row["Nombre_Usuario"],
        "iat": now,
        "exp": now + EXP_SECONDS
    })
    return jsonify(success=True, token=token, usuario=row["Nombre_Usuario"])

if __name__ == "__main__":
    app.run(debug=True)
