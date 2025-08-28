<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-teal text-white'">
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="arrow_back"
          @click="goToHub"
          v-if="user"
        />
        <q-toolbar-title>
          {{ user ? user.role + ' Dashboard' : 'Dashboard' }}
        </q-toolbar-title>

        <q-space />

        <q-btn dense flat :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" @click="toggleDarkMode" />
        <q-btn dense flat icon="logout" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <UserProfileCard :user="user" :businesses="businessStore.businesses"/>
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
import { useBusinessStore } from 'src/stores/businessStore'

import UserProfileCard from 'src/components/common/userProfileCard.vue'

const router = useRouter()
const $q = useQuasar()
const usersStore = useUsersStore()
const companyStore = useCompanyStore()
const businessStore = useBusinessStore()

const user = computed(() => usersStore.currentUser)

function toggleDarkMode() {
  $q.dark.toggle()
}

function handleLogout() {
  usersStore.logout(router)
}

function goToHub() {
  router.push('/hub')
}

onMounted(async () => {
  await companyStore.fetchCompany()
})
</script>
