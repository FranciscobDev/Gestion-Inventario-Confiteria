from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static
from apps.usuarios.views import AdminLoginView, AdminLogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Rutas directas de autenticación para administradores
    path('login/', AdminLoginView.as_view(), name='login'),
    path('logout/', AdminLogoutView.as_view(), name='logout'),
    
    # Rutas modulares de apps
    path('usuarios/', include('apps.usuarios.urls')),
    path('gestion/', include('apps.gestion.urls')),

    # Redirección por defecto a la interfaz principal de gestión
    path('', lambda request: redirect('gestion:inicio')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

