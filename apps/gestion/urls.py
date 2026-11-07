from django.urls import path
from . import views

app_name = 'gestion'

urlpatterns = [
    path('', views.home, name='inicio'),
]
