// src/pages/admin/Blog.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Newspaper, Printer, Download, PlusCircle, Search, XCircle,
    ListUl, Image as ImageIcon, Eye, EyeSlash, Pencil, Trash,
    CheckCircle, ExclamationTriangle,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';
import API_URL from '../../../api/config';                             // ← add
import { productImage as imageUrl } from '../../../utils/productImage'; // ← use shared hel

const API_BASE = API_URL + '/admin';                                    // ← absolute, no env var
const getToken = () => localStorage.getItem('auth_token') || '';
const authHeaders = () => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
});

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */
const formatDate = (str) =>
    str
        ? new Date(str).toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '—';

const truncate = (str, n = 50) =>
    str ? (str.length > n ? `${str.slice(0, n)}...` : str) : '';

const statusBadgeClass = (status) =>
    ({
        published: 'success',
        draft: 'warning',
        archived: 'secondary',
    }[status] || 'secondary');

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const Blog = () => {
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
        total_views: 0,
    });
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        status: 'all',
    });

    // Delete modal
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

    /* -------------------------------------------------------------- */
    /*  Fetch list + stats                                             */
    /* -------------------------------------------------------------- */
    const fetchBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({
                search: filters.search || '',
                category: filters.category || 'all',
                status: filters.status || 'all',
            }).toString();

            const res = await fetch(`${API_BASE}/blog?${qs}`, {
                headers: authHeaders(),
            });
            const data = await res.json();

            if (data.success) {
                // Supports { data: { blogs, stats, categories, total_count } }
                // OR flat { data: [...], stats, categories, total_count }
                const payload = data.data || {};
                const list = Array.isArray(payload) ? payload : payload.blogs || [];
                setBlogs(list);
                setStats(
                    payload.stats ||
                        data.stats || {
                            total: list.length,
                            published: list.filter((b) => b.status === 'published').length,
                            draft: list.filter((b) => b.status === 'draft').length,
                            total_views: list.reduce((sum, b) => sum + (b.views || 0), 0),
                        }
                );
                setCategories(payload.categories || data.categories || []);
                setTotalCount(payload.total_count ?? data.total_count ?? list.length);
            } else {
                showToast(data.message || 'Failed to load blog posts', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load blog posts', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    /* -------------------------------------------------------------- */
    /*  Toggle publish/draft                                           */
    /* -------------------------------------------------------------- */
    const handleToggleStatus = async (blog) => {
        const newStatus = blog.status === 'published' ? 'draft' : 'published';
        const action = newStatus === 'published' ? 'publish' : 'unpublish';

        if (!window.confirm(`Are you sure you want to ${action} "${blog.title}"?`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/blog/toggle-status/${blog.id}`, {
                method: 'POST',
                headers: authHeaders(),
            });
            const data = await res.json();

            if (data.success) {
                showToast(data.message || `Post ${action}ed successfully`, 'success');
                fetchBlogs();
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
            const res = await fetch(`${API_BASE}/blog/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const data = await res.json();

            if (data.success) {
                showToast(data.message || 'Post deleted successfully', 'success');
                setDeleteTarget(null);
                fetchBlogs();
            } else {
                showToast(data.message || 'Failed to delete post', 'error');
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
        fetchBlogs();
    };

    const handleFilterReset = () => {
        setFilters({ search: '', category: 'all', status: 'all' });
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
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border: none;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .stat-icon { font-size: 2.5rem; opacity: 0.5; }
            `}</style>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Newspaper className="text-primary me-2" /> Blog Management
                </h2>
                <div>
                    <button
                        className="btn btn-outline-secondary me-2"
                        onClick={() => window.print()}
                    >
                        <Printer className="me-1" /> Print
                    </button>
                    <button
                        className="btn btn-outline-primary me-2"
                        onClick={() => window.open(`${API_BASE}/blog/export`, '_blank')}
                    >
                        <Download className="me-1" /> Export
                    </button>
                    <Link to="/admin/blog/create" className="btn btn-primary">
                        <PlusCircle className="me-1" /> Create Post
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="row mb-4">
                {[
                    { label: 'Total Posts', value: stats.total, icon: <Newspaper />, cls: 'primary' },
                    { label: 'Published', value: stats.published, icon: <CheckCircle />, cls: 'success' },
                    { label: 'Drafts', value: stats.draft, icon: <Pencil />, cls: 'warning' },
                    {
                        label: 'Total Views',
                        value: Number(stats.total_views || 0).toLocaleString(),
                        icon: <Eye />,
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
                        <div className="col-md-4">
                            <label htmlFor="search" className="form-label">Search</label>
                            <div className="input-group">
                                <span className="input-group-text"><Search /></span>
                                <input
                                    type="text"
                                    id="search"
                                    name="search"
                                    className="form-control"
                                    placeholder="Title, Author..."
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="category" className="form-label">Category</label>
                            <select
                                className="form-select"
                                id="category"
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="all">All Categories</option>
                                {categories.map((cat) => {
                                    const value = typeof cat === 'string' ? cat : cat?.category;
                                    if (!value) return null;
                                    const label = value.charAt(0).toUpperCase() + value.slice(1);
                                    return (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select
                                className="form-select"
                                id="status"
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="all">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button type="submit" className="btn btn-primary w-100 me-2">
                                <Search />
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary w-100"
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
                        <ListUl className="me-2" /> All Blog Posts
                        <span className="badge bg-primary rounded-pill ms-2">{totalCount}</span>
                    </h5>
                    <span className="text-muted small">Showing {totalCount} posts</span>
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
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Author</th>
                                        <th>Views</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th width="200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blogs.length > 0 ? (
                                        blogs.map((blog, index) => (
                                            <tr key={blog.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {blog.image ? (
                                                            <img
                                                                src={imageUrl(blog.image)}
                                                                alt=""
                                                                style={{
                                                                    width: 40,
                                                                    height: 40,
                                                                    objectFit: 'cover',
                                                                    borderRadius: 4,
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    width: 40,
                                                                    height: 40,
                                                                    background: '#f0f0f0',
                                                                    borderRadius: 4,
                                                                    marginRight: 10,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <ImageIcon className="text-muted" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <strong>{blog.title}</strong>
                                                            <br />
                                                            <small className="text-muted">
                                                                {truncate(blog.excerpt, 50)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-info">
                                                        {blog.category?.charAt(0).toUpperCase() +
                                                            blog.category?.slice(1)}
                                                    </span>
                                                </td>
                                                <td>{blog.author || 'Admin'}</td>
                                                <td>
                                                    <span className="badge bg-secondary">
                                                        <Eye /> {Number(blog.views || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${statusBadgeClass(blog.status)}`}>
                                                        {blog.status?.charAt(0).toUpperCase() +
                                                            blog.status?.slice(1)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {formatDate(blog.created_at)}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <Link
                                                            to={`/admin/blog/edit/${blog.id}`}
                                                            className="btn btn-outline-warning"
                                                            title="Edit"
                                                        >
                                                            <Pencil />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-outline-${
                                                                blog.status === 'published'
                                                                    ? 'secondary'
                                                                    : 'success'
                                                            }`}
                                                            onClick={() => handleToggleStatus(blog)}
                                                            title={
                                                                blog.status === 'published'
                                                                    ? 'Unpublish'
                                                                    : 'Publish'
                                                            }
                                                        >
                                                            {blog.status === 'published' ? (
                                                                <EyeSlash />
                                                            ) : (
                                                                <Eye />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger"
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    id: blog.id,
                                                                    name: blog.title,
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
                                            <td colSpan="8" className="text-center py-5">
                                                <Newspaper
                                                    className="text-muted"
                                                    style={{ fontSize: '3rem' }}
                                                />
                                                <h5 className="mt-3">No blog posts found</h5>
                                                <p className="text-muted">
                                                    Start creating your first blog post.
                                                </p>
                                                <Link
                                                    to="/admin/blog/create"
                                                    className="btn btn-primary"
                                                >
                                                    <PlusCircle className="me-1" /> Create Post
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

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{ background: 'rgba(0,0,0,.5)' }}
                        onClick={() => setDeleteTarget(null)}
                    >
                        <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-content">
                                <div className="modal-header bg-danger text-white">
                                    <h6 className="modal-title">
                                        <ExclamationTriangle className="me-1" /> Delete Post
                                    </h6>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setDeleteTarget(null)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <p>
                                        Are you sure you want to delete{' '}
                                        <strong>{deleteTarget.name}</strong>?
                                    </p>
                                    <p className="text-muted small">
                                        This action cannot be undone.
                                    </p>
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
                </>
            )}
        </>
    );
};

export default Blog;