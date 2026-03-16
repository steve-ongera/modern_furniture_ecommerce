import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AppContext.jsx';

// ── Protected Route ───────────────────────────────────────────────────────────
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><i className="bi bi-hourglass-split" style={{ fontSize: 32, color: 'var(--primary)' }}></i></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img"></div>
      <div style={{ padding: 14 }}>
        <div className="skeleton skeleton-text short" style={{ marginBottom: 8 }}></div>
        <div className="skeleton skeleton-text medium" style={{ marginBottom: 8 }}></div>
        <div className="skeleton skeleton-text short"></div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom';

export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      <Link to="/">Home</Link>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-chevron-right"></i>
          {item.href ? (
            <Link to={item.href}>{item.label}</Link>
          ) : (
            <span style={{ color: 'var(--text-dark)' }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────
export function Pagination({ current, total, pageSize = 24, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 2 && i <= current + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(current - 1)} disabled={current === 1}>
        <i className="bi bi-chevron-left"></i>
      </button>
      {pages.map((p, i) => (
        p === '...' ? (
          <span key={i} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
        ) : (
          <button key={i} className={`page-btn ${p === current ? 'active' : ''}`} onClick={() => onChange(p)}>
            {p}
          </button>
        )
      ))}
      <button className="page-btn" onClick={() => onChange(current + 1)} disabled={current === totalPages}>
        <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
export function StarRating({ rating, size = 14 }) {
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => (
        <i key={i} className={
          i <= Math.floor(rating) ? 'bi bi-star-fill' :
          i - 0.5 <= rating ? 'bi bi-star-half' : 'bi bi-star'
        }></i>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = 'bi-inbox', title, message, children }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`}></i>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {children}
    </div>
  );
}