from adrf.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
 
from django.urls import include, path
 
from .views import AddressViewSet, MeView, RegisterView

 
router = DefaultRouter()
router.register('addresses', AddressViewSet, basename='address')
 
urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
 
    path('accounts/me/', MeView.as_view(), name='me'),
    path('accounts/', include(router.urls)),
]