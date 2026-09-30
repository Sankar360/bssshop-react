// src/pages/admin/clients/Clients.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    People, Printer, Download, PersonPlus, Search, XCircle, ListUl,
    Envelope, Telephone, ShieldLock, Person, CheckCircle, XCircleFill,
    Eye, Pencil, PauseCircle, PlayCircle, Trash, ExclamationTriangle,
    PersonCheck, PersonX,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('auth_token') || '';
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

const formatTime = (s) =>
    s
        ? new Date(s).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : '';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        users: 0,
        admins: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        role: '',
        date_from: '',
    });
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

    /* -------------------------------------------------------------- */
    /*  Fetch                                                          */
    /* -------------------------------------------------------------- */
    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            // Strip empty filters
            const params = {};
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) params[k] = v;
            });
            const qs = new URLSearchParams(params).toString();
            const url = `${API_BASE}/clients${qs ? `?${qs}` : ''}`;

            const res = await fetch(url, { headers: authHeaders(false) });

            if (res.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('admin_user');
                showToast('Session expired. Please log in again.', 'error');
                return;
            }

            const data = await res.json();

            if (data.success) {
                // ✅ Handle Laravel paginator shape + plain array + named wrapper
                const payload = data.data;
                let list = [];

                if (Array.isArray(payload)) {
                    list = payload;
                } else if (Array.isArray(payload?.data)) {
                    list = payload.data;            // paginator
                } else if (Array.isArray(payload?.clients)) {
                    list = payload.clients;
                }

                setClients(list);

                // ✅ Prefer server-side stats when available
                if (data.stats) {
                    setStats({
                        total:    data.stats.total    ?? list.length,
                        active:   data.stats.active   ?? 0,
                        inactive: data.stats.inactive ?? 0,
                        users:    data.stats.users    ?? 0,
                        admins:   data.stats.admins   ?? 0,
                    });
                }
            } else {
                showToast(data.message || 'Failed to load clients', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load clients', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    /* -------------------------------------------------------------- */
    /*  Stats (from server, with client-side fallback)                 */
    /* -------------------------------------------------------------- */
    const total = stats.total || clients.length;
    const active = stats.active;
    const inactive = stats.inactive;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newThisMonth = clients.filter(
        (c) => c.created_at && new Date(c.created_at) >= monthStart
    ).length;

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((f) => ({ ...f, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchClients();
    };

    const handleFilterReset = () => {
        setFilters({ search: '', status: '', role: '', date_from: '' });
    };

    const handleToggleStatus = async (client) => {
        const newStatus = client.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'deactivate';

        if (!window.confirm(`Are you sure you want to ${action} ${client.name}?`))
            return;

        try {
            const res = await fetch(
                `${API_BASE}/clients/toggle-status/${client.id}`,
                {
                    method: 'POST',
                    headers: authHeaders(false),
                }
            );
            const data = await res.json();

            if (data.success) {
                showToast(`Client ${action}d successfully`, 'success');
                fetchClients();
            } else {
                showToast(data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`${API_BASE}/clients/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Client deleted successfully', 'success');
                setDeleteTarget(null);
                fetchClients();
            } else {
                showToast(data.message || 'Failed to delete client', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Export CSV (with auth header)                                  */
    /* -------------------------------------------------------------- */
    const exportClients = async () => {
        try {
            const params = {};
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) params[k] = v;
            });
            const qs = new URLSearchParams(params).toString();
            const url = `${API_BASE}/clients/export/csv${qs ? `?${qs}` : ''}`;

            const res = await fetch(url, { headers: authHeaders(false) });
            if (!res.ok) {
                showToast('Export failed', 'error');
                return;
            }

            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `clients_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            showToast('CSV exported', 'success');
        } catch (err) {
            console.error(err);
            showToast('Export failed', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <style>{`
                .border-left-primary { border-left: 4px solid #4e73df; }
                .border-left-success { border-left: 4px solid #1cc88a; }
                .border-left-warning { border-left: 4px solid #f6c23e; }
                .border-left-info    { border-left: 4px solid #36b9cc; }

                .stat-card {
                    transition: transform .3s ease, box-shadow .3s ease;
                    border: none; border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,.05);
                }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,.1); }
                .stat-icon { font-size: 2.5rem; opacity: .5; }
                .avatar-circle {
                    width: 40px; height: 40px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 600; font-size: .9rem; flex-shrink: 0;
                }
                .table th { font-weight: 600; color: #5a5c69; border-top: none; }
                .table td { vertical-align: middle; }
                .table-hover tbody tr:hover { background-color: #f8f9fc; }
                .btn-group .btn { padding: .25rem .5rem; }
                @keyframes statusPulse {
                    0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); }
                }
                .status-badge { animation: statusPulse 2s infinite; }
                @media print {
                    .btn-group, .btn, .no-print { display: none !important; }
                    .card { border: 1px solid #ddd !important; box-shadow: none !important; }
                }
            `}</style>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <People className="text-primary me-2" /> Clients Management
                </h2>
                <div>
                    <button
                        type="button"
                        className="btn btn-outline-secondary me-2"
                        onClick={() => window.print()}
                    >
                        <Printer className="me-1" /> Print
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary me-2"
                        onClick={exportClients}
                    >
                        <Download className="me-1" /> Export
                    </button>
                    <Link to="/admin/clients/create" className="btn btn-primary">
                        <PersonPlus className="me-1" /> Add Client
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="row mb-4">
                {[
                    { label: 'Total Clients',    value: total,        icon: <People />,      cls: 'primary' },
                    { label: 'Active Clients',   value: active,       icon: <PersonCheck />, cls: 'success' },
                    { label: 'Inactive Clients', value: inactive,     icon: <PersonX />,     cls: 'warning' },
                    { label: 'New This Month',   value: newThisMonth, icon: <PersonPlus />,  cls: 'info' },
                ].map((s, i) => (
                    <div className="col-md-3 mb-3" key={i}>
                        <div className={`card stat-card border-left-${s.cls}`}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-1">{s.label}</h6>
                                        <h3 className="mb-0">{s.value}</h3>
                                    </div>
                                    <div className={`stat-icon text-${s.cls}`}>{s.icon}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <form onSubmit={handleFilterSubmit} className="row g-3">
                        <div className="col-md-4">
                            <label htmlFor="search" className="form-label">Search</label>
                            <div className="input-group">
                                <span className="input-group-text"><Search /></span>
                                <input
                                    type="text" id="search" name="search"
                                    className="form-control"
                                    placeholder="Name, Email, Phone..."
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select
                                className="form-select" id="status" name="status"
                                value={filters.status} onChange={handleFilterChange}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="role" className="form-label">Role</label>
                            <select
                                className="form-select" id="role" name="role"
                                value={filters.role} onChange={handleFilterChange}
                            >
                                <option value="">All Roles</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="date_from" className="form-label">Date From</label>
                            <input
                                type="date" className="form-control"
                                id="date_from" name="date_from"
                                value={filters.date_from} onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                            <button type="submit" className="btn btn-primary w-100">
                                <Search />
                            </button>
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                            <button
                                type="button" className="btn btn-secondary w-100"
                                onClick={handleFilterReset}
                            >
                                <XCircle />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <ListUl className="me-2" /> All Clients
                        <span className="badge bg-primary rounded-pill ms-2">{total}</span>
                    </h5>
                    <span className="text-muted small">Showing {clients.length} clients</span>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th width="50">#</th>
                                        <th>Client</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th width="180">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.length > 0 ? (
                                        clients.map((client, index) => (
                                            <tr key={client.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar-circle bg-primary text-white me-2">
                                                            {(client.name || 'NA')
                                                                .substring(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <strong>{client.name}</strong>
                                                            {client.role === 'admin' && (
                                                                <span className="badge bg-info ms-1">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <a
                                                        href={`mailto:${client.email}`}
                                                        className="text-decoration-none"
                                                    >
                                                        <Envelope /> {client.email}
                                                    </a>
                                                </td>
                                                <td>
                                                    {client.phone ? (
                                                        <a
                                                            href={`tel:${client.phone}`}
                                                            className="text-decoration-none"
                                                        >
                                                            <Telephone /> {client.phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">N/A</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {client.role === 'admin' ? (
                                                        <span className="badge bg-info">
                                                            <ShieldLock /> Admin
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-secondary">
                                                            <Person /> User
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {client.status === 'active' ? (
                                                        <span className="badge bg-success status-badge">
                                                            <CheckCircle /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-danger status-badge">
                                                            <XCircleFill /> Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {formatDate(client.created_at)}
                                                        <br />
                                                        {formatTime(client.created_at)}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <Link
                                                            to={`/admin/clients/view/${client.id}`}
                                                            className="btn btn-outline-primary"
                                                            title="View Client"
                                                        >
                                                            <Eye />
                                                        </Link>
                                                        <Link
                                                            to={`/admin/clients/edit/${client.id}`}
                                                            className="btn btn-outline-warning"
                                                            title="Edit Client"
                                                        >
                                                            <Pencil />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-outline-${
                                                                client.status === 'active'
                                                                    ? 'danger'
                                                                    : 'success'
                                                            }`}
                                                            onClick={() => handleToggleStatus(client)}
                                                            title={
                                                                client.status === 'active'
                                                                    ? 'Deactivate'
                                                                    : 'Activate'
                                                            }
                                                        >
                                                            {client.status === 'active' ? (
                                                                <PauseCircle />
                                                            ) : (
                                                                <PlayCircle />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger"
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    id: client.id,
                                                                    name: client.name,
                                                                })
                                                            }
                                                            title="Delete Client"
                                                        >
                                                            <Trash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5">
                                                <People
                                                    className="text-muted"
                                                    style={{ fontSize: '3rem' }}
                                                />
                                                <h5 className="mt-3">No clients found</h5>
                                                <p className="text-muted">
                                                    Clients will appear here once they register.
                                                </p>
                                                <Link
                                                    to="/admin/clients/create"
                                                    className="btn btn-primary"
                                                >
                                                    <PersonPlus className="me-1" /> Add First Client
                                                </Link>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteTarget && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h6 className="modal-title">
                                    <ExclamationTriangle className="me-1" /> Confirm Delete
                                </h6>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setDeleteTarget(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Are you sure you want to delete{' '}
                                    <strong>{deleteTarget.name}</strong>?
                                </p>
                                <p className="text-muted small">
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={confirmDelete}
                                >
                                    <Trash className="me-1" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Clients;