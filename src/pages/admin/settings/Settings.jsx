// src/pages/admin/settings/Settings.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Gear, Save } from 'react-bootstrap-icons';
import { showToast } from '../../../utils/toast';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

/* ------------------------------------------------------------------ */
/*  Section definitions — MUST match Laravel getSettingSections()      */
/* ------------------------------------------------------------------ */
const SECTIONS = [
    {
        key: 'general',
        title: 'General',
        icon: 'bi bi-gear',
        fields: {
            site_name:        { label: 'Site Name',        type: 'text',     default: 'BSSShop' },
            site_description: { label: 'Site Description', type: 'textarea', default: '' },
            site_email:       { label: 'Site Email',       type: 'email',    default: '' },
            site_phone:       { label: 'Site Phone',       type: 'text',     default: '' },
            site_address:     { label: 'Site Address',     type: 'textarea', default: '' },
        },
    },
    {
        key: 'branding',
        title: 'Branding',
        icon: 'bi bi-image',
        fields: {
            favicon: {
                label: 'Favicon',
                type: 'file',
                description: 'Square PNG/ICO recommended, 32x32 or 64x64.',
            },
            logo: { label: 'Logo', type: 'file' },
        },
    },
    {
        key: 'store',
        title: 'Store Settings',
        icon: 'bi bi-shop',
        fields: {
            store_currency: {
                label: 'Currency',
                type: 'select',
                options: { USD: 'USD ($)', EUR: 'EUR (€)', GBP: 'GBP (£)', INR: 'INR (₹)' },
                default: 'USD',
            },
            store_tax:           { label: 'Tax Rate (%)',            type: 'number', default: '10' },
            store_shipping:      { label: 'Shipping Cost',           type: 'number', default: '5.99' },
            store_free_shipping: { label: 'Free Shipping Threshold', type: 'number', default: '50' },
        },
    },
    /* =================== PAYMENT SECTION =================== */
    {
        key: 'payment',
        title: 'Payment Settings',
        icon: 'bi bi-credit-card',
        fields: {
            payment_stripe_enabled:   { label: 'Enable Stripe',     type: 'checkbox', default: '0' },
            payment_stripe_key:       { label: 'Stripe Public Key', type: 'text',     default: '' },
            payment_stripe_secret:    { label: 'Stripe Secret Key', type: 'password', default: '' },
            payment_ideal_enabled:    { label: 'Enable iDEAL',      type: 'checkbox', default: '0' },

            payment_razorpay_enabled: {
                label: 'Enable Razorpay',
                type: 'checkbox',
                default: '0',
                description: 'Enable Razorpay payment gateway for Indian customers',
            },
            payment_razorpay_key: {
                label: 'Razorpay Key ID',
                type: 'text',
                default: '',
                description: 'Your Razorpay Key ID from Razorpay Dashboard',
            },
            payment_razorpay_secret: {
                label: 'Razorpay Key Secret',
                type: 'password',
                default: '',
                description: 'Your Razorpay Key Secret from Razorpay Dashboard',
            },
        },
    },
    /* ======================================================= */
    {
        key: 'social',
        title: 'Social Media',
        icon: 'bi bi-share',
        fields: {
            social_facebook:  { label: 'Facebook URL',  type: 'url', default: '' },
            social_twitter:   { label: 'Twitter URL',   type: 'url', default: '' },
            social_instagram: { label: 'Instagram URL', type: 'url', default: '' },
            social_youtube:   { label: 'YouTube URL',   type: 'url', default: '' },
            social_linkedin:  { label: 'LinkedIn URL',  type: 'url', default: '' },
        },
    },
    {
        key: 'email',
        title: 'Email Settings',
        icon: 'bi bi-envelope',
        fields: {
            email_protocol: {
                label: 'Protocol',
                type: 'select',
                options: { mail: 'Mail', smtp: 'SMTP' },
                default: 'mail',
            },
            email_smtp_host: { label: 'SMTP Host',     type: 'text',     default: '' },
            email_smtp_port: { label: 'SMTP Port',     type: 'number',   default: '587' },
            email_smtp_user: { label: 'SMTP Username', type: 'text',     default: '' },
            email_smtp_pass: { label: 'SMTP Password', type: 'password', default: '' },
        },
    },
    {
        key: 'notifications',
        title: 'Notifications',
        icon: 'bi bi-bell',
        fields: {
            order_notifications: { label: 'Order Notifications', type: 'checkbox', default: '1' },
            newsletter_enabled:  { label: 'Newsletter',          type: 'checkbox', default: '1' },
        },
    },
    {
        key: 'seo',
        title: 'SEO Settings',
        icon: 'bi bi-search',
        fields: {
            seo_meta_title:       { label: 'Default Meta Title',       type: 'text',     default: 'BSSShop - Online Store' },
            seo_meta_description: { label: 'Default Meta Description', type: 'textarea', default: '' },
            seo_meta_keywords:    { label: 'Default Meta Keywords',    type: 'text',     default: '' },
        },
    },
];

