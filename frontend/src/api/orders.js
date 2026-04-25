const ORDERS_BASE = '/api/orders'
const CHECKOUT_URL = '/api/checkout'

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

export function listOrders(token, status){
    const url = status ? `${ORDERS_BASE}?status=${encodeURIComponent(status)}` : ORDERS_BASE
    return fetch(url, { headers: authHeaders(token) }).then(handleResponse)
}

export function getOrder(token, orderId){
    return fetch(`${ORDERS_BASE}/${orderId}`, {headers: authHeaders(token)}).then(handleResponse)
}

export function checkout(token){
    return fetch(CHECKOUT_URL, {method: 'POST', headers: authHeaders(token) }).then(handleResponse)
}

export function createReturn(token, orderId, body) {
    return fetch(`${ORDERS_BASE}/${orderId}/returns`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(body),
    }).then(handleResponse)
}

export function payOrder(token, orderId) {
    return fetch(`${ORDERS_BASE}/${orderId}/pay`, {
        method: 'POST',
        headers: authHeaders(token),
    }).then(handleResponse)
}