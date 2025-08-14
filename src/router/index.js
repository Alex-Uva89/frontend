import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useUsersStore } from 'src/stores/usersStore'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Aggiungi la navigation guard
  Router.beforeEach(async (to, from, next) => {
  const usersStore = useUsersStore()

  // Se la route richiede autenticazione
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Controlla se il token esiste nel localStorage
    const token = localStorage.getItem('token')

    if (!token) {
      next('/')
      return
    }

    // Se lo store non ha ancora l'utente, caricalo
    if (!usersStore.currentUser) {
      try {
        await usersStore.fetchCurrentUser()
      } catch (error) {
        console.error('Failed to fetch user:', error)
        next('/')
        return
      }
    }

    // Controllo ruoli (solo se presenti nella meta)
    if (to.meta.roles) {
      const userRole = usersStore.currentUser?.role?.toLowerCase()
      const allowedRoles = Array.isArray(to.meta.roles)
        ? to.meta.roles.map(r => r.toLowerCase())
        : [to.meta.roles.toLowerCase()]

      if (!userRole || !allowedRoles.includes(userRole)) {
        next('/dashboard/main')
        return
      }
    }
  }

  next()
})

  return Router
})
