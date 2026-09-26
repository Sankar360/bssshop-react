// src/pages/admin/products/edit/InfoTab.jsx
import React from 'react';
import {
    InfoCircle, ArrowRepeat, Star, StarFill, StarHalf, ToggleOn, Gear,
    Image as ImageIcon, Trash,
} from 'react-bootstrap-icons';

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

const InfoTab = ({ form, setForm, categories, subcategories, errors, onChange, onSubcategoryChange, currentImage, onImageChange, onRemoveImage }) => {
    const handle = (e) => onChange(e);
    const handleSub = (e) => {
        setForm((f) => ({ ...f, subcategory_id: e.target.value }));
        onSubcategoryChange?.(e.target.value);
    };

    return (
        <div className="row">
            <div className="col-md-8">
                <div className="card">
                    <div className="card-header"><h5 className="mb-0"><InfoCircle /> Product Information</h5></div>
                    <div className="card-body">
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Product Name <span className="text-danger">*</span></label>
                            <input type="text" name="name"
                                className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                                value={form.name} onChange={handle} required />
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">Slug</label>
                            <div className="input-group">
                                <input type="text" name="slug" className="form-control"
                                    value={form.slug} onChange={handle} />
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setForm((f) => ({ ...f, slug: (f.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }))}>
                                    <ArrowRepeat /> Generate
                                </button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">Description <span className="text-danger">*</span></label>
                            <textarea name="description" rows="6" className="form-control"
                                value={form.description} onChange={handle} />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">Short Description</label>
                            <textarea name="short_description" rows="2" maxLength="160"
                                className="form-control"
                                value={form.short_description} onChange={handle} />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <div className="card">
                                    <div className="card-header"><h6 className="mb-0"><Star /> Rating</h6></div>
                                    <div className="card-body">
                                        <label className="form-label fw-semibold">Rating (0-5)</label>
                                        <input type="number" name="rating" min="0" max="5" step="0.1"
                                            className="form-control"
                                            value={form.rating} onChange={handle} />
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
                                                <input className="form-check-input" type="radio"
                                                    name="status" value={s}
                                                    checked={form.status === s} onChange={handle} />
                                                <label className="form-check-label">
                                                    <span className={`badge bg-${s === 'active' ? 'success' : s === 'draft' ? 'warning' : 'danger'}`}>
                                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </span>
                                                </label>
                                            </div>
                                        ))}
                                        <hr />
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox"
                                                name="is_featured" checked={form.is_featured} onChange={handle} />
                                            <label className="form-check-label">Featured Product</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox"
                                                name="is_home" checked={form.is_home} onChange={handle} />
                                            <label className="form-check-label">Show on Homepage</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card mt-2">
                            <div className="card-header"><h6 className="mb-0"><Gear /> Additional Details</h6></div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-semibold">Category</label>
                                        <select name="category_id" className="form-select"
                                            value={form.category_id} onChange={handle}>
                                            <option value="">Select Category</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-semibold">Subcategory</label>
                                        <select name="subcategory_id" className="form-select"
                                            value={form.subcategory_id || ''} onChange={handleSub}>
                                            <option value="">Select Subcategory</option>
                                            {subcategories.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-semibold">Tags</label>
                                        <input type="text" name="tags" className="form-control"
                                            value={form.tags} onChange={handle}
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
                                                    value={form[f.name]} onChange={handle} />
                                                <span className="input-group-text">{f.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-4">
                <div className="card mb-3">
                    <div className="card-header"><h6 className="mb-0"><ImageIcon /> Product Image</h6></div>
                    <div className="card-body text-center">
                        <div className="mb-3" style={{ minHeight: 200 }}>
                            {currentImage ? (
                                <img src={currentImage} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                            ) : (
                                <div style={{ width: '100%', height: 200, background: '#f8f9fa', border: '2px dashed #dee2e6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ImageIcon className="text-muted" style={{ fontSize: '3rem' }} />
                                </div>
                            )}
                        </div>
                        <input type="file" className="form-control" accept="image/*" onChange={onImageChange} />
                        {currentImage && (
                            <button type="button" className="btn btn-sm btn-danger mt-2" onClick={onRemoveImage}>
                                <Trash /> Remove Image
                            </button>
                        )}
                    </div>
                </div>

                <div className="card mb-3">
                    <div className="card-header"><h6 className="mb-0">Pricing & Stock</h6></div>
                    <div className="card-body">
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Price <span className="text-danger">*</span></label>
                            <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input type="number" name="price" step="0.01" min="0" className="form-control"
                                    value={form.price} onChange={handle} required />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Sale Price</label>
                            <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input type="number" name="sale_price" step="0.01" min="0" className="form-control"
                                    value={form.sale_price} onChange={handle} />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Discount (%)</label>
                            <input type="number" name="discount" className="form-control"
                                value={form.discount} readOnly />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Stock <span className="text-danger">*</span></label>
                            <input type="number" name="stock" min="0" className="form-control"
                                value={form.stock} onChange={handle} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">SKU</label>
                            <input type="text" name="sku" className="form-control"
                                value={form.sku} onChange={handle} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoTab;