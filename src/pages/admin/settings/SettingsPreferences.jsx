// src/pages/admin/settings/SettingsPreferences.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Sliders, ArrowLeft, Globe, Clock, Palette, Plus, Pencil, Play, Pause,
    Trash, XCircle,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

/* Field definitions for the modal, keyed by kind */
const FIELD_DEFS = {
    language: [
        { name: 'code', label: 'Code', type: 'text', placeholder: 'e.g., en', required: true },
        { name: 'name', label: 'Name', type: 'text', placeholder: 'e.g., English', required: true },
        { name: 'native_name', label: 'Native Name', type: 'text', placeholder: 'e.g., English' },
        { name: 'flag', label: 'Flag Emoji', type: 'text', placeholder: 'e.g., 🇬🇧' },
        { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
    ],
    timezone: [
        { name: 'name', label: 'Name (TZ Identifier)', type: 'text', placeholder: 'e.g., America/New_York', required: true },
        { name: 'offset', label: 'Offset', type: 'text', placeholder: 'e.g., -05:00' },
        { name: 'abbreviation', label: 'Abbreviation', type: 'text', placeholder: 'e.g., EST' },
        { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
    ],
    theme: [
        { name: 'name', label: 'Name (slug)', type: 'text', placeholder: 'e.g., dark', required: true },
        { name: 'display_name', label: 'Display Name', type: 'text', placeholder: 'e.g., Dark Mode', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
    ],
};

const SettingsPreferences = () => {
    const [languages, setLanguages] = useState([]);
    const [timezones, setTimezones] = useState([]);
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modal, setModal] = useState(null); // { kind: 'language'|'timezone'|'theme', mode: 'add'|'edit', id, values }

    /* -------------------------------------------------------------- */
    /*  Load all three lists                                           */
    /* -------------------------------------------------------------- */
    const fetchAll = async () => {
        setLoading(true);
        try {
            const [lang, tz, themes] = await Promise.all([
                fetch(`${API_BASE}/settings/languages`, { headers: authHeaders(false) }).then((r) => r.json()),
                fetch(`${API_BASE}/settings/timezones`, { headers: authHeaders(false) }).then((r) => r.json()),
                fetch(`${API_BASE}/settings/themes`, { headers: authHeaders(false) }).then((r) => r.json()),
            ]);
            if (lang.success) setLanguages(lang.data.languages || lang.data || []);
            if (tz.success) setTimezones(tz.data.timezones || tz.data || []);
            if (themes.success) setThemes(themes.data.themes || themes.data || []);
        } catch (err) {
            console.error(err);
            showToast('Failed to load preferences', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    /* -------------------------------------------------------------- */
    /*  Modal open helpers                                             */
    /* -------------------------------------------------------------- */
    const openAdd = (kind) => {
        const initial = {};
        FIELD_DEFS[kind].forEach((f) => {
            initial[f.name] = f.default ?? '';
        });
        setModal({ kind, mode: 'add', id: null, values: initial });
    };

    const openEdit = (kind, item) => {
        const initial = {};
        FIELD_DEFS[kind].forEach((f) => {
            let v = item[f.name];
            if (f.type === 'checkbox') v = v == 1 || v === true;
            initial[f.name] = v ?? f.default ?? '';
        });
        setModal({ kind, mode: 'edit', id: item.id, values: initial });
    };

    /* -------------------------------------------------------------- */
    /*  Save modal (add or edit)                                       */
    /* -------------------------------------------------------------- */
    const saveModal = async (e) => {
        e.preventDefault();
        if (!modal) return;

        const { kind, mode, id, values } = modal;
        const url =
            mode === 'add'
                ? `${API_BASE}/settings/${kind}/add`
                : `${API_BASE}/settings/${kind}/edit/${id}`;

        // Convert checkbox booleans to 1/0
        const payload = {};
        Object.entries(values).forEach(([k, v]) => {
            payload[k] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
        });

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`${kind} ${mode === 'add' ? 'created' : 'updated'}`, 'success');
                setModal(null);
                fetchAll();
            } else {
                showToast(data.message || `Failed to ${mode} ${kind}`, 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Shared row actions                                             */
    /* -------------------------------------------------------------- */
    const toggleItem = async (kind, id) => {
        try {
            const res = await fetch(`${API_BASE}/settings/${kind}/toggle/${id}`, {
                method: 'POST',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Status updated', 'success');
                fetchAll();
            } else showToast(data.message || 'Failed to toggle', 'error');
        } catch {
            showToast('An error occurred', 'error');
        }
    };

    const setDefault = async (kind, id) => {
        try {
            const res = await fetch(`${API_BASE}/settings/${kind}/set-default/${id}`, {
                method: 'POST',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Set as default', 'success');
                fetchAll();
            } else showToast(data.message || 'Failed to set default', 'error');
        } catch {
            showToast('An error occurred', 'error');
        }
    };

    const deleteItem = async (kind, id) => {
        if (!window.confirm(`Delete this ${kind}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API_BASE}/settings/${kind}/delete/${id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`${kind} deleted`, 'success');
                fetchAll();
            } else showToast(data.message || 'Failed to delete', 'error');
        } catch {
            showToast('An error occurred', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Modal field renderer                                           */
    /* -------------------------------------------------------------- */
    const renderModalField = (def) => {
        const value = modal.values[def.name];
        const setValue = (v) =>
            setModal((m) => ({ ...m, values: { ...m.values, [def.name]: v } }));

        if (def.type === 'checkbox') {
            return (
                <div className="form-check" key={def.name}>
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id={`modal-${def.name}`}
                        checked={!!value}
                        onChange={(e) => setValue(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`modal-${def.name}`}>
                        {def.label}
                    </label>
                </div>
            );
        }

        return (
            <div className="mb-3" key={def.name}>
                <label className="form-label fw-semibold" htmlFor={`modal-${def.name}`}>
                    {def.label} {def.required && <span className="text-danger">*</span>}
                </label>
                {def.type === 'textarea' ? (
                    <textarea
                        className="form-control"
                        id={`modal-${def.name}`}
                        rows="2"
                        value={value || ''}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={def.placeholder || ''}
                    />
                ) : (
                    <input
                        type={def.type}
                        className="form-control"
                        id={`modal-${def.name}`}
                        value={value || ''}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={def.placeholder || ''}
                        required={def.required}
                    />
                )}
            </div>
        );
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2><Sliders className="text-primary me-2" /> Manage Preferences</h2>
                <Link to="/admin/settings" className="btn btn-secondary">
                    <ArrowLeft className="me-1" /> Back to Settings
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            ) : (
                <>
                    {/* ============ LANGUAGES ============ */}
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><Globe className="me-1" /> Languages</h5>
                            <button className="btn btn-sm btn-primary" onClick={() => openAdd('language')}>
                                <Plus /> Add Language
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Flag</th>
                                            <th>Code</th>
                                            <th>Name</th>
                                            <th>Native Name</th>
                                            <th>Status</th>
                                            <th>Default</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {languages.length > 0 ? (
                                            languages.map((lang) => (
                                                <tr key={lang.id}>
                                                    <td>{lang.flag || '🌍'}</td>
                                                    <td><code>{lang.code}</code></td>
                                                    <td>{lang.name}</td>
                                                    <td>{lang.native_name || '-'}</td>
                                                    <td>
                                                        <span className={`badge bg-${lang.is_active ? 'success' : 'danger'}`}>
                                                            {lang.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {lang.is_default ? (
                                                            <span className="badge bg-primary">Default</span>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => setDefault('language', lang.id)}
                                                            >
                                                                Set Default
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-info me-1"
                                                            onClick={() => openEdit('language', lang)}
                                                        >
                                                            <Pencil />
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm me-1 btn-${lang.is_active ? 'warning' : 'success'}`}
                                                            onClick={() => toggleItem('language', lang.id)}
                                                        >
                                                            {lang.is_active ? <Pause /> : <Play />}
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => deleteItem('language', lang.id)}
                                                        >
                                                            <Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center text-muted">
                                                    No languages found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ============ TIMEZONES ============ */}
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><Clock className="me-1" /> Timezones</h5>
                            <button className="btn btn-sm btn-primary" onClick={() => openAdd('timezone')}>
                                <Plus /> Add Timezone
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Offset</th>
                                            <th>Abbreviation</th>
                                            <th>Status</th>
                                            <th>Default</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timezones.length > 0 ? (
                                            timezones.map((tz) => (
                                                <tr key={tz.id}>
                                                    <td>{tz.name}</td>
                                                    <td>{tz.offset}</td>
                                                    <td>{tz.abbreviation}</td>
                                                    <td>
                                                        <span className={`badge bg-${tz.is_active ? 'success' : 'danger'}`}>
                                                            {tz.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {tz.is_default ? (
                                                            <span className="badge bg-primary">Default</span>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => setDefault('timezone', tz.id)}
                                                            >
                                                                Set Default
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-info me-1"
                                                            onClick={() => openEdit('timezone', tz)}
                                                        >
                                                            <Pencil />
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm me-1 btn-${tz.is_active ? 'warning' : 'success'}`}
                                                            onClick={() => toggleItem('timezone', tz.id)}
                                                        >
                                                            {tz.is_active ? <Pause /> : <Play />}
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => deleteItem('timezone', tz.id)}
                                                        >
                                                            <Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center text-muted">
                                                    No timezones found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ============ THEMES ============ */}
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><Palette className="me-1" /> Themes</h5>
                            <button className="btn btn-sm btn-primary" onClick={() => openAdd('theme')}>
                                <Plus /> Add Theme
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Display Name</th>
                                            <th>Description</th>
                                            <th>Status</th>
                                            <th>Default</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {themes.length > 0 ? (
                                            themes.map((theme) => (
                                                <tr key={theme.id}>
                                                    <td><code>{theme.name}</code></td>
                                                    <td>{theme.display_name}</td>
                                                    <td>{theme.description || '-'}</td>
                                                    <td>
                                                        <span className={`badge bg-${theme.is_active ? 'success' : 'danger'}`}>
                                                            {theme.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {theme.is_default ? (
                                                            <span className="badge bg-primary">Default</span>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => setDefault('theme', theme.id)}
                                                            >
                                                                Set Default
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-info me-1"
                                                            onClick={() => openEdit('theme', theme)}
                                                        >
                                                            <Pencil />
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm me-1 btn-${theme.is_active ? 'warning' : 'success'}`}
                                                            onClick={() => toggleItem('theme', theme.id)}
                                                        >
                                                            {theme.is_active ? <Pause /> : <Play />}
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => deleteItem('theme', theme.id)}
                                                        >
                                                            <Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center text-muted">
                                                    No themes found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ============ ADD/EDIT MODAL ============ */}
            {modal && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setModal(null)}
                >
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <form className="modal-content" onSubmit={saveModal}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modal.mode === 'add' ? 'Add' : 'Edit'}{' '}
                                    {modal.kind.charAt(0).toUpperCase() + modal.kind.slice(1)}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModal(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {FIELD_DEFS[modal.kind].map(renderModalField)}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModal(null)}
                                >
                                    <XCircle className="me-1" /> Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SettingsPreferences;