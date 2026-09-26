// src/pages/admin/product_categories/ProductCategoryEdit.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PencilSquare, Save, ArrowLeft, Trash, ExclamationTriangle,
    InfoCircle,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';
import { IconPicker, CategoryPreview } from './IconPicker';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const ProductCategoryEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        icon: 'bi-box',
        item_count: 0,
        sort_order: 0,
        is_active: 1,
        link: '#',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load                                                           */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/product-categories/edit/${id}`, {
                    headers: authHeaders(false),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const c = data.data.category || data.data;
                    setForm({
                        name: c.name || '',
                        icon: c.icon || 'bi-box',
                        item_count: c.item_count ?? 0,
                        sort_order: c.sort_order ?? 0,
                        is_active: Number(c.is_active ?? 1),
                        link: c.link || '#',
                    });
                } else {
                    showToast('Category not found', 'error');
                    setTimeout(() => navigate('/admin/product-categories'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load category', 'error');
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
            const res = await fetch(`${API_BASE}/product-categories/update/${id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    ...form,
                    is_active: Number(form.is_active),
                    item_count: Number(form.item_count),
                    sort_order: Number(form.sort_order),
                }),
            });

            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the validation errors.', 'error');
                return;
            }

            const data = await res.json();
            if (data.success) {
                showToast('Category updated successfully', 'success');
                setTimeout(() => navigate('/admin/product-categories'), 600);
            } else {
                showToast(data.message || 'Failed to update category', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/product-categories/delete/${id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Category deleted successfully', 'success');
                setTimeout(() => navigate('/admin/product-categories'), 600);
            } else {
                showToast(data.message || 'Failed to delete category', 'error');
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
                .category-card {
                    transition: transform .3s ease, box-shadow .3s ease;
                    background: #f8f9fa;
                }
                .category-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,.1);
                }
                .badge.bg-light {
                    cursor: pointer;
                    transition: all .2s ease;
                }
                .badge.bg-light:hover {
                    background: #e9ecef !important;
                    transform: scale(1.05);
                }
            `}</style>

            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">
                        <PencilSquare className="me-2" /> Edit Product Category
                    </h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Category Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.name && (
                                    <div className="invalid-feedback">{errors.name}</div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Icon (Bootstrap Icon)</label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className={`bi ${form.icon || 'bi-box'}`}></i>
                                    </span>
                                    <input
                                        type="text"
                                        name="icon"
                                        className={`form-control ${errors.icon ? 'is-invalid' : ''}`}
                                        value={form.icon}
                                        onChange={handleChange}
                                        placeholder="e.g. bi-laptop"
                                    />
                                </div>
                                {errors.icon && (
                                    <div className="invalid-feedback d-block">{errors.icon}</div>
                                )}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Item Count</label>
                                <input
                                    type="number"
                                    name="item_count"
                                    className={`form-control ${errors.item_count ? 'is-invalid' : ''}`}
                                    value={form.item_count}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Sort Order</label>
                                <input
                                    type="number"
                                    name="sort_order"
                                    className={`form-control ${errors.sort_order ? 'is-invalid' : ''}`}
                                    value={form.sort_order}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Status</label>
                                <select
                                    className={`form-select ${errors.is_active ? 'is-invalid' : ''}`}
                                    name="is_active"
                                    value={form.is_active}
                                    onChange={handleChange}
                                >
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Link</label>
                            <input
                                type="text"
                                name="link"
                                className={`form-control ${errors.link ? 'is-invalid' : ''}`}
                                value={form.link}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mt-3">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="me-1" /> Update Category
                                    </>
                                )}
                            </button>
                            <Link
                                to="/admin/product-categories"
                                className="btn btn-secondary ms-2"
                            >
                                <ArrowLeft className="me-1" /> Cancel
                            </Link>
                            <button
                                type="button"
                                className="btn btn-danger float-end"
                                onClick={() => setShowDelete(true)}
                            >
                                <Trash className="me-1" /> Delete Category
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Live Preview */}
            <div className="card mt-4">
                <div className="card-header">
                    <h6 className="mb-0">
                        <InfoCircle className="me-1" /> Live Preview
                    </h6>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <CategoryPreview
                                name={form.name}
                                icon={form.icon}
                                itemCount={form.item_count}
                            />
                        </div>
                        <div className="col-md-6">
                            <div className="alert alert-info">
                                <InfoCircle className="me-1" />
                                <strong>Preview:</strong> Changes update in real-time.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <IconPicker
                selected={form.icon}
                onSelect={(icon) => setForm((f) => ({ ...f, icon }))}
            />

            {/* Delete Confirmation Modal */}
            {showDelete && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setShowDelete(false)}
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
                                    onClick={() => setShowDelete(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this category?</p>
                                <p className="text-muted small">
                                    All of its subcategories will be deleted too. This action
                                    cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowDelete(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
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
                                            <Trash className="me-1" /> Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductCategoryEdit;