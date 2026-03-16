from django.db import models
import uuid


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('mpesa', 'M-Pesa'),
        ('cash', 'Cash on Delivery'),
        ('bank', 'Bank Transfer'),
    ]
    PAYMENT_PURPOSE_CHOICES = [
        ('full', 'Full Payment'),
        ('deposit', 'Deposit (50%)'),
        ('balance', 'Balance Payment'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)

    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='mpesa')
    purpose = models.CharField(max_length=20, choices=PAYMENT_PURPOSE_CHOICES, default='full')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    phone_number = models.CharField(max_length=20, blank=True)

    # M-Pesa specific
    mpesa_checkout_request_id = models.CharField(max_length=100, blank=True)
    mpesa_merchant_request_id = models.CharField(max_length=100, blank=True)
    mpesa_transaction_id = models.CharField(max_length=100, blank=True)
    mpesa_receipt_number = models.CharField(max_length=100, blank=True)
    mpesa_result_code = models.IntegerField(null=True, blank=True)
    mpesa_result_desc = models.CharField(max_length=500, blank=True)
    mpesa_raw_response = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.id} - {self.order.order_number} - {self.status}"