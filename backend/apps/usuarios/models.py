from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    email = models.EmailField(unique=True)


class ConfiguracionNegocio(models.Model):
    """
    Configuración global del negocio y parámetros de seguridad.
    """
    amber_days = models.PositiveIntegerField(default=30)
    red_days = models.PositiveIntegerField(default=15)
    inactivity_minutes = models.PositiveIntegerField(default=15)
    codigo_recuperacion = models.CharField(max_length=32, default='ARTE-9482-CONF')
    failed_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    objects = models.Manager()

    class Meta:
        db_table = 'configuracion_negocio'
        verbose_name = 'Configuración del Negocio'

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
