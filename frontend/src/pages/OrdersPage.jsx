import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ordersAPI, paymentsAPI } from '../services/api.js';
import { Breadcrumb, EmptyState } from '../components/common/ProtectedRoute.jsx';
import toast from 'react-hot-toast';

const STATUS_CLASS = {
  pending: 'status-pending', half_paid: 'status-half_paid', paid: 'status-paid',
  processing: 'status-processing', delivered: 'status-delivered',
  completed: 'status-completed', cancelled: 'status-cancelled', defaulted: 'status-defaulted',
};

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.list().then(r => setOrders(r.data.results || r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><i className="bi bi-hourglass-split" style={{ fontSize: 32, color: 'var(--primary)' }}></i></div>;

  return (
    <>
      <Helmet><title>My Orders | Morara Modern Furniture</title></Helmet>
      <div className="container">
        <Breadcrumb items={[{ label: 'My Orders' }]} />
        <h1 style={{ marginBottom: 24 }}>My Orders</h1>

        {orders.length === 0 ? (
          <EmptyState icon="bi-bag" title="No orders yet" message="Start shopping and your orders will appear here.">
            <Link to="/shop" className="btn btn-primary">Browse Products</Link>
          </EmptyState>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-num">Order #{order.order_number}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 12 }}>
                      {new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <span className={`status-badge ${STATUS_CLASS[order.status] || 'status-pending'}`}>
                    {order.status_display}
                  </span>
                </div>
                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items?.slice(0, 4).map(item => (
                      <div key={item.id} className="order-item-thumb">
                        <div style={{ width: '100%', height: '100%', background: 'var(--light-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛋️</div>
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 48, background: 'var(--light-gray)', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{order.items?.length} item(s) · {order.delivery_type_display}</span>
                      {order.status === 'half_paid' && (
                        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>
                          <i className="bi bi-exclamation-triangle"></i> Balance due on delivery: KSh {Number(order.balance_on_delivery).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>KSh {Number(order.total_amount).toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paid: KSh {Number(order.amount_paid).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">
                      View Details <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    ordersAPI.detail(id).then(r => setOrder(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleBalancePayment = async () => {
    if (!mpesaPhone) { toast.error('Enter M-Pesa phone number'); return; }
    setPaying(true);
    try {
      const res = await paymentsAPI.initiate({ order_id: id, phone_number: mpesaPhone, payment_purpose: 'balance' });
      if (res.data.success) {
        toast.success(res.data.debug_mode ? 'Balance payment simulated!' : 'STK Push sent! Enter PIN.');
        setTimeout(() => ordersAPI.detail(id).then(r => setOrder(r.data)), 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><i className="bi bi-hourglass-split" style={{ fontSize: 32, color: 'var(--primary)' }}></i></div>;
  if (!order) return <div className="container"><EmptyState icon="bi-exclamation-circle" title="Order not found"><Link to="/orders" className="btn btn-primary">Back to Orders</Link></EmptyState></div>;

  return (
    <>
      <Helmet><title>Order #{order.order_number} | Morara Modern Furniture</title></Helmet>
      <div className="container">
        <Breadcrumb items={[{ label: 'My Orders', href: '/orders' }, { label: `Order #${order.order_number}` }]} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1>Order #{order.order_number}</h1>
          <span className={`status-badge ${STATUS_CLASS[order.status] || ''}`} style={{ fontSize: 14, padding: '6px 16px' }}>
            {order.status_display}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div>
            {/* Items */}
            <div className="form-card" style={{ marginBottom: 20 }}>
              <h3>Items Ordered</h3>
              {order.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 14, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 64, height: 54, background: 'var(--light-gray)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🛋️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                    {item.variant_name && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Size: {item.variant_name}</div>}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Qty: {item.quantity} × KSh {Number(item.unit_price).toLocaleString()}</div>
                    {item.payment_type === 'half' && (
                      <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>
                        Paid: KSh {Number(item.upfront_amount).toLocaleString()} | Balance: KSh {Number(item.balance_on_delivery).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>KSh {Number(item.subtotal).toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Delivery Info */}
            <div className="form-card">
              <h3><i className="bi bi-truck"></i> Delivery Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>Delivery Method</strong>
                  <span>{order.delivery_type_display}</span>
                </div>
                {order.delivery_type === 'home' ? (
                  <>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4 }}>County</strong>
                      <span>{order.county_name}</span>
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4 }}>Address</strong>
                      <span>{order.delivery_address}, {order.delivery_city}</span>
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4 }}>Phone</strong>
                      <span>{order.delivery_phone}</span>
                    </div>
                  </>
                ) : (
                  <div>
                    <strong style={{ display: 'block', marginBottom: 4 }}>Pickup Station</strong>
                    <span>{order.pickup_station_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Balance payment if half paid */}
            {order.status === 'half_paid' && order.balance_on_delivery > 0 && (
              <div className="form-card" style={{ marginTop: 20, borderColor: 'var(--accent)' }}>
                <h3 style={{ color: 'var(--accent)' }}><i className="bi bi-exclamation-triangle"></i> Balance Payment Due</h3>
                <p style={{ fontSize: 14, marginBottom: 16 }}>
                  You have an outstanding balance of <strong>KSh {Number(order.balance_on_delivery).toLocaleString()}</strong> due on delivery.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input className="form-control" type="tel" placeholder="M-Pesa phone number" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn btn-accent" onClick={handleBalancePayment} disabled={paying}>
                    {paying ? 'Processing...' : 'Pay Balance'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>KSh {Number(order.subtotal).toLocaleString()}</span></div>
              <div className="summary-row"><span>Delivery</span><span>KSh {Number(order.delivery_fee).toLocaleString()}</span></div>
              <div className="summary-row total"><span>Total</span><span className="amount">KSh {Number(order.total_amount).toLocaleString()}</span></div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div className="summary-row"><span>Amount Paid</span><span style={{ color: 'var(--primary)', fontWeight: 700 }}>KSh {Number(order.amount_paid).toLocaleString()}</span></div>
                {order.balance_due > 0 && <div className="summary-row"><span>Balance Due</span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>KSh {Number(order.balance_due).toLocaleString()}</span></div>}
              </div>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <div><i className="bi bi-calendar"></i> Placed: {new Date(order.created_at).toLocaleDateString('en-KE')}</div>
              </div>
            </div>

            {order.customer_notes && (
              <div className="form-card" style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 14 }}>Your Notes</h3>
                <p style={{ fontSize: 13 }}>{order.customer_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default OrdersPage;