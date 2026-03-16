import { Link } from 'react-router-dom';
import { useCart, useWishlist } from '../../context/AppContext.jsx';

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f1ede8" width="400" height="300"/%3E%3Ctext fill="%23ccc" font-family="sans-serif" font-size="48" text-anchor="middle" dominant-baseline="middle" x="200" y="150"%3E🛋%3C/text%3E%3C/svg%3E';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const inWishlist = isInWishlist(product.id);

  return (
    <div className="product-card">
      <div className="product-card-img">
        <Link to={`/products/${product.slug}`}>
          <img
            src={product.primary_image || PLACEHOLDER}
            alt={product.name}
            loading="lazy"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />
        </Link>

        {/* Badges */}
        {!product.is_in_stock ? (
          <span className="product-badge badge-sold-out">Sold Out</span>
        ) : product.discount_percentage > 0 ? (
          <span className="product-badge badge-sale">-{product.discount_percentage}%</span>
        ) : product.is_new_arrival ? (
          <span className="product-badge badge-new">New</span>
        ) : product.is_best_seller ? (
          <span className="product-badge badge-bestseller">Best Seller</span>
        ) : null}

        {/* Action buttons */}
        <div className="product-card-actions">
          <button
            className={`product-action-btn ${inWishlist ? 'active' : ''}`}
            onClick={() => toggleWishlist(product)}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <i className={`bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'}`}></i>
          </button>
          <Link to={`/products/${product.slug}`} className="product-action-btn" title="Quick view">
            <i className="bi bi-eye"></i>
          </Link>
        </div>
      </div>

      <div className="product-card-body">
        <span className="product-card-cat">{product.category_name}</span>
        <Link to={`/products/${product.slug}`} className="product-card-name">
          {product.name}
        </Link>

        <div className="product-price">
          <span className="price-current">
            KSh {Number(product.effective_price).toLocaleString()}
          </span>
          {product.sale_price && (
            <span className="price-old">KSh {Number(product.price).toLocaleString()}</span>
          )}
          {product.discount_percentage > 0 && (
            <span className="price-discount">-{product.discount_percentage}%</span>
          )}
        </div>

        <div className="product-card-meta">
          {product.average_rating > 0 && (
            <div className="product-rating">
              <i className="bi bi-star-fill"></i>
              <strong>{Number(product.average_rating).toFixed(1)}</strong>
              <span>({product.review_count})</span>
            </div>
          )}
          {product.payment_type === 'half' && (
            <span className="payment-badge half">50% Deposit</span>
          )}
        </div>
      </div>

      <div className="product-card-footer">
        <button
          className={`add-to-cart-btn ${!product.is_in_stock ? 'out-of-stock' : ''}`}
          onClick={() => addToCart(product.id)}
          disabled={!product.is_in_stock}
        >
          <i className={`bi ${product.is_in_stock ? 'bi-bag-plus' : 'bi-x-circle'}`}></i>
          {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}