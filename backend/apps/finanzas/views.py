from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.usuarios.permissions import IsOwnerOrAdmin
from .models import CorreccionVenta, VentaFinanzas
from .serializers import VentaFinanzasSerializer


class VentaFinanzasViewSet(viewsets.ModelViewSet):
    queryset = VentaFinanzas.objects.prefetch_related('correcciones').all()
    serializer_class = VentaFinanzasSerializer
    permission_classes = [IsOwnerOrAdmin]

    @transaction.atomic
    def perform_update(self, serializer):
        prev = self.get_object()
        old_desc = f'${prev.monto} ({prev.medio_pago})'
        venta = serializer.save()
        new_desc = f'${venta.monto} ({venta.medio_pago})'
        if old_desc != new_desc:
            CorreccionVenta.objects.create(venta=venta, anterior=old_desc, nuevo=new_desc)

    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        venta = self.get_object()
        motivo = (request.data.get('motivo') or '').strip()
        if not motivo:
            return Response({'detail': 'El motivo de anulación es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)
        venta.estado = VentaFinanzas.Estado.ANULADA
        venta.motivo_anulacion = motivo
        venta.fecha_anulacion = timezone.now()
        venta.save(update_fields=['estado', 'motivo_anulacion', 'fecha_anulacion'])
        return Response(VentaFinanzasSerializer(venta).data)
