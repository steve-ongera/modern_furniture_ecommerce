import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useWishlist } from '../context/AppContext.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import { Breadcrumb, EmptyState } from '../components/common/ProtectedRoute.jsx';

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <>
      <Helmet>
        <title>My Wishlist | Morara Modern Furniture</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container">
        <Breadcrumb items={[{ label: 'Wishlist' }]} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1>My Wishlist <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>({wishlist.length} items)</span></h1>
          {wishlist.length > 0 && (
            <Link to="/shop" className="btn btn-outline btn-sm">
              <i className="bi bi-plus"></i> Add More
            </Link>
          )}
        </div>

        {wishlist.length === 0 ? (
          <EmptyState
            icon="bi-heart"
            title="Your wishlist is empty"
            message="Save items you love and revisit them anytime"
          >
            <Link to="/shop" className="btn btn-primary">
              <i className="bi bi-shop"></i> Browse Products
            </Link>
          </EmptyState>
        ) : (
          <div className="product-grid">
            {wishlist.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}