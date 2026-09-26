// src/pages/front/blog/BlogDetail.jsx

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const API_BASE = '/api';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const imageUrl = (path) => {
    if (!path) return '';

    if (/^https?:\/\//i.test(path)) return path;

    if (path.startsWith('/')) return path;

    if (/^storage\//i.test(path)) {
        return `/${path}`;
    }

    if (/^(uploads|assets)\//i.test(path)) {
        return `/${path}`;
    }

    return `/storage/${path.replace(/^\/+/, '')}`;
};

const formatDate = (s) => {
    if (!s) return '';

    return new Date(s).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

/* ================================================================== */
/* BLOG DETAIL                                                        */
/* ================================================================== */

const BlogDetail = () => {
    const { id } = useParams();

    const [blog, setBlog] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    /* -------------------------------------------------------------- */
    /* Current URL — used by share buttons                            */
    /* -------------------------------------------------------------- */

    const currentUrl =
        typeof window !== 'undefined' ? window.location.href : '';

    /* -------------------------------------------------------------- */
    /* Fetch blog detail                                              */
    /* -------------------------------------------------------------- */

    useEffect(() => {
        const fetchBlogDetail = async () => {
            setLoading(true);

            try {
                const res = await fetch(`${API_BASE}/blog/${id}`, {
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error(`HTTP error: ${res.status}`);
                }

                const data = await res.json();

                if (data.success && data.data) {
                    setBlog(data.data.blog);
                    setRelatedPosts(data.data.related_posts ?? []);
                } else {
                    setBlog(null);
                    setRelatedPosts([]);
                }
            } catch (err) {
                console.error('Blog detail fetch failed:', err);
                setBlog(null);
                setRelatedPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogDetail();
    }, [id]);

    /* -------------------------------------------------------------- */
    /* Loading state                                                   */
    /* -------------------------------------------------------------- */

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">
                        Loading...
                    </span>
                </div>
            </div>
        );
    }

    /* -------------------------------------------------------------- */
    /* Blog not found                                                  */
    /* -------------------------------------------------------------- */

    if (!blog) {
        return (
            <div className="container py-5 text-center">
                <i
                    className="bi bi-newspaper text-muted"
                    style={{ fontSize: '4rem' }}
                ></i>

                <h3 className="mt-3">
                    Blog post not found
                </h3>

                <Link
                    to="/blog"
                    className="btn btn-secondary mt-3"
                >
                    <i className="bi bi-arrow-left"></i>{' '}
                    Back to Blog
                </Link>
            </div>
        );
    }

    /* -------------------------------------------------------------- */
    /* Share URLs                                                      */
    /* -------------------------------------------------------------- */

    const shareFb =
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            currentUrl
        )}`;

    const shareTw =
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            currentUrl
        )}&text=${encodeURIComponent(blog.title)}`;

    const shareLi =
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            currentUrl
        )}`;

    const shareMail =
        `mailto:?subject=${encodeURIComponent(
            blog.title
        )}&body=${encodeURIComponent(currentUrl)}`;

    /* -------------------------------------------------------------- */
    /* Render                                                          */
    /* -------------------------------------------------------------- */

    return (
        <div className="container py-5">
            <div className="row">
                <div className="col-lg-8 mx-auto">

                    {/* Blog Header */}

                    <div className="mb-4">
                        <div className="d-flex gap-2 mb-3">

                            <span className="badge bg-primary">
                                {blog.category
                                    ? blog.category.charAt(0).toUpperCase() +
                                      blog.category.slice(1)
                                    : ''}
                            </span>

                            <span className="badge bg-secondary">
                                {formatDate(blog.created_at)}
                            </span>

                        </div>

                        <h1 className="display-5 fw-bold">
                            {blog.title}
                        </h1>

                        <p className="text-muted">
                            <i className="bi bi-person"></i>{' '}
                            {blog.author ?? 'Admin'} |{' '}

                            <i className="bi bi-eye"></i>{' '}
                            {Number(blog.views ?? 0).toLocaleString(
                                'en-IN'
                            )}{' '}
                            views
                        </p>
                    </div>

                    {/* Featured Image */}

                    {blog.image && (
                        <div className="mb-4">
                            <img
                                src={imageUrl(blog.image)}
                                className="img-fluid rounded"
                                alt={blog.title}
                                style={{
                                    width: '100%',
                                    maxHeight: '400px',
                                    objectFit: 'cover',
                                }}
                            />
                        </div>
                    )}

                    {/* Blog Content */}

                    <div
                        className="blog-content"
                        dangerouslySetInnerHTML={{
                            __html: blog.content ?? '',
                        }}
                    />

                    {/* Share Buttons */}

                    <div className="mt-5 pt-3 border-top">
                        <h6>Share this post:</h6>

                        <div className="d-flex gap-2 flex-wrap">

                            <a
                                href={shareFb}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary btn-sm"
                            >
                                <i className="bi bi-facebook"></i>{' '}
                                Facebook
                            </a>

                            <a
                                href={shareTw}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-info btn-sm"
                            >
                                <i className="bi bi-twitter"></i>{' '}
                                Twitter
                            </a>

                            <a
                                href={shareLi}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary btn-sm"
                            >
                                <i className="bi bi-linkedin"></i>{' '}
                                LinkedIn
                            </a>

                            <a
                                href={shareMail}
                                className="btn btn-outline-secondary btn-sm"
                            >
                                <i className="bi bi-envelope"></i>{' '}
                                Email
                            </a>

                        </div>
                    </div>

                    {/* Related Posts */}

                    {relatedPosts.length > 0 && (
                        <div className="mt-5 pt-3 border-top">
                            <h5 className="mb-3">
                                Related Posts
                            </h5>

                            <div className="row">
                                {relatedPosts.map((related) => (
                                    <div
                                        className="col-md-4 mb-3"
                                        key={related.id}
                                    >
                                        <div className="card h-100">

                                            {related.image && (
                                                <img
                                                    src={imageUrl(
                                                        related.image
                                                    )}
                                                    className="card-img-top"
                                                    alt={related.title}
                                                    style={{
                                                        height: '150px',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            )}

                                            <div className="card-body">
                                                <h6 className="card-title">
                                                    {related.title}
                                                </h6>

                                                <Link
                                                    to={`/blog/${related.id}`}
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    Read More
                                                </Link>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Back Button */}

                    <div className="mt-4">
                        <Link
                            to="/blog"
                            className="btn btn-secondary"
                        >
                            <i className="bi bi-arrow-left"></i>{' '}
                            Back to Blog
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BlogDetail;

