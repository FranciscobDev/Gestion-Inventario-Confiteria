from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    path('login/', views.LoginAPIView.as_view(), name='login'),
    path('login-unificado/', views.LoginUnificadoAPIView.as_view(), name='login_unificado'),
    path('logout/', views.LogoutAPIView.as_view(), name='logout'),
    path('status/', views.AuthStatusAPIView.as_view(), name='status'),
    path('verificar-password/', views.VerifyPasswordAPIView.as_view(), name='verify_password'),
    path('cambiar-password/', views.ChangePasswordAPIView.as_view(), name='change_password'),
    path('recuperar-acceso/', views.RecoverAccessAPIView.as_view(), name='recover_access'),
    path('configuracion/', views.ConfiguracionAPIView.as_view(), name='configuracion'),
]
