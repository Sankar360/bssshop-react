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

  /* 🆕 Listen for wishlist:updated from utils/wishlist.js and other places */
  useEffect(() => {

      let debounceTimer = null;


    const handler = (e) => {
      // If the event carries a count, use it directly (fast)
      if (typeof e.detail?.count === 'number') {
        setCount(e.detail.count);
      }
      // Debounce the refresh — only run once even if multiple events fire
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refresh();
        debounceTimer = null;
      }, 400); 
    };
    window.addEventListener('wishlist:updated', handler);
    return () => {
      window.removeEventListener('wishlist:updated', handler);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [refresh]);

  const isWishlisted = (productId, variantId = 0) =>
    items.some(
      (i) =>
        i.product_id === productId &&
        (i.variant_id || 0) === (variantId || 0),
    );

  const toggle = async ({ product_id, variant_id = 0 }) => {
    if (!loggedIn) throw new Error('Please log in to use your wishlist.');

    const normalizedVariantId =
    Number(variant_id) > 0 ? Number(variant_id) : null;

    const res = await api.post('/wishlist/toggle', {
      product_id,
      variant_id: normalizedVariantId,
    });

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
        return active ? [...filtered, { product_id, variant_id: normalizedVariantId }] : filtered;
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