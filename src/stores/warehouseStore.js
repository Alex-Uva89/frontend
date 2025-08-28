import { defineStore } from 'pinia'
import { authFetchJson } from 'src/utils/api'

export const useWarehouseStore = defineStore('warehouse', {
  state: () => ({
    items: [],
    cache: {} // chiave: `${businessId}__${referenceId}` -> doc (o null)
  }),
  actions: {
    async createWarehouseItem(payload) {
      const API = import.meta.env.VITE_API_URL
      const data = await authFetchJson(`${API}/warehouse/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      })
      this.items.push(data)
      if (payload?.businessId && payload?.referenceId) {
        const key = `${payload.businessId}__${payload.referenceId}`
        this.cache[key] = data
      }
      return data
    },

    async findItem(businessId, referenceId) {
      const API = import.meta.env.VITE_API_URL
      const key = `${businessId}__${referenceId}`
      if (this.cache[key] !== undefined) return this.cache[key]
      const data = await authFetchJson(`${API}/warehouse/find?businessId=${encodeURIComponent(businessId)}&referenceId=${encodeURIComponent(referenceId)}`)
      this.cache[key] = data // può essere null
      return data
    },

    async upsertUnitPrice(warehouseId, unit, price) {
      const API = import.meta.env.VITE_API_URL
      const data = await authFetchJson(`${API}/warehouse/${warehouseId}/prices`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit, price })
      })
      const idx = this.items.findIndex(i => i._id === warehouseId)
      if (idx !== -1) {
        this.items[idx] = { ...this.items[idx], prices: data.prices }
      }
      return data
    }
  }
})
