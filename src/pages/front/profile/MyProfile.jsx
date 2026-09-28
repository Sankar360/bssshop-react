// src/pages/front/profile/MyProfile.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API_URL from "../../../api/config";

const API_BASE = API_URL;

const MyProfile = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);

    /* ---------------------------------------------------------- */
    /*  Auth check + fetch profile                                  */
    /* ---------------------------------------------------------- */
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/auth/login', {
                state: { from: location.pathname },
                replace: true,
            });
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
                    setUser(u);
                    localStorage.setItem('auth_user', JSON.stringify(u));
                } else if (data.redirect) {
                    navigate(data.redirect, { replace: true });
                }
            } catch (err) {
                console.error('Profile fetch failed', err);
                // Fall back to cached user
                try {
                    const cached = JSON.parse(localStorage.getItem('auth_user') || '{}');
                    setUser(cached);
                } catch {
                    setUser({});
                }
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line
    }, [navigate, location.pathname]);

    /* ---------------------------------------------------------- */
    /*  Sidebar                                                     */
    /* ---------------------------------------------------------- */
    const sidebar = (
        <div className="col-lg-3 mb-4">
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <div
                        className="profile-sidebar-header p-4 text-center"
                        style={{
                            background: 'linear-gradient(135deg, #00dafb 0%, #000113 100%)',
                            color: 'white',
                        }}
                    >
                        <div
                            className="avatar-circle mx-auto mb-3"
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                fontWeight: 600,
                                border: '3px solid white',
                            }}
                        >
                            {(user.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <h5 className="mb-0">{user.name || 'User'}</h5>
                        <small className="opacity-75">{user.email || ''}</small>
                    </div>
                    <ul className="nav nav-pills flex-column p-3">
                        <li className="nav-item mb-1">
                            <Link className="nav-link active" to="/profile">
                                <i className="bi bi-person me-2"></i> Profile
                            </Link>
                        </li>
                        <li className="nav-item mb-1">
                            <Link className="nav-link" to="/orders">
                                <i className="bi bi-box me-2"></i> Orders
                            </Link>
                        </li>
                        <li className="nav-item mb-1">
                            <Link className="nav-link" to="/wishlist">
                                <i className="bi bi-heart me-2"></i> Wishlist
                            </Link>
                        </li>
                        <li className="nav-item mb-1">
                            <a className="nav-link" href="/auth/logout">
                                <i className="bi bi-box-arrow-right me-2 text-danger"></i>{' '}
                                <span className="text-danger">Logout</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );

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

    const infoFields = [
        { label: 'Full Name',       value: user.name },
        { label: 'Email Address',   value: user.email },
        { label: 'Phone Number',    value: user.phone },
        { label: 'Address',         value: user.address },
        { label: 'City',            value: user.city },
        { label: 'State/Province',  value: user.state },
        { label: 'Country',         value: user.country },
        { label: 'Postal Code',     value: user.postal_code },
    ];

    return (
        <div className="container py-4">
            <div className="row">
                {sidebar}

                {/* Main Content */}
                <div className="col-lg-9">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">
                                    <i className="bi bi-person-circle text-primary me-2"></i> My
                                    Profile
                                </h4>
                                <Link
                                    to="/profile/edit"
                                    className="btn btn-primary"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, #00dafb 0%, #000113 100%)',
                                        border: 'none',
                                    }}
                                >
                                    <i className="bi bi-pencil"></i> Edit Profile
                                </Link>
                            </div>
                            <p className="text-muted mb-0 mt-2">
                                Manage your account information
                            </p>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                {infoFields.map((field, i) => (
                                    <div className="col-md-6" key={i}>
                                        <div className="info-card p-3 bg-light rounded">
                                            <label className="text-muted small text-uppercase fw-bold">
                                                {field.label}
                                            </label>
                                            <p className="mb-0 fw-semibold fs-5">
                                                {field.value || 'Not set'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;