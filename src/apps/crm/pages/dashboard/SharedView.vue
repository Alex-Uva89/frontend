<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Dashboard Condivisa</div>

    <q-card class="my-card">
      <q-card-section>
        <div class="text-h6">Benvenuto, {{ userFullName }}</div>
        <div class="text-subtitle2">Ruolo: {{ currentUserRole }}</div>
      </q-card-section>

      <q-separator />

      <q-card-actions vertical>
        <q-btn
          v-if="hasPermission('view_stats')"
          label="Statistiche Generali"
          color="teal"
          class="q-mt-sm"
          @click="navigateToStats"
        />
        <q-btn
          v-if="hasPermission('view_profile')"
          label="Il Mio Profilo"
          color="secondary"
          class="q-mt-sm"
          @click="navigateToProfile"
        />
      </q-card-actions>
    </q-card>

    <!-- Sezione comune a tutti i ruoli -->
    <div class="q-mt-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6">Notifiche Recenti</div>
          <q-list separator>
            <q-item v-for="(notification, index) in notifications" :key="index">
              <q-item-section>
                <q-item-label>{{ notification.title }}</q-item-label>
                <q-item-label caption>{{ notification.message }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from 'stores/usersStore'

const router = useRouter()
const usersStore = useUsersStore()

// Dati utente
const currentUser = computed(() => usersStore.currentUser)
const userFullName = computed(() =>
  `${currentUser.value?.firstName || ''} ${currentUser.value?.lastName || ''}`.trim() || 'Utente'
)
const currentUserRole = computed(() => currentUser.value?.role || 'guest')

// Notifiche di esempio
const notifications = [
  { title: 'Benvenuto', message: 'Accesso effettuato con successo' },
  { title: 'Sistema aggiornato', message: 'Versione 2.0.0 disponibile' }
]

// Controllo permessi
const hasPermission = (permission) => {
  return usersStore.currentUser?.permissions?.includes(permission) || false
}

// Navigazione
const navigateToStats = () => {
  router.push('/dashboard/stats')
}

const navigateToProfile = () => {
  router.push('/profile')
}
</script>

<style scoped>
.my-card {
  max-width: 500px;
  margin: 0 auto;
}
</style>
