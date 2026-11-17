from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.gestion.models import Lote, MovimientoInventario, Producto, Proveedor
from apps.gestion.services import sincronizar_stock_producto
from apps.usuarios.permissions import IsOwnerOrAdmin
from .models import DevolucionProveedor, OrdenCompra
from .serializers import (
    DevolucionProveedorSerializer,
    OrdenCompraSerializer,
    ProveedorSerializer,
)


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsOwnerOrAdmin]


class OrdenCompraViewSet(viewsets.ModelViewSet):
    queryset = OrdenCompra.objects.prefetch_related('items').select_related('proveedor').all()
    serializer_class = OrdenCompraSerializer
    permission_classes = [IsOwnerOrAdmin]

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def recibir(self, request, pk=None):
        orden = self.get_object()
        lines = request.data.get('items', [])
        for ln in lines:
            qty = int(ln.get('cantidad', 0))
            if qty <= 0:
                continue
            producto = Producto.objects.get(pk=ln['producto_id'])
            codigo_lote = ln.get('codigo_lote') or f'OC{orden.id}-P{producto.id_producto}'
            lote = Lote.objects.create(
                producto=producto,
                codigo_lote=codigo_lote,
                fecha_vencimiento=ln.get('fecha_vencimiento') or None,
                precio_compra=ln.get('costo_estimado') or producto.precio_compra,
                stock_actual=qty,
            )
            stock_total = sincronizar_stock_producto(producto)
            MovimientoInventario.objects.create(
                tipo=MovimientoInventario.Tipo.INGRESO,
                producto=producto,
                lote=lote,
                codigo_lote=lote.codigo_lote,
                cantidad=qty,
                stock_resultante=stock_total,
                costo_unitario=lote.precio_compra,
                motivo=f'Recepción Orden de Compra #{orden.id}',
            )
        orden.estado = OrdenCompra.Estado.RECIBIDA
        orden.save(update_fields=['estado'])
        return Response(OrdenCompraSerializer(orden).data)


class DevolucionProveedorViewSet(viewsets.ModelViewSet):
    queryset = DevolucionProveedor.objects.select_related('proveedor', 'producto').all()
    serializer_class = DevolucionProveedorSerializer
    permission_classes = [IsOwnerOrAdmin]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        lote_id = request.data.get('lote')
        cantidad = int(request.data.get('cantidad', 0))
        lote = Lote.objects.select_for_update().select_related('producto').get(pk=lote_id)
        if cantidad <= 0 or lote.stock_actual < cantidad:
            return Response({'detail': 'Stock insuficiente en el lote seleccionado.'}, status=status.HTTP_400_BAD_REQUEST)

        lote.stock_actual -= cantidad
        lote.save(update_fields=['stock_actual'])
        stock_total = sincronizar_stock_producto(lote.producto)

        MovimientoInventario.objects.create(
            tipo=MovimientoInventario.Tipo.DEV_PROVEEDOR,
            producto=lote.producto,
            lote=lote,
            codigo_lote=lote.codigo_lote,
            cantidad=-cantidad,
            stock_resultante=stock_total,
            costo_unitario=lote.precio_compra,
            motivo=f"{request.data.get('motivo', '')}: {request.data.get('detalle', '')}",
        )

        data = request.data.copy()
        data['codigo_lote'] = lote.codigo_lote
        data['producto'] = lote.producto.id_producto
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
