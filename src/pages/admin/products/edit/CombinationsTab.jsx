// src/pages/admin/products/edit/CombinationsTab.jsx
import React, { useEffect, useState } from 'react';
import {
    ListCheck, ArrowRepeat, Save, Trash, ChevronDown, ChevronUp,
    Image as ImageIcon, StarFill, Upload,
} from 'react-bootstrap-icons';
import { showToast } from '../../../../utils/toast';
import API_URL from "../../../../api/config";
import { productImage as imageUrl } from "../../../../utils/productImage";

const API_BASE = API_URL + "/admin";
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = false) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const CombinationsTab = ({ productId }) => {
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [saving, setSaving] = useState({}); // { [id]: bool }

    /* -------------------------------------------------------------- */
    /*  Load                                                          */
    /* -------------------------------------------------------------- */
    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/products/get-combinations/${productId}`, {
                method: 'POST',
                headers: authHeaders(),
            });
            const data = await res.json();

            if (!data.success) {
                showToast(data.message || 'Failed to load combinations', 'error');
                setCombos([]);
                return;
            }

            // Response shape: { success, data: [...variants] }
            // or legacy { success, combinations: [...] }
            const list = data.data || data.combinations || [];
            setCombos(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error(err);
            showToast('Failed to load combinations', 'error');
            setCombos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    /* -------------------------------------------------------------- */
    /*  Row edit helpers (update local state, save on Submit)        */
    /* -------------------------------------------------------------- */
    const updateCombo = (id, field, value) => {
        setCombos((list) =>
            list.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        );
    };

    const autoDiscount = (price, salePrice) => {
        const p = Number(price) || 0;
        const s = Number(salePrice) || 0;
        if (p > 0 && s > 0 && s < p) {
            return Math.round(((p - s) / p) * 100);
        }
        return 0;
    };

    /* -------------------------------------------------------------- */
    /*  Save a single combination                                     */
    /* -------------------------------------------------------------- */
    const saveCombo = async (combo) => {
        setSaving((s) => ({ ...s, [combo.id]: true }));
        try {
            const fd = new FormData();
            fd.append('variant_id', combo.id);
            fd.append('sku', combo.sku || '');
            fd.append('slug', combo.slug || '');
            fd.append('price', combo.price || 0);
            fd.append('sale_price', combo.sale_price || 0);
            fd.append('discount', combo.discount || 0);
            fd.append('rating', combo.rating || 0);
            fd.append('stock', combo.stock || 0);

            const res = await fetch(`${API_BASE}/products/update-combination`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: fd,
            });
            const data = await res.json();

            if (data.success) {
                showToast('Combination updated', 'success');
                await load();
            } else {
                showToast(data.message || 'Failed to update', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error saving combination', 'error');
        } finally {
            setSaving((s) => ({ ...s, [combo.id]: false }));
        }
    };

    /* -------------------------------------------------------------- */
    /*  Delete                                                         */
    /* -------------------------------------------------------------- */
    const deleteCombo = async (combo) => {
        if (!window.confirm(`Delete combination "${combo.slug}"?`)) return;
        try {
            const res = await fetch(
                `${API_BASE}/products/delete-combination/${combo.id}`,
                { method: 'DELETE', headers: authHeaders() }
            );
            const data = await res.json();
            if (data.success) {
                showToast('Combination deleted', 'success');
                await load();
            } else {
                showToast(data.message || 'Failed to delete', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error deleting combination', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Upload image for a saved combination                         */
    /* -------------------------------------------------------------- */
    const uploadImage = async (combo, file) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await fetch(
                `${API_BASE}/products/upload-variant-image/${combo.id}`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: fd,
                }
            );
            const data = await res.json();
            if (data.success) {
                showToast('Image uploaded', 'success');
                await load();
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Upload error', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Delete image                                                  */
    /* -------------------------------------------------------------- */
    const deleteImage = async (imageId) => {
        if (!window.confirm('Remove this image?')) return;
        try {
            const res = await fetch(
                `${API_BASE}/products/delete-variant-image/${imageId}`,
                { method: 'DELETE', headers: authHeaders() }
            );
            const data = await res.json();
            if (data.success) {
                showToast('Image removed', 'success');
                await load();
            } else {
                showToast(data.message || 'Failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Set image as primary                                          */
    /* -------------------------------------------------------------- */
    const setPrimaryImage = async (imageId) => {
        try {
            const res = await fetch(
                `${API_BASE}/products/set-primary-variant-image/${imageId}`,
                { method: 'POST', headers: authHeaders() }
            );
            const data = await res.json();
            if (data.success) {
                showToast('Primary image updated', 'success');
                await load();
            } else {
                showToast(data.message || 'Failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Feature label helper                                          */
    /* -------------------------------------------------------------- */
    const comboLabel = (combo) => {
        const values = combo.values || [];
        if (values.length === 0) return combo.slug || `#${combo.id}`;
        return values
            .map((v) => v.display_value || v.option_value || v.value)
            .filter(Boolean)
            .join(' / ');
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                        */
    /* -------------------------------------------------------------- */
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" />
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                    <ListCheck /> Saved Combinations
                    <span className="badge bg-primary ms-2">{combos.length}</span>
                </h5>
                <button className="btn btn-sm btn-outline-primary" onClick={load}>
                    <ArrowRepeat /> Refresh
                </button>
            </div>

            <div className="card-body">
                {combos.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <ListCheck style={{ fontSize: '3rem', opacity: 0.4 }} />
                        <p className="mt-3">
                            No combinations saved yet.
                            <br />
                            Go to the <strong>Variants</strong> tab to create combinations.
                        </p>
                    </div>
                ) : (
                    <div className="list-group">
                        {combos.map((combo) => {
                            const isOpen = expandedId === combo.id;
                            const price = Number(combo.price) || 0;
                            const salePrice = Number(combo.sale_price) || 0;
                            const discount = Number(combo.discount) || 0;
                            const rating = Number(combo.rating) || 0;
                            const stock = Number(combo.stock) || 0;
                            const images = combo.images || [];

                            return (
                                <div
                                    className="card mb-2"
                                    key={combo.id}
                                    style={{ overflow: 'hidden' }}
                                >
                                    {/* ---------- Header ---------- */}
                                    <div
                                        className="card-header d-flex justify-content-between align-items-center"
                                        style={{ cursor: 'pointer', background: '#f8f9fc' }}
                                        onClick={() =>
                                            setExpandedId(isOpen ? null : combo.id)
                                        }
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            {isOpen ? <ChevronUp /> : <ChevronDown />}
                                            <strong>{comboLabel(combo)}</strong>
                                            <span className="badge bg-info">
                                                SKU: {combo.sku || 'N/A'}
                                            </span>
                                            {discount > 0 && (
                                                <span className="badge bg-danger">
                                                    -{discount}%
                                                </span>
                                            )}
                                            {images.length > 0 && (
                                                <span className="badge bg-secondary">
                                                    <ImageIcon /> {images.length}
                                                </span>
                                            )}
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge bg-success">
                                                ₹{salePrice > 0 ? salePrice.toFixed(2) : price.toFixed(2)}
                                            </span>
                                            {salePrice > 0 && (
                                                <span className="badge bg-secondary text-decoration-line-through">
                                                    ₹{price.toFixed(2)}
                                                </span>
                                            )}
                                            <span className="badge bg-warning text-dark">
                                                <StarFill /> {rating.toFixed(1)}
                                            </span>
                                            <span className="badge bg-dark">
                                                Stock: {stock}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ---------- Body (when expanded) ---------- */}
                                    {isOpen && (
                                        <div className="card-body">
                                            {/* Feature values */}
                                            <div className="mb-3">
                                                <h6 className="text-primary">
                                                    Feature Values
                                                </h6>
                                                <div className="row g-2">
                                                    {(combo.values || []).map((v, i) => (
                                                        <div className="col-md-6" key={i}>
                                                            <div className="small text-muted">
                                                                {v.feature_name || `Feature ${v.feature_id}`}
                                                            </div>
                                                            <div className="fw-semibold">
                                                                {v.display_value ||
                                                                    v.option_value ||
                                                                    v.value}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <hr />

                                            {/* Editable fields */}
                                            <div className="row g-3">
                                                <div className="col-md-3">
                                                    <label className="form-label small fw-semibold">
                                                        SKU
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={combo.sku || ''}
                                                        onChange={(e) =>
                                                            updateCombo(combo.id, 'sku', e.target.value)
                                                        }
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label small fw-semibold">
                                                        Slug
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={combo.slug || ''}
                                                        onChange={(e) =>
                                                            updateCombo(combo.id, 'slug', e.target.value)
                                                        }
                                                    />
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="form-label small fw-semibold">
                                                        Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={combo.price || ''}
                                                        min="0"
                                                        step="0.01"
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            updateCombo(combo.id, 'price', v);
                                                            updateCombo(
                                                                combo.id,
                                                                'discount',
                                                                autoDiscount(v, combo.sale_price)
                                                            );
                                                        }}
                                                    />
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="form-label small fw-semibold">
                                                        Sale Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={combo.sale_price || ''}
                                                        min="0"
                                                        step="0.01"
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            updateCombo(combo.id, 'sale_price', v);
                                                            updateCombo(
                                                                combo.id,
                                                                'discount',
                                                                autoDiscount(combo.price, v)
                                                            );
                                                        }}
                                                    />
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="form-label small fw-semibold">
                                                        Discount %
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={combo.discount || 0}
                                                        readOnly
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label small fw-semibold">
                                                        Rating (0-5)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={combo.rating || 0}
                                                        min="0"
                                                        max="5"
                                                        step="0.1"
                                                        onChange={(e) =>
                                                            updateCombo(combo.id, 'rating', e.target.value)
                                                        }
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label small fw-semibold">
                                                        Stock
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={combo.stock || 0}
                                                        min="0"
                                                        onChange={(e) =>
                                                            updateCombo(combo.id, 'stock', e.target.value)
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <hr />

                                            {/* Images */}
                                            <div className="mb-3">
                                                <h6 className="text-primary">
                                                    <ImageIcon /> Images
                                                </h6>
                                                <div className="d-flex flex-wrap gap-2 mb-2">
                                                    {images.length === 0 && (
                                                        <span className="text-muted small">
                                                            No images yet
                                                        </span>
                                                    )}
                                                    {images.map((img) => (
                                                        <div
                                                            key={img.id}
                                                            className="position-relative"
                                                            style={{
                                                                width: 90,
                                                                height: 90,
                                                                borderRadius: 6,
                                                                overflow: 'hidden',
                                                                border:
                                                                    img.is_primary
                                                                        ? '3px solid #4e73df'
                                                                        : '1px solid #dee2e6',
                                                            }}
                                                        >
                                                            <img
                                                                src={imageUrl(img.image)}
                                                                alt=""
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                }}
                                                            />
                                                            {!img.is_primary && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-light position-absolute top-0 start-0 m-1 p-0 px-1"
                                                                    style={{ fontSize: 10 }}
                                                                    title="Make primary"
                                                                    onClick={() =>
                                                                        setPrimaryImage(img.id)
                                                                    }
                                                                >
                                                                    ★
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 px-1"
                                                                style={{ fontSize: 10 }}
                                                                onClick={() =>
                                                                    deleteImage(img.id)
                                                                }
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <label className="btn btn-sm btn-outline-primary mb-0">
                                                    <Upload /> Upload Image
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) uploadImage(combo, f);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            {/* Actions */}
                                            <div className="d-flex gap-2 mt-3 pt-3 border-top">
                                                <button
                                                    type="button"
                                                    className="btn btn-success"
                                                    onClick={() => saveCombo(combo)}
                                                    disabled={saving[combo.id]}
                                                >
                                                    {saving[combo.id] ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="me-1" /> Save Changes
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => deleteCombo(combo)}
                                                >
                                                    <Trash className="me-1" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CombinationsTab;