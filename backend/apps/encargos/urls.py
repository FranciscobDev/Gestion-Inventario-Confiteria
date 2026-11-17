from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'encargos'

router = DefaultRouter()
router.register('', views.EncargoViewSet, basename='encargo')

urlpatterns = [
    path('', include(router.urls)),
]
