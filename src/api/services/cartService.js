// src/api/services/cartService.js
import api from '../axios';

export const cartService = {
  // Get cart
  getCart: () => api.get('/cart'),
  
  // Get items
  getItems: () => api.get('/cart/items'),
  
  // Get summary
  getSummary: () => api.get('/cart/summary'),
  
  // Check if has items
  hasItems: () => api.get('/cart/has-items'),
  
  // Add product
  addProduct: (productId, quantity = 1, variantId = null) =>
    api.post('/cart/add', { product_id: productId, quantity, variant_id: variantId }),
  
  // Update quantity
  updateQuantity: (key, quantity) =>
    api.post('/cart/update', { key, quantity }),
  
  // Remove item
  removeItem: (key) => api.post('/cart/remove', { key }),
  
  // Clear cart
  clear: () => api.post('/cart/clear'),
  
  // Apply coupon
  applyCoupon: (code) => api.post('/cart/apply-coupon', { coupon_code: code }),
  
  // Remove coupon
  removeCoupon: () => api.post('/cart/remove-coupon'),
  
  // Move from wishlist
  moveFromWishlist: (productId, variantId = null, quantity = 1) =>
    api.post('/cart/move-from-wishlist', { product_id: productId, variant_id: variantId, quantity }),
};