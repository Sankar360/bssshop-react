// src/utils/cart.js
import API_URL from "../api/config";
const API_BASE = API_URL;

/**
 * Read the auth token the same way your app does.
 * Adjust the key if your customer login uses a different one
 * (e.g. 'customer_token', 'token').
 */
function getAuthToken() {
    return (
        localStorage.getItem('auth_token') ||
        localStorage.getItem('customer_token') ||
        localStorage.getItem('token') ||
        null
    );
}

/**
 * Add a product (or variant) to the cart.
 *
 * @param {number} productId
 * @param {number} quantity
 * @param {number} variantId  — pass 0 or omit for products without variants
 * @returns {Promise<{success:boolean, message?:string, count?:number, unauthenticated?:boolean}>}
 */
export async function addToCart(productId, quantity = 1, variantId = 0) {
    const token = getAuthToken();

    try {
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };

        // ✅ Sanctum needs the Bearer token, not just cookies
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}/cart/add`, {
            method: 'POST',
            headers,
            credentials: 'include',       // still harmless; keeps session cookies if any
            body: JSON.stringify({
                product_id: productId,
                variant_id: variantId || null,
                quantity,
            }),
        });

        if (res.status === 401) {
            return {
                success: false,
                unauthenticated: true,
                message: 'Please log in.',
            };
        }

        const data = await res.json();
        return {
            success: !!data.success,
            message: data.message,
            count: data.data?.cart_count ?? data.cart_count,
        };
    } catch (err) {
        console.error('addToCart failed', err);
        return { success: false, message: 'Network error' };
    }
}