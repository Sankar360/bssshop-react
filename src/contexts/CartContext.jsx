// src/contexts/CartContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const CartContext = createContext({
  items: [], count: 0, loading: false,
  refresh: async () => {}, addItem: async () => {},
  updateItem: async () => {}, removeItem: async () => {},
  clearCart: async () => {},
});

export const CartProvider = ({ children }) => {
  const { loggedIn } = useAuth();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!loggedIn) {
      setItems([]);
      setCount(0);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        const payload = res.data.data || res.data;
        const raw = payload.cart_items ?? payload.items ?? [];
        setItems(raw);
        setCount(
          payload.cart_count ??
            raw.reduce((n, it) => n + (it.quantity || 0), 0),
        );
      }
    } catch (err) {
      console.warn('[Cart] refresh failed', err?.response?.status);
      setItems([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = async ({ product_id, variant_id = 0, quantity = 1 }) => {
    if (!loggedIn) throw new Error('Please log in to add items to your cart.');
    const res = await api.post('/cart/add', { product_id, variant_id, quantity });
    if (res.data.success) {
      await refresh();
      window.dispatchEvent(
        new CustomEvent('cart:updated', { detail: { count: res.data.cart_count } }),
      );
    }
    return res.data;
  };

  const updateItem = async ({ key, quantity }) => {
    const res = await api.post('/cart/update', { key, quantity });
    if (res.data.success) await refresh();
    return res.data;
  };

  const removeItem = async ({ key }) => {
    const res = await api.post('/cart/remove', { key });
    if (res.data.success) await refresh();
    return res.data;
  };

  const clearCart = async () => {
    const res = await api.post('/cart/clear');
    if (res.data.success) { setItems([]); setCount(0); }
    return res.data;
  };

  return (
    <CartContext.Provider
      value={{ items, count, loading, refresh, addItem, updateItem, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);