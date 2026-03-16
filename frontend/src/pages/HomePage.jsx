import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productsAPI, categoriesAPI } from '../services/api.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { SkeletonGrid } from '../components/common/ProtectedRoute.jsx';

const HERO_SLIDES = [
  {
    tag: 'New Arrivals',
    title: 'Great Designs on Beds & Dressing Tables',
    subtitle: 'Upgrade your bedroom with our premium mahogany collection',
    bg: '#2d3e2e',
    img: null,
  },
  {
    tag: 'Best Seller',
    title: 'Elegant Living Room Sets',
    subtitle: 'Luxury sofas crafted for comfort and style',
    bg: '#3d2e2e',
    img: null,
  },
  {
    tag: 'New In',
    title: 'Premium Dining Sets',
    subtitle: 'Bring the family together around beautiful furniture',
    bg: '#2e2e3d',
    img: null,
  },
];

const CAT_ITEMS = [
  { label: 'Living Room', sub: 'Sofas & Coffee Tables', slug: 'living-room', icon: '🛋️', bg: '#c8d5c8' },
  { label: 'Bedroom Sets', sub: 'Beds & Dressers', slug: 'bedroom-sets', icon: '🛏️', bg: '#d5c8c8' },
  { label: 'Dining Room', sub: 'Tables & Chairs', slug: 'dining-sets', icon: '🍽️', bg: '#c8c8d5' },
];

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      productsAPI.newArrivals(),
      productsAPI.bestSellers(),
      categoriesAPI.list(),
    ]).then(([na, bs, cats]) => {
      setNewArrivals(na.data.results || na.data);
      setBestSellers(bs.data.results || bs.data);
      setCategories(cats.data.results || cats.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const gotoSlide = (i) => {
    setSlide(i);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
  };

  const REVIEWS = [
    { name: 'Amina K.', loc: 'Nairobi', rating: 5, title: 'Quality Furniture', body: 'Absolutely love my mahogany bed from Morara Furniture Pacific! Craftsmanship is top-notch, wood is solid and durable. Worth every penny.', initials: 'AK' },
    { name: 'James G.', loc: 'Nakuru', rating: 5, title: 'Excellent Finish', body: 'I ordered a custom dining table and was blown away by the quality. The finishing is elegant and the mahogany wood gives a luxurious touch.', initials: 'JG' },
    { name: 'Wanjiku M.', loc: 'Mombasa', rating: 5, title: 'Highly Recommended', body: 'Modern Furniture Pacific exceeded my expectations! Got a 6-seater sofa, comfort is unmatched. The delivery was fast and professional.', initials: 'WM' },
  ];

  return (
    <>
      <Helmet>
        <title>Morara Modern Furniture | Quality Beds, Sofas & Dining Sets Kenya</title>
        <meta name="description" content="Shop premium furniture in Kenya. Quality beds, sofas, dining sets. Showrooms in Nairobi, Nyeri & Nakuru. Pay via M-Pesa." />
      </Helmet>

      {/* Hero */}
      <section className="hero-section">
        {HERO_SLIDES.map((s, i) => (
          <div key={i} className={`hero-slide ${i === slide ? 'active' : ''}`} style={{ background: s.bg }}>
            <div className="hero-overlay"></div>
            <div className="container hero-content">
              <span className="hero-tag">{s.tag}</span>
              <h1>{s.title}</h1>
              <p>{s.subtitle}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/shop" className="btn btn-accent btn-lg">Shop Now</Link>
                <Link to="/shop" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>View All Items</Link>
              </div>
            </div>
          </div>
        ))}

        <button className="hero-arrow hero-arrow-prev" onClick={() => gotoSlide((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}>
          <i className="bi bi-chevron-left"></i>
        </button>
        <button className="hero-arrow hero-arrow-next" onClick={() => gotoSlide((slide + 1) % HERO_SLIDES.length)}>
          <i className="bi bi-chevron-right"></i>
        </button>
        <div className="hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} className={`hero-dot ${i === slide ? 'active' : ''}`} onClick={() => gotoSlide(i)}></button>
          ))}
        </div>
      </section>

      {/* Category Grid */}
      <div className="container">
        <div className="cat-grid">
          {CAT_ITEMS.map((cat) => (
            <Link to={`/category/${cat.slug}`} key={cat.slug} className="cat-card" style={{ background: cat.bg }}>
              <div className="cat-card-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>{cat.icon}</div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: 4 }}>{cat.label}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{cat.sub}</p>
                <span className="btn" style={{ marginTop: 12, width: 'fit-content' }}>Shop Now</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* New Arrivals */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>New Arrivals</h2>
            <Link to="/shop?filter=new_arrivals" className="view-all">View All <i className="bi bi-arrow-right"></i></Link>
          </div>
          {loading ? <SkeletonGrid count={4} /> : (
            <div className="product-grid">
              {newArrivals.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          {!loading && newArrivals.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No products yet. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Inspiration Section */}
      <section className="inspiration-section">
        <div className="container">
          <div className="inspiration-grid">
            <div className="inspiration-text">
              <h2>Inspiration for Every Room</h2>
              <p>We believe furniture is more than just functional — it's an expression of style, comfort, and innovation. Our expertly crafted modern furniture designs bring a perfect blend of elegance, durability and functionality to homes and businesses across Kenya.</p>
              <Link to="/shop" className="btn btn-primary">View All Rooms</Link>
            </div>
            <div className="inspiration-imgs">
              <div style={{ gridColumn: '1 / -1', borderRadius: 12, background: '#c8d5c8', aspectRatio: '16/7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🛋️</div>
              <div style={{ borderRadius: 12, background: '#d5c8c8', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🛏️</div>
              <div style={{ borderRadius: 12, background: '#c8c8d5', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🍽️</div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Best Sellers</h2>
            <Link to="/shop?filter=best_sellers" className="view-all">View All <i className="bi bi-arrow-right"></i></Link>
          </div>
          {loading ? <SkeletonGrid count={4} /> : (
            <div className="product-grid">
              {bestSellers.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="section" style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Customer Reviews</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>What our trusted customers say</span>
          </div>
          <div className="review-cards">
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-stars">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <i key={j} className="bi bi-star-fill"></i>
                  ))}
                </div>
                <strong style={{ display: 'block', marginBottom: 8, fontSize: 15 }}>{r.title}</strong>
                <p style={{ fontSize: 14, color: 'var(--text-body)', fontStyle: 'italic' }}>"{r.body}"</p>
                <div className="reviewer">
                  <div className="reviewer-avatar">{r.initials}</div>
                  <div>
                    <strong style={{ fontSize: 13 }}>{r.name}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}