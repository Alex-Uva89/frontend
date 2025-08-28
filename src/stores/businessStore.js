import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { authFetchJson } from 'src/utils/api'

export const useBusinessStore = defineStore('business', () => {
  const STORAGE = typeof window !== 'undefined' ? window.sessionStorage : null
  const KEY = 'business.currentId'

  const businesses = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const currentBusinessId = ref(null)

  watch(currentBusinessId, (id) => {
    if (!STORAGE) return
    if (id) STORAGE.setItem(KEY, id)
    else STORAGE.removeItem(KEY)
  })

  const currentBusiness = computed(() =>
    (businesses.value || []).find(b => b._id === currentBusinessId.value) || null
  )

  const setCurrentBusinessId = (id) => {
    currentBusinessId.value = id || null
  }

  const getNameById = (id) =>
    (businesses.value || []).find(b => b._id === id)?.name || ''

  const fetchBusinesses = async () => {
    isLoading.value = true
    error.value = null
    try {
      const API = import.meta.env.VITE_API_URL
      const data = await authFetchJson(`${API}/business`)
      businesses.value = data

      if (!currentBusinessId.value && data?.length) {
        currentBusinessId.value = data[0]._id
      }
    } catch (err) {
      error.value = err.message
      console.error('Errore in fetchBusinesses:', err)
    } finally {
      isLoading.value = false
    }
  }

  function initFromStorage (fallbackId = null) {
    if (!STORAGE) {
      if (fallbackId) currentBusinessId.value = fallbackId
      return
    }
    const saved = STORAGE.getItem(KEY)
    if (saved) currentBusinessId.value = saved
    else if (fallbackId) currentBusinessId.value = fallbackId
  }

  function clearCurrentBusiness () {
    currentBusinessId.value = null
    if (STORAGE) STORAGE.removeItem(KEY)
  }

  return {
    businesses, isLoading, error,
    currentBusinessId, currentBusiness,
    setCurrentBusinessId, getNameById,
    fetchBusinesses,
    initFromStorage, clearCurrentBusiness
  }
})
