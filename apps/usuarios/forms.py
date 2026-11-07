from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.core.exceptions import ValidationError

class AdminAuthenticationForm(AuthenticationForm):
    """
    Formulario de autenticación exclusivo para administradores.
    Rechaza el acceso a usuarios que no posean permisos de staff o superusuario.
    """
    username = forms.CharField(
        label="Usuario o Email",
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingresa tu usuario',
            'autofocus': True,
        })
    )
    password = forms.CharField(
        label="Contraseña",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingresa tu contraseña',
        })
    )

    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if not (user.is_staff or user.is_superuser):
            raise ValidationError(
                "Acceso denegado: Esta plataforma es exclusiva para administradores.",
                code="no_admin_access",
            )

