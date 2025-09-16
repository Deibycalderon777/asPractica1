# ========================================
# app.py - ARCHIVO PRINCIPAL CORREGIDO
# ========================================

from flask import Flask, render_template
from flask_cors import CORS
from datetime import timedelta
import logging
import os

# Importar blueprints
from routes.auth_routes import auth_bp
from routes.postre_routes import postre_bp
from routes.ingrediente_routes import ingrediente_bp

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Crear aplicación Flask
app = Flask(__name__)

# ========================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ========================================

# Configuración de sesiones y seguridad
app.secret_key = os.environ.get('SECRET_KEY', 'tu_clave_super_secreta_aqui_cambiar_en_produccion')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SECURE'] = False  # True en producción con HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Configuración de CORS
CORS(app, supports_credentials=True)

# ========================================
# REGISTRO DE BLUEPRINTS
# ========================================

# Blueprint de autenticación (debe ir primero)
app.register_blueprint(auth_bp)

# Blueprints de funcionalidades
app.register_blueprint(postre_bp)
app.register_blueprint(ingrediente_bp)

# ========================================
# RUTAS PRINCIPALES
# ========================================

@app.route("/")
def index():
    """Página principal - redirige a la app de AngularJS"""
    return render_template("index.html")



# ========================================
# RUTAS PARA TEMPLATES DE ANGULARJS
# ========================================

@app.route("/postres")
def postres_view():
    """Template para la sección de postres"""
    return render_template("postres.html")

@app.route("/ingredientes") 
def ingredientes_view():
    """Template para la sección de ingredientes"""
    return render_template("ingredientes.html")

@app.route("/login")
def login_view():
    """Template para la página de login"""
    return render_template("login.html")

# ========================================
# MANEJO DE ERRORES
# ========================================

@app.errorhandler(404)
def not_found_error(error):
    """Manejo de errores 404"""
    logger.warning(f"Página no encontrada: {error}")
    return render_template("errors/404.html"), 404

@app.errorhandler(500)
def internal_error(error):
    """Manejo de errores 500"""
    logger.error(f"Error interno del servidor: {error}")
    return render_template("errors/500.html"), 500

@app.errorhandler(401)
def unauthorized_error(error):
    """Manejo de errores 401 - No autorizado"""
    logger.warning(f"Acceso no autorizado: {error}")
    return render_template("login.html"), 401

# ========================================
# MIDDLEWARE PERSONALIZADO
# ========================================

@app.before_request
def log_request_info():
    """Log de información de requests (opcional para debugging)"""
    if app.debug:
        logger.debug(f"Request: {request.method} {request.url}")

@app.after_request
def after_request(response):
    """Agregar headers de seguridad"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# ========================================
# RUTAS DE SALUD Y ESTADO (OPCIONAL)
# ========================================

@app.route("/health")
def health_check():
    """Endpoint para verificar que la aplicación está funcionando"""
    return {
        "status": "ok",
        "service": "Sistema de Postres",
        "version": "1.0.0"
    }

@app.route("/api/status")
def api_status():
    """Estado de la API"""
    from config.database import DatabaseConfig
    
    # Verificar conexión a base de datos
    db_status = "ok"
    try:
        db_config = DatabaseConfig()
        with db_config.get_connection() as connection:
            if not connection.is_connected():
                db_status = "error"
    except Exception as e:
        db_status = f"error: {str(e)}"
        logger.error(f"Error en conexión a base de datos: {e}")
    
    return {
        "api_status": "ok",
        "database_status": db_status,
        "timestamp": datetime.now().isoformat()
    }

# ========================================
# CONFIGURACIÓN DE DESARROLLO/PRODUCCIÓN
# ========================================

if __name__ == "__main__":
    # Configuración para desarrollo
    logger.info("Iniciando aplicación en modo desarrollo")
    app.run(
        debug=True, 
        host='0.0.0.0', 
        port=5000,
        threaded=True
    )
else:
    # Configuración para producción
    logger.info("Aplicación iniciada en modo producción")
    # En producción, usa un servidor WSGI como Gunicorn
    # gunicorn -w 4 -b 0.0.0.0:5000 app:app

# ========================================
# COMENTARIOS Y NOTAS
# ========================================

"""
ESTRUCTURA FINAL DE TU APLICACIÓN:

1. CONFIGURACIÓN:
   - Variables de entorno para secretos
   - Configuración de sesiones seguras
   - CORS habilitado con credenciales

2. BLUEPRINTS REGISTRADOS:
   - auth_bp: /api/login, /api/logout, etc.
   - postre_bp: /api/postres, /postre, etc.
   - ingrediente_bp: /api/ingredientes, /ingrediente, etc.

3. RUTAS DE TEMPLATES:
   - / → index.html (página principal)
   - /app → app.html (dashboard)
   - /postres → postres.html (gestión de postres)
   - /ingredientes → ingredientes.html (gestión de ingredientes)
   - /login → login.html (página de login)

4. MANEJO DE ERRORES:
   - 404, 500, 401 con templates personalizados

5. SEGURIDAD:
   - Headers de seguridad
   - Configuración de cookies seguras
   - Logging de actividades

PRÓXIMOS PASOS:
1. Crear los templates faltantes en templates/
2. Verificar que todos los blueprints existan
3. Probar las rutas una por una
4. Implementar templates de error (opcional)

PARA PRODUCCIÓN:
- Cambiar SECRET_KEY por variable de entorno
- Habilitar SESSION_COOKIE_SECURE = True con HTTPS
- Usar servidor WSGI como Gunicorn
- Configurar logging a archivos
"""
