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
    const requiresAuth = to.matched.some(r => r.meta?.requiresAuth)

    if (token && !usersStore.currentUser) {
      try {
        await usersStore.fetchCurrentUser()
      } catch (err) {
        console.error('Failed to fetch user:', err)
        sessionStorage.removeItem('token')
      }
    }

    const isAuth = Boolean(sessionStorage.getItem('token'))
    const userRole = usersStore.currentUser?.role
      ? String(usersStore.currentUser.role).toLowerCase()
      : null

    if (requiresAuth && !isAuth) {
      return next({ name: 'login' })
    }

    // Login → se già autenticato rimanda dove ha senso
    if (to.name === 'login' && isAuth) {
      if (userRole === 'staff') return next({ name: 'crm.staff' })
      return next({ name: 'hub' })
    }

    // Se uno "staff" va all'hub, mandalo alla sua dashboard CRM
    // if (to.name === 'hub' && userRole === 'staff') {
    //   return next({ name: 'crm.staff' })
    // }

    // Controllo ruoli granulari (meta.roles)
    if (to.meta?.roles && isAuth) {
      const allowed = (Array.isArray(to.meta.roles) ? to.meta.roles : [to.meta.roles])
        .map(r => String(r).toLowerCase())
      if (!userRole || !allowed.includes(userRole)) {
        // se non ha permesso, porta a una pagina safe del CRM
        return next({ name: 'crm.main' })
      }
    }

    next()
  })

  return Router
})
