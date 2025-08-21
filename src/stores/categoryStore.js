import { defineStore } from 'pinia'
import axios from 'axios'

export const useCategoryStore = defineStore('categoryStore', {
  state: () => ({
    categories: [],
    loading: false
  }),
  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories`)
        this.categories = res.data
      } catch (err) {
        console.error('Errore fetch categorie', err)
      } finally {
        this.loading = false
      }
    },

    async createCategory(payload) {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/categories`, payload)
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
