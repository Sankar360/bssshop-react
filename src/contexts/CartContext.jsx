// src/contexts/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../api/services/cartService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();
      if (response.data.success) {
        setCart(response.data.data);
        setCount(response.data.data.cart_count || 0);
        setSubtotal(response.data.data.subtotal || 0);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const addProduct = async (productId, quantity = 1, variantId = null) => {
    const response = await cartService.addProduct(productId, quantity, variantId);
    if (response.data.success) {
      await loadCart();
    }
    return response.data;
  };

  const updateQuantity = async (key, quantity) => {
    const response = await cartService.updateQuantity(key, quantity);
    if (response.data.success) {
      await loadCart();
    }
    return response.data;
  };

  const removeItem = async (key) => {
    const response = await cartService.removeItem(key);
    if (response.data.success) {
      await loadCart();
    }
    return response.data;
  };

  const clearCart = async () => {
    const response = await cartService.clear();
    if (response.data.success) {
      await loadCart();
    }
    return response.data;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        count,
        subtotal,
        loadCart,
        addProduct,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};