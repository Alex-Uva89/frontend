<template>
  <q-layout view="lHh Lpr lFf" container style="height: 100vh">

    <!-- Main content -->
    <q-page-container>
      <q-page padding>

        <!-- Profilo (come da te) -->
        <q-card class="q-mb-md" v-if="user">
          <q-card-section class="row items-center">
            <q-avatar size="120px" class="q-mr-md overflow-hidden">
              <img
                :src="user.photoUrl"
                alt="Avatar"
                style="object-fit: cover; object-position: center; width: 100%; height: 100%;"
              />
            </q-avatar>
            <div>
              <div class="text-h6">{{ user.firstName }} {{ user.lastName }}</div>
              <div class="text-subtitle2 text-grey">Ruolo: {{ user.role }}</div>
              <div class="text-caption">Email: {{ user.email }}</div>
            </div>
            <q-space />
            <q-btn label="Modifica profilo" flat color="primary" />
          </q-card-section>
        </q-card>

        <!-- NUOVA SEZIONE: Gestione utenti per ruolo -->
        <q-card class="q-mb-xl">
          <q-card-section>
            <div class="text-h6 q-mb-md">Gestione utenti</div>
            <q-tabs
              v-model="selectedRole"
              dense
              class="text-primary"
              active-color="primary"
              indicator-color="primary"
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
                  <q-btn dense flat icon="edit" color="primary" @click="editUser(u)" />
                </q-item-section>
              </q-item>
              <q-item v-if="usersByRole(selectedRole).length === 0">
                <q-item-section class="text-grey">Nessun utente per questo ruolo</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>


      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'

// stato e store utenti
const usersStore = useUsersStore()
const user = computed(() => usersStore.currentUser)
const users = computed(() => usersStore.users)

const roles = ['Owner', 'Supervisor', 'Manager', 'Staff', 'Dev']
const selectedRole = ref(roles[0])

function usersByRole(role) {
  return users.value.filter(u => u.role === role)
}


function editUser(user) {
  // azione da implementare (ad esempio apri modal modifica)
  alert(`Modifica utente: ${user.firstName} ${user.lastName}`)
}

</script>
