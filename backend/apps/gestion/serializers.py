from rest_framework import serializers
from .models import (
    Categoria,
    Combo,
    ComboItem,
    HistorialPrecio,
    Lote,
    MovimientoInventario,
    Producto,
)


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nombre_categoria', 'descripcion']


class HistorialPrecioSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialPrecio
        fields = ['id', 'fecha', 'precio_compra', 'precio_venta', 'motivo']


class LoteSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = Lote
        fields = [
            'id',
            'producto',
            'producto_nombre',
            'codigo_lote',
            'fecha_vencimiento',
            'precio_compra',
            'stock_actual',
            'precio_oferta',
        ]


class ProductoSerializer(serializers.ModelSerializer):
    historial_precios = HistorialPrecioSerializer(many=True, read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id_producto',
            'codigo_barras',
            'nombre',
            'descripcion',
            'categoria',
            'proveedor',
            'proveedores',
            'precio_compra',
            'precio_venta',
            'stock_actual',
            'stock_minimo',
            'stock_objetivo',
            'unidad_medida',
            'fecha_vencimiento',
            'perecible',
            'activo',
            'imagen',
            'historial_precios',
        ]


class ComboItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComboItem
        fields = ['id', 'producto', 'cantidad']


class ComboSerializer(serializers.ModelSerializer):
    componentes = ComboItemSerializer(many=True)

    class Meta:
        model = Combo
        fields = ['id', 'nombre', 'precio_especial', 'fecha_inicio', 'fecha_fin', 'activo', 'componentes']

    def create(self, validated_data):
        items_data = validated_data.pop('componentes', [])
        combo = Combo.objects.create(**validated_data)
        for item in items_data:
            ComboItem.objects.create(combo=combo, **item)
        return combo


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id',
            'fecha_hora',
            'tipo',
            'producto',
            'producto_nombre',
            'lote',
            'codigo_lote',
            'cantidad',
            'stock_resultante',
            'costo_unitario',
            'motivo',
        ]
