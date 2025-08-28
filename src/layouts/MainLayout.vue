<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-teal text-white'">
      <q-toolbar>
          <q-toolbar-title>{{ company?.name || 'Dashboard' }}</q-toolbar-title>
        <q-btn dense flat :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" @click="toggleDarkMode" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import { useCompanyStore } from 'src/stores/companyStore'

const $q = useQuasar()

const companyStore = useCompanyStore()
const { company } = storeToRefs(companyStore)

function toggleDarkMode () {
  $q.dark.toggle()
}

onMounted(async () => {
  await companyStore.fetchCompany()
})

// solo debug
watch(company, v => console.log('COMPANY', v), { immediate: true })
</script>


