from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'finanzas'

router = DefaultRouter()
router.register('ventas', views.VentaFinanzasViewSet, basename='venta_finanzas')

urlpatterns = [
    path('', include(router.urls)),
]
