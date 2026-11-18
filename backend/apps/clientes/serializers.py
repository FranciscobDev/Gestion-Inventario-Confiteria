import re
from rest_framework import serializers

from apps.encargos.models import Encargo
from .utils import normalizar_telefono


class RegistroClienteSerializer(serializers.Serializer):
    telefono = serializers.CharField()
    nombre = serializers.CharField(max_length=120)
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_telefono(self, value):
        tel = normalizar_telefono(value)
        if len(tel) != 9:
            raise serializers.ValidationError('Ingresa un teléfono válido de 9 dígitos.')
        return tel

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('La contraseña debe incluir al menos una letra mayúscula.')
        if not re.search(r'[^A-Za-z0-9]', value):
            raise serializers.ValidationError('La contraseña debe incluir al menos un símbolo (ej: !@#$%&*).')
        return value


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