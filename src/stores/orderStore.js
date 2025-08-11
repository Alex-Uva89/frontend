import { defineStore } from 'pinia'
import axios from 'axios'

export const useOrderStore = defineStore('orderStore', {
  state: () => ({
    orders: [],
    loading: false,
    error: null,
    currentBusinessId: null  // memorizzi qui l'id del locale
  }),
  actions: {
    async fetchOrders() {
      if (!this.currentBusinessId) {
        this.error = 'businessId non impostato'
        return
      }
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('http://localhost:3000/orders', {
          params: { businessId: this.currentBusinessId }
        })
        this.orders = response.data
        console.log('ORDINI', this.orders)
      } catch (err) {
        this.error = 'Errore nel caricamento degli ordini'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    setBusinessId(id) {
      this.currentBusinessId = id
    }
  }
})
