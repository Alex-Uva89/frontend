export const bizRoutes = [
  { path: '', redirect: { name: 'biz.dashboard' } },

  { path: 'dashboard', name: 'biz.dashboard',
    component: () => import('./pages/BizDashboardPage.vue') },

  { path: 'locali', name: 'biz.prenotazioni',
    component: () => import('./pages/BusinessPrenotation.vue') },

]
