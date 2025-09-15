# routes/postre_routes.py
from flask import Blueprint, render_template, request, jsonify, make_response
from services.postre_service import PostreService

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
            "message": "Postre guardado correctamente"
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

