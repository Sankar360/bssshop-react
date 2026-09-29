// src/contexts/CartContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const CartContext = createContext({
  items: [],
  count: 0,
  loading: false,
  refresh: async () => {},
  addItem: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
});

export const CartProvider = ({ children }) => {
  const { loggedIn, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!loggedIn || isAdmin) {
      setItems([]);
      setCount(0);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        const payload = res.data.data || res.data;
        const raw = payload.items ?? payload.cart_items ?? [];
        setItems(raw);
        setCount(
          payload.count ??
            raw.reduce((n, it) => n + (it.quantity || 0), 0),
        );
      }
    } catch (err) {
      console.warn('[Cart] refresh failed', err?.response?.status);
    } finally {
      setLoading(false);
    }
  }, [loggedIn, isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async ({ product_id, variant_id = 0, quantity = 1 }) => {
    const res = await api.post('/cart/add', {
      product_id,
      variant_id,
      quantity,
    });
    if (res.data.success) {
      await refresh();
      window.dispatchEvent(
        new CustomEvent('cart:updated', { detail: { count: res.data.count } }),
      );
    }
    return res.data;
  };

  const updateItem = async ({ cart_item_id, quantity }) => {
    const res = await api.put('/cart/update', { cart_item_id, quantity });
    if (res.data.success) await refresh();
    return res.data;
  };

  const removeItem = async ({ cart_item_id }) => {
    const res = await api.delete(`/cart/remove/${cart_item_id}`);
    if (res.data.success) await refresh();
    return res.data;
  };

  const clearCart = async () => {
    const res = await api.post('/cart/clear');
    if (res.data.success) {
      setItems([]);
      setCount(0);
    }
    return res.data;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        loading,
        refresh,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);