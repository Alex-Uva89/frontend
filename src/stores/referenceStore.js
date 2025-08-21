// src/stores/referenceStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'

export const useReferenceStore = defineStore('reference', () => {
  const references = ref([])
  const loading = ref(false)

  async function fetchReferences() {
    loading.value = true
    try {
      const { data } = await api.get('references/') // usa baseURL dell'istanza
      references.value = data
    } catch (error) {
      console.error('Error fetching references:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createReference(payload, opts = {}) {
    const { data } = await api.post('references/', {
      ...payload,
      ...(opts.initWarehouse ? { initWarehouse: true, businessId: opts.businessId } : {})
    })

    const created = data.reference
    references.value = [...references.value, created].sort((a, b) =>
      a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
    )

    return data // { reference, warehouseItem }
  }

  async function addReferenceToOrder(orderId, referenceData) {
    const { data } = await api.post(`orders/${orderId}/references`, referenceData)
    return data
  }

  return {
    references,
    loading,
    fetchReferences,
    createReference,
    addReferenceToOrder
  }
})
