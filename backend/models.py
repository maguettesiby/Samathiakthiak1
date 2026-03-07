from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    role = models.CharField(max_length=10, choices=[('admin', 'Admin'), ('rider', 'Rider'), ('user', 'User')], default='user')
    phone = models.CharField(max_length=20, unique=True)
    
    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['username', 'email']

class Rider(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('active', 'Active'), ('rejected', 'Rejected')]
    FUNC_CHOICES = [
        ('Livreur moto', 'Moto'),
        ('Livreur auto', 'Auto'),
        ('Livreur Taxi Bagage', 'Taxi Bagage'),
        ('Livreur 3 roues', '3 Roues')
    ]
    AVAIL_CHOICES = [('online', 'Online'), ('offline', 'Offline'), ('busy', 'Busy')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='rider_profile')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    rider_function = models.CharField(max_length=50, choices=FUNC_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    availability = models.CharField(max_length=10, choices=AVAIL_CHOICES, default='offline')
    
    profile_photo = models.ImageField(upload_to='profiles/')
    id_card = models.ImageField(upload_to='documents/id/')
    license = models.ImageField(upload_to='documents/license/')
    
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"