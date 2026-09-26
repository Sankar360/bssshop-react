// src/pages/admin/product_categories/ProductCategoryCreate.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Save, ArrowLeft, ExclamationCircleFill } from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';
import { IconPicker, CategoryPreview } from './IconPicker';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';

const ProductCategoryCreate = () => {
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
    const [submitting, setSubmitting] = useState(false);

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
            const res = await fetch(`${API_BASE}/product-categories/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
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
                showToast('Category created successfully', 'success');
                setTimeout(() => navigate('/admin/product-categories'), 600);
            } else {
                showToast(data.message || 'Failed to create category', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

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
                        <PlusCircle className="me-2" /> Add Product Category
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
                                    placeholder="e.g. Electronics"
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
                                <small className="text-muted">
                                    Visit{' '}
                                    <a
                                        href="https://icons.getbootstrap.com/"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Bootstrap Icons
                                    </a>{' '}
                                    for icon names
                                </small>
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
                                    placeholder="0"
                                />
                                {errors.item_count && (
                                    <div className="invalid-feedback">{errors.item_count}</div>
                                )}
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Sort Order</label>
                                <input
                                    type="number"
                                    name="sort_order"
                                    className={`form-control ${errors.sort_order ? 'is-invalid' : ''}`}
                                    value={form.sort_order}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                                {errors.sort_order && (
                                    <div className="invalid-feedback">{errors.sort_order}</div>
                                )}
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
                                {errors.is_active && (
                                    <div className="invalid-feedback">{errors.is_active}</div>
                                )}
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
                                placeholder="e.g. /category/electronics"
                            />
                            {errors.link && (
                                <div className="invalid-feedback">{errors.link}</div>
                            )}
                            <small className="text-muted">
                                Full URL or relative path for the category page
                            </small>
                        </div>

                        {/* Live Preview */}
                        <div className="row mt-4">
                            <div className="col-md-6">
                                <CategoryPreview
                                    name={form.name}
                                    icon={form.icon}
                                    itemCount={form.item_count}
                                />
                            </div>
                            <div className="col-md-6">
                                <div className="alert alert-info">
                                    <ExclamationCircleFill className="me-1" />
                                    <strong>Preview:</strong> Changes update in real-time.
                                </div>
                            </div>
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
                                        <Save className="me-1" /> Save Category
                                    </>
                                )}
                            </button>
                            <Link to="/admin/product-categories" className="btn btn-secondary ms-2">
                                <ArrowLeft className="me-1" /> Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            <IconPicker
                selected={form.icon}
                onSelect={(icon) => setForm((f) => ({ ...f, icon }))}
            />
        </>
    );
};

export default ProductCategoryCreate;