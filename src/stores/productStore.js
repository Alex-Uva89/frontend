// src/stores/productStore.js
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { api } from 'boot/axios'

export const useProductStore = defineStore('products', () => {
  const products = ref([])
  const product = ref(null)     // singolo prodotto
  const loading = ref(false)
  const error = ref(null)

  // criteri query per lista prodotti
  const criteria = reactive({
    businessId: null,
    categoryId: null,
    q: '',
    sort: 'alpha_asc',
    page: 1,
    pageSize: 50,
    total: 0
  })

  /* ============================
     FETCH LIST
  ============================ */
  async function fetchProducts (overrides = {}) {
    loading.value = true
    error.value = null

    const c = { ...criteria, ...overrides }
    Object.assign(criteria, c)

    const params = {
      businessId: c.businessId || undefined
    }

    try {
      const { data } = await api.get('/cms/products', { params })
      // data.data usa LIST_QUERY → ingredients con reference popolata
      products.value = data.data || []
      criteria.total = products.value.length
      return products.value
    } catch (e) {
      console.error('Error fetching products:', e)
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  /* ============================
     FETCH ALL DETAILS (opzionale)
  ============================ */
  async function fetchAllProductDetails () {
    loading.value = true
    error.value = null

    try {
      await fetchProducts()

      const detailed = []
      for (const p of products.value) {
        const full = await fetchProduct(p._id)
        detailed.push(full)
      }

      products.value = detailed
      return detailed
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  /* ============================
     FETCH BY CATEGORY
  ============================ */
  async function fetchByCategory (categoryId, businessId = null) {
    loading.value = true
    error.value = null

    try {
      const params = {
        categoryId,
        businessId: businessId || undefined
      }

      const { data } = await api.get('/cms/products/by-category', { params })

      // data.data qui è già proiettato da BY_CATEGORY_QUERY (con ingredients→reference->)
      products.value = data.data || []
      criteria.total = products.value.length

      return {
        category: data.category,
        items: products.value
      }
    } catch (e) {
      console.error('Error fetching products by category:', e)
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  /* ============================
     GET ONE
  ============================ */
  async function fetchProduct (id) {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.get(`/cms/products/${id}`)
      // data.data usa ONE_QUERY → ingredients con reference popolata
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

    products.value = [...products.value, created]
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    criteria.total++
    return created
  }

  /* ============================
     UPDATE
     ⚠️ IMPORTANTE: dopo la PUT, rifacciamo GET /cms/products/:id
     per avere il prodotto con la proiezione completa (ONE_QUERY)
  ============================ */
  async function updateProduct (id, payload) {
    // 1) scrivi su Sanity
    await api.put(`/cms/products/${id}`, payload)

    // 2) ricarica il prodotto con ONE_QUERY
    const { data } = await api.get(`/cms/products/${id}`)
    const full = data.data

    // 3) aggiorna lista
    const idx = products.value.findIndex(p => p._id === id)
    if (idx !== -1) {
      products.value[idx] = full
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
    criteria.total--
  }

  return {
    // state
    products,
    product,
    loading,
    error,
    criteria,

    // actions
    fetchProducts,
    fetchAllProductDetails,
    fetchByCategory,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct
  }
})
