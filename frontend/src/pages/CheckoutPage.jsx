import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart, useAuth } from '../context/AppContext.jsx';
import { locationsAPI, ordersAPI, paymentsAPI } from '../services/api.js';
import { Breadcrumb } from '../components/common/ProtectedRoute.jsx';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [counties, setCounties] = useState([]);
  const [pickupStations, setPickupStations] = useState([]);
  const [deliveryType, setDeliveryType] = useState('home');
  const [paymentMode, setPaymentMode] = useState('full');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedPickup, setSelectedPickup] = useState('');
  const [form, setForm] = useState({
    delivery_address: user?.address || '',
    delivery_city: user?.city || '',
    delivery_phone: user?.phone || '',
    delivery_notes: '',
    customer_notes: '',
  });
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=delivery, 2=payment
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    locationsAPI.counties().then(r => setCounties(r.data.results || r.data));
    locationsAPI.pickupStations().then(r => setPickupStations(r.data.results || r.data));
  }, []);

  // Check if any cart item supports only full payment
  const hasFullPaymentOnly = cart.items.some(i => i.product?.payment_type === 'full');

  const handlePlaceOrder = async () => {
    if (!cart.items.length) { toast.error('Cart is empty'); return; }
    setLoading(true);
    try {
      const payload = {
        delivery_type: deliveryType,
        payment_mode: paymentMode,
        customer_notes: form.customer_notes,
        ...(deliveryType === 'home' ? {
          county_id: selectedCounty,
          delivery_address: form.delivery_address,
          delivery_city: form.delivery_city,
          delivery_phone: form.delivery_phone,
          delivery_notes: form.delivery_notes,
        } : {
          pickup_station_id: selectedPickup,
        })
      };
      const res = await ordersAPI.create(payload);
      setCreatedOrder(res.data);
      setStep(2);
      toast.success('Order created! Complete payment below.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!mpesaPhone) { toast.error('Enter M-Pesa phone number'); return; }
    setLoading(true);
    try {
      const res = await paymentsAPI.initiate({
        order_id: createdOrder.id,
        phone_number: mpesaPhone,
        payment_purpose: paymentMode === 'half' ? 'deposit' : 'full',
      });
      if (res.data.success) {
        setPaymentId(res.data.payment_id);
        if (res.data.debug_mode) {
          toast.success('Payment successful (Debug Mode)!');
          setTimeout(() => { clearCart(); navigate(`/orders/${createdOrder.id}`); }, 1500);
        } else {
          toast.success('STK Push sent! Enter your M-Pesa PIN.');
          setPolling(true);
          pollPaymentStatus(res.data.payment_id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = (pid, attempts = 0) => {
    if (attempts > 12) { setPolling(false); toast.error('Payment timeout. Please check your orders.'); return; }
    setTimeout(async () => {
      try {
        const res = await paymentsAPI.checkStatus(pid);
        if (res.data.status === 'completed') {
          setPolling(false);
          toast.success('Payment confirmed!');
          clearCart();
          navigate(`/orders/${createdOrder.id}`);
        } else if (res.data.status === 'failed') {
          setPolling(false);
          toast.error('Payment failed. Please try again.');
        } else {
          pollPaymentStatus(pid, attempts + 1);
        }
      } catch { pollPaymentStatus(pid, attempts + 1); }
    }, 5000);
  };

  if (!cart.items.length && !createdOrder) {
    return (
      <div className="container" style={{ padding: '48px 0', textAlign: 'center' }}>
        <h3>Your cart is empty</h3>
        <a href="/shop" className="btn btn-primary" style={{ marginTop: 16 }}>Go Shopping</a>
      </div>
    );
  }

  const estimatedTotal = Number(cart.total);
  const upfrontAmount = paymentMode === 'half' ? estimatedTotal * 0.5 : estimatedTotal;

  return (
    <>
      <Helmet><title>Checkout | Morara Modern Furniture</title></Helmet>
      <div className="container">
        <Breadcrumb items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
        <h1 style={{ marginBottom: 24 }}>Checkout</h1>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, background: 'var(--off-white)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {['Delivery Details', 'Payment'].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '12px 20px', textAlign: 'center', fontSize: 14, fontWeight: 600,
              background: step === i + 1 ? 'var(--primary)' : 'transparent',
              color: step === i + 1 ? '#fff' : step > i + 1 ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              <i className={`bi ${step > i + 1 ? 'bi-check-circle-fill' : `bi-${i + 1}-circle`}`} style={{ marginRight: 6 }}></i>
              {s}
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          <div className="checkout-form">
            {step === 1 && (
              <>
                {/* Delivery Type */}
                <div className="form-card">
                  <h3><i className="bi bi-truck"></i> Delivery Method</h3>
                  <div className="delivery-type-opts">
                    {[
                      { val: 'home', icon: 'bi-house-door', label: 'Home Delivery', sub: 'Delivered to your door' },
                      { val: 'pickup', icon: 'bi-shop', label: 'In-Store Pickup', sub: 'Free from our showrooms' },
                    ].map(opt => (
                      <div key={opt.val} className={`delivery-opt ${deliveryType === opt.val ? 'selected' : ''}`} onClick={() => setDeliveryType(opt.val)}>
                        <i className={`bi ${opt.icon}`}></i>
                        <strong>{opt.label}</strong>
                        <span>{opt.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {deliveryType === 'home' ? (
                  <div className="form-card">
                    <h3><i className="bi bi-geo-alt"></i> Delivery Address</h3>
                    <div className="form-group">
                      <label>County *</label>
                      <select className="form-control" value={selectedCounty} onChange={e => setSelectedCounty(e.target.value)} required>
                        <option value="">Select county...</option>
                        {counties.map(c => <option key={c.id} value={c.id}>{c.name} (+KSh {Number(c.base_delivery_fee).toLocaleString()} delivery)</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Full Address *</label>
                      <input className="form-control" value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })} placeholder="Street, Estate, House No." required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City/Town *</label>
                        <input className="form-control" value={form.delivery_city} onChange={e => setForm({ ...form, delivery_city: e.target.value })} placeholder="e.g. Nairobi" required />
                      </div>
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input className="form-control" value={form.delivery_phone} onChange={e => setForm({ ...form, delivery_phone: e.target.value })} placeholder="07XX XXX XXX" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Delivery Notes</label>
                      <textarea className="form-control" rows={3} value={form.delivery_notes} onChange={e => setForm({ ...form, delivery_notes: e.target.value })} placeholder="Any special instructions..." />
                    </div>
                  </div>
                ) : (
                  <div className="form-card">
                    <h3><i className="bi bi-shop"></i> Select Pickup Station</h3>
                    {pickupStations.map(s => (
                      <div key={s.id} className={`delivery-opt ${selectedPickup == s.id ? 'selected' : ''}`} onClick={() => setSelectedPickup(s.id)} style={{ marginBottom: 12 }}>
                        <i className="bi bi-shop"></i>
                        <strong>{s.name}</strong>
                        <span>{s.address}</span>
                        {s.pickup_fee > 0 ? <span>Fee: KSh {Number(s.pickup_fee).toLocaleString()}</span> : <span style={{ color: 'var(--primary)' }}>Free Pickup</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Payment Mode */}
                <div className="form-card">
                  <h3><i className="bi bi-credit-card"></i> Payment Mode</h3>
                  {hasFullPaymentOnly && (
                    <div style={{ background: '#fff3cd', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 13 }}>
                      <i className="bi bi-exclamation-triangle"></i> Some items in your cart require full payment only.
                    </div>
                  )}
                  <div className="payment-mode-opts">
                    <div className={`payment-opt ${paymentMode === 'full' ? 'selected' : ''}`} onClick={() => setPaymentMode('full')}>
                      <h4><i className="bi bi-check-circle"></i> Full Payment</h4>
                      <p>Pay the full amount now (KSh {estimatedTotal.toLocaleString()}+delivery)</p>
                    </div>
                    <div
                      className={`payment-opt ${paymentMode === 'half' ? 'selected' : ''} ${hasFullPaymentOnly ? '' : ''}`}
                      onClick={() => !hasFullPaymentOnly && setPaymentMode('half')}
                      style={{ opacity: hasFullPaymentOnly ? 0.5 : 1, cursor: hasFullPaymentOnly ? 'not-allowed' : 'pointer' }}
                    >
                      <h4><i className="bi bi-currency-exchange"></i> 50% Deposit</h4>
                      <p>Pay KSh {(estimatedTotal * 0.5).toLocaleString()} now, balance on delivery</p>
                      <p style={{ fontSize: 11, color: '#e63946', marginTop: 4 }}>⚠️ Non-delivery defaults = 25% refund only</p>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg btn-block"
                  onClick={handlePlaceOrder}
                  disabled={loading || (deliveryType === 'home' && (!selectedCounty || !form.delivery_address)) || (deliveryType === 'pickup' && !selectedPickup)}
                >
                  {loading ? 'Placing Order...' : 'Place Order & Continue to Payment'}
                </button>
              </>
            )}

            {step === 2 && createdOrder && (
              <div className="form-card">
                <h3><i className="bi bi-phone"></i> Pay with M-Pesa</h3>
                <div style={{ background: '#e8f5e9', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Order #{createdOrder.order_number}</div>
                  <div style={{ fontSize: 14 }}>Amount due: <strong style={{ color: 'var(--primary)', fontSize: 18 }}>KSh {Number(paymentMode === 'half' ? createdOrder.total_amount * 0.5 : createdOrder.total_amount).toLocaleString()}</strong></div>
                  {paymentMode === 'half' && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Balance on delivery: KSh {Number(createdOrder.total_amount * 0.5).toLocaleString()}</div>}
                </div>

                <div className="form-group">
                  <label>M-Pesa Phone Number *</label>
                  <input
                    className="form-control"
                    type="tel"
                    value={mpesaPhone}
                    onChange={e => setMpesaPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    style={{ fontSize: 16 }}
                  />
                  <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>You'll receive an STK Push on this number</small>
                </div>

                {polling ? (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
                    <p style={{ fontWeight: 600 }}>Waiting for M-Pesa confirmation...</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Enter your PIN on your phone to complete payment</p>
                  </div>
                ) : (
                  <button className="btn btn-accent btn-lg btn-block" onClick={handlePayment} disabled={loading || !mpesaPhone}>
                    <i className="bi bi-phone"></i> {loading ? 'Initiating...' : 'Pay Now via M-Pesa'}
                  </button>
                )}

                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  <i className="bi bi-shield-lock"></i> Secured by Safaricom M-Pesa
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="cart-summary">
            <h3>Order Summary</h3>
            {cart.items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 48, height: 40, background: 'var(--light-gray)', borderRadius: 6, flexShrink: 0, overflow: 'hidden' }}>
                  {item.product.primary_image && <img src={item.product.primary_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{item.product.name}</div>
                  {item.variant && <div style={{ color: 'var(--text-muted)' }}>{item.variant.name}</div>}
                  <div style={{ color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>KSh {Number(item.subtotal).toLocaleString()}</div>
              </div>
            ))}
            <div className="summary-row"><span>Subtotal</span><span>KSh {estimatedTotal.toLocaleString()}</span></div>
            <div className="summary-row"><span>Delivery</span><span>+TBD</span></div>
            {paymentMode === 'half' && (
              <div className="summary-row" style={{ color: 'var(--primary)' }}>
                <span>Pay Now (50%)</span>
                <strong>KSh {(estimatedTotal * 0.5).toLocaleString()}</strong>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span className="amount">KSh {estimatedTotal.toLocaleString()}+</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}