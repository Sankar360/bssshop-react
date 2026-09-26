// src/pages/front/contact/Contact.jsx
import React, { useState, useEffect } from 'react';
import { showToast } from '../../../utils/toast';

const API_BASE = '/api';

const Contact = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        agree: false,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState({
        site_name: 'BSSShop',
        site_email: '',
        site_phone: '',
        site_address: '',
        social_facebook: '',
        social_twitter: '',
        social_instagram: '',
        social_youtube: '',
        social_linkedin: '',
    });
    const [loadingSettings, setLoadingSettings] = useState(true);

    /* ------------------------------------------------------------------ */
    /*  Load settings on mount                                             */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/settings/public`, {
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();
                if (data.success && data.data) {
                    setSettings((s) => ({ ...s, ...data.data }));
                }
            } catch (err) {
                console.error('Failed to load settings', err);
            } finally {
                setLoadingSettings(false);
            }
        })();
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
            const res = await fetch(`${API_BASE}/contact/send`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
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
                showToast(data.message || "Message sent! We'll get back to you soon.", 'success');
                setForm({ name: '', email: '', subject: '', message: '', agree: false });
            } else {
                showToast(data.message || 'Failed to send message', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Split address by commas/newlines for display                       */
    /* ------------------------------------------------------------------ */
    const addressLines = String(settings.site_address || '')
        .split(/,|\n/)
        .map((l) => l.trim())
        .filter(Boolean);

    /* ------------------------------------------------------------------ */
    /*  Social links config — only render those with a URL                 */
    /* ------------------------------------------------------------------ */
    const socialLinks = [
        { key: 'social_facebook',  icon: 'bi-facebook',  cls: 'btn-outline-primary' },
        { key: 'social_twitter',   icon: 'bi-twitter',   cls: 'btn-outline-info' },
        { key: 'social_instagram', icon: 'bi-instagram', cls: 'btn-outline-danger' },
        { key: 'social_linkedin',  icon: 'bi-linkedin',  cls: 'btn-outline-secondary' },
        { key: 'social_youtube',   icon: 'bi-youtube',   cls: 'btn-outline-success' },
    ].filter((s) => settings[s.key]);

    return (
        <div className="container py-5">
            <div className="row mb-5">
                <div className="col-lg-8 mx-auto text-center">
                    <h1>Contact Us</h1>
                    <p className="text-muted">
                        We'd love to hear from you! Get in touch with {settings.site_name || 'us'}.
                    </p>
                </div>
            </div>

            <div className="row">
                {/* ============================================================ */}
                {/*  Contact Form — FULL FORM RESTORED                           */}
                {/* ============================================================ */}
                <div className="col-lg-7 mb-4">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h4 className="card-title mb-4">Send us a Message</h4>

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="name" className="form-label">
                                            Full Name <span className="text-danger">*</span>
                                        </label>
                                        <input type="text"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            id="name" name="name" value={form.name}
                                            onChange={handleChange} required />
                                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="email" className="form-label">
                                            Email Address <span className="text-danger">*</span>
                                        </label>
                                        <input type="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            id="email" name="email" value={form.email}
                                            onChange={handleChange} required />
                                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="subject" className="form-label">
                                        Subject <span className="text-danger">*</span>
                                    </label>
                                    <input type="text"
                                        className={`form-control ${errors.subject ? 'is-invalid' : ''}`}
                                        id="subject" name="subject" value={form.subject}
                                        onChange={handleChange} required />
                                    {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="message" className="form-label">
                                        Message <span className="text-danger">*</span>
                                    </label>
                                    <textarea className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                        id="message" name="message" rows="5" value={form.message}
                                        onChange={handleChange} required></textarea>
                                    {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="agree"
                                            name="agree" checked={form.agree}
                                            onChange={handleChange} required />
                                        <label className="form-check-label" htmlFor="agree">
                                            I agree to the{' '}
                                            <a href="#" className="text-decoration-none" onClick={(e) => e.preventDefault()}>
                                                Terms and Conditions
                                            </a>{' '}
                                            <span className="text-danger">*</span>
                                        </label>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg w-100" disabled={submitting}>
                                    {submitting ? (
                                        <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
                                    ) : (
                                        <><i className="bi bi-send"></i> Send Message</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/*  Contact Information — DYNAMIC FROM SETTINGS                 */}
                {/* ============================================================ */}
                <div className="col-lg-5">
                    <div className="card shadow-sm mb-4">
                        <div className="card-body p-4">
                            <h4 className="card-title mb-4">Contact Information</h4>

                            {settings.site_address && (
                                <div className="contact-item d-flex mb-3">
                                    <div className="contact-icon me-3">
                                        <i className="bi bi-geo-alt fs-4 text-primary"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Address</h6>
                                        <p className="text-muted mb-0">
                                            {addressLines.map((line, i) => (
                                                <React.Fragment key={i}>
                                                    {line}
                                                    {i < addressLines.length - 1 && <br />}
                                                </React.Fragment>
                                            ))}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {settings.site_email && (
                                <div className="contact-item d-flex mb-3">
                                    <div className="contact-icon me-3">
                                        <i className="bi bi-envelope fs-4 text-primary"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Email</h6>
                                        <a href={`mailto:${settings.site_email}`} className="text-muted d-block text-decoration-none">
                                            {settings.site_email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {settings.site_phone && (
                                <div className="contact-item d-flex mb-3">
                                    <div className="contact-icon me-3">
                                        <i className="bi bi-telephone fs-4 text-primary"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Phone</h6>
                                        <a href={`tel:${settings.site_phone.replace(/\s+/g, '')}`} className="text-muted text-decoration-none">
                                            {settings.site_phone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="contact-item d-flex">
                                <div className="contact-icon me-3">
                                    <i className="bi bi-clock fs-4 text-primary"></i>
                                </div>
                                <div>
                                    <h6 className="mb-1">Business Hours</h6>
                                    <p className="text-muted mb-0">Monday - Friday: 9:00 AM - 6:00 PM</p>
                                    <p className="text-muted mb-0">Saturday: 10:00 AM - 4:00 PM</p>
                                    <p className="text-muted mb-0">Sunday: Closed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Media — only show if at least one link exists */}
                    {socialLinks.length > 0 && (
                        <div className="card shadow-sm">
                            <div className="card-body p-4 text-center">
                                <h5 className="card-title">Connect With Us</h5>
                                <p className="text-muted small">Follow us on social media for updates and offers</p>
                                <div className="d-flex justify-content-center gap-3 flex-wrap">
                                    {socialLinks.map((s) => (
                                        <a
                                            key={s.key}
                                            href={settings[s.key]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`btn ${s.cls} rounded-circle`}
                                            style={{ width: 50, height: 50 }}
                                            aria-label={s.key}
                                        >
                                            <i className={`bi ${s.icon} fs-5`}></i>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Map Section — unchanged */}
            {/* Map Section — dynamic from site_address */}
            <div className="row mt-5">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body p-0">
                            <div className="ratio ratio-21x9">
                                <iframe
                                    src={`https://www.google.com/maps?q=${encodeURIComponent(settings.site_address || '')}&output=embed`}
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={`${settings.site_name || 'Store'} location`}
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;