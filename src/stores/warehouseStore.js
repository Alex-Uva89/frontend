// src/stores/warehouseStore.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useWarehouseStore = defineStore('warehouse', {
  state: () => ({
    items: [],
    cache: {} // chiave: `${businessId}__${referenceId}` -> doc (o null)
  }),
  actions: {
    async createWarehouseItem(payload) {
      const { data } = await api.post('warehouse/', payload)
      this.items.push(data)
      // aggiorna cache
      if (payload?.businessId && payload?.referenceId) {
        const key = `${payload.businessId}__${payload.referenceId}`
        this.cache[key] = data
      }
      return data
    },

    async findItem(businessId, referenceId) {
      const key = `${businessId}__${referenceId}`
      if (this.cache[key] !== undefined) return this.cache[key]
      const { data } = await api.get('warehouse/find', { params: { businessId, referenceId } })
      this.cache[key] = data // può essere null
      return data
    },

    async upsertUnitPrice(warehouseId, unit, price) {
      const { data } = await api.patch(`warehouse/${warehouseId}/prices`, { unit, price })
      // aggiorna items se lo hai in memoria
      const idx = this.items.findIndex(i => i._id === warehouseId)
      if (idx !== -1) {
        this.items[idx] = { ...this.items[idx], prices: data.prices }
      }
      return data
    }
  }
})
