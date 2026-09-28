// src/components/front/layouts/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import API_URL from "../../../api/config";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout as apiLogout } from "../../../utils/auth";
import { getWishlistCount } from "../../../utils/wishlist";
import { showToast } from "../../../utils/toast";
import { useAuth } from "../../../context/AuthContext";
import "../../../css/custom-header.css";

const API_BASE = API_URL;

function getAuthToken() {
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("customer_token") ||
    localStorage.getItem("token") ||
    null
  );
}

/* ------------------------------------------------------------------ */
/*  Image URL resolver                                                 */
/*  Turns relative paths into /storage/uploads/... URLs                */
/* ------------------------------------------------------------------ */
function resolveImageUrl(input) {
  if (input && typeof input === "object") {
    if (input.image_url) return input.image_url;
    if (input.image) return resolveImageUrl(input.image);
  }

  const path = input;
  if (!path) return "/assets/images/default-product.jpg";
  if (/^https?:\/\//i.test(path)) return path; // already absolute URL
  if (path.startsWith("/storage/")) return path; // already correct
  if (path.startsWith("/")) return path; // absolute path from server

  // Strip any leading "storage/" so we don't double-prefix
  const cleaned = path.replace(/^storage\//i, "");

  if (/^(uploads|assets)\//i.test(cleaned)) {
    return `/storage/${cleaned}`;
  }

  return `/storage/${cleaned.replace(/^\/+/, "")}`;
}

const Header = ({
  headerMenus = [],
  cartCount = 0,
  wishlistCount = 0,
  searchEndpoint = `${API_URL}/search`,
  searchPageUrl = "/search",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loggedIn, isAdmin, doLogout } = useAuth();

  const userName = user?.name || "";
  const avatarUrl = user?.avatar || "";

  /* ---------- Live cart count ---------- */
  const [liveCartCount, setLiveCartCount] = useState(cartCount);

  useEffect(() => {
    setLiveCartCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = { Accept: "application/json" };
        const token = getAuthToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/cart/summary`, {
          headers,
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const serverCount = data?.data?.count ?? data?.count ?? null;
        if (!cancelled && typeof serverCount === "number") {
          setLiveCartCount(serverCount);
        }
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    const handler = (e) => {
      if (typeof e.detail?.count === "number") {
        setLiveCartCount(e.detail.count);
      }
    };
    window.addEventListener("cart:updated", handler);
    return () => window.removeEventListener("cart:updated", handler);
  }, []);

  /* ---------- Live wishlist count ---------- */
  const [liveWishlistCount, setLiveWishlistCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!loggedIn) {
      setLiveWishlistCount(0);
      return;
    }
    (async () => {
      try {
        const data = await getWishlistCount();
        if (!cancelled && typeof data?.count === "number") {
          setLiveWishlistCount(data.count);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    const handler = (e) => {
      if (typeof e.detail?.count === "number") {
        setLiveWishlistCount(e.detail.count);
      }
    };
    window.addEventListener("wishlist:updated", handler);
    return () => window.removeEventListener("wishlist:updated", handler);
  }, []);

  /* ---------- Logout ---------- */
  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await apiLogout();
    doLogout();
    setLiveWishlistCount(0);
    setLiveCartCount(0);
    showToast("You have been logged out.", "success");
    navigate("/");
  };

  /* ---------- Menu helpers ---------- */
  const isActiveMenu = (url) => {
    if (!url) return false;
    const clean = url.replace(/^https?:\/\/[^/]+/i, "");
    if (clean === "/" || clean === "") return location.pathname === "/";
    return location.pathname.startsWith(clean);
  };

  const normaliseUrl = (url) => {
    if (!url) return "/";
    if (/^https?:\/\//i.test(url)) return url;
    return url.replace(/([^:]\/)\/+/g, "$1");
  };

  const renderMenuLink = (menu) => {
    const rawUrl = menu.url || "/";
    const url = normaliseUrl(rawUrl);
    const isExternal = /^https?:\/\//i.test(url);
    const active = !isExternal && isActiveMenu(url);

    if (isExternal) {
      return (
        <a
          className={`nav-link ${active ? "active" : ""}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {menu.menu_name}
        </a>
      );
    }
    return (
      <Link className={`nav-link ${active ? "active" : ""}`} to={url}>
        {menu.menu_name}
      </Link>
    );
  };

  const fallbackMenus = [
    { id: "home", menu_name: "Home", url: "/" },
    { id: "category", menu_name: "Products", url: "/category" },
    { id: "blog", menu_name: "Blog", url: "/blog" },
    { id: "faq", menu_name: "FAQ", url: "/faq" },
    { id: "contact", menu_name: "Contact", url: "/contact" },
  ];
  const menusToRender = headerMenus.length > 0 ? headerMenus : fallbackMenus;

  /* ---------- Sticky navbar ---------- */
  useEffect(() => {
    const navbar = document.getElementById("mainNav");
    if (!navbar) return;
    const onScroll = () => {
      if (window.pageYOffset > 50) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* -------------------------------------------------------------- */
  /*  Search box hook                                               */
  /* -------------------------------------------------------------- */
  const useSearchBox = (inputId, resultsId) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [resultsHtml, setResultsHtml] = useState("");
    const [timeoutId, setTimeoutId] = useState(null);

    // Refs
    const resultsRef = useRef(null);   // outer popup
    const scrollRef = useRef(null);    // scrollable content area

    // Custom scrollbar state
    const [scrollState, setScrollState] = useState({
      visible: false,
      thumbTop: 0,
      thumbHeight: 0,
      trackHeight: 0,
    });

    /* ---------- measure content + update thumb ---------- */
    const updateScrollbar = () => {
      const el = scrollRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const hasOverflow = scrollHeight > clientHeight + 1;
      if (!hasOverflow) {
        setScrollState({
          visible: false,
          thumbTop: 0,
          thumbHeight: 0,
          trackHeight: 0,
        });
        return;
      }
      const trackHeight = clientHeight;
      const thumbHeight = Math.max(
        24,
        (clientHeight / scrollHeight) * trackHeight,
      );
      const maxThumbTop = trackHeight - thumbHeight;
      const thumbTop =
        (scrollTop / (scrollHeight - clientHeight)) * maxThumbTop;
      setScrollState({ visible: true, thumbTop, thumbHeight, trackHeight });
    };

    /* ---------- drag thumb to scroll ---------- */
    const dragRef = useRef({ active: false, startY: 0, startScrollTop: 0 });

    const onThumbPointerMove = (e) => {
      const el = scrollRef.current;
      if (!el || !dragRef.current.active) return;
      const { clientHeight, scrollHeight } = el;
      const trackHeight = clientHeight;
      const thumbHeight = Math.max(
        24,
        (clientHeight / scrollHeight) * trackHeight,
      );
      const maxThumbTop = trackHeight - thumbHeight;
      const deltaY = e.clientY - dragRef.current.startY;
      const scrollDelta =
        (deltaY / maxThumbTop) * (scrollHeight - clientHeight);
      el.scrollTop = dragRef.current.startScrollTop + scrollDelta;
      updateScrollbar();
    };

    const onThumbPointerUp = () => {
      dragRef.current.active = false;
      window.removeEventListener("pointermove", onThumbPointerMove);
      window.removeEventListener("pointerup", onThumbPointerUp);
    };

    const onThumbPointerDown = (e) => {
      e.preventDefault();
      const el = scrollRef.current;
      if (!el) return;
      dragRef.current = {
        active: true,
        startY: e.clientY,
        startScrollTop: el.scrollTop,
      };
      e.target.setPointerCapture?.(e.pointerId);
      window.addEventListener("pointermove", onThumbPointerMove);
      window.addEventListener("pointerup", onThumbPointerUp);
    };

    /* ---------- click track to jump ---------- */
    const onTrackPointerDown = (e) => {
      if (e.target.classList.contains("search-custom-thumb")) return;
      const el = scrollRef.current;
      if (!el) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const ratio = clickY / rect.height;
      el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
      updateScrollbar();
    };

    /* ---------- re-measure when results change ---------- */
    useEffect(() => {
      const id = requestAnimationFrame(updateScrollbar);
      return () => cancelAnimationFrame(id);
    }, [resultsHtml, open]);

    /* ---------- recalc on resize ---------- */
    useEffect(() => {
      const onResize = () => updateScrollbar();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);

    const doSearch = (q) => {
      if (q.length < 2) {
        setOpen(false);
        return;
      }
      setResultsHtml(
        `<div class="search-loading p-3 text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div><span class="ms-2 text-muted">Searching...</span></div>`,
      );
      setOpen(true);
      fetch(`${searchEndpoint}?q=${encodeURIComponent(q)}`, {
        headers: { Accept: "application/json" },
      })
        .then((r) => r.json())
        .then((response) => {
          const products =
            response && response.data && Array.isArray(response.data.products)
              ? response.data.products
              : Array.isArray(response.products)
                ? response.products
                : [];

          if (response.success && products.length > 0) {
            let html = "";
            products.forEach((product) => {
              const imageUrl = resolveImageUrl(product);
              const price =
                product.sale_price && product.sale_price > 0
                  ? product.sale_price
                  : product.price;
              const productUrl = `/product/${product.slug}`;

              let variantDisplay = "";
              if (product.is_variant) {
                const features = Array.isArray(product.variant_features)
                  ? product.variant_features
                  : [];
                const rows = [];
                features.forEach((f) => {
                  const name = String(f.feature || "").trim();
                  const value = String(f.value || "").trim();
                  if (!value) return;
                  const isHex = /^#[a-fA-F0-9]{6}$/i.test(value);
                  if (isHex) {
                    rows.push(`
                      <span class="variant-feature">
                        <span class="color-circle" style="background-color:${value};"></span>
                        ${name ? `<span class="feature-label">${name}</span>` : ""}
                      </span>
                    `);
                  } else {
                    rows.push(`
                      <span class="variant-feature">
                        ${name ? `<span class="feature-label">${name}:</span>` : ""}
                        <span class="feature-value">${value}</span>
                      </span>
                    `);
                  }
                });
                if (rows.length > 0) {
                  variantDisplay = `<div class="variant-info">${rows.join("")}</div>`;
                }
              }

              html += `
                <a href="${productUrl}" class="search-result-item">
                  <img src="${imageUrl}" alt="${product.name}" class="product-image">
                  <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    ${variantDisplay}
                    <div class="product-price">₹${parseFloat(price).toFixed(2)}</div>
                    ${
                      product.stock !== undefined && product.stock > 0
                        ? `<div class="product-stock in-stock">In Stock</div>`
                        : `<div class="product-stock out-stock">Out of Stock</div>`
                    }
                  </div>
                </a>`;
            });
            setResultsHtml(html);
          } else {
            setResultsHtml(`
              <div class="search-no-results">
                <i class="bi bi-search"></i>
                <p>No products found for "<strong>${q}</strong>"</p>
                <small class="text-muted">Try different keywords</small>
              </div>`);
          }
          setOpen(true);
        })
        .catch(() => {
          setResultsHtml(
            `<div class="search-no-results"><i class="bi bi-exclamation-triangle"></i><p>Something went wrong. Please try again.</p></div>`,
          );
          setOpen(true);
        });
    };

    const onInputChange = (e) => {
      const raw = e.target.value;
      const q = raw.trim();
      setQuery(raw);
      if (timeoutId) clearTimeout(timeoutId);
      if (q.length === 0) {
        setOpen(false);
        setResultsHtml("");
        return;
      }
      if (q.length < 2) {
        setOpen(false);
        return;
      }
      const id = setTimeout(() => doSearch(q), 300);
      setTimeoutId(id);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setQuery("");
        setResultsHtml("");
        setOpen(false);
        e.target.blur();
      }
      if (e.key === "Enter") {
        const q = e.target.value.trim();
        if (q.length >= 2) {
          window.location.href = `${searchPageUrl}?q=${encodeURIComponent(q)}`;
        }
      }
    };

    return {
      query,
      open,
      resultsHtml,
      onInputChange,
      onKeyDown,
      setOpen,
      resultsRef,
      scrollRef,
      scrollState,
      updateScrollbar,
      onThumbPointerDown,
      onTrackPointerDown,
    };
  };

  const desktopSearch = useSearchBox("searchInput", "searchResults");

  /* NOTE: body-scroll lock intentionally removed — it blocked trackpad
     scrolling inside the popup on macOS/Safari. */

  const AvatarIcon = () =>
    avatarUrl ? (
      <img
        src={avatarUrl}
        alt={userName}
        className="rounded-circle"
        style={{ width: 32, height: 32, objectFit: "cover" }}
      />
    ) : (
      <i className="bi bi-person-circle fs-5"></i>
    );

  return (
    <header className="custom-main-header" id="mainNav">
      <div className="custom-header-inner">
        {/* LEFT: Logo + Nav */}
        <div className="custom-header-left">
          <Link className="custom-brand" to="/">
            <i className="bi bi-shop"></i> BSSShop
          </Link>
          <ul className="custom-nav-menu">
            {menusToRender.map((menu) => (
              <li className="nav-item" key={menu.id}>
                {renderMenuLink(menu)}
              </li>
            ))}
          </ul>
        </div>

        {/* MIDDLE: Search */}
        <div className="custom-header-search">
          <div className="search-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              id="searchInput"
              placeholder="Search products..."
              autoComplete="off"
              value={desktopSearch.query}
              onChange={desktopSearch.onInputChange}
              onKeyDown={desktopSearch.onKeyDown}
              onFocus={() => {
                if (desktopSearch.query.trim().length >= 2)
                  desktopSearch.setOpen(true);
              }}
            />

            <div
              className={`search-results ${desktopSearch.open ? "active" : ""}`}
              id="searchResults"
              ref={desktopSearch.resultsRef}
            >
              <button
                type="button"
                className="search-results-close"
                aria-label="Close search results"
                onClick={() => desktopSearch.setOpen(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>

              {/* Scrollable content — ref + onScroll attached */}
              <div
                className="search-results-scroll"
                ref={desktopSearch.scrollRef}
                onScroll={desktopSearch.updateScrollbar}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: desktopSearch.resultsHtml,
                  }}
                />
              </div>

              {/* Custom always-visible scrollbar */}
              {desktopSearch.scrollState.visible && (
                <div
                  className="search-custom-scrollbar"
                  onPointerDown={desktopSearch.onTrackPointerDown}
                >
                  <div
                    className="search-custom-thumb"
                    onPointerDown={desktopSearch.onThumbPointerDown}
                    style={{
                      height: `${desktopSearch.scrollState.thumbHeight}px`,
                      transform: `translateY(${desktopSearch.scrollState.thumbTop}px)`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Icons */}
        <div className="custom-header-right">
          <ul className="custom-nav-icons">
            {isAdmin && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin/dashboard">
                  <i className="bi bi-speedometer2"></i>
                  <span className="admin-badge">Admin</span>
                </Link>
              </li>
            )}

            {loggedIn ? (
              <li className="nav-item dropdown user-dropdown">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={(e) => e.preventDefault()}
                >
                  <AvatarIcon />
                  <span className="ms-1">{userName}</span>
                </a>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="userDropdown"
                >
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person"></i> My Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/orders">
                      <i className="bi bi-box"></i> My Orders
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/wishlist">
                      <i className="bi bi-heart"></i> Wishlist
                    </Link>
                  </li>
                  {isAdmin && (
                    <li>
                      <Link className="dropdown-item" to="/admin/dashboard">
                        <i className="bi bi-speedometer2"></i> Admin Panel
                      </Link>
                    </li>
                  )}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <a
                      className="dropdown-item text-danger"
                      href="#"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right"></i> Logout
                    </a>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/auth/login" title="Login">
                    <i className="bi bi-person"></i>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/auth/register"
                    title="Register"
                  >
                    <i className="bi bi-person-plus"></i>
                  </Link>
                </li>
              </>
            )}

            <li className="nav-item">
              <Link
                className="nav-link nav-icon-link position-relative"
                to="/cart"
              >
                <i className="bi bi-cart fs-5"></i>
                <span className="badge bg-danger rounded-pill cart-count">
                  {liveCartCount}
                </span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link nav-icon-link position-relative"
                to="/wishlist"
              >
                <i className="bi bi-heart fs-5"></i>
                <span className="badge bg-danger rounded-pill wishlist-count">
                  {liveWishlistCount}
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;