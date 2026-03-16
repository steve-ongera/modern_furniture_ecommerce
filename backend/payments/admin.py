from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'method', 'purpose', 'status', 'amount', 'mpesa_receipt_number', 'created_at']
    list_filter = ['status', 'method', 'purpose']
    search_fields = ['order__order_number', 'mpesa_receipt_number', 'phone_number']
    readonly_fields = ['id', 'created_at', 'updated_at', 'mpesa_raw_response']