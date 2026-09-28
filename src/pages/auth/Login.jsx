import apiFetch from "../../api/apiFetch";
// src/pages/auth/Login.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/toast';   // if you have this helper

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: '',
        password: '',
        remember: false,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Auto-dismiss alerts after 5s (matches CI4 behaviour)
    useEffect(() => {
        const timer = setTimeout(() => {
            document.querySelectorAll('.alert').forEach((el) => el.remove());
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const res = await apiFetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    remember: form.remember,
                }),
            });

            // Validation errors
            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                return;
            }

            const data = await res.json();

            if (data.success) {
                // Store token if returned
                if (data.data?.token) {
                    localStorage.setItem('auth_token', data.data.token);
                }
                if (data.data?.user) {
                    localStorage.setItem('auth_user', JSON.stringify(data.data.user));
                }
                showToast(`Welcome back, ${data.data?.user?.name || 'user'}!`, 'success');
                // Redirect home
                setTimeout(() => navigate('/'), 500);
            } else {
                setErrors({ general: data.message || 'Login failed' });
            }
        } catch (err) {
            console.error(err);
            setErrors({ general: 'An error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const socialLogin = (provider) => {
        alert(
            'Social login with ' +
            provider.charAt(0).toUpperCase() +
            provider.slice(1) +
            ' will be available soon!'
        );
    };

    return (
        <div className="auth-container">
            {/* Header */}
            <div className="auth-header">
                <div className="auth-logo">
                    <i className="bi bi-shop"></i>
                </div>
                <h2>Welcome Back!</h2>
                <p>Login to your BSSShop account</p>
            </div>

            {/* Body */}
            <div className="auth-body">
                {/* Validation / general errors */}
                {errors.general && (
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {errors.general}
                    </div>
                )}

                {Object.keys(errors).length > 0 && !errors.general && (
                    <div className="alert alert-danger">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <ul className="mb-0 mt-1">
                            {Object.values(errors).flat().map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label fw-semibold">
                            Email Address
                        </label>
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="bi bi-envelope"></i>
                            </span>
                            <input
                                type="email"
                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                id="email"
                                name="email"
                                placeholder="your@email.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {errors.email && (
                            <div className="invalid-feedback d-block">{errors.email}</div>
                        )}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label fw-semibold">
                            Password
                        </label>
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="bi bi-lock"></i>
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                            <span
                                className="password-toggle"
                                onClick={() => setShowPassword((s) => !s)}
                            >
                                <i
                                    className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                                    id="toggleIcon"
                                ></i>
                            </span>
                        </div>
                        {errors.password && (
                            <div className="invalid-feedback d-block">{errors.password}</div>
                        )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="remember-me">
                            <input
                                type="checkbox"
                                id="remember"
                                name="remember"
                                checked={form.remember}
                                onChange={handleChange}
                            />
                            <label htmlFor="remember" className="form-label mb-0">
                                Remember me
                            </label>
                        </div>
                        <Link to="/auth/forgot-password" className="forgot-password text-decoration-none">
                            Forgot Password?
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Logging in...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-in-right"></i> Login
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">or continue with</div>

                {/* Social Login */}
                <div className="social-login">
                    <button
                        type="button"
                        className="social-btn google"
                        onClick={() => socialLogin('google')}
                    >
                        <i className="bi bi-google"></i> Google
                    </button>
                    <button
                        type="button"
                        className="social-btn facebook"
                        onClick={() => socialLogin('facebook')}
                    >
                        <i className="bi bi-facebook"></i> Facebook
                    </button>
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <p className="mb-0">
                        Don't have an account? <Link to="/auth/register">Create one now</Link>
                    </p>
                    <p className="mt-2 mb-0">
                        <Link to="/" className="text-decoration-none">
                            <i className="bi bi-arrow-left"></i> Back to Home
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
