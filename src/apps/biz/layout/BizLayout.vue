<template>
  <q-layout view="lHh Lpr lFf" class="biz-layout minimal">
    <!-- HEADER: only the top bar with app/menu -->
    <q-header elevated class="header-grad text-white">
      <q-toolbar class="q-px-md q-gutter-x-sm">
        <!-- App switcher -->
        <q-btn flat dense round icon="apps" aria-label="Cambia app">
          <q-menu class="q-pa-sm" anchor="bottom left" self="top left">
            <q-list style="min-width: 220px">
              <q-item-label header>App</q-item-label>
              <q-item clickable v-close-popup :to="{ name: 'hub' }" exact>
                <q-item-section avatar><q-icon name="home" /></q-item-section>
                <q-item-section>Hub</q-item-section>
              </q-item>
              <q-item clickable v-close-popup :to="{ path: '/biz/dashboard' }" active-class="text-primary">
                <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
                <q-item-section><strong>BIZ</strong> – Dashboard</q-item-section>
                <q-item-section side><q-icon name="chevron_right" /></q-item-section>
              </q-item>
              <q-item clickable v-close-popup :to="{ path: '/biz/locali' }" active-class="text-primary">
                <q-item-section avatar><q-icon name="event" /></q-item-section>
                <q-item-section><strong>BIZ</strong> – Prenotazioni</q-item-section>
                <q-item-section side><q-icon name="chevron_right" /></q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!-- Title -->
        <q-toolbar-title class="q-ma-none">Prenotazioni</q-toolbar-title>

        <q-space />

        <!-- Theme toggle -->
        <q-btn flat dense round :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" :title="$q.dark.isActive ? 'Tema chiaro' : 'Tema scuro'" @click="toggleDark" />

        <!-- Notifications -->
        <q-btn flat dense round icon="notifications" aria-label="Notifiche">
          <q-badge v-if="notifications.length" color="negative" floating transparent :label="notifications.length" />
          <q-menu anchor="bottom right" self="top right" class="q-pa-sm">
            <q-list style="min-width: 320px">
              <q-item-label header>Notifiche</q-item-label>
              <q-item v-if="!notifications.length">
                <q-item-section>Nessuna notifica</q-item-section>
              </q-item>
              <q-item v-for="n in notifications" :key="n.id" clickable v-close-popup @click="go(n.link)">
                <q-item-section avatar><q-icon :name="n.icon || 'notifications'" /></q-item-section>
                <q-item-section>
                  <q-item-label>{{ n.title }}</q-item-label>
                  <q-item-label caption>{{ n.caption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="n.color || 'primary'" :label="n.tag || 'NEW'" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!-- User menu -->
        <q-btn flat dense round>
          <q-avatar size="48px" class="avatar"><img :src="user.photoUrl" alt="" /></q-avatar>
          <q-menu :offset="[0, 8]">
            <q-list style="min-width: 220px; ">
              <q-item-label header>{{ user.name }}</q-item-label>
              <q-separator />
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Esci</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- CONTENT -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useUsersStore } from 'src/stores/usersStore'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

onMounted(async () => {
  try { await usersStore.fetchCurrentUser() } catch (e) { console.log('utente non caricato', e) }
})

const usersStore = useUsersStore()
const user = computed(() => {
  const u = usersStore.currentUser
  const name = (u && (u.name || [u.firstName, u.lastName].filter(Boolean).join(' '))) || 'Utente'
  const photo = (u && (u.photoUrl || u.photo || u.avatar)) || 'https://cdn.quasar.dev/img/avatar.png'
  return { name, photoUrl: photo }
})
const notifications = ref([])

function toggleDark () { $q.dark.set(!$q.dark.isActive) }
function go (to) { router.push(to) }
function logout () { usersStore.logout(router) }
</script>

<style scoped>
.minimal .header-grad {
  background: radial-gradient(1200px 400px at 10% -20%, rgba(255,255,255,0.18), transparent),
              linear-gradient(90deg, var(--q-primary) 0%, #7c4dff 50%, #00bcd4 100%);
}
.minimal .q-toolbar{min-height:64px}

/* Avatar sempre centrato e non “storpiato” */
.avatar { overflow: hidden; } /* assicura il crop nel cerchio */
.avatar img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;         /* riempie senza deformare */
  object-position: center;   /* centra il soggetto */
}

</style>
