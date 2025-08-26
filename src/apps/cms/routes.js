// src/apps/cms/routes.js
export const cmsRoutes = [
  {
    path: '',
    name: 'cms.index',
    component: () => import('./pages/IndexCms.vue')
  },
  {
    path: 'categories',
    name: 'cms.categories',
    component: () => import('./pages/CategoriesCms.vue')
  },
  {
    path: 'products',
    name: 'cms.products',
    component: () => import('./pages/ProductsCms.vue')
  },
  {
    path: 'profile',
    name: 'cms.profile',
    component: () => import('./pages/AccountCms.vue')
  },
  {
    path: 'attributes',
    name: 'cms.attributes',
    component: () => import('./pages/AttributeCms.vue')
  }
]
