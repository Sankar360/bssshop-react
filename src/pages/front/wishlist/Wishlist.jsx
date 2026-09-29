// src/pages/front/wishlist/Wishlist.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useWishlist } from '../../../contexts/WishlistContext';
import { useCart } from '../../../contexts/CartContext';
import { showToast } from '../../../utils/toast';

import API_URL from '../../../api/config';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const imageUrl = (input) => {
  if (input && typeof input === 'object') {
    if (input.image_url) return input.image_url;
    if (input.variant_image_url) return input.variant_image_url;
    if (input.image) return imageUrl(input.image);
    if (input.variant_image) return imageUrl(input.variant_image);
    return `${API_ORIGIN}/assets/images/default-product.jpg`;
  }
  const path = String(input || '').trim();
  if (!path) return `${API_ORIGIN}/assets/images/default-product.jpg`;
  if (/^https?:\/\//i.test(path)) return path;

  const clean = path.replace(/^\/+/, '');
  if (/^storage\//i.test(clean)) return `${API_ORIGIN}/${clean}`;
  return `${API_ORIGIN}/storage/${clean}`;
};

const Wishlist = () => {
  const navigate = useNavigate();
  const { loggedIn, isAdmin } = useAuth();
  const { items: wl, refresh, toggle } = useWishlist();
  const { addItem } = useCart();
  const [fullItems, setFullItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch detailed wishlist (products enriched) via axios — token auto-attached
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!loggedIn) {
        navigate('/auth/login', { state: { from: { pathname: '/wishlist' } } });
        return;
      }
      try {
        const { default: api } = await import('../../../api/axios');
        const res = await api.get('/wishlist');
        if (!cancelled && res.data?.success) {
          const payload = res.data.data || res.data;
          setFullItems(
            payload.items ?? payload.wishlist_items ?? payload.wishlist ?? [],
          );
        }
      } catch {
        if (!cancelled) setFullItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, isAdmin, navigate]);

  const removeFromWishlist = async (productId, variantId = 0) => {
    if (!window.confirm('Remove this item from your wishlist?')) return;
    try {
      await toggle({ product_id: productId, variant_id: variantId });
      setFullItems((prev) =>
        prev.filter(
          (i) =>
            !(
              i.product_id === productId &&
              (i.variant_id || 0) === (variantId || 0)
            ),
        ),
      );
      showToast('Item removed from wishlist', 'info');
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  const clearWishlist = async () => {
    if (!window.confirm('Clear your entire wishlist?')) return;
    try {
      const { default: api } = await import('../../../api/axios');
      await api.post('/wishlist/clear');
      setFullItems([]);
      await refresh();
      showToast('Wishlist cleared', 'info');
    } catch {
      showToast('Failed to clear wishlist', 'error');
    }
  };

  const addToCartFromWishlist = async (productId, variantId = 0) => {
    try {
      const res = await addItem({
        product_id: productId,
        variant_id: variantId || 0,
        quantity: 1,
      });
      if (res?.success) showToast('✓ Added to cart!', 'success');
      else showToast(res?.message || 'Failed to add to cart.', 'error');
    } catch (err) {
      showToast(err?.message || 'Failed to add to cart.', 'error');
    }
  };

  /* ---- render (unchanged from your existing JSX) ---- */
  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="mb-2">
            <i className="bi bi-heart-fill text-danger"></i> My Wishlist
          </h1>
          <p className="text-muted">Your favorite products saved for later</p>
        </div>
        <div className="col-md-4 text-end">
          {fullItems.length > 0 && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={clearWishlist}
            >
              <i className="bi bi-trash"></i> Clear All
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : fullItems.length > 0 ? (
        <div className="row">
          {fullItems.map((item, idx) => {
            const price =
              item.variant_sale_price ??
              item.variant_price ??
              item.sale_price ??
              item.price;
            const stock = item.variant_stock ?? item.stock ?? 0;
            const variantId = item.variant_id ?? 0;
            const productId = item.product_id;
            const key = `${productId}-${variantId}`;

            return (
              <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={key + idx}>
                <div className="card wishlist-card h-100 shadow-sm">
                  <div className="position-relative">
                    <Link to={`/product/${item.slug}`}>
                      <img
                        src={imageUrl(item)}
                        className="card-img-top wishlist-product-image"
                        alt={item.name}
                      />
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm wishlist-remove-btn wishlist-remove-btn-x"
                      onClick={() => removeFromWishlist(productId, variantId)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                    {stock > 0 ? (
                      <span className="badge bg-success position-absolute top-0 start-0 m-2">
                        <i className="bi bi-check-circle"></i> In Stock
                      </span>
                    ) : (
                      <span className="badge bg-danger position-absolute top-0 start-0 m-2">
                        <i className="bi bi-x-circle"></i> Out of Stock
                      </span>
                    )}
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">
                      <Link
                        to={`/product/${item.slug}`}
                        className="text-decoration-none text-dark"
                      >
                        {item.name}
                      </Link>
                    </h5>
                    <p className="card-text">
                      <span className="fw-bold text-primary fs-5">
                        ₹{Number(price).toFixed(2)}
                      </span>
                    </p>
                    <div className="d-grid gap-2">
                      {stock > 0 ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() =>
                            addToCartFromWishlist(productId, variantId)
                          }
                        >
                          <i className="bi bi-cart-plus"></i> Add to Cart
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled
                        >
                          <i className="bi bi-x-circle"></i> Out of Stock
                        </button>
                      )}
                      <Link
                        to={`/product/${item.slug}`}
                        className="btn btn-outline-secondary"
                      >
                        <i className="bi bi-eye"></i> View Product
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="row">
          <div className="col-md-8 mx-auto">
            <div className="card text-center py-5 whtcrd">
              <div className="card-body">
                <i className="bi bi-heart whtred" style={{ fontSize: '4rem' }} />
                <h3 className="mt-3">Your wishlist is empty</h3>
                <p>Start adding your favorite products to your wishlist!</p>
                <Link to="/" className="btn btn-primary btn-lg">
                  <i className="bi bi-shop"></i> Start Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;