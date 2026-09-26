// src/pages/admin/faqs/FaqCreate.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Save } from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';

const FaqCreate = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        question: '',
        answer: '',
        category: 'General',
        status: 'active',
        order: 0,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

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
            const res = await fetch(`${API_BASE}/faqs/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
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
                showToast('FAQ created successfully!', 'success');
                setTimeout(() => navigate('/admin/faqs'), 600);
            } else {
                showToast(data.message || 'Failed to create FAQ', 'error');
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <PlusCircle className="text-primary me-2" /> Create FAQ
                </h2>
                <Link to="/admin/faqs" className="btn btn-outline-secondary">
                    <ArrowLeft className="me-1" /> Back to FAQs
                </Link>
            </div>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row">
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label htmlFor="question" className="form-label fw-semibold">
                                        Question <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text" id="question" name="question"
                                        className={`form-control ${errors.question ? 'is-invalid' : ''}`}
                                        value={form.question} onChange={handleChange}
                                        placeholder="Enter the frequently asked question"
                                        required
                                    />
                                    {errors.question && <div className="invalid-feedback">{errors.question}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="answer" className="form-label fw-semibold">
                                        Answer <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        id="answer" name="answer" rows="6"
                                        className={`form-control ${errors.answer ? 'is-invalid' : ''}`}
                                        value={form.answer} onChange={handleChange}
                                        placeholder="Enter the detailed answer to the question"
                                        required
                                    />
                                    {errors.answer && <div className="invalid-feedback">{errors.answer}</div>}
                                    <div className="form-text text-muted">
                                        Provide a clear and detailed answer. HTML formatting allowed.
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="mb-3">
                                    <label htmlFor="category" className="form-label fw-semibold">
                                        Category <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text" id="category" name="category"
                                        className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                                        value={form.category} onChange={handleChange}
                                        placeholder="e.g., Payments, Shipping"
                                        required
                                    />
                                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                                    <div className="form-text">
                                        Group FAQs by category (e.g., Payments, Shipping, General).
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="status" className="form-label fw-semibold">Status</label>
                                    <select
                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                        id="status" name="status"
                                        value={form.status} onChange={handleChange}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="order" className="form-label fw-semibold">Display Order</label>
                                    <input
                                        type="number" id="order" name="order" min="0"
                                        className={`form-control ${errors.order ? 'is-invalid' : ''}`}
                                        value={form.order} onChange={handleChange}
                                    />
                                    {errors.order && <div className="invalid-feedback">{errors.order}</div>}
                                    <div className="form-text">Lower numbers appear first.</div>
                                </div>
                            </div>
                        </div>

                        <div className="text-end">
                            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="me-1" /> Create FAQ
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default FaqCreate;