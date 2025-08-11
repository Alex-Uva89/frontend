<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      <q-toolbar>
          <q-toolbar-title>{{ company.name }}</q-toolbar-title>



        <q-btn dense flat :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" @click="toggleDarkMode" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useCompanyStore } from 'src/stores/companyStore';
import { onMounted, computed } from 'vue'
// import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
// import { useUsersStore } from 'src/stores/usersStore'

const companyStore = useCompanyStore()

const company = computed(() => companyStore.company)
// const usersStore = useUsersStore()


const $q = useQuasar()
// const router = useRouter()

// Toggle tema dark/light
function toggleDarkMode() {
  $q.dark.toggle()
}

// Classe per le card in base al tema

onMounted(async () => {
  await companyStore.fetchCompany()
})
</script>
