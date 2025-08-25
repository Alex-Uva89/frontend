import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useUsersStore } from 'src/stores/usersStore'

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach(async (to, from, next) => {
    const usersStore = useUsersStore()
    const token = sessionStorage.getItem('token')
    const requiresAuth = to.matched.some(record => record.meta?.requiresAuth)

    // Se autenticato ma manca currentUser, prova a caricarlo
    if (token && !usersStore.currentUser) {
      try {
        await usersStore.fetchCurrentUser()
      } catch (error) {
        console.error('Failed to fetch user:', error)
        sessionStorage.removeItem('token')
      }
    }

    const isAuth = Boolean(sessionStorage.getItem('token'))
    const userRole = usersStore.currentUser?.role
      ? String(usersStore.currentUser.role).toLowerCase()
      : null

    // Blocca rotte protette se non autenticato
    if (requiresAuth && !isAuth) {
      return next({ name: 'login' })
    }

    // Se un utente autenticato va al login, instradalo al posto giusto
    if (to.name === 'login' && isAuth) {
      if (userRole === 'staff') return next({ name: 'dashboard-staff' })
      return next({ name: 'hub' })
    }

    // Se un "staff" prova ad andare sull’hub, mandalo al CRM (sua vista)
    if (to.name === 'hub' && userRole === 'staff') {
      return next({ name: 'dashboard-staff' })
    }

    // Controllo ruoli se specificati nella meta della rotta
    if (to.meta?.roles && isAuth) {
      const allowedRoles = Array.isArray(to.meta.roles)
        ? to.meta.roles.map(r => String(r).toLowerCase())
        : [String(to.meta.roles).toLowerCase()]

      if (!userRole || !allowedRoles.includes(userRole)) {
        return next('/dashboard/main')
      }
    }

    return next()
  })

  return Router
})
