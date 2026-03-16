import base64
import json
import requests
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from decimal import Decimal

from .models import Payment
from orders.models import Order


def get_mpesa_access_token():
    """Get M-Pesa OAuth access token"""
    if settings.MPESA_DEBUG:
        url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    else:
        url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

    credentials = base64.b64encode(
        f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}".encode()
    ).decode()

    response = requests.get(
        url,
        headers={"Authorization": f"Basic {credentials}"},
        timeout=30
    )
    return response.json().get('access_token')


def stk_push(phone_number, amount, account_reference, transaction_desc):
    """Initiate M-Pesa STK Push"""
    access_token = get_mpesa_access_token()

    if settings.MPESA_DEBUG:
        url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    else:
        url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(
        f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
    ).decode()

    # Normalize phone number
    phone = phone_number.replace('+', '').replace(' ', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),  # M-Pesa requires integer
        "PartyA": phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": settings.MPESA_CALLBACK_URL,
        "AccountReference": account_reference[:12],  # Max 12 chars
        "TransactionDesc": transaction_desc[:13],  # Max 13 chars
    }

    response = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        timeout=30
    )
    return response.json()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    """Initiate M-Pesa STK Push for an order"""
    order_id = request.data.get('order_id')
    phone_number = request.data.get('phone_number')
    payment_purpose = request.data.get('payment_purpose', 'full')  # 'full' or 'deposit'

    if not order_id or not phone_number:
        return Response({'error': 'order_id and phone_number required'}, status=400)

    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    # Determine amount to charge
    if payment_purpose == 'deposit' and order.payment_mode == 'half':
        amount = order.total_amount * Decimal('0.5')
    elif payment_purpose == 'balance':
        amount = order.balance_due
    else:
        amount = order.total_amount

    # Create payment record
    payment = Payment.objects.create(
        order=order,
        user=request.user,
        method='mpesa',
        purpose=payment_purpose if payment_purpose in ('full', 'deposit', 'balance') else 'full',
        amount=amount,
        phone_number=phone_number,
        status='pending'
    )

    if settings.MPESA_DEBUG:
        # In debug/sandbox mode, simulate a successful payment
        payment.status = 'completed'
        payment.mpesa_transaction_id = f'DEBUG_{payment.id}'
        payment.mpesa_receipt_number = f'MMF{order.order_number}'
        payment.save()

        # Update order
        order.amount_paid += amount
        order.balance_due = order.total_amount - order.amount_paid
        if order.payment_mode == 'half' and payment_purpose == 'deposit':
            order.status = 'half_paid'
        else:
            order.status = 'paid'
        order.save()

        return Response({
            'success': True,
            'debug_mode': True,
            'message': 'DEBUG MODE: Payment simulated successfully',
            'payment_id': str(payment.id),
            'amount': str(amount),
            'receipt': payment.mpesa_receipt_number,
            'order_status': order.status,
        })

    # Production: Initiate real STK Push
    try:
        result = stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=order.order_number,
            transaction_desc=f"Morara Furniture {order.order_number}"
        )

        if result.get('ResponseCode') == '0':
            payment.mpesa_checkout_request_id = result.get('CheckoutRequestID', '')
            payment.mpesa_merchant_request_id = result.get('MerchantRequestID', '')
            payment.status = 'processing'
            payment.mpesa_raw_response = result
            payment.save()

            return Response({
                'success': True,
                'message': 'STK Push sent. Check your phone and enter M-Pesa PIN.',
                'checkout_request_id': payment.mpesa_checkout_request_id,
                'payment_id': str(payment.id),
            })
        else:
            payment.status = 'failed'
            payment.mpesa_result_desc = result.get('errorMessage', 'Unknown error')
            payment.save()
            return Response({'error': result.get('errorMessage', 'Payment initiation failed')}, status=400)

    except Exception as e:
        payment.status = 'failed'
        payment.save()
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])  # M-Pesa callback doesn't have auth
def mpesa_callback(request):
    """Handle M-Pesa payment callback"""
    data = request.data

    body = data.get('Body', {})
    stk_callback = body.get('stkCallback', {})
    result_code = stk_callback.get('ResultCode')
    result_desc = stk_callback.get('ResultDesc', '')
    checkout_request_id = stk_callback.get('CheckoutRequestID', '')

    try:
        payment = Payment.objects.get(mpesa_checkout_request_id=checkout_request_id)
    except Payment.DoesNotExist:
        return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

    payment.mpesa_result_code = result_code
    payment.mpesa_result_desc = result_desc
    payment.mpesa_raw_response = data

    if result_code == 0:
        # Success
        callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
        for item in callback_metadata:
            if item.get('Name') == 'MpesaReceiptNumber':
                payment.mpesa_receipt_number = item.get('Value', '')
            elif item.get('Name') == 'TransactionDate':
                payment.mpesa_transaction_id = str(item.get('Value', ''))

        payment.status = 'completed'
        payment.save()

        # Update order
        order = payment.order
        order.amount_paid += payment.amount
        order.balance_due = order.total_amount - order.amount_paid

        if order.payment_mode == 'half' and payment.purpose == 'deposit':
            order.status = 'half_paid'
        elif order.balance_due <= 0:
            order.status = 'paid'
        order.save()

    else:
        payment.status = 'failed'
        payment.save()

    return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_payment_status(request, payment_id):
    """Check payment status"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        return Response({
            'payment_id': str(payment.id),
            'status': payment.status,
            'amount': str(payment.amount),
            'receipt': payment.mpesa_receipt_number,
            'order_status': payment.order.status,
        })
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)