from django.utils import timezone
from rest_framework import serializers
from .models import DetalleEncargo, Encargo, HistorialEncargo


class DetalleEncargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleEncargo
        fields = ['id', 'producto', 'cantidad']


class HistorialEncargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialEncargo
        fields = ['id', 'fecha', 'estado', 'motivo']


class EncargoSerializer(serializers.ModelSerializer):
    items = DetalleEncargoSerializer(many=True)
    historial = HistorialEncargoSerializer(many=True, read_only=True)

    class Meta:
        model = Encargo
        fields = [
            'id',
            'cliente_nombre',
            'cliente_telefono',
            'fecha_entrega',
            'hora_entrega',
            'estado',
            'notas',
            'creado_en',
            'items',
            'historial',
            'origen',
            'cliente_id',
        ]
        read_only_fields = ['creado_en', 'origen', 'cliente_id']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        if not validated_data.get('hora_entrega'):
            validated_data['hora_entrega'] = timezone.localtime().strftime('%H:%M')
        encargo = Encargo.objects.create(**validated_data)
        for item in items_data:
            DetalleEncargo.objects.create(encargo=encargo, **item)
        HistorialEncargo.objects.create(
            encargo=encargo,
            estado=encargo.estado,
            motivo='Encargo agendado y stock reservado',
        )
        return encargo
