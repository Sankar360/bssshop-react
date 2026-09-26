// src/pages/admin/menus/Menus.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ListTask, PlusCircle, Pencil, Trash, ListUl, CheckCircleFill,
    ExclamationCircleFill,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const Menus = () => {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
    const [deleting, setDeleting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Fetch                                                          */
    /* -------------------------------------------------------------- */
    const fetchMenus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/menus`, { headers: authHeaders(false) });
            const data = await res.json();

            if (data.success) {
                const payload = data.data || {};
                const list = Array.isArray(payload) ? payload : payload.menus || [];
                setMenus(list);
            } else {
                showToast(data.message || 'Failed to load menus', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load menus', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenus();
    }, [fetchMenus]);

    /* -------------------------------------------------------------- */
    /*  Toggle status                                                  */
    /* -------------------------------------------------------------- */
    const handleToggleStatus = async (menu) => {
        // Optimistic UI update
        setMenus((list) =>
            list.map((m) => (m.id === menu.id ? { ...m, status: m.status ? 0 : 1 } : m))
        );

        try {
            const res = await fetch(`${API_BASE}/menus/toggle-status/${menu.id}`, {
                method: 'POST',
                headers: authHeaders(),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Status updated successfully', 'success');
            } else {
                // Revert on failure
                setMenus((list) =>
                    list.map((m) =>
                        m.id === menu.id ? { ...m, status: m.status ? 0 : 1 } : m
                    )
                );
                showToast(data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            setMenus((list) =>
                list.map((m) => (m.id === menu.id ? { ...m, status: m.status ? 0 : 1 } : m))
            );
            showToast('An error occurred', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Delete                                                         */
    /* -------------------------------------------------------------- */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/menus/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Menu deleted successfully', 'success');
                setDeleteTarget(null);
                fetchMenus();
            } else {
                showToast(data.message || 'Failed to delete menu', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        } finally {
            setDeleting(false);
        }
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <style>{`
                .menu-card-header {
                    background: linear-gradient(90deg, #00dafb 0%, #000113 100%);
                    color: white;
                    border-bottom: none;
                }
                .table td { vertical-align: middle; }
                .status-toggle:checked {
                    background-color: #0d6efd;
                    border-color: #0d6efd;
                }
                .badge { font-size: .75rem; }
            `}</style>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header menu-card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <ListTask className="me-2" /> Header / Footer Menu Management
                            </h5>
                            <Link to="/admin/menus/create" className="btn btn-light btn-sm">
                                <PlusCircle className="me-1" /> Add Menu
                            </Link>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : menus.length === 0 ? (
                                <div className="text-center py-5">
                                    <ListUl style={{ fontSize: '4rem', color: '#ddd' }} />
                                    <h4 className="mt-3">No Menus Found</h4>
                                    <p className="text-muted">
                                        Start by adding your first menu item.
                                    </p>
                                    <Link to="/admin/menus/create" className="btn btn-primary">
                                        <PlusCircle className="me-1" /> Add First Menu
                                    </Link>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th width="50">ID</th>
                                                <th>Menu Name</th>
                                                <th>URL / Link</th>
                                                <th className="text-center">Header</th>
                                                <th className="text-center">Footer</th>
                                                <th className="text-center">Sort Order</th>
                                                <th className="text-center">Status</th>
                                                <th className="text-center" width="200">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {menus.map((menu) => (
                                                <tr key={menu.id} data-id={menu.id}>
                                                    <td>{menu.id}</td>
                                                    <td>
                                                        <strong>{menu.menu_name}</strong>
                                                    </td>
                                                    <td>
                                                        <code>{menu.url}</code>
                                                    </td>
                                                    <td className="text-center">
                                                        {menu.display_header == 1 ? (
                                                            <span className="badge bg-success">Yes</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">No</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {menu.display_footer == 1 ? (
                                                            <span className="badge bg-success">Yes</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">No</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-info text-dark">
                                                            {menu.sort_order}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="form-check form-switch d-inline-block">
                                                            <input
                                                                className="form-check-input status-toggle"
                                                                type="checkbox"
                                                                checked={menu.status == 1}
                                                                onChange={() => handleToggleStatus(menu)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <Link
                                                            to={`/admin/menus/edit/${menu.id}`}
                                                            className="btn btn-sm btn-primary me-1"
                                                        >
                                                            <Pencil className="me-1" /> Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    id: menu.id,
                                                                    name: menu.menu_name,
                                                                })
                                                            }
                                                        >
                                                            <Trash className="me-1" /> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setDeleteTarget(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Are you sure you want to delete the menu{' '}
                                    <strong>{deleteTarget.name}</strong>?
                                </p>
                                <p className="text-danger">
                                    <small>This action cannot be undone.</small>
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash className="me-1" /> Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Menus;