// src/pages/admin/invoices/InvoiceView.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Receipt, ArrowLeft, FilePdf, Printer, Gear, CreditCard, Trash,
    ArrowRepeat, ExclamationTriangle,
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
    s ? new Date(s).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';
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

const statusBadge = (status) =>
    status === 'paid'
        ? 'success'
        : status === 'unpaid'
        ? 'warning'
        : status === 'overdue'
        ? 'danger'
        : 'secondary';

const imageUrl = (path) =>
    !path ? '/assets/images/default-product.jpg' : path.startsWith('http') ? path : `/${path}`;

const InvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [company, setCompany] = useState({});
    const [shippingAddress, setShippingAddress] = useState({});
    const [selectedStatus, setSelectedStatus] = useState('unpaid');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/invoices/view/${id}`, {
                    headers: authHeaders(false),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const p = data.data;
                    setInvoice(p.invoice || p);
                    setItems(p.items || []);
                    setCompany(p.company || {});
                    setShippingAddress(p.shipping_address || {});
                    setSelectedStatus((p.invoice || p).status || 'unpaid');
                } else {
                    showToast('Invoice not found', 'error');
                    setTimeout(() => navigate('/admin/invoices'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load invoice', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/invoices/update-status/${id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ status: selectedStatus }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Invoice status updated', 'success');
                setInvoice((inv) => ({ ...inv, status: selectedStatus }));
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
        if (!window.confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/invoices/delete/${id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Invoice deleted successfully', 'success');
                setTimeout(() => navigate('/admin/invoices'), 600);
            } else {
                showToast(data.message || 'Failed to delete invoice', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setDeleting(false);
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

    if (!invoice) return null;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Receipt className="text-primary me-2" /> Invoice Details
                </h2>
                <div>
                    <Link to="/admin/invoices" className="btn btn-outline-secondary">
                        <ArrowLeft className="me-1" /> Back to Invoices
                    </Link>
                    <a
                        href={`${API_BASE}/invoices/download/${invoice.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-success ms-2"
                    >
                        <FilePdf className="me-1" /> Download PDF
                    </a>
                    <a
                        href={`${API_BASE}/invoices/print/${invoice.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary ms-2"
                    >
                        <Printer className="me-1" /> Print
                    </a>
                </div>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <Receipt className="me-1" /> Invoice #{invoice.invoice_number}
                                <span className={`badge bg-${statusBadge(invoice.status)} ms-2`}>
                                    {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                                </span>
                            </h5>
                        </div>
                        <div className="card-body">
                            {/* Header */}
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h6>From:</h6>
                                    <p>
                                        <strong>{company.name}</strong>
                                        <br />
                                        {company.address}
                                        <br />
                                        Phone: {company.phone}
                                        <br />
                                        Email: {company.email}
                                        <br />
                                        Tax ID: {company.tax_id}
                                    </p>
                                </div>
                                <div className="col-md-6 text-md-end">
                                    <h6>To:</h6>
                                    <p>
                                        <strong>{invoice.name}</strong>
                                        <br />
                                        {invoice.email}
                                        <br />
                                        {shippingAddress.address && (
                                            <>
                                                {shippingAddress.address}
                                                <br />
                                                {shippingAddress.city}, {shippingAddress.postal_code}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <strong>Invoice Date:</strong>
                                    <br />
                                    {formatDate(invoice.issue_date)}
                                </div>
                                <div className="col-md-4">
                                    <strong>Due Date:</strong>
                                    <br />
                                    {formatDate(invoice.due_date)}
                                </div>
                                <div className="col-md-4">
                                    <strong>Order #:</strong>
                                    <br />
                                    <Link to={`/admin/orders/view/${invoice.order_id}`}>
                                        {invoice.order_number}
                                    </Link>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="table-responsive">
                                <table className="table table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th className="text-center">Quantity</th>
                                            <th className="text-end">Unit Price</th>
                                            <th className="text-end">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={imageUrl(item.image)}
                                                            alt=""
                                                            style={{
                                                                width: 50,
                                                                height: 50,
                                                                objectFit: 'cover',
                                                                borderRadius: 4,
                                                                marginRight: 10,
                                                            }}
                                                        />
                                                        <div>
                                                            <strong>{item.name}</strong>
                                                            <br />
                                                            <small className="text-muted">
                                                                Product ID: #{item.product_id}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-end">
                                                    ${Number(item.price).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                    ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="4" className="text-end fw-bold">
                                                Subtotal:
                                            </td>
                                            <td className="text-end">
                                                ${Number(invoice.subtotal).toFixed(2)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="4" className="text-end fw-bold">
                                                Tax (10%):
                                            </td>
                                            <td className="text-end">
                                                ${Number(invoice.tax).toFixed(2)}
                                            </td>
                                        </tr>
                                        {Number(invoice.discount) > 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-end fw-bold">
                                                    Discount:
                                                </td>
                                                <td className="text-end text-danger">
                                                    -${Number(invoice.discount).toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan="4" className="text-end fw-bold fs-5">
                                                Total:
                                            </td>
                                            <td className="text-end fs-5 fw-bold text-primary">
                                                ${Number(invoice.total).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {invoice.notes && (
                                <div className="mt-3">
                                    <strong>Notes:</strong>
                                    <p className="text-muted">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    {/* Actions */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <Gear className="me-1" /> Actions
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleUpdateStatus}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Update Status
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="paid">Paid</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="overdue">Overdue</option>
                                        <option value="cancelled">Cancelled</option>
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

                            <hr />

                            <div className="d-grid gap-2">
                                <a
                                    href={`${API_BASE}/invoices/download/${invoice.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-success"
                                >
                                    <FilePdf className="me-1" /> Download PDF
                                </a>
                                <a
                                    href={`${API_BASE}/invoices/print/${invoice.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-primary"
                                >
                                    <Printer className="me-1" /> Print Invoice
                                </a>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash className="me-1" /> Delete Invoice
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <CreditCard className="me-1" /> Payment Information
                            </h5>
                        </div>
                        <div className="card-body">
                            <p>
                                <strong>Status:</strong>{' '}
                                <span
                                    className={`badge bg-${
                                        invoice.status === 'paid' ? 'success' : 'warning'
                                    }`}
                                >
                                    {invoice.status?.charAt(0).toUpperCase() +
                                        invoice.status?.slice(1)}
                                </span>
                            </p>

                            {invoice.payment_method && (
                                <p>
                                    <strong>Payment Method:</strong> {invoice.payment_method}
                                </p>
                            )}

                            {invoice.payment_date && (
                                <p>
                                    <strong>Payment Date:</strong>{' '}
                                    {formatDateTime(invoice.payment_date)}
                                </p>
                            )}

                            <p>
                                <strong>Total Amount:</strong>{' '}
                                <span className="fs-5 text-primary">
                                    ${Number(invoice.total).toFixed(2)}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InvoiceView;