# services/pusher_service.py
import pusher
from flask import make_response, jsonify

class PusherService:
    def __init__(self):
        # Configuración para postres
        self.pusher_postres = pusher.Pusher(
            app_id="2049017",
            key="df675041e275bafce4a7",
            secret="e3e5eb065e55edc089f8",
            cluster="mt1",
            ssl=True
        )
        
        # Configuración para ingredientes
        self.pusher_ingredientes = pusher.Pusher(
            app_id="2046025",
            key="48294aad3f28c3669613",
            secret="5c287b63141dae2934ef",
            cluster="us2",
            ssl=True
        )
    
    def notificar_postres(self):
        """Notificar cambios en postres"""
        try:
            self.pusher_postres.trigger(
                "canalPostres", 
                "eventoPostres", 
                {"message": "Actualizar postres"}
            )
            return True
        except Exception as e:
            print(f"Error al notificar postres: {e}")
            return False
    
    def notificar_ingredientes(self):
        """Notificar cambios en ingredientes"""
        try:
            self.pusher_ingredientes.trigger(
                "canalIngredientes", 
                "eventoDeIngredientes", 
                {"message": "Actualizar ingredientes"}
            )
            return True
        except Exception as e:
            print(f"Error al notificar ingredientes: {e}")
            return False