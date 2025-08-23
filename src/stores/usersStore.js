import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
      // endpoint corretto
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
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

  async function createUser(payload) {
  // payload atteso:
  // { firstName, lastName, email, role, business, isActive, photoUrl? }
  const headers = { 'Content-Type': 'application/json' }
  if (token.value) headers.Authorization = `Bearer ${token.value}`

  const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {})
  })

  if (!res.ok) {
    let msg = 'Errore creazione utente'
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch (e) {
      console.warn('Errore parse JSON createUser', e)
    }
    throw new Error(msg)
  }

  const created = await res.json()

  // aggiorna lista localmente
  users.value = [created, ...(users.value || [])]

  return created
}

  // ---------------------- NUOVI METODI DI UPDATE ----------------------
  async function updateUser(id, patch) {
    if (!id) throw new Error('ID utente mancante')

    const headers = { 'Content-Type': 'application/json' }
    if (token.value) headers.Authorization = `Bearer ${token.value}`

    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch || {})
    })

    if (!res.ok) {
      let msg = 'Errore aggiornamento utente'
      try {
        const body = await res.json()
        if (body?.error) msg = body.error
      } catch (e) {
        // ignora errori nel parsing JSON della risposta d'errore (ESLint compliant)
        console.warn('Errore parsing JSON risposta PATCH /users/:id', e)
      }
      throw new Error(msg)
    }

    const updated = await res.json()

    // aggiorna lista localmente
    const idx = users.value.findIndex(u => (u._id || u.id) === id)
    if (idx !== -1) {
      users.value[idx] = updated
    } else {
      // se l'utente non è in lista, ricarico
      await fetchUsers()
    }

    // se ho aggiornato me stesso, sincronizzo
    if (currentUser.value && (currentUser.value._id === id || currentUser.value.id === id)) {
      currentUser.value = { ...currentUser.value, ...updated }
      if (STORAGE) STORAGE.setItem(USER_KEY, JSON.stringify(currentUser.value))
    }

    return updated
  }

  async function updateRole(id, role) {
    return updateUser(id, { role })
  }

  async function setActive(id, isActive) {
    return updateUser(id, { isActive: !!isActive })
  }
  // -------------------------------------------------------------------

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
