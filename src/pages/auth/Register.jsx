import apiFetch from "../../api/apiFetch";
// src/pages/auth/Register.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirm: '',
        terms: false,
        newsletter: false,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            document.querySelectorAll('.alert').forEach((el) => el.remove());
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    const passwordChecks = (() => {
        const p = form.password;
        return {
            length: p.length >= 8,
            uppercase: /[A-Z]/.test(p),
            lowercase: /[a-z]/.test(p),
            number: /[0-9]/.test(p),
            special: /[!@#$%^&*]/.test(p),
        };
    })();

    const strengthScore = Object.values(passwordChecks).filter(Boolean).length;
    const strengthPercent = (strengthScore / 5) * 100;

    const strengthColor = (() => {
        if (!form.password) return '#e1e5ea';
        if (strengthScore <= 2) return '#dc3545';
        if (strengthScore <= 3) return '#ffc107';
        if (strengthScore <= 4) return '#17a2b8';
        return '#28a745';
    })();

    const strengthText = (() => {
        if (!form.password) return '';
        if (strengthScore <= 2) return 'Weak Password';
        if (strengthScore <= 3) return 'Fair Password';
        if (strengthScore <= 4) return 'Good Password';
        return 'Strong Password';
    })();

    const isStrongPassword = strengthScore === 5;
    const passwordsMatch =
        form.password_confirm.length === 0
            ? null
            : form.password === form.password_confirm;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    };

    const goNext = () => {
        if (step === 1) {
            if (!form.name.trim() || !form.email.trim()) {
                alert('Please fill in all required fields');
                return;
            }
        }
        if (step === 2) {
            if (!isStrongPassword || form.password !== form.password_confirm) {
                alert('Please ensure your password meets all requirements and matches');
                return;
            }
        }
        setStep((s) => Math.min(s + 1, 3));
    };

    const goPrev = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.terms) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            return;
        }
        setSubmitting(true);
        setErrors({});

        try {
            const res = await apiFetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                if (data.errors?.name || data.errors?.email) setStep(1);
                else if (data.errors?.password) setStep(2);
                return;
            }

            const data = await res.json();

            if (data.success && data.data?.user && data.data?.token) {
                // Auto-login: backend returned a token
                login(data.data.user, data.data.token);

                showToast(
                    `Welcome to BSSShop, ${data.data.user.name}!`,
                    'success'
                );
                setTimeout(() => navigate('/'), 400);
            } else if (data.success) {
                // Backend registered but didn't return token — send to login
                showToast(
                    'Account created! Please log in.',
                    'success'
                );
                setTimeout(() => navigate('/auth/login'), 600);
            } else {
                setErrors({ general: data.message || 'Registration failed' });
            }
        } catch (err) {
            console.error(err);
            setErrors({ general: 'An error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-container wide">
            <div className="auth-header">
                <div className="auth-logo">
                    <i className="bi bi-shop"></i>
                </div>
                <h2>Create Account</h2>
                <p>Join BSSShop and start shopping</p>
            </div>

            <div className="auth-body">
                <div className="progress-indicator">
                    {[1, 2, 3].map((n) => {
                        const cls =
                            n === step
                                ? 'progress-step active'
                                : n < step
                                ? 'progress-step completed'
                                : 'progress-step';
                        return (
                            <div className={cls} key={n}>
                                {n < step ? <i className="bi bi-check"></i> : n}
                            </div>
                        );
                    })}
                </div>

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
                            {Object.values(errors)
                                .flat()
                                .map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} id="registerForm">
                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <div className="step step-1">
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label fw-semibold">
                                    Full Name
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-person"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        id="name"
                                        name="name"
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.name && (
                                    <div className="invalid-feedback d-block">{errors.name}</div>
                                )}
                            </div>

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
                                <label htmlFor="phone" className="form-label fw-semibold">
                                    Phone Number (Optional)
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-telephone"></i>
                                    </span>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        placeholder="+1 234 567 8900"
                                        value={form.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary w-100 next-step"
                                onClick={goNext}
                            >
                                Next <i className="bi bi-arrow-right"></i>
                            </button>
                        </div>
                    )}

                    {/* Step 2: Password */}
                    {step === 2 && (
                        <div className="step step-2">
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
                                        placeholder="Create a strong password"
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
                                            id="toggleIcon1"
                                        ></i>
                                    </span>
                                </div>
                                {errors.password && (
                                    <div className="invalid-feedback d-block">{errors.password}</div>
                                )}

                                <div className="password-strength">
                                    <div
                                        className="password-strength-bar"
                                        style={{
                                            width: `${strengthPercent}%`,
                                            background: strengthColor,
                                        }}
                                    ></div>
                                </div>
                                <div
                                    className="password-strength-text"
                                    style={{ color: strengthColor }}
                                >
                                    {strengthText}
                                </div>

                                <ul className="password-requirements">
                                    {[
                                        ['req-length', 'At least 8 characters', passwordChecks.length],
                                        ['req-uppercase', 'At least one uppercase letter', passwordChecks.uppercase],
                                        ['req-lowercase', 'At least one lowercase letter', passwordChecks.lowercase],
                                        ['req-number', 'At least one number', passwordChecks.number],
                                        ['req-special', 'At least one special character (!@#$%^&*)', passwordChecks.special],
                                    ].map(([id, label, ok]) => (
                                        <li
                                            id={id}
                                            key={id}
                                            className={
                                                form.password
                                                    ? ok
                                                        ? 'valid'
                                                        : 'invalid'
                                                    : ''
                                            }
                                        >
                                            <i
                                                className={`bi ${
                                                    ok && form.password
                                                        ? 'bi-check-circle-fill'
                                                        : 'bi-circle'
                                                }`}
                                            ></i>{' '}
                                            {label}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password_confirm" className="form-label fw-semibold">
                                    Confirm Password
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-lock"></i>
                                    </span>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        className={`form-control ${errors.password_confirm ? 'is-invalid' : ''}`}
                                        id="password_confirm"
                                        name="password_confirm"
                                        placeholder="Confirm your password"
                                        value={form.password_confirm}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span
                                        className="password-toggle"
                                        onClick={() => setShowConfirm((s) => !s)}
                                    >
                                        <i
                                            className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}
                                            id="toggleIcon2"
                                        ></i>
                                    </span>
                                </div>
                                {errors.password_confirm && (
                                    <div className="invalid-feedback d-block">
                                        {errors.password_confirm}
                                    </div>
                                )}
                                <div
                                    id="passwordMatch"
                                    className="mt-2"
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    {passwordsMatch === true && (
                                        <>
                                            <i className="bi bi-check-circle-fill text-success"></i>{' '}
                                            Passwords match
                                        </>
                                    )}
                                    {passwordsMatch === false && (
                                        <>
                                            <i className="bi bi-x-circle-fill text-danger"></i>{' '}
                                            Passwords do not match
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary w-50 prev-step"
                                    onClick={goPrev}
                                >
                                    <i className="bi bi-arrow-left"></i> Back
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary w-50 next-step"
                                    onClick={goNext}
                                >
                                    Next <i className="bi bi-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Terms */}
                    {step === 3 && (
                        <div className="step step-3">
                            <div className="mb-3">
                                <div className="terms-check">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        name="terms"
                                        checked={form.terms}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="terms" className="form-label">
                                        I agree to the{' '}
                                        <a
                                            href="#terms"
                                            className="text-decoration-none"
                                            data-bs-toggle="modal"
                                            data-bs-target="#termsModal"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Terms of Service
                                        </a>{' '}
                                        and{' '}
                                        <a
                                            href="#privacy"
                                            className="text-decoration-none"
                                            data-bs-toggle="modal"
                                            data-bs-target="#privacyModal"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Privacy Policy
                                        </a>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="terms-check">
                                    <input
                                        type="checkbox"
                                        id="newsletter"
                                        name="newsletter"
                                        checked={form.newsletter}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="newsletter" className="form-label">
                                        Subscribe to our newsletter for updates and offers
                                    </label>
                                </div>
                            </div>

                            <div className="alert alert-info">
                                <i className="bi bi-info-circle"></i>
                                By creating an account, you'll be able to track orders,
                                save favorites, and enjoy a personalized shopping experience.
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary w-50 prev-step"
                                    onClick={goPrev}
                                >
                                    <i className="bi bi-arrow-left"></i> Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-50"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-person-plus"></i> Create Account
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <div className="auth-footer">
                    <p className="mb-0">
                        Already have an account? <Link to="/auth/login">Login here</Link>
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

export default Register;
