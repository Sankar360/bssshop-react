// src/pages/admin/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_clients: 0,
        total_products: 0,
        total_orders: 0,
        total_revenue: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line
    }, []);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('admin_token');

        if (!token) {
            navigate('/admin/login');
            return;
        }

        try {
            const response = await fetch('/api/admin/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                navigate('/admin/login');
                return;
            }

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setStats({
                    total_clients:  data.data?.stats?.total_clients  ?? 0,
                    total_products: data.data?.stats?.total_products ?? 0,
                    total_orders:   data.data?.stats?.total_orders   ?? 0,
                    total_revenue:  data.data?.stats?.total_revenue  ?? 0,
                });
                setRecentOrders(data.data?.recent_orders ?? []);
            } else {
                setError(data.message || 'Failed to load dashboard');
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    // ✅ Indian Rupee formatting
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount) || 0);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Card definitions — link drives navigation
    const cards = [
        {
            key: 'clients',
            label: 'Total Clients',
            value: stats.total_clients,
            icon: 'bi bi-people text-primary',
            to: '/admin/clients',
        },
        {
            key: 'products',
            label: 'Total Products',
            value: stats.total_products,
            icon: 'bi bi-box text-success',
            to: '/admin/products',
        },
        {
            key: 'orders',
            label: 'Total Orders',
            value: stats.total_orders,
            icon: 'bi bi-cart text-warning',
            to: '/admin/orders',
        },
        {
            key: 'revenue',
            label: 'Total Revenue',
            value: formatCurrency(stats.total_revenue),
            icon: 'bi bi-currency-rupee text-danger',
            to: '/admin/orders',
        },
    ];

    return (
        <>
            <style>{`
                .stat-card {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.2s, box-shadow 0.2s;
                    cursor: pointer;
                    color: inherit;
                    display: block;
                    height: 100%;
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    color: inherit;
                }
                .stat-card-link {
                    text-decoration: none;
                    color: inherit;
                    display: block;
                }
                .stat-card-link:hover { color: inherit; }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: rgba(0,0,0,0.05);
                }
                .stat-icon i { font-size: 24px; }

                .stat-icon .text-primary { color: #0d6efd; }
                .stat-icon .text-success { color: #198754; }
                .stat-icon .text-warning { color: #ffc107; }
                .stat-icon .text-danger  { color: #dc3545; }

                .badge {
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-weight: 500;
                }
                .badge.bg-success { background-color: #198754; color: white; }
                .badge.bg-warning { background-color: #ffc107; color: #000; }

                .table-hover tbody tr:hover {
                    background-color: rgba(0,0,0,0.05);
                    cursor: pointer;
                }
                .table a {
                    color: #0d6efd;
                    text-decoration: none;
                }
                .table a:hover { text-decoration: underline; }
            `}</style>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                </div>
            )}

            <div className="row">
                {cards.map((card) => (
                    <div className="col-md-3 mb-4" key={card.key}>
                        <Link to={card.to} className="stat-card-link">
                            <div className="stat-card">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-1">{card.label}</h6>
                                        <h2 className="mb-0">{card.value}</h2>
                                    </div>
                                    <div className="stat-icon">
                                        <i className={card.icon}></i>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {/* Recent Orders Table */}
            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">Recent Orders</h5>
                </div>
                <div className="card-body">
                    {recentOrders.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <Link to={`/admin/orders/view/${order.id}`}>
                                                    {order.order_number}
                                                </Link>
                                            </td>
                                            <td>{order.user?.name ?? order.name ?? '—'}</td>
                                            <td>{formatCurrency(order.total)}</td>
                                            <td>
                                                <span
                                                    className={`badge bg-${
                                                        order.order_status === 'completed'
                                                            ? 'success'
                                                            : order.order_status === 'cancelled'
                                                            ? 'danger'
                                                            : 'warning'
                                                    }`}
                                                >
                                                    {order.order_status
                                                        ? order.order_status
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          order.order_status.slice(1)
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td>
                                                {order.created_at
                                                    ? formatDate(order.created_at)
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-muted mb-0">No orders found</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default Dashboard;