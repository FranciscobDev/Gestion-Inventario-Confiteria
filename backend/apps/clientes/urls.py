from django.urls import path

from . import views

app_name = 'clientes'

urlpatterns = [
    path('registro/', views.RegistroClienteView.as_view(), name='registro'),
    path('login/', views.LoginClienteView.as_view(), name='login'),
    path('logout/', views.LogoutClienteView.as_view(), name='logout'),
    path('me/', views.MeClienteView.as_view(), name='me'),
    path('catalogo/', views.CatalogoClienteView.as_view(), name='catalogo'),
    path('encargos/', views.MisEncargosView.as_view(), name='mis_encargos'),
    path('encargos/nuevo/', views.NuevoEncargoClienteView.as_view(), name='nuevo_encargo'),
    path('encargos/<int:pk>/cancelar/', views.CancelarEncargoView.as_view(), name='cancelar_encargo'),
]