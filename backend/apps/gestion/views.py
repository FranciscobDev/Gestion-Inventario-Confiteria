import random
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usuarios.permissions import IsOwnerOrAdmin
from .models import (
    Categoria,
    Combo,
    HistorialPrecio,
    Lote,
    MovimientoInventario,
    Producto,
)
from .serializers import (
    CategoriaSerializer,
    ComboSerializer,
    LoteSerializer,
    MovimientoInventarioSerializer,
    ProductoSerializer,
)
from .services import descontar_stock_fefo, sincronizar_stock_producto


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsOwnerOrAdmin]


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.prefetch_related('historial_precios', 'proveedores').select_related('categoria', 'proveedor')
    serializer_class = ProductoSerializer
    permission_classes = [IsOwnerOrAdmin]

    @transaction.atomic
    def perform_create(self, serializer):
        producto = serializer.save()
        HistorialPrecio.objects.create(
            producto=producto,
            precio_compra=producto.precio_compra,
            precio_venta=producto.precio_venta,
            motivo='Registro inicial',
        )

    @transaction.atomic
    def perform_update(self, serializer):
        prev = self.get_object()
        old_compra = prev.precio_compra
        old_venta = prev.precio_venta
        producto = serializer.save()
        if old_compra != producto.precio_compra or old_venta != producto.precio_venta:
            HistorialPrecio.objects.create(
                producto=producto,
                precio_compra=producto.precio_compra,
                precio_venta=producto.precio_venta,
                motivo=self.request.data.get('motivo_cambio', 'Actualización manual en ficha'),
            )

    @action(detail=True, methods=['post'])
    def desactivar(self, request, pk=None):
        producto = self.get_object()
        stock_total = sincronizar_stock_producto(producto)
        if stock_total > 0:
            return Response(
                {'detail': f'El producto tiene {stock_total} unidades en stock. Registra una merma antes de dar de baja.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        producto.activo = False
        producto.save(update_fields=['activo'])
        return Response({'detail': 'Producto dado de baja lógicamente.', 'activo': False})

    @action(detail=True, methods=['post'])
    def reactivar(self, request, pk=None):
        producto = self.get_object()
        producto.activo = True
        producto.save(update_fields=['activo'])
        return Response({'detail': 'Producto reactivado.', 'activo': True})


class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.select_related('producto').all()
    serializer_class = LoteSerializer
    permission_classes = [IsOwnerOrAdmin]

    @action(detail=True, methods=['post'], url_path='aplicar-oferta')
    def aplicar_oferta(self, request, pk=None):
        lote = self.get_object()
        precio_oferta = request.data.get('precio_oferta')
        lote.precio_oferta = precio_oferta if precio_oferta not in (None, '') else None
        lote.save(update_fields=['precio_oferta'])
        return Response(LoteSerializer(lote).data)


class ComboViewSet(viewsets.ModelViewSet):
    queryset = Combo.objects.prefetch_related('componentes').all()
    serializer_class = ComboSerializer
    permission_classes = [IsOwnerOrAdmin]


class MovimientoInventarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MovimientoInventario.objects.select_related('producto').all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsOwnerOrAdmin]


class IngresoMercaderiaAPIView(APIView):
    """
    Registra llegada de mercadería creando un lote nuevo y actualizando costo si corresponde.
    """
    permission_classes = [IsOwnerOrAdmin]

    @transaction.atomic
    def post(self, request):
        producto_id = request.data.get('producto_id')
        try:
            cantidad = int(request.data.get('cantidad', 0))
            precio_compra = int(float(request.data.get('precio_compra', 0)))
        except (TypeError, ValueError):
            return Response({'detail': 'Cantidad y precio deben ser numéricos.'}, status=status.HTTP_400_BAD_REQUEST)
        fecha_vencimiento = request.data.get('fecha_vencimiento')
        codigo_lote = request.data.get('codigo_lote') or f'L-{producto_id}-{random.randint(10, 99)}'
        actualizar_ficha = bool(request.data.get('actualizar_precio_ficha', True))
        motivo = request.data.get('motivo') or 'Ingreso de mercadería proveedor'

        if cantidad <= 0:
            return Response({'detail': 'La cantidad debe ser mayor a cero.'}, status=status.HTTP_400_BAD_REQUEST)

        producto = Producto.objects.get(pk=producto_id)
        lote = Lote.objects.create(
            producto=producto,
            codigo_lote=codigo_lote,
            fecha_vencimiento=fecha_vencimiento or None,
            precio_compra=precio_compra,
            stock_actual=cantidad,
        )
        stock_total = sincronizar_stock_producto(producto)

        if actualizar_ficha and float(producto.precio_compra) != float(precio_compra):
            producto.precio_compra = precio_compra
            producto.save(update_fields=['precio_compra'])
            HistorialPrecio.objects.create(
                producto=producto,
                precio_compra=precio_compra,
                precio_venta=producto.precio_venta,
                motivo='Actualizado al ingresar mercadería',
            )

        mov = MovimientoInventario.objects.create(
            tipo=MovimientoInventario.Tipo.INGRESO,
            producto=producto,
            lote=lote,
            codigo_lote=lote.codigo_lote,
            cantidad=cantidad,
            stock_resultante=stock_total,
            costo_unitario=lote.precio_compra,
            motivo=motivo,
        )
        return Response(
            {'lote': LoteSerializer(lote).data, 'movimiento': MovimientoInventarioSerializer(mov).data},
            status=status.HTTP_201_CREATED,
        )


class SalidaVentaFEFOAPIView(APIView):
    """
    Descuenta stock por venta aplicando FEFO para productos simples o combos.
    """
    permission_classes = [IsOwnerOrAdmin]

    @transaction.atomic
    def post(self, request):
        items = request.data.get('items', [])
        fecha_real = request.data.get('fecha_real')
        fecha_dt = timezone.now()
        if fecha_real:
            fecha_dt = timezone.datetime.fromisoformat(f'{fecha_real}T{timezone.localtime().strftime("%H:%M:%S")}')
            fecha_dt = timezone.make_aware(fecha_dt) if timezone.is_naive(fecha_dt) else fecha_dt

        if not items:
            return Response({'detail': 'Debes seleccionar al menos un producto o combo.'}, status=status.HTTP_400_BAD_REQUEST)

        movs = []
        try:
            for item in items:
                try:
                    cantidad = int(item.get('cantidad', 0))
                except (TypeError, ValueError):
                    raise ValueError('La cantidad debe ser un número entero válido.')
                if cantidad <= 0:
                    raise ValueError('La cantidad debe ser mayor a 0.')
                if item.get('is_combo'):
                    combo = Combo.objects.prefetch_related('componentes__producto').get(pk=item['combo_id'])
                    for comp in combo.componentes.all():
                        movs.extend(
                            descontar_stock_fefo(
                                comp.producto,
                                comp.cantidad * cantidad,
                                fecha_hora=fecha_dt,
                                motivo=f'Salida Combo: {combo.nombre} (FEFO)',
                            )
                        )
                else:
                    prod = Producto.objects.get(pk=item['producto_id'])
                    movs.extend(
                        descontar_stock_fefo(
                            prod,
                            cantidad,
                            fecha_hora=fecha_dt,
                            motivo='Salida por venta mostrador (FEFO)',
                        )
                    )
        except ValueError as exc:
            transaction.set_rollback(True)
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {'movimientos': MovimientoInventarioSerializer(movs, many=True).data},
            status=status.HTTP_201_CREATED,
        )


class RegistrarMermaAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    @transaction.atomic
    def post(self, request):
        lote_id = request.data.get('lote_id')
        try:
            cantidad = int(request.data.get('cantidad', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'La cantidad debe ser un número entero.'}, status=status.HTTP_400_BAD_REQUEST)
        motivo = request.data.get('motivo') or 'Merma'

        lote = Lote.objects.select_for_update().select_related('producto').get(pk=lote_id)
        if cantidad <= 0 or lote.stock_actual < cantidad:
            return Response({'detail': 'Stock insuficiente en el lote seleccionado.'}, status=status.HTTP_400_BAD_REQUEST)

        lote.stock_actual -= cantidad
        lote.save(update_fields=['stock_actual'])
        stock_total = sincronizar_stock_producto(lote.producto)

        mov = MovimientoInventario.objects.create(
            tipo=MovimientoInventario.Tipo.MERMA,
            producto=lote.producto,
            lote=lote,
            codigo_lote=lote.codigo_lote,
            cantidad=-cantidad,
            stock_resultante=stock_total,
            costo_unitario=lote.precio_compra,
            motivo=motivo,
        )
        return Response(MovimientoInventarioSerializer(mov).data, status=status.HTTP_201_CREATED)


class DevolucionClienteAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    @transaction.atomic
    def post(self, request):
        lote_id = request.data.get('lote_id')
        cantidad = int(request.data.get('cantidad', 0))
        en_buen_estado = bool(request.data.get('en_buen_estado', True))
        motivo = request.data.get('motivo') or 'Devolución cliente'

        lote = Lote.objects.select_for_update().select_related('producto').get(pk=lote_id)
        if en_buen_estado:
            lote.stock_actual += cantidad
            lote.save(update_fields=['stock_actual'])
            stock_total = sincronizar_stock_producto(lote.producto)
            mov = MovimientoInventario.objects.create(
                tipo=MovimientoInventario.Tipo.DEV_CLIENTE,
                producto=lote.producto,
                lote=lote,
                codigo_lote=lote.codigo_lote,
                cantidad=cantidad,
                stock_resultante=stock_total,
                costo_unitario=lote.precio_compra,
                motivo=f'Reingreso buen estado: {motivo}',
            )
        else:
            stock_total = sincronizar_stock_producto(lote.producto)
            mov = MovimientoInventario.objects.create(
                tipo=MovimientoInventario.Tipo.MERMA,
                producto=lote.producto,
                lote=lote,
                codigo_lote=lote.codigo_lote,
                cantidad=0,
                stock_resultante=stock_total,
                costo_unitario=lote.precio_compra,
                motivo=f'Devolución cliente dañada (Merma): {motivo}',
            )
        return Response(MovimientoInventarioSerializer(mov).data, status=status.HTTP_201_CREATED)
