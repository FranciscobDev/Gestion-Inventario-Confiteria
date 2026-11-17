import os
from django.conf import settings
from django.core.management import call_command
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.compras.models import DevolucionProveedor, OrdenCompra
from apps.compras.serializers import (
    DevolucionProveedorSerializer,
    OrdenCompraSerializer,
    ProveedorSerializer,
)
from apps.encargos.models import Encargo
from apps.encargos.serializers import EncargoSerializer
from apps.finanzas.models import VentaFinanzas
from apps.finanzas.serializers import VentaFinanzasSerializer
from apps.gestion.models import (
    Categoria,
    Combo,
    Lote,
    MovimientoInventario,
    Producto,
    Proveedor,
)
from apps.gestion.serializers import (
    CategoriaSerializer,
    ComboSerializer,
    LoteSerializer,
    MovimientoInventarioSerializer,
    ProductoSerializer,
)
from apps.usuarios.models import ConfiguracionNegocio
from apps.usuarios.permissions import IsOwnerOrAdmin
from apps.usuarios.serializers import ConfiguracionNegocioSerializer
from .models import DiaRevisado, RegistroRespaldo


class BootstrapDataAPIView(APIView):
    """
    Entrega en una sola llamada el estado inicial sincronizado para el frontend React.
    """
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        cfg = ConfiguracionNegocio.get_solo()
        revisados = {str(d.fecha): d.nota for d in DiaRevisado.objects.all()}
        backups = [
            {
                'id': f'bkp-{b.id}',
                'fechaHora': b.fecha_hora.strftime('%Y-%m-%d %H:%M'),
                'tipo': b.tipo,
                'destino': b.destino,
                'tamano': b.tamano,
                'cifrado': b.cifrado,
                'integridad': b.integridad,
            }
            for b in RegistroRespaldo.objects.all()[:15]
        ]

        return Response({
            'config': ConfiguracionNegocioSerializer(cfg).data,
            'categories': CategoriaSerializer(Categoria.objects.all(), many=True).data,
            'providers': ProveedorSerializer(Proveedor.objects.all(), many=True).data,
            'products': ProductoSerializer(
                Producto.objects.prefetch_related('historial_precios', 'proveedores').all(),
                many=True,
                context={'request': request},
            ).data,
            'lots': LoteSerializer(Lote.objects.all(), many=True).data,
            'combos': ComboSerializer(Combo.objects.prefetch_related('componentes').all(), many=True).data,
            'orders': EncargoSerializer(Encargo.objects.prefetch_related('items', 'historial').all(), many=True).data,
            'movements': MovimientoInventarioSerializer(MovimientoInventario.objects.all()[:200], many=True).data,
            'sales_finance': VentaFinanzasSerializer(VentaFinanzas.objects.prefetch_related('correcciones').all(), many=True).data,
            'supplier_returns': DevolucionProveedorSerializer(DevolucionProveedor.objects.all(), many=True).data,
            'purchase_orders': OrdenCompraSerializer(OrdenCompra.objects.prefetch_related('items').all(), many=True).data,
            'reviewed_days': revisados,
            'backups': backups,
        })


class DiaRevisadoAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def post(self, request):
        fecha = request.data.get('fecha')
        nota = request.data.get('nota') or 'Revisado por el dueño'
        if not fecha:
            return Response({'detail': 'La fecha es obligatoria.'}, status=status.HTTP_400_BAD_REQUEST)
        obj, _ = DiaRevisado.objects.update_or_create(fecha=fecha, defaults={'nota': nota})
        return Response({'fecha': str(obj.fecha), 'nota': obj.nota})


class RespaldoAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        data = [
            {
                'id': f'bkp-{b.id}',
                'fechaHora': b.fecha_hora.strftime('%Y-%m-%d %H:%M'),
                'tipo': b.tipo,
                'destino': b.destino,
                'tamano': b.tamano,
                'cifrado': b.cifrado,
                'integridad': b.integridad,
            }
            for b in RegistroRespaldo.objects.all()[:15]
        ]
        return Response(data)

    def post(self, request):
        backups_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backups_dir, exist_ok=True)

        reg = RegistroRespaldo.objects.create(tipo=request.data.get('tipo', 'Manual'), destino='Local')
        filename = f'respaldo_{reg.fecha_hora.strftime("%Y%m%d_%H%M%S")}.json'
        filepath = os.path.join(backups_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            call_command('dumpdata', 'usuarios', 'gestion', 'compras', 'encargos', 'finanzas', 'reportes', stdout=f)

        size_kb = max(1, round(os.path.getsize(filepath) / 1024, 1))
        reg.tamano = f'{size_kb} KB'
        reg.archivo_ruta = filename
        reg.save(update_fields=['tamano', 'archivo_ruta'])

        return Response(
            {
                'id': f'bkp-{reg.id}',
                'fechaHora': reg.fecha_hora.strftime('%Y-%m-%d %H:%M'),
                'tipo': reg.tipo,
                'destino': reg.destino,
                'tamano': reg.tamano,
                'cifrado': reg.cifrado,
                'integridad': reg.integridad,
            },
            status=status.HTTP_201_CREATED,
        )
