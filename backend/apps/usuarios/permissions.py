from rest_framework.permissions import BasePermission


class IsOwnerOrAdmin(BasePermission):
    """
    Permite acceso solo a usuarios autenticados con permisos de administrador/dueño.
    """
    message = 'Se requieren permisos de administrador.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))
