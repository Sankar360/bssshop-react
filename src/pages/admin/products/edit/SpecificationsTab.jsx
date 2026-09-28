// src/pages/admin/products/edit/SpecificationsTab.jsx
import React, { useEffect, useState } from 'react';
import { ListUl, PlusCircle, Trash, Save } from 'react-bootstrap-icons';
import { showToast } from '../../../../utils/toast';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';

const SpecificationsTab = ({ productId }) => {
    const [specs, setSpecs] = useState([{ id: null, label: '', value: '' }]);
    const [deletedIds, setDeletedIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/products/get-specifications/${productId}`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success) {
                const list = data.data || data.specifications || [];
                setSpecs(list.length ? list : [{ id: null, label: '', value: '' }]);
            }
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [productId]);

    const addRow = (e) => {
        if (e) e.preventDefault();
        setSpecs((s) => [...s, { id: null, label: '', value: '' }]);
    };

    const updateRow = (index, key, val) => {
        setSpecs((list) => list.map((r, i) => (i === index ? { ...r, [key]: val } : r)));
    };

    const deleteRow = (index, e) => {
        if (e) e.preventDefault();
        const row = specs[index];
        if (row.id) setDeletedIds((ids) => [...ids, row.id]);

        setSpecs((list) => {
            const next = list.filter((_, i) => i !== index);
            return next.length ? next : [{ id: null, label: '', value: '' }];
        });
    };

    const deleteAll = async (e) => {
        if (e) e.preventDefault();
        if (!window.confirm('Delete ALL specifications?')) return;
        try {
            const res = await fetch(`${API_BASE}/products/delete-all-specifications/${productId}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success) {
                showToast('All specs deleted', 'success');
                setSpecs([{ id: null, label: '', value: '' }]);
                setDeletedIds([]);
            } else {
                showToast(data.message || 'Failed to delete', 'error');
            }
        } catch {
            showToast('Error', 'error');
        }
    };

    const save = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);

        const filtered = specs.filter((s) => (s.label || '').trim() || (s.value || '').trim());

        try {
            const res = await fetch(`${API_BASE}/products/save-specifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    product_id: productId,
                    specifications: filtered,
                    deleted_ids: deletedIds,
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Specs saved', 'success');
                setDeletedIds([]);
                load();
            } else {
                showToast(data.message || 'Failed to save', 'error');
            }
        } catch {
            showToast('Error', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" />
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                    <ListUl /> Product Specifications
                </h5>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Label</th>
                                <th style={{ width: '50%' }}>Value</th>
                                <th style={{ width: '10%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {specs.map((row, i) => (
                                <tr key={row.id ?? `new-${i}`}>
                                    <td>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={row.label || ''}
                                            onChange={(e) => updateRow(i, 'label', e.target.value)}
                                            placeholder="e.g., Battery"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={row.value || ''}
                                            onChange={(e) => updateRow(i, 'value', e.target.value)}
                                            placeholder="e.g., 5000 mAh"
                                        />
                                    </td>
                                    <td className="text-center">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={(e) => deleteRow(i, e)}
                                        >
                                            <Trash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 d-flex gap-2">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={addRow}
                    >
                        <PlusCircle className="me-1" /> Add Row
                    </button>

                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={deleteAll}
                    >
                        <Trash className="me-1" /> Delete All
                    </button>

                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={save}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : <><Save className="me-1" /> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpecificationsTab;