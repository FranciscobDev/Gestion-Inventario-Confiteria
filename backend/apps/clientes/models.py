import secrets

from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


class Cliente(models.Model):
    telefono = models.CharField(max_length=9, unique=True)
    nombre = models.CharField(max_length=120)
    password = models.CharField(max_length=128)
    activo = models.BooleanField(default=True)
    failed_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    creado_en = models.DateTimeField(default=timezone.now)

    # DRF revisa estas propiedades para saber si el request está autenticado
    is_authenticated = True
    is_anonymous = False

    objects = models.Manager()

    class Meta:
        db_table = 'clientes'

    def set_password(self, raw):
        self.password = make_password(raw)

    def check_password(self, raw):
        return check_password(raw, self.password)

    def __str__(self):
        return f'{self.nombre} ({self.telefono})'


class TokenCliente(models.Model):
    key = models.CharField(max_length=40, primary_key=True)
    cliente = models.OneToOneField(Cliente, on_delete=models.CASCADE, related_name='token')
    created = models.DateTimeField(auto_now_add=True)

    objects = models.Manager()

    class Meta:
        db_table = 'tokens_cliente'

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = secrets.token_hex(20)
        return super().save(*args, **kwargs)