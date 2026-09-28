// src/pages/front/checkout/Success.jsx
import React, { useEffect, useState } from 'react';
import API_URL from "../../../api/config";
import { Link } from 'react-router-dom';

const API_BASE = API_URL;

const imageUrl = (path) => {
    if (!path) return '/assets/images/default-product.jpg';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return path;
    if (/^storage\//i.test(path)) return `/${path}`;
    if (/^(uploads|assets)\//i.test(path)) return `/${path}`;
    return `/storage/${path.replace(/^\/+/, '')}`;
};

const formatDate = (s) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '';

const Success = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch(`${API_BASE}/checkout/success`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token || ''}`,
                    },
                });
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (err) {
                console.error('Success fetch failed', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { order, items, subtotal, tax, tax_rate, shipping, total } = data;

    return (
        <div className="success-page">
            <div className="container">
                {/* Success Header */}
                <div className="success-header">
                    <div className="success-icon">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <h1 className="success-title">Order Placed Successfully!</h1>
                    <p className="success-subtitle">
                        Thank you for your order. We'll notify you when it ships.
                    </p>
                </div>

                {/* Order Details */}
                <div className="order-details-card">
                    <div className="order-details-header">
                        <div>
                            <h5 className="order-number">Order #{order.order_number || ''}</h5>
                            <span className="order-date">Placed on {formatDate(order.created_at)}</span>
                        </div>
                        <span className={`order-status ${(order.order_status || 'pending').toLowerCase()}`}>
                            {(order.order_status || 'Pending').charAt(0).toUpperCase() + (order.order_status || 'pending').slice(1)}
                        </span>
                    </div>

                    <div className="order-items">
                        {items.map((item, i) => {
                            const product = item.product || {};
                            const variant = item.variant;
                            const displayPrice = item.price;
                            let originalPrice = null;
                            if (item.is_variant && variant) {
                                if (variant.sale_price > 0 && variant.sale_price < variant.price) {
                                    originalPrice = variant.price;
                                }
                            } else if (product) {
                                if (product.sale_price > 0 && product.sale_price < product.price) {
                                    originalPrice = product.price;
                                }
                            }
                            return (
                                <div className="order-item" key={i}>
                                    <div className="order-item-image">
                                        <img src={imageUrl(item.image)} alt={product.name || 'Product'} />
                                    </div>
                                    <div className="order-item-details">
                                        <div className="order-item-name">{product.name || 'Product'}</div>
                                        {item.is_variant && item.variant_features_list?.length > 0 && (
                                            <div className="order-item-variant">
                                                {Object.entries(item.variant_features || {}).map(([name, value], j) => {
                                                    const isColor = name.toLowerCase() === 'color';
                                                    const isHex = /^#[0-9A-Fa-f]{6}$/.test(String(value).trim());
                                                    return (
                                                        <span className="variant-feature" key={j}>
                                                            {isColor && isHex ? (
                                                                <span className="variant-color-dot"
                                                                    style={{ backgroundColor: value }}
                                                                    title={value}></span>
                                                            ) : value}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="order-item-meta">
                                            <span className="order-item-qty">Qty: {item.quantity}</span>
                                            <span className="order-item-price">
                                                {originalPrice ? (
                                                    <>
                                                        <span className="original-price">₹{Number(originalPrice).toFixed(2)}</span>
                                                        <span className="sale-price">₹{Number(displayPrice).toFixed(2)}</span>
                                                    </>
                                                ) : (
                                                    <>₹{Number(displayPrice).toFixed(2)}</>
                                                )}
                                            </span>
                                            <span className="order-item-subtotal">
                                                {originalPrice ? (
                                                    <>
                                                        <span className="original-price">₹{Number(originalPrice * item.quantity).toFixed(2)}</span>
                                                        <span className="sale-price">₹{Number(displayPrice * item.quantity).toFixed(2)}</span>
                                                    </>
                                                ) : (
                                                    <>₹{Number(displayPrice * item.quantity).toFixed(2)}</>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="order-summary">
                        <div className="order-summary-row">
                            <span>Subtotal ({items.length} items)</span>
                            <span>₹{Number(subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="order-summary-row">
                            <span>Tax ({tax_rate || 10}%)</span>
                            <span>₹{Number(tax || 0).toFixed(2)}</span>
                        </div>
                        <div className="order-summary-row">
                            <span>Shipping</span>
                            <span>{shipping > 0 ? `₹${Number(shipping).toFixed(2)}` : 'Free'}</span>
                        </div>
                        <div className="order-summary-total">
                            <span>Total</span>
                            <span>₹{Number(total || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="order-actions">
                        <Link to="/" className="btn-continue">
                            <i className="bi bi-shop"></i> Continue Shopping
                        </Link>
                        <Link to="/orders" className="btn-orders">
                            <i className="bi bi-list-ul"></i> My Orders
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Success;