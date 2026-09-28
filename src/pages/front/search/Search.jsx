// src/pages/front/search/Search.jsx
import React, { useEffect, useState } from 'react';
import API_URL from "../../../api/config";
import { Link, useSearchParams } from 'react-router-dom';

const API_BASE = API_URL;

const imageUrl = (path) => {
    if (!path) return '/assets/images/default-product.jpg';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return path;
    if (/^storage\//i.test(path)) return `/${path}`;
    if (/^(uploads|assets)\//i.test(path)) return `/${path}`;
    return `/storage/${path.replace(/^\/+/, '')}`;
};

const Search = () => {
    const [params] = useSearchParams();
    const query = params.get('q') || '';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();
                if (data.success) {
                    setProducts(data.data || data.products || []);
                }
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [query]);

    return (
        <section className="py-5">
            <div className="container">
                <h2 className="mb-4">
                    <i className="bi bi-search text-primary"></i> Search Results for "{query}"
                </h2>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : products.length > 0 ? (
                    <>
                        <p className="text-muted">Found {products.length} products</p>
                        <div className="row">
                            {products.map((product) => {
                                const discountBadge =
                                    product.discount ||
                                    (product.sale_price > 0 && product.price > 0
                                        ? Math.round((1 - product.sale_price / product.price) * 100)
                                        : 0);

                                const rating = parseFloat(product.rating) || 0;
                                const full = Math.floor(rating);
                                const half = rating - full >= 0.5;
                                const empty = 5 - full - (half ? 1 : 0);

                                return (
                                    <div className="col-md-3 col-sm-6 mb-4" key={product.id}>
                                        <div className="card product-card h-100">
                                            <div className="position-relative">
                                                <img
                                                    src={imageUrl(product.image)}
                                                    className="card-img-top product-image-static"
                                                    alt={product.name}
                                                />
                                                {discountBadge > 0 && (
                                                    <span className="badge bg-danger position-absolute top-0 end-0 m-2">
                                                        -{discountBadge}%
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn-wishlist position-absolute top-0 end-0 m-2"
                                                    data-product-id={product.id}
                                                    aria-label="Add to wishlist"
                                                >
                                                    <i className="bi bi-heart"></i>
                                                </button>
                                            </div>
                                            <div className="card-body">
                                                <h5 className="card-title">{product.name}</h5>
                                                <p className="card-text text-muted">
                                                    {String(product.description || '').substring(0, 50)}...
                                                </p>

                                                <div className="product-rating mb-2">
                                                    {rating > 0 ? (
                                                        <>
                                                            {Array.from({ length: full }).map((_, i) => (
                                                                <i key={`f${i}`} className="bi bi-star-fill text-warning"></i>
                                                            ))}
                                                            {half && <i className="bi bi-star-half text-warning"></i>}
                                                            {Array.from({ length: empty }).map((_, i) => (
                                                                <i key={`e${i}`} className="bi bi-star text-warning"></i>
                                                            ))}
                                                            <span className="text-muted ms-1">({rating.toFixed(1)})</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted">No ratings</span>
                                                    )}
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center">
                                                    <p className="card-text fw-bold text-primary mb-0">
                                                        ${Number(product.sale_price > 0 ? product.sale_price : product.price).toFixed(2)}
                                                    </p>
                                                    {product.sale_price > 0 && (
                                                        <span className="text-muted text-decoration-line-through small">
                                                            ${Number(product.price).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>

                                                <Link to={`/product/${product.slug}`} className="btn btn-primary w-100 mt-2">
                                                    <i className="bi bi-eye"></i> View Product
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-5">
                        <i className="bi bi-search" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
                        <h4 className="mt-3">No products found</h4>
                        <p className="text-muted">Try searching with different keywords</p>
                        <Link to="/" className="btn btn-primary">
                            <i className="bi bi-arrow-left"></i> Back to Home
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Search;