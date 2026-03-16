from django.urls import path
from .views import initiate_payment, mpesa_callback, check_payment_status

urlpatterns = [
    path('initiate/', initiate_payment, name='initiate-payment'),
    path('mpesa/callback/', mpesa_callback, name='mpesa-callback'),
    path('status/<uuid:payment_id>/', check_payment_status, name='payment-status'),
]