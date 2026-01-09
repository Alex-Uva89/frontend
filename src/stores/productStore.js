// src/stores/productStore.js
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { api } from 'boot/axios'

export const useProductStore = defineStore('products', () => {
  const products = ref([])
  const product = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const criteria = reactive({
    businessId: null,
    q: '',
    page: 1,
    pageSize: 50,
    total: 0
  })

  function resetProducts () {
    products.value = []
    criteria.page = 1
    criteria.total = 0
  }

  /* ============================
     FETCH LIST (paginata, light)
     Ritorna: { items, total }
  ============================ */
  async function fetchProducts (overrides = {}) {
    loading.value = true
    error.value = null

    const c = { ...criteria, ...overrides }
    Object.assign(criteria, c)

    const params = {
      businessId: c.businessId || undefined,
      q: c.q || undefined,
      page: c.page,
      pageSize: c.pageSize
    }

    try {
      const { data } = await api.get('/cms/products', { params })

      const items = Array.isArray(data?.items) ? data.items : []
      const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : items.length

      if (c.page > 1) {
        const existing = new Set(products.value.map(p => p._id))
        const merged = items.filter(p => !existing.has(p._id))
        products.value = [...products.value, ...merged]
      } else {
        products.value = items
      }

      criteria.total = total
      return { items, total }
    } catch (e) {
      console.error('Error fetching products:', e)
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  /* ============================
     GET ONE (full)
  ============================ */
  async function fetchProduct (id) {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.get(`/cms/products/${id}`)
      product.value = data.data
      return product.value
    } catch (e) {
      console.error('Error fetching product:', e)
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  /* ============================
     CREATE
  ============================ */
  async function createProduct (payload) {
    const { data } = await api.post('/cms/products', payload)
    const created = data.data

    // non forziamo sort: la lista è paginata lato server
    products.value = [created, ...products.value]
    criteria.total++
    return created
  }

  /* ============================
     UPDATE
     - PUT
     - GET full
     - aggiorna subito la riga light in lista (cost + count)
  ============================ */
  function calcIngredientsCostFromFull (full) {
    const list = Array.isArray(full?.ingredients) ? full.ingredients : []
    return list.reduce((sum, ing) => {
      const price = Number(ing?.reference?.price) || 0
      const qty = Number(ing?.quantity) || 0
      const u = Array.isArray(ing?.unit) ? ing.unit[0] : (ing?.unit || 'kg')

      if (u === 'kg') return sum + price * qty
      if (u === 'g')  return sum + price * (qty / 1000)
      if (u === 'mg') return sum + price * (qty / 1_000_000)
      if (u === 'l')  return sum + price * qty
      if (u === 'ml') return sum + price * (qty / 1000)
      if (u === 'pz') return sum + price * qty
      return sum + price * qty
    }, 0)
  }

  async function updateProduct (id, payload) {
    // 1) scrivi
    await api.put(`/cms/products/${id}`, payload)

    // 2) ricarica full
    const { data } = await api.get(`/cms/products/${id}`)
    const full = data.data

    // 3) aggiorna lista light (solo campi utili)
    const idx = products.value.findIndex(p => p._id === id)
    if (idx !== -1) {
      products.value[idx] = {
        ...products.value[idx],
        name: full.name,
        _updatedAt: full._updatedAt,
        ingredientsCount: Array.isArray(full.ingredients) ? full.ingredients.length : 0,
        ingredientsCost: calcIngredientsCostFromFull(full)
      }
    }

    // 4) aggiorna dettaglio
    if (product.value?._id === id) {
      product.value = full
    }

    return full
  }

  /* ============================
     DELETE
  ============================ */
  async function deleteProduct (id) {
    await api.delete(`/cms/products/${id}`)
    products.value = products.value.filter(p => p._id !== id)
    criteria.total = Math.max(0, (criteria.total || 0) - 1)
  }

  return {
    products,
    product,
    loading,
    error,
    criteria,

    resetProducts,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct
  }
})
