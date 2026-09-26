// src/pages/admin/clients/ClientView.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Person, ArrowLeft, Pencil, PersonBadge, Cart, CurrencyDollar, ClockHistory } from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = () => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
});

const formatDate = (s) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

const orderStatusClass = (status) =>
    status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'danger';

const ClientView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ total_orders: 0, total_spent: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/clients/view/${id}`, {
                    headers: authHeaders(),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const payload = data.data;
                    setClient(payload.client || payload);
                    setOrders(payload.orders || []);
                    setStats({
                        total_orders: payload.total_orders ?? (payload.orders?.length || 0),
                        total_spent: payload.total_spent ?? 0,
                    });
                } else {
                    showToast('Client not found', 'error');
                    setTimeout(() => navigate('/admin/clients'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load client', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!client) return null;

    return (
        <>
            <style>{`
                .border-left-primary { border-left: 4px solid #4e73df; }
                .border-left-success { border-left: 4px solid #1cc88a; }
                .stat-card {
                    transition: transform .3s ease; border: none; border-radius: 12px;
                }
                .stat-card:hover { transform: translateY(-5px); }
                .avatar-circle {
                    width: 100px; height: 100px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 2.5rem; flex-shrink: 0;
                }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Person className="text-primary me-2" /> Client Details
                </h2>
                <div>
                    <Link to="/admin/clients" className="btn btn-outline-secondary">
                        <ArrowLeft className="me-1" /> Back to Clients
                    </Link>
                    <Link to={`/admin/clients/edit/${client.id}`} className="btn btn-warning ms-2">
                        <Pencil className="me-1" /> Edit
                    </Link>
                </div>
            </div>

            <div className="row">
                {/* Profile */}
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0"><PersonBadge className="me-1" /> Profile</h5>
                        </div>
                        <div className="card-body text-center">
                            {client.avatar ? (
                                <img
                                    src={client.avatar.startsWith('http') ? client.avatar : `/${client.avatar}`}
                                    alt="avatar"
                                    style={{
                                        width: 100, height: 100, borderRadius: '50%',
                                        objectFit: 'cover', margin: '0 auto',
                                    }}
                                />
                            ) : (
                                <div className="avatar-circle bg-primary text-white mx-auto">
                                    {(client.name || 'NA').substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <h4 className="mt-3">{client.name}</h4>
                            <p className="text-muted">{client.email}</p>
                            <p>
                                <span className={`badge bg-${client.status === 'active' ? 'success' : 'danger'}`}>
                                    {client.status?.charAt(0).toUpperCase() + client.status?.slice(1)}
                                </span>{' '}
                                <span className={`badge bg-${client.role === 'admin' ? 'info' : 'secondary'}`}>
                                    {client.role?.charAt(0).toUpperCase() + client.role?.slice(1)}
                                </span>
                            </p>
                            <hr />
                            <div className="row">
                                <div className="col-6">
                                    <small className="text-muted">Phone</small>
                                    <p>{client.phone || 'N/A'}</p>
                                </div>
                                <div className="col-6">
                                    <small className="text-muted">Member Since</small>
                                    <p>{formatDate(client.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats + Orders */}
                <div className="col-md-8">
                    <div className="row mb-4">
                        <div className="col-md-6 mb-3">
                            <div className="card stat-card border-left-primary">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-muted mb-1">Total Orders</h6>
                                            <h3 className="mb-0">{stats.total_orders}</h3>
                                        </div>
                                        <Cart className="text-primary" style={{ fontSize: '2.5rem', opacity: .5 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-3">
                            <div className="card stat-card border-left-success">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-muted mb-1">Total Spent</h6>
                                            <h3 className="mb-0">${Number(stats.total_spent).toFixed(2)}</h3>
                                        </div>
                                        <CurrencyDollar className="text-success" style={{ fontSize: '2.5rem', opacity: .5 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0"><ClockHistory className="me-1" /> Recent Orders</h5>
                        </div>
                        <div className="card-body p-0">
                            {orders.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Order #</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.slice(0, 5).map((order) => (
                                                <tr key={order.id}>
                                                    <td>
                                                        <Link
                                                            to={`/admin/orders/view/${order.id}`}
                                                            className="text-decoration-none"
                                                        >
                                                            {order.order_number}
                                                        </Link>
                                                    </td>
                                                    <td>${Number(order.total).toFixed(2)}</td>
                                                    <td>
                                                        <span className={`badge bg-${orderStatusClass(order.order_status)}`}>
                                                            {order.order_status?.charAt(0).toUpperCase() +
                                                                order.order_status?.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>{formatDate(order.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted">No orders yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClientView;