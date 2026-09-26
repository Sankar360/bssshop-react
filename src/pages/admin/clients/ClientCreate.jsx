// src/pages/admin/clients/ClientCreate.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PersonPlus, ArrowLeft, Person, InfoCircle, ShieldCheck, PersonBadge,
    Envelope, Key, CheckCircle, Clock, QuestionCircle, ChatDots, Save,
    XCircle, Eye, EyeSlash, GeoAlt,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';

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

const ClientCreate = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', phone: '',
        password: '', password_confirm: '',
        role: 'user', status: 'active',
        address: '', city: '', state: '', postal_code: '', country: '',
        notes: '',
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

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
        Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
        if (avatar) fd.append('avatar', avatar);

        try {
            const res = await fetch(`${API_BASE}/clients/store`, {
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
                showToast('Client created successfully!', 'success');
                setTimeout(() => navigate('/admin/clients'), 600);
            } else {
                showToast(data.message || 'Failed to create client', 'error');
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
                .form-label { font-weight: 600; }
                .card-header { background-color: #f8f9fc; border-bottom: 1px solid #e3e6f0; }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <PersonPlus className="text-primary me-2" /> Add New Client
                </h2>
                <Link to="/admin/clients" className="btn btn-outline-secondary">
                    <ArrowLeft className="me-1" /> Back to Clients
                </Link>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0"><Person className="me-1" /> New Client Information</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit} noValidate>
                                {/* Personal Info */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="name" className="form-label">
                                            Full Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text" id="name" name="name"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            value={form.name} onChange={handleChange}
                                            placeholder="Enter full name" required
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
                                            value={form.email} onChange={handleChange}
                                            placeholder="Enter email address" required
                                        />
                                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="phone" className="form-label">Phone Number</label>
                                        <input
                                            type="tel" id="phone" name="phone"
                                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                            value={form.phone} onChange={handleChange}
                                            placeholder="Enter phone number"
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
                                        {avatarPreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={avatarPreview}
                                                    alt="avatar"
                                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '50%' }}
                                                />
                                                <br />
                                                <small className="text-muted">Preview</small>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="password" className="form-label">
                                            Password <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password" name="password"
                                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                                value={form.password} onChange={handleChange}
                                                placeholder="Enter password" required
                                            />
                                            <button
                                                className="btn btn-outline-secondary" type="button"
                                                onClick={() => setShowPassword((s) => !s)}
                                            >
                                                {showPassword ? <EyeSlash /> : <Eye />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <div className="invalid-feedback d-block">{errors.password}</div>
                                        )}
                                        <div className="form-text text-muted">
                                            <InfoCircle className="me-1" /> Password must be at least 8 characters long.
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="password_confirm" className="form-label">
                                            Confirm Password <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type={showPasswordConfirm ? 'text' : 'password'}
                                                id="password_confirm" name="password_confirm"
                                                className={`form-control ${errors.password_confirm ? 'is-invalid' : ''}`}
                                                value={form.password_confirm} onChange={handleChange}
                                                placeholder="Confirm password" required
                                            />
                                            <button
                                                className="btn btn-outline-secondary" type="button"
                                                onClick={() => setShowPasswordConfirm((s) => !s)}
                                            >
                                                {showPasswordConfirm ? <EyeSlash /> : <Eye />}
                                            </button>
                                        </div>
                                        {errors.password_confirm && (
                                            <div className="invalid-feedback d-block">{errors.password_confirm}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Account Settings */}
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
                                            placeholder="Enter street address"
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="city" className="form-label">City</label>
                                        <input
                                            type="text" className="form-control" id="city" name="city"
                                            value={form.city} onChange={handleChange} placeholder="Enter city"
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="state" className="form-label">State / Province</label>
                                        <input
                                            type="text" className="form-control" id="state" name="state"
                                            value={form.state} onChange={handleChange} placeholder="Enter state"
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="postal_code" className="form-label">Postal Code</label>
                                        <input
                                            type="text" className="form-control" id="postal_code" name="postal_code"
                                            value={form.postal_code} onChange={handleChange} placeholder="Enter postal code"
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
                                            placeholder="Add any notes about this client"
                                        />
                                    </div>
                                </div>

                                <div className="row mt-4">
                                    <div className="col-12">
                                        <hr />
                                        <div className="d-flex justify-content-end gap-2">
                                            <Link to="/admin/clients" className="btn btn-secondary">
                                                <XCircle className="me-1" /> Cancel
                                            </Link>
                                            <button
                                                type="submit" className="btn btn-primary btn-lg"
                                                disabled={submitting}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="me-1" /> Create Client
                                                    </>
                                                )}
                                            </button>
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
                            <h6 className="mb-0"><InfoCircle className="me-1" /> Quick Info</h6>
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <ShieldCheck className="text-success me-2" />
                                <div>
                                    <strong>Account Status</strong>
                                    <p className="mb-0 text-muted small">
                                        Set client account to active or inactive
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <PersonBadge className="me-2" />
                                <div>
                                    <strong>User Role</strong>
                                    <p className="mb-0 text-muted small">
                                        Assign user or admin privileges
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center">
                                <Envelope className="me-2" />
                                <div>
                                    <strong>Email Verification</strong>
                                    <p className="mb-0 text-muted small">
                                        Client will receive a welcome email
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-3">
                        <div className="card-header">
                            <h6 className="mb-0"><Key className="me-1" /> Password Requirements</h6>
                        </div>
                        <div className="card-body">
                            <ul className="list-unstyled mb-0">
                                {[
                                    'Minimum 8 characters',
                                    'At least one uppercase letter',
                                    'At least one lowercase letter',
                                    'At least one number',
                                    'At least one special character',
                                ].map((txt, i) => (
                                    <li className="mb-2" key={i}>
                                        <CheckCircle className="text-success me-1" /> {txt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0"><Envelope className="me-1" /> Welcome Email</h6>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info mb-2">
                                <InfoCircle className="me-1" />
                                A welcome email will be sent to the client with their login credentials.
                            </div>
                            <small className="text-muted">
                                <Clock className="me-1" />
                                Email will be sent immediately after account creation.
                            </small>
                        </div>
                    </div>

                    <div className="card mt-3">
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

export default ClientCreate;