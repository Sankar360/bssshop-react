// src/pages/front/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toggleWishlist, checkWishlistStatus } from "../../utils/wishlist";
import { useAuth } from "../../contexts/AuthContext";
import { showToast } from "../../utils/toast";
import { addToCart } from "../../utils/cart";
import "../../css/home-responsive.css";
import { useWishlist } from "../../contexts/WishlistContext";
import API_URL from "../../api/config";


const API_BASE = API_URL;

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

/* ------------------------------------------------------------------ */
/*  Image URL resolver                                                 */
/* ------------------------------------------------------------------ */
const imageUrl = (input) => {
  if (input && typeof input === "object") {
    if (input.image_url) {
      // If backend gave a full URL, keep it. Otherwise prefix it.
      const u = input.image_url;
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
      return `${API_ORIGIN}/${u}`;
    }
    if (input.image) return imageUrl(input.image);
  }

  const path = input;
  if (!path) return "/assets/images/default-product.jpg";
  if (/^https?:\/\//i.test(path)) return path;

  // 👇 THE FIX: prefix the backend origin instead of returning a relative path
  if (path.startsWith("/")) return `${API_ORIGIN}${path}`;
  if (/^storage\//i.test(path)) return `${API_ORIGIN}/${path}`;
  if (/^(uploads|assets)\//i.test(path)) return `${API_ORIGIN}/${path}`;

  return `${API_ORIGIN}/storage/${path.replace(/^\/+/, "")}`;
};

const calcDiscount = (product) => {
  if (!product) return 0;

  const price = Number(product.price ?? 0);
  const salePrice = Number(product.sale_price ?? 0);

  if (salePrice > 0 && price > 0 && salePrice < price) {
    return Math.round((1 - salePrice / price) * 100);
  }

  return 0;
};

const RatingStars = ({ rating = 0, size = "0.8rem" }) => {
  const r = parseFloat(rating) || 0;
  if (r <= 0) {
    return (
      <span className="text-muted" style={{ fontSize: size }}>
        No ratings
      </span>
    );
  }
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <>
      {Array.from({ length: full }).map((_, i) => (
        <i
          key={`f${i}`}
          className="bi bi-star-fill"
          style={{ fontSize: size }}
        ></i>
      ))}
      {half && <i className="bi bi-star-half" style={{ fontSize: size }}></i>}
      {Array.from({ length: empty }).map((_, i) => (
        <i key={`e${i}`} className="bi bi-star" style={{ fontSize: size }}></i>
      ))}
      <span className="text-muted ms-1" style={{ fontSize: size }}>
        ({r.toFixed(1)})
      </span>
    </>
  );
};

const AddToCartButton = ({
  product,
  variantId = 0,
  className = "btn-add-cart",
}) => {
  const [busy, setBusy] = useState(false);
  // ⛔ removed: const { loggedIn } = useAuth();

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (busy) return;
    setBusy(true);

    try {
      const res = await addToCart(
        product.product_id ?? product.id,
        1,
        variantId,
      );

      if (res.unauthenticated) {
        showToast("Please log in to add items to your cart.", "info");
        return;
      }
      if (res.success) {
        showToast("✓ Added to cart!", "success");
        window.dispatchEvent(
          new CustomEvent("cart:updated", { detail: { count: res.count } }),
        );
      } else {
        showToast(res.message || "Failed to add to cart.", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={busy}
    >
      {busy ? (
        <>
          <span className="spinner-border spinner-border-sm me-1" /> Adding…
        </>
      ) : (
        <>
          <i className="bi bi-cart-plus"></i> Add to Cart
        </>
      )}
    </button>
  );
};
const WishlistButton = ({ productId, variantId = 0 }) => {
  const { loggedIn } = useAuth();
  const { isWishlisted, toggle } = useWishlist();   // ← use toggle, not setLocal
  const [busy, setBusy] = useState(false);

  const active = isWishlisted(productId, variantId);

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
      // toggle() handles the API call + state update + event dispatch
      const res = await toggle({ product_id: productId, variant_id: variantId });
      const added = res?.action === "added";
      showToast(
        added ? "❤️ Added to wishlist!" : "Removed from wishlist",
        added ? "success" : "info",
      );
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn-wishlist position-absolute top-0 end-0 m-2 wishlist-btn ${
        active ? "active" : ""
      }`}
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
/*  Fallback data                                                      */
/* ------------------------------------------------------------------ */
const FALLBACK_CATEGORIES = [
  { name: "Electronics", icon: "bi-laptop", link: "electronics" },
  { name: "Fashion", icon: "bi-bag", link: "fashion" },
  { name: "Furniture", icon: "bi-house", link: "furniture" },
  { name: "Beauty", icon: "bi-flower1", link: "beauty" },
  { name: "Sports", icon: "bi-bicycle", link: "sports" },
  { name: "Appliances", icon: "bi-microwave", link: "appliances" },
];

/* ================================================================== */
/*  HOME                                                               */
/* ================================================================== */
const Home = () => {
  const [categories, setCategories] = useState([]);
  const [banner, setBanner] = useState(null);
  const [homeProducts, setHomeProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/home`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();

        if (data.success || data.data) {
          const payload = data.data || data;
          setCategories(payload.categories ?? []);
          setBanner(payload.banner ?? null);
          setHomeProducts(
            payload.home_products ?? payload.showcase_products ?? [],
          );
          setFeaturedProducts(payload.featured_products ?? []);
          setRandomProducts(payload.random_products ?? []);
        }
      } catch (err) {
        console.error("Home fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categoriesToRender =
    categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const featuredTripled = useMemo(() => {
    if (!featuredProducts.length) return [];
    const limited = featuredProducts.slice(0, 10);
    return [...limited, ...limited, ...limited];
  }, [featuredProducts]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <PremiumHero
        categories={categoriesToRender}
        banner={banner}
        homeProducts={homeProducts}
      />
      <FeaturedProducts products={featuredTripled} />
      <RandomProducts products={randomProducts} />
    </>
  );
};

/* ================================================================== */
/*  PREMIUM HERO                                                       */
/* ================================================================== */
const PremiumHero = ({ categories, banner, homeProducts }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [adding, setAdding] = useState(false); // ← new

  const slideIntervalRef = useRef(null);
  const isTransitioningRef = useRef(false);

  const totalSlides = homeProducts.length > 0 ? homeProducts.length : 4;

  const goToSlide = (index) => {
    if (isTransitioningRef.current || index === currentSlide) return;
    isTransitioningRef.current = true;
    setTimeout(() => {
      setCurrentSlide(index);
      isTransitioningRef.current = false;
    }, 500);
  };

  const nextSlide = () => {
    setCurrentSlide((s) => (s + 1) % totalSlides);
  };

  useEffect(() => {
    if (totalSlides <= 1) return;
    slideIntervalRef.current = setInterval(nextSlide, 4000);
    return () => clearInterval(slideIntervalRef.current);
    // eslint-disable-next-line
  }, [totalSlides]);

  const stopSlideshow = () => {
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
      slideIntervalRef.current = null;
    }
  };

  const startSlideshow = () => {
    stopSlideshow();
    if (totalSlides > 1) {
      slideIntervalRef.current = setInterval(nextSlide, 4000);
    }
  };

  const handleAddToCart = async () => {
    if (!currentProduct) return;
    setAdding(true);
    try {
      const res = await addToCart(
        currentProduct.product_id ?? currentProduct.id,
        1,
        currentProduct.variant_id ?? 0,
      );

      if (res.unauthenticated) {
        showToast("Please log in to add items to your cart.", "info");
        return;
      }
      if (res.success) {
        showToast("✓ Added to cart!", "success");
        window.dispatchEvent(
          new CustomEvent("cart:updated", { detail: { count: res.count } }),
        );
      } else {
        showToast(res.message || "Failed to add to cart.", "error");
      }
    } finally {
      setAdding(false);
    }
  };

  const firstProduct = homeProducts[0] || null;
  const currentProduct = homeProducts[currentSlide] || firstProduct;

  const displayPrice = currentProduct
    ? Number(currentProduct.sale_price) > 0 &&
      Number(currentProduct.sale_price) < Number(currentProduct.price)
      ? Number(currentProduct.sale_price)
      : Number(currentProduct.price)
    : 1299;

  const rating = currentProduct?.rating ?? 0;
  const discount = currentProduct ? calcDiscount(currentProduct) : 0;

  const heroTitleLine1 = banner?.title_line1 ?? "Shop with";
  const heroTitleLine2 = banner?.title_line2 ?? "Style & Elegance";
  const heroBadge = banner?.badge_text ?? "Premium Collection";
  const heroSubtitle =
    banner?.subtitle ?? "Discover our curated collection of premium products";
  const heroButtonText = banner?.button_text ?? "Explore All Products";
  const heroButtonIcon = banner?.button_icon ?? "bi-arrow-right";

  return (
    <section className="premium-hero" id="premiumHero">
      <div className="premium-hero-container">
        {/* ===== COLUMN 1: CATEGORIES ===== */}
        <div className="premium-hero-categories">
          <div className="categories-header">
            <span className="categories-title">
              <i className="bi bi-grid"></i> Categories
            </span>
          </div>
          <div className="categories-list">
            {categories.map((cat, i) => {
              let link = cat.link;
              if (!link) {
                const slug =
                  cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-");
                link = `/category/${slug}`;
              }
              link = link.replace(/([^:]\/)\/+/g, "$1");

              return (
                <Link
                  key={cat.id ?? `${cat.name}-${i}`}
                  to={link}
                  className="category-item"
                >
                  <div className="category-item-icon">
                    <i className={`bi ${cat.icon || "bi-box"}`}></i>
                  </div>
                  <div className="category-item-info">
                    <span className="category-item-name">{cat.name}</span>
                  </div>
                  <div className="category-item-arrow">
                    <i className="bi bi-chevron-right"></i>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ===== COLUMN 2: HERO CONTENT ===== */}
        <div className="premium-hero-content">
          {heroBadge && <div className="premium-badge">{heroBadge}</div>}

          <h1 className="premium-title">
            <span className="title-line">{heroTitleLine1}</span>
            <span className="title-line">{heroTitleLine2}</span>
          </h1>

          {heroSubtitle && <p className="premium-subtitle">{heroSubtitle}</p>}

          <div className="premium-shop-action">
            <Link to="/category" className="premium-shop-btn">
              <span>{heroButtonText}</span>
              <i className={`bi ${heroButtonIcon}`}></i>
            </Link>
          </div>
        </div>

        {/* ===== COLUMN 3: PRODUCT SHOWCASE ===== */}
        <div
          className="premium-showcase"
          onMouseEnter={stopSlideshow}
          onMouseLeave={startSlideshow}
        >
          <div className="product-slider">
            <div className="product-slides">
              {homeProducts.length > 0
                ? homeProducts.map((product, index) => (
                    <div
                      key={product.id ?? index}
                      className={`product-slide ${
                        index === currentSlide ? "active" : ""
                      }`}
                      data-angle={index}
                      data-product-id={product.id}
                      data-product-name={product.name}
                      data-product-price={product.price}
                      data-product-sale-price={product.sale_price ?? 0}
                      data-product-rating={product.rating ?? 0}
                      data-product-discount={product.discount ?? 0}
                    >
                      <img
                        src={imageUrl(product)}
                        alt={product.name}
                        className="product-image showcase-product-image"
                        loading="lazy"
                        width="400"
                        height="400"
                      />
                      <div className="product-overlay">
                        <span className="product-name">{product.name}</span>
                        <span className="product-price">
                          {Number(product.sale_price) > 0 ? (
                            <>
                              <span className="text-danger fw-bold">
                                ₹{Number(product.sale_price).toFixed(2)}
                              </span>
                              <small className="text-muted text-decoration-line-through ms-1">
                                ₹{Number(product.price).toFixed(2)}
                              </small>
                            </>
                          ) : (
                            <>₹{Number(product.price).toFixed(2)}</>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                : Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`product-slide ${i === 0 ? "active" : ""}`}
                      data-angle={i}
                    >
                      <img
                        src="/assets/images/product-placeholder.jpg"
                        alt="Product"
                        className="product-image showcase-product-image"
                        loading="lazy"
                        width="400"
                        height="400"
                      />
                    </div>
                  ))}
            </div>

            {/* Floating UI Elements */}
            <button
              type="button"
              className="float-element float-cart"
              onClick={handleAddToCart}
              disabled={adding || !currentProduct}
              aria-label="Add current product to cart"
            >
              <i
                className={`bi ${adding ? "bi-hourglass-split" : "bi-cart"}`}
              ></i>
              <span>{adding ? "Adding…" : "Add to Cart"}</span>
            </button>

            <div className="float-element float-price">
              <span className="price-display">
                ₹{Number(displayPrice).toFixed(2)}
              </span>
            </div>

            <div className="float-element float-rating" id="floatingRating">
              <RatingStars rating={rating} size="0.7rem" />
            </div>

            <div className="float-element float-delivery">
              <i className="bi bi-truck"></i>
              <span>Free</span>
            </div>

            {discount > 0 && (
              <div className="float-element float-discount">
                <span>-{discount}%</span>
              </div>
            )}
          </div>

          <div className="slide-indicators">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`indicator ${i === currentSlide ? "active" : ""}`}
                data-index={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => {
                  stopSlideshow();
                  goToSlide(i);
                  setTimeout(startSlideshow, 3000);
                }}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ================================================================== */
/*  FEATURED PRODUCTS — CAROUSEL (< 750px) / AUTO-SCROLL ROW (≥ 750px) */
/* ================================================================== */
const FeaturedProducts = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewportRef = useRef(null);
  const total = products.length;

  /* Is the viewport in "row mode"? (≥ 750px) */
  const isRowMode = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 750px)").matches;
  };

  /* Get the width of a single slide (for scroll math) */
  const getSlideWidth = () => {
    const vp = viewportRef.current;
    if (!vp) return 0;
    const first = vp.querySelector(".featured-carousel-slide");
    if (!first) return 0;
    const track = vp.querySelector(".featured-carousel-track");
    const gap = track ? parseInt(getComputedStyle(track).gap) || 0 : 0;
    return first.offsetWidth + gap;
  };

  /* Move viewport to a specific index — different per mode */
  const goToIndex = (i) => {
    const vp = viewportRef.current;
    if (!vp) return;

    if (isRowMode()) {
      // In row mode, scroll the container horizontally
      const slideW = getSlideWidth();
      if (slideW > 0) {
        vp.scrollTo({ left: i * slideW, behavior: "smooth" });
      }
    } else {
      // In carousel mode, just change the index (translateX drives it)
      setCurrentIndex(i);
    }
  };

  /* Clamp index inside bounds */
  const clamp = (i) => {
    if (total <= 0) return 0;
    if (i < 0) return total - 1;
    if (i >= total) return 0;
    return i;
  };

  /* Autoplay — every 3.5s */
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      if (isRowMode()) {
        // Row mode: scroll the viewport
        const vp = viewportRef.current;
        if (!vp) return;
        const slideW = getSlideWidth();
        const maxScroll = vp.scrollWidth - vp.clientWidth;
        const next = vp.scrollLeft + slideW;
        if (next > maxScroll + 5) {
          // wrap back to start
          vp.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          vp.scrollTo({ left: next, behavior: "smooth" });
        }
      } else {
        // Carousel mode: bump the index
        setCurrentIndex((i) => (i + 1) % total);
      }
    }, 3500);
    return () => clearInterval(id);
  }, [total]);

  /* Arrow handlers */
  const prev = () => {
    if (isRowMode()) {
      const vp = viewportRef.current;
      if (!vp) return;
      const slideW = getSlideWidth();
      const minScroll = 0;
      const next = vp.scrollLeft - slideW;
      if (next < minScroll - 5) {
        // wrap to end
        vp.scrollTo({
          left: vp.scrollWidth - vp.clientWidth,
          behavior: "smooth",
        });
      } else {
        vp.scrollTo({ left: next, behavior: "smooth" });
      }
    } else {
      setCurrentIndex((i) => clamp(i - 1));
    }
  };

  const next = () => {
    if (isRowMode()) {
      const vp = viewportRef.current;
      if (!vp) return;
      const slideW = getSlideWidth();
      const maxScroll = vp.scrollWidth - vp.clientWidth;
      const nextScroll = vp.scrollLeft + slideW;
      if (nextScroll > maxScroll + 5) {
        vp.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        vp.scrollTo({ left: nextScroll, behavior: "smooth" });
      }
    } else {
      setCurrentIndex((i) => clamp(i + 1));
    }
  };

  return (
    <section
      id="featured-products"
      className="py-5 bg-light home-products-scope"
    >
      <div className="container featured-container">
        <div className="d-flex justify-content-between align-items-center mb-4 px-3">
          <h2 className="mb-0">
            <i className="bi bi-star-fill text-warning"></i> Featured Products
          </h2>
          <Link to="/category" className="text-decoration-none ms-2">
            View All <i className="bi bi-arrow-right"></i>
          </Link>
        </div>

        {total === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No featured products available.</p>
          </div>
        ) : (
          <div className="featured-carousel">
            {total > 1 && (
              <button
                type="button"
                className="featured-carousel-arrow featured-carousel-arrow-prev"
                onClick={prev}
                aria-label="Previous product"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            )}

            <div
              className="featured-carousel-viewport"
              ref={viewportRef}
            >
              <div
                className="featured-carousel-track"
                style={{
                  transform: isRowMode()
                    ? "none"
                    : `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {products.map((product, idx) => (
                  <div
                    className="featured-carousel-slide"
                    key={`${product.id}-${idx}`}
                  >
                    <FeaturedCard product={product} />
                  </div>
                ))}
              </div>
            </div>

            {total > 1 && (
              <button
                type="button"
                className="featured-carousel-arrow featured-carousel-arrow-next"
                onClick={next}
                aria-label="Next product"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Featured product card                                              */
/* ------------------------------------------------------------------ */
const FeaturedCard = ({ product }) => {
  const productId = product.id ?? 0;
  const variantId = product.variant_id ?? 0;
  const productSlug = product.slug ?? "";
  const discount = calcDiscount(product);

  return (
    <div className="featured-scroll-item">
      <div className="card product-card h-100 clickable-card">
        <Link to={`/product/${productSlug}`} className="card-link-wrapper">
          <div className="position-relative">
            <img
              src={imageUrl(product)}
              className="card-img-top featured-product-image"
              alt={product.name}
              loading="lazy"
              width="280"
              height="280"
            />

            {(product.is_new || product.is_hot) && (
              <div className="badge-stack">
                <span
                  className={`badge-tag badge-${
                    product.is_new ? "new" : "hot"
                  }`}
                >
                  {product.is_new ? "New" : "Hot"}
                </span>
              </div>
            )}

            <WishlistButton productId={productId} variantId={variantId} />

            {discount > 0 && (
              <div className="discount-badge-bottom-left">
                <span className="badge bg-danger">
                  <i className="bi bi-tag-fill"></i> -{discount}%
                </span>
              </div>
            )}
          </div>
          <div className="card-body">
            <span className="card-eyebrow">{product.brand ?? ""}</span>
            <h6 className="card-title">{product.name}</h6>

            <div className="product-rating mb-2">
              <RatingStars rating={product.rating ?? 0} size="0.7rem" />
            </div>

            <p className="card-text fw-bold text-primary">
              {Number(product.sale_price) > 0 ? (
                <>
                  <span className="text-primary">
                    ₹{Number(product.sale_price).toFixed(2)}
                  </span>
                  <small className="text-muted text-decoration-line-through ms-1">
                    ₹{Number(product.price).toFixed(2)}
                  </small>
                </>
              ) : (
                <>₹{Number(product.price ?? 0).toFixed(2)}</>
              )}
            </p>

            <div className="card-actions">
              <AddToCartButton product={product} variantId={variantId} />

              <span className="btn-add-cart view-btn">
                <i className="bi bi-eye"></i> View
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  RANDOM PRODUCTS                                                    */
/* ================================================================== */
const RandomProducts = ({ products }) => {
  return (
    <section id="random-products" className="py-5 home-products-scope">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="bi bi-shuffle text-primary"></i> You Might Also Like
          </h2>
          <span className="text-muted">{products.length} products</span>
        </div>

        <div className="row home-normal-grid">
          {products.length > 0 ? (
            products.map((product, i) => (
              <RandomCard
                key={`${product.product_id ?? product.id}-${i}`}
                product={product}
              />
            ))
          ) : (
            <div className="col-12 text-center py-5">
              <i
                className="bi bi-box-seam"
                style={{ fontSize: "4rem", color: "#dee2e6" }}
              ></i>
              <p className="text-muted mt-3">No products available.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Random product card                                                */
/* ------------------------------------------------------------------ */
const RandomCard = ({ product }) => {
  const productId = product.product_id ?? product.id ?? 0;
  const variantId = product.variant_id ?? 0;
  const productSlug = product.slug ?? "";
  const discount = calcDiscount(product);
  const inStock = !!(product.stock && product.stock > 0);

  return (
    <div className="col-md-3 col-sm-6 mb-4">
      <div className="card product-card h-100 clickable-card">
        <Link to={`/product/${productSlug}`} className="card-link-wrapper">
          <div className="position-relative">
            <img
              src={imageUrl(product)}
              className="card-img-top product-image-static"
              alt={product.name}
              loading="lazy"
              width="300"
              height="200"
            />

            {(product.is_new || product.is_hot) && (
              <div className="badge-stack">
                <span
                  className={`badge-tag badge-${
                    product.is_new ? "new" : "hot"
                  }`}
                >
                  {product.is_new ? "New" : "Hot"}
                </span>
              </div>
            )}

            <WishlistButton productId={productId} variantId={variantId} />

            {discount > 0 && (
              <div className="discount-badge-bottom-left">
                <span className="badge bg-danger">
                  <i className="bi bi-tag-fill"></i> -{discount}%
                </span>
              </div>
            )}
          </div>

          <div className="card-body">
            <span className="card-eyebrow">{product.brand ?? ""}</span>
            <h5 className="card-title">{product.name}</h5>
            <p className="card-text text-muted">
              {String(product.description ?? "").substring(0, 50)}
              {String(product.description ?? "").length > 50 ? "..." : ""}
            </p>

            <div className="product-rating mb-2">
              <RatingStars rating={product.rating ?? 0} size="0.8rem" />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <p className="card-text fw-bold text-primary mb-0">
                {Number(product.sale_price > 0) ? (
                  <>₹{Number(product.sale_price).toFixed(2)}</>
                ) : (
                  <>₹{Number(product.price ?? 0).toFixed(2)}</>
                )}
              </p>
              {product.sale_price > 0 && (
                <span className="text-muted text-decoration-line-through small">
                  ₹{Number(product.price).toFixed(2)}
                </span>
              )}
            </div>

            {inStock ? (
              <span className="stock-badge in-stock">
                <i className="bi bi-check-circle-fill"></i> In Stock
              </span>
            ) : (
              <span className="stock-badge out-stock">
                <i className="bi bi-x-circle-fill"></i> Out of Stock
              </span>
            )}

            <div className="card-actions random-card-actions">
              <AddToCartButton
                product={{ ...product, id: productId }}
                variantId={variantId}
              />
              <span className="btn-add-cart view-btn">
                <i className="bi bi-eye"></i> View
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Home;
