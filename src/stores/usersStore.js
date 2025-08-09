import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  const currentUser = ref(null)
  const token = ref(null)

  // ✅ Al caricamento dello store, ripristina i dati da localStorage
  if (typeof window !== 'undefined') {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken) {
      token.value = savedToken
    }

    if (savedUser) {
      try {
        currentUser.value = JSON.parse(savedUser)
      } catch {
        currentUser.value = null
      }
    }
  }

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users`)
      console.log('URL',import.meta.env.VITE_API_URL)
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
  localStorage.setItem('token', jwtToken)
  localStorage.setItem('user', JSON.stringify(userData))
}

  async function fetchCurrentUser() {
    if (!token.value) {
      currentUser.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      if (!res.ok) throw new Error('Errore fetching current user')
      const data = await res.json()
      currentUser.value = data
      localStorage.setItem('user', JSON.stringify(data))
    } catch (err) {
      error.value = err.message
      currentUser.value = null
      localStorage.removeItem('user')
    } finally {
      loading.value = false
    }
  }

  function logout(router) {
    if (router) {
      router.push('/')
    }
    currentUser.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    users,
    loading,
    error,
    currentUser,
    token,
    fetchUsers,
    getUserByEmail,
    setUserAndToken,
    logout,
    fetchCurrentUser
  }
})
