from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'variant_name', 'unit_price', 'subtotal', 'upfront_amount', 'balance_on_delivery']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'delivery_type', 'total_amount', 'amount_paid', 'balance_due', 'created_at']
    list_filter = ['status', 'delivery_type', 'payment_mode']
    search_fields = ['order_number', 'user__email', 'user__first_name']
    readonly_fields = ['order_number', 'balance_due', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    list_editable = ['status']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'item_count', 'total', 'created_at']