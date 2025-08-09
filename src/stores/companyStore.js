import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCompanyStore = defineStore('company', () => {
  const company = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchCompany = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/company`)
      console.log('URL',import.meta.env.VITE_API_URL)
      if (!response.ok) throw new Error('Errore durante il recupero dei dati')
      const data = await response.json()
      company.value = data
    } catch (err) {
      error.value = err.message
      console.error('Errore in fetchBusinesses:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    company,
    isLoading,
    error,
    fetchCompany
  }
})
