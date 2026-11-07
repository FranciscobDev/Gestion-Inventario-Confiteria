from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

#gola si

class User(AbstractUser):
    email = models.EmailField(unique=True)
