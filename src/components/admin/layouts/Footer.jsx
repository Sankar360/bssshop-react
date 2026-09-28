import apiFetch from "../../../api/apiFetch";
// src/components/admin/layouts/Footer.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { showToast } from '../../../utils/toast';   // ✅ single source of truth

/* Re-export so legacy imports like:
   import { showToast } from './Footer'
   continue to work. */
export { showToast };

/* ------------------------------------------------------------------ */
/*  Theme helpers                                                      */
/* ------------------------------------------------------------------ */
const THEME_ELEMENTS = {
    sidebar: {
        light: '#2c3e50', dark: '#1a1a2e', blue: '#1a2a4a', green: '#1a3a2a',
    },
    nav: {
        light: '#2c3e50', dark: '#0f0f1a', blue: '#1a2a4a', green: '#1a3a2a',
    },
    card: {
        light: '#ffffff', dark: '#1a1a2e', blue: '#ffffff', green: '#ffffff',
    },
    main: {
        light: '#f8f9fc', dark: '#0f0f1a', blue: '#e8f0fe', green: '#f0faf4',
    },
    text: {
        light: '#6c757d', dark: '#adb5bd', blue: '#6c757d', green: '#6c757d',
    },
    table: {
        light: '#2c3e50', dark: '#e0e0e0', blue: '#1a2a4a', green: '#1a3a2a',
    },
    border: {
        light: '#e3e6f0', dark: '#2d3748', blue: '#c5d5ea', green: '#c5e8d5',
    },
    sidebarLink: {
        light: '#ecf0f1', dark: '#a0aec0', blue: '#ecf0f1', green: '#ecf0f1',
    },
    sidebarSection: {
        light: '#7f8c8d', dark: '#4a5568', blue: '#7f8c8d', green: '#7f8c8d',
    },
    sidebarActive: {
        light: '#3498db', dark: '#0d6efd', blue: '#4a90d9', green: '#4ade80',
    },
    badge: {
        light: '#3498db', dark: '#0d6efd', blue: '#4a90d9', green: '#4ade80',
    },
};

const isSystemDark = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

const pickColor = (map, themeName) => map[themeName] ?? map.light;

