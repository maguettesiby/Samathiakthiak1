from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, RiderViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'riders', RiderViewSet, basename='riders')
router.register(r'payments', PaymentViewSet, basename='payments')

urlpatterns = [
    path('api/', include(router.urls)),
]
