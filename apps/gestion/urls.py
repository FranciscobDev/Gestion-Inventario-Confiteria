from django.urls import path
from . import views
app_name = 'gestion'
urlpatterns = [path('gestion/', views.home, name='inicio')]