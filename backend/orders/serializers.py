from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from core.serializers import ProductListSerializer, ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    variant_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    variant = ProductVariantSerializer(read_only=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'variant', 'variant_id',
                  'quantity', 'unit_price', 'subtotal']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count']


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'variant_name', 'quantity',
                  'unit_price', 'delivery_fee', 'subtotal', 'payment_type',
                  'upfront_amount', 'balance_on_delivery']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    county_name = serializers.CharField(source='county.name', read_only=True)
    pickup_station_name = serializers.CharField(source='pickup_station.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    delivery_type_display = serializers.CharField(source='get_delivery_type_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display',
            'delivery_type', 'delivery_type_display',
            'county', 'county_name', 'pickup_station', 'pickup_station_name',
            'delivery_address', 'delivery_city', 'delivery_phone', 'delivery_notes',
            'subtotal', 'delivery_fee', 'total_amount',
            'amount_paid', 'balance_due', 'balance_on_delivery', 'payment_mode',
            'customer_notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'status', 'amount_paid', 'balance_due']


class CreateOrderSerializer(serializers.Serializer):
    delivery_type = serializers.ChoiceField(choices=['home', 'pickup'])
    county_id = serializers.IntegerField(required=False, allow_null=True)
    pickup_station_id = serializers.IntegerField(required=False, allow_null=True)
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    delivery_city = serializers.CharField(required=False, allow_blank=True)
    delivery_phone = serializers.CharField(required=False, allow_blank=True)
    delivery_notes = serializers.CharField(required=False, allow_blank=True)
    payment_mode = serializers.ChoiceField(choices=['full', 'half'], default='full')
    customer_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['delivery_type'] == 'home' and not data.get('county_id'):
            raise serializers.ValidationError({'county_id': 'Required for home delivery'})
        if data['delivery_type'] == 'home' and not data.get('delivery_address'):
            raise serializers.ValidationError({'delivery_address': 'Required for home delivery'})
        if data['delivery_type'] == 'pickup' and not data.get('pickup_station_id'):
            raise serializers.ValidationError({'pickup_station_id': 'Required for pickup'})
        return data