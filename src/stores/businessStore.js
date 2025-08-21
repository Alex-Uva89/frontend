import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBusinessStore = defineStore('business', () => {
  const businesses = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // ✅ selezione corrente (solo id)
  const currentBusinessId = ref(null)

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/business`)
      if (!response.ok) throw new Error('Errore durante il recupero dei dati')
      const data = await response.json()
      businesses.value = data

      // prima selezione se nulla
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

  return {
    businesses, isLoading, error,
    currentBusinessId, currentBusiness,
    setCurrentBusinessId, getNameById,
    fetchBusinesses
  }
})
