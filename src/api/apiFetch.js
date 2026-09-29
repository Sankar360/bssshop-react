import API_URL from './config';

const apiFetch = (endpoint, options = {}) => {
    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include',   // ← sends laravel-session cookie
        headers: {
            Accept: 'application/json',
            ...(options.headers || {}),
        },
    });
};

export default apiFetch;