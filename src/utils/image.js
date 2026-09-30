// src/utils/image.js
import API_URL from "../api/config";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
const PLACEHOLDER = "/assets/images/default-product.jpg";

export function imageUrl(input) {
    if (input && typeof input === "object") {
        if (input.image_url) return imageUrl(input.image_url);
        if (input.image) return imageUrl(input.image);
    }

    const path = String(input ?? "").trim();
    if (!path) return PLACEHOLDER;
    if (/^https?:\/\//i.test(path)) return path;

    const clean = path.replace(/^\/+/, "");

    if (/^storage\//i.test(clean)) return `${API_ORIGIN}/${clean}`;
    if (/^(uploads|assets)\//i.test(clean)) return `${API_ORIGIN}/storage/${clean}`;
    return `${API_ORIGIN}/storage/${clean}`;
}

export default imageUrl;