// api 表示「和后端通信」；auth 表示认证相关。
// Why: Keeps HTTP details in one place (api) and scoped by domain (auth).

const BASE = '/api/auth';

/**
 * 解析响应体：尽量 JSON，否则返回原文。
 * Parse body: JSON if possible, else raw text.
 */
async function parseBody(res){
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/**
 * 统一处理：非 2xx 抛错，便于页面 try/catch。
 * Non-2xx → throw Error for try/catch in UI.
 */

async function handleResponse(res) {
    const data = await parseBody(res);
    if (!res.ok) {
        const firstError =
            Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors[0]
                : null;

        const msg =
            firstError?.defaultMessage
                ? String(firstError.defaultMessage)
                : data && typeof data === 'object' && data.message != null
                    ? String(data.message)
                    : typeof data === 'string'
                        ? data
                        : `${res.status} ${res.statusText}`;
        throw new Error(msg);
    }
    return data;
}

/**
 * POST /api/auth/register
 * body: { username, password }
 */
export async function register(body){
    const res = await fetch(`${BASE}/register`,{
                                                                        method: "POST",
                                                                        headers: {'Content-Type': 'application/json'},
                                                                        body: JSON.stringify(body),
                                                                      })
    return handleResponse(res)
}

/**
 * POST /api/auth/login
 * body: { username, password }
 */
export async function login(body) {
    const res = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

/**
 * GET /api/auth/me
 * token: JWT 字符串（不要带 "Bearer " 前缀）
 * token: raw JWT string (no "Bearer " prefix)
 */
export async function getMe(token) {
    const res = await fetch(`${BASE}/me`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return handleResponse(res);
}