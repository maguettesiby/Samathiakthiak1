from rest_framework import serializers
from .models import User, Rider

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone', 'role')

class RiderSerializer(serializers.ModelSerializer):
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    class Meta:
        model = Rider
        fields = '__all__'

class RiderPublicSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='user.phone', read_only=True)
    class Meta:
        model = Rider
        fields = ('id', 'first_name', 'last_name', 'address', 'rider_function', 'availability', 'profile_photo', 'phone')

class RegistrationSerializer(serializers.Serializer):
    firstName = serializers.CharField()
    lastName = serializers.CharField()
    phone = serializers.CharField()
    email = serializers.EmailField()
    address = serializers.CharField()
    password = serializers.CharField(write_only=True)
    riderFunction = serializers.CharField()
    profilePhoto = serializers.ImageField()
    idCard = serializers.ImageField()
    license = serializers.ImageField()