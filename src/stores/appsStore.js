import { defineStore } from 'pinia'
import { useUsersStore } from 'src/stores/usersStore'

// Stati possibili (coerenti col backend/Sanity)
export const APP_STATUS = {
  ATTIVA: 'attiva',
  IN_ARRIVO: 'in_arrivo',
  IN_AGGIORNAMENTO: 'in_aggiornamento',
}

// ---- utils interne ----
function localizeField(obj, locale = 'it') {
  if (!obj) return ''
  if (obj[locale]) return obj[locale]
  if (obj.it) return obj.it
  if (obj.en) return obj.en
  if (obj.fr) return obj.fr
  return ''
}

function localizeAppTexts(app, locale = 'it') {
  return {
    title: localizeField(app.title, locale) || '(senza titolo)',
    shortDescription: localizeField(app.shortDescription, locale) || ''
  }
}

function isUserAllowed(app, { role, email, id }) {
  const rolesAllowed = app.rolesAllowed || []
  const usersAllowed = app.usersAllowed || []
  const inRole = rolesAllowed.length > 0
    ? rolesAllowed.includes(String(role || '').toLowerCase())
    : false
  const inUsers = usersAllowed.includes(email) || usersAllowed.includes(id)
  return inRole || inUsers
}

function isBusinessAllowed(app, businessId) {
  const list = app.businessesAllowed || []
  if (!list.length) return true
  return list.includes(businessId)
}

function isAppClickable(app, { role, email, id, businessId }) {
  if (app.status === APP_STATUS.IN_ARRIVO) return false
  if (!isUserAllowed(app, { role, email, id })) return false
  if (!isBusinessAllowed(app, businessId)) return false
  return true
}

function computeBadge(app) {
  if (app.status === APP_STATUS.IN_ARRIVO) return 'In arrivo'
  if (app.status === APP_STATUS.IN_AGGIORNAMENTO) return 'In aggiornamento'
  if (app.isNew && app.status === APP_STATUS.ATTIVA) return 'Nuovo'
  return null
}

// Cache opzionale in memoria per evitare refetch continui
let _appsCache = null

export const useAppsStore = defineStore('appsStore', {
  state: () => ({
    apps: [],
    loading: false,
    error: null,
    lastLoadedAt: null,
  }),

  getters: {
    /**
     * Apps arricchite (testi localizzati, badge, fallback icona)
     */
    enrichedApps: (state) => {
      return (ctx = {}) => {
        const { locale = 'it' } = ctx
        return (state.apps || []).map(app => {
          const texts = localizeAppTexts(app, locale)
          const badge = computeBadge(app)
          const hasLogo = Boolean(app.logoUrl)
          const iconToUse = hasLogo ? null : (app.iconName || 'apps')
          return { ...app, ...texts, badge, hasLogo, iconToUse }
        })
      }
    },

    /**
     * Apps + flag clickabilità per l'utente corrente
     */
    availabilityForUser: (state) => {
      return (userCtx = {}) => {
        const { locale = 'it' } = userCtx
        return (state.apps || []).map(app => {
          const texts = localizeAppTexts(app, locale)
          const clickable = isAppClickable(app, userCtx)
          const badge = computeBadge(app)
          return { ...app, ...texts, clickable, disabled: !clickable, badge }
        })
      }
    },
  },

  actions: {
    /**
     * Fetch dal backend: GET {VITE_API_URL}/apps
     * Richiede (opzionale) Authorization: Bearer <token>
     */
    async fetchApps(opts = {}) {
      const { force = false } = opts
      try {
        this.loading = true
        this.error = null

        if (!force && _appsCache) {
          this.apps = _appsCache
          this.lastLoadedAt = new Date().toISOString()
          this.loading = false
          return
        }

        const usersStore = useUsersStore()
        const token = usersStore.token
        const apiBase = import.meta.env.VITE_API_URL

        const res = await fetch(`${apiBase}/apps`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include'
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `HTTP ${res.status}`)
        }

        const data = await res.json()

        // Normalizza gli array per sicurezza
        const normalized = (data || []).map(a => ({
          ...a,
          rolesAllowed: a.rolesAllowed || [],
          usersAllowed: a.usersAllowed || [],
          businessesAllowed: a.businessesAllowed || [],
        }))

        this.apps = normalized
        _appsCache = normalized
        this.lastLoadedAt = new Date().toISOString()
      } catch (err) {
        console.error('[appsStore] fetchApps error:', err)
        this.error = err?.message || 'Errore nel caricamento delle app'
      } finally {
        this.loading = false
      }
    },

    /**
     * Invalida cache manualmente (es. dopo pubblicazione su Sanity)
     */
    invalidateCache() {
      _appsCache = null
    }
  }
})
