from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Rider
from .serializers import *

class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        identifier = request.data.get('identifier')
        password = request.data.get('password')
        
        # Authentification par téléphone ou email
        user = User.objects.filter(phone=identifier).first() or \
               User.objects.filter(email=identifier).first() or \
               authenticate(username=identifier, password=password)
        
        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            return Response({
                'token': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'message': 'Identifiants invalides'}, status=401)

class RiderViewSet(viewsets.ModelViewSet):
    queryset = Rider.objects.all()
    serializer_class = RiderSerializer

    def get_permissions(self):
        if self.action in ['list_public', 'register']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='public')
    def list_public(self, request):
        riders = Rider.objects.filter(status='active')
        serializer = RiderPublicSerializer(riders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Créer l'utilisateur (emailVerified est true par défaut dans notre logique)
            user = User.objects.create_user(
                username=serializer.validated_data['phone'],
                phone=serializer.validated_data['phone'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                role='rider'
            )
            # Créer le profil livreur
            Rider.objects.create(
                user=user,
                first_name=serializer.validated_data['firstName'],
                last_name=serializer.validated_data['lastName'],
                address=serializer.validated_data['address'],
                rider_function=serializer.validated_data['riderFunction'],
                profile_photo=serializer.validated_data['profilePhoto'],
                id_card=serializer.validated_data['idCard'],
                license=serializer.validated_data['license']
            )
            return Response({'message': 'Compte créé avec succès'}, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        if hasattr(request.user, 'rider_profile'):
            serializer = RiderSerializer(request.user.rider_profile)
            return Response(serializer.data)
        return Response({'message': 'Profil non trouvé'}, status=404)

    @action(detail=False, methods=['put'], url_path='availability')
    def update_availability(self, request):
        rider = request.user.rider_profile
        rider.availability = request.data.get('status')
        rider.save()
        return Response({'status': 'Statut mis à jour'})

    @action(detail=True, methods=['put'], url_path='status')
    def update_status(self, request, pk=None):
        if request.user.role != 'admin':
            return Response(status=403)
        rider = self.get_object()
        rider.status = request.data.get('status')
        rider.save()
        return Response({'status': 'Statut validé par admin'})