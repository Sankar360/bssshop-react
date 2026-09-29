// src/contexts/WishlistContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const WishlistContext = createContext({
  items: [],
  count: 0,
  isWishlisted: () => false,
  toggle: async () => {},
  refresh: async () => {},
});

export const WishlistProvider = ({ children }) => {
  const { loggedIn } = useAuth();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!loggedIn) {
      setItems([]);
      setCount(0);
      return;
    }
    try {
      const res = await api.get('/wishlist');
      if (res.data.success) {
        const payload = res.data.data || res.data;
        const raw = payload.items ?? payload.pairs ?? [];
        setItems(
          raw.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id ?? 0,
          })),
        );
        setCount(payload.count ?? raw.length);
      }
    } catch (err) {
      console.warn('[Wishlist] refresh failed', err?.response?.status);
      setItems([]);
      setCount(0);
    }
  }, [loggedIn]);

  useEffect(() => { refresh(); }, [refresh]);

  const isWishlisted = (productId, variantId = 0) =>
    items.some(
      (i) =>
        i.product_id === productId &&
        (i.variant_id || 0) === (variantId || 0),
    );

  const toggle = async ({ product_id, variant_id = 0 }) => {
    if (!loggedIn) throw new Error('Please log in to use your wishlist.');
    const res = await api.post('/wishlist/toggle', { product_id, variant_id });
    if (res.data.success) {
      const active = res.data.action === 'added';
      setItems((prev) => {
        const filtered = prev.filter(
          (i) =>
            !(
              i.product_id === product_id &&
              (i.variant_id || 0) === (variant_id || 0)
            ),
        );
        return active ? [...filtered, { product_id, variant_id }] : filtered;
      });
      setCount(res.data.count ?? 0);
      window.dispatchEvent(
        new CustomEvent('wishlist:updated', {
          detail: { count: res.data.count ?? 0 },
        }),
      );
    }
    return res.data;
  };

  return (
    <WishlistContext.Provider value={{ items, count, isWishlisted, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);