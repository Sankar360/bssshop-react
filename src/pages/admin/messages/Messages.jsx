// src/pages/admin/messages/Messages.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Envelope, Printer, Download, Search, XCircle, ListUl, EnvelopeExclamation,
    EnvelopeCheck, ReplyAll, Eye, Reply, Trash, Inbox, ExclamationTriangle,
    Send,
} from 'react-bootstrap-icons';
import { showToast } from '../../../utils/toast';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const formatDate = (s) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
const formatTime = (s) =>
    s ? new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

const truncate = (str, n = 60) =>
    str ? (str.length > n ? `${str.slice(0, n)}...` : str) : '';

const STATUS_BADGE = { unread: 'danger', read: 'info', replied: 'success' };
const STATUS_ICON = {
    unread: <EnvelopeExclamation />,
    read: <EnvelopeCheck />,
    replied: <ReplyAll />,
};

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [stats, setStats] = useState({ total: 0, unread: 0, read: 0, replied: 0 });
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        date_from: '',
    });

    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkAction, setBulkAction] = useState('');

    const [replyTarget, setReplyTarget] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [showExport, setShowExport] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Fetch                                                          */
    /* -------------------------------------------------------------- */
    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams(filters).toString();
            const res = await fetch(`${API_BASE}/messages?${qs}`, { headers: authHeaders(false) });
            const data = await res.json();

            if (!data.success) {
                showToast(data.message || 'Failed to load messages', 'error');
                setMessages([]);
                return;
            }

            // ✅ Handle multiple possible response shapes
            let list = [];
            let total = 0;
            let statsFromServer = null;
            let unread = 0;

            const payload = data.data;

            if (Array.isArray(payload)) {
                list = payload;
                total = payload.length;
            } else if (payload && Array.isArray(payload.messages)) {
                list = payload.messages;
                total = payload.pagination?.total ?? payload.total ?? payload.messages.length;
                statsFromServer = payload.stats ?? null;
            } else if (payload && Array.isArray(payload.data)) {
                // Laravel paginator fallback
                list = payload.data;
                total = payload.total ?? payload.data.length;
                statsFromServer = payload.stats ?? null;
            }

            setMessages(list);
            setTotalCount(data.total_count ?? payload?.total ?? total);
            unread = data.unread_count ?? statsFromServer?.unread ?? 0;

            setStats(
                statsFromServer ||
                data.stats || {
                    total: total,
                    unread: unread,
                    read: list.filter((m) => m.status === 'read').length,
                    replied: list.filter((m) => m.status === 'replied').length,
                }
            );
        } catch (err) {
            console.error(err);
            showToast('Failed to load messages', 'error');
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    /* -------------------------------------------------------------- */
    /*  Selection                                                      */
    /* -------------------------------------------------------------- */
    const toggleSelectAll = () => {
        if (selectedIds.length === messages.length && messages.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(messages.map((m) => m.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds((ids) =>
            ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
        );
    };

    /* -------------------------------------------------------------- */
    /*  Bulk actions                                                   */
    /* -------------------------------------------------------------- */
    const applyBulkAction = async () => {
        if (!bulkAction || selectedIds.length === 0) {
            showToast('Please select messages and an action', 'warning');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/messages/bulk-action`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    action: bulkAction,
                    message_ids: selectedIds,   // ✅ matches backend
                }),
            });
            const data = await res.json();

            if (data.success) {
                showToast(data.message || 'Bulk action applied', 'success');
                setSelectedIds([]);
                setBulkAction('');
                fetchMessages();
            } else {
                // Show first validation error if any
                const firstError = data.errors
                    ? Object.values(data.errors).flat()[0]
                    : null;
                showToast(firstError || data.message || 'Failed to apply action', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Reply                                                          */
    /* -------------------------------------------------------------- */
    const handleSendReply = async () => {
        if (!replyText.trim()) {
            showToast('Please enter a reply message', 'warning');
            return;
        }
        setSendingReply(true);
        try {
            const res = await fetch(`${API_BASE}/messages/reply/${replyTarget.id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ reply: replyText }),
            });
            const data = await res.json();

            if (data.success) {
                if (data.email_sent === false) {
                    showToast('Reply saved, but email could not be sent.', 'warning');
                } else {
                    showToast('Reply sent successfully', 'success');
                }
                setReplyTarget(null);
                setReplyText('');
                fetchMessages();
            } else {
                showToast(data.message || 'Failed to send reply', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSendingReply(false);
        }
    };

    /* -------------------------------------------------------------- */
    /*  Delete                                                         */
    /* -------------------------------------------------------------- */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/messages/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Message deleted successfully', 'success');
                setDeleteTarget(null);
                fetchMessages();
            } else {
                showToast(data.message || 'Failed to delete message', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    /* -------------------------------------------------------------- */
    /*  Filters                                                        */
    /* -------------------------------------------------------------- */
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((f) => ({ ...f, [name]: value }));
    };
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchMessages();
    };
    const handleFilterReset = () => {
        setFilters({ search: '', status: 'all', date_from: '' });
        // Auto-refresh after reset
        setTimeout(fetchMessages, 0);
    };

    const exportMessages = () => {
        const qs = new URLSearchParams({
            status: filters.status,
            search: filters.search,
        }).toString();
        const token = getToken();
        // Pass token via query param because window.open can't set headers
        window.open(`${API_BASE}/messages/export?${qs}&token=${encodeURIComponent(token)}`, '_blank');
        setShowExport(false);
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <style>{`
                .border-left-primary { border-left: 4px solid #4e73df; }
                .border-left-danger  { border-left: 4px solid #e74a3b; }
                .border-left-info    { border-left: 4px solid #36b9cc; }
                .border-left-success { border-left: 4px solid #1cc88a; }
                .stat-card {
                    transition: transform .3s ease, box-shadow .3s ease;
                    border: none; border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,.05);
                }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,.1); }
                .stat-icon { font-size: 2.5rem; opacity: .5; }
                .table th { font-weight: 600; color: #5a5c69; border-top: none; }
                .table td { vertical-align: middle; }
                .table-hover tbody tr:hover { background-color: #f8f9fc; }
                .message-row.unread { background-color: #f8f9fc; }
                .message-row.unread td { font-weight: 600; }
                .btn-group .btn { padding: .25rem .5rem; }
                @media print {
                    .btn-group, .btn, .no-print { display: none !important; }
                }
            `}</style>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Envelope className="text-primary me-2" /> Contact Messages
                </h2>
                <div>
                    <button className="btn btn-outline-secondary me-2" onClick={() => window.print()}>
                        <Printer className="me-1" /> Print
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => setShowExport(true)}>
                        <Download className="me-1" /> Export
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="row mb-4">
                {[
                    { label: 'Total Messages', value: stats.total, icon: <Envelope />, cls: 'primary' },
                    { label: 'Unread', value: stats.unread, icon: <EnvelopeExclamation />, cls: 'danger' },
                    { label: 'Read', value: stats.read, icon: <EnvelopeCheck />, cls: 'info' },
                    { label: 'Replied', value: stats.replied, icon: <ReplyAll />, cls: 'success' },
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
                                    placeholder="Name, Email, Subject..."
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select
                                className="form-select" id="status" name="status"
                                value={filters.status} onChange={handleFilterChange}
                            >
                                <option value="all">All Messages</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                                <option value="replied">Replied</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="date_from" className="form-label">Date From</label>
                            <input
                                type="date" className="form-control" id="date_from" name="date_from"
                                value={filters.date_from} onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button type="submit" className="btn btn-primary w-100 me-2">
                                <Search />
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary w-100"
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
                        <ListUl className="me-2" /> All Messages
                        <span className="badge bg-primary rounded-pill ms-2">{totalCount}</span>
                    </h5>
                    <span className="text-muted small">Showing {messages.length} of {totalCount}</span>
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
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th width="40">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    messages.length > 0 &&
                                                    selectedIds.length === messages.length
                                                }
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th width="50">#</th>
                                        <th>From</th>
                                        <th>Subject</th>
                                        <th>Message</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th width="180">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {messages.length > 0 ? (
                                        messages.map((message, index) => (
                                            <tr
                                                key={message.id}
                                                className={`message-row ${
                                                    message.status === 'unread' ? 'unread' : ''
                                                }`}
                                            >
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="message-checkbox"
                                                        checked={selectedIds.includes(message.id)}
                                                        onChange={() => toggleSelect(message.id)}
                                                    />
                                                </td>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <strong>{message.name}</strong>
                                                    <br />
                                                    <small className="text-muted">
                                                        <Envelope className="me-1" />
                                                        {message.email}
                                                    </small>
                                                </td>
                                                <td>{message.subject || 'No Subject'}</td>
                                                <td>{truncate(message.message, 60)}</td>
                                                <td>
                                                    <span
                                                        className={`badge bg-${
                                                            STATUS_BADGE[message.status] || 'secondary'
                                                        }`}
                                                    >
                                                        {STATUS_ICON[message.status]}{' '}
                                                        {message.status?.charAt(0).toUpperCase() +
                                                            message.status?.slice(1)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {formatDate(message.created_at)}
                                                        <br />
                                                        {formatTime(message.created_at)}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <Link
                                                            to={`/admin/messages/view/${message.id}`}
                                                            className="btn btn-outline-primary"
                                                            title="View Message"
                                                        >
                                                            <Eye />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-success"
                                                            title="Reply"
                                                            onClick={() =>
                                                                setReplyTarget({
                                                                    id: message.id,
                                                                    name: message.name,
                                                                    email: message.email,
                                                                    subject: message.subject,
                                                                })
                                                            }
                                                        >
                                                            <Reply />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger"
                                                            title="Delete"
                                                            onClick={() =>
                                                                setDeleteTarget({ id: message.id })
                                                            }
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
                                                <Inbox className="text-muted" style={{ fontSize: '3rem' }} />
                                                <h5 className="mt-3">No messages found</h5>
                                                <p className="text-muted">
                                                    Messages will appear here when customers contact you.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Actions */}
            {messages.length > 0 && (
                <div className="row mt-3">
                    <div className="col-md-6">
                        <div className="d-flex gap-2 align-items-center">
                            <span className="text-muted small">Bulk Actions:</span>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: 'auto' }}
                                value={bulkAction}
                                onChange={(e) => setBulkAction(e.target.value)}
                            >
                                <option value="">Select Action</option>
                                <option value="mark_read">Mark as Read</option>
                                <option value="mark_unread">Mark as Unread</option>
                                <option value="delete">Delete</option>
                            </select>
                            <button className="btn btn-sm btn-primary" onClick={applyBulkAction}>
                                Apply
                            </button>
                        </div>
                    </div>
                    <div className="col-md-6 text-end">
                        <span className="text-muted small">
                            {selectedIds.length} messages selected
                        </span>
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {replyTarget && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setReplyTarget(null)}
                >
                    <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <Reply className="text-primary me-2" /> Reply to Message
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setReplyTarget(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">To:</label>
                                    <p className="border-bottom pb-2 mb-0">
                                        {replyTarget.name} &lt;{replyTarget.email}&gt;
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Subject:</label>
                                    <p className="border-bottom pb-2 mb-0">
                                        Re: {replyTarget.subject || 'No Subject'}
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Your Reply:</label>
                                    <textarea
                                        className="form-control"
                                        rows="6"
                                        placeholder="Type your reply here..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <small className="text-muted">
                                        Your reply will be sent to the customer's email.
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setReplyTarget(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSendReply}
                                    disabled={sendingReply}
                                >
                                    {sendingReply ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="me-1" /> Send Reply
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                <p>Are you sure you want to delete this message?</p>
                                <p className="text-muted small">This action cannot be undone.</p>
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

            {/* Export Modal */}
            {showExport && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setShowExport(false)}
                >
                    <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Export Messages</h6>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowExport(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="d-grid gap-2">
                                    <button className="btn btn-outline-success" onClick={exportMessages}>
                                        <Download className="me-1" /> Export as CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Messages;