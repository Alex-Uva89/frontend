import { boot } from 'quasar/wrappers'

/**
 * authFetch: come fetch, ma aggiunge automaticamente l'Authorization se c'è un token in sessionStorage
 * e garantisce sempre gli headers come istanza di Headers.
 */
export function authFetch (input, init = {}) {
  // token da sessionStorage (stessa chiave che usi nello store)
  const token = (typeof window !== 'undefined' && window.sessionStorage)
    ? window.sessionStorage.getItem('token')
    : null

  const headers = new Headers(init.headers || {})
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(input, { ...init, headers })
}

export default boot(({ app }) => {
  // opzionale: esponi su app.config.globalProperties per component options API
  app.config.globalProperties.$authFetch = authFetch

  // (facoltativo ma comodo) Monkey-patch globale di window.fetch
  // così TUTTE le chiamate fetch ereditano l’Authorization senza dover cambiare i file uno per uno.
  if (typeof window !== 'undefined' && !window.__fetchPatched) {
    const _origFetch = window.fetch.bind(window)
    window.fetch = (input, init = {}) => {
      const token = window.sessionStorage?.getItem('token')
      if (!token) return _origFetch(input, init)

      const headers = new Headers(init.headers || {})
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return _origFetch(input, { ...init, headers })
    }
    window.__fetchPatched = true
  }
})
