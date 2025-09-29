const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'

export async function fetchSiteStrings(locale) {
  const r = await fetch(`${API_BASE}/content/${locale}`)
  if (!r.ok) throw new Error(`Fetch ${locale} failed: ${r.status}`)
  return r.json()
}

export async function saveSiteStrings(locale, data) {
  const r = await fetch(`${API_BASE}/content/${locale}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error(`Save ${locale} failed: ${r.status}`)
  return r.json()
}
