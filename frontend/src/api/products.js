const BASE = '/api/products';

async function handleResponse(res) {
    let data;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) throw new Error(data?.message || `${res.status} ${res.statusText}`);
    return data;
}

export function getProducts() {
    return fetch(BASE).then(handleResponse);
}

export function getProduct(id) {
    return fetch(`${BASE}/${id}`).then(handleResponse);
}