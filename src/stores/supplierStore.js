import { defineStore } from 'pinia'
import { authFetchJson } from 'src/utils/api'

export const useSupplierStore = defineStore('supplier', {
  state: () => ({
    suppliers: []
  }),
  actions: {
    async fetchSuppliers() {
      const API = import.meta.env.VITE_API_URL
      const data = await authFetchJson(`${API}/suppliers/`)
      this.suppliers = data
    },

    async createSupplier(payload) {
      const API = import.meta.env.VITE_API_URL
      const data = await authFetchJson(`${API}/suppliers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      })

      this.suppliers = [...this.suppliers, data].sort((a, b) =>
        a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
      )
      return data
    }
  }
})
