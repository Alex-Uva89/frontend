import { crmRoutes } from 'src/apps/crm/routes'
import { cmsRoutes } from 'src/apps/cms/routes'

const routes = [
  // Pubblico: Login
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'login', component: () => import('pages/auth/LoginPage.vue') },
    ],
  },

  // Hub (protetto, ma layout generico, NON quello del CRM)
  {
    path: '/',
    component: () => import('src/layouts/LogLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'hub', name: 'hub', component: () => import('pages/HubPage.vue') },
    ]
  },

  // CRM (layout dedicato CRM)
  {
    path: '/crm',
    component: () => import('src/apps/crm/layout/CRMLayout.vue'),
    meta: { requiresAuth: true, app: 'crm' },
    children: crmRoutes,
    beforeEnter: (to, from, next) => {
      if (to.path.replace(/\/+$/, '') === '/crm') {
        try {
          const { useUsersStore } = require('src/stores/usersStore')
          const store = useUsersStore()
          const role = store?.currentUser?.role
            ? String(store.currentUser.role).toLowerCase()
            : null

          const redirectMap = {
            staff: 'crm.staff',
            manager: 'crm.manager',
            owner: 'crm.owner',
            dev: 'crm.dev',
            hr: 'crm.hr',
            supervisor: 'crm.supervisor'
          }

          return next({ name: redirectMap[role] || 'crm.main' })
        } catch (e) {
          console.warn(e)
          return next({ name: 'crm.main' })
        }
      }
      next()
    }
  },

  // CMS (layout dedicato CMS)
  {
    path: '/cms',
    component: () => import('src/apps/cms/layout/CMSLayout.vue'),
    meta: { requiresAuth: true, app: 'cms' },
    children: cmsRoutes
  },

  // 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  }
]

export default routes
