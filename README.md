# Progetto Hub (Quasar + Vue 3)

## Stack
- **Vue 3**, **Quasar Framework**, **Pinia** (store), **Vue Router**, **vue-i18n**
- HTTP via `axios` (boot), utility in `src/utils/api.js`
- Stili: `src/css/app.scss` + override `quasar.variables.scss`

## Struttura cartelle (principale)


frontend/
└─ src/
├─ apps/
│ ├─ cms/
│ │ ├─ layout/CMSLayout.vue
│ │ └─ pages/{AccountCms.vue, AttributeCms.vue, CategoriesCms.vue, IndexCms.vue, ProductsCms.vue}
│ │ └─ routes.js
│ ├─ crm/
│ │ ├─ layout/CRMLayout.vue
│ │ └─ pages/dashboard/{CrmRouter.vue, DevView.vue, HrView.vue, ManagerView.vue, OwnerView.vue, SharedView.vue, StaffView.vue, SupervisorView.vue}
│ │ └─ routes.js
│ └─ site/ ← (nuova app)
│ ├─ layout/SiteLayout.vue
│ ├─ pages/{IndexSite.vue, PagesSite.vue, MenuSite.vue, MediaSite.vue, SettingsSite.vue}
│ └─ routes.js
│
├─ boot/{auth-fetch.js, auth.js, axios.js, i18n.js, sse.js}
├─ components/
│ ├─ common/
│ ├─ pickers/
│ └─ print/
│ └─ EssentialLink.vue
├─ composables/{useFormatters.js, useOrderActions.js, useOrderTool.js}
├─ css/{app.scss, fonts.css, quasar.variables.scss}
├─ i18n/ (risorse di localizzazione)
├─ layouts/{LogLayout.vue, MainLayout.vue, ProtectedLayout.vue}
├─ pages/{HubPage.vue, ErrorNotFound.vue}
├─ router/{index.js, routes.js}
├─ stores/
│ ├─ appSettingStore.js
│ ├─ appsStore.js
│ ├─ businessStore.js
│ ├─ categoryStore.js
│ ├─ companyStore.js
│ ├─ iconStore.js
│ ├─ orderStore.js
│ ├─ referenceStore.js
│ ├─ supplierStore.js
│ ├─ timeStore.js
│ ├─ usersStore.js
│ └─ warehouseStore.js
├─ utils/{api.js, i18n.js}
├─ App.vue
└─ index.html


## Routing
- **Public**: `/` → `MainLayout` → `pages/auth/LoginPage.vue`
- **Protetto** (requiresAuth):
  - `/hub` → `LogLayout` → `pages/HubPage.vue`
  - `/crm` → `CRMLayout` + `crmRoutes`  
    - redirect iniziale in base al `role` dallo store `usersStore`
  - `/cms` → `CMSLayout` + `cmsRoutes`
  - `/site` → `SiteLayout` + `siteRoutes`  ← **nuova app**

## App: Site (CMS contenuti)
Rotte:
- `/site` (dashboard)
- `/site/pages`
- `/site/menu`
- `/site/media`
- `/site/settings`

> Meta comune: `requiresAuth: true, app: 'site'`.  
> Layout dedicato con sidebar e link ai moduli.

## Sviluppo
- Installazione: `npm i`
- Avvio:
  - Con Quasar CLI: `quasar dev`
  - Oppure tramite script `npm run dev` (se presente in `package.json`)
- Build produzione:
  - `quasar build` (o `npm run build` se definito)
- Configurazioni: `quasar.config.js`, variabili in `.env`

## Autenticazione & Guardie
- Boot `auth.js`/`auth-fetch.js` + guardia globale in `router/index.js` che rispetta `meta.requiresAuth`.
- CRM applica `beforeEnter` per redirect al dashboard corretto per ruolo; Site può usare redirect a `site.main`.

## i18n
- Inizializzato in `boot/i18n.js`; stringhe locali in `src/i18n/`.
- I moduli del Site possono sfruttare le stesse chiavi/namespace.

## Store
- Pinia in `src/stores/*`.  
- Per il Site è possibile aggiungere `siteStore.js` se servono stato e azioni dedicate (es. cache media, menù, pagine).

