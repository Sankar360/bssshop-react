// src/pages/admin/orders/Orders.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    CartCheck, Printer, Download, Search, XCircle, ListUl, Cart, CheckCircle,
    Clock, CurrencyRupee, Eye, ArrowRepeat, Trash, Inbox,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const formatDate = (s) =>
    s
        ? new Date(s).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
          })
        : '—';

const formatTime = (s) =>
    s
        ? new Date(s).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : '';

const PAYMENT_BADGE = {
    pending: 'warning',
    paid: 'success',
    failed: 'danger',
    refunded: 'secondary',
};

const STATUS_BADGE = {
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    completed: 'success',   // in case older data uses this
    cancelled: 'danger',
    refunded: 'secondary',
};

// Canonical statuses used by the backend (see Order::getOrderStatuses)
const ORDER_STATUSES = [
    { value: 'pending',    label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped',    label: 'Shipped' },
    { value: 'delivered',  label: 'Delivered' },
    { value: 'cancelled',  label: 'Cancelled' },
    { value: 'refunded',   label: 'Refunded' },
];

const PAYMENT_STATUSES = [
    { value: 'pending',  label: 'Pending' },
    { value: 'paid',     label: 'Paid' },
    { value: 'failed',   label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
];

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        payment_status: '',
        date_from: '',
        date_to: '',
    });

    const [statusModal, setStatusModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showExport, setShowExport] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Fetch                                                          */
    /* -------------------------------------------------------------- */
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            // Strip empty filters so we don't send `?search=&status=` etc.
            const params = {};
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) params[k] = v;
            });

            const qs = new URLSearchParams(params).toString();
            const url = `${API_BASE}/orders${qs ? `?${qs}` : ''}`;

            const res = await fetch(url, { headers: authHeaders(false) });
            const data = await res.json();

            if (data.success) {
                // Handle all three shapes:
                //   data.data                → plain array
                //   data.data.data           → Laravel paginator
                //   data.data.orders         → named wrapper
                const payload = data.data;
                let list = [];

                if (Array.isArray(payload)) {
                    list = payload;
                } else if (Array.isArray(payload?.data)) {
                    list = payload.data;               // paginator
                } else if (Array.isArray(payload?.orders)) {
                    list = payload.orders;
                }

                setOrders(list);
            } else {
                showToast(data.message || 'Failed to load orders', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    /* -------------------------------------------------------------- */
    /*  Derived stats                                                  */
    /* -------------------------------------------------------------- */
    const total = orders.length;
    const completed = orders.filter((o) =>
        ['completed', 'delivered'].includes(o.order_status)
    ).length;
    const pending = orders.filter((o) => o.order_status === 'pending').length;
    const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((f) => ({ ...f, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchOrders();
    };

    const handleFilterReset = () => {
        setFilters({
            search: '',
            status: '',
            payment_status: '',
            date_from: '',
            date_to: '',
        });
    };

    /* -------------------------------------------------------------- */
    /*  Update status                                                  */
    /* -------------------------------------------------------------- */
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!statusModal) return;

        try {
            const res = await fetch(
                `${API_BASE}/orders/update-status/${statusModal.id}`,
                {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                        // ✅ Laravel expects order_status, not status
                        order_status: statusModal.order_status,
                        payment_status: statusModal.payment_status,
                    }),
                }
            );
            const data = await res.json();

            if (data.success) {
                showToast('Order status updated', 'success');
                setStatusModal(null);
                fetchOrders();
            } else {
                showToast(data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Delete                                                         */
    /* -------------------------------------------------------------- */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`${API_BASE}/orders/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Order deleted successfully', 'success');
                setDeleteTarget(null);
                fetchOrders();
            } else {
                showToast(data.message || 'Failed to delete order', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Export CSV (with auth header)                                  */
    /* -------------------------------------------------------------- */
    const exportCSV = async () => {
        try {
            const qs = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(filters).filter(([, v]) => v)
                )
            ).toString();
            const url = `${API_BASE}/orders/export/csv${qs ? `?${qs}` : ''}`;

            const res = await fetch(url, { headers: authHeaders(false) });
            if (!res.ok) {
                showToast('Export failed', 'error');
                return;
            }
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            showToast('CSV exported', 'success');
            setShowExport(false);
        } catch (err) {
            console.error(err);
            showToast('Export failed', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <style>{`
                .border-left-primary { border-left: 4px solid #4e73df; }
                .border-left-success { border-left: 4px solid #1cc88a; }
                .border-left-warning { border-left: 4px solid #f6c23e; }
                .border-left-danger  { border-left: 4px solid #e74a3b; }
                .stat-card {
                    transition: transform .3s ease, box-shadow .3s ease;
                    border: none; border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,.05);
                }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,.1); }
                .stat-icon { font-size: 2.5rem; opacity: .5; }
                .table th { font-weight: 600; color: #5a5c69; border-top: none; }
                .table td { vertical-align: middle; }
                .table-hover tbody tr:hover { background-color: #f8f9fc; }
                .btn-group .btn { padding: .25rem .5rem; }
                @media print {
                    .btn-group, .btn, .no-print { display: none !important; }
                }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <CartCheck className="text-primary me-2" /> Orders Management
                </h2>
                <div>
                    <button
                        type="button"
                        className="btn btn-outline-secondary me-2"
                        onClick={() => window.print()}
                    >
                        <Printer className="me-1" /> Print
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setShowExport(true)}
                    >
                        <Download className="me-1" /> Export
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="row mb-4">
                {[
                    { label: 'Total Orders', value: total, icon: <Cart />, cls: 'primary' },
                    { label: 'Completed',    value: completed, icon: <CheckCircle />, cls: 'success' },
                    { label: 'Pending',      value: pending, icon: <Clock />, cls: 'warning' },
                    {
                        label: 'Total Revenue',
                        value: `₹${revenue.toFixed(2)}`,
                        icon: <CurrencyRupee />,
                        cls: 'danger',
                    },
                ].map((s, i) => (
                    <div className="col-md-3 mb-3" key={i}>
                        <div className={`card stat-card border-left-${s.cls}`}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-1">{s.label}</h6>
                                        <h3 className="mb-0">{s.value}</h3>
                                    </div>
                                    <div className={`stat-icon text-${s.cls}`}>{s.icon}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <form onSubmit={handleFilterSubmit} className="row g-3">
                        <div className="col-md-3">
                            <label htmlFor="search" className="form-label">Search</label>
                            <input
                                type="text" id="search" name="search" className="form-control"
                                placeholder="Order #, Customer..."
                                value={filters.search} onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select
                                className="form-select" id="status" name="status"
                                value={filters.status} onChange={handleFilterChange}
                            >
                                <option value="">All Status</option>
                                {ORDER_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="payment_status" className="form-label">Payment</label>
                            <select
                                className="form-select" id="payment_status" name="payment_status"
                                value={filters.payment_status} onChange={handleFilterChange}
                            >
                                <option value="">All Payments</option>
                                {PAYMENT_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="date_from" className="form-label">Date From</label>
                            <input
                                type="date" className="form-control" id="date_from" name="date_from"
                                value={filters.date_from} onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="date_to" className="form-label">Date To</label>
                            <input
                                type="date" className="form-control" id="date_to" name="date_to"
                                value={filters.date_to} onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                            <button type="submit" className="btn btn-primary w-100">
                                <Search />
                            </button>
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                            <button
                                type="button" className="btn btn-secondary w-100"
                                onClick={handleFilterReset}
                            >
                                <XCircle />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <ListUl className="me-2" /> All Orders
                        <span className="badge bg-primary rounded-pill ms-2">{total}</span>
                    </h5>
                    <span className="text-muted small">Showing {total} orders</span>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th width="50">#</th>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th width="150">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length > 0 ? (
                                        orders.map((order, index) => (
                                            <tr key={order.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <Link
                                                        to={`/admin/orders/view/${order.id}`}
                                                        className="fw-bold text-decoration-none"
                                                    >
                                                        {order.order_number}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {/* ✅ Read from nested user object */}
                                                    <strong>
                                                        {order.user?.name || 'Guest'}
                                                    </strong>
                                                    <br />
                                                    <small className="text-muted">
                                                        {order.user?.email || '—'}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-primary">
                                                        ₹{Number(order.total).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge bg-${
                                                            PAYMENT_BADGE[order.payment_status] || 'secondary'
                                                        }`}
                                                    >
                                                        {order.payment_status
                                                            ? order.payment_status
                                                                  .charAt(0)
                                                                  .toUpperCase() +
                                                              order.payment_status.slice(1)
                                                            : '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge bg-${
                                                            STATUS_BADGE[order.order_status] || 'secondary'
                                                        }`}
                                                    >
                                                        {order.order_status
                                                            ? order.order_status
                                                                  .charAt(0)
                                                                  .toUpperCase() +
                                                              order.order_status.slice(1)
                                                            : '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {formatDate(order.created_at)}
                                                        <br />
                                                        {formatTime(order.created_at)}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <Link
                                                            to={`/admin/orders/view/${order.id}`}
                                                            className="btn btn-outline-primary"
                                                            title="View Order"
                                                        >
                                                            <Eye />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-success"
                                                            title="Update Status"
                                                            onClick={() =>
                                                                setStatusModal({
                                                                    id: order.id,
                                                                    order_number: order.order_number,
                                                                    order_status: order.order_status || 'pending',
                                                                    payment_status: order.payment_status || 'pending',
                                                                })
                                                            }
                                                        >
                                                            <ArrowRepeat />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger"
                                                            title="Delete Order"
                                                            onClick={() => setDeleteTarget({ id: order.id })}
                                                        >
                                                            <Trash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5">
                                                <Inbox className="text-muted" style={{ fontSize: '3rem' }} />
                                                <h5 className="mt-3">No orders found</h5>
                                                <p className="text-muted">
                                                    Orders will appear here once customers make purchases.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Modal */}
            {statusModal && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setStatusModal(null)}
                >
                    <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                        <form className="modal-content" onSubmit={handleUpdateStatus}>
                            <div className="modal-header">
                                <h6 className="modal-title">Update Order Status</h6>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setStatusModal(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Order #{statusModal.order_number}
                                    </label>
                                    <select
                                        className="form-select"
                                        value={statusModal.order_status}
                                        onChange={(e) =>
                                            setStatusModal((m) => ({
                                                ...m,
                                                order_status: e.target.value,
                                            }))
                                        }
                                    >
                                        {ORDER_STATUSES.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Payment Status</label>
                                    <select
                                        className="form-select"
                                        value={statusModal.payment_status}
                                        onChange={(e) =>
                                            setStatusModal((m) => ({
                                                ...m,
                                                payment_status: e.target.value,
                                            }))
                                        }
                                    >
                                        {PAYMENT_STATUSES.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setStatusModal(null)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm">
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h6 className="modal-title">
                                    <Trash className="me-1" /> Confirm Delete
                                </h6>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setDeleteTarget(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this order?</p>
                                <p className="text-muted small">This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={confirmDelete}
                                >
                                    <Trash className="me-1" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExport && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setShowExport(false)}
                >
                    <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Export Orders</h6>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowExport(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="d-grid gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-success"
                                        onClick={exportCSV}
                                    >
                                        <Download className="me-1" /> Export as CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Orders;