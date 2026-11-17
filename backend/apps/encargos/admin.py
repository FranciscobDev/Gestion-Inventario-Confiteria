from django.contrib import admin
from .models import DetalleEncargo, Encargo, HistorialEncargo

admin.site.register(Encargo)
admin.site.register(DetalleEncargo)
admin.site.register(HistorialEncargo)
