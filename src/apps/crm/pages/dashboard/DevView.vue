<template>
    <q-page>
      <q-page padding>
        <!-- Statistiche base (visitatori, errori, sessioni) -->
        <div class="row q-mb-md">
          <q-card class="col" bordered>
            <q-card-section>
              <div class="text-h6">Visitatori oggi</div>
              <div class="text-subtitle1 text-green">+134</div>
            </q-card-section>
          </q-card>
          <q-card class="col" bordered>
            <q-card-section>
              <div class="text-h6">Errori 500</div>
              <div class="text-subtitle1 text-red">2</div>
            </q-card-section>
          </q-card>
          <q-card class="col" bordered>
            <q-card-section>
              <div class="text-h6">Media sessioni</div>
              <div class="text-subtitle1">3min 22s</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Tools rapidi (come da te) -->
        <q-card class="q-mt-md q-mb-xl">
          <q-card-section>
            <div class="text-h6 q-mb-md">Strumenti rapidi</div>
            <div class="row q-gutter-sm">
              <q-btn icon="analytics" label="Analizza traffico" flat color="info" />
              <q-btn icon="sync" label="Flush Cache" flat color="warning" />
              <q-btn icon="article" label="Genera Sitemap" flat color="secondary" />
              <q-btn icon="download" label="Esporta dati" flat color="teal" />
            </div>
          </q-card-section>
        </q-card>

        <!-- NUOVA SEZIONE: Gestione utenti per ruolo -->
        <q-card class="q-mb-xl">
          <q-card-section>
            <div class="text-h6 q-mb-md">Gestione utenti</div>
            <q-tabs
              v-model="selectedRole"
              dense
              class="text-teal"
              active-color="teal"
              indicator-color="teal"
            >
              <q-tab v-for="r in roles" :key="r" :name="r" :label="r" />
            </q-tabs>

            <q-separator spaced />

            <q-list bordered separator>
              <q-item v-for="u in usersByRole(selectedRole)" :key="u.id">
                <q-item-section avatar>
                  <q-avatar size="80px">
                    <img
                      :src="u.photoUrl"
                      alt="avatar"
                      style="object-fit: cover; object-position: center; width: 100%; height: 100%;"
                    />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ u.firstName }} {{ u.lastName }}</q-item-label>
                  <q-item-label caption>{{ u.email }}</q-item-label>
                </q-item-section>
                <q-item-section side class="row items-center q-gutter-sm">
                  <q-chip :color="u.isActive ? 'green' : 'grey'" text-color="white" dense>
                    {{ u.isActive ? 'Attivo' : 'Inattivo' }}
                  </q-chip>
                  <q-btn dense flat icon="edit" color="teal" @click="editUser(u)" />
                </q-item-section>
              </q-item>
              <q-item v-if="usersByRole(selectedRole).length === 0">
                <q-item-section class="text-grey">Nessun utente per questo ruolo</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- NUOVA SEZIONE: Monitoraggio applicazione -->
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Monitoraggio applicazione</div>

            <div class="row q-col-gutter-md">
              <q-card class="col" bordered>
                <q-card-section>
                  <div class="text-subtitle2">Errori ultimi 7 giorni</div>
                  <div class="text-h5 text-negative">{{ errorCountLast7Days }}</div>
                </q-card-section>
              </q-card>

              <q-card class="col" bordered>
                <q-card-section>
                  <div class="text-subtitle2">Tempo medio risposta</div>
                  <div class="text-h5">{{ avgResponseTime }} ms</div>
                </q-card-section>
              </q-card>

              <q-card class="col" bordered>
                <q-card-section>
                  <div class="text-subtitle2">Crash ultimi 30 giorni</div>
                  <div class="text-h5 text-negative">{{ crashCountLast30Days }}</div>
                </q-card-section>
              </q-card>
            </div>

            <q-separator spaced />

            <div class="text-subtitle2 q-mt-md">Eventi critici recenti</div>
            <q-list bordered separator class="q-mt-sm" style="max-height: 200px; overflow-y: auto;">
              <q-item v-for="event in recentCriticalEvents" :key="event.id">
                <q-item-section>
                  <q-item-label>{{ event.message }}</q-item-label>
                  <!-- <q-item-label caption>{{ event.date | formatDate }}</q-item-label> -->
                </q-item-section>
              </q-item>
              <q-item v-if="recentCriticalEvents.length === 0">
                <q-item-section class="text-grey">Nessun evento critico</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

      </q-page>
    </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'

// stato e store utenti
const usersStore = useUsersStore()
// const user = computed(() => usersStore.currentUser)
const users = computed(() => usersStore.users)

const roles = ['Owner', 'Supervisor', 'Manager', 'Staff', 'Dev']
const selectedRole = ref(roles[0])

function usersByRole(role) {
  return users.value.filter(u => u.role === role)
}

// dati simulati per monitoraggio
const errorCountLast7Days = ref(5)
const avgResponseTime = ref(250)
const crashCountLast30Days = ref(1)

const recentCriticalEvents = ref([
  { id: 1, message: 'Server crash al 12 Agosto', date: new Date(2025, 7, 12) },
  { id: 2, message: 'Timeout API pagamento', date: new Date(2025, 7, 10) }
])

function editUser(user) {
  // azione da implementare (ad esempio apri modal modifica)
  alert(`Modifica utente: ${user.firstName} ${user.lastName}`)
}

// filtro data esempio per format (da implementare filtro globale)
// function formatDate(date) {
//   return new Date(date).toLocaleString()
// }
</script>
