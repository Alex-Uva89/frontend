// src/stores/referenceStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'

export const useReferenceStore = defineStore('reference', () => {
  const references = ref([])

  async function fetchReferences() {
    try {
      const response = await api.get(`${import.meta.env.VITE_API_URL}/references`)
      references.value = response.data
    } catch (error) {
      console.error('Error fetching references:', error)
      throw error
    }
  }

  async function addReferenceToOrder(orderId, referenceData) {
    try {
      const response = await api.post(
        `${import.meta.env.VITE_API_URL}/orders/${orderId}/references`,
        referenceData
      )
      return response.data
    } catch (error) {
      console.error(`Error adding reference ${referenceData.referenceId} to order ${orderId}:`, error)
      throw error
    }
  }



  return {
    references,
    fetchReferences,
    addReferenceToOrder
  }
})
