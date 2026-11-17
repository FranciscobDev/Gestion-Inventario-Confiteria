from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok', 'service': 'arteconfi-backend'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    # Endpoints modulares por dominio
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/inventario/', include('apps.gestion.urls')),
    path('api/compras/', include('apps.compras.urls')),
    path('api/encargos/', include('apps.encargos.urls')),
    path('api/finanzas/', include('apps.finanzas.urls')),
    path('api/reportes/', include('apps.reportes.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
