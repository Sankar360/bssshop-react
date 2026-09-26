// src/pages/admin/home_banner/HomeBanner.jsx
import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Save } from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const DEFAULTS = {
    badge_text: 'Premium Collection',
    is_active: 1,
    title_line1: 'Shop with',
    title_line2: 'Style & Elegance',
    subtitle: 'Discover our curated collection of premium products',
    button_text: 'Explore All Products',
    button_link: '#products',
    button_icon: 'bi-arrow-right',
};

const HomeBanner = () => {
    const [form, setForm] = useState(DEFAULTS);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load                                                           */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/home-banner`, {
                    headers: authHeaders(false),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const b = data.data.banner || data.data;
                    setForm({
                        badge_text: b.badge_text ?? DEFAULTS.badge_text,
                        is_active: Number(b.is_active ?? DEFAULTS.is_active),
                        title_line1: b.title_line1 ?? DEFAULTS.title_line1,
                        title_line2: b.title_line2 ?? DEFAULTS.title_line2,
                        subtitle: b.subtitle ?? DEFAULTS.subtitle,
                        button_text: b.button_text ?? DEFAULTS.button_text,
                        button_link: b.button_link ?? DEFAULTS.button_link,
                        button_icon: b.button_icon ?? DEFAULTS.button_icon,
                    });
                } else {
                    showToast(data.message || 'Failed to load banner settings', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load banner settings', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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
            const res = await fetch(`${API_BASE}/home-banner/update`, {
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
                showToast('Banner settings saved successfully', 'success');
            } else {
                showToast(data.message || 'Failed to save banner settings', 'error');
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
        <div className="card">
            <div className="card-header">
                <h5 className="mb-0">
                    <ImageIcon className="me-2" /> Home Banner Settings
                </h5>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Badge Text</label>
                            <input
                                type="text"
                                className={`form-control ${errors.badge_text ? 'is-invalid' : ''}`}
                                name="badge_text"
                                value={form.badge_text}
                                onChange={handleChange}
                                placeholder="e.g. Premium Collection"
                            />
                            {errors.badge_text && (
                                <div className="invalid-feedback">{errors.badge_text}</div>
                            )}
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label">Status</label>
                            <select
                                className={`form-select ${errors.is_active ? 'is-invalid' : ''}`}
                                name="is_active"
                                value={form.is_active}
                                onChange={handleChange}
                            >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </select>
                            {errors.is_active && (
                                <div className="invalid-feedback">{errors.is_active}</div>
                            )}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Title Line 1</label>
                            <input
                                type="text"
                                className={`form-control ${errors.title_line1 ? 'is-invalid' : ''}`}
                                name="title_line1"
                                value={form.title_line1}
                                onChange={handleChange}
                                placeholder="e.g. Shop with"
                            />
                            {errors.title_line1 && (
                                <div className="invalid-feedback">{errors.title_line1}</div>
                            )}
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label">Title Line 2</label>
                            <input
                                type="text"
                                className={`form-control ${errors.title_line2 ? 'is-invalid' : ''}`}
                                name="title_line2"
                                value={form.title_line2}
                                onChange={handleChange}
                                placeholder="e.g. Style & Elegance"
                            />
                            {errors.title_line2 && (
                                <div className="invalid-feedback">{errors.title_line2}</div>
                            )}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Subtitle</label>
                        <input
                            type="text"
                            className={`form-control ${errors.subtitle ? 'is-invalid' : ''}`}
                            name="subtitle"
                            value={form.subtitle}
                            onChange={handleChange}
                            placeholder="Enter subtitle"
                        />
                        {errors.subtitle && (
                            <div className="invalid-feedback">{errors.subtitle}</div>
                        )}
                    </div>

                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Button Text</label>
                            <input
                                type="text"
                                className={`form-control ${errors.button_text ? 'is-invalid' : ''}`}
                                name="button_text"
                                value={form.button_text}
                                onChange={handleChange}
                                placeholder="e.g. Explore All Products"
                            />
                            {errors.button_text && (
                                <div className="invalid-feedback">{errors.button_text}</div>
                            )}
                        </div>

                        <div className="col-md-4 mb-3">
                            <label className="form-label">Button Link</label>
                            <input
                                type="text"
                                className={`form-control ${errors.button_link ? 'is-invalid' : ''}`}
                                name="button_link"
                                value={form.button_link}
                                onChange={handleChange}
                                placeholder="e.g. #products"
                            />
                            {errors.button_link && (
                                <div className="invalid-feedback">{errors.button_link}</div>
                            )}
                        </div>

                        <div className="col-md-4 mb-3">
                            <label className="form-label">Button Icon (Bootstrap Icon)</label>
                            <input
                                type="text"
                                className={`form-control ${errors.button_icon ? 'is-invalid' : ''}`}
                                name="button_icon"
                                value={form.button_icon}
                                onChange={handleChange}
                                placeholder="e.g. bi-arrow-right"
                            />
                            {errors.button_icon && (
                                <div className="invalid-feedback">{errors.button_icon}</div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="me-1" /> Save Settings
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default HomeBanner;