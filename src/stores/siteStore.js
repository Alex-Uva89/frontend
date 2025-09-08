import { defineStore } from 'pinia'
import { useUsersStore } from 'src/stores/usersStore'

export const SITE_ALLOWED_ROLES = ['owner', 'supervisor', 'dev']

export const useSiteStore = defineStore('siteStore', {
  state: () => ({
    loading: false,
    error: null,
    // dati specifici del site arriveranno da Sanity:
    pages: [],
    menus: [],
    media: [],
    settings: {},
  }),

  getters: {
    canAccess: () => {
      const users = useUsersStore()
      const role = String(users.currentUser?.role || '').toLowerCase()
      return SITE_ALLOWED_ROLES.includes(role)
    }
  },

  actions: {
    async fetchInitial() {
      // qui in futuro fetch da Sanity
      return true
    }
  }
})
