# routes/ingrediente_routes.py
from flask import Blueprint, render_template, request, jsonify, make_response
from services.ingrediente_service import IngredienteService

ingrediente_bp = Blueprint('ingredientes', __name__)
ingrediente_service = IngredienteService()

@ingrediente_bp.route("/ingredientes")
def ingredientes():
    """Página principal de ingredientes"""
    return render_template("ingredientes.html")

@ingrediente_bp.route("/tbodyIngredientes")
def tbody_ingredientes():
    """Obtener tbody de ingredientes para la tabla"""
    try:
        ingredientes = ingrediente_service.listar_ingredientes()
        return render_template("tbodyIngredientes.html", 
                              ingredientes=[i.to_dict() for i in ingredientes])
    except Exception as e:
        print(f"Error al obtener ingredientes: {e}")
        return "<tr><td colspan='4' class='text-center text-danger'>Error al cargar ingredientes</td></tr>"

@ingrediente_bp.route("/ingredientes/buscar", methods=["GET"])
def buscar_ingredientes():
    """Buscar ingredientes"""
    try:
        termino = request.args.get("busqueda", "")
        ingredientes = ingrediente_service.buscar_ingredientes(termino)
        return make_response(jsonify([i.to_dict() for i in ingredientes]))
    except Exception as e:
        print(f"Error en búsqueda: {e}")
        return make_response(jsonify([]))

@ingrediente_bp.route("/ingrediente", methods=["POST"])
def guardar_ingrediente():
    """Guardar o actualizar ingrediente"""
    try:
        resultado = ingrediente_service.guardar_ingrediente(request.form)
        return make_response(jsonify({
            "success": True, 
            "message": "Ingrediente guardado correctamente"
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

@ingrediente_bp.route("/ingrediente/<int:id>")
def editar_ingrediente(id):
    """Obtener datos de ingrediente para editar"""
    try:
        ingrediente = ingrediente_service.obtener_ingrediente(id)
        if ingrediente:
            return make_response(jsonify([ingrediente.to_dict()]))
        return make_response(jsonify([]))
    except Exception as e:
        print(f"Error al obtener ingrediente: {e}")
        return make_response(jsonify([]))

@ingrediente_bp.route("/ingrediente/eliminar", methods=["POST"])
def eliminar_ingrediente():
    """Eliminar ingrediente"""
    try:
        id = request.form["id"]
        resultado = ingrediente_service.eliminar_ingrediente(id)
        return make_response(jsonify({
            "success": resultado, 
            "message": "Ingrediente eliminado" if resultado else "Error al eliminar"
        }))
    except Exception as e:
        print(f"Error al eliminar: {e}")
        return make_response(jsonify({
            "success": False, 
            "message": "Error interno"
        }), 500)