// src/pages/front/category/CategoryOverview.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import FeaturesSidebar from "../../../components/front/category/FeaturesSidebar";
import ProductGrid from "../../../components/front/category/ProductGrid";
import { showToast } from "../../../utils/toast";
import API_URL from "../../../api/config";
import { addToCart } from "../../../utils/cart";

const API_BASE = API_URL;

/* ------------------------------------------------------------------ */
/*  Case-insensitive slug compare                                     */
/* ------------------------------------------------------------------ */
const sameSlug = (a, b) =>
  String(a ?? "")
    .toLowerCase()
    .trim() ===
  String(b ?? "")
    .toLowerCase()
    .trim();

/* ------------------------------------------------------------------ */
/*  Extract a slug from a category                                    */
/* ------------------------------------------------------------------ */
const getCategorySlug = (cat) => {
  if (!cat) return "";
  if (cat.slug) return String(cat.slug).trim();
  if (cat.link) {
    const parts = String(cat.link).split("/").filter(Boolean);
    return (parts[parts.length - 1] || "").trim();
  }
  if (cat.name) {
    return String(cat.name).toLowerCase().replace(/\s+/g, "-").trim();
  }
  return "";
};

/* ------------------------------------------------------------------ */
/*  Reusable renderer for the category tree (desktop + offcanvas)     */
/* ------------------------------------------------------------------ */
const renderCategoryTree = (
  categories,
  activeCategory,
  activeSubcategory,
  expandedCategoryIds,
  onParentClick,
  onChildClick,
) => (
  <ul className="co-category-list">
    {categories.map((parent) => {
      const isActive = String(activeCategory?.id) === String(parent.id);
      const isOpen = expandedCategoryIds.some(
        (id) => String(id) === String(parent.id),
      );
      const hasChildren =
        Array.isArray(parent.children) && parent.children.length > 0;

      return (
        <li
          key={parent.id}
          className={`co-category-item ${isActive ? "active" : ""}`}
        >
          <a
            href="#"
            className="co-category-link"
            onClick={(e) => {
              e.preventDefault();
              onParentClick(parent);
            }}
          >
            {parent.icon && (
              <i className={`co-category-icon ${parent.icon}`}></i>
            )}
            <span className="co-category-name">{parent.name}</span>
            {hasChildren && (
              <span className={`co-category-arrow ${isOpen ? "open" : ""}`}>
                <i
                  className={`fa-solid fa-chevron-${
                    isOpen ? "down" : "right"
                  }`}
                ></i>
              </span>
            )}
          </a>

          {hasChildren && (
            <ul className={`co-subcategory-list ${isOpen ? "open" : ""}`}>
              {parent.children.map((child) => {
                const childActive =
                  String(activeSubcategory?.id) === String(child.id);
                return (
                  <li
                    key={child.id}
                    className={`co-subcategory-item ${
                      childActive ? "active" : ""
                    }`}
                  >
                    <a
                      href="#"
                      className="co-subcategory-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onChildClick(parent, child);
                      }}
                    >
                      {child.name}
                      {child.item_count ? (
                        <span className="co-item-count">
                          ({child.item_count})
                        </span>
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    })}
  </ul>
);

const CategoryOverview = () => {
  const { slug1, slug2 } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);

  const [features, setFeatures] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState({});

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(999999);
  const [defaultMinPrice, setDefaultMinPrice] = useState(0);
  const [defaultMaxPrice, setDefaultMaxPrice] = useState(999999);

  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [lastPage, setLastPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  /* ---------- 1. Fetch category tree ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/category/tree`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        const tree = data?.data ?? data?.categories ?? data ?? [];
        setCategories(Array.isArray(tree) ? tree : []);
      } catch (err) {
        console.error("Category tree fetch failed", err);
        showToast("Failed to load categories", "error");
      }
    })();
  }, []);

  /* ---------- 2. Resolve active category + first child ---------- */
  useEffect(() => {
    if (!categories.length) return;

    let parent = null;
    let child = null;

    if (slug2) {
      for (const cat of categories) {
        const match = (cat.children || []).find((c) =>
          sameSlug(getCategorySlug(c), slug2),
        );
        if (match) {
          parent = cat;
          child = match;
          break;
        }
      }
    }

    if (!parent && slug1) {
      parent =
        categories.find((c) => sameSlug(getCategorySlug(c), slug1)) || null;
    }

    if (!parent && slug1) {
      parent =
        categories.find((c) =>
          (c.children || []).some((ch) =>
            sameSlug(getCategorySlug(ch), slug1),
          ),
        ) || null;
      if (parent) {
        child =
          (parent.children || []).find((ch) =>
            sameSlug(getCategorySlug(ch), slug1),
          ) || null;
      }
    }

    if (parent && !child) {
      const children = Array.isArray(parent.children) ? parent.children : [];
      if (children.length > 0) child = children[0];
    }

    if (!parent && categories.length > 0) {
      parent = categories[0];
      const children = Array.isArray(parent.children) ? parent.children : [];
      if (children.length > 0) child = children[0];
    }

    setActiveCategory(parent);
    setActiveSubcategory(child);
    setExpandedCategoryIds(parent ? [parent.id] : []);
  }, [categories, slug1, slug2]);

  /* ---------- 3. Build query ---------- */
  const buildQuery = useCallback(() => {
    const payload = {
      category_id: activeCategory?.id ?? null,
      subcategory_id: activeSubcategory?.id ?? null,
      min_price: minPrice,
      max_price: maxPrice,
      sort: sortBy,
      page,
      per_page: 12,
      features: {},
    };

    Object.entries(selectedFeatures).forEach(([featureId, valueIds]) => {
      if (Array.isArray(valueIds) && valueIds.length > 0) {
        payload.features[featureId] = valueIds;
      }
    });

    return payload;
  }, [
    activeCategory,
    activeSubcategory,
    minPrice,
    maxPrice,
    sortBy,
    page,
    selectedFeatures,
  ]);

  /* ---------- 4. Fetch filtered products ---------- */
  useEffect(() => {
    if (!slug1 && !activeCategory) {
      setLoading(false);
      return;
    }
    if (!activeCategory) {
      setLoading(false);
      return;
    }

    const hasChildren = (activeCategory.children || []).length > 0;
    if (hasChildren && !activeSubcategory) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/category/filter-products`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildQuery()),
        });

        const data = await res.json();
        if (cancelled) return;

        if (data.success) {
          setProducts(data.data?.products ?? data.products ?? []);
          setLastPage(data.data?.last_page ?? data.last_page ?? 1);
          setTotalProducts(data.data?.total ?? data.total ?? 0);
        } else {
          showToast(data.message || "Failed to load products", "error");
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          showToast("Failed to load products", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [buildQuery, activeCategory, activeSubcategory, slug1]);

  /* ---------- 5. Fetch features ---------- */
  useEffect(() => {
    if (!activeCategory) return;

    const hasChildren = (activeCategory.children || []).length > 0;
    if (hasChildren && !activeSubcategory) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/category/get-features`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category_id: activeCategory.id,
            subcategory_id: activeSubcategory?.id ?? null,
          }),
        });
        const data = await res.json();
        setFeatures(
          data.status && Array.isArray(data.features) ? data.features : [],
        );
      } catch (err) {
        console.error("Features fetch failed", err);
        setFeatures([]);
      }
    })();
  }, [activeCategory, activeSubcategory]);

  /* ---------- 6. Lock body scroll while mobile filter is open ---------- */
  useEffect(() => {
    if (typeof document === "undefined") return;

    const body = document.body;
    const html = document.documentElement;

    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;

    if (mobileFilterOpen) {
      const scrollbarWidth = window.innerWidth - html.clientWidth;
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
    } else {
      body.style.overflow = prevBodyOverflow || "";
      html.style.overflow = prevHtmlOverflow || "";
      body.style.paddingRight = prevBodyPaddingRight || "";
    }

    return () => {
      body.style.overflow = prevBodyOverflow || "";
      html.style.overflow = prevHtmlOverflow || "";
      body.style.paddingRight = prevBodyPaddingRight || "";
    };
  }, [mobileFilterOpen]);

  /* ---------- 7. Force layout settle when offcanvas opens ---------- */
  useEffect(() => {
    if (!mobileFilterOpen) return;

    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(
        ".co-mobile-filters .offcanvas-body",
      );
      if (!el) return;

      // Force sync layout read
      void el.scrollHeight;

      el.classList.add("scroll-ready");
      requestAnimationFrame(() => el.classList.remove("scroll-ready"));

      // Nudge so Chrome re-evaluates scrollbar visibility
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop = 1;
        requestAnimationFrame(() => {
          el.scrollTop = 0;
        });
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [mobileFilterOpen]);

  /* ---------- 8. Feature toggle ---------- */
  const handleFeatureToggle = (featureId, valueId) => {
    setSelectedFeatures((prev) => {
      const current = prev[featureId] || [];
      const exists = current.includes(valueId);
      const next = exists
        ? current.filter((v) => v !== valueId)
        : [...current, valueId];

      const updated = { ...prev, [featureId]: next };
      if (next.length === 0) delete updated[featureId];
      return updated;
    });
    setPage(1);
  };

  /* ---------- 9. Sidebar navigation ---------- */
  const handleCategoryClick = (parent) => {
    setExpandedCategoryIds((prev) => {
      const exists = prev.some((id) => String(id) === String(parent.id));
      return exists
        ? prev.filter((id) => String(id) !== String(parent.id))
        : [parent.id];
    });
  };

  const handleSubcategoryClick = (parent, child) => {
    setActiveCategory(parent);
    setActiveSubcategory(child);
    setExpandedCategoryIds([parent.id]);
    setPage(1);

    const parentSlug = getCategorySlug(parent);
    const childSlug = getCategorySlug(child);
    navigate(`/category/${parentSlug}/${childSlug}`);
  };

  const handleParentSelect = (parent) => {
    const isSameActive = String(activeCategory?.id) === String(parent.id);

    if (isSameActive) {
      handleCategoryClick(parent);
      return;
    }

    const children = Array.isArray(parent.children) ? parent.children : [];
    const parentSlug = getCategorySlug(parent);
    const firstChildSlug =
      children.length > 0 ? getCategorySlug(children[0]) : null;

    const target = firstChildSlug
      ? `/category/${parentSlug}/${firstChildSlug}`
      : `/category/${parentSlug}`;

    setActiveCategory(parent);
    setActiveSubcategory(children[0] || null);
    setExpandedCategoryIds([parent.id]);
    setPage(1);
    navigate(target);
  };

  /* ---------- 10. Clear filters ---------- */
  const clearAllFilters = () => {
    setSelectedFeatures({});
    setMinPrice(defaultMinPrice);
    setMaxPrice(defaultMaxPrice);
    setSortBy("latest");
    setPage(1);
  };

  /* ---------- 11. Active chips ---------- */
  const activeChips = useMemo(() => {
    const chips = [];
    Object.entries(selectedFeatures).forEach(([featureId, valueIds]) => {
      const feature = features.find((f) => String(f.id) === String(featureId));
      if (!feature || !Array.isArray(feature.values)) return;

      valueIds.forEach((vid) => {
        const val = feature.values.find((v) => String(v.id) === String(vid));
        if (val) {
          chips.push({
            key: `${featureId}-${vid}`,
            label: `${feature.name}: ${val.value}`,
            onRemove: () => handleFeatureToggle(Number(featureId), vid),
          });
        }
      });
    });
    return chips;
  }, [selectedFeatures, features]);

  const title = activeSubcategory
    ? activeSubcategory.name
    : activeCategory
      ? activeCategory.name
      : "All Products";

  /* ------------------------------------------------------------------ */
  /* Mobile offcanvas (portaled to <body>)                              */
  /* ------------------------------------------------------------------ */
  const mobileOffcanvas =
    mobileFilterOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              className="offcanvas-backdrop fade show"
              onClick={() => setMobileFilterOpen(false)}
            ></div>

            <div
              className="offcanvas offcanvas-start show co-mobile-filters"
              tabIndex="-1"
              aria-labelledby="mobileFilterLabel"
            >
              <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="mobileFilterLabel">
                  Filters
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setMobileFilterOpen(false)}
                ></button>
              </div>

              <div className="offcanvas-body">
                {/* ---------- CATEGORIES ---------- */}
                <div className="sidebar-box">
                  <h5 className="sidebar-title">Categories</h5>
                  {renderCategoryTree(
                    categories,
                    activeCategory,
                    activeSubcategory,
                    expandedCategoryIds,
                    handleParentSelect,
                    (parent, child) => {
                      handleSubcategoryClick(parent, child);
                      setMobileFilterOpen(false);
                    },
                  )}
                </div>

                {/* ---------- PRICE ---------- */}
                <div className="sidebar-box">
                  <h5 className="sidebar-title">Price Range</h5>
                  <div className="co-price-inputs">
                    <div className="co-price-input-group">
                      <label>Min</label>
                      <input
                        type="number"
                        value={minPrice}
                        min="0"
                        onChange={(e) => {
                          setMinPrice(Number(e.target.value));
                          setPage(1);
                        }}
                      />
                    </div>
                    <div className="co-price-input-group">
                      <label>Max</label>
                      <input
                        type="number"
                        value={maxPrice}
                        min="0"
                        onChange={(e) => {
                          setMaxPrice(Number(e.target.value));
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn co-btn-primary btn-sm w-100 mt-2"
                    onClick={() => setPage(1)}
                  >
                    Apply Price
                  </button>
                </div>

                {/* ---------- FEATURES ---------- */}
                <div className="sidebar-box">
                  <h5 className="sidebar-title">Features</h5>
                  <FeaturesSidebar
                    features={features}
                    selected={selectedFeatures}
                    onToggle={handleFeatureToggle}
                  />
                </div>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  /* ================================================================== */
  /* RENDER                                                             */
  /* ================================================================== */
  return (
    <div className="category-overview">
      <div className="container-fluid">
        <div className="row">
          {/* ================= DESKTOP SIDEBAR ================= */}
          <aside className="col-lg-3 col-xl-2 category-sidebar">
            <div className="sidebar-box">
              <h5 className="sidebar-title">Categories</h5>
              {renderCategoryTree(
                categories,
                activeCategory,
                activeSubcategory,
                expandedCategoryIds,
                handleParentSelect,
                handleSubcategoryClick,
              )}
            </div>

            {/* Price Filter */}
            <div className="sidebar-box">
              <h5 className="sidebar-title">Price Range</h5>
              <div className="co-price-range-wrapper">
                <div className="co-price-inputs">
                  <div className="co-price-input-group">
                    <label>Min</label>
                    <input
                      type="number"
                      value={minPrice}
                      min="0"
                      onChange={(e) => {
                        setMinPrice(Number(e.target.value));
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="co-price-input-group">
                    <label>Max</label>
                    <input
                      type="number"
                      value={maxPrice}
                      min="0"
                      onChange={(e) => {
                        setMaxPrice(Number(e.target.value));
                        setPage(1);
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn co-btn-primary btn-sm w-100 mt-2"
                  onClick={() => setPage(1)}
                >
                  Apply Price
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="sidebar-box">
              <h5 className="sidebar-title">Features</h5>
              <FeaturesSidebar
                features={features}
                selected={selectedFeatures}
                onToggle={handleFeatureToggle}
              />
            </div>
          </aside>

          {/* ================= MAIN CONTENT ================= */}
          <main className="col-lg-9 col-xl-10 category-content">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item active">
                  {activeCategory ? activeCategory.name : "Categories"}
                </li>
                {activeSubcategory && (
                  <li className="breadcrumb-item active">
                    {activeSubcategory.name}
                  </li>
                )}
              </ol>
            </nav>

            <div className="category-header">
              <h1>{title}</h1>
              <p className="product-count">
                <span>{totalProducts}</span> Products
              </p>
            </div>

            <div className="category-toolbar">
              <div className="toolbar-left">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-lg-none"
                  onClick={() => setMobileFilterOpen(true)}
                >
                  <i className="fas fa-sliders-h"></i> Filters
                </button>
                <div className="co-active-filters">
                  {activeChips.map((chip) => (
                    <span key={chip.key} className="co-filter-chip">
                      {chip.label}
                      <span className="co-remove-chip" onClick={chip.onRemove}>
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="toolbar-right">
                <div className="sort-wrapper">
                  <label htmlFor="sortSelect">Sort by:</label>
                  <select
                    id="sortSelect"
                    className="form-select form-select-sm"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating_high">Rating: High to Low</option>
                    <option value="discount_high">Discount: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div id="productGridWrapper">
              <div
                className="product-grid-loading"
                style={{ display: loading ? "flex" : "none" }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>

              <div className="product-grid">
                <ProductGrid
                  products={products}
                  currentPage={page}
                  lastPage={lastPage}
                  onPageChange={setPage}
                  onClearAllFilters={clearAllFilters}
                  onAddToCart={async (
                    productId,
                    variantId,
                    hasVariants,
                    name,
                  ) => {
                    if (!productId) {
                      showToast(
                        "Product ID not found. Please refresh and try again.",
                        "error",
                      );
                      return;
                    }

                    if (hasVariants && (!variantId || variantId === 0)) {
                      showToast(
                        "Please select a variant from the product page.",
                        "info",
                      );
                      return;
                    }

                    try {
                      const res = await addToCart(productId, 1, variantId || 0);

                      if (res.unauthenticated) {
                        showToast(
                          "Please log in to add items to your cart.",
                          "info",
                        );
                        return;
                      }

                      if (res.success) {
                        showToast(
                          `✓ ${name || "Product"} added to cart!`,
                          "success",
                        );

                        window.dispatchEvent(
                          new CustomEvent("cart:updated", {
                            detail: { count: res.count },
                          }),
                        );
                      } else {
                        showToast(
                          res.message || "Failed to add to cart.",
                          "error",
                        );
                      }
                    } catch (err) {
                      console.error("Add to cart failed", err);
                      showToast(
                        "Something went wrong. Please try again.",
                        "error",
                      );
                    }
                  }}
                  onToggleWishlist={(productId, variantId) => {
                    console.log("wishlist-toggle", {
                      productId,
                      variantId,
                    });
                  }}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ================= PORTALED MOBILE FILTER ================= */}
      {mobileOffcanvas}
    </div>
  );
};

export default CategoryOverview;