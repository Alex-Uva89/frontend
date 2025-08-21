import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUsersStore = defineStore('users', () => {
  // --- Storage helpers (per-tab) ---
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
  function initialize() {
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
  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users`)
      if (!res.ok) throw new Error('Errore fetching users')
      users.value = await res.json()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function getUserByEmail(email) {
    return users.value.find(u => u.email === email) || null
  }

  function setUserAndToken(userData, jwtToken) {
    currentUser.value = userData
    token.value = jwtToken
    if (STORAGE) {
      STORAGE.setItem(TOKEN_KEY, jwtToken)
      STORAGE.setItem(USER_KEY, JSON.stringify(userData))
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) {
      currentUser.value = null
      return null
    }

    loading.value = true
    error.value = null
    try {
      // ✅ endpoint corretto con /auth
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      if (!res.ok) throw new Error('Errore fetching current user')
      const data = await res.json()
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

  function logout(router) {
    currentUser.value = null
    token.value = null
    if (STORAGE) {
      STORAGE.removeItem(TOKEN_KEY)
      STORAGE.removeItem(USER_KEY)
    }
    if (router) router.push('/')
  }

  // Check permissions
  function hasRole(role) {
    if (!userRole.value) return false
    return userRole.value === role.toLowerCase()
  }

  function hasAnyRole(roles) {
    if (!userRole.value) return false
    return roles.map(r => r.toLowerCase()).includes(userRole.value)
  }

  function hasAllPermissions(permissions) {
    if (!currentUser.value?.permissions) return false
    return permissions.every(p => currentUser.value.permissions.includes(p))
  }

  // Initialize on store creation
  initialize()

  return {
    // State
    users, loading, error, currentUser, token, isInitialized,
    // Getters
    isAuthenticated, userRole,
    // Actions
    fetchUsers, getUserByEmail, setUserAndToken, fetchCurrentUser, logout,
    // Permission checks
    hasRole, hasAnyRole, hasAllPermissions
  }
})
