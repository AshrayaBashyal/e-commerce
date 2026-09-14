from adrf import generics as agenerics
from adrf import viewsets as aviewsets
from rest_framework import generics, permissions

from .models import Address
from .serializers import AddressSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class MeView(agenerics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    async def aget_object(self):
        # request.user already resolved during authentication so no extra DB call to make async 
        return self.request.user


class AddressViewSet(aviewsets.ModelViewSet):
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    async def perform_acreate(self, serializer):
        await serializer.asave(user=self.request.user)