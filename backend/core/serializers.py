from rest_framework import serializers
from .models import (
    Category, County, PickupStation, Material, Color,
    Product, ProductVariant, ProductImage, Review, Banner, Wishlist
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'icon',
                  'parent', 'product_count', 'subcategories', 'sort_order']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_subcategories(self, obj):
        subs = obj.subcategories.filter(is_active=True)
        return CategorySerializer(subs, many=True).data


class CountySerializer(serializers.ModelSerializer):
    class Meta:
        model = County
        fields = ['id', 'name', 'slug', 'base_delivery_fee', 'region']


class PickupStationSerializer(serializers.ModelSerializer):
    county_name = serializers.CharField(source='county.name', read_only=True)

    class Meta:
        model = PickupStation
        fields = ['id', 'name', 'slug', 'address', 'county', 'county_name',
                  'phone', 'whatsapp', 'email', 'pickup_fee', 'opening_hours']


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name']


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name', 'hex_code']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'sort_order']


class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'price_adjustment', 'final_price',
                  'stock_quantity', 'is_available', 'sku']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_location = serializers.CharField(source='user.city', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'user_location', 'rating', 'title',
                  'body', 'is_verified_purchase', 'created_at']
        read_only_fields = ['is_verified_purchase', 'is_approved']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing products"""
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    effective_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category_name', 'category_slug',
            'price', 'sale_price', 'effective_price', 'discount_percentage',
            'primary_image', 'is_in_stock', 'is_new_arrival', 'is_best_seller',
            'is_featured', 'payment_type', 'average_rating', 'review_count',
            'base_delivery_fee', 'short_description'
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for product detail page"""
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    materials = MaterialSerializer(many=True, read_only=True)
    colors = ColorSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    effective_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    upfront_payment_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'description', 'short_description',
            'price', 'sale_price', 'effective_price', 'discount_percentage',
            'upfront_payment_amount', 'payment_type', 'refund_percentage_on_default',
            'base_delivery_fee', 'materials', 'colors', 'weight_kg', 'dimensions',
            'stock_quantity', 'is_in_stock', 'sku',
            'is_featured', 'is_new_arrival', 'is_best_seller',
            'images', 'variants', 'reviews',
            'average_rating', 'review_count', 'views_count',
            'meta_title', 'meta_description', 'meta_keywords',
            'created_at',
        ]

    def get_reviews(self, obj):
        approved = obj.reviews.filter(is_approved=True)[:10]
        return ReviewSerializer(approved, many=True).data


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'subtitle', 'image', 'link_url', 'position']


class DeliveryFeeSerializer(serializers.Serializer):
    """Calculate delivery fee for a product and county/station"""
    product_id = serializers.UUIDField()
    county_slug = serializers.CharField(required=False, allow_blank=True)
    pickup_station_slug = serializers.CharField(required=False, allow_blank=True)
    delivery_type = serializers.ChoiceField(choices=['home', 'pickup'])

    def validate(self, data):
        if data['delivery_type'] == 'home' and not data.get('county_slug'):
            raise serializers.ValidationError("county_slug required for home delivery")
        if data['delivery_type'] == 'pickup' and not data.get('pickup_station_slug'):
            raise serializers.ValidationError("pickup_station_slug required for pickup")
        return data


class WishlistSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'products']