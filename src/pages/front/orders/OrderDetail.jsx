// src/pages/front/orders/OrderDetail.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { showToast } from '../../../utils/toast';
import API_URL from "../../../api/config";

const API_BASE = API_URL;
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const formatRupee = (amount) => {
    const num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatDate = (s) =>
    s
        ? new Date(s).toLocaleDateString('en-US', {
              month: 'long',
              day: '2-digit',
              year: 'numeric',
          })
        : '—';

/**
 * Build the full URL for an order item image.
 *
 * Accepts a path (bare filename or partial path) and a `source` hint:
 *   - "variant" → /storage/uploads/variants/images/<file>
 *   - "product" → /storage/uploads/products/images/<file>
 *
 * If the path is already absolute (http/https or starts with "/"), it is
 * returned unchanged so backend-provided full URLs keep working.
 */
const imageUrl = (path) => {
    if (!path) return `${API_ORIGIN}/assets/images/default-product.jpg`;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return `${API_ORIGIN}${path}`;
    if (/^storage\//i.test(path)) return `${API_ORIGIN}/${path}`;
    if (/^(uploads|assets)\//i.test(path)) return `${API_ORIGIN}/storage/${path}`;
    return `${API_ORIGIN}/storage/${path.replace(/^\/+/, '')}`;
};

const STATUS_BADGE = {
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger',
    refunded: 'secondary',
};

const PAYMENT_BADGE = {
    paid: 'success',
    failed: 'danger',
    pending: 'warning',
};

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    /* ---------------------------------------------------------- */
    /*  Fetch order detail                                          */
    /* ---------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch(`${API_BASE}/orders/view/${id}`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token || ''}`,
                    },
                });

                if (res.status === 401) {
                    navigate('/auth/login', { replace: true });
                    return;
                }

                const data = await res.json();
                if (data.success && data.data) {
                    const p = data.data;
                    setOrder(p.order || p);
                    setItems(p.items || p.order_items || []);
                } else {
                    showToast(data.message || 'Order not found', 'error');
                    setTimeout(() => navigate('/orders'), 800);
                }
            } catch (err) {
                console.error('Order detail fetch failed', err);
                showToast('Failed to load order', 'error');
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line
    }, [id, navigate]);

    /* ---------------------------------------------------------- */
    /*  Cancel order                                                */
    /* ---------------------------------------------------------- */
    const cancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        setCancelling(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/orders/cancel/${id}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
            });
            const data = await res.json();

            if (data.success) {
                showToast('Order cancelled successfully', 'success');
                // Reload the page to see updated status
                setTimeout(() => window.location.reload(), 600);
            } else {
                showToast(data.message || 'Failed to cancel order. Please try again.', 'error');
            }
        } catch (err) {
            console.error('Cancel order failed', err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setCancelling(false);
        }
    };

    /* ---------------------------------------------------------- */
    /*  Render                                                      */
    /* ---------------------------------------------------------- */
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const status = order.order_status || order.status || 'pending';
    const paymentStatus = order.payment_status || 'pending';
    const subtotal = order.subtotal ?? items.reduce((s, it) => s + (it.price * it.quantity || 0), 0);
    const shipping = order.shipping ?? 0;
    const tax = order.tax ?? 0;
    const discount = order.discount ?? 0;
    const total = order.total ?? subtotal + shipping + tax - discount;

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-lg-8 mx-auto">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-0">
                                        <i className="bi bi-receipt text-primary me-2"></i> Order #
                                        {order.order_number || order.id}
                                    </h4>
                                    <p className="text-muted mb-0 mt-2">
                                        Placed on {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <Link to="/orders" className="btn btn-outline-secondary">
                                    <i className="bi bi-arrow-left"></i> Back to Orders
                                </Link>
                            </div>
                        </div>
                        <div className="card-body">
                            {/* Order Status */}
                            <div className="order-status mb-4 p-3 bg-light rounded">
                                <div className="row align-items-center">
                                    <div className="col-md-6">
                                        <span className="text-muted">Order Status</span>
                                        <h5 className="mb-0">
                                            <span
                                                className={`badge bg-${
                                                    STATUS_BADGE[status] || 'secondary'
                                                } fs-6`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </span>
                                        </h5>
                                    </div>
                                    <div className="col-md-6 text-md-end">
                                        <span className="text-muted">Payment Status</span>
                                        <h5 className="mb-0">
                                            <span
                                                className={`badge bg-${
                                                    PAYMENT_BADGE[paymentStatus] || 'secondary'
                                                } fs-6`}
                                            >
                                                {paymentStatus.charAt(0).toUpperCase() +
                                                    paymentStatus.slice(1)}
                                            </span>
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <h6 className="fw-bold mb-3">Order Items</h6>
                            <div className="table-responsive">
                                <table className="table table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Product</th>
                                            <th className="text-center">Quantity</th>
                                            <th className="text-end">Price</th>
                                            <th className="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, i) => (
                                            <tr key={item.id ?? i}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {item.product_image && (
                                                            <img
                                                                src={imageUrl(item.product_image)}
                                                                alt={item.product_name || 'Product'}
                                                                className="me-3"
                                                                style={{
                                                                    width: 50,
                                                                    height: 50,
                                                                    objectFit: 'cover',
                                                                    borderRadius: 8,
                                                                }}
                                                                onError={(e) => {
                                                                    e.currentTarget.src = `${API_ORIGIN}/assets/images/default-product.jpg`;
                                                                }}
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="fw-bold">
                                                                {item.product_name || 'Product'}
                                                            </div>
                                                            {item.sku && (
                                                                <small className="text-muted">
                                                                    SKU: {item.sku}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    {item.quantity ?? 0}
                                                </td>
                                                <td className="text-end">
                                                    {formatRupee(item.price ?? 0)}
                                                </td>
                                                <td className="text-end fw-bold">
                                                    {formatRupee(
                                                        (item.price ?? 0) * (item.quantity ?? 0)
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3" className="text-end fw-bold">
                                                Subtotal
                                            </td>
                                            <td className="text-end">{formatRupee(subtotal)}</td>
                                        </tr>
                                        {shipping > 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-end fw-bold">
                                                    Shipping
                                                </td>
                                                <td className="text-end">
                                                    {formatRupee(shipping)}
                                                </td>
                                            </tr>
                                        )}
                                        {tax > 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-end fw-bold">
                                                    Tax
                                                </td>
                                                <td className="text-end">{formatRupee(tax)}</td>
                                            </tr>
                                        )}
                                        {discount > 0 && (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="text-end fw-bold text-success"
                                                >
                                                    Discount
                                                </td>
                                                <td className="text-end text-success">
                                                    -{formatRupee(discount)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="table-primary">
                                            <td colSpan="3" className="text-end fw-bold fs-5">
                                                Total
                                            </td>
                                            <td className="text-end fw-bold fs-5">
                                                {formatRupee(total)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Shipping Information */}
                            {order.shipping_address && (
                                <div className="row mt-4">
                                    <div className="col-md-6">
                                        <h6 className="fw-bold">Shipping Address</h6>
                                        <p className="mb-0">
                                            {typeof order.shipping_address === 'string'
                                                ? order.shipping_address
                                                : Object.values(order.shipping_address).filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="fw-bold">Billing Address</h6>
                                        <p className="mb-0">
                                            {typeof (order.billing_address || order.shipping_address) ===
                                            'string'
                                                ? order.billing_address || order.shipping_address
                                                : Object.values(
                                                      order.billing_address ||
                                                          order.shipping_address
                                                  )
                                                      .filter(Boolean)
                                                      .join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 pt-3 border-top">
                                <div className="d-flex gap-2">
                                    <Link to="/orders" className="btn btn-outline-secondary">
                                        <i className="bi bi-arrow-left"></i> Back to Orders
                                    </Link>
                                    {(status === 'pending' || status === 'processing') && (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={cancelOrder}
                                            disabled={cancelling}
                                        >
                                            {cancelling ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Cancelling...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-x-circle"></i> Cancel Order
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;