/* ------------------------------------------------------------------ */
/*  Footer component                                                   */
/* ------------------------------------------------------------------ */
const Footer = ({
    userTheme = 'light',
    userLanguage = 'en',
    csrfToken = '',
    csrfField = '_token',
    currentPath = '',
    initialFlash = { success: null, error: null, warning: null },
    onThemeChange = null,
    onLanguageChange = null,
}) => {
    const [flash, setFlash] = useState(initialFlash);

    /* -------------------------------------------------------------- */
    /*  applyTheme                                                     */
    /* -------------------------------------------------------------- */
    const applyTheme = useCallback((themeName) => {
        document.body.classList.remove('dark-theme', 'blue-theme', 'green-theme', 'auto-theme');

        switch (themeName) {
            case 'dark':
                document.body.classList.add('dark-theme');
                break;
            case 'blue':
                document.body.classList.add('blue-theme');
                break;
            case 'green':
                document.body.classList.add('green-theme');
                break;
            case 'auto':
                document.body.classList.add('auto-theme');
                if (isSystemDark()) document.body.classList.add('dark-theme');
                break;
            default:
                break;
        }

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            const colors = {
                light: '#f8f9fc', dark: '#0f0f1a', blue: '#1a2a4a', green: '#1a3a2a',
            };
            meta.content = colors[themeName] || '#f8f9fc';
        }

        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.style.background = pickColor(THEME_ELEMENTS.sidebar, themeName);

        const nav = document.querySelector('.admin-nav');
        if (nav) nav.style.background = pickColor(THEME_ELEMENTS.nav, themeName);

        document.querySelectorAll('.card, .stat-card').forEach((card) => {
            card.style.background = pickColor(THEME_ELEMENTS.card, themeName);
        });

        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.style.background = pickColor(THEME_ELEMENTS.main, themeName);

        document.querySelectorAll('.text-muted, .text-dark, .text-body').forEach((el) => {
            el.style.color = pickColor(THEME_ELEMENTS.text, themeName);
        });

        document.querySelectorAll('.table').forEach((t) => {
            t.style.color = pickColor(THEME_ELEMENTS.table, themeName);
        });

        document.querySelectorAll('.dropdown-menu, .modal-content').forEach((el) => {
            el.style.background = pickColor(THEME_ELEMENTS.card, themeName);
        });

        document.querySelectorAll('.form-control, .form-select').forEach((input) => {
            input.style.background = themeName === 'dark' ? '#1a202c' : '#ffffff';
            input.style.color = themeName === 'dark' ? '#e0e0e0' : '#2c3e50';
        });

        document.querySelectorAll('.border, .border-bottom, .border-top').forEach((el) => {
            el.style.borderColor = pickColor(THEME_ELEMENTS.border, themeName);
        });

        document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
            link.style.color = pickColor(THEME_ELEMENTS.sidebarLink, themeName);
        });

        document.querySelectorAll('.sidebar .nav-section').forEach((sec) => {
            sec.style.color = pickColor(THEME_ELEMENTS.sidebarSection, themeName);
        });

        document.querySelectorAll('.badge').forEach((badge) => {
            if (
                !badge.classList.contains('bg-success') &&
                !badge.classList.contains('bg-danger') &&
                !badge.classList.contains('bg-warning') &&
                !badge.classList.contains('bg-info')
            ) {
                badge.style.background = pickColor(THEME_ELEMENTS.badge, themeName);
            }
        });

        localStorage.setItem('user_theme', themeName);
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
    }, []);

    /* -------------------------------------------------------------- */
    /*  updateThemeButtonText                                          */
    /* -------------------------------------------------------------- */
    const updateThemeButtonText = useCallback((themeName) => {
        const btn = document.querySelector('.theme-toggle');
        if (!btn) return;
        const iconMap = { light: 'sun', dark: 'moon', auto: 'display', blue: 'palette', green: 'palette' };
        const icon = iconMap[themeName] || 'palette';
        const display = themeName.charAt(0).toUpperCase() + themeName.slice(1);

        const span = btn.querySelector('span.d-none.d-md-inline');
        const i = btn.querySelector('i');
        if (i) i.className = `bi bi-${icon}`;
        if (span) span.textContent = display;
    }, []);

    /* -------------------------------------------------------------- */
    /*  switchTheme                                                    */
    /* -------------------------------------------------------------- */
    const switchTheme = useCallback(
        async (themeName) => {
            const validThemes = ['light', 'dark', 'auto', 'blue', 'green'];
            if (!validThemes.includes(themeName)) {
                showToast('Invalid theme selected', 'error');
                return;
            }

            const btn = document.querySelector('.theme-toggle');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML =
                    '<i class="bi bi-hourglass-split"></i> <span class="d-none d-md-inline">Applying...</span>';
            }

            applyTheme(themeName);
            document.querySelectorAll('.theme-option').forEach((el) => el.classList.remove('active'));
            document
                .querySelectorAll(`.theme-option[data-theme="${themeName}"]`)
                .forEach((el) => el.classList.add('active'));
            updateThemeButtonText(themeName);

            try {
                const res = await apiFetch('/admin/profile/switch-theme', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({ theme: themeName, [csrfField]: csrfToken }),
                });
                const data = await res.json();
                if (data.success) {
                    const display = themeName.charAt(0).toUpperCase() + themeName.slice(1);
                    showToast(`Theme changed to ${display}`, 'success');
                    if (onThemeChange) onThemeChange(themeName);
                } else {
                    showToast(data.message || 'Failed to change theme', 'error');
                    applyTheme(userTheme);
                    updateThemeButtonText(userTheme);
                }
            } catch (err) {
                console.error('Theme change error:', err);
                showToast('Failed to change theme. Please try again.', 'error');
                applyTheme(userTheme);
                updateThemeButtonText(userTheme);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    updateThemeButtonText(themeName);
                }
            }
        },
        [applyTheme, updateThemeButtonText, csrfToken, csrfField, onThemeChange, userTheme]
    );

    /* -------------------------------------------------------------- */
    /*  changeLanguage                                                 */
    /* -------------------------------------------------------------- */
    const changeLanguage = useCallback(
        async (lang) => {
            const selector = document.getElementById('languageSelector');
            if (selector) selector.disabled = true;

            try {
                const res = await apiFetch('/admin/profile/switch-language', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({ language: lang, [csrfField]: csrfToken }),
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Language changed successfully!', 'success');
                    if (onLanguageChange) onLanguageChange(lang);
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    showToast(data.message || 'Failed to change language', 'error');
                    if (selector) selector.value = userLanguage;
                }
            } catch (err) {
                console.error('Language change error:', err);
                showToast('An error occurred. Please try again.', 'error');
                if (selector) selector.value = userLanguage;
            } finally {
                if (selector) selector.disabled = false;
            }
        },
        [csrfToken, csrfField, userLanguage, onLanguageChange]
    );

    /* -------------------------------------------------------------- */
    /*  Expose helpers globally                                       */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        window.switchTheme = switchTheme;
        window.changeLanguage = changeLanguage;
        window.showToast = showToast;
        return () => {
            delete window.switchTheme;
            delete window.changeLanguage;
            delete window.showToast;
        };
    }, [switchTheme, changeLanguage]);

    /* -------------------------------------------------------------- */
    /*  On mount                                                       */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        // 1. Auto-dismiss alerts
        const alerts = document.querySelectorAll('.alert');
        const alertTimer = setTimeout(() => {
            alerts.forEach((a) => {
                a.style.transition = 'opacity .4s';
                a.style.opacity = '0';
                setTimeout(() => a.remove(), 400);
            });
        }, 5000);

        // 2. Highlight active sidebar parent
        document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
            if (link.classList.contains('active')) {
                const parent = link.closest('.nav-item');
                if (parent) parent.classList.add('active-parent');
            }
        });

        // 3. Badges
        const token = localStorage.getItem('admin_token');
        if (token) {
            apiFetch('/admin/orders/check-updates', {
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                    const badge = document.getElementById('orderBadge');
                    if (!badge) return;
                    if (data?.pending_count > 0) {
                        badge.textContent = data.pending_count;
                        badge.style.display = '';
                    } else {
                        badge.style.display = 'none';
                    }
                })
                .catch(() => {
                    const badge = document.getElementById('orderBadge');
                    if (badge) badge.style.display = 'none';
                });

            apiFetch('/admin/messages/check-updates', {
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                    const badge = document.getElementById('messageBadge');
                    if (!badge) return;
                    if (data?.unread_count > 0) {
                        badge.textContent = data.unread_count;
                        badge.style.display = '';
                    } else {
                        badge.style.display = 'none';
                    }
                })
                .catch(() => {
                    const badge = document.getElementById('messageBadge');
                    if (badge) badge.style.display = 'none';
                });
        }

        // 4. Language selector
        const selector = document.getElementById('languageSelector');
        const handleLangChange = (e) => changeLanguage(e.target.value);
        if (selector) selector.addEventListener('change', handleLangChange);

        // 5. Apply theme
        const storedTheme = localStorage.getItem('user_theme') || userTheme || 'light';
        applyTheme(storedTheme);
        updateThemeButtonText(storedTheme);
        document
            .querySelectorAll(`.theme-option[data-theme="${storedTheme}"]`)
            .forEach((el) => el.classList.add('active'));

        // 6. Auto-theme listener
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = (e) => {
            const current = localStorage.getItem('user_theme') || 'light';
            if (current === 'auto') {
                if (e.matches) document.body.classList.add('dark-theme');
                else document.body.classList.remove('dark-theme');
                applyTheme(current);
            }
        };
        mediaQuery.addEventListener?.('change', handleSystemChange);

        // 7. Ctrl+Shift+D toggle
        const handleKeydown = (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                e.preventDefault();
                const current = localStorage.getItem('user_theme') || 'light';
                switchTheme(current === 'dark' ? 'light' : 'dark');
            }
        };
        document.addEventListener('keydown', handleKeydown);

        // 8. Flash messages
        if (initialFlash.success) showToast(initialFlash.success, 'success');
        if (initialFlash.error) showToast(initialFlash.error, 'error');
        if (initialFlash.warning) showToast(initialFlash.warning, 'warning');

        return () => {
            clearTimeout(alertTimer);
            if (selector) selector.removeEventListener('change', handleLangChange);
            mediaQuery.removeEventListener?.('change', handleSystemChange);
            document.removeEventListener('keydown', handleKeydown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* -------------------------------------------------------------- */
    /*  Global delete handler                                          */
    /* -------------------------------------------------------------- */
    const handleDelete = useCallback(
        async (url, id, name = 'this item') => {
            if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
            try {
                const res = await fetch(`${url}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
                        'X-CSRF-TOKEN': csrfToken,
                    },
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Item deleted successfully', 'success');
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    showToast(data.message || 'Failed to delete item', 'error');
                }
            } catch {
                showToast('An error occurred. Please try again.', 'error');
            }
        },
        [csrfToken]
    );

    useEffect(() => {
        window.deleteItem = handleDelete;
        return () => delete window.deleteItem;
    }, [handleDelete]);

    return null;
};

export default Footer;
