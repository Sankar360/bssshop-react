// src/pages/admin/blog/BlogEdit.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PencilSquare, ArrowLeft, Eye, ArrowRepeat, InfoCircle,
    Image as ImageIcon, Tags, BarChart, Save, Trash, XCircle,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;
const getToken = () => localStorage.getItem('admin_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const slugify = (str) =>
    (str || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');

const formatDateTime = (s) =>
    s
        ? new Date(s).toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

const imageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const clean = String(path).replace(/^\/+/, '').replace(/^storage\//i, '');
    return `/storage/${clean}`;
};
const BlogEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        category: '',
        status: 'draft',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
    });
    const [meta, setMeta] = useState({
        id: null,
        author: 'Admin',
        created_at: null,
        updated_at: null,
        status: 'draft',
    });
    const [currentImage, setCurrentImage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load post                                                      */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/blog/edit/${id}`, {
                    headers: authHeaders(false),
                });
                const data = await res.json();

                if (data.success && data.data) {
                    const b = data.data;
                    setForm({
                        title: b.title || '',
                        slug: b.slug || '',
                        content: b.content || '',
                        excerpt: b.excerpt || '',
                        category: b.category || '',
                        status: b.status || 'draft',
                        meta_title: b.meta_title || '',
                        meta_description: b.meta_description || '',
                        meta_keywords: b.meta_keywords || '',
                    });
                    setMeta({
                        id: b.id,
                        author: b.author || 'Admin',
                        created_at: b.created_at,
                        updated_at: b.updated_at,
                        status: b.status || 'draft',
                    });
                    setCurrentImage(b.image || '');
                } else {
                    showToast(data.message || 'Blog post not found', 'error');
                    setTimeout(() => navigate('/admin/blog'), 800);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load blog post', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate]);

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    };

    const regenerateSlug = () => {
        setForm((f) => ({ ...f, slug: slugify(f.title) }));
    };

    const handleImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        if (errors.image) setErrors((er) => ({ ...er, image: null }));
    };

    const removeImage = async () => {
        if (!window.confirm('Are you sure you want to remove the featured image?')) return;
        try {
            const res = await fetch(`${API_BASE}/blog/remove-image/${id}`, {
                method: 'POST',
                headers: authHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                setCurrentImage('');
                setImageFile(null);
                setImagePreview('');
                showToast('Image removed successfully', 'success');
            } else {
                showToast(data.message || 'Failed to remove image', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
        if (imageFile) fd.append('image', imageFile);

        try {
            const res = await fetch(`${API_BASE}/blog/update/${id}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: fd,
            });

            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the validation errors below.', 'error');
                return;
            }

            const data = await res.json();
            if (data.success) {
                showToast('Blog post updated successfully!', 'success');
                setTimeout(() => navigate('/admin/blog'), 600);
            } else {
                showToast(data.message || 'Failed to update blog post', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) {
            return;
        }
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/blog/delete/${id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Post deleted successfully', 'success');
                setTimeout(() => navigate('/admin/blog'), 600);
            } else {
                showToast(data.message || 'Failed to delete post', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const previewSrc = imagePreview || (currentImage ? imageUrl(currentImage) : '');

    return (
        <>
            <style>{`
                .blog-image-preview {
                    position: relative;
                    min-height: 150px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .form-control-lg { font-size: 1.1rem; }
                .card-header {
                    background-color: #f8f9fc;
                    border-bottom: 1px solid #e3e6f0;
                }
                .form-text { font-size: .85rem; }
            `}</style>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <PencilSquare className="text-primary me-2" /> Edit Blog Post
                </h2>
                <div>
                    <Link to="/admin/blog" className="btn btn-outline-secondary">
                        <ArrowLeft className="me-1" /> Back to Blog
                    </Link>
                    {form.slug && (
                        <a
                            href={`/blog/${id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-info ms-2"
                        >
                            <Eye className="me-1" /> View Post
                        </a>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row">
                            {/* Left column */}
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label fw-semibold">
                                        Title <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="Enter blog post title"
                                        required
                                    />
                                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="slug" className="form-label fw-semibold">
                                        Slug
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            id="slug"
                                            name="slug"
                                            className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                                            value={form.slug}
                                            onChange={handleChange}
                                            placeholder="URL-friendly version of the title"
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={regenerateSlug}
                                        >
                                            <ArrowRepeat className="me-1" /> Generate
                                        </button>
                                    </div>
                                    <div className="form-text text-muted">
                                        <InfoCircle className="me-1" />
                                        URL-friendly version of the title. Auto-generated if left empty.
                                    </div>
                                    {errors.slug && <div className="invalid-feedback d-block">{errors.slug}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="content" className="form-label fw-semibold">
                                        Content <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        id="content"
                                        name="content"
                                        rows="12"
                                        className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                                        value={form.content}
                                        onChange={handleChange}
                                        placeholder="Write your blog post content here..."
                                        required
                                    />
                                    {errors.content && <div className="invalid-feedback">{errors.content}</div>}
                                    <div className="form-text text-muted">
                                        <InfoCircle className="me-1" />
                                        You can use HTML formatting. Recommended: Use headings, paragraphs, and lists for better readability.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="excerpt" className="form-label fw-semibold">
                                        Excerpt
                                    </label>
                                    <textarea
                                        id="excerpt"
                                        name="excerpt"
                                        rows="3"
                                        className={`form-control ${errors.excerpt ? 'is-invalid' : ''}`}
                                        value={form.excerpt}
                                        onChange={handleChange}
                                        placeholder="Brief summary of the blog post"
                                    />
                                    {errors.excerpt && <div className="invalid-feedback">{errors.excerpt}</div>}
                                    <div className="form-text text-muted">
                                        <InfoCircle className="me-1" />
                                        Short summary. Max 500 characters. Displayed on blog listings.
                                    </div>
                                </div>
                            </div>

                            {/* Right column */}
                            <div className="col-md-4">
                                {/* Featured Image */}
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h6 className="mb-0">
                                            <ImageIcon className="me-1" /> Featured Image
                                        </h6>
                                    </div>
                                    <div className="card-body text-center">
                                        <div className="blog-image-preview mb-3">
                                            {previewSrc ? (
                                                <img
                                                    src={previewSrc}
                                                    id="imagePreview"
                                                    alt="Blog"
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: 200,
                                                        borderRadius: 8,
                                                        border: '2px solid #e1e5ea',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: 150,
                                                        background: '#f8f9fa',
                                                        border: '2px dashed #dee2e6',
                                                        borderRadius: 8,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexDirection: 'column',
                                                    }}
                                                >
                                                    <ImageIcon
                                                        className="text-muted"
                                                        style={{ fontSize: '2.5rem' }}
                                                    />
                                                    <p className="text-muted mt-2 mb-0">No image uploaded</p>
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            type="file"
                                            id="image"
                                            name="image"
                                            accept="image/*"
                                            className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                                            onChange={handleImage}
                                        />
                                        {errors.image && <div className="invalid-feedback">{errors.image}</div>}
                                        <div className="form-text text-muted mt-2">
                                            <InfoCircle className="me-1" />
                                            Recommended: JPG, PNG, GIF. Max size: 5MB.
                                            <br />
                                            Best resolution: 1200x630px
                                        </div>

                                        {currentImage && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger mt-2"
                                                onClick={removeImage}
                                            >
                                                <Trash className="me-1" /> Remove Image
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="mb-3">
                                    <label htmlFor="category" className="form-label fw-semibold">
                                        Category <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="category"
                                        name="category"
                                        className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                                        value={form.category}
                                        onChange={handleChange}
                                        placeholder="e.g., Technology, Lifestyle"
                                        required
                                    />
                                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                                    <div className="form-text text-muted">
                                        <InfoCircle className="me-1" />
                                        Group your blog posts by category.
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="mb-3">
                                    <label htmlFor="status" className="form-label fw-semibold">
                                        Status
                                    </label>
                                    <select
                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                        id="status"
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                    >
                                        <option value="draft">📝 Draft</option>
                                        <option value="published">✅ Published</option>
                                        <option value="archived">📦 Archived</option>
                                    </select>
                                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                </div>

                                {/* SEO & Meta */}
                                <div className="card">
                                    <div className="card-header">
                                        <h6 className="mb-0">
                                            <Tags className="me-1" /> SEO &amp; Meta
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label htmlFor="meta_title" className="form-label fw-semibold">
                                                Meta Title
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="meta_title"
                                                name="meta_title"
                                                maxLength="60"
                                                value={form.meta_title}
                                                onChange={handleChange}
                                                placeholder="SEO title"
                                            />
                                            <div className="form-text text-muted">
                                                <span>{form.meta_title.length}</span>/60 characters
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="meta_description" className="form-label fw-semibold">
                                                Meta Description
                                            </label>
                                            <textarea
                                                className="form-control"
                                                id="meta_description"
                                                name="meta_description"
                                                rows="2"
                                                maxLength="160"
                                                value={form.meta_description}
                                                onChange={handleChange}
                                                placeholder="SEO description"
                                            />
                                            <div className="form-text text-muted">
                                                <span>{form.meta_description.length}</span>/160 characters
                                            </div>
                                        </div>

                                        <div className="mb-0">
                                            <label htmlFor="meta_keywords" className="form-label fw-semibold">
                                                Meta Keywords
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="meta_keywords"
                                                name="meta_keywords"
                                                value={form.meta_keywords}
                                                onChange={handleChange}
                                                placeholder="keyword1, keyword2, keyword3"
                                            />
                                            <div className="form-text text-muted">
                                                <InfoCircle className="me-1" />
                                                Comma-separated keywords for SEO.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Blog Info */}
                                <div className="card mt-3">
                                    <div className="card-header">
                                        <h6 className="mb-0">
                                            <BarChart className="me-1" /> Blog Information
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Post ID</span>
                                            <span className="fw-bold">#{meta.id}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Author</span>
                                            <span>{meta.author}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Created</span>
                                            <span>{formatDateTime(meta.created_at)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Last Updated</span>
                                            <span>{formatDateTime(meta.updated_at)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">Status</span>
                                            <span
                                                className={`badge bg-${
                                                    form.status === 'published'
                                                        ? 'success'
                                                        : form.status === 'draft'
                                                        ? 'warning'
                                                        : 'secondary'
                                                }`}
                                            >
                                                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr />

                        {/* Submit Buttons */}
                        <div className="d-flex justify-content-between">
                            <Link to="/admin/blog" className="btn btn-secondary btn-lg">
                                <XCircle className="me-1" /> Cancel
                            </Link>
                            <div>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg me-2"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="me-1" /> Update Post
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-lg"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash className="me-1" /> Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default BlogEdit;