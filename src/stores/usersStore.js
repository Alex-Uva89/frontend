import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authFetchJson } from 'src/utils/api'

export const useUsersStore = defineStore('users', () => {
  // --- Storage helpers (per tab) ---
  const STORAGE = typeof window !== 'undefined' ? window.sessionStorage : null
  const TOKEN_KEY = 'token'
  const USER_KEY = 'user'

  // State
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentUser = ref(null)
  const token = ref(null)
  const isInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!currentUser.value)
  const userRole = computed(() => currentUser.value?.role?.toLowerCase() || null)

  // Initialize store from sessionStorage (isolato per tab)
  function initialize () {
    if (STORAGE) {
      const savedToken = STORAGE.getItem(TOKEN_KEY)
      const savedUser = STORAGE.getItem(USER_KEY)

      if (savedToken) token.value = savedToken
      if (savedUser) {
        try {
          currentUser.value = JSON.parse(savedUser)
        } catch {
          currentUser.value = null
        }
      }
    }
    isInitialized.value = true
  }

  // Actions
  async function fetchUsers () {
    loading.value = true
    error.value = null
    try {
      const API = import.meta.env.VITE_API_URL
      users.value = await authFetchJson(`${API}/users`)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function getUserByEmail (email) {
    return users.value.find(u => u.email === email) || null
  }

  function setUserAndToken (userData, jwtToken) {
    currentUser.value = userData
    token.value = jwtToken
    if (STORAGE) {
      STORAGE.setItem(TOKEN_KEY, jwtToken)
      STORAGE.setItem(USER_KEY, JSON.stringify(userData))
    }
  }

  async function fetchCurrentUser () {
    if (!token.value && STORAGE) {
      const saved = STORAGE.getItem(TOKEN_KEY)
      if (saved) token.value = saved
    }
    if (!token.value) {
      currentUser.value = null
      return null
    }

    loading.value = true
    error.value = null
    try {
      const API = import.meta.env.VITE_API_URL
      const data = await authFetchJson(`${API}/users/me`)
      currentUser.value = data
      if (STORAGE) STORAGE.setItem(USER_KEY, JSON.stringify(data))
      return data
    } catch (err) {
      error.value = err.message
      currentUser.value = null
      if (STORAGE) STORAGE.removeItem(USER_KEY)
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout (router) {
    currentUser.value = null
    token.value = null
    if (STORAGE) {
      STORAGE.removeItem(TOKEN_KEY)
      STORAGE.removeItem(USER_KEY)
    }
    if (router) router.push('/')
  }



  // Check permissions (ruolo lato FE se ti serve)
  function hasRole (role) {
    if (!userRole.value) return false
    return userRole.value === role.toLowerCase()
  }
  function hasAnyRole (roles) {
    if (!userRole.value) return false
    return roles.map(r => r.toLowerCase()).includes(userRole.value)
  }
  function hasAllPermissions (permissions) {
    if (!currentUser.value?.permissions) return false
    return permissions.every(p => currentUser.value.permissions.includes(p))
  }

  // ---------------------- CREATE (POST /users) ----------------------
async function createUser (payload) {
  const API = import.meta.env.VITE_API_URL
  const bearer = token.value || (STORAGE && STORAGE.getItem(TOKEN_KEY))
  const headers = {
    'Content-Type': 'application/json',
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
  }
  return authFetchJson(`${API}/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {})
  })
}


  // ---------------------- UPDATE ----------------------
  async function updateUser (id, patch) {
    if (!id) throw new Error('ID utente mancante')
    const API = import.meta.env.VITE_API_URL
    const headers = { 'Content-Type': 'application/json' }
    const updated = await authFetchJson(`${API}/users/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch || {})
    })

    const idx = users.value.findIndex(u => (u._id || u.id) === id)
    if (idx !== -1) {
      users.value[idx] = updated
    } else {
      await fetchUsers()
    }

    if (currentUser.value && (currentUser.value._id === id || currentUser.value.id === id)) {
      currentUser.value = { ...currentUser.value, ...updated }
      if (STORAGE) STORAGE.setItem(USER_KEY, JSON.stringify(currentUser.value))
    }

    return updated
  }

  async function updateRole (id, role) {
    return updateUser(id, { role })
  }

  async function setActive (id, isActive) {
    return updateUser(id, { isActive: !!isActive })
  }

  // Initialize on store creation
  initialize()

  return {
    // State
    users, loading, error, currentUser, token, isInitialized,
    // Getters
    isAuthenticated, userRole,
    // Actions
    fetchUsers, getUserByEmail, setUserAndToken, fetchCurrentUser, logout, createUser,
    // Permission checks
    hasRole, hasAnyRole, hasAllPermissions,
    // Updates
    updateUser, updateRole, setActive
  }
})
