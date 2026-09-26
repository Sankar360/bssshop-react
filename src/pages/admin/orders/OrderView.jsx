// src/pages/admin/orders/OrderView.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Eye, ArrowLeft, Printer, Trash, Receipt, BoxSeam, ChatDots, Person,
    GeoAlt, ArrowRepeat, ClockHistory, Lightning, List, Envelope, Phone, Box,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const formatDateTime = (s) =>
    s
        ? new Date(s).toLocaleString('en-US', {
              month: 'long',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

const statusBadge = (status) => {
    if (status === 'completed' || status === 'delivered') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'cancelled') return 'danger';
    if (status === 'shipped') return 'primary';
    if (status === 'refunded') return 'secondary';
    return 'info';
};

const paymentBadge = (status) => {
    if (status === 'paid') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'refunded' || status === 'partially_refunded') return 'secondary';
    return 'danger';
};

// ✅ Match your DB enum — verify with:
//    SHOW COLUMNS FROM orders LIKE 'order_status';
const ORDER_STATUSES = [
    'pending',
    'processing',
    'completed',
    'cancelled',
    'refunded',
];

// ✅ Match your DB enum — verify with:
//    SHOW COLUMNS FROM orders LIKE 'payment_status';
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const imageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const clean = String(path).replace(/^\/+/, '').replace(/^storage\//i, '');
    return `/storage/${clean}`;
};

