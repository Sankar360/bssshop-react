// src/utils/cart.js
import API_URL from "../api/config";
const API_BASE = API_URL;

function getAuthToken() {
    return (
        localStorage.getItem('auth_token') ||
        localStorage.getItem('customer_token') ||
        localStorage.getItem('token') ||
        null
    );
}

export async function addToCart(productId, quantity = 1, variantId = 0) {
    const token = getAuthToken();

    if (!token) {
        return {
            success: false,
            unauthenticated: true,
            message: 'Please log in.',
        };
    }

    try {
        const res = await fetch(`${API_BASE}/cart/add`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                product_id: Number(productId),
                variant_id: Number(variantId) || 0,
                quantity: Number(quantity) || 1,
            }),
        });

        if (res.status === 401) {
            return { success: false, unauthenticated: true, message: 'Please log in.' };
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