const Settings = () => {
    const fileRefs = useRef({});
    const [settings, setSettings] = useState({});
    const [files, setFiles] = useState({});
    const [filePreviews, setFilePreviews] = useState({});
    const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load current settings                                          */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/settings`, { headers: authHeaders(false) });
                const data = await res.json();
                if (data.success) {
                    const loaded = {};
                    const list = data.data?.settings || data.data || {};
                    if (Array.isArray(list)) {
                        list.forEach((row) => { loaded[row.key] = row.value; });
                    } else {
                        Object.assign(loaded, list);
                    }
                    setSettings(loaded);
                } else {
                    showToast(data.message || 'Failed to load settings', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load settings', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const handleChange = (key, value) => {
        setSettings((s) => ({ ...s, [key]: value }));
    };

    const handleFile = (key, file) => {
        if (!file) return;
        setFiles((f) => ({ ...f, [key]: file }));
        setFilePreviews((p) => ({ ...p, [key]: URL.createObjectURL(file) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const fd = new FormData();

        // Send every known field (from all sections) so unchecked
        // checkboxes still get submitted as '0'
        SECTIONS.forEach((section) => {
            Object.entries(section.fields).forEach(([key, field]) => {
                if (field.type === 'file') return;

                const v = settings[key] ?? field.default ?? '';

                if (v === undefined || v === null) {
                    fd.append(key, '');
                } else if (typeof v === 'boolean') {
                    fd.append(key, v ? '1' : '0');
                } else {
                    fd.append(key, String(v));
                }
            });
        });

        // Append uploaded files
        Object.entries(files).forEach(([k, file]) => {
            if (file instanceof File) fd.append(k, file);
        });

        try {
            const res = await fetch(`${API_BASE}/settings/update`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: fd,
            });
            const data = await res.json();
            if (data.success) {
                showToast('Settings saved successfully', 'success');
                setFiles({});
                setFilePreviews({});
            } else {
                if (data.errors) {
                    const first = Object.values(data.errors).flat()[0];
                    showToast(first || data.message || 'Validation failed', 'error');
                } else {
                    showToast(data.message || 'Failed to save settings', 'error');
                }
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const scrollToSection = (key) => {
        setActiveSection(key);
        const el = document.getElementById(`section-${key}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* -------------------------------------------------------------- */
    /*  Field renderer                                                 */
    /* -------------------------------------------------------------- */
    const renderField = (fieldKey, field) => {
        const value = settings[fieldKey] ?? field.default ?? '';

        switch (field.type) {
            case 'text':
            case 'email':
            case 'url':
                return (
                    <input
                        type={field.type}
                        className="form-control"
                        id={fieldKey}
                        value={value}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id={fieldKey}
                        value={value}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        className="form-control"
                        id={fieldKey}
                        rows="3"
                        value={value}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                    />
                );
            case 'password':
                return (
                    <>
                        <input
                            type="password"
                            className="form-control"
                            id={fieldKey}
                            value={value}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            autoComplete="new-password"
                        />
                        <div className="form-text">Leave empty to keep current value.</div>
                    </>
                );
            case 'checkbox':
                return (
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={fieldKey}
                            checked={value == '1' || value === true}
                            onChange={(e) => handleChange(fieldKey, e.target.checked ? '1' : '0')}
                        />
                        <label className="form-check-label" htmlFor={fieldKey}>
                            Enable
                        </label>
                    </div>
                );
            case 'select':
                return (
                    <select
                        className="form-select"
                        id={fieldKey}
                        value={value}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                    >
                        {Object.entries(field.options || {}).map(([k, label]) => (
                            <option key={k} value={k}>{label}</option>
                        ))}
                    </select>
                );
            case 'file': {
                const currentFile = settings[fieldKey] || '';

                const buildUrl = (raw) => {
                    if (!raw) return '';
                    if (/^(https?:|blob:|data:)/i.test(raw)) return raw;
                    const clean = String(raw).replace(/^\/+/, '').replace(/^storage\//i, '');
                    return `/storage/${clean}`;
                };

                const preview = filePreviews[fieldKey] || buildUrl(currentFile);
                const isFavicon = fieldKey.toLowerCase().includes('favicon');

                return (
                    <>
                        <input
                            type="file"
                            className="form-control"
                            id={fieldKey}
                            accept="image/*"
                            ref={(el) => (fileRefs.current[fieldKey] = el)}
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFile(fieldKey, f);
                            }}
                        />
                        {preview && (
                            <div className="mt-2">
                                <img
                                    src={preview}
                                    alt={fieldKey}
                                    onError={(e) => {
                                        console.warn('Failed to load image:', preview);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                    style={
                                        isFavicon
                                            ? { width: 32, height: 32, padding: 2, border: '1px solid #ddd', borderRadius: 4 }
                                            : { maxWidth: 100, maxHeight: 100, borderRadius: 4 }
                                    }
                                />
                                <br />
                                <small className="text-muted">
                                    {isFavicon
                                        ? 'Current favicon'
                                        : `Current file: ${currentFile.split('/').pop()}`}
                                </small>
                            </div>
                        )}
                    </>
                );
            }
            default:
                return null;
        }
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
            </div>
        );
    }

    return (
        <>
            <style>{`
                .settings-nav {
                    border: none;
                    border-radius: 0 !important;
                    padding: 12px 20px;
                    transition: all .3s ease;
                    cursor: pointer;
                }
                .settings-nav:hover { background: #f8f9fc; }
                .settings-nav.active { background: #4e73df; color: #fff; }
                .settings-nav i { margin-right: 10px; width: 20px; text-align: center; }
                .settings-section { scroll-margin-top: 20px; }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2><Gear className="text-primary me-2" /> Settings</h2>
            </div>

            <div className="row">
                <div className="col-md-3">
                    <div className="card">
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {SECTIONS.map((s) => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        className={`list-group-item list-group-item-action settings-nav text-start ${
                                            activeSection === s.key ? 'active' : ''
                                        }`}
                                        onClick={() => scrollToSection(s.key)}
                                    >
                                        <i className={s.icon}></i> {s.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-9">
                    <form onSubmit={handleSubmit}>
                        {SECTIONS.map((section) => (
                            <div
                                className="card mb-4 settings-section"
                                id={`section-${section.key}`}
                                key={section.key}
                            >
                                <div className="card-header">
                                    <h5 className="mb-0">
                                        <i className={section.icon}></i> {section.title}
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {Object.entries(section.fields).map(([key, field]) => (
                                        <div className="mb-3" key={key}>
                                            <label htmlFor={key} className="form-label">
                                                {field.label}
                                            </label>
                                            {renderField(key, field)}
                                            {field.description && (
                                                <div className="form-text text-muted">
                                                    {field.description}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="card">
                            <div className="card-body text-end">
                                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="me-1" /> Save All Settings
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

export default Settings;