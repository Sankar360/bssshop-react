// src/pages/front/cart/Cart.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from "../../../api/config";
import { showToast } from '../../../utils/toast';
import { useCart } from '../../../contexts/CartContext';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const imageUrl = (input) => {
    if (input && typeof input === "object") {
        if (input.image_url) return imageUrl(input.image_url);
        if (input.image) return imageUrl(input.image);
    }
    const path = String(input ?? "").trim();
    if (!path) return "/assets/images/default-product.jpg";
    if (/^https?:\/\//i.test(path)) return path;

    const clean = path.replace(/^\/+/, "");
    if (/^storage\//i.test(clean)) return `${API_ORIGIN}/${clean}`;
    if (/^(uploads|assets)\//i.test(clean)) return `${API_ORIGIN}/storage/${clean}`;
    return `${API_ORIGIN}/storage/${clean}`;
};

const Cart = () => {
    const {
        items: cartItems,
        count: cartCount,
        loading,
        refresh: refreshCart,
        updateItem,
        removeItem,
    } = useCart();

    // Ask the server for fresh data when the page mounts
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    /* ---------- Derived totals (no separate /cart call needed) ---------- */
    const subtotal = cartItems.reduce(
        (n, it) => n + Number(it.price) * Number(it.quantity),
        0
    );
    const tax = Math.round(subtotal * 0.10 * 100) / 100;
    const shipping = subtotal > 100 ? 0 : 10;
    const total = subtotal + tax + shipping;

    /* ---------- Handlers ---------- */
    const updateCartQuantity = async (key, quantity) => {
        try {
            const res = await updateItem({ key, quantity });
            if (!res.success) {
                showToast(res.message || 'Failed to update cart', 'error');
            }
            // No fetchCart() needed — CartContext already refreshed
        } catch {
            showToast('Error updating cart', 'error');
        }
    };

    const updateCartItem = (key, change) => {
        const item = cartItems.find((i) => i.key === key);
        if (!item) return;
        let qty = (parseInt(item.quantity, 10) || 1) + change;
        if (qty < 1) qty = 1;
        if (item.stock && qty > item.stock) qty = item.stock;
        updateCartQuantity(key, qty);
    };

    const handleQuantityInput = (key, e) => {
        const quantity = parseInt(e.target.value, 10) || 1;
        updateCartQuantity(key, quantity);
    };

    const removeFromCart = async (key) => {
        if (!key) return;
        if (!window.confirm('Are you sure you want to remove this item?')) return;
        try {
            const res = await removeItem({ key });
            if (!res.success) {
                showToast(res.message || 'Failed to remove item', 'error');
            }
        } catch {
            showToast('Error removing item', 'error');
        }
    };

    /* ---------- Render helper ---------- */
    const renderVariantFeatures = (item, className) => {
        if (!item.is_variant || !item.variant_features_list?.length) return null;
        return (
            <div className={className}>
                {Object.entries(item.variant_features || {}).map(([name, value], i) => {
                    const isColor = name.toLowerCase() === 'color';
                    const isHex = /^#[0-9A-Fa-f]{6}$/.test(String(value).trim());
                    return (
                        <span className="variant-feature-item" key={i}>
                            {isColor && isHex ? (
                                <span className="variant-feature-color"
                                      style={{ backgroundColor: value }}
                                      title={value}></span>
                            ) : (
                                <span className="variant-feature-value">{value}</span>
                            )}
                        </span>
                    );
                })}
            </div>
        );
    };

    /* ============================================================ */
    /*  RENDER                                                       */
    /* ============================================================ */
    return (
        <div className="cart-page">
            <div className="container">
                {/* ===== HEADER ===== */}
                <div className="cart-header">
                    <div className="cart-header-left">
                        <h1 className="cart-title">Shopping Cart</h1>
                        <p className="cart-subtitle">Review your items before checkout.</p>
                    </div>
                    {cartCount > 0 && (
                        <div className="cart-header-right">
                            <span className="cart-item-count">
                                {cartCount} items
                            </span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : cartItems.length > 0 ? (
                    <div className="cart-card">
                        {/* Desktop Table */}
                        <div className="cart-table-wrapper d-none d-md-block">
                            <table className="cart-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item) => (
                                        <tr key={item.key}>
                                            <td>
                                                <div className="cart-product">
                                                    <Link to={`/product/${item.slug}`}
                                                          className="cart-product-image-link">
                                                        <img src={imageUrl(item)}
                                                             alt={item.name}
                                                             className="cart-product-image" />
                                                    </Link>
                                                    <div className="cart-product-info">
                                                        <Link to={`/product/${item.slug}`}
                                                              className="cart-product-name-link">
                                                            <div className="cart-product-name">
                                                                {item.name}
                                                            </div>
                                                        </Link>
                                                        {renderVariantFeatures(
                                                            item,
                                                            'cart-product-variant-features'
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="quantity-selector">
                                                    <button type="button"
                                                            className="qty-btn qty-minus"
                                                            onClick={() => updateCartItem(item.key, -1)}>
                                                        <i className="bi bi-dash"></i>
                                                    </button>
                                                    <input type="number"
                                                           className="qty-input cart-quantity"
                                                           value={item.quantity}
                                                           min="1"
                                                           max={item.stock}
                                                           onChange={(e) => handleQuantityInput(item.key, e)} />
                                                    <button type="button"
                                                            className="qty-btn qty-plus"
                                                            onClick={() => updateCartItem(item.key, 1)}>
                                                        <i className="bi bi-plus"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="cart-price">
                                                ₹{Number(item.price).toFixed(2)}
                                            </td>
                                            <td className="cart-subtotal">
                                                ₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                            </td>
                                            <td>
                                                <button type="button"
                                                        className="cart-remove-btn remove-from-cart"
                                                        onClick={() => removeFromCart(item.key)}>
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="cart-mobile d-md-none">
                            {cartItems.map((item) => (
                                <div className="cart-mobile-card" key={item.key}>
                                    <div className="cart-mobile-top">
                                        <Link to={`/product/${item.slug}`}
                                              className="cart-mobile-image-link">
                                            <img src={imageUrl(item)}
                                                 alt={item.name}
                                                 className="cart-mobile-image" />
                                        </Link>
                                        <div className="cart-mobile-info">
                                            <Link to={`/product/${item.slug}`}
                                                  className="cart-mobile-name-link">
                                                <div className="cart-mobile-name">{item.name}</div>
                                            </Link>
                                            {renderVariantFeatures(item, 'cart-mobile-variant-features')}
                                            <div className="cart-mobile-price">
                                                ₹{Number(item.price).toFixed(2)}
                                            </div>
                                        </div>
                                        <button type="button"
                                                className="cart-remove-btn cart-mobile-remove remove-from-cart"
                                                onClick={() => removeFromCart(item.key)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                    <div className="cart-mobile-bottom">
                                        <div className="quantity-selector">
                                            <button type="button"
                                                    className="qty-btn qty-minus"
                                                    onClick={() => updateCartItem(item.key, -1)}>
                                                <i className="bi bi-dash"></i>
                                            </button>
                                            <input type="number"
                                                   className="qty-input cart-quantity"
                                                   value={item.quantity}
                                                   min="1"
                                                   max={item.stock}
                                                   onChange={(e) => handleQuantityInput(item.key, e)} />
                                            <button type="button"
                                                    className="qty-btn qty-plus"
                                                    onClick={() => updateCartItem(item.key, 1)}>
                                                <i className="bi bi-plus"></i>
                                            </button>
                                        </div>
                                        <div className="cart-mobile-subtotal">
                                            <span className="cart-mobile-subtotal-label">Subtotal</span>
                                            <span className="cart-mobile-subtotal-value">
                                                ₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ===== CART SUMMARY ===== */}
                        <div className="cart-summary">
                            <div className="cart-summary-row">
                                <span className="cart-summary-label">Subtotal</span>
                                <span className="cart-summary-value">
                                    ₹{subtotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="cart-summary-row">
                                <span className="cart-summary-label">Shipping</span>
                                <span className="cart-summary-value">
                                    ₹{shipping.toFixed(2)}
                                </span>
                            </div>
                            <div className="cart-summary-row">
                                <span className="cart-summary-label">Tax (10%)</span>
                                <span className="cart-summary-value">
                                    ₹{tax.toFixed(2)}
                                </span>
                            </div>
                            <div className="cart-summary-total">
                                <span className="cart-summary-total-label">Total</span>
                                <span className="cart-summary-total-value">
                                    ₹{total.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* ===== ACTION BUTTONS ===== */}
                        <div className="cart-actions">
                            <Link to="/category" className="btn-continue">
                                <i className="bi bi-arrow-left"></i> Continue Shopping
                            </Link>
                            <Link to="/checkout" className="btn-checkout">
                                <i className="bi bi-credit-card"></i> Proceed to Checkout
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">
                            <i className="bi bi-cart"></i>
                        </div>
                        <h2 className="empty-cart-title">Your cart is empty</h2>
                        <p className="empty-cart-subtitle">
                            Start shopping to add items to your cart.
                        </p>
                        <Link to="/category" className="btn-empty-shop">
                            <i className="bi bi-shop"></i> Continue Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;