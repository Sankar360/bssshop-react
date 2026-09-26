// src/pages/admin/products/edit/FeaturesTab.jsx
import React, { useEffect, useState } from 'react';
import { Sliders, ArrowRepeat, Save } from 'react-bootstrap-icons';
import { showToast } from '../../../../utils/toast';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';

/**
 * Check if a saved value list matches a given option.
 * Works whether the stored value is the option id or the display value.
 * All comparisons are done as strings.
 */
const matchesOption = (savedList, opt) => {
    if (!Array.isArray(savedList) || savedList.length === 0) return false;

    const id = typeof opt === 'object' && opt !== null ? String(opt.id) : String(opt);
    const val = typeof opt === 'object' && opt !== null ? String(opt.value) : String(opt);

    const saved = savedList.map(String);
    return saved.includes(id) || saved.includes(val);
};

const FeaturesTab = ({ productId }) => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load                                                          */
    /* -------------------------------------------------------------- */
    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/products/get-features/${productId}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
            });
            const data = await res.json();

            if (!data.success) {
                showToast(data.message || 'Failed to load features', 'error');
                setFeatures([]);
                return;
            }

            // Support both response shapes
            const raw = data.data?.features || data.features || [];

            const normalized = raw.map((f) => {
                // Options → array of { id, value } strings
                const options = (f.options_array || []).map((opt) => {
                    if (opt && typeof opt === 'object') {
                        return {
                            id: String(opt.id ?? opt.value ?? ''),
                            value: String(opt.value ?? ''),
                        };
                    }
                    return { id: String(opt), value: String(opt) };
                });

                // Saved value → array of strings (always)
                let saved;
                if (f.input_type === 'checkbox') {
                    if (Array.isArray(f.saved_value)) {
                        saved = f.saved_value.map(String);
                    } else if (typeof f.saved_value === 'string') {
                        saved = f.saved_value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                    } else {
                        saved = [];
                    }
                } else {
                    // text / dropdown → single string
                    saved = f.saved_value === null || f.saved_value === undefined
                        ? ''
                        : String(f.saved_value);
                }

                return {
                    ...f,
                    options_array: options,
                    saved_value: saved,
                };
            });

            setFeatures(normalized);
        } catch (err) {
            console.error(err);
            showToast('Failed to load features', 'error');
            setFeatures([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    /* -------------------------------------------------------------- */
    /*  Value setters                                                 */
    /* -------------------------------------------------------------- */
    const setFeatureValue = (featureId, value, isArray = false) => {
        setFeatures((list) =>
            list.map((f) => {
                if (f.id !== featureId) return f;

                if (isArray) {
                    const arr = Array.isArray(f.saved_value)
                        ? f.saved_value.map(String)
                        : [];
                    const v = String(value);
                    const next = arr.includes(v)
                        ? arr.filter((x) => x !== v)
                        : [...arr, v];
                    return { ...f, saved_value: next };
                }

                return { ...f, saved_value: String(value) };
            })
        );
    };

    /* -------------------------------------------------------------- */
    /*  Save                                                          */
    /* -------------------------------------------------------------- */
    const save = async () => {
        setSaving(true);
        try {
            const payload = { features: {} };
            features.forEach((f) => {
                // For checkbox → array of strings
                // For text/dropdown → single string
                payload.features[f.id] = f.saved_value;
            });

            const res = await fetch(`${API_BASE}/products/save-features/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Features saved', 'success');
                // Reload so UI reflects saved state (source of truth = backend)
                await load();
            } else {
                showToast(data.message || 'Failed to save features', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error', 'error');
        } finally {
            setSaving(false);
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

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                    <Sliders /> Product Features
                </h5>
                <button className="btn btn-sm btn-primary" onClick={load}>
                    <ArrowRepeat /> Refresh
                </button>
            </div>

            <div className="card-body">
                {features.length === 0 ? (
                    <div className="alert alert-info">
                        No features assigned to this subcategory.
                    </div>
                ) : (
                    <>
                        <div className="row">
                            {features.map((f) => (
                                <div className="col-md-6 col-lg-4 mb-3" key={f.id}>
                                    <div className="card h-100">
                                        <div className="card-header">
                                            <strong>{f.name}</strong>
                                            <span className="badge bg-light text-dark float-end">
                                                {f.input_type}
                                            </span>
                                        </div>

                                        <div className="card-body">
                                            {/* ---------- CHECKBOX ---------- */}
                                            {f.input_type === 'checkbox' &&
                                                f.options_array.map((opt, i) => {
                                                    const isChecked = matchesOption(
                                                        f.saved_value,
                                                        opt
                                                    );
                                                    return (
                                                        <div className="form-check" key={i}>
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`feat-${f.id}-${opt.id}`}
                                                                checked={isChecked}
                                                                onChange={() =>
                                                                    setFeatureValue(
                                                                        f.id,
                                                                        opt.id,
                                                                        true
                                                                    )
                                                                }
                                                            />
                                                            <label
                                                                className="form-check-label"
                                                                htmlFor={`feat-${f.id}-${opt.id}`}
                                                            >
                                                                {opt.value}
                                                            </label>
                                                        </div>
                                                    );
                                                })}

                                            {f.input_type === 'checkbox' &&
                                                f.options_array.length === 0 && (
                                                    <p className="text-muted small mb-0">
                                                        No options configured
                                                    </p>
                                                )}

                                            {/* ---------- DROPDOWN ---------- */}
                                            {f.input_type === 'dropdown' && (
                                                <select
                                                    className="form-select"
                                                    value={String(f.saved_value || '')}
                                                    onChange={(e) =>
                                                        setFeatureValue(
                                                            f.id,
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select {f.name}
                                                    </option>
                                                    {f.options_array.map((opt, i) => (
                                                        <option
                                                            key={i}
                                                            value={opt.id}
                                                        >
                                                            {opt.value}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {/* ---------- TEXT ---------- */}
                                            {f.input_type === 'text' && (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={f.saved_value || ''}
                                                    onChange={(e) =>
                                                        setFeatureValue(
                                                            f.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={`Enter ${f.name}`}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3">
                            <button
                                className="btn btn-primary"
                                onClick={save}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="me-1" /> Save Features
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeaturesTab;