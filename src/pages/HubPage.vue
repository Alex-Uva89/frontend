<template>
  <q-page class="q-pa-md">

    <!-- Header con saluto -->
    <div class="q-mb-md">
      <div class="text-h5">Ciao {{ greetingName }}</div>
      <div class="text-subtitle2 text-grey-7">Seleziona un’app</div>
    </div>

    <!-- Barra di ricerca -->
    <div class="q-mb-md">
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        placeholder="Cerca app..."
        debounce="200"
        @clear="search = ''"
      >
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Stato: caricamento -->
    <div v-if="appsStore.loading" class="row q-col-gutter-md">
      <div v-for="n in 6" :key="n" class="col-6 col-md-4 col-lg-3">
        <q-card class="q-pa-md">
          <q-skeleton type="rect" height="120px" class="q-mb-sm" />
          <q-skeleton type="text" width="60%" />
          <q-skeleton type="text" width="90%" />
        </q-card>
      </div>
    </div>

    <!-- Stato: errore -->
    <q-banner
      v-else-if="appsStore.error"
      class="q-mb-md"
      type="negative"
      dense
    >
      {{ appsStore.error }}
      <template #action>
        <q-btn flat color="white" label="Riprova" @click="reload" />
      </template>
    </q-banner>

    <!-- Stato: nessun risultato per la ricerca -->
    <q-banner
      v-else-if="filteredApps.length === 0 && hasAnyApp"
      class="q-mb-md"
      type="warning"
      dense
    >
      Nessun risultato per “{{ search }}”.
    </q-banner>

    <!-- Stato: nessuna app presente -->
    <q-banner
      v-else-if="!hasAnyApp"
      class="q-mb-md"
      type="warning"
      dense
    >
      Nessuna app disponibile per il tuo profilo. Contatta l’amministratore.
    </q-banner>

    <!-- Griglia app -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="app in filteredApps"
        :key="app._id"
        class="col-6 col-md-4 col-lg-3"
      >
        <q-card
          class="relative-position"
          flat
          bordered
          @click="handleOpen(app)"
        >
          <!-- Badge overlay: sempre visibile -->
          <div class="absolute-top-right q-ma-sm z-top">
            <q-badge
              v-if="app.badge"
              :color="badgeColor(app.badge)"
              align="middle"
            >
              {{ app.badge }}
            </q-badge>
          </div>

          <!-- Logo / Icona -->
          <div class="q-pa-md flex flex-center">
            <q-img
              v-if="app.hasLogo"
              :src="app.logoUrl"
              :alt="app.title"
              width="80px"
              height="80px"
              fit="contain"
              class="rounded-borders"
            />
            <q-icon
              v-else
              :name="app.iconToUse || 'apps'"
              size="56px"
              class="text-grey-7"
            />
          </div>

          <!-- Titolo + descrizione -->
          <q-card-section class="q-pt-none">
            <div class="text-subtitle1 ellipsis">{{ app.title }}</div>
            <div class="text-caption text-grey-7">
              {{ truncated(app.shortDescription, 90) }}
            </div>
          </q-card-section>

          <!-- Overlay lock se disabilitata -->
          <div
            v-if="app.disabled"
            class="absolute-full bg-grey-2 text-grey-8 flex flex-center column"
          >
            <q-icon name="lock" size="48px" class="q-mb-sm" />
            <div class="text-caption">{{ app.title }}</div>
          </div>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppsStore } from 'src/stores/appsStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore' // 🔹 Aggiunta

const router = useRouter()
const appsStore = useAppsStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore() // 🔹 Aggiunta

const search = ref('')

// 🔹 Aggiunta: inizializza il business corrente dal currentUser e sessionStorage
onMounted(async () => {
  const fallbackBizId = usersStore.currentUser?.business?._id || null
  businessStore.initFromStorage(fallbackBizId)
  await businessStore.fetchBusinesses()
  appsStore.fetchApps()
})

const userCtx = computed(() => ({
  role: usersStore.currentUser?.role || '',
  email: usersStore.currentUser?.email || '',
  id: usersStore.currentUser?._id || usersStore.currentUser?.id || '',
  businessId: usersStore.currentUser?.business?._id || '',
  locale: usersStore.locale || 'it'
}))

const appsForUser = computed(() => appsStore.availabilityForUser(userCtx.value))

const hasAnyApp = computed(() => (appsForUser.value || []).length > 0)

const filteredApps = computed(() => {
  const term = (search.value || '').trim().toLowerCase()
  const list = appsForUser.value || []
  if (!term) return list
  return list.filter(a => {
    const t = (a.title || '').toLowerCase()
    const d = (a.shortDescription || '').toLowerCase()
    return t.includes(term) || d.includes(term)
  })
})

const greetingName = computed(() => {
  const fn = usersStore.currentUser?.firstName
  const ln = usersStore.currentUser?.lastName
  const full = [fn, ln].filter(Boolean).join(' ').trim()
  return full || usersStore.currentUser?.email || 'Utente'
})

function badgeColor(badge) {
  if (badge === 'Nuovo') return 'positive'
  if (badge === 'In arrivo') return 'warning'
  if (badge === 'In aggiornamento') return 'info'
  return 'primary'
}

function handleOpen(app) {
  if (app.disabled) return

  if (app.status === 'in_aggiornamento') {
    return router.push({ name: 'app-updating', params: { slug: app.slug } })
  }

  const pathOrUrl = (app.pathOrUrl || '').trim()
  const slug = (app.slug || '').trim().toLowerCase()

  // 👉 CRM: vai direttamente alla route del ruolo
  if (slug === 'crm' || pathOrUrl.replace(/\/+$/, '') === '/crm') {
    const role = String(usersStore.currentUser?.role || '').toLowerCase()
    const nameByRole = {
      staff: 'crm.staff',
      manager: 'crm.manager',
      owner: 'crm.owner',
      dev: 'crm.dev',
      hr: 'crm.hr',
      supervisor: 'crm.supervisor'
    }
    return router.push({ name: nameByRole[role] || 'crm.main' })
  }

  // (Opzionale) CMS identico
  if (slug === 'cms' || pathOrUrl.replace(/\/+$/, '') === '/cms') {
    return router.push('/cms')
  }

  // 👉 SITE
  if (slug === 'site' || pathOrUrl.replace(/\/+$/, '') === '/site') {
    return router.push({ name: 'site.index' })
  }

  const isAbsoluteUrl = /^https?:\/\//i.test(pathOrUrl)
  if ((app.isExternal || isAbsoluteUrl) && pathOrUrl) {
    window.open(pathOrUrl, '_blank', 'noopener')
    return
  }

  if (pathOrUrl) {
    router.push(pathOrUrl)
  }
}

function reload() {
  appsStore.invalidateCache()
  appsStore.fetchApps({ force: true })
}

/** Troncamento semplice */
function truncated(text, max = 90) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}
</script>
