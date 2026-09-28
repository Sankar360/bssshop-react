// src/pages/admin/products/edit/VariantsTab.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
    Diagram3, ArrowRepeat, Save, Plus, Image as ImageIcon,
    Star, StarFill, XCircle, ArrowCounterclockwise,
} from 'react-bootstrap-icons';
import { showToast } from '../../../../utils/toast';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = false) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const imageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const clean = String(path).replace(/^\/+/, '').replace(/^storage\//i, '');
    return `/storage/${clean}`;
};

const slugify = (s) =>
    String(s || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ */
/*  Star preview                                                      */
/* ------------------------------------------------------------------ */
const StarPreview = ({ rating = 0 }) => {
    const r = Number(rating) || 0;
    const full = Math.floor(r);
    const half = r - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
        <span>
            {Array.from({ length: full }).map((_, i) => (
                <StarFill key={`f${i}`} className="text-warning" />
            ))}
            {half && <Star className="text-warning" />}
            {Array.from({ length: empty }).map((_, i) => (
                <Star key={`e${i}`} className="text-warning" />
            ))}
            <span className="ms-2 fw-bold">{r.toFixed(1)}</span>
        </span>
    );
};

/* ------------------------------------------------------------------ */
/*  Blank row factory                                                 */
/* ------------------------------------------------------------------ */
const makeBlankRow = (id) => ({
    _id: `row-${id}`,
    id: null,             // server id — null until saved
    values: {},           // {feature_id: value_id}
    sku: '',
    slug: '',
    price: '',
    sale_price: '',
    discount: 0,
    rating: 0,
    stock: '',
});

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
const VariantsTab = ({ productId }) => {
    const [features, setFeatures] = useState([]);
    const [productName, setProductName] = useState('');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    const nextIdRef = useRef(1);

    /* -------------------------------------------------------------- */
    /*  Load FEATURES only — never hydrate from saved variants        */
    /* -------------------------------------------------------------- */
    const load = async () => {
        setLoading(true);
        try {
            const [varRes, prodRes] = await Promise.all([
                fetch(`${API_BASE}/products/get-variant-features/${productId}`, {
                    method: 'POST',
                    headers: authHeaders(),
                }),
                fetch(`${API_BASE}/products/edit/${productId}`, {
                    headers: authHeaders(),
                }),
            ]);

            const varData = await varRes.json();
            const prodData = await prodRes.json();

            if (prodData.success) {
                const p = prodData.data?.product || prodData.data;
                setProductName(p?.name || '');
            }

            if (!varData.success) {
                showToast(varData.message || 'Failed to load variant features', 'error');
                setFeatures([]);
                setRows([]);
                return;
            }

            const fetchedFeatures =
                varData.data?.features || varData.features || [];
            setFeatures(fetchedFeatures);

            // ✅ Always start with exactly ONE blank row
            setRows([makeBlankRow(nextIdRef.current++)]);
        } catch (err) {
            console.error(err);
            showToast('Failed to load variant features', 'error');
            setRows([makeBlankRow(nextIdRef.current++)]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    /* -------------------------------------------------------------- */
    /*  Row helpers                                                   */
    /* -------------------------------------------------------------- */
    const addRow = () => {
        setRows((list) => [...list, makeBlankRow(nextIdRef.current++)]);
    };

    const removeRow = (rowId) => {
        setRows((list) => {
            const next = list.filter((r) => r._id !== rowId);
            // Keep at least one row
            return next.length === 0
                ? [makeBlankRow(nextIdRef.current++)]
                : next;
        });
    };

    const resetRow = (rowId) => {
        setRows((list) =>
            list.map((r) =>
                r._id === rowId
                    ? {
                          ...makeBlankRow(0),
                          _id: r._id,
                          id: r.id, // keep the server id if it was saved
                      }
                    : r
            )
        );
    };

    const updateRow = (rowId, field, value) => {
        setRows((list) =>
            list.map((r) => (r._id === rowId ? { ...r, [field]: value } : r))
        );
    };

    const setRowValue = (rowId, featureId, valueId) => {
        setRows((list) =>
            list.map((r) =>
                r._id === rowId
                    ? {
                          ...r,
                          values: {
                              ...r.values,
                              [String(featureId)]: String(valueId),
                          },
                      }
                    : r
            )
        );
    };

    /* -------------------------------------------------------------- */
    /*  Auto-slug                                                     */
    /* -------------------------------------------------------------- */
    const generateSlugForRow = (rowId) => {
        setRows((list) =>
            list.map((r) => {
                if (r._id !== rowId) return r;

                const parts = Object.entries(r.values)
                    .map(([fid, vid]) => {
                        const f = features.find(
                            (x) => String(x.feature_id) === String(fid)
                        );
                        const v = f?.values?.find(
                            (x) => String(x.id) === String(vid)
                        );
                        return v?.value || vid;
                    })
                    .map(slugify)
                    .filter(Boolean);

                const autoSlug = slugify(
                    [productName, ...parts].filter(Boolean).join(' ')
                );
                return { ...r, slug: autoSlug };
            })
        );
    };

    /* -------------------------------------------------------------- */
    /*  Auto-discount                                                 */
    /* -------------------------------------------------------------- */
    const autoDiscount = (price, salePrice) => {
        const p = Number(price) || 0;
        const s = Number(salePrice) || 0;
        return p > 0 && s > 0 && s < p
            ? Math.round(((p - s) / p) * 100)
            : 0;
    };

    /* -------------------------------------------------------------- */
    /*  Save one row                                                  */
    /* -------------------------------------------------------------- */
    const saveRow = async (row) => {
        if (!row.sku?.trim() || row.price === '' || row.price === null) {
            showToast('SKU and Price are required', 'warning');
            return;
        }

        const missing = features.find(
            (f) => !row.values[String(f.feature_id)]
        );
        if (missing) {
            showToast(`Please select a value for "${missing.name}"`, 'warning');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/products/save-variants`, {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify({
                    product_id: productId,
                    variants: [
                        {
                            feature_values: row.values,
                            sku: row.sku,
                            slug: row.slug,
                            price: row.price,
                            sale_price: row.sale_price || 0,
                            discount: row.discount || 0,
                            rating: row.rating || 0,
                            stock: row.stock || 0,
                        },
                    ],
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Variant saved', 'success');

                // Clear this row and replace with a fresh blank one
                setRows((list) => {
                    const filtered = list.filter((r) => r._id !== row._id);
                    return filtered.length === 0
                        ? [makeBlankRow(nextIdRef.current++)]
                        : filtered;
                });
            } else {
                showToast(data.message || 'Failed to save variant', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error saving variant', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Save all valid rows                                           */
    /* -------------------------------------------------------------- */
    const saveAll = async () => {
        const valid = rows.filter(
            (r) =>
                r.sku?.trim() &&
                r.price !== '' &&
                features.every((f) => r.values[String(f.feature_id)])
        );

        if (valid.length === 0) {
            showToast(
                'No valid rows to save (fill SKU, price, and every feature value)',
                'warning'
            );
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/products/save-variants`, {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify({
                    product_id: productId,
                    variants: valid.map((r) => ({
                        feature_values: r.values,
                        sku: r.sku,
                        slug: r.slug,
                        price: r.price,
                        sale_price: r.sale_price || 0,
                        discount: r.discount || 0,
                        rating: r.rating || 0,
                        stock: r.stock || 0,
                    })),
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(
                    `${data.data?.saved_count ?? valid.length} variants saved`,
                    'success'
                );

                // Reset to one fresh blank row after saving
                setRows([makeBlankRow(nextIdRef.current++)]);
            } else {
                showToast(data.message || 'Failed to save variants', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error saving variants', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Upload image (only for rows that have been saved)             */
    /* -------------------------------------------------------------- */
    const uploadImage = async (row, file) => {
        if (!file) return;
        if (!row.id) {
            showToast('Save the variant first, then upload images.', 'info');
            return;
        }

        const fd = new FormData();
        fd.append('image', file);

        try {
            const res = await fetch(
                `${API_BASE}/products/upload-variant-image/${row.id}`,
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
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Upload error', 'error');
        }
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

    if (features.length === 0) {
        return (
            <div className="alert alert-info">
                This product has no variant features.
                <br />
                Assign features to the product's subcategory first, then fill
                in feature values on the <strong>Features</strong> tab.
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="mb-0">
                        <Diagram3 /> Product Variants
                    </h5>
                    <small className="text-muted">
                        Fill in a row, click <strong>Save Variant</strong>, then
                        click <strong>Add Row</strong> for the next one. Use{' '}
                        <strong>Save All Variants</strong> to save every filled row
                        at once.
                    </small>
                </div>
                <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={load}
                >
                    <ArrowRepeat /> Refresh
                </button>
            </div>

            <div className="card-body">
                {/* ============ VARIANT ROWS ============ */}
                {rows.map((row, index) => (
                    <div className="card mb-3" key={row._id}>
                        {/* Row header */}
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <strong>Variant #{index + 1}</strong>
                                {row.id && (
                                    <span className="badge bg-success">
                                        <i className="bi bi-check-circle" /> Saved
                                    </span>
                                )}
                            </div>
                            <div className="d-flex gap-2">
                                {row.id && (
                                    <label className="btn btn-sm btn-info mb-0">
                                        <ImageIcon /> Images
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) uploadImage(row, f);
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => removeRow(row._id)}
                                >
                                    <XCircle /> Remove
                                </button>
                            </div>
                        </div>

                        {/* Row body */}
                        <div className="card-body">
                            {/* Feature dropdowns */}
                            {features.map((f) => (
                                <div
                                    className="row align-items-center mb-2"
                                    key={f.feature_id}
                                >
                                    <label className="col-md-3 col-form-label fw-bold">
                                        {f.name}
                                    </label>
                                    <div className="col-md-9">
                                        <select
                                            className="form-select form-select-sm"
                                            value={
                                                row.values[String(f.feature_id)] || ''
                                            }
                                            onChange={(e) => {
                                                setRowValue(
                                                    row._id,
                                                    f.feature_id,
                                                    e.target.value
                                                );
                                                setTimeout(
                                                    () =>
                                                        generateSlugForRow(row._id),
                                                    0
                                                );
                                            }}
                                        >
                                            <option value="">
                                                Select {f.name}
                                            </option>
                                            {(f.values || []).map((v) => (
                                                <option
                                                    key={v.id}
                                                    value={String(v.id)}
                                                >
                                                    {v.value}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}

                            <hr />

                            {/* SKU */}
                            <div className="row mb-2">
                                <label className="col-md-3 col-form-label">
                                    SKU <span className="text-danger">*</span>
                                </label>
                                <div className="col-md-9">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={row.sku}
                                        onChange={(e) =>
                                            updateRow(row._id, 'sku', e.target.value)
                                        }
                                        placeholder="e.g. BATT-YEL-64"
                                    />
                                </div>
                            </div>

                            {/* Slug */}
                            <div className="row mb-2">
                                <label className="col-md-3 col-form-label">
                                    Slug
                                </label>
                                <div className="col-md-9">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={row.slug}
                                        onChange={(e) =>
                                            updateRow(row._id, 'slug', e.target.value)
                                        }
                                        placeholder="auto-generated"
                                    />
                                </div>
                            </div>

                            {/* Price / Sale / Discount */}
                            <div className="row mb-2">
                                <div className="col-md-4">
                                    <label className="form-label small">
                                        Price{' '}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            min="0"
                                            step="0.01"
                                            value={row.price}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                updateRow(row._id, 'price', v);
                                                updateRow(
                                                    row._id,
                                                    'discount',
                                                    autoDiscount(v, row.sale_price)
                                                );
                                            }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small">
                                        Sale Price
                                    </label>
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            min="0"
                                            step="0.01"
                                            value={row.sale_price}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                updateRow(row._id, 'sale_price', v);
                                                updateRow(
                                                    row._id,
                                                    'discount',
                                                    autoDiscount(row.price, v)
                                                );
                                            }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small">
                                        Discount %
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        value={row.discount}
                                        readOnly
                                        tabIndex={-1}
                                    />
                                </div>
                            </div>

                            {/* Rating / Stock */}
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label small">
                                        Rating (0–5)
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={row.rating}
                                        onChange={(e) =>
                                            updateRow(row._id, 'rating', e.target.value)
                                        }
                                    />
                                    <div className="mt-1">
                                        <StarPreview rating={row.rating} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small">
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        min="0"
                                        value={row.stock}
                                        onChange={(e) =>
                                            updateRow(row._id, 'stock', e.target.value)
                                        }
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Row actions */}
                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-success"
                                    onClick={() => saveRow(row)}
                                >
                                    <Save className="me-1" /> Save Variant
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => resetRow(row._id)}
                                >
                                    <ArrowCounterclockwise className="me-1" /> Reset
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* ============ BOTTOM ACTIONS ============ */}
                <div className="d-flex gap-2 mt-3">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={addRow}
                    >
                        <Plus className="me-1" /> Add Row
                    </button>
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={saveAll}
                        disabled={rows.length === 0}
                    >
                        <Save className="me-1" /> Save All Variants
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariantsTab;