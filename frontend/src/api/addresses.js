const BASE = '/api/user/addresses';

async function parseBody(res) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
}

async function handleResponse(res) {
    const data = await parseBody(res);
    if (!res.ok) throw new Error(data?.message || `${res.status} ${res.statusText}`);
    return data;
}

function authHeader(token) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function listAddresses(token) {
    const res = await fetch(BASE, { headers: authHeader(token) });
    return handleResponse(res);
}

export async function addAddress(token, body) {
    const res = await fetch(BASE, { method: 'POST', headers: authHeader(token), body: JSON.stringify(body) });
    return handleResponse(res);
}

export async function updateAddress(token, id, body) {
    const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(body) });
    return handleResponse(res);
}

export async function deleteAddress(token, id) {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeader(token) });
    if (!res.ok) { const d = await parseBody(res); throw new Error(d?.message || `${res.status}`); }
}

export async function setDefaultAddress(token, id) {
    const res = await fetch(`${BASE}/${id}/default`, { method: 'PUT', headers: authHeader(token) });
    return handleResponse(res);
}