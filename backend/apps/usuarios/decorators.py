from functools import wraps
from django.http import JsonResponse


def admin_required(view_func):
    """
    Decorador de backend que valida que el usuario esté autenticado
    y tenga permisos de administración (is_staff o is_superuser).
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'detail': 'Autenticación requerida.'}, status=401)
        if not (request.user.is_staff or request.user.is_superuser):
            return JsonResponse({'detail': 'Se requieren permisos de administrador.'}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view
