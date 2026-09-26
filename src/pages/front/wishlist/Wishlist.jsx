// src/pages/front/wishlist/Wishlist.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../../../utils/toast";
import { addToCart } from "../../../utils/cart"; // ← ADD THIS

const API_BASE = "/api";

const imageUrl = (input) => {
  // Product/item object → prefer backend-resolved image_url first
  if (input && typeof input === "object") {
    if (input.image_url) return input.image_url;
    if (input.variant_image_url) return input.variant_image_url;
    if (input.image) return imageUrl(input.image);
    if (input.variant_image) return imageUrl(input.variant_image);
    return "/assets/images/default-product.jpg";
  }

  const path = String(input || "").trim();
  if (!path) return "/assets/images/default-product.jpg";

  // Already a full URL
  if (/^https?:\/\//i.test(path)) return path;

  // Strip leading slashes so we can normalize
  const clean = path.replace(/^\/+/, "");

  // Already storage/... → just add leading slash
  if (/^storage\//i.test(clean)) return `/${clean}`;

  // Everything else → put it under /storage/
  // uploads/products/a.jpg    → /storage/uploads/products/a.jpg
  // products/a.jpg            → /storage/products/a.jpg
  // assets/images/a.png       → /storage/assets/images/a.png   (unlikely but consistent)
  return `/storage/${clean}`;
};

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState([]);
  const token = localStorage.getItem("auth_token");

  /* ---------------------------------------------------------- */
  /*  Fetch wishlist                                             */
  /* ---------------------------------------------------------- */
  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wishlist`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        const payload = data.data || data;
        setItems(
          payload.items ?? payload.wishlist_items ?? payload.wishlist ?? [],
        );
      }
    } catch (err) {
      console.error("Wishlist fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line
  }, []);

  /* ---------------------------------------------------------- */
  /*  Remove one item                                            */
  /* ---------------------------------------------------------- */
  const removeFromWishlist = async (productId, variantId = 0) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this item from your wishlist?",
      )
    )
      return;

    const key = `${productId}-${variantId}`;
    setRemovingIds((ids) => [...ids, key]);

    try {
      const res = await fetch(`${API_BASE}/wishlist/remove`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ product_id: productId, variant_id: variantId }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.count !== undefined) {
          document
            .querySelectorAll(
              ".wishlist-count, .wishlist-badge, .nav-wishlist-count",
            )
            .forEach((el) => {
              el.textContent = data.count;
              el.style.display = data.count > 0 ? "" : "none";
            });
        }
        setTimeout(() => {
          fetchWishlist();
          showToast("Item removed from wishlist", "info");
        }, 400);
      } else {
        showToast(data.message || "Failed to remove item", "error");
        setRemovingIds((ids) => ids.filter((k) => k !== key));
      }
    } catch {
      showToast("An error occurred. Please try again.", "error");
      setRemovingIds((ids) => ids.filter((k) => k !== key));
    }
  };

  /* ---------------------------------------------------------- */
  /*  Clear all                                                  */
  /* ---------------------------------------------------------- */
  const clearWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?"))
      return;

    try {
      const res = await fetch(`${API_BASE}/wishlist/clear`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        showToast("Wishlist cleared successfully", "info");
        setItems([]);
        document
          .querySelectorAll(
            ".wishlist-count, .wishlist-badge, .nav-wishlist-count",
          )
          .forEach((el) => {
            el.textContent = 0;
            el.style.display = "none";
          });
      } else {
        showToast(data.message || "Failed to clear wishlist", "error");
      }
    } catch {
      showToast("An error occurred. Please try again.", "error");
    }
  };

  const addToCartFromWishlist = async (productId, variantId = 0) => {
    if (!productId) {
      showToast("Product ID is missing.", "error");
      return;
    }

    try {
      const res = await addToCart(productId, 1, variantId || 0);

      if (res.unauthenticated) {
        showToast("Please log in to add items to your cart.", "info");
        return;
      }

      if (res.success) {
        showToast("✓ Product added to cart!", "success");

        // Notify the header to update its badge
        window.dispatchEvent(
          new CustomEvent("cart:updated", {
            detail: { count: res.count },
          }),
        );
      } else {
        showToast(res.message || "Failed to add to cart.", "error");
      }
    } catch (err) {
      console.error("Add to cart failed", err);
      showToast("An error occurred. Please try again.", "error");
    }
  };

  /* ============================================================ */
  /*  RENDER                                                       */
  /* ============================================================ */
  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="mb-2">
            <i className="bi bi-heart-fill text-danger"></i> My Wishlist
          </h1>
          <p className="text-muted">Your favorite products saved for later</p>
        </div>
        <div className="col-md-4 text-end">
          {items.length > 0 && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={clearWishlist}
            >
              <i className="bi bi-trash"></i> Clear All
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="row">
            {items.map((item, idx) => {
              const price =
                item.variant_sale_price ??
                item.variant_price ??
                item.sale_price ??
                item.price;
              const stock = item.variant_stock ?? item.stock ?? 0;
              const variantId = item.variant_id ?? 0;
              const productId = item.product_id;
              const key = `${productId}-${variantId}`;
              const removing = removingIds.includes(key);

              return (
                <div
                  className="col-lg-3 col-md-4 col-sm-6 mb-4"
                  key={key + idx}
                >
                  <div
                    className={`card wishlist-card h-100 shadow-sm ${removing ? "item-removing" : ""}`}
                  >
                    <div className="position-relative">
                      <Link to={`/product/${item.slug}`}>
                        <img
                          src={imageUrl(item)}
                          className="card-img-top wishlist-product-image"
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src =
                              "/assets/images/default-product.jpg";
                          }}
                        />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm wishlist-remove-btn wishlist-remove-btn-x"
                        data-product-id={productId}
                        data-variant-id={variantId}
                        onClick={() => removeFromWishlist(productId, variantId)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                      {stock > 0 ? (
                        <span className="badge bg-success position-absolute top-0 start-0 m-2">
                          <i className="bi bi-check-circle"></i> In Stock
                        </span>
                      ) : (
                        <span className="badge bg-danger position-absolute top-0 start-0 m-2">
                          <i className="bi bi-x-circle"></i> Out of Stock
                        </span>
                      )}
                      {variantId > 0 && (
                        <span className="badge bg-info position-absolute bottom-0 start-0 m-2">
                          <i className="bi bi-tag"></i> Variant
                        </span>
                      )}
                    </div>

                    <div className="card-body">
                      <h5 className="card-title">
                        <Link
                          to={`/product/${item.slug}`}
                          className="text-decoration-none text-dark"
                        >
                          {item.name}
                        </Link>
                      </h5>

                      {variantId > 0 && (
                        <small className="text-muted d-block mb-1">
                          <i className="bi bi-tag"></i> SKU:{" "}
                          {item.sku || "Variant"}
                        </small>
                      )}

                      <p className="card-text">
                        <span className="fw-bold text-primary fs-5">
                          ₹{Number(price).toFixed(2)}
                        </span>

                        {/* Normal product → strike-through original price */}
                        {variantId === 0 &&
                          item.sale_price > 0 &&
                          item.price > 0 &&
                          Number(item.sale_price) < Number(item.price) && (
                            <small className="text-muted text-decoration-line-through ms-1">
                              ₹{Number(item.price).toFixed(2)}
                            </small>
                          )}

                        {/* Variant product → strike-through original variant price */}
                        {variantId > 0 &&
                          item.variant_sale_price > 0 &&
                          item.variant_price > 0 &&
                          Number(item.variant_sale_price) <
                            Number(item.variant_price) && (
                            <small className="text-muted text-decoration-line-through ms-1">
                              ₹{Number(item.variant_price).toFixed(2)}
                            </small>
                          )}
                      </p>
                      <div className="d-grid gap-2">
                        {stock > 0 ? (
                          <button
                            type="button"
                            className="btn btn-primary add-to-cart-from-wishlist"
                            data-product-id={productId}
                            data-variant-id={variantId}
                            onClick={() =>
                              addToCartFromWishlist(productId, variantId)
                            }
                          >
                            <i className="bi bi-cart-plus"></i> Add to Cart
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled
                          >
                            <i className="bi bi-x-circle"></i> Out of Stock
                          </button>
                        )}
                        <Link
                          to={`/product/${item.slug}`}
                          className="btn btn-outline-secondary"
                        >
                          <i className="bi bi-eye"></i> View Product
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="row mt-4">
            <div className="col-md-6 mx-auto">
              <div className="card bg-light whtcrd">
                <div className="card-body text-center">
                  <h5 className="mb-3">Wishlist Summary</h5>
                  <p className="mb-2">
                    <strong>Total Items:</strong>{" "}
                    <span className="badge bg-primary rounded-pill">
                      {items.length}
                    </span>
                  </p>
                  <p className="small mb-0">
                    <i className="bi bi-info-circle"></i> Items in your wishlist
                    are saved until you remove them or they go out of stock.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="row">
          <div className="col-md-8 mx-auto">
            <div className="card text-center py-5 whtcrd">
              <div className="card-body">
                <i
                  className="bi bi-heart whtred"
                  style={{ fontSize: "4rem" }}
                ></i>
                <h3 className="mt-3">Your wishlist is empty</h3>
                <p>Start adding your favorite products to your wishlist!</p>
                <Link to="/" className="btn btn-primary btn-lg">
                  <i className="bi bi-shop"></i> Start Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
