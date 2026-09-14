from adrf.routers import DefaultRouter

from django.urls import path

from .views import AddressViewSet, MeView

router = DefaultRouter()
router.register('addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
] + router.urls