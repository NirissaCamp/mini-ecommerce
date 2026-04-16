const BASE = '/api/admin/users';
const ROLES_BASE = '/api/admin/roles';

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
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function adminListUsers(token, { keyword, status } = {}) {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (status)  params.set('status', status);
    const query = params.toString() ? `?${params}` : '';
    return handleResponse(await fetch(`${BASE}${query}`, { headers: authHeader(token) }));
}

export async function adminCreateUser(token, body) {
    return handleResponse(await fetch(BASE, {
        method: 'POST', headers: authHeader(token), body: JSON.stringify(body),
    }));
}

export async function adminUpdateUser(token, id, body) {
    return handleResponse(await fetch(`${BASE}/${id}`, {
        method: 'PUT', headers: authHeader(token), body: JSON.stringify(body),
    }));
}

export async function adminDeleteUser(token, id) {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeader(token) });
    if (!res.ok) { const data = await parseBody(res); throw new Error(data?.message || `${res.status}`); }
}

// ── Blacklist ────────────────────────────────────────────────────────────────

export async function adminBlacklistUser(token, id, reason) {
    return handleResponse(await fetch(`${BASE}/${id}/blacklist`, {
        method: 'POST', headers: authHeader(token), body: JSON.stringify({ reason }),
    }));
}

export async function adminUnblacklistUser(token, id) {
    return handleResponse(await fetch(`${BASE}/${id}/blacklist`, {
        method: 'DELETE', headers: authHeader(token),
    }));
}

// ── Sub-resources ─────────────────────────────────────────────────────────────

export async function adminGetAddresses(token, id) {
    return handleResponse(await fetch(`${BASE}/${id}/addresses`, { headers: authHeader(token) }));
}

export async function adminGetLoginLogs(token, id) {
    return handleResponse(await fetch(`${BASE}/${id}/login-logs`, { headers: authHeader(token) }));
}

export async function adminGetBlacklistHistory(token, id) {
    return handleResponse(await fetch(`${BASE}/${id}/blacklist`, { headers: authHeader(token) }));
}

export async function adminGetOperationLogs(token, id) {
    return handleResponse(await fetch(`${BASE}/${id}/operation-logs`, { headers: authHeader(token) }));
}

// ── Global logs ───────────────────────────────────────────────────────────────

export async function adminGetAllOperationLogs(token) {
    return handleResponse(await fetch(`${BASE}/operation-logs`, { headers: authHeader(token) }));
}

export async function adminGetAllLoginLogs(token) {
    return handleResponse(await fetch(`${BASE}/login-logs`, { headers: authHeader(token) }));
}

export async function adminGetAllBlacklist(token) {
    return handleResponse(await fetch(`${BASE}/blacklist`, { headers: authHeader(token) }));
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function adminListRoles(token) {
    return handleResponse(await fetch(ROLES_BASE, { headers: authHeader(token) }));
}

export async function adminCreateRole(token, roleName, description, isAdminRole) {
    return handleResponse(await fetch(ROLES_BASE, {
        method: 'POST', headers: authHeader(token), body: JSON.stringify({ roleName, description, isAdminRole }),
    }));
}

export async function adminUpdateRole(token, id, roleName, description, isAdminRole) {
    return handleResponse(await fetch(`${ROLES_BASE}/${id}`, {
        method: 'PUT', headers: authHeader(token), body: JSON.stringify({ roleName, description, isAdminRole }),
    }));
}

export async function adminDeleteRole(token, id) {
    const res = await fetch(`${ROLES_BASE}/${id}`, { method: 'DELETE', headers: authHeader(token) });
    if (!res.ok) { const data = await parseBody(res); throw new Error(data?.message || `${res.status}`); }
}

export async function adminAddUserToRole(token, roleId, userId) {
    return handleResponse(await fetch(`${ROLES_BASE}/${roleId}/users/${userId}`, {
        method: 'POST', headers: authHeader(token),
    }));
}

export async function adminRemoveUserFromRole(token, roleId, userId) {
    return handleResponse(await fetch(`${ROLES_BASE}/${roleId}/users/${userId}`, {
        method: 'DELETE', headers: authHeader(token),
    }));
}

export async function adminAddPermissionToRole(token, roleId, permissionCode) {
    return handleResponse(await fetch(`${ROLES_BASE}/${roleId}/permissions/${permissionCode}`, {
        method: 'POST', headers: authHeader(token),
    }));
}

export async function adminRemovePermissionFromRole(token, roleId, permissionCode) {
    return handleResponse(await fetch(`${ROLES_BASE}/${roleId}/permissions/${permissionCode}`, {
        method: 'DELETE', headers: authHeader(token),
    }));
}
