// src/pages/admin/products/ProductEdit.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PencilSquare, ArrowLeft, Eye, InfoCircle, Sliders, Diagram3,
    ListCheck, ListUl, Save, XCircle, Trash,
} from 'react-bootstrap-icons';
import { showToast } from '../../../utils/toast';

import API_URL from "../../../../api/config";
import { productImage as imageUrl } from "../../../../utils/productImage";


import InfoTab from './edit/InfoTab';
import FeaturesTab from './edit/FeaturesTab';
import SpecificationsTab from './edit/SpecificationsTab';
import ImagesTab from './edit/ImagesTab';
import VariantsTab from './edit/VariantsTab';
import CombinationsTab from './edit/CombinationsTab';


const API_BASE = API_URL + "/admin";
const getToken = () => localStorage.getItem('admin_token') || '';

const ProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('info');
    const [form, setForm] = useState({
        name: '', slug: '', description: '', short_description: '',
        rating: 0, status: 'active', is_featured: false, is_home: false,
        price: '', sale_price: '', discount: 0, stock: 0, sku: '',
        category_id: '', subcategory_id: '',
        tags: '', weight: '', length: '', width: '', height: '',
    });
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [currentImage, setCurrentImage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`${API_BASE}/products/edit/${id}`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success && data.data) {
                const p = data.data.product || data.data;
                setForm({
                    name: p.name || '',
                    slug: p.slug || '',
                    description: p.description || '',
                    short_description: p.short_description || '',
                    rating: p.rating ?? 0,
                    status: p.status || 'active',
                    is_featured: p.is_featured == 1,
                    is_home: p.is_home == 1,
                    price: p.price ?? '',
                    sale_price: p.sale_price ?? '',
                    discount: p.discount ?? 0,
                    stock: p.stock ?? 0,
                    sku: p.sku || '',
                    category_id: p.category_id || '',
                    subcategory_id: p.subcategory_id || '',
                    tags: p.tags || '',
                    weight: p.weight || '',
                    length: p.length || '',
                    width: p.width || '',
                    height: p.height || '',
                });

                setCurrentImage(imageUrl(p.image));
                setCategories(data.data.categories || []);
                if (p.category_id) loadSubcategories(p.category_id, p.subcategory_id);
            } else {
                showToast('Product not found', 'error');
                setTimeout(() => navigate('/admin/products'), 800);
            }
        } catch {
            showToast('Failed to load product', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadSubcategories = async (categoryId, preselect) => {
        try {
            const res = await fetch(`${API_BASE}/product-categories/subcategories/${categoryId}`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success) {
                setSubcategories(data.subcategories || data.data || []);
                if (preselect) setForm((f) => ({ ...f, subcategory_id: String(preselect) }));
            }
        } catch {
            /* ignore */
        }
    };

    useEffect(() => {
        fetchProduct();
        // eslint-disable-next-line
    }, [id]);

    // Auto-discount when price / sale changes
    useEffect(() => {
        const price = Number(form.price) || 0;
        const sale = Number(form.sale_price) || 0;
        const disc = price > 0 && sale > 0 && sale < price
            ? Math.round(((price - sale) / price) * 100)
            : 0;
        if (disc !== form.discount) setForm((f) => ({ ...f, discount: disc }));
        // eslint-disable-next-line
    }, [form.price, form.sale_price]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
        if (name === 'category_id' && value) loadSubcategories(value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setCurrentImage(URL.createObjectURL(file));
    };

    const handleRemoveImage = async (e) => {
        if (e) e.preventDefault();
        if (!window.confirm('Remove the featured image?')) return;
        try {
            const res = await fetch(`${API_BASE}/products/remove-image/${id}`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success) {
                setCurrentImage('');
                showToast('Image removed', 'success');
            } else {
                showToast(data.message || 'Failed to remove image', 'error');
            }
        } catch {
            showToast('Error', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Only the Info tab has a real "Update Product" submit.
        // Any other tab's inner buttons that accidentally submit are ignored.
        if (activeTab !== 'info') return;

        setSubmitting(true);
        setErrors({});

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (typeof v === 'boolean') fd.append(k, v ? '1' : '0');
            else fd.append(k, v ?? '');
        });
        if (imageFile) fd.append('image', imageFile);

        try {
            const res = await fetch(`${API_BASE}/products/update/${id}`, {
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
                showToast('Product updated!', 'success');
            } else {
                showToast(data.message || 'Failed to update', 'error');
            }
        } catch {
            showToast('Error', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (e) => {
        if (e) e.preventDefault();
        if (!window.confirm('Delete this product? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API_BASE}/products/delete/${id}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success) {
                showToast('Product deleted', 'success');
                setTimeout(() => navigate('/admin/products'), 600);
            } else {
                showToast(data.message, 'error');
            }
        } catch {
            showToast('Error', 'error');
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <PencilSquare className="text-primary me-2" /> Edit Product
                </h2>
                <div>
                    <Link to="/admin/products" className="btn btn-secondary">
                        <ArrowLeft className="me-1" /> Back to Products
                    </Link>
                    {form.slug && (
                        <a
                            href={`/product/${form.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-info ms-2"
                        >
                            <Eye className="me-1" /> View Product
                        </a>
                    )}
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                {[
                    { key: 'info', label: 'Product Information', icon: <InfoCircle /> },
                    { key: 'features', label: 'Features', icon: <Sliders /> },
                    { key: 'variants', label: 'Variants', icon: <Diagram3 /> },
                    { key: 'combinations', label: 'Combinations', icon: <ListCheck /> },
                    { key: 'specifications', label: 'Specifications', icon: <ListUl /> },
                ].map((t) => (
                    <li className="nav-item" key={t.key}>
                        <button
                            type="button"
                            className={`nav-link ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.icon} <span className="ms-1">{t.label}</span>
                        </button>
                    </li>
                ))}
            </ul>

            {/* ─────────────────────────────────────────────── */}
            {/* Info tab is the ONLY tab wrapped in the <form>. */}
            {/* Other tabs render outside the form so their     */}
            {/* buttons can never trigger the outer submit.     */}
            {/* ─────────────────────────────────────────────── */}
            {activeTab === 'info' && (
                <form onSubmit={handleSubmit} noValidate>
                    <InfoTab
                        form={form}
                        setForm={setForm}
                        categories={categories}
                        subcategories={subcategories}
                        errors={errors}
                        onChange={handleChange}
                        onSubcategoryChange={(v) =>
                            setForm((f) => ({ ...f, subcategory_id: v }))
                        }
                        currentImage={currentImage}
                        onImageChange={handleImageChange}
                        onRemoveImage={handleRemoveImage}
                    />

                    <ImagesTab productId={id} />

                    <div className="card mt-4">
                        <div className="card-body d-flex justify-content-between">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Save className="me-1" /> Update Product
                                    </>
                                )}
                            </button>

                            <div>
                                <Link
                                    to="/admin/products"
                                    className="btn btn-secondary btn-lg me-2"
                                >
                                    <XCircle className="me-1" /> Cancel
                                </Link>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-lg"
                                    onClick={handleDelete}
                                >
                                    <Trash className="me-1" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {activeTab === 'features' && <FeaturesTab productId={id} />}
            {activeTab === 'specifications' && <SpecificationsTab productId={id} />}
            {activeTab === 'variants' && <VariantsTab productId={id} />}
            {activeTab === 'combinations' && <CombinationsTab productId={id} />}
        </>
    );
};

export default ProductEdit;