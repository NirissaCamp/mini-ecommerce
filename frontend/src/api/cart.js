const BASE = '/api/cart';

async function handleResponse(res) {
    if (res.status === 204) return null;
    let data;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) throw new Error(data?.message || `${res.status} ${res.statusText}`);
    return data;
}

function authHeaders(token) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export function getCart(token) {
    return fetch(BASE, { headers: authHeaders(token) }).then(handleResponse);
}

export function addToCart(token, productId, quantity = 1) {
    return fetch(`${BASE}/items`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ productId, quantity }),
    }).then(handleResponse);
}

export function updateCartItem(token, productId, quantity) {
    return fetch(`${BASE}/items/${productId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ quantity }),
    }).then(handleResponse);
}

export function removeCartItem(token, productId) {
    return fetch(`${BASE}/items/${productId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
    }).then(handleResponse);
}

export function clearCart(token) {
    return fetch(BASE, {
        method: 'DELETE',
        headers: authHeaders(token),
    }).then(handleResponse);
}