const routes = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/auth/register',
    component: () => import('src/layouts/LogLayout.vue'),
    children: [{ path: '', component: () => import('pages/auth/RegisterPage.vue') }],
  },
  {
    path: '/dashboard/DevView',
    component: () => import('src/layouts/LogLayout.vue'),
    children: [{ path: '', component: () => import('pages/dashboard/DevView.vue') }],
  },
  {
    path: '/dashboard/OwnerView',
    component: () => import('src/layouts/LogLayout.vue'),
    children: [{ path: '', component: () => import('pages/dashboard/OwnerView.vue') }],
  },
  {
    path: '/dashboard/StaffView',
    component: () => import('src/layouts/LogLayout.vue'),
    children: [{ path: '', component: () => import('pages/dashboard/StaffView.vue') }],
  },
  // e così via per OwnerView e StaffView

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
