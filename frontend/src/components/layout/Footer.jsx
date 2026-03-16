import { Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email) { toast.success('Subscribed successfully!'); setEmail(''); }
  };

  return (
    <>
      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="container">
          <div className="trust-items">
            {[
              { icon: 'bi-truck', title: 'Delivery Nationwide', sub: 'Orders from KSh 4,000' },
              { icon: 'bi-arrow-counterclockwise', title: '7-Day Returns', sub: 'Hassle-free returns' },
              { icon: 'bi-shield-check', title: 'Quality Guaranteed', sub: 'Genuine furniture' },
              { icon: 'bi-shop', title: 'Free In-Store Pickup', sub: '3 showroom locations' },
            ].map((item, i) => (
              <div key={i} className="trust-item">
                <i className={`bi ${item.icon}`}></i>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="newsletter-section">
        <div className="container">
          <h3>Get the Latest Offers</h3>
          <p>Subscribe for furniture inspiration, new arrivals & exclusive deals</p>
          <form className="newsletter-form" onSubmit={handleNewsletter}>
            <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-house-heart-fill" style={{ color: '#fff', fontSize: 20 }}></i>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>Morara Modern Furniture</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Modern Living</div>
                </div>
              </div>
              <p>Premium quality furniture crafted for Kenyan homes and businesses. We blend style, comfort, and durability.</p>
              <div className="footer-social">
                {[
                  { icon: 'bi-facebook', href: '#' },
                  { icon: 'bi-instagram', href: '#' },
                  { icon: 'bi-youtube', href: '#' },
                  { icon: 'bi-twitter-x', href: '#' },
                  { icon: 'bi-whatsapp', href: 'https://wa.me/254748486829' },
                ].map((s, i) => (
                  <a key={i} href={s.href} className="social-link" target="_blank" rel="noopener noreferrer">
                    <i className={`bi ${s.icon}`}></i>
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                {[
                  { to: '/shop', label: 'Shop All' },
                  { to: '/?section=new-arrivals', label: 'New Arrivals' },
                  { to: '/?section=best-sellers', label: 'Best Sellers' },
                  { to: '/category/bedroom-sets', label: 'Bedroom Sets' },
                  { to: '/category/living-room', label: 'Living Room' },
                  { to: '/category/dining-sets', label: 'Dining Sets' },
                ].map((l, i) => (
                  <li key={i}><Link to={l.to}><i className="bi bi-chevron-right"></i>{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Customer Care</h4>
              <ul>
                {[
                  { to: '/orders', label: 'Track Your Order' },
                  { to: '#', label: 'Delivery Policy' },
                  { to: '#', label: 'Returns & Refunds' },
                  { to: '#', label: 'Payment Options' },
                  { to: '#', label: 'FAQ' },
                  { to: '#', label: 'Contact Us' },
                ].map((l, i) => (
                  <li key={i}><Link to={l.to}><i className="bi bi-chevron-right"></i>{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Our Showrooms</h4>
              <ul style={{ gap: 14 }}>
                {[
                  { icon: 'bi-geo-alt', name: 'Nairobi HQ', addr: 'Ruiru, Behind Spur Mall', phone: '+254 748 486829' },
                  { icon: 'bi-geo-alt', name: 'Nyeri Showroom', addr: 'Nyeri Town', phone: '+254 706 210310' },
                  { icon: 'bi-geo-alt', name: 'Nakuru Showroom', addr: 'Nakuru Town', phone: '+254 769 099099' },
                ].map((s, i) => (
                  <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className={`bi ${s.icon}`} style={{ color: 'var(--accent)' }}></i>{s.name}
                    </span>
                    <span style={{ fontSize: 12, paddingLeft: 18 }}>{s.addr}</span>
                    <span style={{ fontSize: 12, paddingLeft: 18 }}>{s.phone}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Morara Modern Furniture. All rights reserved.</span>
            <div className="footer-payments">
              <span style={{ fontSize: 12, marginRight: 8 }}>We accept:</span>
              {['MPESA', 'VISA', 'MC', 'CASH'].map(p => (
                <span key={p} style={{ background: 'rgba(255,255,255,0.12)', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}