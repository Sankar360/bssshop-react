// src/pages/admin/blog/BlogForm.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Save } from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;

const getToken = () => localStorage.getItem('admin_token') || '';

const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

/** Turn "My Great Post!" into "my-great-post" */
const slugify = (str) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const BlogForm = () => {
    const { id } = useParams();          // undefined for create, present for edit
    const navigate = useNavigate();
    const isEdit = Boolean(id);

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
    const [imageFile, setImageFile] = useState(null);
    const [currentImage, setCurrentImage] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [slugTouched, setSlugTouched] = useState(false);

    /* -------------------------------------------------------------- */
    /*  Load existing post in edit mode                                */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        if (!isEdit) return;

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
                    setCurrentImage(b.image || '');
                    setSlugTouched(true); // don't auto-overwrite loaded slug
                } else {
                    showToast(data.message || 'Failed to load post', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load blog post', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isEdit]);

    /* -------------------------------------------------------------- */
    /*  Auto-generate slug from title (only in create mode / untouched) */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        if (isEdit || slugTouched) return;
        setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }, [form.title, isEdit, slugTouched]);

    /* -------------------------------------------------------------- */
    /*  Field change handler                                           */
    /* -------------------------------------------------------------- */
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'slug') setSlugTouched(true);
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
    };

    /* -------------------------------------------------------------- */
    /*  Image picker                                                   */
    /* -------------------------------------------------------------- */
    const handleImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        if (errors.image) setErrors((er) => ({ ...er, image: null }));
    };

    /* -------------------------------------------------------------- */
    /*  Submit — POST to store or update                               */
    /* -------------------------------------------------------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const url = isEdit
            ? `${API_BASE}/blog/update/${id}`
            : `${API_BASE}/blog/store`;

        // Backend expects multipart/form-data when an image is uploaded.
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
        if (imageFile) fd.append('image', imageFile);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                    // do NOT set Content-Type — browser sets multipart boundary
                },
                body: fd,
            });

            // Validation errors come back as 422
            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the validation errors below.', 'error');
                return;
            }

            const data = await res.json();

            if (data.success) {
                showToast(
                    isEdit ? 'Blog post updated successfully!' : 'Blog post created successfully!',
                    'success'
                );
                setTimeout(() => navigate('/admin/blog'), 600);
            } else {
                showToast(data.message || 'Failed to save blog post', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
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

    const previewSrc = imagePreview || (currentImage ? `/${currentImage}` : '');

    return (
        <>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <PlusCircle className="text-primary me-2" />
                    {isEdit ? 'Edit Blog Post' : 'Create Blog Post'}
                </h2>
                <Link to="/admin/blog" className="btn btn-outline-secondary">
                    <ArrowLeft className="me-1" /> Back to Blog
                </Link>
            </div>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row">
                            {/* ---------------- Left column ---------------- */}
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label">Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                        value={form.title}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="slug" className="form-label">Slug</label>
                                    <input
                                        type="text"
                                        id="slug"
                                        name="slug"
                                        className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                                        value={form.slug}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="form-text">
                                        URL-friendly version of the title. Auto-generated if left empty.
                                    </div>
                                    {errors.slug && <div className="invalid-feedback">{errors.slug}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="content" className="form-label">Content</label>
                                    <textarea
                                        id="content"
                                        name="content"
                                        rows="12"
                                        className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                                        value={form.content}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.content && <div className="invalid-feedback">{errors.content}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="excerpt" className="form-label">Excerpt</label>
                                    <textarea
                                        id="excerpt"
                                        name="excerpt"
                                        rows="3"
                                        maxLength="500"
                                        className={`form-control ${errors.excerpt ? 'is-invalid' : ''}`}
                                        value={form.excerpt}
                                        onChange={handleChange}
                                    />
                                    <div className="form-text">
                                        Short summary of the blog post. Max 500 characters.
                                    </div>
                                    {errors.excerpt && <div className="invalid-feedback">{errors.excerpt}</div>}
                                </div>
                            </div>

                            {/* ---------------- Right column ---------------- */}
                            <div className="col-md-4">
                                <div className="mb-3">
                                    <label htmlFor="image" className="form-label">Featured Image</label>
                                    <input
                                        type="file"
                                        id="image"
                                        name="image"
                                        accept="image/*"
                                        className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                                        onChange={handleImage}
                                    />
                                    {errors.image && <div className="invalid-feedback">{errors.image}</div>}

                                    {previewSrc && (
                                        <div className="mt-2">
                                            <img
                                                src={previewSrc}
                                                alt="preview"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: 150,
                                                    borderRadius: 4,
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <br />
                                            <small className="text-muted">
                                                {imagePreview ? 'New image preview' : 'Current image'}
                                            </small>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="category" className="form-label">Category</label>
                                    <input
                                        type="text"
                                        id="category"
                                        name="category"
                                        className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                                        value={form.category}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="status" className="form-label">Status</label>
                                    <select
                                        id="status"
                                        name="status"
                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                        value={form.status}
                                        onChange={handleChange}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="meta_title" className="form-label">Meta Title</label>
                                    <input
                                        type="text"
                                        id="meta_title"
                                        name="meta_title"
                                        maxLength="60"
                                        className="form-control"
                                        value={form.meta_title}
                                        onChange={handleChange}
                                    />
                                    <div className="form-text">SEO title (max 60 characters).</div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="meta_description" className="form-label">Meta Description</label>
                                    <textarea
                                        id="meta_description"
                                        name="meta_description"
                                        rows="2"
                                        maxLength="160"
                                        className="form-control"
                                        value={form.meta_description}
                                        onChange={handleChange}
                                    />
                                    <div className="form-text">SEO description (max 160 characters).</div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="meta_keywords" className="form-label">Meta Keywords</label>
                                    <input
                                        type="text"
                                        id="meta_keywords"
                                        name="meta_keywords"
                                        className="form-control"
                                        value={form.meta_keywords}
                                        onChange={handleChange}
                                    />
                                    <div className="form-text">Comma-separated keywords.</div>
                                </div>
                            </div>
                        </div>

                        <div className="text-end">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
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
                                        <Save className="me-1" />
                                        {isEdit ? 'Update Post' : 'Publish Post'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default BlogForm;