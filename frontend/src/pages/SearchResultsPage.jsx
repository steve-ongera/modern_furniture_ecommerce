import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productsAPI, categoriesAPI } from '../services/api.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { SkeletonGrid, Breadcrumb, Pagination } from '../components/common/ProtectedRoute.jsx';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const ordering = searchParams.get('ordering') || '-created_at';

  useEffect(() => {
    categoriesAPI.list().then(r => setCategories(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    const params = { q: query, page, ordering };
    if (category) params.category = category;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;

    productsAPI.search(query, { page, ordering, category, min_price: minPrice, max_price: maxPrice })
      .then(r => {
        setProducts(r.data.results || r.data);
        setTotal(r.data.count || (r.data.results || r.data).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, page, category, minPrice, maxPrice, ordering]);

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <>
      <Helmet>
        <title>{query ? `"${query}" - Search Results` : 'Search'} | Morara Modern Furniture</title>
        <meta name="description" content={`Search results for ${query} - Morara Modern Furniture Kenya`} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container">
        <Breadcrumb items={[{ label: 'Search Results' }]} />

        <div className="search-header">
          <h1>
            {query ? (
              <>Search results for <em style={{ color: 'var(--primary)' }}>"{query}"</em></>
            ) : 'Search Products'}
          </h1>
          {!loading && query && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              {total} product{total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        <div className="search-layout">
          {/* Filters */}
          <aside className="filter-sidebar">
            <div className="filter-card">
              <h4><i className="bi bi-funnel"></i> Categories</h4>
              <div className="filter-option" onClick={() => setParam('category', '')}>
                <input type="radio" name="cat" checked={!category} readOnly /> All
              </div>
              {categories.map(cat => (
                <div key={cat.id} className="filter-option" onClick={() => setParam('category', cat.slug)}>
                  <input type="radio" name="cat" checked={category === cat.slug} readOnly />
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>

            <div className="filter-card">
              <h4><i className="bi bi-cash-stack"></i> Price (KSh)</h4>
              <div className="form-group">
                <input className="form-control" type="number" placeholder="Min" value={minPrice}
                  onChange={e => setParam('min_price', e.target.value)} />
              </div>
              <div className="form-group">
                <input className="form-control" type="number" placeholder="Max" value={maxPrice}
                  onChange={e => setParam('max_price', e.target.value)} />
              </div>
              {[
                { label: 'Under KSh 30,000', min: '', max: '30000' },
                { label: 'KSh 30,000 – 80,000', min: '30000', max: '80000' },
                { label: 'KSh 80,000 – 150,000', min: '80000', max: '150000' },
                { label: 'Over KSh 150,000', min: '150000', max: '' },
              ].map(r => (
                <div key={r.label} className="filter-option" onClick={() => { setParam('min_price', r.min); setParam('max_price', r.max); }}>
                  <input type="radio" name="price" readOnly
                    checked={minPrice === r.min && maxPrice === r.max} />
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Results */}
          <div className="search-results">
            {query && (
              <div className="results-toolbar">
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''}`}
                </span>
                <select className="sort-select" value={ordering} onChange={e => setParam('ordering', e.target.value)}>
                  <option value="-created_at">Newest</option>
                  <option value="price">Price ↑</option>
                  <option value="-price">Price ↓</option>
                  <option value="-average_rating">Top Rated</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            )}

            {!query ? (
              <div className="empty-state">
                <i className="bi bi-search" style={{ fontSize: 56, color: 'var(--mid-gray)', marginBottom: 16 }}></i>
                <h3>Search for furniture</h3>
                <p style={{ color: 'var(--text-muted)' }}>Try "bed", "sofa", "dining table"…</p>
              </div>
            ) : loading ? (
              <SkeletonGrid count={8} />
            ) : products.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-emoji-frown" style={{ fontSize: 56, color: 'var(--mid-gray)', marginBottom: 16 }}></i>
                <h3>No results for "{query}"</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                  Try different keywords or browse our categories
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Beds', 'Sofas', 'Dining Sets', 'Wardrobes'].map(s => (
                    <button key={s} className="btn btn-light btn-sm"
                      onClick={() => setParam('q', s.toLowerCase())}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                <Pagination current={page} total={total} onChange={p => setParam('page', p)} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}