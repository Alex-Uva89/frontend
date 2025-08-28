import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authFetchJson } from 'src/utils/api'

export const useCompanyStore = defineStore('company', () => {
  const company = ref(null)      // oggetto, non array
  const isLoading = ref(false)
  const error = ref(null)

  const fetchCompany = async () => {
    isLoading.value = true
    error.value = null
    const API = import.meta.env.VITE_API_URL

    try {
      // 1) prova endpoint privato (con Authorization se presente)
      company.value = await authFetchJson(`${API}/company`)
    } catch (err) {
      console.log('Errore in company', err)
      try {
        const res = await fetch(`${API}/public/company`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        company.value = await res.json()
      } catch (err2) {
        error.value = err2.message
        company.value = null
        console.error('Errore in fetchCompany:', err2)
      }
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
