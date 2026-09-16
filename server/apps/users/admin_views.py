from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.common.permissions import IsSuperUser
from .serializers import UserListSerializer, UserRoleSerializer

User = get_user_model()


class UserListView(generics.ListAPIView):
    """List all users."""

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserListSerializer
    permission_classes = [IsSuperUser]


class UserDetailView(generics.RetrieveAPIView):
    """Retrieve a single user."""

    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [IsSuperUser]


class UserRoleUpdateView(APIView):
    """Promote or demote a user's staff status."""

    permission_classes = [IsSuperUser]

    @extend_schema(request=UserRoleSerializer, responses=UserListSerializer)
    def patch(self, request, pk):
        user = generics.get_object_or_404(User, pk=pk)

        if user == request.user:
            return Response(
                {"error": "You cannot change your own role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.is_staff = serializer.validated_data["is_staff"]
        user.save(update_fields=["is_staff"])

        return Response(UserListSerializer(user).data)
