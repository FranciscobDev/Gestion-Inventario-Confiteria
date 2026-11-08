from django.contrib import admin
from .models import Categoria, Proveedor, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id_categoria', 'nombre_categoria', 'descripcion')
    search_fields = ('nombre_categoria',)


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('id_proveedor', 'nombre_empresa', 'contacto_nombre', 'telefono', 'email')
    search_fields = ('nombre_empresa', 'contacto_nombre', 'telefono', 'email')


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        'id_producto',
        'nombre',
        'codigo_barras',
        'categoria',
        'proveedor',
        'precio_compra',
        'precio_venta',
        'stock_actual',
        'stock_minimo',
        'unidad_medida',
        'fecha_vencimiento',
    )
    list_filter = ('categoria', 'unidad_medida', 'proveedor')
    search_fields = ('nombre', 'codigo_barras')
