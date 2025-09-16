# ========================================
# 3. SERVICIO DE AUTENTICACIÓN - services/auth_service.py
# ========================================

from repositories.usuario_repository import UsuarioRepository
from models.usuario import Usuario
import hashlib
import secrets
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.usuario_repository = UsuarioRepository()
    
    def authenticate_user(self, login_field: str, password: str) -> Optional[Usuario]:
        """Autenticar usuario con credenciales"""
        if not login_field or not password:
            return None
        
        # Buscar usuario
        user = self.usuario_repository.find_by_username_or_email(login_field.strip())
        if not user:
            return None
        
        # Verificar contraseña
        if self._verify_password(user.Contraseña, password):
            # Actualizar último login
            self.usuario_repository.update_last_login(user.Id)
            # No exponer la contraseña en el objeto retornado
            user.Contraseña = None
            return user
        
        return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Usuario]:
        """Obtener usuario por ID"""
        return self.usuario_repository.find_by_id(user_id)
    
    def find_user_by_email(self, email: str) -> Optional[Usuario]:
        """Buscar usuario por email para recuperación de contraseña"""
        return self.usuario_repository.find_by_email(email)
    
    def _verify_password(self, stored_password: str, provided_password: str) -> bool:
        """Verificar contraseña - Compatible con tu tabla actual"""
        # Para compatibilidad con tu tabla actual (texto plano)
        return stored_password == provided_password
        
        # TODO: En producción, usar hashing:
        # return self._check_password_hash(stored_password, provided_password)
    
    def _hash_password(self, password: str) -> str:
        """Hashear contraseña (para futuras implementaciones)"""
        salt = secrets.token_hex(16)
        hashed = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}:{hashed}"
    
    def _check_password_hash(self, stored_password: str, provided_password: str) -> bool:
        """Verificar contraseña hasheada (para futuras implementaciones)"""
        try:
            salt, stored_hash = stored_password.split(':')
            provided_hash = hashlib.sha256((provided_password + salt).encode()).hexdigest()
            return stored_hash == provided_hash
        except ValueError:
            return False
