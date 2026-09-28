// src/pages/front/blog/BlogList.jsx
import React, { useEffect, useState } from 'react';
import API_URL from "../../../api/config";
import { Link } from 'react-router-dom';

const API_BASE = API_URL;

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");


const imageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return `${API_ORIGIN}${path}`;
    if (/^storage\//i.test(path)) return `${API_ORIGIN}/${path}`;
    if (/^(uploads|assets)\//i.test(path)) return `${API_ORIGIN}/${path}`;
    return `${API_ORIGIN}/storage/${path.replace(/^\/+/, '')}`;
};
const formatDate = (s) => {
    if (!s) return '';
    return new Date(s).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

const excerpt = (blog, length = 100) => {
    const raw = blog.excerpt || blog.content || '';
    const text = String(raw).replace(/<[^>]+>/g, '');
    return text.length > length ? text.substring(0, length) + '...' : text;
};

/* ================================================================== */
/*  BLOG LIST                                                          */
/* ================================================================== */
const BlogList = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    /* -------------------------------------------------------------- */
    /*  Fetch blog posts                                               */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/blog`, {
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();

                if (data.success) {
                    const payload = data.data || data;
                    setBlogs(payload.posts ?? payload.blogs ?? []);
                }
            } catch (err) {
                console.error('Blog fetch failed', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* -------------------------------------------------------------- */
    /*  Client-side search filter                                      */
    /*  (CI4 used jQuery on #blogSearch — same behaviour here)         */
    /* -------------------------------------------------------------- */
    const filteredBlogs = search.trim()
        ? blogs.filter((b) => {
              const haystack = `${b.title} ${b.excerpt ?? ''} ${b.content ?? ''}`.toLowerCase();
              return haystack.includes(search.trim().toLowerCase());
          })
        : blogs;

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <div className="container py-5">
            <div className="row mb-4">
                <div className="col-md-8">
                    <h1>Our Blog</h1>
                    <p className="text-muted">
                        Latest news, tips, and updates from BSSShop
                    </p>
                </div>
                <div className="col-md-4">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search blog..."
                            id="blogSearch"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="btn btn-primary" type="button">
                            <i className="bi bi-search"></i>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : filteredBlogs.length > 0 ? (
                <div className="row">
                    {filteredBlogs.map((blog) => (
    <div className="col-md-4 mb-4" key={blog.id}>
        <Link
            to={`/blog/${blog.id}`}
            className="blog-card-link"
        >
            <div className="card h-100 blog-card">
                {blog.image ? (
                    <img
                        src={imageUrl(blog.image)}
                        className="card-img-top"
                        alt={blog.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                    />
                ) : (
                    <img
                        src={`https://via.placeholder.com/400x250/667eea/ffffff?text=${encodeURIComponent(
                            blog.title
                        )}`}
                        className="card-img-top"
                        alt={blog.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                    />
                )}

                <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                        <span className="badge bg-primary">
                            {blog.category
                                ? blog.category.charAt(0).toUpperCase() +
                                  blog.category.slice(1)
                                : ''}
                        </span>
                        <small className="text-muted">
                            {formatDate(blog.created_at)}
                        </small>
                    </div>
                    <h5 className="card-title">{blog.title}</h5>
                    <p className="card-text text-muted">{excerpt(blog)}</p>

                    <div className="d-flex justify-content-between align-items-center">
                        <span className="btn btn-outline-primary btn-sm">
                            Read More
                        </span>
                        <small className="text-muted">
                            <i className="bi bi-eye"></i>{' '}
                            {Number(blog.views ?? 0).toLocaleString('en-IN')}
                        </small>
                    </div>
                </div>
            </div>
        </Link>
    </div>
))}
                </div>
            ) : (
                <div className="text-center py-5">
                    <i
                        className="bi bi-newspaper text-muted"
                        style={{ fontSize: '4rem' }}
                    ></i>
                    <h3 className="mt-3">No blog posts found</h3>
                    <p className="text-muted">Check back later for new articles.</p>
                </div>
            )}
        </div>
    );
};

export default BlogList;