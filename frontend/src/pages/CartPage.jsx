// CartPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/AppContext.jsx';
import { Breadcrumb, EmptyState } from '../components/common/ProtectedRoute.jsx';

export function CartPage() {
  const { cart, cartLoading, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  if (cartLoading) return <div style={{ padding: 48, textAlign: 'center' }}><i className="bi bi-hourglass-split" style={{ fontSize: 32, color: 'var(--primary)' }}></i></div>;

  return (
    <>
      <Helmet><title>Shopping Cart | Morara Modern Furniture</title></Helmet>
      <div className="container">
        <Breadcrumb items={[{ label: 'Cart' }]} />
        <h1 style={{ marginBottom: 24 }}>Shopping Cart</h1>

        {cart.items.length === 0 ? (
          <EmptyState icon="bi-bag-x" title="Your cart is empty" message="Add some furniture to get started!">
            <Link to="/shop" className="btn btn-primary">Browse Products</Link>
          </EmptyState>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {cart.items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">
                    <img
                      src={item.product.primary_image || ''}
                      alt={item.product.name}
                      onError={e => e.target.style.display='none'}
                    />
                  </div>
                  <div className="cart-item-info">
                    <h4><Link to={`/products/${item.product.slug}`}>{item.product.name}</Link></h4>
                    {item.variant && <p>Size: {item.variant.name}</p>}
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      {item.product.payment_type === 'half' && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>50% deposit available</span>}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateItem(item.id, item.quantity - 1)}>−</button>
                        <span className="qty-val">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateItem(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button style={{ fontSize: 13, color: '#e63946', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => removeItem(item.id)}>
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price">
                    KSh {Number(item.subtotal).toLocaleString()}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                      KSh {Number(item.unit_price).toLocaleString()} each
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal ({cart.item_count} items)</span>
                <span>KSh {Number(cart.total).toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span style={{ color: 'var(--text-muted)' }}>Calculated at checkout</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span className="amount">KSh {Number(cart.total).toLocaleString()}</span>
              </div>
              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }} onClick={() => navigate('/checkout')}>
                <i className="bi bi-lock"></i> Proceed to Checkout
              </button>
              <Link to="/shop" className="btn btn-light btn-block" style={{ marginTop: 10, textAlign: 'center' }}>
                <i className="bi bi-arrow-left"></i> Continue Shopping
              </Link>
              <div style={{ marginTop: 16, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['M-Pesa', 'VISA', 'Mastercard', 'Cash'].map(p => (
                  <span key={p} style={{ background: 'var(--light-gray)', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default CartPage;