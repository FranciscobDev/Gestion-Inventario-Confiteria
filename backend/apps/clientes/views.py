from datetime import date, timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.encargos.models import DetalleEncargo, Encargo, HistorialEncargo
from apps.gestion.models import Lote, MovimientoInventario, Producto
from apps.gestion.services import obtener_stock_reservado, sincronizar_stock_producto
from .authentication import ClienteTokenAuthentication
from .models import Cliente, TokenCliente
from .permissions import IsCliente
from .serializers import EncargoClienteSerializer, RegistroClienteSerializer
from .utils import normalizar_telefono

MAX_INTENTOS = 5
MINUTOS_BLOQUEO = 5


def _respuesta_sesion(cliente):
    token, _ = TokenCliente.objects.get_or_create(cliente=cliente)
    return {
        'token': token.key,
        'cliente': {'id': cliente.id, 'nombre': cliente.nombre, 'telefono': cliente.telefono},
    }


class RegistroClienteView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        ser = RegistroClienteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        tel = ser.validated_data['telefono']

        if Cliente.objects.filter(telefono=tel).exists():
            return Response({'detail': 'Ya existe una cuenta con ese teléfono.'}, status=status.HTTP_400_BAD_REQUEST)

        cliente = Cliente(telefono=tel, nombre=ser.validated_data['nombre'])
        cliente.set_password(ser.validated_data['password'])
        cliente.save()

        # Asocia los encargos existentes que tengan el mismo teléfono
        for enc in Encargo.objects.filter(cliente__isnull=True):
            if normalizar_telefono(enc.cliente_telefono) == tel:
                enc.cliente = cliente
                enc.save(update_fields=['cliente'])

        return Response(_respuesta_sesion(cliente), status=status.HTTP_201_CREATED)