const OrderView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [user, setUser] = useState({});
    const [shippingAddress, setShippingAddress] = useState({});
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [selectedPayment, setSelectedPayment] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/orders/view/${id}`, {
                    headers: authHeaders(false),
                });

                if (res.status === 401) {
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_user');
                    showToast('Session expired. Please log in again.', 'error');
                    setTimeout(() => navigate('/admin/login', { replace: true }), 600);
                    return;
                }

                if (!res.ok) {
                    showToast('Order not found', 'error');
                    setTimeout(() => navigate('/admin/orders'), 800);
                    return;
                }

                const data = await res.json();

                if (data.success && data.data) {
                    const p = data.data;
                    const o = p.order || p;
                    setOrder(o);
                    setItems(p.items || []);
                    setUser(p.user || {});
                    setShippingAddress(p.shipping_address || {});
                    setSelectedStatus(o.order_status || 'pending');
                    setSelectedPayment(o.payment_status || 'pending');
                } else {
                    showToast(data.message || 'Order not found', 'error');
                    setTimeout(() => navigate('/admin/orders'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load order', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/orders/update-status/${id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    order_status: selectedStatus,
                    payment_status: selectedPayment,
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Order status updated', 'success');
                setOrder((o) => ({
                    ...o,
                    order_status: selectedStatus,
                    payment_status: selectedPayment,
                }));
            } else {
                showToast(data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (
            !window.confirm(
                'Are you sure you want to delete this order? This cannot be undone.'
            )
        )
            return;
        try {
            const res = await fetch(`${API_BASE}/orders/delete/${id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Order deleted successfully', 'success');
                setTimeout(() => navigate('/admin/orders'), 600);
            } else {
                showToast(data.message || 'Failed to delete order', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

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

    return (
        <>
            <style>{`
                .timeline { position: relative; padding-left: 30px; }
                .timeline-item {
                    position: relative; padding-bottom: 20px; padding-left: 15px;
                    border-left: 2px solid #e3e6f0;
                }
                .timeline-item:last-child { border-left: none; padding-bottom: 0; }
                .timeline-marker {
                    position: absolute; left: -8px; top: 0;
                    width: 14px; height: 14px; border-radius: 50%;
                    border: 2px solid #fff; box-shadow: 0 0 0 2px #e3e6f0;
                }
                .timeline-content h6 { font-size: .9rem; font-weight: 600; }
                @media print {
                    .btn, .btn-group, .no-print { display: none !important; }
                    .card { border: 1px solid #ddd !important; box-shadow: none !important; }
                    body { background: white !important; }
                }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Eye className="text-primary me-2" /> Order Details
                </h2>
                <div>
                    <Link to="/admin/orders" className="btn btn-secondary">
                        <ArrowLeft className="me-1" /> Back to Orders
                    </Link>
                    <button
                        type="button"
                        className="btn btn-outline-primary ms-2"
                        onClick={() => window.print()}
                    >
                        <Printer className="me-1" /> Print
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-danger ms-2"
                        onClick={handleDelete}
                    >
                        <Trash className="me-1" /> Delete
                    </button>
                </div>
            </div>

            <div className="row">
                {/* Main Column */}
                <div className="col-md-8">
                    {/* Order Header */}
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <Receipt className="me-1" /> Order #{order.order_number}
                            </h5>
                            <div>
                                <span className={`badge bg-${statusBadge(order.order_status)}`}>
                                    {order.order_status
                                        ? order.order_status.charAt(0).toUpperCase() +
                                          order.order_status.slice(1)
                                        : '—'}
                                </span>
                                <span
                                    className={`badge bg-${paymentBadge(
                                        order.payment_status
                                    )} ms-1`}
                                >
                                    {order.payment_status
                                        ? order.payment_status.charAt(0).toUpperCase() +
                                          order.payment_status.slice(1)
                                        : '—'}
                                </span>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <table className="table table-borderless table-sm">
                                        <tbody>
                                            <tr>
                                                <td className="fw-bold text-muted">Order Date:</td>
                                                <td>{formatDateTime(order.created_at)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold text-muted">Last Updated:</td>
                                                <td>{formatDateTime(order.updated_at)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold text-muted">Payment Method:</td>
                                                <td>{order.payment_method_display || 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold text-muted">Transaction ID:</td>
                                                <td>
                                                    {order.razorpay_payment_id ||
                                                        order.transaction_id ||
                                                        'N/A'}
                                                </td>
                                            </tr>
                                            {order.razorpay_order_id && (
                                                <tr>
                                                    <td className="fw-bold text-muted">
                                                        Razorpay Order ID:
                                                    </td>
                                                    <td>
                                                        <code>{order.razorpay_order_id}</code>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <table className="table table-borderless table-sm">
                                        <tbody>
                                            <tr>
                                                <td className="fw-bold text-muted">Subtotal:</td>
                                                <td>
                                                    ₹
                                                    {Number(
                                                        order.subtotal ?? order.total ?? 0
                                                    ).toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold text-muted">Shipping:</td>
                                                <td>
                                                    ₹
                                                    {Number(
                                                        order.shipping_cost ??
                                                            order.shipping ??
                                                            0
                                                    ).toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold text-muted">Tax:</td>
                                                <td>₹{Number(order.tax ?? 0).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold text-success h5">Total:</td>
                                                <td className="text-success h5">
                                                    ₹{Number(order.total ?? 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <BoxSeam className="me-1" /> Order Items
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Product</th>
                                            <th className="text-center">Quantity</th>
                                            <th className="text-end">Price</th>
                                            <th className="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length > 0 ? (
                                            items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {item.product_image ? (
                                                                <img
                                                                    src={imageUrl(item.product_image)}
                                                                    alt={item.product_name}
                                                                    style={{
                                                                        width: 50,
                                                                        height: 50,
                                                                        objectFit: 'cover',
                                                                        borderRadius: 4,
                                                                        marginRight: 10,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    style={{
                                                                        width: 50,
                                                                        height: 50,
                                                                        background: '#f0f0f0',
                                                                        borderRadius: 4,
                                                                        marginRight: 10,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <Box className="text-muted" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="fw-bold">
                                                                    {item.product_name ||
                                                                        'Unknown Product'}
                                                                </div>
                                                                {item.is_variant &&
                                                                    item.variant_features_list
                                                                        ?.length > 0 && (
                                                                        <div>
                                                                            {item.variant_features_list.map(
                                                                                (f, i) => (
                                                                                    <span
                                                                                        key={i}
                                                                                        className="badge bg-info me-1"
                                                                                    >
                                                                                        {f}
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                {item.variant_sku && (
                                                                    <small className="text-muted">
                                                                        SKU: {item.variant_sku}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-end">
                                                        ₹{Number(item.price).toFixed(2)}
                                                    </td>
                                                    <td className="text-end fw-bold">
                                                        ₹
                                                        {(
                                                            Number(item.price) *
                                                            Number(item.quantity)
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4">
                                                    <Box
                                                        className="text-muted"
                                                        style={{ fontSize: '2rem' }}
                                                    />
                                                    <p className="text-muted mt-2">
                                                        No items found for this order
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <td colSpan="3" className="text-end fw-bold">
                                                Subtotal:
                                            </td>
                                            <td className="text-end fw-bold">
                                                ₹
                                                {Number(
                                                    order.subtotal ?? order.total ?? 0
                                                ).toFixed(2)}
                                            </td>
                                        </tr>
                                        {Number(order.shipping ?? 0) > 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-end">
                                                    Shipping:
                                                </td>
                                                <td className="text-end">
                                                    ₹{Number(order.shipping).toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        {Number(order.tax ?? 0) > 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-end">
                                                    Tax:
                                                </td>
                                                <td className="text-end">
                                                    ₹{Number(order.tax).toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="table-active">
                                            <td colSpan="3" className="text-end fw-bold h5">
                                                Grand Total:
                                            </td>
                                            <td className="text-end fw-bold text-success h5">
                                                ₹{Number(order.total ?? 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <ChatDots className="me-1" /> Order Notes
                                </h5>
                            </div>
                            <div className="card-body">
                                <p style={{ whiteSpace: 'pre-line' }}>{order.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="col-md-4">
                    {/* Customer */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <Person className="me-1" /> Customer
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="fw-bold">{user.name || 'N/A'}</div>
                                <div className="text-muted">
                                    <Envelope className="me-1" /> {user.email || 'N/A'}
                                </div>
                                {user.phone && (
                                    <div className="text-muted">
                                        <Phone className="me-1" /> {user.phone}
                                    </div>
                                )}
                            </div>
                            {user.id && (
                                <Link
                                    to={`/admin/clients/view/${user.id}`}
                                    className="btn btn-outline-primary btn-sm w-100"
                                >
                                    <Person className="me-1" /> View Customer Profile
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <GeoAlt className="me-1" /> Shipping Address
                            </h5>
                        </div>
                        <div className="card-body">
                            {shippingAddress && Object.keys(shippingAddress).length > 0 ? (
                                <div className="mb-3">
                                    <div className="fw-bold">
                                        {shippingAddress.name || 'N/A'}
                                    </div>
                                    <div className="text-muted">
                                        {shippingAddress.address || 'N/A'}
                                    </div>
                                    {shippingAddress.address2 && (
                                        <div className="text-muted">
                                            {shippingAddress.address2}
                                        </div>
                                    )}
                                    <div className="text-muted">
                                        {shippingAddress.city || 'N/A'},{' '}
                                        {shippingAddress.state || 'N/A'}{' '}
                                        {shippingAddress.zip ||
                                            shippingAddress.postal_code ||
                                            ''}
                                    </div>
                                    <div className="text-muted">
                                        {shippingAddress.country || 'N/A'}
                                    </div>
                                    {shippingAddress.phone && (
                                        <div className="text-muted">
                                            <Phone className="me-1" /> {shippingAddress.phone}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted text-center mb-0">
                                    No shipping address provided
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Update Status */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <ArrowRepeat className="me-1" /> Update Status
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleUpdateStatus}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Order Status
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        {ORDER_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Payment Status
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedPayment}
                                        onChange={(e) => setSelectedPayment(e.target.value)}
                                    >
                                        {PAYMENT_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRepeat className="me-1" /> Update Status
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <ClockHistory className="me-1" /> Order Timeline
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="timeline">
                                <div className="timeline-item">
                                    <div className="timeline-marker bg-success"></div>
                                    <div className="timeline-content">
                                        <h6 className="mb-0">Order Placed</h6>
                                        <small className="text-muted">
                                            {formatDateTime(order.created_at)}
                                        </small>
                                    </div>
                                </div>
                                {['processing', 'shipped', 'delivered', 'completed'].includes(
                                    order.order_status
                                ) && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker bg-info"></div>
                                        <div className="timeline-content">
                                            <h6 className="mb-0">Processing</h6>
                                            <small className="text-muted">
                                                Order is being processed
                                            </small>
                                        </div>
                                    </div>
                                )}
                                {['delivered', 'completed'].includes(order.order_status) && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker bg-success"></div>
                                        <div className="timeline-content">
                                            <h6 className="mb-0">Completed</h6>
                                            <small className="text-muted">
                                                Order has been completed
                                            </small>
                                        </div>
                                    </div>
                                )}
                                {order.order_status === 'cancelled' && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker bg-danger"></div>
                                        <div className="timeline-content">
                                            <h6 className="mb-0">Cancelled</h6>
                                            <small className="text-muted">
                                                Order has been cancelled
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <Lightning className="me-1" /> Quick Actions
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <Link to="/admin/orders" className="btn btn-outline-primary">
                                    <List className="me-1" /> View All Orders
                                </Link>
                                <button
                                    type="button"
                                    className="btn btn-outline-info"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="me-1" /> Print Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderView;