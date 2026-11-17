from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.gestion.models import Categoria, Lote, Producto, Proveedor


class BackendIntegrationTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@arteconfi.cl',
            password='admin123',
        )
        self.client = APIClient()

        self.cat = Categoria.objects.create(nombre_categoria='Chocolates')
        self.prov = Proveedor.objects.create(nombre_empresa='Cordillera S.A.')
        self.prod = Producto.objects.create(
            nombre='Bombones',
            categoria=self.cat,
            proveedor=self.prov,
            precio_compra=1000,
            precio_venta=2000,
            stock_actual=10,
            stock_minimo=3,
        )
        today = timezone.localdate()
        self.lote_viejo = Lote.objects.create(
            producto=self.prod,
            codigo_lote='L-1',
            fecha_vencimiento=today + timedelta(days=5),
            precio_compra=900,
            stock_actual=4,
        )
        self.lote_nuevo = Lote.objects.create(
            producto=self.prod,
            codigo_lote='L-2',
            fecha_vencimiento=today + timedelta(days=30),
            precio_compra=1000,
            stock_actual=6,
        )

    def test_login_bootstrap_y_descuento_fefo(self):
        # 1. Login devuelve Token DRF
        resp = self.client.post('/api/usuarios/login/', {'username': 'admin', 'password': 'admin123'}, format='json')
        self.assertEqual(resp.status_code, 200)
        token = resp.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        # 2. Bootstrap entrega datos iniciales
        boot = self.client.get('/api/reportes/bootstrap/')
        self.assertEqual(boot.status_code, 200)
        self.assertEqual(len(boot.data['products']), 1)

        # 3. Salida FEFO de 6 unidades descuenta primero 4 del L-1 y 2 del L-2
        salida = self.client.post(
            '/api/inventario/salidas-venta/',
            {'items': [{'is_combo': False, 'producto_id': self.prod.id_producto, 'cantidad': 6}]},
            format='json',
        )
        self.assertEqual(salida.status_code, 201)
        self.lote_viejo.refresh_from_db()
        self.lote_nuevo.refresh_from_db()
        self.prod.refresh_from_db()
        self.assertEqual(self.lote_viejo.stock_actual, 0)
        self.assertEqual(self.lote_nuevo.stock_actual, 4)
        self.assertEqual(self.prod.stock_actual, 4)

    def test_finanzas_independiente(self):
        self.client.force_authenticate(user=self.admin)
        v_resp = self.client.post(
            '/api/finanzas/ventas/',
            {'monto': 5000, 'medio_pago': 'Efectivo', 'nota': 'Venta mostrador'},
            format='json',
        )
        self.assertEqual(v_resp.status_code, 201)
        venta_id = v_resp.data['id']

        an_resp = self.client.post(
            f'/api/finanzas/ventas/{venta_id}/anular/',
            {'motivo': 'Error de registro'},
            format='json',
        )
        self.assertEqual(an_resp.status_code, 200)
        self.assertEqual(an_resp.data['estado'], 'Anulada')

    def test_bloquea_salida_sobre_stock_disponible_y_datos_invalidos(self):
        self.client.force_authenticate(user=self.admin)
        # Intentar sacar 15 cuando solo hay 10 (no debe dejar bajar de 0)
        resp = self.client.post(
            '/api/inventario/salidas-venta/',
            {'items': [{'is_combo': False, 'producto_id': self.prod.id_producto, 'cantidad': 15}]},
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.prod.refresh_from_db()
        self.assertEqual(self.prod.stock_actual, 10)

        # Intentar pasar string en cantidad
        resp_str = self.client.post(
            '/api/inventario/salidas-venta/',
            {'items': [{'is_combo': False, 'producto_id': self.prod.id_producto, 'cantidad': 'abc'}]},
            format='json',
        )
        self.assertEqual(resp_str.status_code, 400)
