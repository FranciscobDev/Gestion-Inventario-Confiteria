from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'compras'

router = DefaultRouter()
router.register('proveedores', views.ProveedorViewSet, basename='proveedor')
router.register('ordenes', views.OrdenCompraViewSet, basename='orden_compra')
router.register('devoluciones', views.DevolucionProveedorViewSet, basename='devolucion_proveedor')

urlpatterns = [
    path('', include(router.urls)),
]
