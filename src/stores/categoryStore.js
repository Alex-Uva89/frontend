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
    addCategory(newCategory) {
      this.categories.push(newCategory)
    }
  }
})
