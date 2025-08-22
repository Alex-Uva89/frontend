import { boot } from 'quasar/wrappers'
import { watch } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'
import { useOrderStore } from 'stores/orderStore'

let es = null

function disconnect() {
  if (es) {
    es.close()
    es = null
  }
}

function isJwtExpired (jwt) {
  try {
    const [, payloadB64] = jwt.split('.')
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && (payload.exp * 1000) <= Date.now()
  } catch { return true }
}

function connect(token, orderStore) {
  if (!token || isJwtExpired(token)) return

  // Filtro lato server se c'è un business selezionato
  const params = new URLSearchParams({ token })
  if (orderStore.currentBusinessId) {
    params.set('businessId', orderStore.currentBusinessId)
  }

  es = new EventSource(`${import.meta.env.VITE_API_URL}/orders/stream?${params.toString()}`)

  // Debounce per evitare troppi fetch ravvicinati
  let scheduled = null
  const scheduleFetch = () => {
    if (scheduled) return
    scheduled = setTimeout(async () => {
      scheduled = null
      if (document.visibilityState !== 'visible') return

      try {
        if (orderStore.currentBusinessId) {
          // Vista per BUSINESS
          await orderStore.fetchOrders()
        } else {
          // Vista TUTTI gli ordini
          await orderStore.fetchAllOrder()
        }
      } catch (e) {
        console.error('SSE fetch error:', e)
      }
    }, 250)
  }

  es.addEventListener('orders', scheduleFetch)

  es.onerror = (e) => {
    // EventSource ritenta automaticamente.
    console.warn('SSE error', e)
  }

  // Chiudi bene se l’utente chiude la tab
  window.addEventListener('beforeunload', disconnect, { once: true })
}


export default boot(() => {
  const usersStore = useUsersStore()
  const orderStore = useOrderStore()

  // Connessione iniziale
  connect(usersStore.token, orderStore)

  // Riconnessione quando cambia il token (login/logout)
  watch(() => usersStore.token, (t) => {
    disconnect()
    connect(t, orderStore)
  })

  // Riconnessione quando cambia il business selezionato
  watch(() => orderStore.currentBusinessId, () => {
    if (!usersStore.token) return
    disconnect()
    connect(usersStore.token, orderStore)
  })
})
