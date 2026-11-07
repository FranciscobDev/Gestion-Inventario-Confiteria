from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

admin.site.register(User, UserAdmin)

admin.site.site_header = "Panel de Administración - Confitería"
admin.site.site_title = "Admin Confitería"
admin.site.index_title = "Gestión de Inventario"
