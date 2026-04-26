const BASE = '/api/admin/inventory'

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
        const err = new Error(msg)
        err.status = res.status      // 关键：把 HTTP 状态码挂到错误对象上
        err.payload = data           // 可选：保留后端完整返回，便于调试
        throw err
    }
    return data
}

function authHeader(token) {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
}

export async function adminListInventory(token, { keyword, lowStock } = {}) {
    const params = new URLSearchParams()
    if (keyword != null) params.append('keyword', keyword)
    if (lowStock != null) params.append('lowStock', lowStock)
    const url = params.toString() ? `${BASE}?${params.toString()}` : BASE
    const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    })
    return handleResponse(res)
}

export async function adminGetInventory(token, productId) {
    const res = await fetch(`${BASE}/${productId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    })
    return handleResponse(res)
}

export async function adminGetMovements(token, productId, page = 0, size = 20) {
    const params = new URLSearchParams()
    params.append('page', page)
    params.append('size', size)
    const res = await fetch(`${BASE}/${productId}/movements?${params.toString()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    })
    return handleResponse(res)
}

export async function adminReceiveStock(token, productId, body) {
    const res = await fetch(`${BASE}/${productId}/receive`, {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify(body),
    })
    return handleResponse(res)
}

export async function adminAdjustStock(token, productId, body) {
    const res = await fetch(`${BASE}/${productId}/adjust`, {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify(body),
    })
    return handleResponse(res)
}
