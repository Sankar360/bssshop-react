// src/pages/admin/clients/ClientEdit.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PencilSquare, ArrowLeft, Eye, Person, Key, InfoCircle, ShieldCheck,
    PersonBadge, Envelope, BarChart, Lightning, ToggleOn, Cart, Trash,
    Save, XCircle, GeoAlt, QuestionCircle, ChatDots,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('auth_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const COUNTRIES = [
    { code: '', label: 'Select Country' },
    { code: 'US', label: 'United States' },
    { code: 'CA', label: 'Canada' },
    { code: 'UK', label: 'United Kingdom' },
    { code: 'DE', label: 'Germany' },
    { code: 'FR', label: 'France' },
    { code: 'AU', label: 'Australia' },
    { code: 'IN', label: 'India' },
];

const formatDate = (s) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

const avatarUrl = (path) => (!path ? '' : path.startsWith('http') ? path : `/${path}`);

const ClientEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', phone: '',
        password: '', password_confirm: '',
        role: 'user', status: 'active',
        address: '', city: '', state: '', postal_code: '', country: '',
        notes: '',
    });
    const [meta, setMeta] = useState({
        id: null, role: 'user', status: 'active',
        email_verified: 0, created_at: null, updated_at: null,
        total_orders: 0, total_spent: 0,
    });
    const [currentAvatar, setCurrentAvatar] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load                                                           */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/clients/edit/${id}`, {
                    headers: authHeaders(false),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const c = data.data;
                    setForm({
                        name: c.name || '',
                        email: c.email || '',
                        phone: c.phone || '',
                        password: '',
                        password_confirm: '',
                        role: c.role || 'user',
                        status: c.status || 'active',
                        address: c.address || '',
                        city: c.city || '',
                        state: c.state || '',
                        postal_code: c.postal_code || '',
                        country: c.country || '',
                        notes: c.notes || '',
                    });
                    setMeta({
                        id: c.id,
                        role: c.role,
                        status: c.status,
                        email_verified: c.email_verified || 0,
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                        total_orders: c.total_orders || 0,
                        total_spent: c.total_spent || 0,
                    });
                    setCurrentAvatar(c.avatar || '');
                } else {
                    showToast('Client not found', 'error');
                    setTimeout(() => navigate('/admin/clients'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load client', 'error');
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

    const handleAvatar = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (k === 'password' || k === 'password_confirm') {
                if (v) fd.append(k, v);
            } else {
                fd.append(k, v ?? '');
            }
        });
        if (avatar) fd.append('avatar', avatar);

        try {
            const res = await fetch(`${API_BASE}/clients/update/${id}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: fd,
            });

            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the validation errors below.', 'error');
                return;
            }

            const data = await res.json();
            if (data.success) {
                showToast('Client updated successfully!', 'success');
                setTimeout(() => navigate('/admin/clients'), 600);
            } else {
                showToast(data.message || 'Failed to update client', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this client? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API_BASE}/clients/delete/${id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Client deleted successfully', 'success');
                setTimeout(() => navigate('/admin/clients'), 600);
            } else {
                showToast(data.message || 'Failed to delete client', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
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

    const previewSrc = avatarPreview || (currentAvatar ? avatarUrl(currentAvatar) : '');

    return (
        <>
            <style>{`
                .form-label { font-weight: 600; }
                .card-header { background-color: #f8f9fc; border-bottom: 1px solid #e3e6f0; }
                #avatarPreview { border: 2px solid #e1e5ea; }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <PencilSquare className="text-primary me-2" /> Edit Client
                </h2>
                <div>
                    <Link to="/admin/clients" className="btn btn-outline-secondary">
                        <ArrowLeft className="me-1" /> Back to Clients
                    </Link>
                    <Link to={`/admin/clients/view/${id}`} className="btn btn-info ms-2">
                        <Eye className="me-1" /> View Profile
                    </Link>
                </div>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0"><Person className="me-1" /> Client Information</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="name" className="form-label">
                                            Full Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text" id="name" name="name"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            value={form.name} onChange={handleChange} required
                                        />
                                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="email" className="form-label">
                                            Email Address <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="email" id="email" name="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            value={form.email} onChange={handleChange} required
                                        />
                                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="phone" className="form-label">Phone Number</label>
                                        <input
                                            type="tel" id="phone" name="phone"
                                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                            value={form.phone} onChange={handleChange}
                                        />
                                        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="avatar" className="form-label">Profile Picture</label>
                                        <input
                                            type="file" id="avatar" name="avatar" accept="image/*"
                                            className={`form-control ${errors.avatar ? 'is-invalid' : ''}`}
                                            onChange={handleAvatar}
                                        />
                                        {errors.avatar && <div className="invalid-feedback">{errors.avatar}</div>}
                                        <div className="mt-2">
                                            {previewSrc ? (
                                                <>
                                                    <img
                                                        id="avatarPreview"
                                                        src={previewSrc}
                                                        alt="Avatar"
                                                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '50%' }}
                                                    />
                                                    <br />
                                                    <small className="text-muted">
                                                        {avatarPreview ? 'New preview' : 'Current avatar'}
                                                    </small>
                                                </>
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 60, height: 60, background: '#f8f9fa',
                                                        border: '2px dashed #dee2e6', borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                >
                                                    <Person className="text-muted" style={{ fontSize: '1.5rem' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Password Change */}
                                <div className="card bg-light mb-3">
                                    <div className="card-body">
                                        <h6 className="mb-3"><Key className="me-1" /> Change Password</h6>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="password" className="form-label">New Password</label>
                                                <input
                                                    type="password" id="password" name="password"
                                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                                    value={form.password} onChange={handleChange}
                                                    placeholder="Enter new password"
                                                />
                                                {errors.password && (
                                                    <div className="invalid-feedback d-block">{errors.password}</div>
                                                )}
                                                <div className="form-text text-muted">
                                                    <InfoCircle className="me-1" /> Leave blank to keep current password.
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="password_confirm" className="form-label">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password" id="password_confirm" name="password_confirm"
                                                    className={`form-control ${errors.password_confirm ? 'is-invalid' : ''}`}
                                                    value={form.password_confirm} onChange={handleChange}
                                                    placeholder="Confirm new password"
                                                />
                                                {errors.password_confirm && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.password_confirm}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <small className="text-muted">
                                            <InfoCircle className="me-1" /> Must be 8+ characters, one uppercase, one lowercase, one number, one special char.
                                        </small>
                                    </div>
                                </div>

                                {/* Role + Status */}
                                <div className="row mt-3">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="role" className="form-label">
                                            Role <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                                            id="role" name="role" value={form.role}
                                            onChange={handleChange} required
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                                        <div className="form-text text-muted">
                                            <InfoCircle className="me-1" />
                                            <span className="text-danger">Warning:</span> Changing role to admin gives full access.
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="status" className="form-label">
                                            Status <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                            id="status" name="status" value={form.status}
                                            onChange={handleChange} required
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                        <div className="form-text text-muted">
                                            <InfoCircle className="me-1" /> Inactive users cannot log in.
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="row mt-2">
                                    <div className="col-12">
                                        <h6 className="mb-3"><GeoAlt className="me-1" /> Address Information</h6>
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <label htmlFor="address" className="form-label">Street Address</label>
                                        <input
                                            type="text" className="form-control" id="address" name="address"
                                            value={form.address} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="city" className="form-label">City</label>
                                        <input
                                            type="text" className="form-control" id="city" name="city"
                                            value={form.city} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="state" className="form-label">State / Province</label>
                                        <input
                                            type="text" className="form-control" id="state" name="state"
                                            value={form.state} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="postal_code" className="form-label">Postal Code</label>
                                        <input
                                            type="text" className="form-control" id="postal_code" name="postal_code"
                                            value={form.postal_code} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <label htmlFor="country" className="form-label">Country</label>
                                        <select
                                            className="form-select" id="country" name="country"
                                            value={form.country} onChange={handleChange}
                                        >
                                            {COUNTRIES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="row mt-2">
                                    <div className="col-12 mb-3">
                                        <label htmlFor="notes" className="form-label">Notes</label>
                                        <textarea
                                            className="form-control" id="notes" name="notes" rows="3"
                                            value={form.notes} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="row mt-4">
                                    <div className="col-12">
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <Link to="/admin/clients" className="btn btn-secondary">
                                                <XCircle className="me-1" /> Cancel
                                            </Link>
                                            <div>
                                                <button
                                                    type="submit" className="btn btn-primary btn-lg me-2"
                                                    disabled={submitting}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="me-1" /> Update Client
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button" className="btn btn-danger btn-lg"
                                                    onClick={handleDelete}
                                                >
                                                    <Trash className="me-1" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-md-4">
                    <div className="card mb-3">
                        <div className="card-header">
                            <h6 className="mb-0"><BarChart className="me-1" /> Client Statistics</h6>
                        </div>
                        <div className="card-body">
                            {[
                                { label: 'Client ID', value: `#${meta.id}` },
                                { label: 'Member Since', value: formatDate(meta.created_at) },
                                { label: 'Last Updated', value: formatDate(meta.updated_at) },
                                { label: 'Total Orders', value: meta.total_orders, bold: true },
                                { label: 'Total Spent', value: `$${Number(meta.total_spent).toFixed(2)}`, primary: true },
                            ].map((row, i) => (
                                <div key={i} className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">{row.label}</span>
                                    <span className={row.bold ? 'fw-bold' : row.primary ? 'fw-bold text-primary' : ''}>
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card mb-3">
                        <div className="card-header">
                            <h6 className="mb-0"><Lightning className="me-1" /> Quick Actions</h6>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <button className="btn btn-outline-primary btn-sm" onClick={() => window.location.href = `mailto:${form.email}`}>
                                    <Envelope className="me-1" /> Send Email
                                </button>
                                <Link
                                    to={`/admin/orders?user=${id}`}
                                    className="btn btn-outline-success btn-sm"
                                >
                                    <Cart className="me-1" /> View Orders
                                </Link>
                                <button className="btn btn-outline-warning btn-sm" onClick={() => showToast('Reset password not implemented yet', 'info')}>
                                    <Key className="me-1" /> Reset Password
                                </button>
                                <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={async () => {
                                        await fetch(`${API_BASE}/clients/toggle-status/${id}`, {
                                            method: 'POST', headers: authHeaders(),
                                        });
                                        showToast('Status toggled — refresh to see change', 'success');
                                    }}
                                >
                                    <ToggleOn className="me-1" />
                                    {meta.status === 'active' ? 'Deactivate' : 'Activate'} Account
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-3">
                        <div className="card-header">
                            <h6 className="mb-0"><InfoCircle className="me-1" /> Account Info</h6>
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <ShieldCheck className="text-success me-2" />
                                <div>
                                    <strong>Account Status</strong>
                                    <p className="mb-0">
                                        <span className={`badge bg-${form.status === 'active' ? 'success' : 'danger'}`}>
                                            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <PersonBadge className="me-2" />
                                <div>
                                    <strong>User Role</strong>
                                    <p className="mb-0">
                                        <span className={`badge bg-${form.role === 'admin' ? 'warning' : 'info'}`}>
                                            {form.role.charAt(0).toUpperCase() + form.role.slice(1)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center">
                                <Envelope className="me-2" />
                                <div>
                                    <strong>Email Verified</strong>
                                    <p className="mb-0">
                                        <span className={`badge bg-${meta.email_verified ? 'success' : 'warning'}`}>
                                            {meta.email_verified ? 'Yes' : 'No'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body text-center">
                            <QuestionCircle className="text-primary" style={{ fontSize: '2rem' }} />
                            <h6 className="mt-2">Need Help?</h6>
                            <p className="text-muted small">
                                Contact support for assistance with client management.
                            </p>
                            <Link to="/admin/support" className="btn btn-outline-primary btn-sm">
                                <ChatDots className="me-1" /> Get Help
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClientEdit;