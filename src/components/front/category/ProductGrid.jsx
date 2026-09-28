// src/components/front/category/ProductGrid.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toggleWishlist, checkWishlistStatus } from "../../../utils/wishlist";
import { useAuth } from "../../../context/AuthContext";
import { showToast } from "../../../utils/toast";
import API_URL from "../../../api/config";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const imageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return `${API_ORIGIN}${path}`;
    if (/^storage\//i.test(path)) return `${API_ORIGIN}/${path}`;
    if (/^(uploads|assets)\//i.test(path)) return `${API_ORIGIN}/${path}`;
    return `${API_ORIGIN}/storage/${path.replace(/^\/+/, '')}`;
};

/* ------------------------------------------------------------------ */
/*  Rating stars                                                       */
/* ------------------------------------------------------------------ */
const RatingStars = ({ rating = 0 }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <>
      {Array.from({ length: full }).map((_, i) => (
        <i key={`f${i}`} className="bi bi-star-fill co-star-filled"></i>
      ))}
      {half && <i className="bi bi-star-half co-star-filled"></i>}
      {Array.from({ length: empty }).map((_, i) => (
        <i key={`e${i}`} className="bi bi-star co-star-empty"></i>
      ))}
      <span className="co-rating-count">({Number(rating).toFixed(1)})</span>
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Wishlist heart button (self-contained)                             */
/* ------------------------------------------------------------------ */
const WishlistButton = ({ productId, variantId = 0 }) => {
  const { loggedIn } = useAuth();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loggedIn || !productId) {
      setActive(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const data = await checkWishlistStatus([
          { product_id: productId, variant_id: variantId },
        ]);
        const items = data?.data?.wishlist || data?.wishlist || [];
        const found = items.some(
          (i) =>
            i.product_id === productId &&
            (i.variant_id || 0) === (variantId || 0),
        );
        if (!cancelled) setActive(found);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loggedIn, productId, variantId]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!loggedIn) {
      showToast("Please log in to add items to your wishlist.", "info");
      return;
    }
    if (busy) return;
    setBusy(true);

    try {
      const res = await toggleWishlist(productId, variantId);

      if (res.unauthenticated) {
        showToast("Please log in again.", "error");
        return;
      }

      if (res.success) {
        const added = res.action === "added";
        setActive(added);
        showToast(
          added ? "❤️ Added to wishlist!" : "Removed from wishlist",
          added ? "success" : "info",
        );
        window.dispatchEvent(
          new CustomEvent("wishlist:updated", {
            detail: { count: res.count },
          }),
        );
      } else {
        showToast(res.message || "Something went wrong.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`co-btn-wishlist ${active ? "active" : ""}`}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      onClick={handleClick}
      disabled={busy}
    >
      <i
        className={`bi ${active ? "bi-heart-fill" : "bi-heart"}`}
        style={active ? { color: "#dc3545" } : undefined}
      ></i>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Product card                                                       */
/* ------------------------------------------------------------------ */
const ProductCard = ({ product, onAddToCart }) => {
  const productId = product.product_id ?? product.id ?? 0;
  const productName = product.name ?? "Product";
  const productSlug = product.slug ?? "";
  const productImage =
    product.image_url ?? product.image ?? "assets/images/no-image.png";

  const productRating = parseFloat(product.rating ?? 0);
  const productPrice = parseFloat(product.price ?? 0);
  const productSalePrice = parseFloat(product.sale_price ?? 0);
  const productStock = parseInt(product.stock ?? 0, 10);
  const variantId = product.variant_id ?? 0;
  const hasVariants = Boolean(product.has_variants);
  const variantName = product.variant_name ?? "";
  const discountPercent = product.discount_percent ?? 0;

  const hasSale = productSalePrice > 0 && productSalePrice < productPrice;

  return (
    <div className="col-6 col-md-4 col-lg-3">
      <div className="co-product-card" data-product-id={productId}>
        <div className="co-product-card-image">
          <Link to={`/product/${productSlug}`}>
            <img
              src={imageUrl(productImage)}
              alt={productName}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/assets/images/default-product.jpg";
              }}
            />
          </Link>

          {discountPercent > 0 && (
            <span className="co-discount-badge">
              {Math.round(discountPercent)}% OFF
            </span>
          )}

          {hasVariants && !discountPercent && (
            <span className="co-variant-badge">Variants</span>
          )}

          {productStock <= 0 && (
            <span className="co-out-of-stock-badge">Out of Stock</span>
          )}

          <WishlistButton productId={productId} variantId={variantId} />
        </div>

        <div className="co-product-card-body">
          <h6 className="co-product-name">
            <Link to={`/product/${productSlug}`}>{productName}</Link>
            {variantName && (
              <span className="text-muted small"> ({variantName})</span>
            )}
          </h6>

          <div className="co-product-rating">
            <RatingStars rating={productRating} />
          </div>

          <div className="co-product-price">
            {hasSale ? (
              <>
                <span className="co-sale-price">
                  ₹{Math.round(productSalePrice).toLocaleString("en-IN")}
                </span>
                <span className="co-original-price">
                  ₹{Math.round(productPrice).toLocaleString("en-IN")}
                </span>
              </>
            ) : (
              <span className="co-regular-price">
                ₹{Math.round(productPrice).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <div className="co-product-actions mt-2">
            {productStock > 0 ? (
              <button
                type="button"
                className="btn co-btn-primary btn-sm add-to-cart w-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  onAddToCart?.(
                    productId,
                    variantId || 0,
                    hasVariants,
                    productName,
                  );
                }}
              >
                <i className="bi bi-cart3"></i>{" "}
                {hasVariants ? "Add to Cart" : "Add to Cart"}
              </button>
            ) : (
              <button
                type="button"
                className="btn co-btn-secondary btn-sm w-100"
                disabled
              >
                <i className="bi bi-x-circle"></i> Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
const Pagination = ({ currentPage = 1, lastPage = 1, onPageChange }) => {
  if (lastPage <= 1) return null;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(lastPage, currentPage + 2);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav aria-label="Product pagination" className="co-pagination">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>
        </li>
        {pages.map((p) => (
          <li
            key={p}
            className={`page-item ${p === currentPage ? "active" : ""}`}
          >
            <button
              type="button"
              className="page-link"
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          </li>
        ))}
        <li
          className={`page-item ${currentPage >= lastPage ? "disabled" : ""}`}
        >
          <button
            type="button"
            className="page-link"
            disabled={currentPage >= lastPage}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

/* ------------------------------------------------------------------ */
/*  Grid wrapper                                                       */
/* ------------------------------------------------------------------ */
const ProductGrid = ({
  products = [],
  currentPage = 1,
  lastPage = 1,
  onPageChange,
  onAddToCart,
  onClearAllFilters,
}) => {
  return (
    <>
      <div className="row g-3">
        {products.length === 0 ? (
          <div className="col-12">
            <div className="co-empty-state">
              <i className="fas fa-search"></i>
              <h3>No Products Found</h3>
              <p className="text-muted">
                Try adjusting your filters or selecting another category.
              </p>
              <button type="button" className="btn" onClick={onClearAllFilters}>
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          products.map((product, i) => (
            <ProductCard
              key={`${product.product_id ?? product.id}-${i}`}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        lastPage={lastPage}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default ProductGrid;
