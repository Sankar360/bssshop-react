// src/pages/admin/messages/MessageView.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    EnvelopeOpen, ArrowLeft, Reply, Trash, Envelope, Person, Calendar,
    Clock, ReplyAll, InfoCircle, Send, ExclamationTriangle,
} from 'react-bootstrap-icons';
import { showToast } from '../../../utils/toast';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const formatDateTime = (s) =>
    s
        ? new Date(s).toLocaleString('en-US', {
              month: 'long',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

const timeAgo = (s) => {
    if (!s) return '—';
    const seconds = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
    const intervals = [
        ['year', 31536000],
        ['month', 2592000],
        ['week', 604800],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
        ['second', 1],
    ];
    for (const [unit, secs] of intervals) {
        const count = Math.floor(seconds / secs);
        if (count >= 1) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
    return 'just now';
};

const statusBadge = (status) =>
    status === 'unread' ? 'danger' : status === 'replied' ? 'success' : 'info';

/**
 * Normalize the various response shapes to a single message object.
 *
 * Possible shapes:
 *   1. { success, data: { message: {...}, ... } }   ← wrapped
 *   2. { success, data: { id, name, email, ... } }  ← unwrapped (the message itself)
 */
const extractMessage = (payload) => {
    if (!payload || typeof payload !== 'object') return null;

    // Unwrapped — a real message always has an `id`
    if (payload.id !== undefined && payload.id !== null) {
        return payload;
    }

    // Wrapped — { message: {...} }
    if (payload.message && typeof payload.message === 'object' && payload.message.id !== undefined) {
        return payload.message;
    }

    return null;
};

const MessageView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load                                                           */
    /* -------------------------------------------------------------- */
    const loadMessage = async () => {
        try {
            const res = await fetch(`${API_BASE}/messages/view/${id}`, {
                headers: authHeaders(false),
            });
            const data = await res.json();

            const m = extractMessage(data?.data);

            if (data.success && m) {
                setMessage(m);
            } else {
                console.warn('Unexpected view response:', data);
                showToast('Message not found', 'error');
                setTimeout(() => navigate('/admin/messages'), 800);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load message', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    /* -------------------------------------------------------------- */
    /*  Reply                                                          */
    /* -------------------------------------------------------------- */
    const handleSendReply = async () => {
        if (!replyText.trim()) {
            showToast('Please enter a reply message', 'warning');
            return;
        }
        setSending(true);
        try {
            const res = await fetch(`${API_BASE}/messages/reply/${id}`, {
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
                setShowReply(false);
                setReplyText('');
                await loadMessage();
            } else {
                showToast(data.message || 'Failed to send reply', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSending(false);
        }
    };

    /* -------------------------------------------------------------- */
    /*  Delete                                                         */
    /* -------------------------------------------------------------- */
    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/messages/delete/${id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Message deleted successfully', 'success');
                setTimeout(() => navigate('/admin/messages'), 600);
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

    if (!message) {
        return (
            <div className="text-center py-5">
                <h4 className="text-muted">Message not found</h4>
                <Link to="/admin/messages" className="btn btn-primary mt-3">
                    <ArrowLeft className="me-1" /> Back to Messages
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <EnvelopeOpen className="text-primary me-2" /> Message Details
                </h2>
                <div>
                    <Link to="/admin/messages" className="btn btn-outline-secondary">
                        <ArrowLeft className="me-1" /> Back to Messages
                    </Link>
                    <button
                        className="btn btn-success ms-2"
                        onClick={() => setShowReply(true)}
                    >
                        <Reply className="me-1" /> Reply
                    </button>
                    <button
                        className="btn btn-danger ms-2"
                        onClick={() => setShowDelete(true)}
                    >
                        <Trash className="me-1" /> Delete
                    </button>
                </div>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <Envelope className="me-1" />{' '}
                                    {message.subject || 'No Subject'}
                                </h5>
                                <span className={`badge bg-${statusBadge(message.status)}`}>
                                    {message.status?.charAt(0).toUpperCase() +
                                        message.status?.slice(1)}
                                </span>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="message-header mb-4">
                                <div className="row">
                                    <div className="col-md-6">
                                        <p>
                                            <strong>
                                                <Person className="me-1" /> From:
                                            </strong>{' '}
                                            {message.name}
                                        </p>
                                        <p>
                                            <strong>
                                                <Envelope className="me-1" /> Email:
                                            </strong>{' '}
                                            <a href={`mailto:${message.email}`}>
                                                {message.email}
                                            </a>
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <p>
                                            <strong>
                                                <Calendar className="me-1" /> Date:
                                            </strong>{' '}
                                            {formatDateTime(message.created_at)}
                                        </p>
                                        <p>
                                            <strong>
                                                <Clock className="me-1" /> Received:
                                            </strong>{' '}
                                            {timeAgo(message.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <hr />

                            <div className="message-body">
                                <h6>Message:</h6>
                                <div className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
                                    {message.message}
                                </div>
                            </div>

                            {message.admin_reply && (
                                <div className="admin-reply mt-4">
                                    <hr />
                                    <h6>
                                        <ReplyAll className="text-success me-1" /> Your Reply:{' '}
                                        <small className="text-muted">
                                            ({formatDateTime(message.replied_at)})
                                        </small>
                                    </h6>
                                    <div
                                        className="p-3 rounded"
                                        style={{
                                            background: 'rgba(25,135,84,.1)',
                                            borderLeft: '4px solid #198754',
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {message.admin_reply}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <InfoCircle className="me-1" /> Message Info
                            </h5>
                        </div>
                        <div className="card-body">
                            <p>
                                <strong>Status:</strong>
                                <br />
                                <span className={`badge bg-${statusBadge(message.status)}`}>
                                    {message.status?.charAt(0).toUpperCase() +
                                        message.status?.slice(1)}
                                </span>
                            </p>

                            {message.replied_at && (
                                <p>
                                    <strong>Replied:</strong>
                                    <br />
                                    {formatDateTime(message.replied_at)}
                                </p>
                            )}

                            <hr />

                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowReply(true)}
                                >
                                    <Reply className="me-1" /> Reply to Message
                                </button>
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={() => setShowDelete(true)}
                                >
                                    <Trash className="me-1" /> Delete Message
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card mt-3">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <Person className="me-1" /> Sender Info
                            </h5>
                        </div>
                        <div className="card-body text-center">
                            <div
                                className="bg-primary text-white mx-auto"
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    fontWeight: 600,
                                }}
                            >
                                {(message.name || 'NA').substring(0, 2).toUpperCase()}
                            </div>
                            <h5 className="mt-3">{message.name}</h5>
                            <p className="text-muted">{message.email}</p>
                            <a
                                href={`mailto:${message.email}`}
                                className="btn btn-outline-primary btn-sm"
                            >
                                <Envelope className="me-1" /> Send Email
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reply Modal */}
            {showReply && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setShowReply(false)}
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
                                    onClick={() => setShowReply(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">To:</label>
                                    <p className="border-bottom pb-2 mb-0">
                                        {message.name} &lt;{message.email}&gt;
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Subject:</label>
                                    <p className="border-bottom pb-2 mb-0">
                                        Re: {message.subject || 'No Subject'}
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Your Reply:
                                    </label>
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
                                    onClick={() => setShowReply(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSendReply}
                                    disabled={sending}
                                >
                                    {sending ? (
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
            {showDelete && (
                <div
                    className="modal fade show d-block"
                    style={{ background: 'rgba(0,0,0,.5)' }}
                    tabIndex="-1"
                    onClick={() => setShowDelete(false)}
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
                                    onClick={() => setShowDelete(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this message?</p>
                                <p className="text-muted small">
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowDelete(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={handleDelete}
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

export default MessageView;