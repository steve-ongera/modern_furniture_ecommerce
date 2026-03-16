import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { categoriesAPI } from '../services/api.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { SkeletonGrid, Breadcrumb, Pagination } from '../components/common/ProtectedRoute.jsx';

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1');
  const ordering = searchParams.get('ordering') || '-created_at';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  useEffect(() => {
    categoriesAPI.detail(slug).then(r => setCategory(r.data)).catch(console.error);
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    categoriesAPI.products(slug, { page, ordering, min_price: minPrice, max_price: maxPrice })
      .then(r => {
        setProducts(r.data.results || r.data);
        setTotal(r.data.count || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, page, ordering, minPrice, maxPrice]);

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const CAT_ICONS = {
    'bedroom-sets': '🛏️', 'living-room': '🛋️', 'dining-sets': '🍽️',
    'tables': '🪑', 'wardrobes': '🚪', 'tv-stands': '📺',
  };

  return (
    <>
      <Helmet>
        <title>{category?.name || 'Category'} | Morara Modern Furniture Kenya</title>
        <meta name="description" content={`Shop ${category?.name} at Morara Modern Furniture. Premium quality, fast delivery across Kenya.`} />
      </Helmet>

      {/* Category Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
        padding: '48px 0', color: '#fff', marginBottom: 0,
      }}>
        <div className="container">
          <Breadcrumb items={[{ label: category?.name || '...' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 48 }}>{CAT_ICONS[slug] || '🪑'}</span>
            <div>
              <h1 style={{ color: '#fff', marginBottom: 4 }}>{category?.name || '...'}</h1>
              {category?.description && (
                <p style={{ opacity: 0.85, maxWidth: 500, fontSize: 15 }}>{category.description}</p>
              )}
              <p style={{ opacity: 0.7, fontSize: 13, marginTop: 4 }}>{total} products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="search-layout" style={{ paddingTop: 24 }}>
          {/* Sidebar filters */}
          <aside className="filter-sidebar">
            <div className="filter-card">
              <h4><i className="bi bi-cash-stack"></i> Price Range (KSh)</h4>
              {[
                { label: 'Under 30,000', min: '', max: '30000' },
                { label: '30,000 – 80,000', min: '30000', max: '80000' },
                { label: '80,000 – 150,000', min: '80000', max: '150000' },
                { label: 'Over 150,000', min: '150000', max: '' },
              ].map(r => (
                <div key={r.label} className="filter-option"
                  onClick={() => { setParam('min_price', r.min); setParam('max_price', r.max); }}>
                  <input type="radio" name="pr" readOnly
                    checked={minPrice === r.min && maxPrice === r.max} />
                  <span>KSh {r.label}</span>
                </div>
              ))}
              <div className="form-row" style={{ marginTop: 10 }}>
                <input className="form-control" type="number" placeholder="Min" value={minPrice}
                  onChange={e => setParam('min_price', e.target.value)} />
                <input className="form-control" type="number" placeholder="Max" value={maxPrice}
                  onChange={e => setParam('max_price', e.target.value)} />
              </div>
            </div>

            {/* Sub-categories */}
            {category?.subcategories?.length > 0 && (
              <div className="filter-card">
                <h4><i className="bi bi-grid"></i> Sub-categories</h4>
                {category.subcategories.map(sub => (
                  <a key={sub.id} href={`/category/${sub.slug}`} className="filter-option" style={{ display: 'flex', gap: 8 }}>
                    <i className="bi bi-chevron-right"></i> {sub.name} ({sub.product_count})
                  </a>
                ))}
              </div>
            )}
          </aside>

          {/* Products */}
          <div className="search-results">
            <div className="results-toolbar">
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {loading ? 'Loading...' : `${total} products`}
              </span>
              <select className="sort-select" value={ordering}
                onChange={e => setParam('ordering', e.target.value)}>
                <option value="-created_at">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-average_rating">Top Rated</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {loading ? <SkeletonGrid count={8} /> : (
              products.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-box-seam" style={{ fontSize: 56, color: 'var(--mid-gray)', marginBottom: 16 }}></i>
                  <h3>No products in this category</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Check back soon for new arrivals</p>
                </div>
              ) : (
                <>
                  <div className="product-grid">
                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                  <Pagination current={page} total={total} onChange={p => setParam('page', p)} />
                </>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}