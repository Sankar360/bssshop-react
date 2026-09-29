// src/pages/admin/products/Products.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, XCircle, Pencil, Trash, Tag, Box, ExclamationTriangle } from 'react-bootstrap-icons';
import { showToast } from '../../../utils/toast';
import API_URL from "../../../api/config";
import { productImage as imageUrl } from "../../../utils/productImage";



const API_BASE = API_URL + "/admin";


const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");


const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});


const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [priceModal, setPriceModal] = useState(null);
    const [stockModal, setStockModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/products`, { headers: authHeaders(false) });
            const data = await res.json();

            if (!data.success) {
                showToast(data.message || 'Failed to load products', 'error');
                setProducts([]);
                return;
            }

            // ✅ Normalize shapes: array | paginator | wrapped
            const payload = data.data;
            let list = [];

            if (Array.isArray(payload)) {
                list = payload;
            } else if (payload && Array.isArray(payload.data)) {
                list = payload.data;           // Laravel paginator
            } else if (payload && Array.isArray(payload.products)) {
                list = payload.products;       // wrapped shape
            }

            setProducts(list);
        } catch (err) {
            console.error(err);
            showToast('Failed to load products', 'error');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filtered = products.filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            p.name?.toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const openPriceModal = (product) => {
        setPriceModal({
            product_id: product.id,           // ✅ backend expects product_id
            price: product.price ?? '',
            sale_price: product.sale_price ?? '',
        });
    };

    const openStockModal = (product) => {
        setStockModal({
            product_id: product.id,           // ✅ backend expects product_id
            stock: product.stock ?? 0,
        });
    };

    const savePrice = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/products/update-price`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(priceModal),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Price updated', 'success');
                setPriceModal(null);
                fetchProducts();
            } else {
                const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
                showToast(firstError || data.message || 'Failed to update price', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        }
    };

    const saveStock = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/products/update-stock`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(stockModal),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Stock updated', 'success');
                setStockModal(null);
                fetchProducts();
            } else {
                const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
                showToast(firstError || data.message || 'Failed to update stock', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`${API_BASE}/products/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: authHeaders(false),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Product deleted', 'success');
                setDeleteTarget(null);
                fetchProducts();
            } else {
                showToast(data.message || 'Failed to delete product', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        }
    };

    return (
        <>
            <style>{`
                .price-clickable:hover, .stock-clickable:hover { opacity: .7; }
                .filter-btn.active { color: #fff; background-color: #0d6efd; border-color: #0d6efd; }
                .product-name-link { color: #0d6efd; text-decoration: none; font-weight: 500; }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Products</h2>
                <Link to="/admin/products/create" className="btn btn-primary">
                    <PlusCircle className="me-1" /> Add Product
                </Link>
            </div>

            <div className="card">
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text"><Search /></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search products by name, SKU..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => setSearch('')}
                                    >
                                        <XCircle />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="col-md-6 text-md-end">
                            <div className="btn-group" role="group">
                                {['all', 'active', 'inactive', 'draft'].map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        className={`btn btn-outline-${
                                            f === 'active'
                                                ? 'success'
                                                : f === 'inactive'
                                                ? 'danger'
                                                : f === 'draft'
                                                ? 'warning'
                                                : 'secondary'
                                        } filter-btn ${statusFilter === f ? 'active' : ''}`}
                                        onClick={() => setStatusFilter(f)}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mb-2">
                        <span className="text-muted small">Showing {filtered.length} products</span>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.id}</td>
                                            <td>
                                                <img
                                                    src={imageUrl(product.image)}
                                                    style={{ width: 50, height: 50, objectFit: 'cover' }}
                                                    alt=""
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/assets/images/default-product.jpg';
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/admin/products/edit/${product.id}`}
                                                    className="product-name-link"
                                                >
                                                    {product.name}
                                                </Link>
                                            </td>
                                            <td>
                                                <span
                                                    className="price-clickable"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => openPriceModal(product)}
                                                >
                                                    {product.sale_price > 0 ? (
                                                        <>
                                                            <span className="text-decoration-line-through text-muted">
                                                                ${Number(product.price).toFixed(2)}
                                                            </span>
                                                            <br />
                                                            <span className="text-primary fw-bold">
                                                                ${Number(product.sale_price).toFixed(2)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-primary fw-bold">
                                                            ${Number(product.price).toFixed(2)}
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className="stock-clickable"
                                                    style={{ cursor: 'pointer', color: '#0d6efd' }}
                                                    onClick={() => openStockModal(product)}
                                                >
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge bg-${
                                                        product.status === 'active'
                                                            ? 'success'
                                                            : product.status === 'draft'
                                                            ? 'warning'
                                                            : 'danger'
                                                    }`}
                                                >
                                                    {product.status?.charAt(0).toUpperCase() +
                                                        product.status?.slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/admin/products/edit/${product.id}`}
                                                    className="btn btn-sm btn-warning me-1"
                                                >
                                                    <Pencil />
                                                </Link>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => setDeleteTarget({ id: product.id })}
                                                >
                                                    <Trash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <Box className="text-muted" style={{ fontSize: '3rem' }} />
                                                <p className="text-muted mt-3">No products found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Price Modal */}
            {priceModal && (
                <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <form className="modal-content" onSubmit={savePrice}>
                            <div className="modal-header">
                                <h5 className="modal-title"><Tag className="text-primary me-1" /> Update Product Price</h5>
                                <button type="button" className="btn-close" onClick={() => setPriceModal(null)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Price <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text">$</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            step="0.01" min="0"
                                            value={priceModal.price}
                                            onChange={(e) => setPriceModal((m) => ({ ...m, price: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Sale Price</label>
                                    <div className="input-group">
                                        <span className="input-group-text">$</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            step="0.01" min="0"
                                            value={priceModal.sale_price}
                                            onChange={(e) => setPriceModal((m) => ({ ...m, sale_price: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setPriceModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Modal */}
            {stockModal && (
                <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <form className="modal-content" onSubmit={saveStock}>
                            <div className="modal-header">
                                <h5 className="modal-title"><Box className="text-primary me-1" /> Update Stock</h5>
                                <button type="button" className="btn-close" onClick={() => setStockModal(null)}></button>
                            </div>
                            <div className="modal-body">
                                <label className="form-label fw-semibold">Stock Quantity <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    className="form-control"
                                    step="1" min="0"
                                    value={stockModal.stock}
                                    onChange={(e) => setStockModal((m) => ({ ...m, stock: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setStockModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
                    <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h6 className="modal-title"><ExclamationTriangle className="me-1" /> Confirm Delete</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setDeleteTarget(null)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this product?</p>
                                <p className="text-muted small">This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>Cancel</button>
                                <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete}>
                                    <Trash className="me-1" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Products;