<template>
  <div>
    Pagina staff
    <q-btn
  label="Logout"
  color="negative"
  icon="logout"
  @click="handleLogout"
/>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUsersStore } from 'src/stores/usersStore'

const router = useRouter()
const usersStore = useUsersStore()

function handleLogout() {
  usersStore.logout(router)
}
</script>
