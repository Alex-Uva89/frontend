// src/boot/axios.js
import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useUsersStore } from 'src/stores/usersStore'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

export default defineBoot(({ app, router }) => {
  // Header Authorization da sessionStorage per ogni richiesta
  api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // (Opzionale ma utile) gestione 401 → logout e redirect a login
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        const usersStore = useUsersStore()
        usersStore.logout?.(router) // pulizia sessione + redirect '/'
      }
      return Promise.reject(error)
    }
  )

  // Inietto in Vue (Options API) come $axios e $api
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
