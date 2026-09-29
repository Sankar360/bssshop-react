// src/utils/productImage.js
import API_URL from "../api/config";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

/**
 * Resolve a product/variant/blog image path to a full URL.
 *
 * Handles all the shapes the backend returns:
 *   - Full URLs (kept as-is)
 *   - "/storage/uploads/..."  → API_ORIGIN + path
 *   - "storage/uploads/..."   → API_ORIGIN + "/" + path
 *   - "uploads/..."           → API_ORIGIN + "/storage/uploads/..."
 *   - "assets/..."            → API_ORIGIN + "/storage/assets/..."
 *   - "variants/abc.jpg"      → API_ORIGIN + "/storage/variants/abc.jpg"
 */
export function productImage(input) {
    if (!input) return "";

    // Object with image_url or image
    if (typeof input === "object") {
        if (input.image_url) return productImage(input.image_url);
        if (input.image) return productImage(input.image);
        if (input.variant_image) return productImage(input.variant_image);
        return "";
    }

    const path = String(input).trim();
    if (!path) return "";

    // Already absolute
    if (/^https?:\/\//i.test(path)) return path;

    // Absolute path from API: /storage/... or /uploads/...
    if (path.startsWith("/storage/")) return `${API_ORIGIN}${path}`;
    if (path.startsWith("/uploads/")) return `${API_ORIGIN}/storage${path}`;
    if (path.startsWith("/assets/"))  return `${API_ORIGIN}${path}`;

    // Already correct relative "storage/..."
    if (/^storage\//i.test(path)) return `${API_ORIGIN}/${path}`;

    // uploads/... and assets/... live under storage/app/public
    if (/^(uploads|assets)\//i.test(path)) {
        return `${API_ORIGIN}/storage/${path}`;
    }

    // Anything else (e.g. "variants/abc.jpg", "products/xyz.png")
    const clean = path.replace(/^\/+/, "");
    return `${API_ORIGIN}/storage/${clean}`;
}

export const API_ORIGIN_EXPORT = API_ORIGIN;