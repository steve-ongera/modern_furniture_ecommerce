import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productsAPI, locationsAPI } from '../services/api.js';
import { useCart, useWishlist } from '../context/AppContext.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import { Breadcrumb, StarRating } from '../components/common/ProtectedRoute.jsx';

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"%3E%3Crect fill="%23f1ede8" width="600" height="450"/%3E%3Ctext fill="%23ccc" font-size="80" text-anchor="middle" dominant-baseline="middle" x="300" y="225"%3E🛋%3C/text%3E%3C/svg%3E';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [counties, setCounties] = useState([]);
  const [selectedCounty, setSelectedCounty] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [deliveryType, setDeliveryType] = useState('home');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    setLoading(true);
    productsAPI.detail(slug)
      .then(r => {
        setProduct(r.data);
        if (r.data.variants?.length > 0) setSelectedVariant(r.data.variants[0]);
        // Load related products from same category
        productsAPI.list({ category: r.data.category?.slug, page: 1 })
          .then(rel => setRelatedProducts((rel.data.results || rel.data).filter(p => p.slug !== slug).slice(0, 4)))
          .catch(() => {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    locationsAPI.counties().then(r => setCounties(r.data.results || r.data)).catch(() => {});
    window.scrollTo(0, 0);
  }, [slug]);

  const checkDeliveryFee = async () => {
    if (!selectedCounty) return;
    try {
      const res = await productsAPI.deliveryFee(slug, { delivery_type: 'home', county_slug: selectedCounty });
      setDeliveryFee(res.data);
    } catch { setDeliveryFee(null); }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(product.id, selectedVariant?.id || null, qty);
    setAddingToCart(false);
  };

  if (loading) return (
    <div className="container">
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <i className="bi bi-hourglass-split" style={{ fontSize: 48, color: 'var(--primary)', animation: 'spin 1s linear infinite' }}></i>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container">
      <div className="empty-state">
        <i className="bi bi-exclamation-circle"></i>
        <h3>Product not found</h3>
        <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [{ image: PLACEHOLDER, alt_text: product.name }];
  const currentPrice = selectedVariant ? selectedVariant.final_price : product.effective_price;
  const inWishlist = isInWishlist(product.id);

  return (
    <>
      <Helmet>
        <title>{product.meta_title || `${product.name} | Morara Modern Furniture`}</title>
        <meta name="description" content={product.meta_description} />
        {product.meta_keywords && <meta name="keywords" content={product.meta_keywords} />}
      </Helmet>

      <div className="container">
        <Breadcrumb items={[
          { label: product.category?.name, href: `/category/${product.category?.slug}` },
          { label: product.name }
        ]} />

        <div className="product-detail-wrap">
          {/* Images */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={images[activeImg]?.image || PLACEHOLDER}
                alt={images[activeImg]?.alt_text || product.name}
                onError={e => e.target.src = PLACEHOLDER}
              />
            </div>
            {images.length > 1 && (
              <div className="image-thumbs">
                {images.map((img, i) => (
                  <div key={i} className={`thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={img.image} alt="" onError={e => e.target.src = PLACEHOLDER} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            <span className="product-info-cat">{product.category?.name}</span>
            <h1 className="product-info-name">{product.name}</h1>

            {product.average_rating > 0 && (
              <div className="product-info-rating">
                <StarRating rating={product.average_rating} size={16} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({product.review_count} reviews)</span>
                {product.views_count > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--accent)', marginLeft: 8 }}>
                    <i className="bi bi-eye"></i> {product.views_count} views
                  </span>
                )}
              </div>
            )}

            <div className="product-info-price">
              <span className="current">KSh {Number(currentPrice).toLocaleString()}</span>
              {product.sale_price && (
                <span className="old">KSh {Number(product.price).toLocaleString()}</span>
              )}
              {product.discount_percentage > 0 && (
                <span style={{ background: '#fde8e8', color: '#e63946', padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  -{product.discount_percentage}% OFF
                </span>
              )}
            </div>

            {/* Availability */}
            <div>
              {product.is_in_stock ? (
                <span style={{ color: '#2d6a4f', fontWeight: 600, fontSize: 14 }}>
                  <i className="bi bi-check-circle-fill"></i> In Stock
                </span>
              ) : (
                <span style={{ color: '#e63946', fontWeight: 600, fontSize: 14 }}>
                  <i className="bi bi-x-circle-fill"></i> Out of Stock
                </span>
              )}
            </div>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="variants-section">
                <label>Bed Size: <strong>{selectedVariant?.name}</strong></label>
                <div className="variant-options">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      className={`variant-opt ${selectedVariant?.id === v.id ? 'selected' : ''}`}
                      onClick={() => setSelectedVariant(v)}
                      disabled={!v.is_available}
                    >
                      {v.name}
                      {v.price_adjustment !== 0 && (
                        <span style={{ fontSize: 11, marginLeft: 4 }}>
                          ({v.price_adjustment > 0 ? '+' : ''}KSh {Number(v.price_adjustment).toLocaleString()})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="qty-wrap">
              <label>Quantity:</label>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="product-detail-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={!product.is_in_stock || addingToCart}
              >
                <i className="bi bi-bag-plus"></i>
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                className={`btn btn-outline ${inWishlist ? 'btn-primary' : ''}`}
                onClick={() => toggleWishlist(product)}
                title="Add to Wishlist"
              >
                <i className={`bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'}`}></i>
              </button>
            </div>

            {/* Payment Info */}
            {product.payment_type === 'half' && (
              <div className="payment-info-box">
                <h4><i className="bi bi-info-circle"></i> Payment Options</h4>
                <p>
                  You can pay <strong>50% upfront (KSh {Number(product.upfront_payment_amount).toLocaleString()})</strong> and the remaining 50% on delivery.
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                  ⚠️ If balance payment is not made on delivery, only <strong>25% (KSh {(Number(product.effective_price) * 0.25).toLocaleString()})</strong> will be refunded.
                </p>
              </div>
            )}

            {/* Delivery Fee Calculator */}
            <div className="delivery-info-box">
              <h4><i className="bi bi-truck"></i> Estimate Delivery Fee</h4>
              <select className="delivery-select" value={selectedCounty} onChange={e => setSelectedCounty(e.target.value)}>
                <option value="">Select your county...</option>
                {counties.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <button className="btn btn-outline btn-sm btn-block" onClick={checkDeliveryFee} disabled={!selectedCounty}>
                Calculate Delivery Fee
              </button>
              {deliveryFee && (
                <div className="delivery-fee-result" style={{ marginTop: 8 }}>
                  <span><i className="bi bi-geo-alt"></i> Est. delivery to {counties.find(c => c.slug === selectedCounty)?.name}</span>
                  <strong style={{ color: 'var(--primary)' }}>KSh {Number(deliveryFee.fee).toLocaleString()}</strong>
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                <i className="bi bi-info-circle"></i> Base delivery fee: KSh {Number(product.base_delivery_fee).toLocaleString()}. Final amount confirmed on contact.
              </p>
            </div>

            {/* Extra Meta */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {product.dimensions && (
                <span style={{ background: 'var(--light-gray)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                  <i className="bi bi-rulers"></i> {product.dimensions}
                </span>
              )}
              {product.materials?.map(m => (
                <span key={m.id} style={{ background: 'var(--light-gray)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                  <i className="bi bi-tree"></i> {m.name}
                </span>
              ))}
              {product.sku && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>SKU: {product.sku}</span>
              )}
            </div>
          </div>
        </div>

        {/* Product Description Tabs */}
        <div style={{ marginTop: 48 }}>
          <div style={{ borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
            <span style={{ padding: '10px 20px', borderBottom: '2px solid var(--primary)', marginBottom: -2, display: 'inline-block', fontWeight: 600, fontSize: 14 }}>
              Product Details
            </span>
          </div>
          <p style={{ lineHeight: 1.8, color: 'var(--text-body)', maxWidth: 800 }}>{product.description}</p>
        </div>

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <div className="reviews-section">
            <h3 style={{ marginBottom: 24 }}>Customer Reviews ({product.review_count})</h3>
            <div className="review-cards">
              {product.reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-stars">
                    {Array.from({ length: r.rating }).map((_, j) => <i key={j} className="bi bi-star-fill"></i>)}
                  </div>
                  {r.title && <strong style={{ display: 'block', marginBottom: 6 }}>{r.title}</strong>}
                  <p style={{ fontSize: 14 }}>{r.body}</p>
                  <div className="reviewer" style={{ marginTop: 12 }}>
                    <div className="reviewer-avatar">{r.user_name?.[0] || 'U'}</div>
                    <div>
                      <strong style={{ fontSize: 13 }}>{r.user_name || 'Customer'}</strong>
                      {r.user_location && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.user_location}</div>}
                    </div>
                    {r.is_verified_purchase && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--primary)', background: '#e8f5e9', padding: '2px 8px', borderRadius: 20 }}>
                        <i className="bi bi-check-circle"></i> Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2>Related Products</h2>
            </div>
            <div className="product-grid">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}