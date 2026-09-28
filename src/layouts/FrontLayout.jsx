import apiFetch from "../api/apiFetch";
// src/layouts/FrontLayout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/front/layouts/Header';
import Footer from '../components/front/layouts/Footer';
import { showToast } from '../utils/toast';

/**
 * Frontend layout — wraps Header + <main>{children}</main> + Footer.
 * Loads dynamic menus, cart & wishlist counts from the backend.
 */
const FrontLayout = () => {
    const [headerMenus, setHeaderMenus] = useState([]);
    const [footerMenus, setFooterMenus] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userName, setUserName] = useState('');

    /* -------------------------------------------------------------- */
    /*  Initial load: menus + auth status                              */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        // Read cached user (set at login)
        try {
            const cached = JSON.parse(localStorage.getItem('auth_user') || '{}');
            setIsLoggedIn(Boolean(cached?.id));
            setIsAdmin(cached?.role === 'admin');
            setUserName(cached?.name || '');
        } catch {
            /* ignore */
        }

        // Fetch menus
        apiFetch('/menus/frontend', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setHeaderMenus(data.header || data.data?.header || []);
                    setFooterMenus(data.footer || data.data?.footer || []);
                }
            })
            .catch(() => {});

        // Fetch cart + wishlist counts (only if logged in)
        const token = localStorage.getItem('auth_token');
        if (token) {
            apiFetch('/cart/summary', {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) setCartCount(data.cart_count ?? data.count ?? 0);
                })
                .catch(() => {});

            apiFetch('/wishlist/count', {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success)
                        setWishlistCount(data.wishlist_count ?? data.count ?? 0);
                })
                .catch(() => {});
        }
    }, []);

    /* -------------------------------------------------------------- */
    /*  Global "add to cart" delegation — replaces jQuery handler      */
    /*  Any .add-to-cart element anywhere in the tree triggers this.    */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        const handleClick = async (e) => {
            const btn = e.target.closest('.add-to-cart');
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            // Prevent double clicks
            if (btn.dataset.processing === '1') return;
            btn.dataset.processing = '1';

            const productId = btn.dataset.productId;
            const variantId = btn.dataset.variantId || 0;
            const productName = btn.dataset.productName || 'Product';

            if (!productId) {
                showToast('Product ID not found', 'error');
                btn.dataset.processing = '0';
                return;
            }

            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML =
                '<span class="spinner-border spinner-border-sm"></span> Adding...';

            try {
                const res = await apiFetch('/cart/add', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${
                            localStorage.getItem('auth_token') || ''
                        }`,
                    },
                    body: JSON.stringify({
                        product_id: productId,
                        variant_id: variantId,
                        quantity: 1,
                    }),
                });
                const data = await res.json();

                if (data.success) {
                    showToast(`✓ ${productName} added to cart!`, 'success');
                    if (data.cart_count !== undefined) {
                        setCartCount(data.cart_count);
                        document
                            .querySelectorAll('.cart-count, .cart-badge')
                            .forEach((el) => (el.textContent = data.cart_count));
                    }

                    btn.innerHTML = '<i class="bi bi-check-circle"></i> Added!';
                    btn.classList.add('btn-success');
                    btn.classList.remove('btn-primary');

                    setTimeout(() => {
                        btn.innerHTML = '<i class="bi bi-cart3"></i> Add to Cart';
                        btn.classList.remove('btn-success');
                        btn.classList.add('btn-primary');
                        btn.disabled = false;
                        btn.dataset.processing = '0';
                    }, 2000);
                } else {
                    if (data.has_variants && data.out_of_stock) {
                        showToast('No available variants in stock.', 'error');
                    } else if (data.has_variants) {
                        showToast(
                            'Please select a variant on the product page.',
                            'warning'
                        );
                        setTimeout(() => {
                            window.location.href = `/product/${productId}`;
                        }, 1500);
                    } else {
                        showToast(data.message || 'Failed to add to cart', 'error');
                    }
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-cart3"></i> Add to Cart';
                    btn.dataset.processing = '0';
                }
            } catch {
                showToast('Error adding to cart. Please try again.', 'error');
                btn.disabled = false;
                btn.innerHTML = originalHtml;
                btn.dataset.processing = '0';
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    /* -------------------------------------------------------------- */
    /*  Global wishlist toggle — replaces jQuery `.btn-wishlist`       */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        const handleClick = async (e) => {
            const btn = e.target.closest(
                '.btn-wishlist[data-product-id], .wishlist-btn[data-product-id]'
            );
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            const productId = btn.dataset.productId;
            const variantId = btn.dataset.variantId || 0;

            if (!productId) {
                showToast('Product ID not found', 'error');
                return;
            }

            const token = localStorage.getItem('auth_token');
            if (!token) {
                if (
                    confirm(
                        'Please login to add items to your wishlist. Would you like to login now?'
                    )
                ) {
                    window.location.href = '/auth/login';
                }
                return;
            }

            const icon = btn.querySelector('i');
            const isActive = btn.classList.contains('active');

            btn.disabled = true;
            btn.style.opacity = '0.6';

            try {
                const res = await apiFetch('/wishlist/toggle', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        product_id: productId,
                        variant_id: variantId,
                    }),
                });
                const data = await res.json();

                if (data.success) {
                    if (data.action === 'added') {
                        btn.classList.add('active');
                        if (icon) {
                            icon.classList.remove('bi-heart');
                            icon.classList.add('bi-heart-fill');
                            icon.style.color = '#dc3545';
                        }
                        showToast('❤️ Added to wishlist!', 'success');
                    } else {
                        btn.classList.remove('active');
                        if (icon) {
                            icon.classList.remove('bi-heart-fill');
                            icon.classList.add('bi-heart');
                            icon.style.color = '';
                        }
                        showToast('Removed from wishlist', 'info');
                    }

                    if (data.count !== undefined) {
                        setWishlistCount(data.count);
                        document
                            .querySelectorAll(
                                '.wishlist-count, .wishlist-badge, .nav-wishlist-count'
                            )
                            .forEach((el) => {
                                el.textContent = data.count;
                                el.style.display = data.count > 0 ? '' : 'none';
                            });
                    }
                } else {
                    if (data.redirect) {
                        if (
                            confirm(
                                (data.message || 'Please login.') +
                                    ' Would you like to login now?'
                            )
                        ) {
                            window.location.href = data.redirect;
                        }
                        return;
                    }
                    showToast(
                        data.message || 'Something went wrong. Please try again.',
                        'error'
                    );
                }
            } catch {
                showToast('Something went wrong. Please try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    /* -------------------------------------------------------------- */
    /*  Wishlist status sync on page load / route change              */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const timer = setTimeout(() => {
            const items = [];
            document
                .querySelectorAll(
                    '.btn-wishlist[data-product-id], .wishlist-btn[data-product-id]'
                )
                .forEach((btn) => {
                    const productId = parseInt(btn.dataset.productId, 10);
                    const variantId = parseInt(btn.dataset.variantId, 10) || 0;
                    if (!isNaN(productId) && productId > 0) {
                        const exists = items.some(
                            (i) =>
                                i.product_id === productId &&
                                i.variant_id === variantId
                        );
                        if (!exists)
                            items.push({ product_id: productId, variant_id: variantId });
                    }
                });

            if (items.length === 0) return;

            apiFetch('/wishlist/status', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ items }),
            })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success && Array.isArray(data.wishlist)) {
                        data.wishlist.forEach((item) => {
                            const selectors = [
                                `.btn-wishlist[data-product-id="${item.product_id}"][data-variant-id="${item.variant_id}"]`,
                                `.wishlist-btn[data-product-id="${item.product_id}"][data-variant-id="${item.variant_id}"]`,
                            ];
                            for (const sel of selectors) {
                                const btn = document.querySelector(sel);
                                if (btn) {
                                    btn.classList.add('active');
                                    const icon = btn.querySelector('i');
                                    if (icon) {
                                        icon.className = 'bi bi-heart-fill';
                                        icon.style.color = '#dc3545';
                                    }
                                    break;
                                }
                            }
                        });
                    }
                })
                .catch(() => {});
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <>
            <Header
                headerMenus={headerMenus}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                userName={userName}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
            />

            <main>
                <Outlet />
            </main>

            <Footer footerMenus={footerMenus} />
        </>
    );
};

export default FrontLayout;
