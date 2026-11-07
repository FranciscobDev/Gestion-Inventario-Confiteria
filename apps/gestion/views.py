from django.shortcuts import render
from apps.usuarios.decorators import admin_required

@admin_required
def home(request):
    """
    Vista principal del sistema de gestión de inventario.
    Protegida: solo accesible por administradores.
    """
    return render(request, 'gestion/home.html')
