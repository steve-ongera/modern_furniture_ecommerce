from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
import django_filters

from .models import (
    Category, County, PickupStation, Product, ProductVariant,
    Banner, Review, Wishlist
)
from .serializers import (
    CategorySerializer, CountySerializer, PickupStationSerializer,
    ProductListSerializer, ProductDetailSerializer, BannerSerializer,
    ReviewSerializer, WishlistSerializer, DeliveryFeeSerializer
)


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    category = django_filters.CharFilter(field_name='category__slug')
    in_stock = django_filters.BooleanFilter(field_name='is_in_stock')
    is_new_arrival = django_filters.BooleanFilter(field_name='is_new_arrival')
    is_best_seller = django_filters.BooleanFilter(field_name='is_best_seller')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    payment_type = django_filters.CharFilter(field_name='payment_type')

    class Meta:
        model = Product
        fields = ['min_price', 'max_price', 'category', 'in_stock',
                  'is_new_arrival', 'is_best_seller', 'is_featured', 'payment_type']


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        category = self.get_object()
        # Include subcategory products
        cat_ids = [category.id] + list(category.subcategories.values_list('id', flat=True))
        products = Product.objects.filter(
            category__in=cat_ids, is_active=True
        )
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


class CountyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = County.objects.filter(is_active=True).order_by('name')
    serializer_class = CountySerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


class PickupStationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PickupStation.objects.filter(is_active=True)
    serializer_class = PickupStationSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).prefetch_related('images', 'variants', 'category')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'category__name', 'short_description']
    ordering_fields = ['price', 'created_at', 'average_rating', 'views_count', 'name']
    ordering = ['-created_at']
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Track views
        Product.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        products = self.get_queryset().filter(is_featured=True)[:8]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def new_arrivals(self, request):
        products = self.get_queryset().filter(is_new_arrival=True)[:8]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def best_sellers(self, request):
        products = self.get_queryset().filter(is_best_seller=True)[:8]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, slug=None):
        product = self.get_object()
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def delivery_fee(self, request, slug=None):
        """Calculate delivery fee for this product"""
        product = self.get_object()
        delivery_type = request.query_params.get('delivery_type', 'home')
        county_slug = request.query_params.get('county_slug', '')
        pickup_station_slug = request.query_params.get('pickup_station_slug', '')

        if delivery_type == 'pickup' and pickup_station_slug:
            try:
                station = PickupStation.objects.get(slug=pickup_station_slug)
                fee = product.base_delivery_fee + station.pickup_fee
                return Response({
                    'delivery_type': 'pickup',
                    'station': station.name,
                    'fee': fee,
                    'note': 'Pickup usually ready within 24 hours'
                })
            except PickupStation.DoesNotExist:
                return Response({'error': 'Pickup station not found'}, status=400)

        elif delivery_type == 'home' and county_slug:
            try:
                county = County.objects.get(slug=county_slug)
                fee = product.base_delivery_fee + county.base_delivery_fee
                return Response({
                    'delivery_type': 'home',
                    'county': county.name,
                    'fee': fee,
                    'note': f'Estimated delivery fee for {county.name}. Final fee confirmed on contact.'
                })
            except County.DoesNotExist:
                return Response({'error': 'County not found'}, status=400)

        return Response({'error': 'Invalid delivery parameters'}, status=400)

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'results': [], 'count': 0})
        products = self.get_queryset().filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query)
        )
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response({'results': serializer.data, 'count': products.count()})


class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def hero(self, request):
        banners = self.get_queryset().filter(position='hero')
        serializer = self.get_serializer(banners, many=True)
        return Response(serializer.data)


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        serializer = WishlistSerializer(wishlist, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(id=product_id, is_active=True)
            wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
            wishlist.products.add(product)
            return Response({'status': 'added', 'message': f'{product.name} added to wishlist'})
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=400)

    @action(detail=False, methods=['post'])
    def remove(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(id=product_id)
            wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
            wishlist.products.remove(product)
            return Response({'status': 'removed'})
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=400)