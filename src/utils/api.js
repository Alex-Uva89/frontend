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

// sostituisci la tua funzione con questa:
export async function authFetchJson(url, opts = {}) {
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(localStorage.token ? { Authorization: `Bearer ${localStorage.token}` } : {})
    },
    body: opts.body
  })

  const text = await res.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // risposta non-JSON (tipico dei 404 HTML)
      const short = text.slice(0, 200)
      throw new Error(`HTTP ${res.status} ${res.statusText} – risposta non JSON: ${short}`)
    }
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }

  return data
}
