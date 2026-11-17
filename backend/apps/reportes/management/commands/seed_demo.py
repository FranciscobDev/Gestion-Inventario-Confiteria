from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.compras.models import DevolucionProveedor, OrdenCompra, DetalleOrdenCompra
from apps.encargos.models import DetalleEncargo, Encargo, HistorialEncargo
from apps.finanzas.models import VentaFinanzas
from apps.gestion.models import (
    Categoria,
    Combo,
    ComboItem,
    HistorialPrecio,
    Lote,
    MovimientoInventario,
    Producto,
    Proveedor,
)
from apps.usuarios.models import ConfiguracionNegocio


class Command(BaseCommand):
    help = 'Carga usuario administrador (admin/admin123) y datos iniciales de demostración para Arteconfi.'

    def handle(self, *args, **options):
        User = get_user_model()
        today = timezone.localdate()

        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@arteconfi.cl', 'is_staff': True, 'is_superuser': True},
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Usuario admin creado (admin / admin123).'))

        ConfiguracionNegocio.get_solo()

        if Categoria.objects.exists():
            self.stdout.write('Ya existen datos en la base de datos. Seed omitido.')
            return

        c1 = Categoria.objects.create(nombre_categoria='Chocolates', descripcion='Barras, bombones y coberturas')
        c2 = Categoria.objects.create(nombre_categoria='Caramelos y Gomitas', descripcion='Dulces masticables y gomitas')
        c3 = Categoria.objects.create(nombre_categoria='Galletas y Alfajores', descripcion='Biscuits, obleas y alfajores')
        c4 = Categoria.objects.create(nombre_categoria='Snacks Salados', descripcion='Papas fritas y frutos secos')
        c5 = Categoria.objects.create(nombre_categoria='Insumos Repostería', descripcion='Mostacillas y coberturas por kilo')

        pr1 = Proveedor.objects.create(
            nombre_empresa='Distribuidora DulceSur Ltda.',
            rut='76.432.190-5',
            contacto_nombre='Claudia Morales',
            telefono='+56 9 8234 5511',
            email='ventas@dulcesur.cl',
            dias_entrega='Lunes y Jueves',
            direccion='Av. Los Conquistadores 412, Santiago',
        )
        pr2 = Proveedor.objects.create(
            nombre_empresa='Chocolatería Cordillera S.A.',
            rut='96.811.204-K',
            contacto_nombre='Matías Rojas',
            telefono='+56 9 7120 3389',
            email='pedidos@cordillerachoc.cl',
            dias_entrega='Martes y Viernes',
            direccion='Camino El Alba 1180, Maipú',
        )
        pr3 = Proveedor.objects.create(
            nombre_empresa='Confites Mayoristas Central',
            rut='77.120.890-2',
            contacto_nombre='Sergio Paredes',
            telefono='+56 9 9455 1102',
            email='sergio@confitescentral.cl',
            dias_entrega='Miércoles',
            direccion='San Pablo 2450, Santiago',
        )

        p1 = Producto.objects.create(
            codigo_barras='7801620001123',
            nombre='Bombones Surtidos Caja 250g',
            descripcion='Caja surtida chocolate leche y bitter con relleno praliné',
            categoria=c1,
            proveedor=pr2,
            precio_compra=3200,
            precio_venta=5490,
            stock_actual=24,
            stock_minimo=10,
            stock_objetivo=30,
            unidad_medida='Unidad',
        )
        p1.proveedores.add(pr2, pr1)

        p2 = Producto.objects.create(
            codigo_barras='7801620002245',
            nombre='Gomitas Ositos Frutales 1kg',
            descripcion='Bolsa a granel de gomitas surtidas sabor fruta',
            categoria=c2,
            proveedor=pr3,
            precio_compra=2400,
            precio_venta=4200,
            stock_actual=15,
            stock_minimo=8,
            stock_objetivo=25,
            unidad_medida='Kilos',
        )
        p2.proveedores.add(pr3, pr1)

        p3 = Producto.objects.create(
            codigo_barras='7801620003389',
            nombre='Alfajor Artesanal Manjar Nuez',
            descripcion='Alfajor bañado en chocolate semi amargo relleno con manjar',
            categoria=c3,
            proveedor=pr1,
            precio_compra=650,
            precio_venta=1200,
            stock_actual=16,
            stock_minimo=15,
            stock_objetivo=50,
            unidad_medida='Unidad',
        )
        p3.proveedores.add(pr1)

        p4 = Producto.objects.create(
            codigo_barras='7801620004490',
            nombre='Mix Frutos Secos Salados 500g',
            descripcion='Maní, almendras y pasas tostadas con sal marina',
            categoria=c4,
            proveedor=pr3,
            precio_compra=2800,
            precio_venta=4600,
            stock_actual=7,
            stock_minimo=12,
            stock_objetivo=30,
            unidad_medida='Unidad',
        )
        p4.proveedores.add(pr3)

        p5 = Producto.objects.create(
            codigo_barras='7801620005511',
            nombre='Cobertura Chocolate Blanco 1kg',
            descripcion='Tableta de cobertura para baño de repostería',
            categoria=c5,
            proveedor=pr2,
            precio_compra=4500,
            precio_venta=6990,
            stock_actual=4,
            stock_minimo=6,
            stock_objetivo=20,
            unidad_medida='Kilos',
        )
        p5.proveedores.add(pr2)

        p6 = Producto.objects.create(
            codigo_barras='7801620006602',
            nombre='Calugas de Leche Tradicionales (Bolsa 30u)',
            descripcion='Calugas blandas artesanales envueltas individualmente',
            categoria=c2,
            proveedor=pr1,
            precio_compra=1500,
            precio_venta=2800,
            stock_actual=22,
            stock_minimo=10,
            stock_objetivo=30,
            unidad_medida='Unidad',
        )
        p6.proveedores.add(pr1, pr3)

        for p in (p1, p2, p3, p4, p5, p6):
            HistorialPrecio.objects.create(
                producto=p,
                precio_compra=p.precio_compra,
                precio_venta=p.precio_venta,
                motivo='Registro inicial',
            )

        l101 = Lote.objects.create(producto=p1, codigo_lote='L-BOM-01', fecha_vencimiento=today + timedelta(days=11), precio_compra=3000, stock_actual=6)
        l102 = Lote.objects.create(producto=p1, codigo_lote='L-BOM-02', fecha_vencimiento=today + timedelta(days=65), precio_compra=3200, stock_actual=18)
        Lote.objects.create(producto=p2, codigo_lote='L-GOM-08', fecha_vencimiento=today + timedelta(days=24), precio_compra=2400, stock_actual=5, precio_oferta=3500)
        Lote.objects.create(producto=p2, codigo_lote='L-GOM-09', fecha_vencimiento=today + timedelta(days=120), precio_compra=2400, stock_actual=10)
        Lote.objects.create(producto=p3, codigo_lote='L-ALF-14', fecha_vencimiento=today - timedelta(days=2), precio_compra=650, stock_actual=4)
        l106 = Lote.objects.create(producto=p3, codigo_lote='L-ALF-15', fecha_vencimiento=today + timedelta(days=9), precio_compra=650, stock_actual=12)
        l107 = Lote.objects.create(producto=p4, codigo_lote='L-MIX-03', fecha_vencimiento=today + timedelta(days=48), precio_compra=2800, stock_actual=7)
        Lote.objects.create(producto=p5, codigo_lote='L-COB-05', fecha_vencimiento=today + timedelta(days=22), precio_compra=4500, stock_actual=4)
        Lote.objects.create(producto=p6, codigo_lote='L-CAL-11', fecha_vencimiento=today + timedelta(days=90), precio_compra=1500, stock_actual=22)

        cb1 = Combo.objects.create(nombre='Pack Dulce Regalo', precio_especial=7990, fecha_inicio=today - timedelta(days=5), fecha_fin=today + timedelta(days=25))
        ComboItem.objects.create(combo=cb1, producto=p1, cantidad=1)
        ComboItem.objects.create(combo=cb1, producto=p3, cantidad=2)
        ComboItem.objects.create(combo=cb1, producto=p6, cantidad=1)

        cb2 = Combo.objects.create(nombre='Combo Tarde de Picoteo', precio_especial=7800, fecha_inicio=today - timedelta(days=10), fecha_fin=today + timedelta(days=15))
        ComboItem.objects.create(combo=cb2, producto=p2, cantidad=1)
        ComboItem.objects.create(combo=cb2, producto=p4, cantidad=1)

        enc1 = Encargo.objects.create(cliente_nombre='María José Fuentes', cliente_telefono='+56 9 6543 2109', fecha_entrega=today, hora_entrega='17:30', estado='En preparación', notas='Caja regalo cumpleaños infantil')
        DetalleEncargo.objects.create(encargo=enc1, producto=p1, cantidad=2)
        DetalleEncargo.objects.create(encargo=enc1, producto=p3, cantidad=6)
        HistorialEncargo.objects.create(encargo=enc1, estado='Pendiente', motivo='Encargo agendado')
        HistorialEncargo.objects.create(encargo=enc1, estado='En preparación', motivo='Armado de cajas iniciado')

        enc2 = Encargo.objects.create(cliente_nombre='Colegio San Gabriel', cliente_telefono='+56 9 8812 3400', fecha_entrega=today - timedelta(days=1), hora_entrega='12:00', estado='Pendiente', notas='Bolsitas para convivencia')
        DetalleEncargo.objects.create(encargo=enc2, producto=p6, cantidad=4)
        HistorialEncargo.objects.create(encargo=enc2, estado='Pendiente', motivo='Encargo agendado')

        MovimientoInventario.objects.create(tipo='Ingreso', producto=p1, lote=l102, codigo_lote=l102.codigo_lote, cantidad=20, stock_resultante=26, costo_unitario=3200, motivo='Recepción orden de compra Chocolatería Cordillera')
        MovimientoInventario.objects.create(tipo='Venta', producto=p1, lote=l101, codigo_lote=l101.codigo_lote, cantidad=-2, stock_resultante=24, costo_unitario=3000, motivo='Salida por venta mostrador (FEFO)')
        MovimientoInventario.objects.create(tipo='Venta', producto=p3, lote=l106, codigo_lote=l106.codigo_lote, cantidad=-4, stock_resultante=16, costo_unitario=650, motivo='Salida por venta mostrador (FEFO)')
        MovimientoInventario.objects.create(tipo='Merma', producto=p4, lote=l107, codigo_lote=l107.codigo_lote, cantidad=-1, stock_resultante=7, costo_unitario=2800, motivo='Dañado — Envase rasgado en bodega')

        VentaFinanzas.objects.create(fecha_hora=timezone.now() - timedelta(days=1), monto=10980, medio_pago='Efectivo', nota='2 cajas bombones')
        VentaFinanzas.objects.create(fecha_hora=timezone.now() - timedelta(days=1), monto=4800, medio_pago='Tarjeta', nota='4 alfajores')
        VentaFinanzas.objects.create(fecha_hora=timezone.now(), monto=8400, medio_pago='Transferencia', nota='Venta directa mostrador')

        oc = OrdenCompra.objects.create(proveedor=pr3, estado='Enviada')
        DetalleOrdenCompra.objects.create(orden=oc, producto=p4, cantidad=23, costo_estimado=2800)

        DevolucionProveedor.objects.create(proveedor=pr1, producto=p3, codigo_lote='L-ALF-12', cantidad=5, motivo='Dañado', detalle='Cajas aplastadas en transporte', estado='Reembolsada')

        self.stdout.write(self.style.SUCCESS('Datos iniciales de Arteconfi cargados correctamente.'))