class LoginClienteView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        tel = normalizar_telefono(request.data.get('telefono'))
        password = request.data.get('password') or ''
        cliente = Cliente.objects.filter(telefono=tel).first()
        ahora = timezone.now()

        if cliente and cliente.locked_until and ahora < cliente.locked_until:
            return Response(
                {'detail': 'Cuenta bloqueada temporalmente. Intenta en unos minutos.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not cliente or not cliente.activo or not cliente.check_password(password):
            if cliente:
                cliente.failed_attempts += 1
                if cliente.failed_attempts >= MAX_INTENTOS:
                    cliente.locked_until = ahora + timedelta(minutes=MINUTOS_BLOQUEO)
                    cliente.failed_attempts = 0
                cliente.save(update_fields=['failed_attempts', 'locked_until'])
            # Mensaje genérico: no revela si el teléfono existe
            return Response({'detail': 'Teléfono o contraseña incorrectos.'}, status=status.HTTP_401_UNAUTHORIZED)

        cliente.failed_attempts = 0
        cliente.locked_until = None
        cliente.save(update_fields=['failed_attempts', 'locked_until'])
        return Response(_respuesta_sesion(cliente))


class LogoutClienteView(APIView):
    authentication_classes = [ClienteTokenAuthentication]
    permission_classes = [IsCliente]

    def post(self, request):
        TokenCliente.objects.filter(cliente=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeClienteView(APIView):
    authentication_classes = [ClienteTokenAuthentication]
    permission_classes = [IsCliente]

    def get(self, request):
        c = request.user
        return Response({'id': c.id, 'nombre': c.nombre, 'telefono': c.telefono})


class MisEncargosView(generics.ListAPIView):
    """Lista los encargos del cliente. Acepta ?estado=Entregado para filtrar el historial."""
    authentication_classes = [ClienteTokenAuthentication]
    permission_classes = [IsCliente]
    serializer_class = EncargoClienteSerializer

    def get_queryset(self):
        qs = Encargo.objects.filter(cliente=self.request.user).prefetch_related('items__producto')
        estado = self.request.query_params.get('estado')
        return qs.filter(estado=estado) if estado else qs


class CancelarEncargoView(APIView):
    authentication_classes = [ClienteTokenAuthentication]
    permission_classes = [IsCliente]

    @transaction.atomic
    def post(self, request, pk):
        enc = Encargo.objects.filter(pk=pk, cliente=request.user).first()
        if not enc:
            return Response({'detail': 'Encargo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        if enc.estado != Encargo.Estado.PENDIENTE:
            return Response(
                {'detail': 'Solo puedes cancelar encargos pendientes. Para otros cambios, contacta a la confitería.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enc.estado = Encargo.Estado.CANCELADO
        enc.save(update_fields=['estado'])
        HistorialEncargo.objects.create(
            encargo=enc, estado=enc.estado, motivo='Cancelado por el cliente'
        )
        return Response(EncargoClienteSerializer(enc).data)


class CatalogoClienteView(APIView):
    authentication_classes = [ClienteTokenAuthentication]
    permission_classes = [IsCliente]

    def get(self, request):
        productos = Producto.objects.filter(activo=True).select_related('categoria').order_by('nombre')
        data = []
        for p in productos:
            disponible = p.stock_actual - obtener_stock_reservado(p)
            if disponible <= 0:
                continue
            data.append({
                'id': p.id_producto,
                'nombre': p.nombre,
                'categoria': p.categoria.nombre_categoria,
                'precio_venta': p.precio_venta,
                'unidad_medida': p.unidad_medida,
                'disponible': disponible,
            })
        return Response(data)


class NuevoEncargoClienteView(APIView):
    authentication_classes = [ClienteTokenAuthentication]
    permission_classes = [IsCliente]

    @transaction.atomic
    def post(self, request):
        cliente = request.user
        fecha_str = request.data.get('fecha_entrega')
        hora = (request.data.get('hora_entrega') or '16:00').strip()[:10]
        notas = (request.data.get('notas') or '').strip()
        items = request.data.get('items') or []

        try:
            fecha = date.fromisoformat(fecha_str)
        except (TypeError, ValueError):
            return Response({'detail': 'Indica una fecha de entrega válida.'}, status=status.HTTP_400_BAD_REQUEST)
        if fecha <= timezone.localdate():
            return Response(
                {'detail': 'La fecha de entrega debe ser desde mañana en adelante.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not items:
            return Response({'detail': 'Agrega al menos un producto.'}, status=status.HTTP_400_BAD_REQUEST)

        # Consolida cantidades repetidas del mismo producto
        pedido = {}
        for it in items:
            try:
                pid = int(it.get('producto_id'))
                cant = int(it.get('cantidad'))
            except (TypeError, ValueError):
                return Response({'detail': 'Producto o cantidad inválidos.'}, status=status.HTTP_400_BAD_REQUEST)
            if cant <= 0:
                return Response({'detail': 'La cantidad debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
            pedido[pid] = pedido.get(pid, 0) + cant

        productos = {}
        for pid, cant in pedido.items():
            prod = Producto.objects.filter(pk=pid, activo=True).first()
            if not prod:
                return Response(
                    {'detail': 'Uno de los productos ya no está disponible.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            disponible = prod.stock_actual - obtener_stock_reservado(prod)
            if cant > disponible:
                return Response(
                    {'detail': f'Stock insuficiente de "{prod.nombre}". Disponibles: {max(disponible, 0)}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            productos[pid] = prod

        encargo = Encargo.objects.create(
            cliente=cliente,
            cliente_nombre=cliente.nombre,
            cliente_telefono=cliente.telefono,
            fecha_entrega=fecha,
            hora_entrega=hora,
            notas=notas,
        )

        for pid, cant in pedido.items():
            prod = productos[pid]
            DetalleEncargo.objects.create(encargo=encargo, producto=prod, cantidad=cant)
            stock_total = sincronizar_stock_producto(prod)
            proximo_lote = (
                Lote.objects.filter(producto=prod, stock_actual__gt=0)
                .order_by('fecha_vencimiento')
                .first()
            )
            MovimientoInventario.objects.create(
                tipo=MovimientoInventario.Tipo.RESERVA,
                producto=prod,
                lote=proximo_lote,
                codigo_lote=proximo_lote.codigo_lote if proximo_lote else '-',
                cantidad=0,
                stock_resultante=stock_total,
                costo_unitario=0,
                motivo=f'Reserva #{encargo.id} ({cant} u.) — {cliente.nombre}',
            )

        HistorialEncargo.objects.create(
            encargo=encargo,
            estado=encargo.estado,
            motivo='Encargo solicitado por el cliente',
        )
        return Response(EncargoClienteSerializer(encargo).data, status=status.HTTP_201_CREATED)