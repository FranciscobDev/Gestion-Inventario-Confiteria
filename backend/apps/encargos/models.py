from django.db import models
from django.utils import timezone
from apps.gestion.models import Producto


class Encargo(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'Pendiente', 'Pendiente'
        EN_PREPARACION = 'En preparación', 'En preparación'
        ENTREGADO = 'Entregado', 'Entregado'
        CANCELADO = 'Cancelado', 'Cancelado'

    cliente_nombre = models.CharField(max_length=120)
    cliente_telefono = models.CharField(max_length=30)
    cliente = models.ForeignKey(
    'clientes.Cliente', null=True, blank=True,
    on_delete=models.SET_NULL, related_name='encargos',)
    fecha_entrega = models.DateField()
    hora_entrega = models.CharField(max_length=10, default='16:00')
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    notas = models.TextField(blank=True, default='')
    creado_en = models.DateTimeField(default=timezone.now)

    objects = models.Manager()

    class Meta:
        db_table = 'encargos'
        ordering = ['fecha_entrega', 'id']


class DetalleEncargo(models.Model):
    encargo = models.ForeignKey(Encargo, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()

    objects = models.Manager()

    class Meta:
        db_table = 'detalle_encargos'


class HistorialEncargo(models.Model):
    encargo = models.ForeignKey(Encargo, on_delete=models.CASCADE, related_name='historial')
    fecha = models.DateTimeField(default=timezone.now)
    estado = models.CharField(max_length=20)
    motivo = models.CharField(max_length=200)

    objects = models.Manager()

    class Meta:
        db_table = 'historial_encargos'
        ordering = ['fecha', 'id']
