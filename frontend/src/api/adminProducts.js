const BASE = '/api/admin/products'

async function parseBody(res) {
    const text = await res.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

async function handleResponse(res) {
    const data = await parseBody(res)
    if (!res.ok) {
        const msg =
            data && typeof data === 'object' && data.message != null
                ? String(data.message)
                : typeof data === 'string'
                    ? data
                    : `${res.status} ${res.statusText}`
        throw new Error(msg)
    }
    return data
}

function authHeader(token) {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
}

export async function adminListProducts(token) {
    const res = await fetch(BASE, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    })
    return handleResponse(res)
}

export async function adminCreateProduct(token, body) {
    const res = await fetch(BASE, {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify(body),
    })
    return handleResponse(res)
}

export async function adminUpdateProduct(token, id, body) {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: authHeader(token),
        body: JSON.stringify(body),
    })
    return handleResponse(res)
}

export async function adminDeleteProduct(token, id) {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 204) return null
    return handleResponse(res)
}

export async function adminAddProductImage(token, productId, body) {
    const res = await fetch(`${BASE}/${productId}/images`, {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify(body),
    })
    return handleResponse(res)
}

export async function adminDeleteProductImage(token, productId, imageId) {
    const res = await fetch(`${BASE}/${productId}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 204) return null
    return handleResponse(res)
}