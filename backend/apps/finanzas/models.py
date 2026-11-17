from django.db import models
from django.utils import timezone


class VentaFinanzas(models.Model):
    class MedioPago(models.TextChoices):
        EFECTIVO = 'Efectivo', 'Efectivo'
        TARJETA = 'Tarjeta', 'Tarjeta'
        TRANSFERENCIA = 'Transferencia', 'Transferencia'

    class Estado(models.TextChoices):
        VIGENTE = 'Vigente', 'Vigente'
        ANULADA = 'Anulada', 'Anulada'

    fecha_hora = models.DateTimeField(default=timezone.now)
    monto = models.PositiveIntegerField()
    medio_pago = models.CharField(max_length=20, choices=MedioPago.choices)
    nota = models.CharField(max_length=255, blank=True, default='')
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.VIGENTE)
    motivo_anulacion = models.CharField(max_length=255, blank=True, null=True)
    fecha_anulacion = models.DateTimeField(blank=True, null=True)

    objects = models.Manager()

    class Meta:
        db_table = 'ventas_finanzas'
        ordering = ['-fecha_hora', '-id']


class CorreccionVenta(models.Model):
    venta = models.ForeignKey(VentaFinanzas, on_delete=models.CASCADE, related_name='correcciones')
    fecha = models.DateTimeField(default=timezone.now)
    anterior = models.CharField(max_length=120)
    nuevo = models.CharField(max_length=120)

    objects = models.Manager()

    class Meta:
        db_table = 'correcciones_venta'
        ordering = ['-fecha', '-id']
