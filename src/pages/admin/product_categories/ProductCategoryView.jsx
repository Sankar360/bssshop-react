// src/pages/admin/product_categories/ProductCategoryView.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Diagram3, ArrowLeft, Pencil, PlusCircle, Trash,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const ProductCategoryView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [category, setCategory] = useState(null);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Subcategory modal
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingSubId, setEditingSubId] = useState(null);
    const [subForm, setSubForm] = useState({
        name: '',
        icon: '',
        sort_order: 0,
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load                                                           */
    /* -------------------------------------------------------------- */
    const fetchCategory = async () => {
        try {
            const res = await fetch(`${API_BASE}/product-categories/view/${id}`, {
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success && data.data) {
                const p = data.data;
                setCategory(p.category || p);
                setSubcategories(p.subcategories || p.children || []);
            } else {
                showToast('Category not found', 'error');
                setTimeout(() => navigate('/admin/product-categories'), 800);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load category', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    /* -------------------------------------------------------------- */
    /*  Subcategory modal handlers                                     */
    /* -------------------------------------------------------------- */
    const openAddSub = () => {
        setEditingSubId(null);
        setSubForm({ name: '', icon: '', sort_order: 0, is_active: true });
        setShowSubModal(true);
    };

    const openEditSub = (sub) => {
        setEditingSubId(sub.id);
        setSubForm({
            name: sub.name || '',
            icon: sub.icon || '',
            sort_order: sub.sort_order ?? 0,
            is_active: sub.is_active == 1,
        });
        setShowSubModal(true);
    };

    const handleSubChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSubForm((f) => ({
            ...f,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSaveSub = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const url = editingSubId
            ? `${API_BASE}/product-categories/update/${editingSubId}`
            : `${API_BASE}/product-categories/store`;

        const payload = {
            name: subForm.name,
            icon: subForm.icon,
            sort_order: Number(subForm.sort_order),
            is_active: subForm.is_active ? 1 : 0,
            parent_id: category.id,
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                showToast(
                    editingSubId
                        ? 'Subcategory updated successfully'
                        : 'Subcategory created successfully',
                    'success'
                );
                setShowSubModal(false);
                fetchCategory();
            } else {
                showToast(data.message || 'Failed to save subcategory', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteSub = async (sub) => {
        if (!window.confirm('Delete this subcategory?')) return;
        try {
            const res = await fetch(`${API_BASE}/product-categories/delete/${sub.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Subcategory deleted', 'success');
                fetchCategory();
            } else {
                showToast(data.message || 'Failed to delete', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const toggleSubStatus = async (sub) => {
        try {
            const res = await fetch(
                `${API_BASE}/product-categories/toggle-status/${sub.id}`,
                { method: 'POST', headers: authHeaders(false) }
            );
            const data = await res.json();
            if (data.success) {
                showToast('Status updated', 'success');
                fetchCategory();
            } else {
                showToast('Failed to update status', 'error');
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

    if (!category) return null;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <i className={`bi ${category.icon || 'bi-folder'} text-primary me-2`}></i>
                    {category.name}
                </h2>
                <div>
                    <Link to="/admin/product-categories" className="btn btn-secondary">
                        <ArrowLeft className="me-1" /> Back
                    </Link>
                    <Link
                        to={`/admin/product-categories/edit/${category.id}`}
                        className="btn btn-warning ms-2"
                    >
                        <Pencil className="me-1" /> Edit Category
                    </Link>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <Diagram3 className="me-1" /> Subcategories
                    </h5>
                    <button className="btn btn-sm btn-primary" onClick={openAddSub}>
                        <PlusCircle className="me-1" /> Add Subcategory
                    </button>
                </div>
                <div className="card-body">
                    {subcategories.length === 0 ? (
                        <p className="text-muted text-center py-4 mb-0">
                            No subcategories yet. Add one to get started.
                        </p>
                    ) : (
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Sort Order</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subcategories.map((sub, i) => (
                                    <tr key={sub.id}>
                                        <td>{i + 1}</td>
                                        <td className="fw-semibold">{sub.name}</td>
                                        <td>{sub.sort_order}</td>
                                        <td>
                                            <button
                                                className={`btn btn-sm badge bg-${
                                                    sub.is_active ? 'success' : 'secondary'
                                                } border-0`}
                                                onClick={() => toggleSubStatus(sub)}
                                            >
                                                {sub.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <button
                                                    className="btn btn-warning"
                                                    onClick={() => openEditSub(sub)}
                                                >
                                                    <Pencil />
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => deleteSub(sub)}
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

            {/* Add/Edit Subcategory Modal */}
            {showSubModal && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setShowSubModal(false)}
                >
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <form className="modal-content" onSubmit={handleSaveSub}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingSubId ? 'Edit Subcategory' : 'Add Subcategory'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowSubModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        value={subForm.name}
                                        onChange={handleSubChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Icon (bootstrap-icons class)
                                    </label>
                                    <input
                                        type="text"
                                        name="icon"
                                        className="form-control"
                                        placeholder="bi-phone"
                                        value={subForm.icon}
                                        onChange={handleSubChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Sort Order</label>
                                    <input
                                        type="number"
                                        name="sort_order"
                                        className="form-control"
                                        value={subForm.sort_order}
                                        onChange={handleSubChange}
                                    />
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="is_active"
                                        id="sub_is_active"
                                        checked={subForm.is_active}
                                        onChange={handleSubChange}
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="sub_is_active"
                                    >
                                        Active
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowSubModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductCategoryView;