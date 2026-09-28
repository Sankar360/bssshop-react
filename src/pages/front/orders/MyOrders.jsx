// src/pages/front/orders/MyOrders.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { showToast } from "../../../utils/toast";
import API_URL from "../../../api/config";

const API_BASE = API_URL;

const formatRupee = (amount) => {
  const num = Number(amount) || 0;
  return (
    "₹" +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const formatDate = (s) =>
  s
    ? new Date(s).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

const PAYMENT_BADGE = {
  paid: "success",
  failed: "danger",
  pending: "warning",
};

const STATUS_BADGE = {
  pending: "warning",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "danger",
  refunded: "secondary",
};

const MyOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [flashError, setFlashError] = useState(null);
  const [flashSuccess, setFlashSuccess] = useState(null);

  /* ---------------------------------------------------------- */
  /*  Auth check + initial flash message                          */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/auth/login", {
        state: { from: location.pathname },
        replace: true,
      });
      return;
    }

    try {
      const cached = JSON.parse(localStorage.getItem("auth_user") || "{}");
      setUser(cached);
    } catch {
      setUser({});
    }

    // Optional: read flash passed via route state (from login etc.)
    const flash = location.state?.flash;
    if (flash?.error) setFlashError(flash.error);
    if (flash?.success) setFlashSuccess(flash.success);
    // eslint-disable-next-line
  }, []);

  /* ---------------------------------------------------------- */
  /*  Fetch orders                                                */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_BASE}/orders`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
        });
        const data = await res.json();

        if (data.success) {
          const payload = data.data || data;

          // `orders` may be:
          //   - a plain array            → use directly
          //   - a Laravel paginator      → { data: [...], current_page, ... }
          //   - a paginator-resource     → { data: { data: [...] } }
          let raw = payload.orders ?? payload.items ?? [];

          if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) {
            // Laravel paginator object
            raw = raw.data;
          } else if (
            raw &&
            !Array.isArray(raw) &&
            raw.data &&
            Array.isArray(raw.data.data)
          ) {
            // Paginator wrapped by API resource
            raw = raw.data.data;
          }

          setOrders(Array.isArray(raw) ? raw : []);
        } else {
          showToast(data.message || "Failed to load orders", "error");
        }
      } catch (err) {
        console.error("Orders fetch failed", err);
        showToast("Failed to load orders", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------------------------------------------------------- */
  /*  Render badge helpers                                        */
  /* ---------------------------------------------------------- */
  const renderPaymentBadge = (status) => {
    const s = status || "pending";
    const color = PAYMENT_BADGE[s] || "secondary";
    return (
      <span className={`badge bg-${color}`}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const s = status || "pending";
    const color = STATUS_BADGE[s] || "secondary";
    return (
      <span className={`badge bg-${color}`}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  /* ---------------------------------------------------------- */
  /*  Sidebar                                                     */
  /* ---------------------------------------------------------- */
  const sidebar = (
    <div className="col-lg-3 mb-4">
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div
            className="profile-sidebar-header p-4 text-center"
            style={{
              background: "linear-gradient(135deg, #00dafb 0%, #000113 100%)",
              color: "white",
            }}
          >
            <div
              className="avatar-circle mx-auto mb-3"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                fontWeight: 600,
                border: "3px solid white",
              }}
            >
              {(user.name || "U").substring(0, 2).toUpperCase()}
            </div>
            <h5 className="mb-0">{user.name || "User"}</h5>
            <small className="opacity-75">{user.email || ""}</small>
          </div>
          <ul className="nav nav-pills flex-column p-3">
            <li className="nav-item mb-1">
              <Link className="nav-link" to="/profile">
                <i className="bi bi-person me-2"></i> Profile
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link className="nav-link active" to="/orders">
                <i className="bi bi-box me-2"></i> Orders
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link className="nav-link" to="/wishlist">
                <i className="bi bi-heart me-2"></i> Wishlist
              </Link>
            </li>
            <li className="nav-item mb-1">
              <a className="nav-link" href="/auth/logout">
                <i className="bi bi-box-arrow-right me-2 text-danger"></i>{" "}
                <span className="text-danger">Logout</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  /* ---------------------------------------------------------- */
  /*  Render                                                      */
  /* ---------------------------------------------------------- */
  return (
    <div className="container py-4">
      <div className="row">
        {sidebar}

        {/* Main Content */}
        <div className="col-lg-9">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3">
              <h4 className="mb-0">
                <i className="bi bi-box text-primary me-2"></i> My Orders
              </h4>
              <p className="text-muted mb-0 mt-2">
                View and manage your recent orders
              </p>
            </div>
            <div className="card-body">
              {flashError && (
                <div className="alert alert-danger alert-dismissible fade show">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {flashError}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setFlashError(null)}
                  ></button>
                </div>
              )}
              {flashSuccess && (
                <div className="alert alert-success alert-dismissible fade show">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {flashSuccess}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setFlashSuccess(null)}
                  ></button>
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                /* Empty State */
                <div className="text-center py-5">
                  <div className="empty-state-icon mb-4">
                    <i
                      className="bi bi-box"
                      style={{ fontSize: "5rem", color: "#dee2e6" }}
                    ></i>
                  </div>
                  <h4 className="mb-2">No Orders Yet</h4>
                  <p className="text-muted mb-4">
                    You haven't placed any orders yet. Start shopping now!
                  </p>
                  <Link
                    to="/category"
                    className="btn btn-primary"
                    style={{
                      background:
                        "linear-gradient(90deg, #00dafb 0%, #000113 100%)",
                      border: "none",
                    }}
                  >
                    <i className="bi bi-shop"></i> Continue Shopping
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Payment Status</th>
                          <th>Order Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <span className="fw-bold">
                                #{order.order_number || order.id}
                              </span>
                            </td>
                            <td>{formatDate(order.created_at)}</td>
                            <td>{order.items_count ?? 0}</td>
                            <td>
                              <span className="fw-bold text-primary">
                                {formatRupee(order.total ?? 0)}
                              </span>
                            </td>
                            <td>{renderPaymentBadge(order.payment_status)}</td>
                            <td>
                              {renderStatusBadge(
                                order.order_status ?? order.status,
                              )}
                            </td>
                            <td>
                              <Link
                                to={`/orders/view/${order.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-eye"></i> View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="d-md-none">
                    {orders.map((order) => (
                      <div
                        className="card mb-3 border-0 shadow-sm"
                        key={order.id}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <span className="fw-bold">
                                #{order.order_number || order.id}
                              </span>
                              <small className="text-muted d-block">
                                {formatDate(order.created_at)}
                              </small>
                            </div>
                            <span className="fw-bold text-primary">
                              {formatRupee(order.total ?? 0)}
                            </span>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small">
                              Items: {order.items_count ?? 0}
                            </span>
                            <div>
                              {renderPaymentBadge(order.payment_status)}
                              <span className="ms-1">
                                {renderStatusBadge(
                                  order.order_status ?? order.status,
                                )}
                              </span>
                            </div>
                          </div>

                          <Link
                            to={`/orders/view/${order.id}`}
                            className="btn btn-primary btn-sm w-100"
                            style={{
                              background:
                                "linear-gradient(90deg, #00dafb 0%, #000113 100%)",
                              border: "none",
                            }}
                          >
                            <i className="bi bi-eye"></i> View Order
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
