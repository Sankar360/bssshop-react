import apiFetch from "../../../api/apiFetch";
// src/components/admin/layouts/AdminLayout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { showToast } from "../../../utils/toast";
import Header from './Header';
import Footer from './Footer';

const translations = {
    dashboard: 'Dashboard',
    home_banner: 'Home Banner',
    management: 'Management',
    clients: 'Clients',
    orders: 'Orders',
    features: 'Features',
    product_categories: 'Product Categories',
    products: 'Products',
    invoice: 'Invoice',
    content: 'Content',
    blog: 'Blog',
    faq: 'FAQ',
    contact_messages: 'Contact Messages',
    system: 'System',
    settings: 'Settings',
    profile: 'Profile',
    view_website: 'View Website',
    my_profile: 'My Profile',
    logout: 'Logout',
};

const appLang = (key) => translations[key] || key;

const AdminLayout = () => {
    const location = useLocation();
    const [user, setUser] = useState({ name: 'Admin', language: 'en', theme: 'light' });
    const [themes, setThemes] = useState([]);
    const [languages, setLanguages] = useState([]);

    // Load user from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('admin_user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser({
                    name: parsed.name || 'Admin',
                    language: parsed.language || 'en',
                    theme: parsed.theme || 'light',
                });
            } catch {/* ignore */}
        }
    }, []);

    // Fetch themes + languages (optional)
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };

        apiFetch('/admin/profile/themes', { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.success && setThemes(d.data || []))
            .catch(() => {});

        apiFetch('/admin/profile/languages', { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.success && setLanguages(d.data || []))
            .catch(() => {});
    }, []);

    // Apply theme to <body>
    useEffect(() => {
        document.body.className = user.theme === 'dark' ? 'dark-theme' : '';
    }, [user.theme]);

    // Persist theme changes
    const handleThemeChange = (newTheme) => {
        setUser((u) => ({ ...u, theme: newTheme }));
        const stored = JSON.parse(localStorage.getItem('admin_user') || '{}');
        localStorage.setItem('admin_user', JSON.stringify({ ...stored, theme: newTheme }));
    };

    return (
        <>
            <Header
                user={user}
                languages={languages}
                themes={themes}
                appLang={appLang}
                flash={{ success: null, error: null, warning: null }}
                csrfToken={document.querySelector('meta[name="csrf-token"]')?.content || ''}
            >
                {/* Content column — lives beside the sidebar inside Header's row */}
                <div className="col-md-10 col-lg-12 main-content">
                    <Outlet />
                </div>
            </Header>

            <Footer
                userTheme={user.theme}
                userLanguage={user.language}
                csrfToken={document.querySelector('meta[name="csrf-token"]')?.content || ''}
                currentPath={location.pathname}
                onThemeChange={handleThemeChange}
            />
        </>
    );
};

export default AdminLayout;
