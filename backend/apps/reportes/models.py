from django.db import models
from django.utils import timezone


class DiaRevisado(models.Model):
    fecha = models.DateField(unique=True)
    nota = models.CharField(max_length=255, default='Revisado por el dueño')
    revisado_en = models.DateTimeField(default=timezone.now)

    objects = models.Manager()

    class Meta:
        db_table = 'dias_revisados'
        ordering = ['-fecha']


class RegistroRespaldo(models.Model):
    fecha_hora = models.DateTimeField(default=timezone.now)
    tipo = models.CharField(max_length=40, default='Manual')
    destino = models.CharField(max_length=60, default='Local')
    tamano = models.CharField(max_length=30, default='1.0 KB')
    cifrado = models.BooleanField(default=True)
    integridad = models.CharField(max_length=30, default='Verificado')
    archivo_ruta = models.CharField(max_length=255, blank=True, default='')

    objects = models.Manager()

    class Meta:
        db_table = 'registros_respaldo'
        ordering = ['-fecha_hora', '-id']
