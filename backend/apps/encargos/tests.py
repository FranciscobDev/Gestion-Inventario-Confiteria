from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.clientes.models import Cliente
from apps.gestion.models import Categoria, Lote, Producto, Proveedor

EN_PREPARACION = 'En preparaci\u00f3n'


class EncargoAdminClienteTests(TestCase):
    def setUp(self):
        User = get_user_model()
        User.objects.create_superuser(username='admin', email='a@a.cl', password='admin123')
        cat = Categoria.objects.create(nombre_categoria='Chocolates')
        prov = Proveedor.objects.create(nombre_empresa='Cordillera S.A.')
        self.prod = Producto.objects.create(
            nombre='Bombones', categoria=cat, proveedor=prov,
            precio_compra=1000, precio_venta=2000, stock_actual=10, stock_minimo=3,
        )
        Lote.objects.create(
            producto=self.prod, codigo_lote='L-1',
            fecha_vencimiento=timezone.localdate() + timedelta(days=30),
            precio_compra=900, stock_actual=10,
        )
        cliente = Cliente(telefono='912345678', nombre='Ana')
        cliente.set_password('Cliente-123!')
        cliente.save()

        self.api_cliente = APIClient()
        r = self.api_cliente.post(
            '/api/clientes/login/', {'telefono': '912345678', 'password': 'Cliente-123!'}, format='json'
        )
        self.api_cliente.credentials(HTTP_AUTHORIZATION=f"Token {r.data['token']}")

        self.api_admin = APIClient()
        r = self.api_admin.post('/api/usuarios/login/', {'username': 'admin', 'password': 'admin123'}, format='json')
        self.api_admin.credentials(HTTP_AUTHORIZATION=f"Token {r.data['token']}")

    def test_admin_cambia_estado_y_el_cliente_lo_ve_sin_motivo(self):
        fecha = (timezone.localdate() + timedelta(days=2)).isoformat()
        pid = self.api_cliente.post(
            '/api/clientes/encargos/nuevo/',
            {'fecha_entrega': fecha, 'items': [{'producto_id': self.prod.pk, 'cantidad': 1}]},
            format='json',
        ).data['id']

        r = self.api_admin.post(f'/api/encargos/{pid}/cambiar-estado/', {'estado': EN_PREPARACION}, format='json')
        self.assertEqual(r.status_code, 200)

        pedidos = self.api_cliente.get('/api/clientes/encargos/').data
        pedido = next(e for e in pedidos if e['id'] == pid)
        self.assertEqual(pedido['estado'], EN_PREPARACION)
        self.assertEqual([h['estado'] for h in pedido['historial']], ['Pendiente', EN_PREPARACION])
        for h in pedido['historial']:
            self.assertEqual(set(h.keys()), {'fecha', 'estado'})
            self.assertNotIn('motivo', h)

    def test_pedido_creado_por_admin_tiene_origen_admin(self):
        fecha = (timezone.localdate() + timedelta(days=2)).isoformat()
        r = self.api_admin.post(
            '/api/encargos/',
            {
                'cliente_nombre': 'Mostrador', 'cliente_telefono': '911111111',
                'fecha_entrega': fecha, 'hora_entrega': '16:00', 'estado': 'Pendiente',
                'notas': '', 'items': [{'producto': self.prod.pk, 'cantidad': 1}],
            },
            format='json',
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['origen'], 'Admin')
        self.assertIsNone(r.data['cliente_id'])
