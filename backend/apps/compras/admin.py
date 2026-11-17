from django.contrib import admin
from .models import DetalleOrdenCompra, DevolucionProveedor, OrdenCompra

admin.site.register(OrdenCompra)
admin.site.register(DetalleOrdenCompra)
admin.site.register(DevolucionProveedor)
