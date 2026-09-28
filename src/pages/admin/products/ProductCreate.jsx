// src/pages/admin/products/ProductCreate.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box, ArrowLeft, InfoCircle, Save, XCircle, Star, StarHalf, StarFill,
    Image as ImageIcon, Tag, ToggleOn, Gear, Images, CloudUpload,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';

const slugify = (str) =>
    (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const StarPreview = ({ rating = 0 }) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
        <span>
            {Array.from({ length: full }).map((_, i) => <StarFill key={`f${i}`} className="text-warning" />)}
            {half && <StarHalf className="text-warning" />}
            {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} className="text-warning" />)}
            <span className="ms-2 fw-bold">{Number(rating).toFixed(1)}</span>
        </span>
    );
};

const ProductCreate = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', slug: '', description: '', short_description: '',
        rating: 0,
        status: 'active',
        is_featured: false,
        is_home: false,
        price: '', sale_price: '', discount: 0, stock: 0, sku: '',
        category_id: '',
        tags: '',
        weight: '', length: '', width: '', height: '',
    });
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [tempImages, setTempImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/product-categories/dropdown`, {
                    headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
                });
                const data = await res.json();
                if (data.success) setCategories(data.data?.categories || data.data || []);
            } catch {/* ignore */}
        })();
    }, []);

    // Auto-slug
    useEffect(() => {
        setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }, [form.name]);

    // Auto-discount
    useEffect(() => {
        const price = Number(form.price) || 0;
        const salePrice = Number(form.sale_price) || 0;
        const discount = price > 0 && salePrice > 0 && salePrice < price
            ? Math.round(((price - salePrice) / price) * 100)
            : 0;
        setForm((f) => ({ ...f, discount }));
    }, [form.price, form.sale_price]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    };

    const handleImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleMultipleImages = async (files) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;
        for (const file of files) {
            if (!allowed.includes(file.type)) return showToast(`Invalid type: ${file.name}`, 'error');
            if (file.size > maxSize) return showToast(`Too large: ${file.name}`, 'error');
        }
        const fd = new FormData();
        for (const file of files) fd.append('images[]', file);

        try {
            const res = await fetch(`${API_BASE}/products/upload-temp-images`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
                body: fd,
            });
            const data = await res.json();
            if (data.success) {
                showToast('Images uploaded (pending save)', 'success');
                setTempImages((prev) => [...prev, ...(data.images || [])]);
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch {
            showToast('Upload error', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (typeof v === 'boolean') fd.append(k, v ? '1' : '0');
            else fd.append(k, v ?? '');
        });
        if (imageFile) fd.append('image', imageFile);
        if (tempImages.length > 0) fd.append('temp_images', JSON.stringify(tempImages));

        try {
            const res = await fetch(`${API_BASE}/products/store`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
                body: fd,
            });
            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the errors', 'error');
                return;
            }
            const data = await res.json();
            if (data.success) {
                showToast('Product created!', 'success');
                setTimeout(() => navigate('/admin/products'), 600);
            } else {
                showToast(data.message || 'Failed', 'error');
            }
        } catch {
            showToast('Error', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2><Box className="text-primary me-2" /> Add New Product</h2>
                <Link to="/admin/products" className="btn btn-outline-secondary">
                    <ArrowLeft className="me-1" /> Back to Products
                </Link>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="card">
                    <div className="card-body">
                        <div className="row">
                            {/* LEFT */}
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Product Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text" name="name"
                                        className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                                        value={form.name} onChange={handleChange} required
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Slug</label>
                                    <input
                                        type="text" name="slug"
                                        className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                                        value={form.slug} onChange={handleChange}
                                    />
                                    <small className="text-muted">
                                        <InfoCircle className="me-1" /> Auto-generated from name.
                                    </small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Description <span className="text-danger">*</span></label>
                                    <textarea
                                        name="description" rows="6"
                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                        value={form.description} onChange={handleChange} required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Short Description</label>
                                    <textarea
                                        name="short_description" rows="2" maxLength="160"
                                        className="form-control"
                                        value={form.short_description} onChange={handleChange}
                                    />
                                    <small className="text-muted">{form.short_description.length}/160</small>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <div className="card">
                                            <div className="card-header"><h6 className="mb-0"><Star /> Rating</h6></div>
                                            <div className="card-body">
                                                <label className="form-label fw-semibold">Rating (0-5)</label>
                                                <input
                                                    type="number" name="rating" min="0" max="5" step="0.1"
                                                    className="form-control"
                                                    value={form.rating} onChange={handleChange}
                                                />
                                                <div className="mt-2 text-center">
                                                    <span className="text-muted small">Preview: </span>
                                                    <StarPreview rating={Number(form.rating) || 0} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <div className="card">
                                            <div className="card-header"><h6 className="mb-0"><ToggleOn /> Status</h6></div>
                                            <div className="card-body">
                                                {['active', 'inactive', 'draft'].map((s) => (
                                                    <div className="form-check" key={s}>
                                                        <input
                                                            className="form-check-input"
                                                            type="radio" name="status"
                                                            value={s}
                                                            checked={form.status === s}
                                                            onChange={handleChange}
                                                        />
                                                        <label className="form-check-label">
                                                            <span className={`badge bg-${s === 'active' ? 'success' : s === 'draft' ? 'warning' : 'danger'}`}>
                                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                                            </span>
                                                        </label>
                                                    </div>
                                                ))}
                                                <hr />
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input" type="checkbox"
                                                        name="is_featured"
                                                        checked={form.is_featured} onChange={handleChange}
                                                    />
                                                    <label className="form-check-label">
                                                        <Star className="text-warning me-1" /> Featured Product
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input" type="checkbox"
                                                        name="is_home"
                                                        checked={form.is_home} onChange={handleChange}
                                                    />
                                                    <label className="form-check-label">
                                                        Show on Homepage
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT */}
                            <div className="col-md-4">
                                <div className="card mb-3">
                                    <div className="card-header"><h6 className="mb-0"><ImageIcon className="text-warning me-1" /> Featured Image</h6></div>
                                    <div className="card-body text-center">
                                        <div className="mb-3" style={{ minHeight: 200 }}>
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                                            ) : (
                                                <div style={{ width: '100%', height: 200, background: '#f8f9fa', border: '2px dashed #dee2e6', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ImageIcon className="text-muted" style={{ fontSize: '3rem' }} />
                                                    <p className="text-muted mt-2 mb-0">No featured image</p>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" className="form-control" accept="image/*" onChange={handleImage} />
                                    </div>
                                </div>

                                <div className="card mb-3">
                                    <div className="card-header"><h6 className="mb-0"><Tag /> Pricing & Stock</h6></div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Price <span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <span className="input-group-text">$</span>
                                                <input type="number" name="price" step="0.01" min="0"
                                                    className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                                    value={form.price} onChange={handleChange} required />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Sale Price</label>
                                            <div className="input-group">
                                                <span className="input-group-text">$</span>
                                                <input type="number" name="sale_price" step="0.01" min="0"
                                                    className="form-control"
                                                    value={form.sale_price} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Discount (%)</label>
                                            <div className="input-group">
                                                <input type="number" className="form-control"
                                                    value={form.discount} readOnly />
                                                <span className="input-group-text">%</span>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Stock <span className="text-danger">*</span></label>
                                            <input type="number" name="stock" min="0"
                                                className="form-control"
                                                value={form.stock} onChange={handleChange} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">SKU</label>
                                            <input type="text" name="sku"
                                                className="form-control"
                                                value={form.sku} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div className="row mt-3">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header"><h6 className="mb-0"><Gear /> Additional Details</h6></div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Category</label>
                                                <select name="category_id" className="form-select"
                                                    value={form.category_id} onChange={handleChange}>
                                                    <option value="">Select Category</option>
                                                    {categories.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Tags</label>
                                                <input type="text" name="tags"
                                                    className="form-control"
                                                    value={form.tags} onChange={handleChange}
                                                    placeholder="e.g., new, sale, popular" />
                                            </div>
                                            {[
                                                { name: 'weight', label: 'Weight', unit: 'kg' },
                                                { name: 'length', label: 'Length', unit: 'cm' },
                                                { name: 'width', label: 'Width', unit: 'cm' },
                                                { name: 'height', label: 'Height', unit: 'cm' },
                                            ].map((f) => (
                                                <div className="col-md-3 mb-3" key={f.name}>
                                                    <label className="form-label fw-semibold">{f.label}</label>
                                                    <div className="input-group">
                                                        <input type="number" name={f.name} step="0.01"
                                                            className="form-control"
                                                            value={form[f.name]} onChange={handleChange} />
                                                        <span className="input-group-text">{f.unit}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Multiple Images */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header"><h6 className="mb-0"><Images /> Product Images Gallery</h6></div>
                                    <div className="card-body">
                                        <label
                                            className="dropzone-area d-block"
                                            style={{
                                                border: '3px dashed #dee2e6', borderRadius: 10,
                                                padding: '40px 20px', textAlign: 'center',
                                                cursor: 'pointer', background: '#f8f9fa',
                                            }}
                                            onClick={() => document.getElementById('multiImgs').click()}
                                        >
                                            <CloudUpload style={{ fontSize: '3rem' }} />
                                            <p className="mb-0">Drag & drop images here or click to select</p>
                                            <small className="text-muted">Max 5MB each | JPG, PNG, GIF, WEBP</small>
                                            <input
                                                id="multiImgs" type="file" multiple accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => e.target.files && handleMultipleImages(Array.from(e.target.files))}
                                            />
                                        </label>
                                        {tempImages.length > 0 && (
                                            <div className="row g-3 mt-3">
                                                {tempImages.map((img, i) => (
                                                    <div className="col-3 col-md-2" key={i}>
                                                        <div className="position-relative">
                                                            <img src={img.url} alt="temp" className="img-thumbnail" style={{ height: 150, objectFit: 'cover' }} />
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                                                onClick={() => setTempImages((prev) => prev.filter((_, idx) => idx !== i))}
                                                            >
                                                                <XCircle />
                                                            </button>
                                                            <span className="badge bg-info position-absolute bottom-0 start-0">Pending</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-end mt-4">
                            <Link to="/admin/products" className="btn btn-secondary me-2">
                                <XCircle className="me-1" /> Cancel
                            </Link>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="me-1" /> Create Product
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};

export default ProductCreate;