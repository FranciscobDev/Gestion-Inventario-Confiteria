from django.db import models
from django.utils import timezone
from apps.gestion.models import Lote, Producto, Proveedor


class OrdenCompra(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = 'Borrador', 'Borrador'
        ENVIADA = 'Enviada', 'Enviada'
        RECIBIDA = 'Recibida', 'Recibida'
        CANCELADA = 'Cancelada', 'Cancelada'

    fecha = models.DateField(default=timezone.localdate)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='ordenes_compra')
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.BORRADOR)

    objects = models.Manager()

    class Meta:
        db_table = 'ordenes_compra'
        ordering = ['-fecha', '-id']


class DetalleOrdenCompra(models.Model):
    orden = models.ForeignKey(OrdenCompra, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()
    costo_estimado = models.DecimalField(max_digits=10, decimal_places=2)

    objects = models.Manager()

    class Meta:
        db_table = 'detalle_ordenes_compra'


class DevolucionProveedor(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'Pendiente', 'Pendiente'
        REEMBOLSADA = 'Reembolsada', 'Reembolsada'
        CAMBIADA = 'Cambiada', 'Cambiada'
        RECHAZADA = 'Rechazada', 'Rechazada'

    fecha = models.DateField(default=timezone.localdate)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='devoluciones')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    lote = models.ForeignKey(Lote, on_delete=models.SET_NULL, null=True, blank=True)
    codigo_lote = models.CharField(max_length=50)
    cantidad = models.PositiveIntegerField()
    motivo = models.CharField(max_length=60)
    detalle = models.TextField(blank=True, default='')
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)

    objects = models.Manager()

    class Meta:
        db_table = 'devoluciones_proveedor'
        ordering = ['-fecha', '-id']
