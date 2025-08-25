const routes = [
  // Layout pubblico: solo login
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'login', component: () => import('pages/IndexPage.vue') },
    ],
  },

  // Layout protetto: Hub + Dashboard
  {
    path: '/',
    component: () => import('layouts/LogLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // 👉 HubPage con LogLayout
      { path: 'hub', name: 'hub', component: () => import('pages/HubPage.vue') },

      // 👉 Entry unico per il CRM: /crm
      {
        path: 'crm',
        name: 'crm-entry',
        beforeEnter: (to, from, next) => {
          // rimbalza al router intermedio che smista in base al ruolo
          next({ name: 'crm-router' })
        }
      },

      // Router intermedio per smistare il CRM
      { path: 'dashboard/crm-router', name: 'crm-router', component: () => import('pages/dashboard/CrmRouter.vue') },

      // Dashboard views
      {
        path: 'dashboard/main',
        name: 'dashboard-main',
        component: () => import('pages/dashboard/SharedView.vue'),
        meta: { roles: ['staff', 'manager', 'owner', 'dev', 'hr'] }
      },
      {
        path: 'dashboard/dev',
        name: 'dashboard-dev',
        component: () => import('pages/dashboard/DevView.vue'),
        meta: { roles: ['dev'] }
      },
      {
        path: 'dashboard/manager',
        name: 'dashboard-manager',
        component: () => import('pages/dashboard/ManagerView.vue'),
        meta: { roles: ['manager', 'owner', 'dev'] }
      },
      {
        path: 'dashboard/staff',
        name: 'dashboard-staff',
        component: () => import('pages/dashboard/StaffView.vue'),
        meta: {
          roles: ['staff'],
          requiredPermissions: ['view_orders', 'edit_own_orders']
        }
      },
      {
        path: 'dashboard/owner',
        name: 'dashboard-owner',
        component: () => import('pages/dashboard/OwnerView.vue'),
        meta: { roles: ['owner', 'dev'] }
      },
      {
        path: 'dashboard/hr',
        name: 'dashboard-hr',
        component: () => import('pages/dashboard/HrView.vue'),
        meta: { roles: ['hr', 'dev'] }
      },
      {
        path: 'dashboard/supervisor',
        name: 'dashboard-supervisor',
        component: () => import('pages/dashboard/SupervisorView.vue'),
        meta: { roles: ['supervisor', 'manager', 'owner', 'dev'] }
      },
    ]
  },

  // 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  }
]

export default routes
