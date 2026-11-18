from django.db import models
from django.utils import timezone


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=50, unique=True, verbose_name='Nombre de Categoría')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')

    objects = models.Manager()

    class Meta:
        db_table = 'categorias'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre_categoria']

    def __str__(self):
        return self.nombre_categoria


class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    nombre_empresa = models.CharField(max_length=100, verbose_name='Nombre de Empresa')
    rut = models.CharField(max_length=20, blank=True, null=True, verbose_name='RUT')
    contacto_nombre = models.CharField(max_length=100, blank=True, null=True, verbose_name='Nombre de Contacto')
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    email = models.CharField(max_length=100, blank=True, null=True, verbose_name='Email')
    dias_entrega = models.CharField(max_length=80, blank=True, null=True, verbose_name='Días de Entrega')
    direccion = models.CharField(max_length=150, blank=True, null=True, verbose_name='Dirección')
    activo = models.BooleanField(default=True, verbose_name='Activo')

    objects = models.Manager()

    class Meta:
        db_table = 'proveedores'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre_empresa']

    def __str__(self):
        return self.nombre_empresa


class Producto(models.Model):
    class UnidadMedida(models.TextChoices):
        UNIDAD = 'Unidad', 'Unidad'
        GRAMOS = 'Gramos', 'Gramos'
        KILOS = 'Kilos', 'Kilos'

    id_producto = models.AutoField(primary_key=True)
    codigo_barras = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='Código de Barras')
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.RESTRICT,
        db_column='id_categoria',
        related_name='productos',
        verbose_name='Categoría',
    )
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_proveedor',
        related_name='productos',
        verbose_name='Proveedor Principal',
    )
    proveedores = models.ManyToManyField(
        Proveedor,
        blank=True,
        related_name='productos_surtidos',
        verbose_name='Proveedores',
        db_table='productos_proveedores',
    )
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio de Compra')
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio de Venta')
    stock_actual = models.IntegerField(default=0, verbose_name='Stock Actual')
    stock_minimo = models.IntegerField(default=5, verbose_name='Stock Mínimo')
    stock_objetivo = models.IntegerField(default=20, verbose_name='Stock Objetivo')
    unidad_medida = models.CharField(
        max_length=10,
        choices=UnidadMedida.choices,
        default=UnidadMedida.UNIDAD,
        verbose_name='Unidad de Medida',
    )
    fecha_vencimiento = models.DateField(blank=True, null=True, verbose_name='Fecha de Vencimiento')
    perecible = models.BooleanField(default=True, verbose_name='Perecible')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True, verbose_name='Imagen')

    objects = models.Manager()

    class Meta:
        db_table = 'productos'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.codigo_barras or 'Sin código'})"


class HistorialPrecio(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='historial_precios')
    fecha = models.DateField(default=timezone.localdate)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.CharField(max_length=150, default='Actualización manual')

    objects = models.Manager()

    class Meta:
        db_table = 'historial_precios'
        ordering = ['-fecha', '-id']


class Lote(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='lotes')
    codigo_lote = models.CharField(max_length=50)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actual = models.IntegerField(default=0)
    precio_oferta = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    objects = models.Manager()

    class Meta:
        db_table = 'lotes'
        ordering = ['fecha_vencimiento', 'id']

    def __str__(self):
        return f'{self.producto.nombre} [{self.codigo_lote}]'


class Combo(models.Model):
    nombre = models.CharField(max_length=100)
    precio_especial = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'combos'
        ordering = ['nombre']

    objects = models.Manager()

    def __str__(self):
        return self.nombre


class ComboItem(models.Model):
    combo = models.ForeignKey(Combo, on_delete=models.CASCADE, related_name='componentes')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    objects = models.Manager()

    class Meta:
        db_table = 'combo_items'


class MovimientoInventario(models.Model):
    class Tipo(models.TextChoices):
        INGRESO = 'Ingreso', 'Ingreso'
        VENTA = 'Venta', 'Venta'
        MERMA = 'Merma', 'Merma'
        RESERVA = 'Reserva Encargo', 'Reserva Encargo'
        DEV_CLIENTE = 'Devolución Cliente', 'Devolución Cliente'
        DEV_PROVEEDOR = 'Devolución Proveedor', 'Devolución Proveedor'

    fecha_hora = models.DateTimeField(default=timezone.now)
    tipo = models.CharField(max_length=30, choices=Tipo.choices)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='movimientos')
    lote = models.ForeignKey(Lote, on_delete=models.SET_NULL, null=True, blank=True)
    codigo_lote = models.CharField(max_length=50, default='-')
    cantidad = models.IntegerField()
    stock_resultante = models.IntegerField()
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    motivo = models.CharField(max_length=255)

    objects = models.Manager()

    class Meta:
        db_table = 'movimientos_inventario'
        ordering = ['-fecha_hora', '-id']
