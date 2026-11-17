from rest_framework import serializers
from .models import ConfiguracionNegocio


class ConfiguracionNegocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionNegocio
        fields = ['amber_days', 'red_days', 'inactivity_minutes', 'codigo_recuperacion']
        read_only_fields = ['codigo_recuperacion']
