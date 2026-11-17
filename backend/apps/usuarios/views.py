from datetime import timedelta
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ConfiguracionNegocio
from .permissions import IsOwnerOrAdmin
from .serializers import ConfiguracionNegocioSerializer

User = get_user_model()


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        cfg = ConfiguracionNegocio.get_solo()

        if cfg.locked_until and timezone.now() < cfg.locked_until:
            return Response(
                {'detail': 'Cuenta bloqueada temporalmente (5 min) tras 5 intentos fallidos.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = authenticate(request, username=username, password=password)
        if not user or not (user.is_staff or user.is_superuser):
            cfg.failed_attempts += 1
            if cfg.failed_attempts >= 5:
                cfg.locked_until = timezone.now() + timedelta(minutes=5)
                cfg.save()
                return Response(
                    {'detail': 'Demasiados intentos fallidos. Bloqueo activo por 5 minutos.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            cfg.save()
            return Response(
                {'detail': 'Usuario o contraseña incorrectos.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        cfg.failed_attempts = 0
        cfg.locked_until = None
        cfg.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': 'Dueño' if user.is_superuser else 'Admin',
            },
            'config': ConfiguracionNegocioSerializer(cfg).data,
        })


class LogoutAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({'detail': 'Sesión cerrada correctamente.'})


class AuthStatusAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        cfg = ConfiguracionNegocio.get_solo()
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'role': 'Dueño' if request.user.is_superuser else 'Admin',
            },
            'config': ConfiguracionNegocioSerializer(cfg).data,
        })


class VerifyPasswordAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def post(self, request):
        password = request.data.get('password') or ''
        if request.user.check_password(password):
            return Response({'valid': True})
        return Response({'valid': False, 'detail': 'Contraseña incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def post(self, request):
        current_password = request.data.get('current_password') or ''
        new_password = request.data.get('new_password') or ''
        if not request.user.check_password(current_password):
            return Response({'detail': 'La contraseña actual no coincide.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'detail': 'La nueva contraseña debe tener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'})


class RecoverAccessAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = (request.data.get('code') or '').strip()
        new_password = request.data.get('new_password') or ''
        cfg = ConfiguracionNegocio.get_solo()
        if code != cfg.codigo_recuperacion:
            return Response({'detail': 'El código de recuperación no es válido.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'detail': 'La nueva contraseña debe tener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
        owner = User.objects.filter(is_superuser=True).first() or User.objects.filter(is_staff=True).first()
        if not owner:
            return Response({'detail': 'No existe cuenta de dueño configurada.'}, status=status.HTTP_404_NOT_FOUND)
        owner.set_password(new_password)
        owner.save()
        cfg.failed_attempts = 0
        cfg.locked_until = None
        cfg.save()
        return Response({'detail': 'Acceso recuperado. Ya puedes iniciar sesión.'})


class ConfiguracionAPIView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        cfg = ConfiguracionNegocio.get_solo()
        return Response(ConfiguracionNegocioSerializer(cfg).data)

    def patch(self, request):
        cfg = ConfiguracionNegocio.get_solo()
        serializer = ConfiguracionNegocioSerializer(cfg, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
