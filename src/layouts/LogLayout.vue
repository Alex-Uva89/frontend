<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      <q-toolbar>
          <q-toolbar-title>
            {{ user ? user.role + ' Dashboard' : 'Dashboard' }}
          </q-toolbar-title>


        <q-btn dense flat :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" @click="toggleDarkMode" />
        <q-btn dense flat icon="logout" @click="handleLogout" />

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUsersStore } from 'src/stores/usersStore'
import { useCompanyStore } from 'src/stores/companyStore'

const router = useRouter()
const $q = useQuasar()
const usersStore = useUsersStore()
const companyStore = useCompanyStore()

// Assumendo che currentUser sia il dato corretto
const user = computed(() => usersStore.currentUser)

// Toggle dark mode
function toggleDarkMode() {
  $q.dark.toggle()
}

// Logout
function handleLogout() {
  usersStore.logout(router)
}

onMounted(async () => {
  await companyStore.fetchCompany()
})
</script>
