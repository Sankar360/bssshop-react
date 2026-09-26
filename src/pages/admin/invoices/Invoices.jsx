// src/pages/admin/invoices/Invoices.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Receipt, Printer, Download, Search, XCircle, ListUl, CheckCircle,
    Clock, CurrencyDollar, ExclamationTriangle, Eye, FilePdf, ArrowRepeat,
    Trash,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const formatDate = (s) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

const isOverdue = (dueDate, status) =>
    dueDate && status !== 'paid' && new Date(dueDate) < new Date();

const STATUS_BADGE = {
    paid: 'success',
    unpaid: 'warning',
    overdue: 'danger',
    cancelled: 'secondary',
};
const STATUS_ICON = {
    paid: <CheckCircle />,
    unpaid: <Clock />,
    overdue: <ExclamationTriangle />,
    cancelled: <XCircle />,
};

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        unpaid: 0,
        total_amount: 0,
    });
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        date_from: '',
        date_to: '',
    });

    // Modals
    const [statusModal, setStatusModal] = useState(null); // { id, invoice_number, status }
    const [deleteTarget, setDeleteTarget] = useState(null); // { id }
    const [showExport, setShowExport] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Fetch                                                          */
    /* -------------------------------------------------------------- */
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams(filters).toString();
            const res = await fetch(`${API_BASE}/invoices?${qs}`, { headers: authHeaders(false) });
            const data = await res.json();

            if (data.success) {
                const payload = data.data || {};
                const list = Array.isArray(payload) ? payload : payload.invoices || [];
                setInvoices(list);
                setStats(
                    payload.stats ||
                        data.stats || {
                            total: list.length,
                            paid: list.filter((i) => i.status === 'paid').length,
                            unpaid: list.filter((i) => i.status !== 'paid').length,
                            total_amount: list.reduce((s, i) => s + Number(i.total || 0), 0),
                        }
                );
                setTotalCount(payload.total_count ?? data.total_count ?? list.length);
            } else {
                showToast(data.message || 'Failed to load invoices', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load invoices', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((f) => ({ ...f, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchInvoices();
    };

    const handleFilterReset = () =>
        setFilters({ search: '', status: 'all', date_from: '', date_to: '' });

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!statusModal) return;

        try {
            const res = await fetch(`${API_BASE}/invoices/update-status/${statusModal.id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ status: statusModal.status }),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Invoice status updated', 'success');
                setStatusModal(null);
                fetchInvoices();
            } else {
                showToast(data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`${API_BASE}/invoices/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Invoice deleted successfully', 'success');
                setDeleteTarget(null);
                fetchInvoices();
            } else {
                showToast(data.message || 'Failed to delete invoice', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const exportCSV = () => {
        window.open(`${API_BASE}/invoices/export/csv`, '_blank');
        setShowExport(false);
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
                .border-left-info    { border-left: 4px solid #36b9cc; }
                .stat-card {
                    transition: transform .3s ease, box-shadow .3s ease;
                    border: none; border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,.05);
                }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,.1); }
                .stat-icon { font-size: 2.5rem; opacity: .5; }
                .table td { vertical-align: middle; }
                .table-hover tbody tr:hover { background-color: #f8f9fc; }
                .btn-group .btn { padding: .25rem .5rem; }
                @media print {
                    .btn-group, .btn, .no-print { display: none !important; }
                }
            `}</style>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Receipt className="text-primary me-2" /> Invoices Management
                </h2>
                <div>
                    <button className="btn btn-outline-secondary me-2" onClick={() => window.print()}>
                        <Printer className="me-1" /> Print
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => setShowExport(true)}>
                        <Download className="me-1" /> Export
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="row mb-4">
                {[
                    { label: 'Total Invoices', value: stats.total, icon: <Receipt />, cls: 'primary' },
                    { label: 'Paid', value: stats.paid, icon: <CheckCircle />, cls: 'success' },
                    { label: 'Unpaid', value: stats.unpaid, icon: <Clock />, cls: 'warning' },
                    {
                        label: 'Total Amount',
                        value: `$${Number(stats.total_amount).toFixed(2)}`,
                        icon: <CurrencyDollar />,
                        cls: 'info',
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
                            <div className="input-group">
                                <span className="input-group-text"><Search /></span>
                                <input
                                    type="text" id="search" name="search"
                                    className="form-control"
                                    placeholder="Invoice #, Customer..."
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select
                                className="form-select" id="status" name="status"
                                value={filters.status} onChange={handleFilterChange}
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
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
                        <div className="col-md-3 d-flex align-items-end">
                            <button type="submit" className="btn btn-primary me-2">
                                <Search />
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
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
                        <ListUl className="me-2" /> All Invoices
                        <span className="badge bg-primary rounded-pill ms-2">{totalCount}</span>
                    </h5>
                    <span className="text-muted small">Showing {totalCount} invoices</span>
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
                                        <th>Invoice #</th>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Issue Date</th>
                                        <th>Due Date</th>
                                        <th width="200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.length > 0 ? (
                                        invoices.map((invoice, index) => {
                                            const overdue = isOverdue(invoice.due_date, invoice.status);
                                            return (
                                                <tr key={invoice.id}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <Link
                                                            to={`/admin/invoices/view/${invoice.id}`}
                                                            className="fw-bold text-decoration-none"
                                                        >
                                                            {invoice.invoice_number}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <Link
                                                            to={`/admin/orders/view/${invoice.order_id}`}
                                                            className="text-decoration-none"
                                                        >
                                                            {invoice.order_number}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <strong>{invoice.name || 'N/A'}</strong>
                                                        <br />
                                                        <small className="text-muted">{invoice.email}</small>
                                                    </td>
                                                    <td>
                                                        <span className="fw-bold text-primary">
                                                            ${Number(invoice.total).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge bg-${
                                                                STATUS_BADGE[invoice.status] || 'secondary'
                                                            }`}
                                                        >
                                                            {STATUS_ICON[invoice.status]} {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">
                                                            {formatDate(invoice.issue_date)}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <small className={`text-muted ${overdue ? 'text-danger fw-bold' : ''}`}>
                                                            {formatDate(invoice.due_date)}
                                                            {overdue && (
                                                                <>
                                                                    <br />
                                                                    <span className="badge bg-danger">Overdue</span>
                                                                </>
                                                            )}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group btn-group-sm" role="group">
                                                            <Link
                                                                to={`/admin/invoices/view/${invoice.id}`}
                                                                className="btn btn-outline-primary"
                                                                title="View Invoice"
                                                            >
                                                                <Eye />
                                                            </Link>
                                                            <a
                                                                href={`${API_BASE}/invoices/download/${invoice.id}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="btn btn-outline-success"
                                                                title="Download PDF"
                                                            >
                                                                <FilePdf />
                                                            </a>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-warning"
                                                                title="Update Status"
                                                                onClick={() =>
                                                                    setStatusModal({
                                                                        id: invoice.id,
                                                                        invoice_number: invoice.invoice_number,
                                                                        status: invoice.status,
                                                                    })
                                                                }
                                                            >
                                                                <ArrowRepeat />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger"
                                                                title="Delete Invoice"
                                                                onClick={() =>
                                                                    setDeleteTarget({ id: invoice.id })
                                                                }
                                                            >
                                                                <Trash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center py-5">
                                                <Receipt className="text-muted" style={{ fontSize: '3rem' }} />
                                                <h5 className="mt-3">No invoices found</h5>
                                                <p className="text-muted">
                                                    Invoices will appear here once they are generated.
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
                                <h6 className="modal-title">Update Invoice Status</h6>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setStatusModal(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Invoice #{statusModal.invoice_number}
                                    </label>
                                    <select
                                        className="form-select"
                                        value={statusModal.status}
                                        onChange={(e) =>
                                            setStatusModal((m) => ({ ...m, status: e.target.value }))
                                        }
                                    >
                                        <option value="paid">Paid</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="overdue">Overdue</option>
                                        <option value="cancelled">Cancelled</option>
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
                                    <ExclamationTriangle className="me-1" /> Delete Invoice
                                </h6>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setDeleteTarget(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this invoice?</p>
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
                                <h6 className="modal-title">Export Invoices</h6>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowExport(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="d-grid gap-2">
                                    <button className="btn btn-outline-success" onClick={exportCSV}>
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

export default Invoices;