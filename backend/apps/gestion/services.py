from django.apps import apps
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from .models import Lote, MovimientoInventario, Producto


def sincronizar_stock_producto(producto: Producto) -> int:
    """
    Recalcula el stock físico total del producto a partir de sus lotes activos.
    """
    agg = Lote.objects.filter(producto=producto).aggregate(total=Sum('stock_actual'))
    total = int(agg.get('total') or 0)
    Producto.objects.filter(pk=producto.pk).update(stock_actual=total)
    return total


def obtener_stock_reservado(producto: Producto) -> int:
    """
    Suma las unidades comprometidas en encargos activos (Pendiente o En preparación).
    """
    DetalleEncargo = apps.get_model('encargos', 'DetalleEncargo')
    return (
        DetalleEncargo.objects.filter(
            producto=producto,
            encargo__estado__in=['Pendiente', 'En preparación'],
        ).aggregate(total=Sum('cantidad'))['total']
        or 0
    )


@transaction.atomic
def descontar_stock_fefo(
    producto: Producto,
    cantidad_solicitada: int,
    fecha_hora=None,
    motivo='Salida por venta (FEFO)',
    ignorar_reservas=False,
):
    """
    Descuenta unidades del producto siguiendo el criterio FEFO (primero el lote más próximo a vencer).
    Valida que la salida sea positiva y nunca deje el stock disponible bajo cero.
    """
    if not isinstance(cantidad_solicitada, int) or cantidad_solicitada <= 0:
        raise ValueError('La cantidad a descontar debe ser un número entero mayor a 0.')

    fecha_mov = fecha_hora or timezone.now()
    lotes = list(
        Lote.objects.select_for_update()
        .filter(producto=producto, stock_actual__gt=0)
        .order_by('fecha_vencimiento', 'id')
    )
    disponible_fisico = sum(int(l.stock_actual) for l in lotes)
    reservado = 0 if ignorar_reservas else obtener_stock_reservado(producto)
    disponible_real = max(0, disponible_fisico - reservado)

    if disponible_real < cantidad_solicitada:
        raise ValueError(
            f'Stock insuficiente para "{producto.nombre}". '
            f'Disponible: {disponible_real}, solicitado: {cantidad_solicitada}.'
        )

    restante = cantidad_solicitada
    running_total = disponible_fisico
    movimientos_creados = []

    for lote in lotes:
        if restante <= 0:
            break
        stock_lote = int(lote.stock_actual)
        tomar = min(stock_lote, restante)
        Lote.objects.filter(pk=lote.pk).update(stock_actual=stock_lote - tomar)
        restante -= tomar
        running_total -= tomar

        mov = MovimientoInventario.objects.create(
            fecha_hora=fecha_mov,
            tipo=MovimientoInventario.Tipo.VENTA,
            producto=producto,
            lote=lote,
            codigo_lote=lote.codigo_lote,
            cantidad=-tomar,
            stock_resultante=running_total,
            costo_unitario=lote.precio_compra,
            motivo=motivo,
        )
        movimientos_creados.append(mov)

    sincronizar_stock_producto(producto)
    return movimientos_creados
