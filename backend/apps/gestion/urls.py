from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'gestion'

router = DefaultRouter()
router.register('categorias', views.CategoriaViewSet, basename='categoria')
router.register('productos', views.ProductoViewSet, basename='producto')
router.register('lotes', views.LoteViewSet, basename='lote')
router.register('combos', views.ComboViewSet, basename='combo')
router.register('movimientos', views.MovimientoInventarioViewSet, basename='movimiento')

urlpatterns = [
    path('', include(router.urls)),
    path('ingresos/', views.IngresoMercaderiaAPIView.as_view(), name='ingreso_mercaderia'),
    path('salidas-venta/', views.SalidaVentaFEFOAPIView.as_view(), name='salida_venta'),
    path('mermas/', views.RegistrarMermaAPIView.as_view(), name='registrar_merma'),
    path('devoluciones-cliente/', views.DevolucionClienteAPIView.as_view(), name='devolucion_cliente'),
]
