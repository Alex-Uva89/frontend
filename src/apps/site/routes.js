// Accesso ristretto: owner, supervisor, dev
const SITE_ALLOWED_ROLES = ['owner', 'supervisor', 'dev']

export const siteRoutes = [
  {
    path: '',
    name: 'site.index',
    component: () => import('./pages/IndexSite.vue'),
    meta: { roles: SITE_ALLOWED_ROLES }
  },
  // placeholder per le prossime sezioni — già protette
  {
    path: 'pages',
    name: 'site.pages',
    component: () => import('./pages/PagesSite.vue'),
    meta: { roles: SITE_ALLOWED_ROLES }
  },
  {
    path: 'menu',
    name: 'site.menu',
    component: () => import('./pages/MenuSite.vue'),
    meta: { roles: SITE_ALLOWED_ROLES }
  },
  {
    path: 'media',
    name: 'site.media',
    component: () => import('./pages/MediaSite.vue'),
    meta: { roles: SITE_ALLOWED_ROLES }
  },
  {
    path: 'settings',
    name: 'site.settings',
    component: () => import('./pages/SettingsSite.vue'),
    meta: { roles: SITE_ALLOWED_ROLES }
  },
]
