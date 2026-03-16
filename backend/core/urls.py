from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, CountyViewSet, PickupStationViewSet,
    ProductViewSet, BannerViewSet, WishlistViewSet
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('counties', CountyViewSet, basename='county')
router.register('pickup-stations', PickupStationViewSet, basename='pickup-station')
router.register('products', ProductViewSet, basename='product')
router.register('banners', BannerViewSet, basename='banner')
router.register('wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('', include(router.urls)),
]