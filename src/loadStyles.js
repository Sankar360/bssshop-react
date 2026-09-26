// src/loadStyles.js

const ADMIN_STYLES = [
    '/admin/style.css',
];

const BASE_FRONTEND_STYLES = [
    '/css/front/style.css',

];

const PAGE_STYLES = [
    {
        id: 'auth',
        styles: ['/css/front/auth.css'],
        test: (p) => p === '/auth/login' || p === '/auth/register',
    },
    {
        id: 'blog',
        styles: ['/css/front/blog.css'],
        test: (p) => p === '/blog' || p.startsWith('/blog/'),
    },
    {
        id: 'category',
        styles: ['/css/category-overview.css'],
        test: (p) => p === '/category' || p.startsWith('/category/'),
    },
    {
        id: 'product',
        styles: ['/css/product-detail.css'],
        test: (p) => p.startsWith('/product/'),
    },
    {
        id: 'cart',
        styles: ['/css/front/cart.css'],
        test: (p) =>
            p === '/cart' ||
            p === '/checkout' ||
            p === '/checkout/success',
    },
    {
    id: 'checkout',
        styles: [
            '/css/front/cart.css',
            '/css/front/checkout.css',
        ],
        test: (p) =>
            p === '/checkout' ||
            p === '/checkout/success',
    },
    {
        id: 'wishlist',
        styles: ['/css/front/wishlist.css'],
        test: (p) => p === '/wishlist' || p.startsWith('/wishlist/'),
    },
    {
        id: 'orders',
        styles: ['/css/front/orders.css'],
        test: (p) => p === '/orders' || p.startsWith('/orders/'),
    },
    {
        id: 'profile',
        styles: ['/css/front/profile.css'],
        test: (p) => p === '/profile' || p.startsWith('/profile/'),
    },
    {
        id: 'home-animation',
        styles: [
            '/css/character-scene.css',
            '/css/ecommerce-3d.css',
            '/css/ecommerce-animation.css',
            '/css/hero-animation.css',
        ],
        test: (p) => p === '/' || p === '/home',
    },
];

function ensureStylesheet(href, id) {
    return new Promise((resolve) => {
        const existing = document.getElementById(id);

        if (existing) {
            if (existing.dataset.loaded === 'true') {
                resolve();
                return;
            }
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => resolve(), { once: true });
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.id = id;

        link.onload = () => {
            link.dataset.loaded = 'true';
            resolve();
        };
        link.onerror = () => {
            console.warn(`[loadStyles] Failed to load: ${href}`);
            resolve(); // don't block the app
        };

        document.head.appendChild(link);
    });
}

function removeStylesheets(prefix) {
    document
        .querySelectorAll(`link[id^="${prefix}"]`)
        .forEach((el) => el.remove());
}

export async function loadStylesForPath(
    pathname = window.location.pathname
) {
    const isAdmin = pathname.startsWith('/admin');

    // ---------- ADMIN ----------
    if (isAdmin) {
        removeStylesheets('front-style-');

        await Promise.all(
            ADMIN_STYLES.map((href, i) =>
                ensureStylesheet(href, `admin-style-${i}`)
            )
        );

        document.body.classList.add('admin-body');
        return;
    }

    // ---------- FRONTEND ----------
    removeStylesheets('admin-style-');
    document.body.classList.remove('admin-body');

    // 1. Compute required styles + their FINAL ids up front
    const required = [];

    BASE_FRONTEND_STYLES.forEach((href, i) => {
        required.push({ href, id: `front-style-base-${i}` });
    });

    PAGE_STYLES.forEach((page) => {
        if (!page.test(pathname)) return;
        page.styles.forEach((href, i) => {
            required.push({
                href,
                id: `front-style-${page.id}-${i}`,
            });
        });
    });

    const requiredIds = new Set(required.map((r) => r.id));

    // 2. Remove stylesheets that are no longer needed FIRST
    //    (so old + new never coexist → no flash, no wrong cascade)
    document
        .querySelectorAll('link[id^="front-style-"]')
        .forEach((el) => {
            if (!requiredIds.has(el.id)) el.remove();
        });

    // 3. Then load the new ones and wait for them
    await Promise.all(
        required.map(({ href, id }) => ensureStylesheet(href, id))
    );
}