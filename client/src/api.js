// Live API client — the browser talks ONLY to Express; never to Supabase.
// Base URL is configurable for local dev via client/.env (VITE_API_URL).
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`)
  return payload
}

export const apiGet = (path) => request('GET', path)
export const apiPost = (path, body) => request('POST', path, body)
export const apiPatch = (path, body) => request('PATCH', path, body)
export const apiDelete = (path) => request('DELETE', path)
