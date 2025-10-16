# routes/postre_routes.py
from flask import Blueprint, render_template, request, jsonify, make_response
from services.postre_service import PostreService
from repositories.ingrediente_repository import IngredienteRepository  # ← NUEVA IMPORTACIÓN

postre_bp = Blueprint('postres', __name__)
postre_service = PostreService()

@postre_bp.route("/postres")
def postres():
    """Página principal de postres"""
    return render_template("postres.html")

@postre_bp.route("/tbodyPostres")
def tbody_postres():
    """Obtener tbody de postres para la tabla"""
    try:
        postres = postre_service.listar_postres()
        return render_template("tbodyPostres.html", 
                              postres=[p.to_dict() for p in postres])
    except Exception as e:
        print(f"Error al obtener postres: {e}")
        return "<tr><td colspan='4' class='text-center text-danger'>Error al cargar postres</td></tr>"

@postre_bp.route("/postres/buscar", methods=["GET"])
def buscar_postres():
    """Buscar postres"""
    try:
        termino = request.args.get("busqueda", "")
        postres = postre_service.buscar_postres(termino)
        return make_response(jsonify([p.to_dict() for p in postres]))
    except Exception as e:
        print(f"Error en búsqueda: {e}")
        return make_response(jsonify([]))

@postre_bp.route("/postre", methods=["POST"])
def guardar_postre():
    """Guardar o actualizar postre"""
    try:
        resultado = postre_service.guardar_postre(request.form)
        return make_response(jsonify({
            "success": True, 
            "message": "Postre guardado correctamente",
            "postre_id": resultado  # ← AGREGAR ESTO para devolver el ID
        }))
    except ValueError as e:
        return make_response(jsonify({
            "success": False, 
            "message": str(e)
        }), 400)
    except Exception as e:
        print(f"Error al guardar: {e}")
        return make_response(jsonify({
            "success": False, 
            "message": "Error interno del servidor"
        }), 500)

@postre_bp.route("/postre/<int:id>")
def editar_postre(id):
    """Obtener datos de postre para editar"""
    try:
        postre = postre_service.obtener_postre(id)
        if postre:
            return make_response(jsonify([postre.to_dict()]))
        return make_response(jsonify([]))
    except Exception as e:
        print(f"Error al obtener postre: {e}")
        return make_response(jsonify([]))

@postre_bp.route("/postre/eliminar", methods=["POST"])
def eliminar_postre():
    """Eliminar postre"""
    try:
        id = request.form["id"]
        resultado = postre_service.eliminar_postre(id)
        return make_response(jsonify({
            "success": resultado, 
            "message": "Postre eliminado" if resultado else "Error al eliminar"
        }))
    except Exception as e:
        print(f"Error al eliminar: {e}")
        return make_response(jsonify({
            "success": False, 
            "message": "Error interno"
        }), 500)

@postre_bp.route("/postres/ingredientes/<int:id>")
def postres_ingredientes(id):
    """Obtener ingredientes de un postre"""
    try:
        ingredientes = postre_service.obtener_ingredientes_postre(id)
        return render_template("modal.html", postresIngredientes=ingredientes)
    except Exception as e:
        print(f"Error al obtener ingredientes: {e}")
        return "<p class='text-danger'>Error al cargar ingredientes</p>"


# ===================================================================
# NUEVAS RUTAS PARA GESTIÓN DE INGREDIENTES - AGREGAR DESDE AQUÍ
# ===================================================================

@postre_bp.route("/ingredientes/disponibles", methods=["GET"])
def obtener_ingredientes_disponibles():
    """Obtener todos los ingredientes disponibles para el select"""
    try:
        print("=" * 50)
        print("🔍 GET /ingredientes/disponibles")
        print("=" * 50)
        
        # Crear instancia del repositorio de ingredientes
        ingrediente_repo = IngredienteRepository()
        
        # Obtener todos los ingredientes
        ingredientes = ingrediente_repo.obtener_todos()
        
        # Convertir a diccionarios
        ingredientes_dict = [ing.to_dict() for ing in ingredientes]
        
        print(f"✅ Se encontraron {len(ingredientes_dict)} ingredientes")
        for ing in ingredientes_dict:
            print(f"  - {ing['nombreIngrediente']} (ID: {ing['idIngrediente']}, Stock: {ing['existencias']})")
        print("=" * 50)
        
        return make_response(jsonify(ingredientes_dict), 200)
        
    except Exception as e:
        print("=" * 50)
        print(f"❌ ERROR en /ingredientes/disponibles")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 50)
        return make_response(jsonify([]), 500)


@postre_bp.route("/postre/ingrediente/agregar", methods=["POST"])
def agregar_ingrediente_postre():
    """Agregar ingrediente a un postre"""
    try:
        data = request.get_json()
        print(f"📥 Agregando ingrediente: {data}")
        
        postre_id = data.get('postre_id')
        ingrediente_id = data.get('ingrediente_id')
        cantidad = data.get('cantidad')
        
        if not postre_id or not ingrediente_id or not cantidad:
            return make_response(jsonify({
                "success": False,
                "message": "Faltan datos requeridos"
            }), 400)
        
        # Agregar el ingrediente usando el service
        resultado = postre_service.agregar_ingrediente_a_postre(
            postre_id, ingrediente_id, cantidad
        )
        
        print(f"✅ Ingrediente agregado exitosamente")
        
        return make_response(jsonify({
            "success": resultado,
            "message": "Ingrediente agregado correctamente"
        }))
        
    except ValueError as e:
        print(f"⚠️ Error de validación: {e}")
        return make_response(jsonify({
            "success": False,
            "message": str(e)
        }), 400)
    except Exception as e:
        print(f"❌ Error al agregar ingrediente: {e}")
        import traceback
        traceback.print_exc()
        return make_response(jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500)


@postre_bp.route("/postre/ingrediente/eliminar", methods=["POST"])
def eliminar_ingrediente_postre():
    """Eliminar ingrediente de un postre"""
    try:
        data = request.get_json()
        print(f"🗑️ Eliminando ingrediente: {data}")
        
        postre_id = data.get('postre_id')
        ingrediente_id = data.get('ingrediente_id')
        
        resultado = postre_service.eliminar_ingrediente_de_postre(
            postre_id, ingrediente_id
        )
        
        print(f"✅ Ingrediente eliminado")
        
        return make_response(jsonify({
            "success": resultado,
            "message": "Ingrediente eliminado correctamente"
        }))
        
    except Exception as e:
        print(f"❌ Error al eliminar ingrediente: {e}")
        return make_response(jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500)


@postre_bp.route("/postre/<int:id>/ingredientes", methods=["GET"])
def obtener_ingredientes_del_postre(id):
    """Obtener ingredientes asociados a un postre específico (para editar)"""
    try:
        print(f"🔍 Obteniendo ingredientes del postre ID: {id}")
        
        ingredientes = postre_service.obtener_ingredientes_postre(id)
        
        print(f"✅ Se encontraron {len(ingredientes)} ingredientes para el postre {id}")
        
        return make_response(jsonify(ingredientes))
        
    except Exception as e:
        print(f"❌ Error al obtener ingredientes del postre: {e}")
        import traceback
        traceback.print_exc()
        return make_response(jsonify([]))