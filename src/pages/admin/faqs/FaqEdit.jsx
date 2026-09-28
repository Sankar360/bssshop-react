// src/pages/admin/faqs/FaqEdit.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PencilSquare, ArrowLeft, InfoCircle, Save, Trash, XCircle,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const formatDateTime = (s) =>
    s
        ? new Date(s).toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

const FaqEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        question: '',
        answer: '',
        category: 'General',
        status: 'active',
        order: 0,
    });
    const [meta, setMeta] = useState({ id: null, created_at: null, updated_at: null });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load                                                           */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/faqs/edit/${id}`, {
                    headers: authHeaders(false),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const f = data.data;
                    setForm({
                        question: f.question || '',
                        answer: f.answer || '',
                        category: f.category || 'General',
                        status: f.status || 'active',
                        order: f.order ?? 0,
                    });
                    setMeta({
                        id: f.id,
                        created_at: f.created_at,
                        updated_at: f.updated_at,
                    });
                } else {
                    showToast('FAQ not found', 'error');
                    setTimeout(() => navigate('/admin/faqs'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load FAQ', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate]);

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const res = await fetch(`${API_BASE}/faqs/update/${id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(form),
            });

            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the validation errors below.', 'error');
                return;
            }

            const data = await res.json();
            if (data.success) {
                showToast('FAQ updated successfully!', 'success');
                setTimeout(() => navigate('/admin/faqs'), 600);
            } else {
                showToast(data.message || 'Failed to update FAQ', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this FAQ? This cannot be undone.')) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/faqs/delete/${id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                showToast('FAQ deleted successfully', 'success');
                setTimeout(() => navigate('/admin/faqs'), 600);
            } else {
                showToast(data.message || 'Failed to delete FAQ', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .card-header {
                    background-color: #f8f9fc;
                    border-bottom: 1px solid #e3e6f0;
                }
                .form-control-lg { font-size: 1.1rem; }
                .bg-light { background-color: #f8f9fc !important; }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <PencilSquare className="text-primary me-2" /> Edit FAQ
                </h2>
                <Link to="/admin/faqs" className="btn btn-outline-secondary">
                    <ArrowLeft className="me-1" /> Back to FAQs
                </Link>
            </div>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row">
                            {/* Left */}
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label htmlFor="question" className="form-label fw-semibold">
                                        Question <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text" id="question" name="question"
                                        className={`form-control form-control-lg ${errors.question ? 'is-invalid' : ''}`}
                                        value={form.question} onChange={handleChange}
                                        placeholder="Enter the frequently asked question"
                                        required
                                    />
                                    {errors.question && <div className="invalid-feedback">{errors.question}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="answer" className="form-label fw-semibold">
                                        Answer <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        id="answer" name="answer" rows="8"
                                        className={`form-control ${errors.answer ? 'is-invalid' : ''}`}
                                        value={form.answer} onChange={handleChange}
                                        placeholder="Enter the detailed answer to the question"
                                        required
                                    />
                                    {errors.answer && <div className="invalid-feedback">{errors.answer}</div>}
                                    <div className="form-text text-muted">
                                        <InfoCircle className="me-1" />
                                        Provide a clear and detailed answer. You can use HTML formatting if needed.
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="col-md-4">
                                <div className="mb-3">
                                    <label htmlFor="category" className="form-label fw-semibold">
                                        Category <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text" id="category" name="category"
                                        className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                                        value={form.category} onChange={handleChange}
                                        placeholder="e.g., Payments, Shipping"
                                        required
                                    />
                                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                                    <div className="form-text text-muted">
                                        <InfoCircle className="me-1" /> Group FAQs by category for better organization.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="status" className="form-label fw-semibold">Status</label>
                                    <select
                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                        id="status" name="status"
                                        value={form.status} onChange={handleChange}
                                    >
                                        <option value="active">✅ Active</option>
                                        <option value="inactive">❌ Inactive</option>
                                    </select>
                                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                    <div className="form-text text-muted">
                                        <InfoCircle className="me-1" /> Inactive FAQs won't be displayed on the frontend.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="order" className="form-label fw-semibold">Display Order</label>
                                    <input
                                        type="number" id="order" name="order" min="0"
                                        className={`form-control ${errors.order ? 'is-invalid' : ''}`}
                                        value={form.order} onChange={handleChange}
                                        placeholder="0"
                                    />
                                    {errors.order && <div className="invalid-feedback">{errors.order}</div>}
                                    <div className="form-text text-muted">
                                        <InfoCircle className="me-1" /> Lower numbers appear first. Use 0 for default order.
                                    </div>
                                </div>

                                {/* FAQ Info */}
                                <div className="card mt-3 bg-light">
                                    <div className="card-body">
                                        <h6 className="card-title">
                                            <InfoCircle className="me-1" /> FAQ Information
                                        </h6>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">FAQ ID</span>
                                            <span className="fw-bold">#{meta.id}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Created</span>
                                            <span>{formatDateTime(meta.created_at)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">Last Updated</span>
                                            <span>{formatDateTime(meta.updated_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr />

                        <div className="d-flex justify-content-between">
                            <Link to="/admin/faqs" className="btn btn-secondary btn-lg">
                                <XCircle className="me-1" /> Cancel
                            </Link>
                            <div>
                                <button type="submit" className="btn btn-primary btn-lg me-2" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="me-1" /> Update FAQ
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-lg"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash className="me-1" /> Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default FaqEdit;