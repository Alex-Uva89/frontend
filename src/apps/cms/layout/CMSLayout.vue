<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER -->
    <q-header elevated class="header-gradient text-white">
      <q-toolbar>

        <!-- Toggle drawer: solo mobile -->
        <q-btn
          v-if="$q.screen.lt.md"
          dense flat round icon="menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
          class="q-mr-sm"
        />

        <q-toolbar-title class="flex items-center">
          CMS
        </q-toolbar-title>

        <q-space />

        <q-btn
          dense flat round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="toggleDarkMode"
        />
        <q-btn dense flat round icon="logout" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <!-- DRAWER: mobile overlay, desktop fisso -->
    <q-drawer
      v-model="leftDrawerOpen"
      :behavior="$q.screen.lt.md ? 'mobile' : 'desktop'"
      :elevated="$q.screen.lt.md"
      :width="252"
      bordered
      class="drawer-surface"
    >
      <!-- User compact -->
      <div class="q-pa-md flex items-center user-chip">
        <q-avatar size="36px" class="q-mr-sm">
          <img :src="avatarUrl" alt="user" v-if="avatarUrl">
          <q-icon name="person" v-else />
        </q-avatar>
        <div class="ellipsis">
          <div class="text-body2 text-weight-medium">
            {{ userName || 'Utente' }}
          </div>
          <div class="text-caption text-grey-6 ellipsis">
            {{ userRole || '—' }}
          </div>
        </div>
      </div>

      <q-separator />

      <!-- Nav -->
      <q-list padding>
        <q-item-label header class="text-grey-7">Navigazione</q-item-label>

        <q-item
          v-for="link in links"
          :key="link.name"
          clickable
          v-ripple
          :to="link.to"
          exact
          :active="isActive(link.to)"
          active-class="active-link"
          class="nav-item"
        >
          <div class="active-indicator" />
          <q-item-section avatar><q-icon :name="link.icon" /></q-item-section>
          <q-item-section>{{ link.label }}</q-item-section>
        </q-item>
      </q-list>

      <div class="q-mt-auto q-pa-md text-caption text-grey-6">
        v{{ appVersion }}
      </div>
    </q-drawer>

    <!-- CONTENUTO -->
    <q-page-container class="page-surface">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUsersStore } from 'src/stores/usersStore'
import { useCompanyStore } from 'src/stores/companyStore'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const usersStore = useUsersStore()
const companyStore = useCompanyStore()

// drawer: chiuso su mobile, aperto su desktop
const leftDrawerOpen = ref(!$q.screen.lt.md)
watch(() => $q.screen.lt.md, (isMobile) => {
  leftDrawerOpen.value = !isMobile
})

const links = [
  { name: 'cms.index',      label: 'Home',            icon: 'home',        to: { name: 'cms.index' } },
  { name: 'cms.categories', label: 'Categorie',       icon: 'category',    to: { name: 'cms.categories' } },
  { name: 'cms.products',   label: 'Prodotti',        icon: 'inventory_2', to: { name: 'cms.products' } },
  { name: 'cms.attributes',   label: 'Attributi',        icon: 'label', to: { name: 'cms.attributes' } },
  { name: 'cms.profile',    label: 'Profilo utente',  icon: 'face',        to: { name: 'cms.profile' } },
]

function isActive(to) {
  return router.resolve(to).path === route.path
}

function toggleDarkMode() { $q.dark.toggle() }
function handleLogout() { usersStore.logout(router) }

const userName = computed(() => {
  const u = usersStore.currentUser
  return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : ''
})
const userRole = computed(() => {
  const r = usersStore.currentUser?.role
  return r ? String(r).toUpperCase() : ''
})
const avatarUrl = computed(() => usersStore.currentUser?.avatarUrl || '')

const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'

onMounted(async () => {
  await companyStore.fetchCompany()
})
</script>

<style scoped>
/* Header con sfumatura */
.header-gradient {
  background: linear-gradient(90deg, var(--q-primary) 0%, #6a5acd 100%);
}

/* Superfici */
.page-surface {
  background:
    radial-gradient(1200px 600px at 100% -50%, rgba(106, 90, 205, 0.08), transparent 60%),
    radial-gradient(900px 500px at -20% 120%, rgba(0, 150, 136, 0.08), transparent 60%);
}
.drawer-surface {
  backdrop-filter: saturate(115%) blur(2px);
}

/* Chip utente */
.user-chip { border-radius: 12px; }

/* Voci menu */
.nav-item {
  position: relative;
  border-radius: 12px;
  transition: background-color .18s ease, color .18s ease, transform .18s ease;
}
.nav-item:hover { background: rgba(0,0,0, .04); }
.body--dark .nav-item:hover { background: rgba(255,255,255, .06); }

/* Indicatore attivo */
.active-indicator {
  position: absolute;
  left: 6px;
  top: 10px;
  bottom: 10px;
  width: 4px;
  border-radius: 4px;
  background: transparent;
  transition: background .18s ease;
}
.active-link .active-indicator { background: var(--q-primary); }
.active-link { color: var(--q-primary); font-weight: 600; }
</style>
