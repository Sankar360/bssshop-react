// src/pages/front/checkout/Checkout.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { showToast } from "../../../utils/toast";
import { loadRazorpay } from "../../../utils/razorpay";
import API_URL from "../../../api/config";

const API_BASE = API_URL;

// src/utils/imageUrl.js
export const imageUrl = (path) => {
  if (!path) return "/assets/images/default-product.jpg";

  if (/^https?:\/\//i.test(path)) return path;

  if (path.startsWith("/storage/")) return path;
  if (path.startsWith("storage/")) return `/${path}`;

  if (path.startsWith("/uploads/")) return `/storage${path}`;
  if (path.startsWith("uploads/")) return `/storage/${path}`;

  if (path.startsWith("/assets/")) return path;
  if (path.startsWith("assets/")) return `/${path}`;

  const clean = path.replace(/^\/+/, "");
  return `/storage/${clean}`;
};

const Checkout = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("auth_token");

  const [cartData, setCartData] = useState({
    items: [],
    subtotal: 0,
    tax: 0,
    tax_rate: 10,
    shipping: 0,
    total: 0,
  });
  const [userData, setUserData] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    create_account: false,
    password: "",
  });

  /* ---------------------------------------------------------- */
  /*  Fetch checkout data                                        */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/checkout`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
        });
        const data = await res.json();

        if (data.success) {
          const payload = data.data || data;
          setCartData(
            payload.cart_data || {
              items: [],
              subtotal: 0,
              tax: 0,
              tax_rate: 10,
              shipping: 0,
              total: 0,
            },
          );
          setUserData(payload.user_data || {});
          setPaymentMethods(payload.payment_methods || []);
          setIsLoggedIn(!!payload.is_logged_in);
          setSelectedPayment(payload.payment_methods?.[0]?.id || "");

          const u = payload.user_data || {};
          setForm((f) => ({
            ...f,
            name: u.name || "",
            email: u.email || "",
            phone: u.phone || "",
            address: u.address || "",
            city: u.city || "",
            state: u.state || "",
            postal_code: u.postal_code || "",
            country: u.country || "",
          }));
        }
      } catch (err) {
        console.error("Checkout fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ---------------------------------------------------------- */
  /*  Field change                                               */
  /* ---------------------------------------------------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleRazorpayPay = async () => {
    // ... your existing validation ...
    if (!form.name || form.name.length < 3)
      return showToast("Full Name is required (min 3 chars).", "error");
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
      return showToast("Valid Email is required.", "error");
    if (!form.phone || form.phone.length < 10)
      return showToast("Phone must be at least 10 digits.", "error");
    if (!form.address || form.address.length < 10)
      return showToast("Address must be at least 10 chars.", "error");
    if (!form.city || form.city.length < 3)
      return showToast("City is required.", "error");
    if (!form.postal_code || form.postal_code.length < 4)
      return showToast("Postal Code is required.", "error");
    if (form.create_account && form.password.length < 8)
      return showToast("Password must be at least 8 chars.", "error");

    setRazorpayLoading(true);

    try {
      // 1) Load Razorpay SDK on demand — only when user actually clicks Pay
      let Razorpay;
      try {
        Razorpay = await loadRazorpay();
      } catch (e) {
        showToast(
          "Could not load payment SDK. Check your connection.",
          "error",
        );
        setRazorpayLoading(false);
        return;
      }

      // 2) Create the Razorpay order on the backend
      const res = await fetch(`${API_BASE}/checkout/create-razorpay-order`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postal_code: form.postal_code,
          state: form.state,
          country: form.country,
          create_account: form.create_account ? 1 : 0,
          ...(form.create_account ? { password: form.password } : {}),
        }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || "Failed to initialize payment.", "error");
        setRazorpayLoading(false);
        return;
      }

      // 3) Open the Razorpay modal
      const options = {
        key: data.data.razorpay_key,
        amount: Math.round(data.data.amount * 100),
        currency: data.data.currency || "INR",
        name: data.data.name || "BSSShop",
        description: "Order #" + data.data.order_number,
        order_id: data.data.razorpay_order_id,
        prefill: {
          name: data.data.name,
          email: data.data.email,
          contact: data.data.phone,
        },
        theme: { color: "#00dafb" },
        modal: {
          ondismiss: () => setRazorpayLoading(false),
        },
        handler: async (response) => {
          const verify = await fetch(`${API_BASE}/checkout/verify-payment`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const v = await verify.json();
          setRazorpayLoading(false);
          if (v.success) {
            navigate(v.redirect || "/checkout/success");
          } else {
            showToast(v.message || "Payment verification failed.", "error");
          }
        },
      };

      const rzp = new Razorpay(options); // ← now uses the local var
      rzp.open();
    } catch (err) {
      console.error(err);
      showToast("Network error. Please try again.", "error");
      setRazorpayLoading(false);
    }
  };

  /* ============================================================ */
  /*  RENDER                                                       */
  /* ============================================================ */
  return (
    <div className="checkout-page">
      <div className="container">
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-header-left">
            <h1 className="checkout-title">Checkout</h1>
            <p className="checkout-subtitle">
              Complete your order with secure payment.
            </p>
          </div>
          <div className="checkout-header-right">
            <Link to="/cart" className="checkout-back-link">
              <i className="bi bi-arrow-left"></i> Back to Cart
            </Link>
          </div>
        </div>

        <div className="row">
          {/* LEFT COLUMN */}
          <div className="col-lg-7">
            {/* Customer Details */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h5 className="checkout-card-title">
                  <i className="bi bi-person"></i> Customer Details
                </h5>
                {isLoggedIn && (
                  <span className="logged-in-badge">
                    <i className="bi bi-check-circle-fill"></i> Logged in as{" "}
                    {userData.email}
                  </span>
                )}
              </div>
              <div className="checkout-card-body">
                <div className="row" id="customer-info-form">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="name" className="form-label">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      readOnly={isLoggedIn}
                    />
                    {isLoggedIn && (
                      <small className="text-muted">
                        Email cannot be changed
                      </small>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="phone" className="form-label">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="postal_code" className="form-label">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="postal_code"
                      name="postal_code"
                      value={form.postal_code}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="city" className="form-label">
                      City *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="state" className="form-label">
                      State
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="state"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label htmlFor="address" className="form-label">
                      Address *
                    </label>
                    <textarea
                      className="form-control"
                      id="address"
                      name="address"
                      rows="2"
                      value={form.address}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {!isLoggedIn && (
                  <div className="create-account-section mt-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="create_account"
                        name="create_account"
                        checked={form.create_account}
                        onChange={handleChange}
                        value="1"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="create_account"
                      >
                        <i className="bi bi-person-plus"></i> Create an account
                      </label>
                    </div>
                    <div
                      id="password-container"
                      style={{
                        display: form.create_account ? "block" : "none",
                        marginTop: 12,
                      }}
                    >
                      <label htmlFor="password" className="form-label">
                        Password *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter a strong password (min 8 characters)"
                      />
                      <small className="text-muted">
                        Password must be at least 8 characters
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h5 className="checkout-card-title">
                  <i className="bi bi-credit-card"></i> Payment Method
                </h5>
              </div>
              <div className="checkout-card-body">
                {paymentMethods.length === 0 ? (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle"></i>
                    No payment methods are currently enabled. Please contact
                    support.
                  </div>
                ) : (
                  <>
                    {paymentMethods.map((method, idx) => (
                      <div className="payment-method-item" key={method.id}>
                        <input
                          type="radio"
                          className="payment-method-radio"
                          name="payment_method"
                          id={`payment_${method.id}`}
                          value={method.id}
                          checked={selectedPayment === method.id}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                          data-method={method.id}
                        />
                        <label
                          htmlFor={`payment_${method.id}`}
                          className="payment-method-label"
                        >
                          <i className={method.icon}></i>
                          {method.name}
                          {method.id === "razorpay" && (
                            <span className="payment-badge">Recommended</span>
                          )}
                        </label>
                      </div>
                    ))}

                    {selectedPayment === "razorpay" && (
                      <div id="razorpay-container" style={{ marginTop: 16 }}>
                        <div className="razorpay-info">
                          <i className="bi bi-shield-check"></i>
                          <span>Secured payment via Razorpay</span>
                        </div>
                        <div id="razorpay-btn-container" className="mt-3">
                          <button
                            type="button"
                            className="btn-pay-now"
                            id="razorpay-pay-btn"
                            onClick={handleRazorpayPay}
                            disabled={razorpayLoading}
                          >
                            <i className="bi bi-lock"></i> Pay Now ₹
                            {Number(cartData.total).toFixed(2)}
                          </button>
                          {razorpayLoading && (
                            <div id="razorpay-loading">
                              <div
                                className="spinner-border text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">
                                  Loading...
                                </span>
                              </div>
                              <span>Initializing payment...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedPayment && selectedPayment !== "razorpay" && (
                      <div id="pay-order-container" className="mt-3">
                        <button
                          type="button"
                          className="btn-pay-order"
                          id="pay-order-btn"
                        >
                          <i className="bi bi-credit-card"></i> Pay Order ₹
                          {Number(cartData.total).toFixed(2)}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Order Summary */}
          <div className="col-lg-5">
            <div className="checkout-summary">
              <div className="checkout-summary-header">
                <h5 className="checkout-summary-title">Order Summary</h5>
                <span className="order-items-count">
                  {cartData.items?.length ?? 0} items
                </span>
              </div>
              <div className="checkout-summary-body">
                {cartData.items?.map((item, i) => (
                  <div className="summary-item" key={i}>
                    <div className="summary-item-image">
                      <img src={imageUrl(item.image)} alt={item.name} />
                    </div>
                    <div className="summary-item-details">
                      <div className="summary-item-name">{item.name}</div>
                      {item.is_variant &&
                        item.variant_features_list?.length > 0 && (
                          <div className="summary-item-variant">
                            {Object.entries(item.variant_features || {}).map(
                              ([name, value], idx) => {
                                const isColor = name.toLowerCase() === "color";
                                const isHex = /^#[0-9A-Fa-f]{6}$/.test(
                                  String(value).trim(),
                                );
                                return (
                                  <span
                                    className="variant-feature-checkout"
                                    key={idx}
                                  >
                                    {isColor && isHex ? (
                                      <span
                                        className="variant-feature-color-dot"
                                        style={{ backgroundColor: value }}
                                      ></span>
                                    ) : (
                                      value
                                    )}
                                  </span>
                                );
                              },
                            )}
                          </div>
                        )}
                      <div className="summary-item-meta">
                        <span className="summary-item-qty">
                          Qty: {item.quantity}
                        </span>
                        <span className="summary-item-price">
                          ₹{Number(item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="checkout-summary-footer">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{Number(cartData.subtotal).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax ({cartData.tax_rate}%)</span>
                  <span>₹{Number(cartData.tax).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>
                    {cartData.shipping > 0
                      ? `₹${Number(cartData.shipping).toFixed(2)}`
                      : "Free"}
                  </span>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <span className="total-amount">
                    ₹{Number(cartData.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
