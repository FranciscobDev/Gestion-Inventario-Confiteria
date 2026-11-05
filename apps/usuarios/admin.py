from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# Hola si
admin.site.register(User, UserAdmin)

admin.site.site_header = "Panel de Administración"
admin.site.site_title = "Admin"
admin.site.index_title = "Gestión de Inventario"
