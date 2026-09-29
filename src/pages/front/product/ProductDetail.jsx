// src/pages/front/product/ProductDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API_URL from "../../../api/config";
import { showToast } from '../../../utils/toast';
import { getToken } from '../../../utils/auth';

const API_BASE = API_URL;

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");


const imageUrl = (path) => {
    if (!path) return '/assets/images/default-product.jpg';
    if (/^https?:\/\//i.test(path)) return path;

    // 👇 Prefix the backend origin instead of returning relative paths
    if (path.startsWith('/')) return `${API_ORIGIN}${path}`;
    if (/^storage\//i.test(path)) return `${API_ORIGIN}/${path}`;
    if (/^assets\//i.test(path)) return `${API_ORIGIN}/${path}`;

    return `${API_ORIGIN}/storage/${path.replace(/^\/+/, '')}`;
};

/* Detect if a string is a hex color or CSS color name */
const isColorValue = (text) => {
    const t = String(text || '').trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(t)) return true;
    if (/^#[0-9A-Fa-f]{3}$/.test(t)) return true;
    if (/^rgb\(/.test(t)) return true;
    if (/^(red|blue|green|black|white|yellow|orange|purple|pink|brown|gray|grey|cyan|magenta|lime|navy|teal|olive|maroon|silver|aqua|fuchsia)$/i.test(t)) return true;
    return false;
};

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [category, setCategory] = useState(null);
    const [images, setImages] = useState([]);
    const [variants, setVariants] = useState([]);
    const [featureMap, setFeatureMap] = useState({});
    const [features, setFeatures] = useState([]);
    const [specifications, setSpecifications] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedVariantImages, setSelectedVariantImages] = useState([]);
    const [selectedFeatures, setSelectedFeatures] = useState({});
    const [mainImage, setMainImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    /* Wishlist state — same idea as CategoryOverview */
    const [wishlistKeys, setWishlistKeys] = useState([]); // ["productId-variantId", ...]
    const [wishlistProcessing, setWishlistProcessing] = useState(false);

    /* ---------------------------------------------------------- */
    /*  Fetch product                                              */
    /* ---------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/product/${slug}`, {
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const p = data.data;
                    setProduct(p.product);
                    setCategory(p.category);
                    setImages(p.images || []);
                    setVariants(p.variants || []);
                    setFeatureMap(p.feature_map || {});
                    setFeatures(p.features || []);
                    setSpecifications(p.specifications || []);
                    setRelatedProducts(p.related_products || []);
                    setSelectedVariant(p.selected_variant || null);
                    setSelectedVariantImages(p.selected_variant_images || []);

                    let main = p.product?.image || 'assets/images/default-product.jpg';
                    if (p.selected_variant_images?.length > 0) {
                        main = p.selected_variant_images[0].image;
                    } else if (p.images?.length > 0) {
                        const primary = p.images.find((i) => i.is_primary == 1);
                        main = (primary || p.images[0]).image;
                    }
                    setMainImage(main);

                    const initial = {};
                    Object.entries(p.feature_map || {}).forEach(([fid, f]) => {
                        if (f.selected_value) initial[fid] = String(f.selected_value);
                    });
                    setSelectedFeatures(initial);
                }
            } catch (err) {
                console.error('Product fetch failed', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    /* ---------------------------------------------------------- */
    /*  Display values                                             */
    /* ---------------------------------------------------------- */
    const display = useMemo(() => {
        const v = selectedVariant;
        const p = product || {};
        return {
            price:     v?.price      ?? p.price      ?? 0,
            salePrice: v?.sale_price ?? p.sale_price ?? 0,
            stock:     v?.stock      ?? p.stock      ?? 0,
            rating:    v?.rating     ?? p.rating     ?? 0,
            sku:       v?.sku        ?? p.sku        ?? '',
            variantId: v?.id         ?? 0,
        };
    }, [selectedVariant, product]);

    /* ---------------------------------------------------------- */
    /*  Feature change                                             */
    /* ---------------------------------------------------------- */
    const handleFeatureChange = (featureId, valueId) => {
        const updated = { ...selectedFeatures, [featureId]: String(valueId) };
        setSelectedFeatures(updated);

        const requiredIds = Object.keys(featureMap);
        const allSet = requiredIds.every(
            (fid) => updated[fid] !== undefined && updated[fid] !== ''
        );

        if (allSet) {
            findVariant(updated);
        }
    };

    /* ---------------------------------------------------------- */
    /*  Find variant                                               */
    /* ---------------------------------------------------------- */
    const findVariant = async (features) => {
        try {
            const res = await fetch(`${API_BASE}/product/find-variant`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ product_id: product?.id, features }),
            });
            const data = await res.json();
            const v = data?.data?.variant ?? data?.variant;

            if (data.success && v) {
                setSelectedVariant(v);

                if (v.images?.length) {
                    setSelectedVariantImages(v.images);
                    setMainImage(v.images[0].image);
                }

                if (v.values?.length) {
                    const next = { ...selectedFeatures };
                    v.values.forEach((val) => {
                        next[val.feature_id] = String(val.value);
                    });
                    setSelectedFeatures(next);
                }

                if (v.slug && v.slug !== slug) {
                    window.history.replaceState({}, '', `/product/${v.slug}`);
                }
            } else {
                showToast(data.message || 'Variant not found', 'warning');
            }
        } catch (err) {
            console.error('Variant search failed', err);
            showToast('Failed to load variant', 'error');
        }
    };

    /* ---------------------------------------------------------- */
    /*  Quantity                                                   */
    /* ---------------------------------------------------------- */
    const decrementQty = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };
    const incrementQty = () => {
        if (!display.stock) return;
        if (quantity < display.stock) setQuantity(quantity + 1);
    };

    /* ---------------------------------------------------------- */
    /*  Add to cart                                                */
    /* ---------------------------------------------------------- */
    const addToCart = async (buyNow = false) => {
        const token = getToken();

         if (variants.length > 0 && !display.variantId) {
            showToast('Please select all options first.', 'warning');
            return;
        }

        const payload = { product_id: product.id };
        const vid = Number(display.variantId) || 0;
        if (vid > 0) payload.variant_id = vid;

        try {
            const res = await fetch(`${API_BASE}/cart/add`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify({
                    ...payload,
                    quantity,
                }),
            });
            const data = await res.json();

            if (data.success) {
                showToast('✓ Added to cart!', 'success');
                if (data.cart_count !== undefined) {
                    document
                        .querySelectorAll('.cart-count, .cart-badge')
                        .forEach((el) => (el.textContent = data.cart_count));
                }
                if (buyNow) navigate('/checkout');
            } else {
                showToast(data.message || 'Failed to add to cart', 'error');
            }
        } catch {
            showToast('Error adding to cart', 'error');
        }
    };

    /* ============================================================ */
    /*  WISHLIST — mirrors CategoryOverview behaviour               */
    /*  Only sends variant_id when it is a REAL (>0) variant.       */
    /* ============================================================ */
    const wishlistKey = (productId, variantId = 0) =>
        `${productId}-${variantId || 0}`;

    const isInWishlist = (productId, variantId = 0) =>
        wishlistKeys.includes(wishlistKey(productId, variantId));

    /* Build payload exactly like CategoryOverview does */
    const buildWishlistPayload = (productId, variantId = 0) => {
        const payload = { product_id: Number(productId) };
        const vid = Number(variantId) || 0;
        if (vid > 0) payload.variant_id = vid;   // only attach when real
        return payload;
    };

    /* On mount: check status for main product + its current variant */
    useEffect(() => {
        if (!product?.id) return;
        const token = getToken();       
         if (!token) return;

        (async () => {
            try {
                const items = [{ product_id: product.id, variant_id: 0 }];
                if (selectedVariant?.id) {
                    items.push({
                        product_id: product.id,
                        variant_id: selectedVariant.id,
                    });
                }

                const res = await fetch(`${API_BASE}/wishlist/status`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ items }),
                });
                const data = await res.json();

                if (data.success) {
                    const list = data.data?.wishlist ?? data.wishlist ?? [];
                    setWishlistKeys(
                        list.map((it) =>
                            wishlistKey(it.product_id, it.variant_id ?? 0)
                        )
                    );
                }
            } catch (err) {
                console.error('Wishlist status check failed', err);
            }
        })();
    }, [product?.id, selectedVariant?.id]);

    /* Toggle wishlist — CategoryOverview-identical request */
    const toggleWishlist = async (productId, variantId = 0) => {
        const token = getToken();        if (!token) {
            showToast('Please login to use your wishlist', 'warning');
            navigate('/auth/login');
            return;
        }

        if (wishlistProcessing) return;
        setWishlistProcessing(true);

        const key = wishlistKey(productId, variantId);

        try {
            const res = await fetch(`${API_BASE}/wishlist/toggle`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(buildWishlistPayload(productId, variantId)),
            });
            const data = await res.json();

            if (data.success) {
                setWishlistKeys((prev) =>
                    data.action === 'added'
                        ? [...prev.filter((k) => k !== key), key]
                        : prev.filter((k) => k !== key)
                );

                // 🆕 Dispatch the event so WishlistContext picks it up
                window.dispatchEvent(
                    new CustomEvent('wishlist:updated', {
                    detail: { count: data.count ?? 0 },
                    })
                );

                showToast(
                    data.action === 'added'
                        ? '❤ Added to wishlist'
                        : 'Removed from wishlist',
                    'success'
                );
            } else {
                showToast(data.message || 'Failed to update wishlist', 'error');
            }
        } catch (err) {
            console.error('Wishlist toggle failed', err);
            showToast('Failed to update wishlist', 'error');
        } finally {
            setWishlistProcessing(false);
        }
    };

    /* ---------------------------------------------------------- */
    /*  Render                                                     */
    /* ---------------------------------------------------------- */
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!product) return null;

    const thumbnails =
        selectedVariantImages.length > 0 ? selectedVariantImages : images;
    const hasVariants = variants.length > 0;

    return (
        <div className="product-detail-page">
            <div className="container">
                <input type="hidden" id="productId" value={product.id} />
                <input type="hidden" id="currentVariantId" value={display.variantId} />

                {/* ===== BREADCRUMB ===== */}
                <nav className="product-breadcrumb" aria-label="Breadcrumb">
                    <ol className="breadcrumb-list">
                        <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                        {category && (
                            <li className="breadcrumb-item">
                                <Link to={`/category/${category.slug || category.name?.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {category.name}
                                </Link>
                            </li>
                        )}
                        <li className="breadcrumb-item active">{product.name}</li>
                    </ol>
                </nav>

                {/* ===== MAIN PRODUCT GRID ===== */}
                <div className="product-grid">
                    {/* LEFT: Gallery */}
                    <div className="product-gallery">
                        <div className="gallery-main" id="mainImageContainer">
                            <img
                                src={imageUrl(mainImage)}
                                alt={product.name}
                                className="gallery-main-image"
                                id="mainProductImage"
onError={(e) => { e.currentTarget.src = `${API_ORIGIN}/assets/images/default-product.jpg`; }}                            />
                        </div>
                        <div className="gallery-thumbnails" id="thumbnailContainer">
                            {thumbnails.length > 0 ? (
                                thumbnails.map((img, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`thumbnail-btn ${i === 0 ? 'active' : ''}`}
                                        onClick={() => setMainImage(img.image)}
                                    >
                                        <img
                                            src={imageUrl(img.image)}
                                            alt={`${product.name} thumbnail`}
                                            onError={(e) => { e.currentTarget.src = '/assets/images/default-product.jpg'; }}
                                        />
                                    </button>
                                ))
                            ) : (
                                <button className="thumbnail-btn active">
                                    <img src={imageUrl(product.image)} alt={`${product.name} thumbnail`} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* MIDDLE: Variants */}
                    <div className="product-variants" id="variantContainer">
                        {hasVariants ? (
                            <div className="variant-panel">
                                <h4 className="variant-panel-title">Features</h4>

                                {Object.entries(featureMap).map(([featureId, feature]) => {
                                    const isColor =
                                        feature.is_color === true ||
                                        String(feature.name || '').toLowerCase().trim() === 'color';

                                    const currentVal =
                                        selectedFeatures[featureId] ??
                                        feature.selected_value ??
                                        '';

                                    return (
                                        <div className="variant-group" data-feature-id={featureId} key={featureId}>
                                            <div className="variant-label">
                                                <span>{feature.name || 'Feature'}</span>
                                            </div>

                                            <div className="variant-dropdown-wrapper">
                                                {isColor ? (
                                                    <div className="color-options" data-feature-id={featureId}>
                                                        {(feature.values || []).map((valueId) => {
                                                            const valueText = feature.options_map?.[valueId] ?? valueId;
                                                            const isSelected = String(currentVal) === String(valueId);
                                                            const colorOk = isColorValue(valueText);

                                                            return (
                                                                <button
                                                                    key={valueId}
                                                                    type="button"
                                                                    className={`color-option ${isSelected ? 'active' : ''}`}
                                                                    style={{
                                                                        backgroundColor: colorOk ? valueText : '#ccc',
                                                                    }}
                                                                    title={valueText}
                                                                    aria-label={valueText}
                                                                    onClick={() => handleFeatureChange(featureId, valueId)}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <select
                                                        className="variant-select"
                                                        data-feature-id={featureId}
                                                        value={currentVal}
                                                        onChange={(e) => handleFeatureChange(featureId, e.target.value)}
                                                    >
                                                        {(feature.values || []).map((valueId) => (
                                                            <option key={valueId} value={valueId}>
                                                                {feature.options_map?.[valueId] ?? valueId}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="variant-empty"></div>
                        )}
                    </div>

                    {/* RIGHT: Purchase */}
                    <div className="product-purchase" id="purchasePanel">
                        <div className="purchase-card">
                            <h1 className="product-title" id="productTitle">
                                {product.name}
                                {selectedVariant?.values?.length > 0 && (
                                    <span className="variant-name">
                                        {selectedVariant.values.map((val) => {
                                            const feature = featureMap?.[val.feature_id];
                                            const isColor =
                                                feature?.is_color === true ||
                                                String(feature?.name || '').toLowerCase().trim() === 'color';
                                            const text = val.value_text ?? val.value;

                                            return (
                                                <React.Fragment key={val.feature_id}>
                                                    {' / '}
                                                    {isColor && isColorValue(text) ? (
                                                        <span
                                                            className="title-color-circle"
                                                            style={{ backgroundColor: text }}
                                                            title={text}
                                                        ></span>
                                                    ) : (
                                                        <span>{text}</span>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </span>
                                )}
                            </h1>

                            {/* ===== WISHLIST BUTTON (main product/variant) ===== */}
                            <button
                                type="button"
                                className={`pdp-wishlist-btn ${isInWishlist(product.id, display.variantId) ? 'active' : ''}`}
                                onClick={() => toggleWishlist(product.id, display.variantId)}
                                disabled={wishlistProcessing}
                                aria-label="Toggle wishlist"
                            >
                                <i
                                    className={`bi ${
                                        isInWishlist(product.id, display.variantId)
                                            ? 'bi-heart-fill'
                                            : 'bi-heart'
                                    }`}
                                ></i>
                                <span>
                                    {isInWishlist(product.id, display.variantId)
                                        ? 'In Wishlist'
                                        : 'Add to Wishlist'}
                                </span>
                            </button>

                            <div className="product-rating">
                                <div className="stars">
                                    {(() => {
                                        const r = parseFloat(display.rating) || 0;
                                        const full = Math.floor(r);
                                        const half = r - full >= 0.5;
                                        const empty = 5 - full - (half ? 1 : 0);
                                        return (
                                            <>
                                                {Array.from({ length: full }).map((_, i) => (
                                                    <i key={`f${i}`} className="bi bi-star-fill"></i>
                                                ))}
                                                {half && <i className="bi bi-star-half"></i>}
                                                {Array.from({ length: empty }).map((_, i) => (
                                                    <i key={`e${i}`} className="bi bi-star"></i>
                                                ))}
                                            </>
                                        );
                                    })()}
                                </div>
                                <span className="rating-value">{Number(display.rating).toFixed(1)}</span>
                            </div>

                            {/* ===== PRICE ===== */}
                            <div className="product-price" id="priceContainer">
                                {display.salePrice > 0 && Number(display.salePrice) < Number(display.price) ? (
                                    <>
                                        <span className="price-current" id="currentPrice">
                                            ₹{Number(display.salePrice).toFixed(2)}
                                        </span>
                                        <span className="price-original">
                                            ₹{Number(display.price).toFixed(2)}
                                        </span>
                                        <span className="discount-badge-small">
                                            {Math.round((1 - display.salePrice / display.price) * 100)}% OFF
                                        </span>
                                    </>
                                ) : (
                                    <span className="price-current" id="currentPrice">
                                        ₹{Number(display.price).toFixed(2)}
                                    </span>
                                )}
                            </div>

                            <div className="product-stock" id="stockContainer">
                                {display.stock > 0 ? (
                                    <>
                                        <span className="stock-status in-stock">
                                            <i className="bi bi-check-circle-fill"></i> In Stock
                                        </span>
                                        {display.stock <= 5 && (
                                            <span className="stock-low">Only {display.stock} left</span>
                                        )}
                                    </>
                                ) : (
                                    <span className="stock-status out-of-stock">
                                        <i className="bi bi-x-circle-fill"></i> Out of Stock
                                    </span>
                                )}
                            </div>

                            <div className="product-quantity">
                                <label htmlFor="quantityInput" className="quantity-label">Quantity</label>
                                <div className="quantity-selector">
                                    <button type="button" className="qty-btn qty-minus" id="qtyMinus"
                                        onClick={decrementQty} disabled={display.stock <= 0}>
                                        <i className="bi bi-dash"></i>
                                    </button>
                                    <input type="number" className="qty-input" id="quantityInput"
                                        value={quantity} min="1" max={display.stock > 0 ? display.stock : 0}
                                        disabled={display.stock <= 0}
                                        onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                                    />
                                    <button type="button" className="qty-btn qty-plus" id="qtyPlus"
                                        onClick={incrementQty} disabled={display.stock <= 0}>
                                        <i className="bi bi-plus"></i>
                                    </button>
                                </div>
                            </div>

                            <div className="product-actions">
                                <button type="button" className="btn-add-to-cart" id="addToCartBtn"
                                    disabled={display.stock <= 0} onClick={() => addToCart(false)}>
                                    <i className="bi bi-cart-plus"></i> Add to Cart
                                </button>
                                <button type="button" className="btn-buy-now" id="buyNowBtn"
                                    disabled={display.stock <= 0} onClick={() => addToCart(true)}>
                                    <i className="bi bi-lightning-charge-fill"></i> Buy Now
                                </button>
                            </div>

                            <div className="product-sku">
                                <span>SKU: {display.sku || 'N/A'}</span>
                                <span><i className="bi bi-truck"></i> Free shipping</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== DESCRIPTION & FEATURES ===== */}
                <div className="product-info-grid">
                    <div className="info-description">
                        <h3>Description</h3>
                        {product.description ? (
                            <p>{product.description}</p>
                        ) : product.short_description ? (
                            <p>{product.short_description}</p>
                        ) : (
                            <p className="text-muted">No description available.</p>
                        )}
                    </div>

                    <div className="info-features">
                        {hasVariants ? (
                            <>
                                <h3>Product Features</h3>
                                {features.length > 0 ? (
                                    <table className="feature-table" id="productFeatureTable">
                                        <tbody>
                                            {features.map((f, i) => {
                                                const name = f.name || '';
                                                const saved = Array.isArray(f.saved_value) ? f.saved_value : [f.saved_value];
                                                const options = f.options_full || [];
                                                const active = options.filter((o) => saved.includes(o.id));
                                                if (!active.length) return null;
                                                const isColor = name.toLowerCase() === 'color';
                                                return (
                                                    <tr key={i}>
                                                        <td>{name.charAt(0).toUpperCase() + name.slice(1)}</td>
                                                        <td>
                                                            {active.map((a, j) =>
                                                                isColor ? (
                                                                    <span
                                                                        key={j}
                                                                        className="feature-color-dot"
                                                                        style={{
                                                                            backgroundColor: isColorValue(a.value) ? a.value : '#ccc',
                                                                        }}
                                                                        title={a.value}
                                                                    ></span>
                                                                ) : (
                                                                    <span key={j} className="feature-value">{a.value}</span>
                                                                )
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-muted">No features available for this product.</p>
                                )}
                            </>
                        ) : (
                            <>
                                <h3>Specifications</h3>
                                {specifications.length > 0 ? (
                                    <table className="feature-table" id="productSpecificationTable">
                                        <tbody>
                                            {specifications.map((s, i) => (
                                                <tr key={i}>
                                                    <td>{s.label}</td>
                                                    <td>{s.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-muted">No specifications available for this product.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ===== RELATED PRODUCTS ===== */}
                {relatedProducts.length > 0 && (
                    <section className="related-products">
                        <div className="related-header">
                            <h3>Related Products</h3>
                            <p>You may also like</p>
                        </div>
                        <div className="related-grid">
                            {relatedProducts.map((rp) => {
                                const discount = rp.discount || 0;
                                const r = parseFloat(rp.rating) || 0;
                                const full = Math.floor(r);
                                const half = r - full >= 0.5;
                                const rpInWishlist = isInWishlist(rp.id, 0);
                                return (
                                    <div className="related-card" data-product-id={rp.id} key={rp.id}>
                                        <div className="related-image">
                                            <Link to={`/product/${rp.slug}`} className="related-product-link">
                                                <img src={imageUrl(rp.image)} alt={rp.name} loading="lazy"
                                                    onError={(e) => { e.currentTarget.src = '/assets/images/default-product.jpg'; }}
                                                />
                                            </Link>
                                            {discount > 0 && (
                                                <span className="related-discount">-{Math.round(discount)}%</span>
                                            )}
                                            <button
                                                type="button"
                                                className={`wishlist-btn related-wishlist ${rpInWishlist ? 'active' : ''}`}
                                                data-product-id={rp.id}
                                                data-variant-id="0"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleWishlist(rp.id, 0);
                                                }}
                                                aria-label="Toggle wishlist"
                                            >
                                                <i className={`bi ${rpInWishlist ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                                            </button>
                                        </div>
                                        <div className="related-body">
                                            <h5>
                                                <Link to={`/product/${rp.slug}`} className="related-product-link">
                                                    {rp.name}
                                                </Link>
                                            </h5>
                                            <div className="product-rating">
                                                {Array.from({ length: full }).map((_, i) => (
                                                    <i key={`f${i}`} className="bi bi-star-fill star-filled"></i>
                                                ))}
                                                {half && <i className="bi bi-star-half star-filled"></i>}
                                                {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
                                                    <i key={`e${i}`} className="bi bi-star star-empty"></i>
                                                ))}
                                                <span>({r.toFixed(1)})</span>
                                            </div>
                                            <div className="related-price">
                                                {rp.sale_price > 0 && rp.sale_price < rp.price ? (
                                                    <>
                                                        <span className="current">₹{Number(rp.sale_price).toFixed(2)}</span>
                                                        <span className="original">₹{Number(rp.price).toFixed(2)}</span>
                                                    </>
                                                ) : (
                                                    <span className="current">₹{Number(rp.price).toFixed(2)}</span>
                                                )}
                                            </div>
                                            <button type="button" className="related-add-to-cart"
                                                data-product-id={rp.id} data-variant-id="0"
                                                data-product-name={rp.name}>
                                                <i className="bi bi-cart-plus"></i> Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;