from functools import wraps
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth.views import redirect_to_login
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.contrib import messages

def admin_required(view_func=None, redirect_field_name=REDIRECT_FIELD_NAME, login_url='login'):
    """
    Decorador para vistas que asegura que el usuario esté autenticado
    y tenga permisos de administración (is_staff o is_superuser).
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect_to_login(
                    request.get_full_path(),
                    login_url,
                    redirect_field_name
                )
            if not (request.user.is_staff or request.user.is_superuser):
                messages.error(request, "Acceso restringido: Se requieren permisos de administrador.")
                return redirect('login')
            return view_func(request, *args, **kwargs)
        return _wrapped_view

    if view_func:
        return decorator(view_func)
    return decorator

