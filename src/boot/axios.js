import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useUsersStore } from 'src/stores/usersStore'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

export default defineBoot(({ app, router }) => {

  api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

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

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
