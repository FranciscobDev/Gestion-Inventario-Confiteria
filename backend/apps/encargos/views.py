from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.gestion.models import Lote, MovimientoInventario
from apps.gestion.services import descontar_stock_fefo, sincronizar_stock_producto
from apps.usuarios.permissions import IsOwnerOrAdmin
from .models import Encargo, HistorialEncargo
from .serializers import EncargoSerializer


class EncargoViewSet(viewsets.ModelViewSet):
    queryset = Encargo.objects.prefetch_related('items__producto', 'historial').all()
    serializer_class = EncargoSerializer
    permission_classes = [IsOwnerOrAdmin]

    @transaction.atomic
    def perform_create(self, serializer):
        encargo = serializer.save()
        for item in encargo.items.all():
            stock_total = sincronizar_stock_producto(item.producto)
            proximo_lote = (
                Lote.objects.filter(producto=item.producto, stock_actual__gt=0)
                .order_by('fecha_vencimiento')
                .first()
            )
            MovimientoInventario.objects.create(
                tipo=MovimientoInventario.Tipo.RESERVA,
                producto=item.producto,
                lote=proximo_lote,
                codigo_lote=proximo_lote.codigo_lote if proximo_lote else '-',
                cantidad=0,
                stock_resultante=stock_total,
                costo_unitario=0,
                motivo=f'Reserva #{encargo.id} ({item.cantidad} u.) — {encargo.cliente_nombre}',
            )

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    @transaction.atomic
    def cambiar_estado(self, request, pk=None):
        encargo = self.get_object()
        next_state = request.data.get('estado')
        motivo = request.data.get('motivo') or f'Cambio a {next_state}'

        allowed = {
            Encargo.Estado.PENDIENTE: [Encargo.Estado.EN_PREPARACION, Encargo.Estado.ENTREGADO, Encargo.Estado.CANCELADO],
            Encargo.Estado.EN_PREPARACION: [Encargo.Estado.ENTREGADO, Encargo.Estado.CANCELADO],
        }
        if next_state not in allowed.get(encargo.estado, []):
            return Response(
                {'detail': f'Transición no permitida de "{encargo.estado}" a "{next_state}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if next_state == Encargo.Estado.ENTREGADO:
            try:
                for item in encargo.items.select_related('producto').all():
                    descontar_stock_fefo(
                        item.producto,
                        item.cantidad,
                        motivo=f'Entrega Encargo #{encargo.id} ({encargo.cliente_nombre})',
                        ignorar_reservas=True,
                    )
            except ValueError as exc:
                transaction.set_rollback(True)
                return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        encargo.estado = next_state
        encargo.save(update_fields=['estado'])
        HistorialEncargo.objects.create(encargo=encargo, estado=next_state, motivo=motivo)
        return Response(EncargoSerializer(encargo).data)
