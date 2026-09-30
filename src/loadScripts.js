// src/loadScripts.js

/**
 * Legacy JS bundles — loaded only on pages that need them.
 *
 * Each entry:
 *   - src   : public path to the script
 *   - test  : (pathname) => boolean — whether to load on this page
 *   - id    : unique id, used to dedupe <script> tags
 *
 * NOTE: Only "safe" scripts (pure visual helpers, animations, 3D scene
 * loaders that mount into their own container) should be listed here.
 * Scripts that manipulate React-controlled DOM (e.g. an older
 * `category-overview.js` that writes into `#productGrid` by hand) must
 * NOT be loaded in React. They will fight React and cause flicker.
 */
const SCRIPTS = [
    // ------------------------------------------------------------------
    // Home page — hero animation + 3D product showcase
    // ------------------------------------------------------------------
    {
        id: 'hero-animation',
        src: '/js/hero-animation.js',
        test: (p) => p === '/' || p === '/home',
    },
    {
        id: 'ecommerce-3d',
        src: '/js/ecommerce-3d.js',
        test: (p) => p === '/' || p === '/home',
    },
    {
        id: 'ecommerce-animation',
        src: '/js/ecommerce-animation.js',
        test: (p) => p === '/' || p === '/home',
    },
    {
        id: 'character-loader',
        src: '/js/character-loader.js',
        test: (p) => p === '/' || p === '/home',
    },

    // ------------------------------------------------------------------
    // Product detail page
    // ------------------------------------------------------------------
    {
        id: 'product-detail',
        test: (p) => p.startsWith('/product/'),
    },

    // ------------------------------------------------------------------
    // Category overview — DO NOT load the old jQuery-driven script here.
    // The React component already owns the whole page.
    // ------------------------------------------------------------------
    // {
    //     id: 'category-overview',
    //     src: '/js/category-overview.js',
    //     test: (p) => p.startsWith('/category'),
    // },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function removeScript(id) {
    const el = document.getElementById(id);
    if (el && el.dataset.legacyMounted === 'true') return;
}

function ensureScript({ id, src }, pathname) {
    if (document.getElementById(id)) return;

    // If already loaded (e.g. hot-reload), skip
    const existing = document.querySelector(`script[data-legacy="${id}"]`);
    if (existing) return;

    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.dataset.legacy = id;
    script.async = false; // preserve execution order
    script.onerror = () => {
        console.warn(`[loadScripts] Failed to load ${src}`);
    };
    document.body.appendChild(script);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Load all legacy scripts that match the current pathname.
 * Call this AFTER every navigation, in a useEffect in App.jsx.
 */
export function loadScriptsForPath(pathname = window.location.pathname) {
    // Skip legacy scripts on admin pages — the admin bundle is separate.
    if (pathname.startsWith('/admin')) {
        SCRIPTS.forEach(({ id }) => removeScript(id));
        return;
    }

    SCRIPTS.forEach((entry) => {
        if (entry.test(pathname)) {
            ensureScript(entry, pathname);
        }
    });
}