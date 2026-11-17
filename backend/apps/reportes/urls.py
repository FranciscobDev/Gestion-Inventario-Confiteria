from django.urls import path
from . import views

app_name = 'reportes'

urlpatterns = [
    path('bootstrap/', views.BootstrapDataAPIView.as_view(), name='bootstrap'),
    path('revisar-dia/', views.DiaRevisadoAPIView.as_view(), name='revisar_dia'),
    path('respaldos/', views.RespaldoAPIView.as_view(), name='respaldos'),
]
