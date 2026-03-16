import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productsAPI, categoriesAPI } from '../services/api.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { SkeletonGrid, Breadcrumb, Pagination } from '../components/common/ProtectedRoute.jsx';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const inStock = searchParams.get('in_stock') || '';
  const filter = searchParams.get('filter') || '';
  const ordering = searchParams.get('ordering') || '-created_at';

  useEffect(() => {
    categoriesAPI.list().then(r => setCategories(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, ordering };
    if (category) params.category = category;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (inStock) params.in_stock = true;
    if (filter === 'new_arrivals') params.is_new_arrival = true;
    if (filter === 'best_sellers') params.is_best_seller = true;

    productsAPI.list(params)
      .then(r => { setProducts(r.data.results || r.data); setTotal(r.data.count || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, category, minPrice, maxPrice, inStock, filter, ordering]);

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <>
      <Helmet>
        <title>Shop All Furniture | Morara Modern Furniture Kenya</title>
        <meta name="description" content="Browse our full collection of premium furniture. Beds, sofas, dining sets, dressing tables & more. Delivery across Kenya." />
      </Helmet>

      <div className="container">
        <Breadcrumb items={[{ label: 'Shop' }]} />

        <div className="search-layout">
          {/* Filter Sidebar */}
          <aside className="filter-sidebar">
            <div className="filter-card">
              <h4><i className="bi bi-funnel"></i> Categories</h4>
              <div className="filter-option" onClick={() => setParam('category', '')}>
                <input type="radio" name="cat" checked={!category} readOnly />
                <span>All Categories</span>
              </div>
              {categories.map(cat => (
                <div key={cat.id} className="filter-option" onClick={() => setParam('category', cat.slug)}>
                  <input type="radio" name="cat" checked={category === cat.slug} readOnly />
                  <span>{cat.name} ({cat.product_count})</span>
                </div>
              ))}
            </div>

            <div className="filter-card">
              <h4><i className="bi bi-currency-dollar"></i> Price Range (KSh)</h4>
              <div className="form-group">
                <input className="form-control" type="number" placeholder="Min price" value={minPrice} onChange={e => setParam('min_price', e.target.value)} />
              </div>
              <div className="form-group">
                <input className="form-control" type="number" placeholder="Max price" value={maxPrice} onChange={e => setParam('max_price', e.target.value)} />
              </div>
            </div>

            <div className="filter-card">
              <h4><i className="bi bi-tag"></i> Availability</h4>
              <div className="filter-option" onClick={() => setParam('in_stock', inStock ? '' : 'true')}>
                <input type="checkbox" checked={!!inStock} readOnly />
                <span>In Stock Only</span>
              </div>
            </div>

            <div className="filter-card">
              <h4><i className="bi bi-lightning"></i> Collections</h4>
              {[
                { label: 'New Arrivals', val: 'new_arrivals' },
                { label: 'Best Sellers', val: 'best_sellers' },
              ].map(f => (
                <div key={f.val} className="filter-option" onClick={() => setParam('filter', filter === f.val ? '' : f.val)}>
                  <input type="checkbox" checked={filter === f.val} readOnly />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Results */}
          <div className="search-results">
            <div className="results-toolbar">
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {loading ? '...' : `${total} products found`}
              </span>
              <select className="sort-select" value={ordering} onChange={e => setParam('ordering', e.target.value)}>
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
                  <i className="bi bi-search" style={{ fontSize: 48, color: 'var(--mid-gray)', marginBottom: 16 }}></i>
                  <h3>No products found</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters</p>
                </div>
              ) : (
                <div className="product-grid">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )
            )}

            <Pagination current={page} total={total} onChange={p => setParam('page', p)} />
          </div>
        </div>
      </div>
    </>
  );
}