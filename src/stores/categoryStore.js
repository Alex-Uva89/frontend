import { defineStore } from 'pinia'
import { authFetchJson } from 'src/utils/api'

export const useCategoryStore = defineStore('categoryStore', {
  state: () => ({
    categories: [],
    loading: false
  }),
  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        const API = import.meta.env.VITE_API_URL
        const data = await authFetchJson(`${API}/categories`)
        this.categories = data
      } catch (err) {
        console.error('Errore fetch categorie', err)
      } finally {
        this.loading = false
      }
    },

    async createCategory(payload) {
      const API = import.meta.env.VITE_API_URL
      const data = await authFetchJson(`${API}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      })
      this.categories = [...this.categories, data].sort((a, b) =>
        a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
      )
      return data
    },

    addCategory(newCategory) {
      this.categories.push(newCategory)
    }
  }
})
