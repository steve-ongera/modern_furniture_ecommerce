from django.db import models
import uuid


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField('users.User', null=True, blank=True,
                                 on_delete=models.CASCADE, related_name='cart')
    session_key = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart {self.id}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    variant = models.ForeignKey('core.ProductVariant', null=True, blank=True,
                                 on_delete=models.SET_NULL)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product', 'variant')

    @property
    def unit_price(self):
        if self.variant:
            return self.variant.final_price
        return self.product.effective_price

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('half_paid', 'Half Payment Received'),
        ('paid', 'Fully Paid'),
        ('processing', 'Processing'),
        ('ready', 'Ready for Delivery/Pickup'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('defaulted', 'Payment Defaulted'),  # Customer didn't pay balance
    ]

    DELIVERY_TYPE_CHOICES = [
        ('home', 'Home Delivery'),
        ('pickup', 'In-Store Pickup'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='orders')

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Delivery
    delivery_type = models.CharField(max_length=10, choices=DELIVERY_TYPE_CHOICES)
    county = models.ForeignKey('core.County', null=True, blank=True, on_delete=models.SET_NULL)
    pickup_station = models.ForeignKey('core.PickupStation', null=True, blank=True,
                                        on_delete=models.SET_NULL)

    # Address (for home delivery)
    delivery_address = models.TextField(blank=True)
    delivery_city = models.CharField(max_length=100, blank=True)
    delivery_phone = models.CharField(max_length=20, blank=True)
    delivery_notes = models.TextField(blank=True)

    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Payment tracking
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # For half-payment: what must be paid on delivery
    balance_on_delivery = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Payment type for order
    payment_mode = models.CharField(
        max_length=20,
        choices=[('full', 'Full Payment'), ('half', 'Half Payment')],
        default='full'
    )

    # Notes
    admin_notes = models.TextField(blank=True)
    customer_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            import random
            import string
            self.order_number = 'MMF' + ''.join(random.choices(string.digits, k=8))
        self.total_amount = self.subtotal + self.delivery_fee
        self.balance_due = self.total_amount - self.amount_paid
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_number}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    variant = models.ForeignKey('core.ProductVariant', null=True, blank=True,
                                 on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=300)  # Snapshot
    variant_name = models.CharField(max_length=200, blank=True)  # Snapshot
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Payment type for this item
    payment_type = models.CharField(max_length=20, default='full')
    upfront_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_on_delivery = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"