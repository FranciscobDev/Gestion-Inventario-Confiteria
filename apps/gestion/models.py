from django.db import models


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=50, unique=True, verbose_name="Nombre de Categoría")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")

    class Meta:
        db_table = 'categorias'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre_categoria']

    def __str__(self):
        return self.nombre_categoria


class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    nombre_empresa = models.CharField(max_length=100, verbose_name="Nombre de Empresa")
    contacto_nombre = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nombre de Contacto")
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name="Teléfono")
    email = models.CharField(max_length=100, blank=True, null=True, verbose_name="Email")
    direccion = models.CharField(max_length=150, blank=True, null=True, verbose_name="Dirección")

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
    codigo_barras = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="Código de Barras")
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.RESTRICT,
        db_column='id_categoria',
        related_name='productos',
        verbose_name="Categoría"
    )
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_proveedor',
        related_name='productos',
        verbose_name="Proveedor"
    )
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio de Compra")
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio de Venta")
    stock_actual = models.IntegerField(default=0, verbose_name="Stock Actual")
    stock_minimo = models.IntegerField(default=5, verbose_name="Stock Mínimo")
    unidad_medida = models.CharField(
        max_length=10,
        choices=UnidadMedida.choices,
        default=UnidadMedida.UNIDAD,
        verbose_name="Unidad de Medida"
    )
    fecha_vencimiento = models.DateField(blank=True, null=True, verbose_name="Fecha de Vencimiento")
    imagen = models.ImageField(
        upload_to='productos/', 
        blank=True, 
        null=True, 
        verbose_name="Imagen"
    )

    

    class Meta:
        db_table = 'productos'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.codigo_barras or 'Sin código'})"
