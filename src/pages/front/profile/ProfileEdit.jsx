// src/pages/front/profile/ProfileEdit.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showToast } from '../../../utils/toast';
import API_URL from "../../../api/config";

const API_BASE = API_URL;

const ProfileEdit = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    /* ---------------------------------------------------------- */
    /*  Load current profile                                        */
    /* ---------------------------------------------------------- */
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/auth/login', { replace: true });
            return;
        }

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/profile`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();

                if (data.success) {
                    const u = data.data?.user ?? data.data ?? {};
                    setForm({
                        name: u.name || '',
                        email: u.email || '',
                        phone: u.phone || '',
                        address: u.address || '',
                        city: u.city || '',
                        state: u.state || '',
                        postal_code: u.postal_code || '',
                        country: u.country || '',
                    });
                }
            } catch (err) {
                console.error('Profile load failed', err);
                // Fall back to cached
                try {
                    const cached = JSON.parse(localStorage.getItem('auth_user') || '{}');
                    setForm((f) => ({
                        ...f,
                        ...cached,
                    }));
                } catch {
                    /* ignore */
                }
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line
    }, [navigate]);

    /* ---------------------------------------------------------- */
    /*  Handlers                                                    */
    /* ---------------------------------------------------------- */
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
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/profile/update`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(form),
            });

            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the errors', 'error');
                return;
            }

            const data = await res.json();
            if (data.success) {
                showToast('Profile updated successfully', 'success');
                // Refresh cached user
                if (data.data) {
                    localStorage.setItem('auth_user', JSON.stringify(data.data));
                }
                setTimeout(() => navigate('/profile'), 600);
            } else {
                showToast(data.message || 'Failed to update profile', 'error');
            }
        } catch (err) {
            console.error('Profile update failed', err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------------------------------------------------------- */
    /*  Render                                                      */
    /* ---------------------------------------------------------- */
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
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-0 py-3">
                            <h4 className="mb-0">
                                <i className="bi bi-pencil-square text-primary me-2"></i> Edit
                                Profile
                            </h4>
                            <p className="text-muted mb-0 mt-2">
                                Update your personal information
                            </p>
                        </div>
                        <div className="card-body">
                            {Object.keys(errors).length > 0 && (
                                <div className="alert alert-danger alert-dismissible fade show">
                                    <i className="bi bi-exclamation-circle-fill me-2"></i>
                                    <ul className="mb-0">
                                        {Object.values(errors).flat().map((e, i) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setErrors({})}
                                    ></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    {/* Name */}
                                    <div className="col-md-6">
                                        <label htmlFor="name" className="form-label fw-bold">
                                            Full Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            id="name"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter your full name"
                                            required
                                        />
                                        {errors.name && (
                                            <div className="invalid-feedback">{errors.name}</div>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="col-md-6">
                                        <label htmlFor="email" className="form-label fw-bold">
                                            Email Address <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            id="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email"
                                            required
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">{errors.email}</div>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="col-md-6">
                                        <label htmlFor="phone" className="form-label fw-bold">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                            id="phone"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="Enter your phone number"
                                        />
                                        {errors.phone && (
                                            <div className="invalid-feedback">{errors.phone}</div>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="col-md-12">
                                        <label htmlFor="address" className="form-label fw-bold">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                            id="address"
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="Enter your street address"
                                        />
                                        {errors.address && (
                                            <div className="invalid-feedback">{errors.address}</div>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div className="col-md-4">
                                        <label htmlFor="city" className="form-label fw-bold">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                                            id="city"
                                            name="city"
                                            value={form.city}
                                            onChange={handleChange}
                                            placeholder="Enter your city"
                                        />
                                        {errors.city && (
                                            <div className="invalid-feedback">{errors.city}</div>
                                        )}
                                    </div>

                                    {/* State */}
                                    <div className="col-md-4">
                                        <label htmlFor="state" className="form-label fw-bold">
                                            State/Province
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                                            id="state"
                                            name="state"
                                            value={form.state}
                                            onChange={handleChange}
                                            placeholder="Enter your state"
                                        />
                                        {errors.state && (
                                            <div className="invalid-feedback">{errors.state}</div>
                                        )}
                                    </div>

                                    {/* Postal Code */}
                                    <div className="col-md-4">
                                        <label htmlFor="postal_code" className="form-label fw-bold">
                                            Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.postal_code ? 'is-invalid' : ''}`}
                                            id="postal_code"
                                            name="postal_code"
                                            value={form.postal_code}
                                            onChange={handleChange}
                                            placeholder="Enter postal code"
                                        />
                                        {errors.postal_code && (
                                            <div className="invalid-feedback">
                                                {errors.postal_code}
                                            </div>
                                        )}
                                    </div>

                                    {/* Country */}
                                    <div className="col-md-12">
                                        <label htmlFor="country" className="form-label fw-bold">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.country ? 'is-invalid' : ''}`}
                                            id="country"
                                            name="country"
                                            value={form.country}
                                            onChange={handleChange}
                                            placeholder="Enter your country"
                                        />
                                        {errors.country && (
                                            <div className="invalid-feedback">{errors.country}</div>
                                        )}
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="col-12 mt-4">
                                        <div className="d-flex gap-2">
                                            <Link to="/profile" className="btn btn-secondary">
                                                <i className="bi bi-arrow-left"></i> Cancel
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
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-circle"></i> Update
                                                        Profile
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
            </div>
        </div>
    );
};

export default ProfileEdit;