import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { api } from 'boot/axios'

export const useReferenceStore = defineStore('reference', () => {
  const references = ref([])
  const loading = ref(false)
  const error = ref(null)

  // stato query/filtri/sort/paginazione
  const criteria = reactive({
    q: '',
    categoryId: null,
    supplierId: null,
    units: [], // array di sigle
    tags: [],
    status: 'active', // default
    hasPrice: null, // true/false/null
    hasNotes: null, // true/false/null
    sort: 'alpha_asc',
    page: 1,
    pageSize: 25,
    total: 0
  })

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
      // 👉 se overrides.all === true → ignora la paginazione e tira giù tutto
      pageSize: overrides.all ? 5000 : c.pageSize
    }

    try {
      const { data } = await api.get('references/', { params })

      if (Array.isArray(data)) {
        references.value = data
        criteria.total = data.length
      } else {
        references.value = data.items || []
        criteria.total = data.total ?? references.value.length
      }

      return references.value
    } catch (e) {
      console.error('Error fetching references:', e)
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }


  async function createReference (payload, opts = {}) {
    const { data } = await api.post('references/', {
      ...payload,
      ...(opts.initWarehouse ? { initWarehouse: true, businessId: opts.businessId } : {})
    })

    const created = data.reference || data
    references.value = [...references.value, created].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'it', { sensitivity: 'base' })
    )
    criteria.total = (criteria.total || 0) + 1
    return created
  }

  // 👇 IMPORTANTE: esponi stato e azioni
  return {
    // state
    references,
    loading,
    error,
    criteria,
    // actions
    fetchReferences,
    createReference
  }
})
