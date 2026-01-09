import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { api } from 'boot/axios'

export const useReferenceStore = defineStore('reference', () => {
  const references = ref([])
  const loading = ref(false)
  const error = ref(null)

  const criteria = reactive({
    q: '',
    categoryId: null,
    supplierId: null,
    units: [],
    tags: [],
    status: 'active',
    hasPrice: null,
    hasNotes: null,
    sort: 'alpha_asc',
    page: 1,
    pageSize: 50, // default più sensato per infinite scroll
    total: 0
  })

  function resetReferences () {
    references.value = []
    criteria.page = 1
    criteria.total = 0
  }

  async function fetchReferences (overrides = {}) {
    loading.value = true
    error.value = null

    // merge criteri
    const c = { ...criteria, ...overrides }
    Object.assign(criteria, c)

    const params = {
      q: c.q || undefined,
      categoryId: c.categoryId || undefined,
      supplierId: c.supplierId || undefined,
      units: (c.units && c.units.length) ? c.units.join(',') : undefined,
      tags: (c.tags && c.tags.length) ? c.tags.join(',') : undefined,
      status: c.status || undefined,
      hasPrice: c.hasPrice ?? undefined,
      hasNotes: c.hasNotes ?? undefined,
      sort: c.sort || undefined,
      page: c.page,
      pageSize: c.pageSize
    }

    console.log('[STORE] fetchReferences params →', params)

    try {
      const { data } = await api.get('references/', { params })

      const items = Array.isArray(data) ? data : (data.items || [])
      const total = Array.isArray(data) ? items.length : (data.total ?? items.length)

      // ✅ append se page > 1, altrimenti replace
      if (c.page > 1) {
        // evita duplicati (sicurezza)
        const existing = new Set(references.value.map(r => r._id))
        const merged = items.filter(r => !existing.has(r._id))
        references.value = [...references.value, ...merged]
      } else {
        references.value = items
      }

      criteria.total = Number.isFinite(Number(total)) ? Number(total) : references.value.length
      console.log('[STORE] API response →', data)

      // ✅ ritorno info utile per infinite scroll
      return { items, total: criteria.total }
    } catch (e) {
      console.error('Error fetching references:', e)
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createReference (payload, opts = {}) {
    try {
      const { data } = await api.post('references/', {
        ...payload,
        ...(opts.initWarehouse ? { initWarehouse: true, businessId: opts.businessId } : {})
      })

      const created = data.reference || data

      const existingIdx = references.value.findIndex(r => r._id === created._id)
      if (existingIdx === -1) {
        references.value = [...references.value, created]
        criteria.total = (criteria.total || 0) + 1
      } else {
        references.value[existingIdx] = created
      }

      return created
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data

      if (status === 409 && data?.existingId) {
        // ⚠️ Non fare "all: true" con dataset enorme.
        // Meglio: fai una fetch mirata per nome (o per id se aggiungi endpoint GET /references/:id)
        // Intanto fallback “minimo”:
        return {
          _id: data.existingId,
          name: payload.name,
          supplier: payload.supplier || null,
          category: payload.category || null,
          unit: payload.unit || [],
          price: payload.price ?? null,
          notes: payload.notes ?? ''
        }
      }

      console.error('Error creating reference:', e)
      throw e
    }
  }



  return {
    references,
    loading,
    error,
    criteria,
    resetReferences,
    fetchReferences,
    createReference
  }
})
