from rest_framework import serializers
from apps.gestion.models import Proveedor
from .models import DetalleOrdenCompra, DevolucionProveedor, OrdenCompra


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            'id_proveedor',
            'nombre_empresa',
            'rut',
            'contacto_nombre',
            'telefono',
            'email',
            'dias_entrega',
            'direccion',
            'activo',
        ]


class DetalleOrdenCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleOrdenCompra
        fields = ['id', 'producto', 'cantidad', 'costo_estimado']


class OrdenCompraSerializer(serializers.ModelSerializer):
    items = DetalleOrdenCompraSerializer(many=True)

    class Meta:
        model = OrdenCompra
        fields = ['id', 'fecha', 'proveedor', 'estado', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        orden = OrdenCompra.objects.create(**validated_data)
        for item in items_data:
            DetalleOrdenCompra.objects.create(orden=orden, **item)
        return orden


class DevolucionProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DevolucionProveedor
        fields = [
            'id',
            'fecha',
            'proveedor',
            'producto',
            'lote',
            'codigo_lote',
            'cantidad',
            'motivo',
            'detalle',
            'estado',
        ]
