// src/pages/admin/features/Features.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Sliders, PlusCircle, Diagram3, Pencil, Trash,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const INPUT_TYPES = [
    { value: 'text', label: 'Text (e.g. RAM, Battery)' },
    { value: 'dropdown', label: 'Dropdown (e.g. Brand)' },
    { value: 'checkbox', label: 'Checkbox (e.g. Color)' },
];

const Features = () => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        name: '',
        input_type: 'text',
        options: '',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Fetch                                                          */
    /* -------------------------------------------------------------- */
    const fetchFeatures = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/features`, { headers: authHeaders(false) });
            const data = await res.json();

            if (data.success) {
                // Accept multiple backend shapes:
                //   data.data              → plain array
                //   data.data.data         → Laravel paginator
                //   data.data.features     → named wrapper
                const payload = data.data;
                let list = [];

                if (Array.isArray(payload)) {
                    list = payload;
                } else if (Array.isArray(payload?.data)) {
                    list = payload.data;             // Laravel paginator
                } else if (Array.isArray(payload?.features)) {
                    list = payload.features;
                } else if (Array.isArray(data.features)) {
                    list = data.features;
                }

                setFeatures(list);
            } else {
                showToast(data.message || 'Failed to load features', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load features', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeatures();
    }, [fetchFeatures]);

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const resetForm = () => {
        setEditingId(null);
        setForm({ name: '', input_type: 'text', options: '' });
        setErrors({});
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (feature) => {
        setEditingId(feature.id);
        setForm({
            name: feature.name || '',
            input_type: feature.input_type || 'text',
            options: feature.options || '',
        });
        setErrors({});
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const url = editingId
            ? `${API_BASE}/features/update/${editingId}`
            : `${API_BASE}/features/store`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(form),
            });

            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the validation errors.', 'error');
                return;
            }

            const data = await res.json();
            if (data.success) {
                showToast(editingId ? 'Feature updated' : 'Feature created', 'success');
                setShowModal(false);
                fetchFeatures();
            } else {
                showToast(data.message || 'Failed to save feature', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (feature) => {
        if (
            !window.confirm(
                `Delete "${feature.name}"? It will be removed from all categories and products.`
            )
        )
            return;

        try {
            const res = await fetch(`${API_BASE}/features/delete/${feature.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Feature deleted', 'success');
                fetchFeatures();
            } else {
                showToast(data.message || 'Failed to delete feature', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const handleToggleStatus = async (feature) => {
        try {
            const res = await fetch(`${API_BASE}/features/toggle-status/${feature.id}`, {
                method: 'POST',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Status updated', 'success');
                fetchFeatures();
            } else {
                showToast(data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const showOptions = form.input_type !== 'text';

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Sliders className="text-primary me-2" /> Product Features
                </h2>
                <button type="button" className="btn btn-primary" onClick={openAddModal}>
                    <PlusCircle className="me-1" /> Add Feature
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : features.length === 0 ? (
                        <p className="text-muted text-center py-4 mb-0">
                            No features yet. Add one (Brand, Color, Storage, RAM...).
                        </p>
                    ) : (
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Feature Name</th>
                                    <th>Input Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {features.map((feature) => (
                                    <tr key={feature.id}>
                                        <td>
                                            <Link
                                                to={`/admin/features/assign/${feature.id}`}
                                                className="fw-bold text-decoration-none"
                                            >
                                                {feature.name}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border">
                                                {feature.input_type}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className={`btn btn-sm badge bg-${
                                                    feature.status ? 'success' : 'secondary'
                                                } border-0`}
                                                onClick={() => handleToggleStatus(feature)}
                                            >
                                                {feature.status ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <Link
                                                    to={`/admin/features/assign/${feature.id}`}
                                                    className="btn btn-info"
                                                    title="Assign to categories"
                                                >
                                                    <Diagram3 />
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="btn btn-warning"
                                                    onClick={() => openEditModal(feature)}
                                                >
                                                    <Pencil />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    onClick={() => handleDelete(feature)}
                                                >
                                                    <Trash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Feature Modal */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setShowModal(false)}
                >
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <form className="modal-content" onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingId ? 'Edit Feature' : 'Add Feature'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Feature Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        placeholder="e.g. Brand, Color, Storage"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback">{errors.name}</div>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Input Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        name="input_type"
                                        className={`form-select ${errors.input_type ? 'is-invalid' : ''}`}
                                        value={form.input_type}
                                        onChange={handleChange}
                                    >
                                        {INPUT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.input_type && (
                                        <div className="invalid-feedback">{errors.input_type}</div>
                                    )}
                                </div>
                                {showOptions && (
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Preset Options (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            name="options"
                                            className="form-control"
                                            placeholder="Apple, Samsung, Xiaomi"
                                            value={form.options}
                                            onChange={handleChange}
                                        />
                                        <div className="form-text">
                                            Used for dropdown/checkbox input types.
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Features;