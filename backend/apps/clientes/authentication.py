from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import TokenCliente


class ClienteTokenAuthentication(BaseAuthentication):
    """Autentica solo tokens de clientes. Los tokens del dueño no sirven aquí."""

    def authenticate(self, request):
        parts = request.headers.get('Authorization', '').split()
        if len(parts) != 2 or parts[0] != 'Token':
            return None
        try:
            token = TokenCliente.objects.select_related('cliente').get(key=parts[1])
        except TokenCliente.DoesNotExist:
            raise AuthenticationFailed('Sesión de cliente inválida.')
        if not token.cliente.activo:
            raise AuthenticationFailed('Cuenta desactivada.')
        return (token.cliente, token)