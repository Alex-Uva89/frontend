// src/apps/crm/routes.js

export const crmRoutes = [
  // ✅ Home generica del CRM (fallback per chi non ha match)
  {
    path: 'main',
    name: 'crm.main',
    component: () => import('src/apps/crm/pages/dashboard/SharedView.vue'),
    meta: {
      roles: ['staff', 'manager', 'owner', 'dev', 'hr', 'supervisor']
    }
  },

  // ✅ Vista DEV
  {
    path: 'dev',
    name: 'crm.dev',
    component: () => import('src/apps/crm/pages/dashboard/DevView.vue'),
    meta: { roles: ['dev'] }
  },

  // ✅ Vista MANAGER
  {
    path: 'manager',
    name: 'crm.manager',
    component: () => import('src/apps/crm/pages/dashboard/ManagerView.vue'),
    meta: { roles: ['manager', 'owner', 'dev'] }
  },

  // ✅ Vista STAFF
  {
    path: 'staff',
    name: 'crm.staff',
    component: () => import('src/apps/crm/pages/dashboard/StaffView.vue'),
    meta: {
      roles: ['staff'],
      requiredPermissions: ['view_orders', 'edit_own_orders']
    }
  },

  // ✅ Vista OWNER
  {
    path: 'owner',
    name: 'crm.owner',
    component: () => import('src/apps/crm/pages/dashboard/OwnerView.vue'),
    meta: { roles: ['owner', 'dev'] }
  },

  // ✅ Vista HR
  {
    path: 'hr',
    name: 'crm.hr',
    component: () => import('src/apps/crm/pages/dashboard/HrView.vue'),
    meta: { roles: ['hr', 'dev'] }
  },

  // ✅ Vista SUPERVISOR
  {
    path: 'supervisor',
    name: 'crm.supervisor',
    component: () => import('src/apps/crm/pages/dashboard/SupervisorView.vue'),
    meta: { roles: ['supervisor', 'manager', 'owner', 'dev'] }
  },
]
