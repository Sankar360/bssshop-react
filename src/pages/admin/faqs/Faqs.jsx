// src/pages/admin/faqs/Faqs.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    QuestionCircle, Printer, Download, PlusCircle, Search, XCircle,
    ListUl, CheckCircle, GripVertical, Pencil, PauseCircle, PlayCircle,
    Trash, ExclamationTriangle,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = () => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
});

const formatDate = (s) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

const Faqs = () => {
    const [faqs, setFaqs] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [categories, setCategories] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', category: 'all' });
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, question }

    /* -------------------------------------------------------------- */
    /*  Fetch                                                          */
    /* -------------------------------------------------------------- */
    const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
        const qs = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE}/faqs?${qs}`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.success) {
            showToast(data.message || 'Failed to load FAQs', 'error');
            setFaqs([]);
            return;
        }

        // Normalize shapes
        let list = [];
        let total = 0;
        let statsFromServer = null;
        let catsFromServer = null;
        let totalCountFromServer = null;

        const payload = data.data;

        if (Array.isArray(payload)) {
            list = payload;
            total = payload.length;
        } else if (payload && Array.isArray(payload.data)) {
            // Laravel paginator: { data: { data: [...], total: N } }
            list = payload.data;
            total = payload.total ?? payload.data.length;
        } else if (payload && Array.isArray(payload.faqs)) {
            list = payload.faqs;
            total = payload.pagination?.total ?? payload.total ?? payload.faqs.length;
            statsFromServer = payload.stats ?? null;
            catsFromServer = payload.categories ?? null;
            totalCountFromServer = payload.pagination?.total ?? null;
        }

        setFaqs(list);
        setTotalCount(data.total_count ?? totalCountFromServer ?? total);
        setStats(
            data.stats ||
            statsFromServer || {
                total: total,
                active: list.filter((f) => f.status === 'active').length,
                inactive: list.filter((f) => f.status === 'inactive').length,
            }
        );
        setCategories(data.categories || catsFromServer || []);
    } catch (err) {
        console.error(err);
        showToast('Failed to load FAQs', 'error');
        setFaqs([]);
    } finally {
        setLoading(false);
    }
}, [filters]);

    useEffect(() => {
        fetchFaqs();
    }, [fetchFaqs]);

    /* -------------------------------------------------------------- */
    /*  Toggle status                                                  */
    /* -------------------------------------------------------------- */
    const handleToggleStatus = async (faq) => {
        const newStatus = faq.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'deactivate';

        if (!window.confirm(`Are you sure you want to ${action} this FAQ?`)) return;

        try {
            const res = await fetch(`${API_BASE}/faqs/toggle-status/${faq.id}`, {
                method: 'POST',
                headers: authHeaders(),
            });
            const data = await res.json();

            if (data.success) {
                showToast(`FAQ ${action}d successfully`, 'success');
                fetchFaqs();
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
            const res = await fetch(`${API_BASE}/faqs/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const data = await res.json();

            if (data.success) {
                showToast('FAQ deleted successfully', 'success');
                setDeleteTarget(null);
                fetchFaqs();
            } else {
                showToast(data.message || 'Failed to delete FAQ', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Filter form                                                    */
    /* -------------------------------------------------------------- */
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((f) => ({ ...f, [name]: value }));
    };
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchFaqs();
    };
    const handleFilterReset = () => setFilters({ search: '', category: 'all' });

    const exportFaqs = () => window.open(`${API_BASE}/faqs/export`, '_blank');

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <style>{`
                .border-left-primary { border-left: 4px solid #4e73df; }
                .border-left-success { border-left: 4px solid #1cc88a; }
                .border-left-danger  { border-left: 4px solid #e74a3b; }
                .stat-card {
                    transition: transform .3s ease, box-shadow .3s ease;
                    border: none; border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,.05);
                }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,.1); }
                .stat-icon { font-size: 2.5rem; opacity: .5; }
                .table td { vertical-align: middle; }
                .drag-handle { cursor: move; }
                @media print {
                    .btn-group, .btn, .no-print { display: none !important; }
                }
            `}</style>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <QuestionCircle className="text-primary me-2" /> FAQ Management
                </h2>
                <div>
                    <button className="btn btn-outline-secondary me-2" onClick={() => window.print()}>
                        <Printer className="me-1" /> Print
                    </button>
                    <button className="btn btn-outline-primary me-2" onClick={exportFaqs}>
                        <Download className="me-1" /> Export
                    </button>
                    <Link to="/admin/faqs/create" className="btn btn-primary">
                        <PlusCircle className="me-1" /> Add FAQ
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="row mb-4">
                {[
                    { label: 'Total FAQs', value: stats.total, icon: <QuestionCircle />, cls: 'primary' },
                    { label: 'Active', value: stats.active, icon: <CheckCircle />, cls: 'success' },
                    { label: 'Inactive', value: stats.inactive, icon: <XCircle />, cls: 'danger' },
                ].map((s, i) => (
                    <div className="col-md-4 mb-3" key={i}>
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
                        <div className="col-md-5">
                            <label htmlFor="search" className="form-label">Search</label>
                            <div className="input-group">
                                <span className="input-group-text"><Search /></span>
                                <input
                                    type="text" id="search" name="search"
                                    className="form-control"
                                    placeholder="Question, Answer..."
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        <div className="col-md-5">
                            <label htmlFor="category" className="form-label">Category</label>
                            <select
                                className="form-select" id="category" name="category"
                                value={filters.category} onChange={handleFilterChange}
                            >
                                <option value="all">All Categories</option>
                                {categories.map((cat, i) => {
                                    // ✅ Support both { category: 'x' } and plain 'x'
                                    const value = typeof cat === 'string' ? cat : cat?.category;
                                    if (!value) return null;
                                    const label = value.charAt(0).toUpperCase() + value.slice(1);
                                    return (
                                        <option key={value || i} value={value}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button type="submit" className="btn btn-primary w-100 me-2">
                                <Search />
                            </button>
                            <button type="button" className="btn btn-secondary w-100" onClick={handleFilterReset}>
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
                        <ListUl className="me-2" /> All FAQs
                        <span className="badge bg-primary rounded-pill ms-2">{totalCount}</span>
                    </h5>
                    <span className="text-muted small">Showing {totalCount} FAQs</span>
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
                                        <th>Question</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Order</th>
                                        <th>Created</th>
                                        <th width="200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {faqs.length > 0 ? (
                                        faqs.map((faq, index) => (
                                            <tr key={faq.id} data-id={faq.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <GripVertical className="text-muted me-2 drag-handle" />
                                                        <span>{faq.question}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-info">
                                                        {faq.category?.charAt(0).toUpperCase() +
                                                            (faq.category?.slice(1) || 'General')}
                                                    </span>
                                                </td>
                                                <td>
                                                    {faq.status === 'active' ? (
                                                        <span className="badge bg-success">Active</span>
                                                    ) : (
                                                        <span className="badge bg-danger">Inactive</span>
                                                    )}
                                                </td>
                                                <td>{faq.order ?? 0}</td>
                                                <td>
                                                    <small className="text-muted">
                                                        {formatDate(faq.created_at)}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <Link
                                                            to={`/admin/faqs/edit/${faq.id}`}
                                                            className="btn btn-outline-warning"
                                                            title="Edit"
                                                        >
                                                            <Pencil />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-outline-${
                                                                faq.status === 'active' ? 'secondary' : 'success'
                                                            }`}
                                                            onClick={() => handleToggleStatus(faq)}
                                                            title={
                                                                faq.status === 'active'
                                                                    ? 'Deactivate'
                                                                    : 'Activate'
                                                            }
                                                        >
                                                            {faq.status === 'active' ? (
                                                                <PauseCircle />
                                                            ) : (
                                                                <PlayCircle />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger"
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    id: faq.id,
                                                                    question: faq.question,
                                                                })
                                                            }
                                                            title="Delete"
                                                        >
                                                            <Trash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <QuestionCircle
                                                    className="text-muted"
                                                    style={{ fontSize: '3rem' }}
                                                />
                                                <h5 className="mt-3">No FAQs found</h5>
                                                <p className="text-muted">
                                                    Start creating FAQs for your customers.
                                                </p>
                                                <Link to="/admin/faqs/create" className="btn btn-primary">
                                                    <PlusCircle className="me-1" /> Add FAQ
                                                </Link>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

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
                                    <ExclamationTriangle className="me-1" /> Delete FAQ
                                </h6>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setDeleteTarget(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this FAQ?</p>
                                <p className="fw-bold">{deleteTarget.question}</p>
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
        </>
    );
};

export default Faqs;