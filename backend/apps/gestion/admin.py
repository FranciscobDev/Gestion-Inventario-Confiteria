from django.contrib import admin
from .models import (
    Categoria,
    Combo,
    ComboItem,
    HistorialPrecio,
    Lote,
    MovimientoInventario,
    Producto,
    Proveedor,
)


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id_categoria', 'nombre_categoria', 'descripcion')
    search_fields = ('nombre_categoria',)


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('id_proveedor', 'nombre_empresa', 'rut', 'contacto_nombre', 'telefono', 'dias_entrega', 'activo')
    search_fields = ('nombre_empresa', 'rut', 'contacto_nombre')


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
        'activo',
    )
    list_filter = ('categoria', 'unidad_medida', 'activo')
    search_fields = ('nombre', 'codigo_barras')


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'codigo_lote', 'fecha_vencimiento', 'stock_actual', 'precio_compra', 'precio_oferta')
    list_filter = ('fecha_vencimiento',)
    search_fields = ('codigo_lote', 'producto__nombre')


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ('fecha_hora', 'tipo', 'producto', 'codigo_lote', 'cantidad', 'stock_resultante')
    list_filter = ('tipo',)
    search_fields = ('producto__nombre', 'codigo_lote', 'motivo')


admin.site.register(HistorialPrecio)
admin.site.register(Combo)
admin.site.register(ComboItem)
