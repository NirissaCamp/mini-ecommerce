const BASE = '/api/user/profile';

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

export async function getProfile(token) {
    const res = await fetch(BASE, { headers: authHeader(token) });
    return handleResponse(res);
}

export async function updateProfile(token, body) {
    const res = await fetch(BASE, {
        method: 'PUT',
        headers: authHeader(token),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function changePassword(token, body) {
    const res = await fetch(`${BASE}/password`, {
        method: 'PUT',
        headers: authHeader(token),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}