from rest_framework.permissions import BasePermission

from .models import Cliente


class IsCliente(BasePermission):
    message = 'Debes iniciar sesión como cliente.'

    def has_permission(self, request, view):
        return isinstance(request.user, Cliente) and request.user.activo