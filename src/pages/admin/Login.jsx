// src/pages/admin/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";

const Login = () => {
    const navigate = useNavigate();
    const { setAuthUser } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    const [alertVisible, setAlertVisible] = useState(true);
    const [loading, setLoading] = useState(false);

    const togglePassword = () => setShowPassword(!showPassword);

    useEffect(() => {
        if (error || Object.keys(errors).length > 0) {
            setAlertVisible(true);
            const timer = setTimeout(() => {
                setAlertVisible(false);
                setError("");
                setErrors({});
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, errors]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Enter") {
                const form = document.querySelector(".admin-login-form");
                if (form) form.requestSubmit();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Redirect if already logged in as admin (session-based)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await ensureCsrf();
                const { data } = await api.get("/admin/check-auth");
                if (!cancelled && data?.success) {
                    setAuthUser(data.data.user);
                    navigate("/admin/dashboard", { replace: true });
                }
            } catch {
                // Not authenticated — stay on page
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [navigate, setAuthUser]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            await ensureCsrf();

            const { data } = await api.post("/admin/login", {
                email: email.trim(),
                password,
            });

            if (data.success) {
                const loggedInUser = data?.data?.user;

                if (!loggedInUser || loggedInUser.role !== "admin") {
                    showToast("Only administrators can access this panel.", "error");
                    return;
                }

                // ✅ Sync React state. Session cookie is already set by the backend.
                setAuthUser(loggedInUser);

                showToast(data.message || "Welcome back!", "success");
                navigate("/admin/dashboard", { replace: true });
                return;
            }

            if (data.errors) {
                const firstError = Object.values(data.errors).flat()[0];
                showToast(firstError || "Validation failed", "error");
            } else {
                showToast(data.message || "Invalid email or password.", "error");
            }
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                "Something went wrong. Please try again.";
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(90deg, #00dafb 0%, #000113 100%);
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 20px;
                }
                .admin-login-container {
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 450px;
                    width: 100%;
                    overflow: hidden;
                    animation: slideUp 0.5s ease;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .admin-header {
                    background: linear-gradient(90deg, #00dafb 0%, #000113 100%);
                    padding: 35px 40px;
                    text-align: center;
                    color: #ffffff;
                }
                .admin-header .admin-icon {
                    font-size: 3rem;
                    margin-bottom: 10px;
                    display: block;
                }
                .admin-header .admin-badge {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                }
                .admin-header h2 { margin: 0; font-weight: 700; font-size: 1.8rem; }
                .admin-header p  { margin: 5px 0 0; opacity: 0.9; font-size: 0.95rem; }
                .admin-body { padding: 40px; }
                .admin-body .form-label { font-weight: 600; color: #1a1a2e; }
                .form-control {
                    border-radius: 10px;
                    padding: 12px 15px;
                    border: 2px solid #e1e5ea;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                    width: 100%;
                    font-size: 1rem;
                }
                .form-control:focus {
                    border-color: #00dafb;
                    box-shadow: 0 0 0 0.2rem rgba(0, 218, 251, 0.25);
                    background: #ffffff;
                    outline: none;
                }
                .form-control.is-invalid { border-color: #dc3545; }
                .input-group { display: flex; align-items: stretch; width: 100%; }
                .input-group-text {
                    background: #f8f9fa;
                    border: 2px solid #e1e5ea;
                    border-right: none;
                    border-radius: 10px 0 0 10px;
                    color: #6c757d;
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                    font-size: 1rem;
                }
                .input-group .form-control {
                    border-left: none;
                    border-radius: 0 10px 10px 0;
                }
                .password-toggle {
                    cursor: pointer;
                    background: #f8f9fa;
                    border: 2px solid #e1e5ea;
                    border-left: none;
                    border-radius: 0 10px 10px 0;
                    padding: 0 15px;
                    display: flex;
                    align-items: center;
                    color: #6c757d;
                    transition: color 0.3s ease;
                }
                .password-toggle:hover { color: #00dafb; }
                .btn-admin-login {
                    background: linear-gradient(90deg, #00dafb 0%, #000113 100%);
                    border: none;
                    padding: 12px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 1rem;
                    color: #ffffff;
                    transition: all 0.3s ease;
                    width: 100%;
                    cursor: pointer;
                }
                .btn-admin-login:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0, 218, 251, 0.4);
                    color: #ffffff;
                }
                .btn-admin-login:active { transform: translateY(0); }
                .btn-admin-login:disabled { opacity: 0.7; cursor: not-allowed; }
                .alert {
                    border-radius: 10px;
                    border: none;
                    padding: 12px 20px;
                    font-size: 0.9rem;
                    position: relative;
                }
                .alert-danger { background: #f8d7da; color: #721c24; }
                .alert-danger i { margin-right: 8px; }
                .alert-danger ul { padding-left: 20px; margin-bottom: 0; margin-top: 5px; }
                .alert-dismissible { padding-right: 40px; }
                .alert-dismissible .btn-close {
                    position: absolute;
                    top: 0;
                    right: 0;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: 0;
                    font-size: 1.5rem;
                    line-height: 1;
                    color: #000;
                    opacity: 0.5;
                    cursor: pointer;
                }
                .alert-dismissible .btn-close:hover { opacity: 0.75; }
                .fade { transition: opacity 0.15s linear; }
                .show { opacity: 1; }
                .admin-footer {
                    text-align: center;
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 2px solid #f0f2f5;
                }
                .admin-footer a {
                    color: #00dafb;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.3s ease;
                }
                .admin-footer a:hover { color: #000113; text-decoration: underline; }
                .admin-footer i { margin-right: 5px; }
                .admin-security-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: center;
                    margin-top: 15px;
                    font-size: 0.8rem;
                    color: #6c757d;
                }
                .admin-security-badge i { color: #43e97b; }
                .invalid-feedback {
                    display: block;
                    width: 100%;
                    margin-top: 0.25rem;
                    font-size: 0.875rem;
                    color: #dc3545;
                }
                .spinner-border-sm {
                    width: 1rem;
                    height: 1rem;
                    border-width: 0.2em;
                }
                @media (max-width: 576px) {
                    body { padding: 10px; }
                    .admin-body { padding: 25px; }
                    .admin-header { padding: 25px; }
                    .admin-header h2 { font-size: 1.5rem; }
                    .admin-header .admin-icon { font-size: 2.5rem; }
                    .form-control { padding: 10px 12px; font-size: 0.9rem; }
                    .btn-admin-login { font-size: 0.9rem; padding: 10px; }
                }
            `}</style>

            <div className="admin-login-container">
                <div className="admin-header">
                    <span className="admin-icon">
                        <i className="bi bi-shield-lock"></i>
                    </span>
                    <div className="admin-badge">
                        <i className="bi bi-shield-check"></i> Admin Access
                    </div>
                    <h2>Admin Login</h2>
                    <p>Secure access to admin dashboard</p>
                </div>

                <div className="admin-body">
                    {error && alertVisible && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            <i className="bi bi-exclamation-circle-fill"></i>
                            {error}
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
                                    setAlertVisible(false);
                                    setError("");
                                }}
                                aria-label="Close"
                            ></button>
                        </div>
                    )}

                    {Object.keys(errors).length > 0 && alertVisible && (
                        <div className="alert alert-danger">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            <ul className="mb-0 mt-1">
                                {Object.values(errors)
                                    .flat()
                                    .map((err, index) => (
                                        <li key={index}>{err}</li>
                                    ))}
                            </ul>
                        </div>
                    )}

                    <form className="admin-login-form" onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">
                                <i className="bi bi-envelope"></i> Email Address
                            </label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-envelope"></i>
                                </span>
                                <input
                                    type="email"
                                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                    id="email"
                                    name="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && (
                                <div className="invalid-feedback d-block">{errors.email}</div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">
                                <i className="bi bi-lock"></i> Password
                            </label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-lock"></i>
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <span className="password-toggle" onClick={togglePassword}>
                                    <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} id="toggleIcon"></i>
                                </span>
                            </div>
                            {errors.password && (
                                <div className="invalid-feedback d-block">{errors.password}</div>
                            )}
                        </div>

                        <button type="submit" className="btn-admin-login" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right"></i> Login to Dashboard
                                </>
                            )}
                        </button>
                    </form>

                    <div className="admin-security-badge">
                        <i className="bi bi-shield-check"></i>
                        Secure Admin Access
                        <i className="bi bi-dot"></i>
                        <i className="bi bi-lock"></i> SSL Encrypted
                    </div>

                    <div className="admin-footer">
                        <a href="/">
                            <i className="bi bi-arrow-left"></i> Return to Website
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;