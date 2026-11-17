from rest_framework import serializers
from .models import CorreccionVenta, VentaFinanzas


class CorreccionVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CorreccionVenta
        fields = ['id', 'fecha', 'anterior', 'nuevo']


class VentaFinanzasSerializer(serializers.ModelSerializer):
    correcciones = CorreccionVentaSerializer(many=True, read_only=True)

    class Meta:
        model = VentaFinanzas
        fields = [
            'id',
            'fecha_hora',
            'monto',
            'medio_pago',
            'nota',
            'estado',
            'motivo_anulacion',
            'fecha_anulacion',
            'correcciones',
        ]
