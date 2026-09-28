// src/pages/admin/menus/MenuForm.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PlusCircle, PencilSquare, ArrowLeft, CheckCircle, ArrowUp, ArrowDown,
    ExclamationCircleFill,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const MenuForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        menu_name: '',
        url: '',
        display_header: false,
        display_footer: false,
        sort_order: 1,
        status: true,
    });
    const [errors, setErrors] = useState({});
    const [displayError, setDisplayError] = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load for edit                                                  */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/menus/edit/${id}`, {
                    headers: authHeaders(false),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const m = data.data.menu || data.data;
                    setForm({
                        menu_name: m.menu_name || '',
                        url: m.url || '',
                        display_header: m.display_header == 1,
                        display_footer: m.display_footer == 1,
                        sort_order: m.sort_order ?? 1,
                        status: m.status == 1,
                    });
                } else {
                    showToast('Menu not found', 'error');
                    setTimeout(() => navigate('/admin/menus'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load menu', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isEdit, navigate]);

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newVal = type === 'checkbox' ? checked : value;
        setForm((f) => ({ ...f, [name]: newVal }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));

        if (name === 'display_header' || name === 'display_footer') {
            if (checked) setDisplayError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation: at least one display option
        if (!form.display_header && !form.display_footer) {
            setDisplayError('At least one display option must be selected.');
            showToast('Please select at least one display option', 'error');
            return;
        }

        setSubmitting(true);
        setErrors({});

        const url = isEdit
            ? `${API_BASE}/menus/update/${id}`
            : `${API_BASE}/menus/store`;

        const payload = {
            menu_name: form.menu_name,
            url: form.url,
            display_header: form.display_header ? 1 : 0,
            display_footer: form.display_footer ? 1 : 0,
            sort_order: Number(form.sort_order) || 0,
            status: form.status ? 1 : 0,
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });

            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the validation errors below.', 'error');
                return;
            }

            const data = await res.json();
            if (data.success) {
                showToast(
                    isEdit ? 'Menu updated successfully!' : 'Menu created successfully!',
                    'success'
                );
                setTimeout(() => navigate('/admin/menus'), 600);
            } else {
                showToast(data.message || 'Failed to save menu', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
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
                .form-switch .form-check-input {
                    width: 3em; height: 1.5em; cursor: pointer;
                }
                .form-switch .form-check-input:checked {
                    background-color: #0d6efd; border-color: #0d6efd;
                }
                .menu-card-header {
                    background: linear-gradient(90deg, #00dafb 0%, #000113 100%);
                    color: white;
                    border-bottom: none;
                }
                .btn-primary {
                    transition: all .3s ease;
                }
                .btn-primary:hover {
                    opacity: .9;
                    transform: translateY(-1px);
                }
            `}</style>

            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header menu-card-header">
                            <h5 className="mb-0">
                                {isEdit ? (
                                    <>
                                        <PencilSquare className="me-2" /> Edit Menu
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="me-2" /> Add Menu
                                    </>
                                )}
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit} noValidate>
                                {/* Menu Name */}
                                <div className="mb-3">
                                    <label htmlFor="menu_name" className="form-label fw-bold">
                                        Menu Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="menu_name"
                                        name="menu_name"
                                        className={`form-control ${errors.menu_name ? 'is-invalid' : ''}`}
                                        value={form.menu_name}
                                        onChange={handleChange}
                                        placeholder="Enter menu name (e.g., Home, Blog, Contact)"
                                        required
                                    />
                                    {errors.menu_name && (
                                        <div className="invalid-feedback">{errors.menu_name}</div>
                                    )}
                                    <small className="text-muted">
                                        Display name for the menu item.
                                    </small>
                                </div>

                                {/* URL */}
                                <div className="mb-3">
                                    <label htmlFor="url" className="form-label fw-bold">
                                        URL / Link <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="url"
                                        name="url"
                                        className={`form-control ${errors.url ? 'is-invalid' : ''}`}
                                        value={form.url}
                                        onChange={handleChange}
                                        placeholder="Enter URL (e.g., /, /blog, /contact)"
                                        required
                                    />
                                    {errors.url && (
                                        <div className="invalid-feedback">{errors.url}</div>
                                    )}
                                    <small className="text-muted">
                                        Internal links start with / (e.g., /blog). External links
                                        start with http:// or https://
                                    </small>
                                </div>

                                {/* Display Options */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        Display Options <span className="text-danger">*</span>
                                    </label>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="display_header"
                                                    name="display_header"
                                                    checked={form.display_header}
                                                    onChange={handleChange}
                                                />
                                                <label
                                                    className="form-check-label fw-bold"
                                                    htmlFor="display_header"
                                                >
                                                    <ArrowUp className="text-primary me-1" />
                                                    Display in Header
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="display_footer"
                                                    name="display_footer"
                                                    checked={form.display_footer}
                                                    onChange={handleChange}
                                                />
                                                <label
                                                    className="form-check-label fw-bold"
                                                    htmlFor="display_footer"
                                                >
                                                    <ArrowDown className="text-success me-1" />
                                                    Display in Footer
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <small className="text-muted">
                                        Select at least one display option.
                                    </small>
                                    {displayError && (
                                        <div className="text-danger mt-1">{displayError}</div>
                                    )}
                                </div>

                                {/* Sort Order */}
                                <div className="mb-3">
                                    <label htmlFor="sort_order" className="form-label fw-bold">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        id="sort_order"
                                        name="sort_order"
                                        min="0"
                                        className={`form-control ${errors.sort_order ? 'is-invalid' : ''}`}
                                        value={form.sort_order}
                                        onChange={handleChange}
                                        placeholder="Enter sort order (numeric)"
                                    />
                                    {errors.sort_order && (
                                        <div className="invalid-feedback">{errors.sort_order}</div>
                                    )}
                                    <small className="text-muted">
                                        Lower numbers appear first. Default: 1
                                    </small>
                                </div>

                                {/* Status */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Status</label>
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="status"
                                            name="status"
                                            checked={form.status}
                                            onChange={handleChange}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor="status"
                                        >
                                            <span className="fw-bold">
                                                {form.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </label>
                                    </div>
                                    <small className="text-muted">
                                        Active menus are displayed on the frontend.
                                    </small>
                                </div>

                                {/* Actions */}
                                <div className="d-flex gap-2">
                                    <Link to="/admin/menus" className="btn btn-secondary">
                                        <ArrowLeft className="me-1" /> Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{
                                            background:
                                                'linear-gradient(90deg, #00dafb 0%, #000113 100%)',
                                            border: 'none',
                                        }}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Saving...
                                            </>
                                        ) : isEdit ? (
                                            <>
                                                <CheckCircle className="me-1" /> Update Menu
                                            </>
                                        ) : (
                                            <>
                                                <PlusCircle className="me-1" /> Save Menu
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MenuForm;