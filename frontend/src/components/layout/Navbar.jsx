import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../../context/AppContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSidebarOpen(false);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Top Bar */}
      <div className="topbar">
        <div className="container">
          <div className="topbar-contact">
            <span><i className="bi bi-telephone-fill"></i> 0716 335555</span>
            <span><i className="bi bi-whatsapp"></i> 0748486829</span>
            <span className="d-none d-md-flex"><i className="bi bi-envelope-fill"></i> info@morarafurniture.co.ke</span>
          </div>
          <span><i className="bi bi-geo-alt-fill"></i> Showrooms: Nairobi | Nyeri | Nakuru</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="container">
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>

          <Link to="/" className="navbar-brand">
            <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-house-heart-fill" style={{ color: '#fff', fontSize: 20 }}></i>
            </div>
            <div>
              <div className="brand-name">Morara Furniture</div>
              <div className="brand-tagline">Modern Living</div>
            </div>
          </Link>

          <div className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/shop">Shop Now</NavLink>
            <NavLink to="/category/bedroom-sets">Bedroom Sets</NavLink>
            <NavLink to="/category/living-room">Living Room</NavLink>
            <NavLink to="/category/dining-sets">Dining Sets</NavLink>
          </div>

          <form className="nav-search" onSubmit={handleSearch}>
            <div className="search-input-wrap">
              <input
                type="search"
                placeholder="Search furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </form>

          <div className="nav-icons">
            {user ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button className="nav-icon-btn" onClick={() => setDropdownOpen(!dropdownOpen)} title={user.first_name || user.email}>
                  <i className="bi bi-person-circle"></i>
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 4,
                    background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)', width: 200, zIndex: 999, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '12px 16px', background: 'var(--off-white)', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{user.first_name || user.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    {[
                      { to: '/profile', icon: 'bi-person', label: 'My Profile' },
                      { to: '/orders', icon: 'bi-bag', label: 'My Orders' },
                      { to: '/wishlist', icon: 'bi-heart', label: 'Wishlist' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 14, borderBottom: '1px solid var(--border)' }} onClick={() => setDropdownOpen(false)}>
                        <i className={`bi ${item.icon}`} style={{ color: 'var(--primary)' }}></i> {item.label}
                      </Link>
                    ))}
                    <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 14, width: '100%', color: '#e63946' }} onClick={() => { logout(); setDropdownOpen(false); }}>
                      <i className="bi bi-box-arrow-right"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nav-icon-btn" title="Login">
                <i className="bi bi-person"></i>
              </Link>
            )}

            <Link to="/wishlist" className="nav-icon-btn" title="Wishlist">
              <i className="bi bi-heart"></i>
            </Link>

            <Link to="/cart" className="nav-icon-btn" title="Cart">
              <i className="bi bi-bag"></i>
              {cart.item_count > 0 && (
                <span className="nav-badge">{cart.item_count > 9 ? '9+' : cart.item_count}</span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>

      {/* Mobile Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Morara Furniture</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Modern Living</div>
          </div>
          <button className="sidebar-close" onClick={closeSidebar}><i className="bi bi-x-lg"></i></button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrap">
            <input type="search" placeholder="Search furniture..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button type="submit" className="search-btn"><i className="bi bi-search"></i></button>
          </div>
        </form>

        <nav className="sidebar-nav">
          {[
            { to: '/', icon: 'bi-house', label: 'Home' },
            { to: '/shop', icon: 'bi-grid', label: 'Shop All' },
            { to: '/category/bedroom-sets', icon: 'bi-moon', label: 'Bedroom Sets' },
            { to: '/category/living-room', icon: 'bi-tv', label: 'Living Room' },
            { to: '/category/dining-sets', icon: 'bi-cup-hot', label: 'Dining Sets' },
            { to: '/cart', icon: 'bi-bag', label: `Cart (${cart.item_count})` },
            { to: '/orders', icon: 'bi-receipt', label: 'My Orders' },
            { to: '/wishlist', icon: 'bi-heart', label: 'Wishlist' },
            { to: user ? '/profile' : '/login', icon: 'bi-person', label: user ? 'My Account' : 'Login / Register' },
          ].map(item => (
            <Link key={item.to} to={item.to} onClick={closeSidebar}>
              <i className={`bi ${item.icon}`}></i> {item.label}
            </Link>
          ))}
          {user && (
            <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', fontSize: 15, width: '100%', borderBottom: '1px solid var(--border)', color: '#e63946' }} onClick={() => { logout(); closeSidebar(); }}>
              <i className="bi bi-box-arrow-right" style={{ color: '#e63946' }}></i> Logout
            </button>
          )}
        </nav>

        <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><i className="bi bi-telephone-fill" style={{ color: 'var(--primary)' }}></i> 0716 335555</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i className="bi bi-geo-alt-fill" style={{ color: 'var(--primary)' }}></i> Nairobi | Nyeri | Nakuru</div>
        </div>
      </div>
    </>
  );
}