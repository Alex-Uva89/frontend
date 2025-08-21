// orderStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'

export const useOrderStore = defineStore('orderStore', () => {
  // State
  const orders = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentBusinessId = ref(null)

  // Fetch ordini
  const fetchOrders = async () => {
    if (!currentBusinessId.value) {
      error.value = 'businessId non impostato'
      return []
    }

    loading.value = true
    error.value = null

    try {
      const response = await api.get(`${import.meta.env.VITE_API_URL}/orders`, {
        params: { businessId: currentBusinessId.value }
      })
      orders.value = response.data
      console.log('ORDERS', orders.value)
      return response.data
    } catch (err) {
      error.value = 'Errore nel caricamento degli ordini'
      console.error(err)
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchAllOrder = async () => {
    loading.value = true
    try {
      const response = await api.get(`${import.meta.env.VITE_API_URL}/orders`)
      orders.value = response.data
      console.log('ORDERS', orders.value)
      return response.data
    } catch (err) {
      error.value = 'Errore nel caricamento degli ordini'
      console.error(err)
      return []
    } finally {
      loading.value = false
    }
  }

  const createOrder = async (businessId, items, notes = '') => {
    loading.value = true
    error.value = null

    try {
      const response = await api.post(`${import.meta.env.VITE_API_URL}/orders`, {
        businessId,
        notes,
        items
      })

      // Aggiorna stato locale
      await fetchOrders()

      return response.data
    } catch (err) {
      error.value = 'Errore nella creazione dell\'ordine'
      console.error(err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Elimina una referenza da un ordine
  const deleteOrderItem = async (orderId, productKey) => {
    loading.value = true
    error.value = null

    try {
      // Prima chiamata API per eliminare l'item
      await api.delete(`${import.meta.env.VITE_API_URL}/orders/${orderId}/items/${productKey}`)

      // Poi aggiorna lo stato locale
      const orderIndex = orders.value.findIndex(o => o._id === orderId)
      if (orderIndex !== -1) {
        orders.value[orderIndex].items = orders.value[orderIndex].items.filter(
          item => item._key !== productKey
        )

        // Se l'ordine è vuoto, lo rimuoviamo completamente
        if (orders.value[orderIndex].items.length === 0) {
          orders.value.splice(orderIndex, 1)
        }
      }

      return true
    } catch (err) {
      error.value = 'Errore durante l\'eliminazione della referenza'
      console.error(err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Modifica una referenza in un ordine
  // orderStore.js - aggiungi questa funzione
  const updateOrderItem = async (orderId, productKey, updatedData) => {
  loading.value = true
  error.value = null

  try {
    const response = await api.patch(
      `${import.meta.env.VITE_API_URL}/orders/${orderId}/items/${productKey}`,
      updatedData
    )
    console.log('response', response.data)
    // Trova l'ordine
    const orderIndex = orders.value.findIndex(o => o._id === orderId)
    if (orderIndex !== -1) {
      // Trova l'item
      const itemIndex = orders.value[orderIndex].items.findIndex(i => i._key === productKey)
      if (itemIndex !== -1) {
        // Aggiorna solo quell'item
        orders.value[orderIndex].items[itemIndex] = {
          ...orders.value[orderIndex].items[itemIndex],
          ...updatedData
        }
      }
    }

    return true
  } catch (err) {
    error.value = 'Errore durante l\'aggiornamento della referenza'
    console.error(err)
    return false
  } finally {
    loading.value = false
  }
}

// Elimina un intero ordine
const deleteOrder = async (orderId) => {
  loading.value = true
  error.value = null

  try {
    // Chiamata API per eliminare l'ordine
    await api.delete(`${import.meta.env.VITE_API_URL}/orders/${orderId}`)

    // Rimuovi l'ordine dallo stato locale
    orders.value = orders.value.filter(order => order._id !== orderId)

    return true
  } catch (err) {
    error.value = 'Errore durante l\'eliminazione dell\'ordine'
    console.error(err)
    return false
  } finally {
    loading.value = false
  }
}

const lockOrder = async (orderId, { sendEmail = false, to, finalize } = {}) => {
  try {
    const payload = { sendEmail, to }
    if (typeof finalize !== 'undefined') payload.finalize = finalize

    const { data } = await api.post(`${import.meta.env.VITE_API_URL}/orders/${orderId}/lock`, payload)

    // Aggiorna lo stato locale subito (SSE aggiornerà comunque)
    const idx = orders.value.findIndex(o => o._id === orderId)
    if (idx !== -1) {
      orders.value[idx] = {
        ...orders.value[idx],
        locked: true,
        lockedAt: new Date().toISOString(),
        ...(sendEmail ? { emailSent: true, emailSentAt: new Date().toISOString(), status: 'completed' } : {})
      }
    }

    if (data?.alreadyLocked) {
      Notify.create({ type: 'info', message: 'Ordine già chiuso' })
    } else {
      Notify.create({ type: 'positive', message: sendEmail ? 'Ordine chiuso e email inviata' : 'Ordine chiuso' })
    }
    return true
  } catch (err) {
    const msg = err?.response?.data?.error || err.message || 'Errore blocco ordine'
    Notify.create({ type: 'negative', message: msg })
    return false
  }
}


const unlockOrder = async (orderId) => {
  try {
    // blocco lato client: non riaprire se già inviato
    const idx = orders.value.findIndex(o => o._id === orderId)
    const ord = idx !== -1 ? orders.value[idx] : null
    if (ord?.emailSent) {
      Notify.create({ type: 'warning', message: 'Ordine già inviato: non può essere riaperto' })
      return false
    }

    // tenta endpoint dedicato
    try {
      await api.post(`${import.meta.env.VITE_API_URL}/orders/${orderId}/unlock`)
    } catch (err) {
      const status = err?.response?.status
      // fallback su /lock con flag unlock
      if (status === 404 || status === 405) {
        await api.post(`${import.meta.env.VITE_API_URL}/orders/${orderId}/lock`, { unlock: true })
      } else {
        throw err
      }
    }

    // aggiornamento ottimistico locale
    if (idx !== -1) {
      orders.value[idx] = {
        ...orders.value[idx],
        locked: false,
        lockedAt: null
      }
    }

    Notify.create({ type: 'positive', message: 'Ordine riaperto' })
    return true
  } catch (err) {
    const msg = err?.response?.data?.error || err.message || 'Errore riapertura ordine'
    Notify.create({ type: 'negative', message: msg })
    return false
  }
}




  return {
    orders,
    loading,
    error,
    currentBusinessId,
    fetchOrders,
    fetchAllOrder,
    createOrder,
    deleteOrderItem,
    updateOrderItem,
    deleteOrder,
    lockOrder,
    unlockOrder
  }
})
