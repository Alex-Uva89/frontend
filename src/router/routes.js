const routes = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/auth/register',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/auth/RegisterPage.vue') }],
  },
  {
    path: '/dashboard',
    component: () => import('layouts/LogLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'main',  // Rimosso lo slash iniziale
        component: () => import('pages/dashboard/SharedView.vue'),
        meta: { roles: ['Staff', 'manager', 'owner', 'dev', 'hr'] }
      },
      {
        path: 'dev',  // Rimosso lo slash iniziale
        component: () => import('pages/dashboard/DevView.vue'),
        meta: { roles: ['dev'] }
      },
      {
        path: 'manager',  // Rimosso lo slash iniziale
        component: () => import('pages/dashboard/ManagerView.vue'),
        meta: { roles: ['manager', 'owner', 'dev'] }
      },
      {
        path: 'staff',  // Rimosso lo slash iniziale
        component: () => import('pages/dashboard/StaffView.vue'),
        meta: {
          roles: ['staff'],
          requiredPermissions: ['view_orders', 'edit_own_orders']
        }
      },
      {
        path: 'owner',  // Rimosso lo slash iniziale
        component: () => import('pages/dashboard/OwnerView.vue'),
        meta: { roles: ['owner', 'dev'] }
      },
      {
        path: 'hr',  // Rimosso lo slash iniziale
        component: () => import('pages/dashboard/HrView.vue'),
        meta: { roles: ['hr', 'dev'] }
      },
      {
        path: 'supervisor',  // Rimosso lo slash iniziale
        component: () => import('pages/dashboard/SupervisorView.vue'),
        meta: { roles: ['supervisor', 'manager', 'owner', 'dev'] }
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  }
]

export default routes
