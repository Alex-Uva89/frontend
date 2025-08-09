import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBusinessStore = defineStore('business', () => {
  // Stato reattivo per memorizzare i dati dei business
  const businesses = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Funzione per fare fetch dei dati
  const fetchBusinesses = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch('http://localhost:3001/business')
      if (!response.ok) throw new Error('Errore durante il recupero dei dati')
      const data = await response.json()
      businesses.value = data
    } catch (err) {
      error.value = err.message
      console.error('Errore in fetchBusinesses:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    businesses,
    isLoading,
    error,
    fetchBusinesses
  }
})
