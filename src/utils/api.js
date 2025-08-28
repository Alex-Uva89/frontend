// src/utils/api.js

export function authFetch (input, init = {}) {
  const token = (typeof window !== 'undefined' && window.sessionStorage)
    ? window.sessionStorage.getItem('token')
    : null

  const headers = new Headers(init.headers || {})
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}

export async function authFetchJson (input, init = {}) {
  const res = await authFetch(input, init)
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const j = await res.json()
      if (j?.error) msg = j.error
    } catch (e) {
      console.warn(e)
    }
    throw new Error(msg)
  }
  return res.json()
}
