from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.encargos.models import Encargo
from apps.gestion.models import Categoria, Lote, MovimientoInventario, Producto, Proveedor

from .models import Cliente


class PortalClienteTests(TestCase):
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
        self.fecha = (timezone.localdate() + timedelta(days=2)).isoformat()

        self.cliente_a = self._crear_cliente('912345678', 'Ana')
        self.cliente_b = self._crear_cliente('987654321', 'Beto')
        self.api_a = self._api_cliente('912345678')
        self.api_b = self._api_cliente('987654321')
        self.api_admin = self._api_admin()

    def _crear_cliente(self, telefono, nombre):
        c = Cliente(telefono=telefono, nombre=nombre)
        c.set_password('Cliente-123!')
        c.save()
        return c

    def _api_cliente(self, telefono):
        api = APIClient()
        r = api.post('/api/clientes/login/', {'telefono': telefono, 'password': 'Cliente-123!'}, format='json')
        self.assertEqual(r.status_code, 200)
        api.credentials(HTTP_AUTHORIZATION=f"Token {r.data['token']}")
        return api

    def _api_admin(self):
        api = APIClient()
        r = api.post('/api/usuarios/login/', {'username': 'admin', 'password': 'admin123'}, format='json')
        self.assertEqual(r.status_code, 200)
        api.credentials(HTTP_AUTHORIZATION=f"Token {r.data['token']}")
        return api

    def _nuevo_pedido(self, api, cantidad=2):
        return api.post(
            '/api/clientes/encargos/nuevo/',
            {'fecha_entrega': self.fecha, 'items': [{'producto_id': self.prod.pk, 'cantidad': cantidad}]},
            format='json',
        )

    def test_pedido_del_cliente_aparece_en_admin_con_origen_portal_y_reserva(self):
        r = self._nuevo_pedido(self.api_a)
        self.assertEqual(r.status_code, 201)

        listado = self.api_admin.get('/api/encargos/')
        self.assertEqual(listado.status_code, 200)
        fila = next(e for e in listado.data if e['id'] == r.data['id'])
        self.assertEqual(fila['origen'], 'Portal')
        self.assertEqual(fila['cliente_id'], self.cliente_a.id)

        self.assertTrue(
            MovimientoInventario.objects.filter(
                tipo=MovimientoInventario.Tipo.RESERVA, producto=self.prod,
                motivo__contains=f"Reserva #{r.data['id']}",
            ).exists()
        )

    def test_cliente_cancela_pendiente_y_admin_lo_ve_cancelado(self):
        pid = self._nuevo_pedido(self.api_a).data['id']
        r = self.api_a.post(f'/api/clientes/encargos/{pid}/cancelar/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['estado'], 'Cancelado')

        fila = next(e for e in self.api_admin.get('/api/encargos/').data if e['id'] == pid)
        self.assertEqual(fila['estado'], 'Cancelado')

    def test_no_se_puede_cancelar_un_pedido_no_pendiente(self):
        pid = self._nuevo_pedido(self.api_a).data['id']
        Encargo.objects.filter(pk=pid).update(estado='En preparaciÃ³n')
        r = self.api_a.post(f'/api/clientes/encargos/{pid}/cancelar/')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Encargo.objects.get(pk=pid).estado, 'En preparaciÃ³n')

    def test_cliente_solo_ve_sus_pedidos(self):
        id_a = self._nuevo_pedido(self.api_a, 1).data['id']
        id_b = self._nuevo_pedido(self.api_b, 1).data['id']

        ids_a = [e['id'] for e in self.api_a.get('/api/clientes/encargos/').data]
        ids_b = [e['id'] for e in self.api_b.get('/api/clientes/encargos/').data]
        self.assertEqual(ids_a, [id_a])
        self.assertEqual(ids_b, [id_b])
        # tampoco puede cancelar el pedido ajeno
        self.assertEqual(self.api_a.post(f'/api/clientes/encargos/{id_b}/cancelar/').status_code, 404)

    def test_tokens_no_cruzan_entre_admin_y_cliente(self):
        # token de cliente en endpoints admin
        self.assertIn(self.api_a.get('/api/encargos/').status_code, (401, 403))
        self.assertIn(self.api_a.get('/api/reportes/bootstrap/').status_code, (401, 403))
        # token de admin en endpoints de cliente
        self.assertIn(self.api_admin.get('/api/clientes/encargos/').status_code, (401, 403))
        self.assertIn(self.api_admin.get('/api/clientes/me/').status_code, (401, 403))
        # sin credenciales
        self.assertIn(APIClient().get('/api/encargos/').status_code, (401, 403))
