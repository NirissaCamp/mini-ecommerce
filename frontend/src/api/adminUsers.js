const BASE = '/api/admin/users';

async function parseBody(res){
    const text = await res.text();
    try{return JSON.parse(text);} catch {return text;}
}

async function handleResponse(res){
    const data = await parseBody(res);
    if(!res.ok) throw  new Error(data?.message || `${res.status} ${res.statusText}`);
    return data;
}

function authHeader(token){
    return{
        'Content-Type':'application/json',
        Authorization:`Bearer ${token}`,
    };
}

export async function adminListUsers(token, {keyword, status} = {}){
    const params = new URLSearchParams();
    if(keyword) params.set('keyword', keyword);
    if(status)  params.set('status', status);
    const  query = params.toString()? `?${params}` : '';
    const res = await fetch(`${BASE}${query}`, {headers: authHeader(token)});
    return handleResponse(res);
}

export async function adminCreateUser(token, body){
    const res = await fetch(BASE, {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function adminUpdateUser(token, id, body){
    const  res = await fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: authHeader(token),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function adminDeleteUser(token, id){
    const res = await fetch(`${BASE}/${id}`,{
        method:'DELETE',
        headers:authHeader(token),
    });
    if(!res.ok){
        const data = await parseBody(res);
        throw new Error(data?.message || `${res.status} ${res.statusText}`);
    }
}

export async function adminBlacklistUser(token, id, reason){
    const res = await fetch(`${BASE}/${id}/blacklist`, {
        method:'POST',
        headers: autoHeader(token),
        body: JSON.stringify({reason}),
    });
    return handleResponse(res);
}

export async function adminUnblacklistUser(token, id){
    const res = await fetch(`${BASE}/${id}/blacklist`, {
          method: 'DELETE',
          headers: authHeader(token),
      });
      return handleResponse(res);
} 

export async function adminGetAddresses(token, id) {
      const res = await fetch(`${BASE}/${id}/addresses`, { headers: authHeader(token) });
      return handleResponse(res);
  }

  export async function adminGetLoginLogs(token, id) {
      const res = await fetch(`${BASE}/${id}/login-logs`, { headers: authHeader(token) });
      return handleResponse(res);
  }

  export async function adminGetBlacklistHistory(token, id) {
      const res = await fetch(`${BASE}/${id}/blacklist`, { headers: authHeader(token) });
      return handleResponse(res);
  }