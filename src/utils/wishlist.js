// src/utils/wishlist.js
import { getToken } from './auth';

const authHeaders = () => {
    const token = getToken();
    const h = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
};

/* 0 / undefined / null / "" → null so Laravel's nullable rule applies */
const normalizeVariantId = (variantId) => {
    const n = Number(variantId);
    return !n || n <= 0 ? null : n;
};

export async function toggleWishlist(productId, variantId = 0) {
    const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            product_id: productId,
            variant_id: normalizeVariantId(variantId),
        }),
    });

    if (res.status === 401) {
        return { success: false, unauthenticated: true };
    }

    return res.json();
}

export async function checkWishlistStatus(items) {
    // Normalize variant_id on every item too
    const normalized = items.map((i) => ({
        product_id: i.product_id,
        variant_id: normalizeVariantId(i.variant_id),
    }));

    const res = await fetch('/api/wishlist/status', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ items: normalized }),
    });
    return res.json();
}

export async function getWishlistCount() {
    const res = await fetch('/api/wishlist/count', {
        headers: authHeaders(),
    });
    return res.json();
}