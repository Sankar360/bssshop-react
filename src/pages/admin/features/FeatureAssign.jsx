// src/pages/admin/features/FeatureAssign.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Diagram3, ArrowLeft, ListCheck, PlusCircle, Pencil, Trash, InfoCircle,
    Folder, Palette, Save,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const formatDate = (s) =>
    s
        ? new Date(s).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
          })
        : '—';

const FeatureAssign = () => {
    const { featureId } = useParams();
    const navigate = useNavigate();

    const [feature, setFeature] = useState(null);
    const [categoryTree, setCategoryTree] = useState([]);
    const [assignedIds, setAssignedIds] = useState([]);
    const [featureValues, setFeatureValues] = useState([]);
    const [loading, setLoading] = useState(true);

    const [parents, setParents] = useState({});
    const [subs, setSubs] = useState({});
    const [singles, setSingles] = useState({});

    const [savingAssignment, setSavingAssignment] = useState(false);
    const [activeTab, setActiveTab] = useState('assign');

    const [showValueModal, setShowValueModal] = useState(false);
    const [editingValueId, setEditingValueId] = useState(null);
    const [valueForm, setValueForm] = useState({
        value: '',
        sort_order: 0,
        status: true,
    });
    const [colorPreview, setColorPreview] = useState('#ffffff');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorPick, setColorPick] = useState('#ff0000');

    const isColorFeature = feature?.name?.toLowerCase() === 'color';

    /* -------------------------------------------------------------- */
    /*  Load                                                           */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/features/assign/${featureId}`, {
                    headers: authHeaders(false),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const p = data.data;

                    // ✅ Read BOTH snake_case and camelCase keys
                    const tree     = p.category_tree         || p.categoryTree         || [];
                    const assigned = p.assigned_category_ids || p.assignedCategoryIds || [];
                    const values   = p.feature_values        || p.featureValues        || [];

                    setFeature(p.feature);
                    setCategoryTree(tree);
                    setAssignedIds(assigned);
                    setFeatureValues(values);

                    // Initialize checkbox states
                    const pState = {};
                    const sState = {};
                    const singleState = {};

                    tree.forEach((parent) => {
                        if (parent.children?.length) {
                            const hasAnyChild = parent.children.some((c) =>
                                assigned.includes(c.id)
                            );
                            const isParentItself = assigned.includes(parent.id);
                            pState[parent.id] = hasAnyChild || isParentItself;

                            parent.children.forEach((child) => {
                                sState[child.id] = assigned.includes(child.id);
                            });
                        } else {
                            singleState[parent.id] = assigned.includes(parent.id);
                        }
                    });

                    setParents(pState);
                    setSubs(sState);
                    setSingles(singleState);
                } else {
                    showToast('Feature not found', 'error');
                    setTimeout(() => navigate('/admin/features'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load feature', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [featureId, navigate]);

    /* -------------------------------------------------------------- */
    /*  Checkbox logic                                                 */
    /* -------------------------------------------------------------- */
    const toggleParent = (parentId, children) => {
        const newVal = !parents[parentId];
        setParents((p) => ({ ...p, [parentId]: newVal }));

        if (!newVal) {
            const cleared = { ...subs };
            children.forEach((c) => (cleared[c.id] = false));
            setSubs(cleared);
        }
    };

    const toggleSub = (parentId, childId, children) => {
        const newVal = !subs[childId];
        const updated = { ...subs, [childId]: newVal };
        setSubs(updated);

        const anyChecked = children.some((c) => updated[c.id]);
        setParents((p) => ({ ...p, [parentId]: anyChecked }));
    };

    const toggleSingle = (catId) => {
        setSingles((s) => ({ ...s, [catId]: !s[catId] }));
    };

    /* -------------------------------------------------------------- */
    /*  Save assignment                                                */
    /* -------------------------------------------------------------- */
    const handleSaveAssignment = async (e) => {
        e.preventDefault();

        const categoryIds = [];
        const subCategoryIds = [];

        categoryTree.forEach((parent) => {
            if (parent.children?.length) {
                const anyChild = parent.children.some((c) => subs[c.id]);
                if (anyChild) {
                    parent.children.forEach((c) => {
                        if (subs[c.id]) subCategoryIds.push(c.id);
                    });
                } else if (parents[parent.id]) {
                    categoryIds.push(parent.id);
                }
            } else if (singles[parent.id]) {
                categoryIds.push(parent.id);
            }
        });

        if (categoryIds.length === 0 && subCategoryIds.length === 0) {
            showToast('Please select at least one category or subcategory', 'warning');
            return;
        }

        setSavingAssignment(true);
        try {
            const res = await fetch(`${API_BASE}/features/save-assignment/${featureId}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    category_ids: categoryIds,
                    sub_category_ids: subCategoryIds,
                }),
            });
            const data = await res.json();

            if (data.success) {
                showToast(
                    `Assignment saved successfully (${data.total_saved || 0} records)`,
                    'success'
                );
                setAssignedIds([...categoryIds, ...subCategoryIds]);
            } else {
                showToast(data.message || 'Failed to save assignment', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSavingAssignment(false);
        }
    };

    /* -------------------------------------------------------------- */
    /*  Value handlers                                                 */
    /* -------------------------------------------------------------- */
    const resetValueForm = () => {
        setEditingValueId(null);
        setValueForm({ value: '', sort_order: 0, status: true });
        setColorPreview('#ffffff');
    };

    const openAddValue = () => {
        resetValueForm();
        setShowValueModal(true);
    };

    const openEditValue = (value) => {
        setEditingValueId(value.id);
        setValueForm({
            value: value.value || '',
            sort_order: value.sort_order ?? 0,
            status: value.status == 1,
        });
        setColorPreview(value.value || '#ffffff');
        setShowValueModal(true);
    };

    const handleValueChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newVal = type === 'checkbox' ? checked : value;
        setValueForm((f) => ({ ...f, [name]: newVal }));

        if (name === 'value' && isColorFeature) {
            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
                setColorPreview(value);
            }
        }
    };

    const handleSaveValue = async (e) => {
        e.preventDefault();
        const url = editingValueId
            ? `${API_BASE}/features/update-value/${editingValueId}`
            : `${API_BASE}/features/store-value`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    feature_id: feature.id,
                    value: valueForm.value,
                    sort_order: valueForm.sort_order,
                    status: valueForm.status ? 1 : 0,
                }),
            });
            const data = await res.json();

            if (data.success) {
                showToast(data.message || 'Value saved successfully', 'success');
                setShowValueModal(false);

                const r2 = await fetch(`${API_BASE}/features/assign/${featureId}`, {
                    headers: authHeaders(false),
                });
                const d2 = await r2.json();
                if (d2.success) {
                    setFeatureValues(
                        d2.data.feature_values || d2.data.featureValues || []
                    );
                }
            } else {
                showToast(data.message || 'Failed to save value', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const handleDeleteValue = async (id) => {
        if (!window.confirm('Delete this feature value? This action cannot be undone.'))
            return;
        try {
            const res = await fetch(`${API_BASE}/features/delete-value/${id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Value deleted successfully', 'success');
                setFeatureValues((list) => list.filter((v) => v.id !== id));
            } else {
                showToast(data.message || 'Failed to delete value', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const handleToggleValueStatus = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/features/toggle-value-status/${id}`, {
                method: 'POST',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Status updated', 'success');
                setFeatureValues((list) =>
                    list.map((v) =>
                        v.id === id ? { ...v, status: v.status ? 0 : 1 } : v
                    )
                );
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const applyColor = () => {
        setValueForm((f) => ({ ...f, value: colorPick }));
        setColorPreview(colorPick);
        setShowColorPicker(false);
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

    if (!feature) return null;

    return (
        <>
            <style>{`
                .color-preview {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    vertical-align: middle;
                    margin-right: 5px;
                }
                .table td { vertical-align: middle; }
                .subcategory-checkbox:disabled { opacity: .5; cursor: not-allowed; }
                .form-check-label { cursor: pointer; }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Diagram3 className="text-primary me-2" /> Feature: {feature.name}
                </h2>
                <Link to="/admin/features" className="btn btn-secondary">
                    <ArrowLeft className="me-1" /> Back to Features
                </Link>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'assign' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assign')}
                        type="button"
                    >
                        <Diagram3 className="me-1" /> Category Assignment
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'values' ? 'active' : ''}`}
                        onClick={() => setActiveTab('values')}
                        type="button"
                    >
                        <ListCheck className="me-1" /> Feature Values
                        <span className="badge bg-primary ms-1">{featureValues.length}</span>
                    </button>
                </li>
            </ul>

            {activeTab === 'assign' && (
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">
                            Choose which categories/subcategories use this feature
                        </h5>
                        <small className="text-muted">
                            <InfoCircle className="me-1" />
                            Check a category to assign this feature. If a category has
                            subcategories, you can select them individually.
                        </small>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSaveAssignment}>
                            {categoryTree.length === 0 ? (
                                <p className="text-muted">
                                    No categories found.{' '}
                                    <Link to="/admin/product-categories/create">
                                        Create one first
                                    </Link>
                                    .
                                </p>
                            ) : (
                                <>
                                    {categoryTree.map((parent) => {
                                        const hasChildren = parent.children?.length > 0;

                                        if (hasChildren) {
                                            return (
                                                <div
                                                    key={parent.id}
                                                    className="mb-3 border rounded p-3"
                                                >
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`parent_${parent.id}`}
                                                            checked={!!parents[parent.id]}
                                                            onChange={() =>
                                                                toggleParent(
                                                                    parent.id,
                                                                    parent.children
                                                                )
                                                            }
                                                        />
                                                        <label
                                                            className="form-check-label fw-bold"
                                                            htmlFor={`parent_${parent.id}`}
                                                        >
                                                            <Folder className="me-1" />
                                                            {parent.name}
                                                            <span className="badge bg-info ms-1">
                                                                {parent.children.length}{' '}
                                                                subcategories
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div className="ms-4 mt-2 row">
                                                        {parent.children.map((child) => (
                                                            <div
                                                                className="col-md-4 form-check"
                                                                key={child.id}
                                                            >
                                                                <input
                                                                    className="form-check-input subcategory-checkbox"
                                                                    type="checkbox"
                                                                    id={`sub_${child.id}`}
                                                                    checked={!!subs[child.id]}
                                                                    disabled={!parents[parent.id]}
                                                                    onChange={() =>
                                                                        toggleSub(
                                                                            parent.id,
                                                                            child.id,
                                                                            parent.children
                                                                        )
                                                                    }
                                                                />
                                                                <label
                                                                    className="form-check-label"
                                                                    htmlFor={`sub_${child.id}`}
                                                                >
                                                                    {child.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={parent.id}
                                                className="mb-3 border rounded p-3"
                                            >
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`cat_${parent.id}`}
                                                        checked={!!singles[parent.id]}
                                                        onChange={() =>
                                                            toggleSingle(parent.id)
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label fw-bold"
                                                        htmlFor={`cat_${parent.id}`}
                                                    >
                                                        <Folder className="me-1" />
                                                        {parent.name}
                                                        <span className="badge bg-secondary ms-1">
                                                            No subcategories
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="mt-3">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={savingAssignment}
                                        >
                                            {savingAssignment ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="me-1" /> Save Assignment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'values' && (
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <ListCheck className="me-1" /> Feature Values for: {feature.name}
                        </h5>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={openAddValue}
                        >
                            <PlusCircle className="me-1" /> Add Value
                        </button>
                    </div>
                    <div className="card-body">
                        {featureValues.length === 0 ? (
                            <div className="alert alert-info">
                                <InfoCircle className="me-1" />
                                No values added for this feature yet. Click "Add Value" to add
                                preset values.
                                <br />
                                <small className="text-muted">
                                    Example: For "Color", add values like Red, Blue, Black, etc.
                                </small>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Value</th>
                                            <th>Sort Order</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {featureValues.map((value, index) => (
                                            <tr key={value.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    {isColorFeature && (
                                                        <span
                                                            className="color-preview"
                                                            style={{
                                                                background: value.value,
                                                            }}
                                                        />
                                                    )}
                                                    <strong>{value.value}</strong>
                                                </td>
                                                <td>{value.sort_order ?? 0}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm badge bg-${
                                                            (value.status ?? 1)
                                                                ? 'success'
                                                                : 'secondary'
                                                        } border-0`}
                                                        onClick={() =>
                                                            handleToggleValueStatus(value.id)
                                                        }
                                                    >
                                                        {(value.status ?? 1)
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td>{formatDate(value.created_at)}</td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            type="button"
                                                            className="btn btn-warning"
                                                            onClick={() => openEditValue(value)}
                                                        >
                                                            <Pencil />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger"
                                                            onClick={() =>
                                                                handleDeleteValue(value.id)
                                                            }
                                                        >
                                                            <Trash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showValueModal && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setShowValueModal(false)}
                >
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <form className="modal-content" onSubmit={handleSaveValue}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingValueId ? 'Edit Feature Value' : 'Add Feature Value'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowValueModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Value <span className="text-danger">*</span>
                                    </label>
                                    {isColorFeature ? (
                                        <>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    name="value"
                                                    className="form-control"
                                                    placeholder="e.g., #FF0000"
                                                    value={valueForm.value}
                                                    onChange={handleValueChange}
                                                    required
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => setShowColorPicker(true)}
                                                >
                                                    <Palette className="me-1" /> Pick Color
                                                </button>
                                            </div>
                                            <div className="mt-2">
                                                <div
                                                    style={{
                                                        width: 50,
                                                        height: 50,
                                                        borderRadius: 8,
                                                        border: '2px solid #ddd',
                                                        background: colorPreview,
                                                    }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            name="value"
                                            className="form-control"
                                            placeholder="Enter value (e.g., 64GB, 12GB, 5000mAh)"
                                            value={valueForm.value}
                                            onChange={handleValueChange}
                                            required
                                        />
                                    )}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Sort Order</label>
                                    <input
                                        type="number"
                                        name="sort_order"
                                        className="form-control"
                                        value={valueForm.sort_order}
                                        onChange={handleValueChange}
                                    />
                                    <div className="form-text text-muted">
                                        Lower numbers appear first.
                                    </div>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="status"
                                        id="value_status"
                                        checked={valueForm.status}
                                        onChange={handleValueChange}
                                    />
                                    <label className="form-check-label" htmlFor="value_status">
                                        Active
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowValueModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Value
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showColorPicker && isColorFeature && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)', zIndex: 1060 }}
                    tabIndex="-1"
                    onClick={() => setShowColorPicker(false)}
                >
                    <div
                        className="modal-dialog modal-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Choose Color</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowColorPicker(false)}
                                ></button>
                            </div>
                            <div className="modal-body text-center">
                                <input
                                    type="color"
                                    value={colorPick}
                                    onChange={(e) => setColorPick(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: 100,
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                />
                                <div className="mt-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={colorPick}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowColorPicker(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={applyColor}
                                >
                                    Apply Color
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FeatureAssign;