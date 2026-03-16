from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from decimal import Decimal

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartSerializer, CartItemSerializer, OrderSerializer, CreateOrderSerializer
)
from core.models import Product, ProductVariant, County, PickupStation


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_or_create_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def list(self, request):
        cart = self.get_or_create_cart(request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        cart = self.get_or_create_cart(request.user)
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        variant = None
        if variant_id:
            try:
                variant = ProductVariant.objects.get(id=variant_id, product=product)
            except ProductVariant.DoesNotExist:
                return Response({'error': 'Variant not found'}, status=404)

        item, created = CartItem.objects.get_or_create(
            cart=cart, product=product, variant=variant,
            defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data)

    @action(detail=False, methods=['post'])
    def update_item(self, request):
        cart = self.get_or_create_cart(request.user)
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
            if quantity <= 0:
                item.delete()
            else:
                item.quantity = quantity
                item.save()
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=404)

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        cart = self.get_or_create_cart(request.user)
        item_id = request.data.get('item_id')
        try:
            CartItem.objects.filter(id=item_id, cart=cart).delete()
        except CartItem.DoesNotExist:
            pass
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart = self.get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared'})


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')

    @transaction.atomic
    def create(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        # Get cart
        try:
            cart = Cart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response({'error': 'Cart is empty'}, status=400)
        except Cart.DoesNotExist:
            return Response({'error': 'No cart found'}, status=400)

        # Determine delivery fee
        delivery_fee = Decimal('0')
        county = None
        pickup_station = None

        if data['delivery_type'] == 'home':
            try:
                county = County.objects.get(id=data['county_id'])
                # Sum delivery fees for all items
                for item in cart.items.all():
                    delivery_fee += item.product.base_delivery_fee + county.base_delivery_fee
            except County.DoesNotExist:
                return Response({'error': 'County not found'}, status=400)
        else:
            try:
                pickup_station = PickupStation.objects.get(id=data['pickup_station_id'])
                for item in cart.items.all():
                    delivery_fee += pickup_station.pickup_fee
            except PickupStation.DoesNotExist:
                return Response({'error': 'Pickup station not found'}, status=400)

        subtotal = cart.total
        total = subtotal + delivery_fee

        # Determine payment amounts based on payment_mode and product payment_type
        payment_mode = data.get('payment_mode', 'full')
        amount_required = total
        balance_on_delivery = Decimal('0')

        if payment_mode == 'half':
            # Check all products support half payment
            for item in cart.items.all():
                if item.product.payment_type == 'full':
                    return Response({
                        'error': f'"{item.product.name}" requires full payment only.'
                    }, status=400)
            amount_required = total * Decimal('0.5')
            balance_on_delivery = total - amount_required

        # Create order
        order = Order.objects.create(
            user=request.user,
            delivery_type=data['delivery_type'],
            county=county,
            pickup_station=pickup_station,
            delivery_address=data.get('delivery_address', ''),
            delivery_city=data.get('delivery_city', ''),
            delivery_phone=data.get('delivery_phone', ''),
            delivery_notes=data.get('delivery_notes', ''),
            payment_mode=payment_mode,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total_amount=total,
            balance_on_delivery=balance_on_delivery,
            customer_notes=data.get('customer_notes', ''),
        )

        # Create order items
        for cart_item in cart.items.all():
            product = cart_item.product
            item_upfront = cart_item.subtotal
            item_balance = Decimal('0')

            if payment_mode == 'half' and product.payment_type in ('half', 'installment'):
                item_upfront = cart_item.subtotal * Decimal('0.5')
                item_balance = cart_item.subtotal - item_upfront

            OrderItem.objects.create(
                order=order,
                product=product,
                variant=cart_item.variant,
                product_name=product.name,
                variant_name=cart_item.variant.name if cart_item.variant else '',
                quantity=cart_item.quantity,
                unit_price=cart_item.unit_price,
                delivery_fee=product.base_delivery_fee,
                payment_type=product.payment_type,
                upfront_amount=item_upfront,
                balance_on_delivery=item_balance,
            )

        # Clear cart
        cart.items.all().delete()

        order_serializer = OrderSerializer(order)
        return Response(order_serializer.data, status=201)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status not in ('pending', 'half_paid'):
            return Response({'error': 'Order cannot be cancelled at this stage'}, status=400)
        order.status = 'cancelled'
        order.save()
        return Response({'message': 'Order cancelled'})