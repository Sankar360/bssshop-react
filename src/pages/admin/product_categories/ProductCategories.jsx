// src/pages/admin/product_categories/ProductCategories.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Grid, PlusCircle, Folder, Eye, Pencil, Trash, ExclamationTriangle,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const ProductCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

    /* -------------------------------------------------------------- */
    /*  Fetch                                                          */
    /* -------------------------------------------------------------- */
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/product-categories`, {
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success) {
                const payload = data.data || {};
                const list = Array.isArray(payload) ? payload : payload.categories || [];
                setCategories(list);
            } else {
                showToast(data.message || 'Failed to load categories', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    /* -------------------------------------------------------------- */
    /*  Delete                                                         */
    /* -------------------------------------------------------------- */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`${API_BASE}/product-categories/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Category deleted', 'success');
                setDeleteTarget(null);
                fetchCategories();
            } else {
                showToast(data.message || 'Failed to delete category', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Grid className="text-primary me-2" /> Product Categories
                </h2>
                <Link to="/admin/product-categories/create" className="btn btn-primary">
                    <PlusCircle className="me-1" /> Add Category
                </Link>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-5">
                            <Folder style={{ fontSize: '4rem', color: '#dee2e6' }} />
                            <p className="text-muted mt-3">No categories found</p>
                            <Link
                                to="/admin/product-categories/create"
                                className="btn btn-primary btn-sm"
                            >
                                Create first category
                            </Link>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Icon</th>
                                        <th>Category</th>
                                        <th>Subcategories</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category, index) => {
                                        const children = category.children || [];
                                        return (
                                            <tr key={category.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <i
                                                        className={`bi ${
                                                            category.icon || 'bi-folder'
                                                        } fs-4`}
                                                    ></i>
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/admin/product-categories/view/${category.id}`}
                                                        className="text-decoration-none fw-bold"
                                                    >
                                                        {category.name}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {children.length > 0 ? (
                                                        <>
                                                            <span className="badge bg-secondary">
                                                                {children.length}
                                                            </span>
                                                            <span className="text-muted small ms-1">
                                                                {children
                                                                    .slice(0, 3)
                                                                    .map((c) => c.name)
                                                                    .join(', ')}
                                                                {children.length > 3 ? '...' : ''}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted">None</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge bg-${
                                                            category.is_active
                                                                ? 'success'
                                                                : 'secondary'
                                                        }`}
                                                    >
                                                        {category.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <Link
                                                            to={`/admin/product-categories/view/${category.id}`}
                                                            className="btn btn-info"
                                                        >
                                                            <Eye />
                                                        </Link>
                                                        <Link
                                                            to={`/admin/product-categories/edit/${category.id}`}
                                                            className="btn btn-warning"
                                                        >
                                                            <Pencil />
                                                        </Link>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    id: category.id,
                                                                    name: category.name,
                                                                })
                                                            }
                                                        >
                                                            <Trash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h6 className="modal-title">
                                    <ExclamationTriangle className="me-1" /> Delete Category
                                </h6>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setDeleteTarget(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Delete <strong>{deleteTarget.name}</strong>? All of its
                                    subcategories will be deleted too.
                                </p>
                                <p className="text-muted small">
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
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

export default ProductCategories;