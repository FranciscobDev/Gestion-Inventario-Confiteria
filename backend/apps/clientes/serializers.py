from rest_framework import serializers

from apps.encargos.models import Encargo
from .utils import normalizar_telefono


class RegistroClienteSerializer(serializers.Serializer):
    telefono = serializers.CharField()
    nombre = serializers.CharField(max_length=120)
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_telefono(self, value):
        tel = normalizar_telefono(value)
        if len(tel) != 9:
            raise serializers.ValidationError('Ingresa un teléfono válido de 9 dígitos.')
        return tel


class EncargoClienteSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Encargo
        fields = ['id', 'fecha_entrega', 'hora_entrega', 'estado', 'notas', 'creado_en', 'items']

    def get_items(self, obj):
        return [
            {'producto': d.producto.nombre, 'cantidad': d.cantidad}
            for d in obj.items.select_related('producto').all()
        ]