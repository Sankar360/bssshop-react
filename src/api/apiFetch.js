import API_URL from './config';

const apiFetch = (endpoint, options = {}) => {
    return fetch(`${API_URL}${endpoint}`, options);
};

export default apiFetch;
