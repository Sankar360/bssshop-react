// src/components/admin/layouts/Header.jsx
import React, { useState, useEffect } from 'react';                            // ← NEW: useEffect
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Shop, Palette, House, Person, Gear, BoxArrowRight, Speedometer2,
    Image as ImageIcon, People, Cart, Grid, Box, FileText, ListTask,
    Newspaper, QuestionCircle, Envelope, PersonCircle, Sun, Moon,
    Display, CheckCircleFill, CheckCircle, ExclamationCircleFill,
    ExclamationTriangleFill
} from 'react-bootstrap-icons';

const Header = ({
    user = { name: 'Admin', language: 'en', theme: 'light' },
    languages = [],
    themes = [],
    flash = { success: null, error: null, warning: null },
    csrfToken = '',
    favicon = '/favicon.ico',
    appLang = (key) => key,
    children,
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [themeOpen, setThemeOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const currentPath = location.pathname;
    const currentTheme = user.theme || 'light';
    const currentLanguage = user.language || 'en';

    /* ============================================================ */
    /*  Super admin detection                                        */
    /*  Prefers the `user` prop, falls back to localStorage.         */
    /* ============================================================ */
    const isSuperAdmin = (() => {                                             // ← NEW
        if (typeof user?.super_admin !== 'undefined') {
            return Number(user.super_admin) === 1;
        }
        try {
            const cached = JSON.parse(localStorage.getItem('admin_user') || '{}');
            return Number(cached.super_admin) === 1;
        } catch {
            return false;
        }
    })();

    /* Close dropdowns on outside click */                                     // ← NEW
    useEffect(() => {
        const close = () => {
            setUserOpen(false);
            setThemeOpen(false);
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    const currentThemeName = (() => {
        if (themes && themes.length) {
            const found = themes.find((t) => t.name === currentTheme);
            if (found) return found.display_name || found.name;
        }
        const fallback = { light: 'Light', dark: 'Dark', auto: 'Auto', blue: 'Blue', green: 'Green' };
        return fallback[currentTheme] || currentTheme;
    })();

    /* ============================================================ */
    /*  Logout handler                                               */
    /* ============================================================ */
    const handleLogout = async (e) => {
        if (e) e.preventDefault();

        if (loggingOut) return;
        setLoggingOut(true);

        const token = localStorage.getItem('admin_token');

        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
            });
        } catch (err) {
            console.warn('Logout API failed (continuing client-side logout):', err);
        }

        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');

        setUserOpen(false);
        navigate('/admin/login', { replace: true });

        setLoggingOut(false);
    };

    /* ============================================================ */
    /*  Theme / Language                                             */
    /* ============================================================ */
    const switchTheme = (theme) => {
        setThemeOpen(false);
        if (typeof window.switchTheme === 'function') {
            window.switchTheme(theme);
        } else {
            console.warn('switchTheme not ready yet');
        }
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        if (typeof window.changeLanguage === 'function') {
            window.changeLanguage(lang);
        }
    };

    /* ============================================================ */
    /*  Breadcrumbs                                                  */
    /* ============================================================ */
    const buildBreadcrumbs = () => {
        const segments = currentPath.split('/').filter(Boolean);
        const crumbs = [];
        let path = '/admin';

        segments.forEach((segment) => {
            if (segment === 'admin' || !isNaN(segment)) return;
            path += `/${segment}`;
            crumbs.push({
                name: segment.replace(/[-_]/g, ' ').toLowerCase(),
                url: path,
            });
        });

        return crumbs;
    };

    const breadcrumbs = buildBreadcrumbs();
    const totalCrumbs = breadcrumbs.length;

    const themeIcon = (name) => {
        if (name === 'dark') return <Moon />;
        if (name === 'light') return <Sun />;
        if (name === 'auto') return <Display />;
        return <Palette />;
    };

    /* Stop clicks inside dropdowns from closing them */                        // ← NEW
    const stop = (e) => e.stopPropagation();

    return (
        <>
            {/* ================= NAVBAR ================= */}
            <nav className="navbar admin-nav navbar-expand-lg">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/admin/dashboard">
                        <Shop /> BSSShop Admin
                    </Link>
                    <button
                        className="navbar-toggler border-0"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#adminNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="adminNav">
                        <ul className="navbar-nav ms-auto align-items-center">
                            {/* Language Selector */}
                            <li className="nav-item me-3">
                                <div className="language-selector-wrapper">
                                    <select
                                        className="language-selector"
                                        id="languageSelector"
                                        name="language"
                                        value={currentLanguage}
                                        onChange={handleLanguageChange}
                                    >
                                        {languages && languages.length ? (
                                            languages.map((lang) => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.flag || '🌍'} {lang.native_name || lang.name}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="en">🇬🇧 English</option>
                                                <option value="es">🇪🇸 Español</option>
                                                <option value="fr">🇫🇷 Français</option>
                                                <option value="de">🇩🇪 Deutsch</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </li>

                            {/* Theme Dropdown */}
                            <li className="nav-item dropdown me-2">
                                <button
                                    className="btn btn-link nav-link dropdown-toggle theme-toggle"
                                    id="themeDropdown"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setThemeOpen((o) => !o); }}
                                    aria-expanded={themeOpen}
                                    title="Select Theme"
                                >
                                    <Palette />
                                    <span className="theme-label">{currentThemeName}</span>
    <span className="caret" aria-hidden="true" />
                                </button>
                                <ul
                                    className={`dropdown-menu dropdown-menu-end theme-dropdown ${themeOpen ? 'show' : ''}`}
                                    aria-labelledby="themeDropdown"
                                    onClick={stop}
                                >
                                    {(themes && themes.length ? themes : [
                                        { name: 'light', display_name: 'Light' },
                                        { name: 'dark', display_name: 'Dark' },
                                        { name: 'auto', display_name: 'Auto' },
                                        { name: 'blue', display_name: 'Blue' },
                                        { name: 'green', display_name: 'Green' },
                                    ]).map((theme) => (
                                        <li key={theme.name}>
                                            <button
                                                type="button"
                                                className={`dropdown-item theme-option ${currentTheme === theme.name ? 'active' : ''}`}
                                                data-theme={theme.name}
                                                onClick={() => switchTheme(theme.name)}
                                            >
                                                {themeIcon(theme.name)} {theme.display_name}
                                                {theme.is_default === 1 && (
                                                    <span className="badge bg-primary ms-1">Default</span>
                                                )}
                                                {currentTheme === theme.name && (
                                                    <CheckCircleFill className="text-success float-end" />
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </li>

                            <li className="nav-item d-none d-md-block">
                                <Link className="nav-link" to="/">
                                    <House /> {appLang('view_website')}
                                </Link>
                            </li>

                            {/* User Dropdown */}
                            <li className="nav-item dropdown user-dropdown">
                                <button
                                    className="nav-link dropdown-toggle d-flex align-items-center btn btn-link"
                                    id="userDropdown"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setUserOpen((o) => !o); }}
                                    aria-expanded={userOpen}
                                    
                                >
                                    <div
                                        className="avatar-circle bg-primary text-white me-2"
                                        style={{
                                            width: 35,
                                            height: 35,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        {(user.name || 'AD').substring(0, 2).toUpperCase()}
                                    </div>
                                    <span>{user.name}</span>
                                </button>
                                <ul
                                    className={`dropdown-menu dropdown-menu-end ${userOpen ? 'show' : ''}`}
                                    aria-labelledby="userDropdown"
                                    onClick={stop}
                                >
                                    <li>
                                        <Link
                                            className="dropdown-item"
                                            to="/admin/profile"
                                            onClick={() => setUserOpen(false)}
                                        >
                                            <Person /> {appLang('my_profile')}
                                        </Link>
                                    </li>

                                    {/* ✅ Settings item — super admin only */}
                                    {isSuperAdmin && (
                                        <li>
                                            <Link
                                                className="dropdown-item"
                                                to="/admin/settings"
                                                onClick={() => setUserOpen(false)}
                                            >
                                                <Gear /> {appLang('settings')}
                                            </Link>
                                        </li>
                                    )}

                                    <li>
                                        <hr className="dropdown-divider" />
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            className="dropdown-item text-danger"
                                            onClick={handleLogout}
                                            disabled={loggingOut}
                                        >
                                            <BoxArrowRight />{' '}
                                            {loggingOut ? 'Logging out…' : appLang('logout')}
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* ================= SIDEBAR + CONTENT ================= */}
            <div className="container-fluid">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-2 col-lg-2 px-0 sidebar">
                        <ul className="nav flex-column">
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath === '/admin/dashboard' ? 'active' : ''}`}
                                    to="/admin/dashboard"
                                >
                                    <Speedometer2 /> {appLang('dashboard')}
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/home-banner') ? 'active' : ''}`}
                                    to="/admin/home-banner"
                                >
                                    <ImageIcon /> {appLang('home_banner')}
                                </Link>
                            </li>

                            <li className="nav-section">{appLang('management')}</li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/clients') ? 'active' : ''}`}
                                    to="/admin/clients"
                                >
                                    <People /> {appLang('clients')}
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/orders') ? 'active' : ''}`}
                                    to="/admin/orders"
                                >
                                    <Cart /> {appLang('orders')}
                                    <span className="badge bg-danger rounded-pill" id="orderBadge">0</span>
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/features') ? 'active' : ''}`}
                                    to="/admin/features"
                                >
                                    <Grid /> {appLang('features')}
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/product-categories') ? 'active' : ''}`}
                                    to="/admin/product-categories"
                                >
                                    <Grid /> {appLang('product_categories')}
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/products') ? 'active' : ''}`}
                                    to="/admin/products"
                                >
                                    <Box /> {appLang('products')}
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/invoices') ? 'active' : ''}`}
                                    to="/admin/invoices"
                                >
                                    <FileText /> {appLang('invoice')}
                                </Link>
                            </li>

                            <li className="nav-section">{appLang('content')}</li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/menus') ? 'active' : ''}`}
                                    to="/admin/menus"
                                >
                                    <ListTask /> Header / Footer Menu
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/blog') ? 'active' : ''}`}
                                    to="/admin/blog"
                                >
                                    <Newspaper /> {appLang('blog')}
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/faqs') ? 'active' : ''}`}
                                    to="/admin/faqs"
                                >
                                    <QuestionCircle /> {appLang('faq')}
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/messages') ? 'active' : ''}`}
                                    to="/admin/messages"
                                >
                                    <Envelope /> {appLang('contact_messages')}
                                    <span className="badge bg-danger rounded-pill" id="messageBadge">0</span>
                                </Link>
                            </li>

                            <li className="nav-section">{appLang('system')}</li>

                            {/* ✅ Settings link — super admin only */}
                            {isSuperAdmin && (
                                <li className="nav-item">
                                    <Link
                                        className={`nav-link ${currentPath.includes('/admin/settings') ? 'active' : ''}`}
                                        to="/admin/settings"
                                    >
                                        <Gear /> {appLang('settings')}
                                    </Link>
                                </li>
                            )}

                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${currentPath.includes('/admin/profile') ? 'active' : ''}`}
                                    to="/admin/profile"
                                >
                                    <PersonCircle /> {appLang('profile')}
                                </Link>
                            </li>

                            <li className="nav-item mt-3">
                                <Link className="nav-link" to="/">
                                    <House /> {appLang('view_website')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-10 col-lg-10 main-content">
                        {/* Breadcrumb */}
                        <nav aria-label="breadcrumb" className="page-breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <Link to="/admin/dashboard">{appLang('dashboard')}</Link>
                                </li>
                                {breadcrumbs.map((item, index) => (
                                    <li
                                        key={item.url}
                                        className={`breadcrumb-item ${index === totalCrumbs - 1 ? 'active' : ''}`}
                                    >
                                        {index !== totalCrumbs - 1 ? (
                                            <Link to={item.url}>{appLang(item.name)}</Link>
                                        ) : (
                                            appLang(item.name)
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        {/* Flash Messages */}
                        {flash.success && (
                            <div className="alert alert-success alert-dismissible fade show" role="alert">
                                <CheckCircle className="me-2" /> {flash.success}
                                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        )}
                        {flash.error && (
                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                <ExclamationCircleFill className="me-2" /> {flash.error}
                                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        )}
                        {flash.warning && (
                            <div className="alert alert-warning alert-dismissible fade show" role="alert">
                                <ExclamationTriangleFill className="me-2" /> {flash.warning}
                                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Header;