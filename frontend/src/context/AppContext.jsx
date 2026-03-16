import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, cartAPI, wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

// ─── Auth Context ──────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.getProfile()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// ─── Cart Context ──────────────────────────────────────────────────────────
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      setCartLoading(true);
      const res = await cartAPI.get();
      setCart(res.data);
    } catch (err) {
      console.error('Cart fetch error:', err);
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, variantId = null, quantity = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }
    try {
      const res = await cartAPI.add({ product_id: productId, variant_id: variantId, quantity });
      setCart(res.data);
      toast.success('Added to cart!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
      return false;
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      const res = await cartAPI.updateItem({ item_id: itemId, quantity });
      setCart(res.data);
    } catch (err) {
      toast.error('Failed to update cart');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await cartAPI.removeItem({ item_id: itemId });
      setCart(res.data);
      toast.success('Item removed');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart({ items: [], total: 0, item_count: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CartContext.Provider value={{ cart, cartLoading, addToCart, updateItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

// ─── Wishlist Context ──────────────────────────────────────────────────────
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      wishlistAPI.get()
        .then(res => setWishlist(res.data.products || []))
        .catch(() => {});
    } else {
      setWishlist([]);
    }
  }, [user]);

  const toggleWishlist = async (product) => {
    if (!user) { toast.error('Please login first'); return; }
    const isIn = wishlist.some(p => p.id === product.id);
    try {
      if (isIn) {
        await wishlistAPI.remove(product.id);
        setWishlist(prev => prev.filter(p => p.id !== product.id));
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product.id);
        setWishlist(prev => [...prev, product]);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const isInWishlist = (productId) => wishlist.some(p => p.id === productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);